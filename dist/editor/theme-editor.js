// <theme-editor>: the Appearance & Theme Editor pane. A non-modal sheet on the
// right so the page stays visible and recolors live: editor controls in one
// column, saved themes in the other. All persistence goes through the adapter.
import { allThemes, baseTheme, copyName, draftFromActive, draftFromTheme, fallbackTheme, findTheme, freeName, isBuiltin, isDirty, nameProblem, newTheme, } from "../core/editor-state.js";
import { clampKnob, defaultKnobSpecs, defaultKnobs, formatKnob, knobKeys, knobSpecs, sameKnobs } from "../core/knobs.js";
import { decodeThemeCode, encodeThemeCode } from "../core/theme-code.js";
import { editorCss } from "./editor-styles.js";
import { buildEditorView, renderThemeList } from "./editor-view.js";
import { swatchColors } from "./swatch.js";
const defaultTitle = "Appearance & Theme Editor";
function adoptStyles(root) {
    // Constructed sheets need no inline-style allowance in an app's CSP.
    if ("adoptedStyleSheets" in root && typeof CSSStyleSheet === "function" && "replaceSync" in CSSStyleSheet.prototype) {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(editorCss);
        root.adoptedStyleSheets = [sheet];
    }
    else {
        const style = document.createElement("style");
        style.textContent = editorCss;
        root.append(style);
    }
}
export class ThemeEditorElement extends HTMLElement {
    #adapter;
    #specs = defaultKnobSpecs;
    #lib = { builtins: [], themes: [], active: { id: "", knobs: defaultKnobs(defaultKnobSpecs) } };
    #draft = { baseId: null, name: "", knobs: defaultKnobs(defaultKnobSpecs) };
    #view;
    #confirm = null;
    #panel = null;
    #busy = false;
    #error = "";
    #status = "";
    #opener = null;
    #unsubscribe = [];
    get adapter() { return this.#adapter; }
    set adapter(adapter) {
        this.#unsubscribe.forEach(stop => stop());
        this.#unsubscribe = [];
        this.#adapter = adapter;
        if (!adapter)
            return;
        this.#specs = knobSpecs(adapter.knobs);
        this.#build(adapter);
        this.#unsubscribe.push(adapter.store.subscribe(() => this.#sync()));
        if (adapter.mode?.subscribe)
            this.#unsubscribe.push(adapter.mode.subscribe(() => this.#render()));
        this.#lib = this.#readLibrary();
        this.#draft = draftFromActive(this.#lib);
        this.#render();
    }
    get isOpen() { return Boolean(this.#view && !this.#view.pane.hidden); }
    /** The loaded theme has changes that aren't saved. */
    get isDirty() { return isDirty(this.#lib, this.#draft); }
    show() {
        const view = this.#view;
        if (!view || this.isOpen)
            return;
        this.#opener = deepActiveElement();
        this.#lib = this.#readLibrary();
        this.#draft = draftFromActive(this.#lib);
        this.#reset();
        view.pane.hidden = false;
        this.#render();
        const active = view.list.querySelector('[aria-current="true"]');
        (active ?? view.close).focus();
    }
    /** Closes the pane, first asking to discard unsaved changes. */
    requestClose() {
        if (this.isOpen)
            this.#guard(() => { this.#restoreActive(); this.#hide(); });
    }
    toggle() {
        if (this.isOpen)
            this.requestClose();
        else
            this.show();
    }
    disconnectedCallback() {
        this.#adapter?.store.preview(null);
    }
    #build(adapter) {
        const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
        root.replaceChildren();
        if (!this.shadowRoot?.adoptedStyleSheets?.length)
            adoptStyles(root);
        this.#view = buildEditorView(adapter.title ?? defaultTitle, this.#specs, adapter.mode?.options ?? [], this.#handlers());
        root.append(this.#view.pane);
    }
    #handlers() {
        return {
            close: () => this.requestClose(),
            confirmYes: () => { const confirm = this.#confirm; this.#confirm = null; confirm?.run(); this.#render(); },
            confirmNo: () => { this.#confirm = null; this.#render(); this.#view?.name.focus(); },
            name: value => { this.#draft = { ...this.#draft, name: value }; this.#status = ""; this.#render(); },
            mode: id => { this.#adapter?.mode?.set(id); this.#render(); },
            knob: (key, value) => this.#setKnob(key, value),
            save: () => this.#save(),
            saveAsNew: () => this.#openSaveAs(),
            revert: () => this.#revert(),
            saveAsSubmit: name => this.#saveAs(name),
            copy: () => void this.#copy(),
            paste: () => this.#openPanel("paste"),
            pasteSubmit: text => this.#import(text),
            closePanel: () => this.#openPanel(null),
            keydown: event => this.#keydown(event),
        };
    }
    #readLibrary() {
        const adapter = this.#adapter;
        if (!adapter)
            return this.#lib;
        const { themes, active } = adapter.store.snapshot();
        return { builtins: adapter.builtins, themes, active };
    }
    /** A store change: follow it unless this pane holds unsaved or in-flight work. */
    #sync() {
        const clean = !this.#busy && !isDirty(this.#lib, this.#draft);
        this.#lib = this.#readLibrary();
        if (clean)
            this.#draft = draftFromActive(this.#lib);
        this.#render();
    }
    #reset() {
        this.#confirm = null;
        this.#panel = null;
        this.#error = "";
        this.#status = "";
    }
    #hide() {
        const view = this.#view;
        if (!view)
            return;
        view.pane.hidden = true;
        this.#reset();
        if (this.#opener?.isConnected)
            this.#opener.focus();
        this.#opener = null;
    }
    #guard(run) {
        if (!this.isDirty)
            return run();
        this.#confirm = { message: `Discard unsaved changes to ${this.#draft.name.trim() || "this theme"}?`, confirmLabel: "Discard", run };
        this.#render();
        this.#view?.confirmNo.focus();
    }
    #preview() {
        const knobs = this.#draft.knobs;
        this.#adapter?.store.preview(sameKnobs(knobs, this.#lib.active.knobs) ? null : knobs);
    }
    /** Shows the active theme again, or a saved one when the active knobs match none. */
    #restoreActive() {
        const active = findTheme(this.#lib, this.#lib.active.id);
        if (active && sameKnobs(active.knobs, this.#lib.active.knobs)) {
            this.#draft = draftFromTheme(active);
            this.#adapter?.store.preview(null);
        }
        else {
            void this.#activate(fallbackTheme(this.#lib));
        }
    }
    #setKnob(key, value) {
        if (!Number.isFinite(value))
            return;
        this.#draft = { ...this.#draft, knobs: { ...this.#draft.knobs, [key]: clampKnob(this.#specs[key], value) } };
        this.#status = "";
        this.#preview();
        this.#render();
    }
    /** Runs one store call at a time; a failure shows its message and keeps the draft. */
    async #task(work) {
        if (this.#busy)
            return;
        this.#busy = true;
        this.#error = "";
        this.#render();
        try {
            await work();
        }
        catch (error) {
            this.#error = error instanceof Error ? error.message : String(error);
        }
        finally {
            this.#busy = false;
            this.#lib = this.#readLibrary();
            this.#render();
        }
    }
    #activate(theme, status = "") {
        if (this.#busy)
            return Promise.resolve();
        this.#draft = draftFromTheme(theme);
        this.#adapter?.store.preview(theme.knobs);
        return this.#task(async () => {
            try {
                await this.#adapter?.store.activate({ id: theme.id, knobs: { ...theme.knobs } });
                this.#status = status;
            }
            catch (error) {
                this.#lib = this.#readLibrary();
                this.#draft = draftFromActive(this.#lib);
                throw error;
            }
            finally {
                this.#adapter?.store.preview(null);
            }
        });
    }
    /** Saves a theme and makes it the active one. */
    #store(theme, status) {
        return this.#task(async () => {
            const store = this.#adapter?.store;
            if (!store)
                return;
            await store.saveTheme(theme);
            await store.activate({ id: theme.id, knobs: { ...theme.knobs } });
            store.preview(null);
            this.#lib = this.#readLibrary();
            this.#draft = draftFromTheme(theme);
            this.#panel = null;
            this.#status = status;
        });
    }
    #save() {
        const base = baseTheme(this.#lib, this.#draft);
        if (base && isBuiltin(this.#lib, base.id))
            return;
        const problem = nameProblem(this.#lib, this.#draft.name, base?.id ?? null);
        if (problem) {
            this.#error = problem;
            this.#render();
            return;
        }
        const theme = base
            ? { id: base.id, name: this.#draft.name.trim(), knobs: { ...this.#draft.knobs } }
            : newTheme(this.#lib, this.#draft.name, this.#draft.knobs);
        void this.#store(theme, `Saved ${theme.name}`);
    }
    #openSaveAs() {
        const name = this.#draft.name.trim();
        this.#openPanel("save-as");
        const view = this.#view;
        if (!view)
            return;
        view.saveAsName.value = nameProblem(this.#lib, name, null) ? copyName(this.#lib, name || "Theme") : name;
        view.saveAsName.select();
    }
    #saveAs(name) {
        const problem = nameProblem(this.#lib, name, null);
        if (problem) {
            this.#error = problem;
            this.#render();
            return;
        }
        const theme = newTheme(this.#lib, name, this.#draft.knobs);
        void this.#store(theme, `Saved ${theme.name}`);
    }
    #revert() {
        const base = baseTheme(this.#lib, this.#draft);
        this.#status = "";
        if (!base)
            this.#restoreActive();
        else if (base.id === this.#lib.active.id && sameKnobs(base.knobs, this.#lib.active.knobs)) {
            this.#draft = draftFromTheme(base);
            this.#adapter?.store.preview(null);
        }
        else
            void this.#activate(base);
        this.#render();
    }
    #pick(id) {
        const theme = findTheme(this.#lib, id);
        if (!theme || (id === this.#draft.baseId && !this.isDirty && id === this.#lib.active.id))
            return;
        this.#guard(() => void this.#activate(theme));
    }
    #duplicate(id) {
        const source = findTheme(this.#lib, id);
        if (!source)
            return;
        this.#guard(() => {
            const copy = newTheme(this.#lib, copyName(this.#lib, source.name), source.knobs);
            void this.#store(copy, `Duplicated ${source.name}`).then(() => this.#view?.name.select());
        });
    }
    #remove(id) {
        const theme = findTheme(this.#lib, id);
        if (!theme || isBuiltin(this.#lib, id))
            return;
        this.#confirm = { message: `Delete ${theme.name}?`, confirmLabel: "Delete", run: () => void this.#delete(theme) };
        this.#render();
        this.#view?.confirmNo.focus();
    }
    #delete(theme) {
        const wasActive = this.#lib.active.id === theme.id;
        return this.#task(async () => {
            const store = this.#adapter?.store;
            if (!store)
                return;
            await store.deleteTheme(theme.id);
            this.#lib = this.#readLibrary();
            if (wasActive) {
                const fallback = fallbackTheme(this.#lib, theme.id);
                this.#draft = draftFromTheme(fallback);
                await store.activate({ id: fallback.id, knobs: { ...fallback.knobs } });
                store.preview(null);
            }
            this.#status = `Deleted ${theme.name}`;
        });
    }
    async #copy() {
        const code = encodeThemeCode({ name: this.#draft.name.trim() || "Theme", knobs: this.#draft.knobs });
        try {
            await navigator.clipboard.writeText(code);
            this.#panel = null;
            this.#status = "Theme code copied";
        }
        catch {
            this.#panel = "copy";
            if (this.#view)
                this.#view.copyText.value = code;
        }
        this.#render();
        if (this.#panel === "copy")
            this.#view?.copyText.select();
    }
    #import(text) {
        const decoded = decodeThemeCode(this.#specs, text);
        if (!decoded.ok) {
            this.#error = decoded.error;
            this.#render();
            return;
        }
        this.#guard(() => {
            this.#draft = { baseId: null, name: freeName(this.#lib, decoded.theme.name), knobs: decoded.theme.knobs };
            this.#panel = null;
            this.#error = "";
            this.#status = "Imported. Save to keep it.";
            if (this.#view)
                this.#view.pasteText.value = "";
            this.#preview();
            this.#render();
            this.#view?.name.focus();
        });
    }
    #openPanel(panel) {
        this.#panel = panel;
        this.#error = "";
        this.#render();
        if (panel === "paste")
            this.#view?.pasteText.focus();
    }
    #keydown(event) {
        if (event.key !== "Escape")
            return;
        event.preventDefault();
        event.stopPropagation();
        if (this.#confirm) {
            this.#confirm = null;
            this.#render();
        }
        else if (this.#panel)
            this.#openPanel(null);
        else
            this.requestClose();
    }
    #render() {
        const view = this.#view;
        if (!view)
            return;
        const lib = this.#lib;
        const draft = this.#draft;
        const builtin = isBuiltin(lib, draft.baseId);
        const dirty = isDirty(lib, draft);
        if (view.name.value !== draft.name)
            view.name.value = draft.name;
        view.name.readOnly = builtin;
        view.builtinTag.hidden = !builtin;
        for (const key of knobKeys) {
            const control = view.knobs.get(key);
            if (!control)
                continue;
            control.input.value = String(draft.knobs[key]);
            control.output.textContent = formatKnob(this.#specs[key], draft.knobs[key]);
        }
        const mode = this.#adapter?.mode?.get();
        for (const [id, button] of view.modeButtons)
            button.setAttribute("aria-pressed", String(id === mode));
        this.#renderActions(view, builtin, dirty);
        this.#renderThemes(view);
    }
    #renderActions(view, builtin, dirty) {
        const busy = this.#busy;
        view.save.disabled = busy || builtin || !dirty;
        view.save.title = builtin ? "Built-in themes are locked. Use Save as new." : "Save changes to this theme";
        view.saveAsNew.disabled = busy;
        view.revert.disabled = busy || !dirty;
        view.copy.disabled = busy;
        view.paste.disabled = busy;
        view.saveAs.hidden = this.#panel !== "save-as";
        view.pasteForm.hidden = this.#panel !== "paste";
        view.copyFallback.hidden = this.#panel !== "copy";
        view.confirm.hidden = !this.#confirm;
        view.confirmText.textContent = this.#confirm?.message ?? "";
        view.confirmYes.textContent = this.#confirm?.confirmLabel ?? "Discard";
        view.error.hidden = !this.#error;
        view.error.textContent = this.#error;
        view.status.textContent = busy ? "Saving…" : this.#status || (dirty ? "Unsaved changes" : "");
    }
    #renderThemes(view) {
        const lib = this.#lib;
        const dark = (getComputedStyle(this).colorScheme ?? "").includes("dark");
        renderThemeList(view.list, allThemes(lib).map(theme => ({
            theme,
            active: theme.id === lib.active.id,
            builtin: isBuiltin(lib, theme.id),
            colors: this.#adapter?.swatchColors?.(theme.knobs, dark) ?? swatchColors(theme.knobs, dark),
        })), {
            pick: id => this.#pick(id),
            duplicate: id => this.#duplicate(id),
            remove: id => this.#remove(id),
        });
    }
}
function deepActiveElement() {
    let active = document.activeElement;
    while (active?.shadowRoot?.activeElement)
        active = active.shadowRoot.activeElement;
    return active instanceof HTMLElement ? active : null;
}
