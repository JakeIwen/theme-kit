// Builds the pane's DOM once and hands the element references to update. The
// element owns all state; this module only creates nodes and forwards events.
import { formatKnob, knobKeys } from "../core/knobs.js";
import { icon } from "./icons.js";
export function h(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
        if (value === undefined || value === false)
            continue;
        if (typeof value === "function")
            node.addEventListener(key.replace(/^on/, ""), value);
        else if (key === "class")
            node.className = String(value);
        else
            node.setAttribute(key, value === true ? "" : String(value));
    }
    node.append(...children.filter((child) => child !== null && child !== undefined && child !== false));
    return node;
}
const button = (label, className, onclick, iconName, title) => h("button", { type: "button", class: `button ${className}`, title, onclick }, iconName ? icon(iconName) : null, label);
function knobControls(specs, handlers) {
    const controls = new Map();
    const nodes = knobKeys.map(key => {
        const spec = specs[key];
        const id = `te-knob-${key}`;
        const input = h("input", {
            id, type: "range", min: spec.min, max: spec.max, step: spec.step,
            oninput: (event) => handlers.knob(key, Number(event.target.value)),
        });
        const output = h("output", { for: id }, formatKnob(spec, spec.default));
        controls.set(key, { input, output });
        return h("div", { class: "knob" }, h("div", { class: "knob-label" }, h("label", { for: id }, spec.label), output), input);
    });
    return { controls, node: h("div", { class: "knobs" }, ...nodes) };
}
function inlineForm(label, field, submitLabel, onsubmit, oncancel) {
    return h("form", {
        class: "inline-form",
        hidden: true,
        onsubmit: (event) => { event.preventDefault(); onsubmit(); },
    }, h("label", { for: field.id }, label), field, h("div", { class: "row" }, h("button", { type: "submit", class: "button primary" }, submitLabel), button("Cancel", "secondary", oncancel)));
}
export function buildEditorView(title, specs, modeOptions, handlers) {
    const name = h("input", { id: "te-name", type: "text", maxlength: 40, autocomplete: "off", oninput: (event) => handlers.name(event.target.value) });
    const builtinTag = h("span", { class: "tag", title: "Built-in themes are locked. Use Save as new to change one." }, icon("lock", 12), "Built-in");
    const modeButtons = new Map(modeOptions.map(option => [option.id, h("button", { type: "button", "aria-pressed": "false", onclick: () => handlers.mode(option.id) }, option.label)]));
    const mode = h("div", { class: "segmented", role: "group", "aria-label": "Mode", hidden: modeOptions.length === 0 }, ...modeButtons.values());
    const knobs = knobControls(specs, handlers);
    const saveAsName = h("input", { id: "te-save-as-name", type: "text", maxlength: 40, autocomplete: "off" });
    const pasteText = h("textarea", { id: "te-paste", rows: 3, spellcheck: "false", placeholder: '{"theme-kit":1,…}' });
    const copyText = h("textarea", { id: "te-copy", rows: 3, readonly: true, onfocus: (event) => event.target.select() });
    const view = {
        pane: h("section", { class: "pane", role: "dialog", "aria-modal": "false", "aria-labelledby": "te-title", hidden: true, onkeydown: handlers.keydown }),
        close: h("button", { type: "button", class: "button icon-button", "aria-label": "Close", title: "Close", onclick: handlers.close }, icon("close")),
        confirm: h("div", { class: "confirm", role: "alertdialog", "aria-labelledby": "te-confirm-text", hidden: true }),
        confirmText: h("p", { id: "te-confirm-text" }),
        confirmYes: button("Discard", "danger", handlers.confirmYes),
        confirmNo: button("Keep editing", "secondary", handlers.confirmNo),
        error: h("p", { class: "error", role: "alert", hidden: true }),
        status: h("p", { class: "status", "aria-live": "polite" }),
        name, builtinTag, mode, modeButtons, knobs: knobs.controls,
        save: button("Save", "primary", handlers.save, "save"),
        saveAsNew: button("Save as new", "secondary", handlers.saveAsNew, "plus"),
        revert: button("Revert", "secondary", handlers.revert, "revert", "Drop unsaved changes"),
        copy: button("Copy theme", "secondary", handlers.copy, "copy", "Copy this theme as a code to paste into another app"),
        paste: button("Paste theme", "secondary", handlers.paste, "paste", "Import a theme code copied from another app"),
        saveAsName,
        saveAs: inlineForm("New theme name", saveAsName, "Create", () => handlers.saveAsSubmit(saveAsName.value), handlers.closePanel),
        pasteText,
        pasteForm: inlineForm("Theme code", pasteText, "Import", () => handlers.pasteSubmit(pasteText.value), handlers.closePanel),
        copyText,
        copyFallback: h("div", { class: "inline-form", hidden: true }, h("label", { for: "te-copy" }, "Theme code"), copyText, h("div", { class: "row" }, button("Done", "secondary", handlers.closePanel))),
        list: h("ul", { class: "theme-list", "aria-label": "Saved themes" }),
    };
    view.confirm.append(view.confirmText, h("div", { class: "row" }, view.confirmYes, view.confirmNo));
    view.pane.append(h("header", { class: "pane-head" }, h("h2", { id: "te-title" }, title), view.close), view.confirm, view.error, h("div", { class: "columns" }, h("div", { class: "column editor-column" }, h("div", { class: "field" }, h("div", { class: "field-label" }, h("label", { for: "te-name" }, "Name"), builtinTag), name), mode, knobs.node, view.status, h("div", { class: "row" }, view.save, view.saveAsNew, view.revert), view.saveAs, h("div", { class: "row" }, view.copy, view.paste), view.pasteForm, view.copyFallback), h("div", { class: "column themes-column" }, h("h3", {}, "Saved themes"), view.list)));
    return view;
}
/** Replaces the list, keeping keyboard focus on the same row control. */
export function renderThemeList(list, rows, handlers) {
    const focused = list.getRootNode().activeElement;
    const keep = focused && list.contains(focused) ? `[data-id="${focused.dataset.id}"][data-action="${focused.dataset.action}"]` : null;
    list.replaceChildren(...rows.map(({ theme, active, builtin, colors }) => {
        const swatch = h("span", { class: "swatch", "aria-hidden": "true" }, ...colors.map(color => {
            const chip = h("span");
            chip.style.background = color;
            return chip;
        }));
        const tags = h("span", { class: "tags" }, active && h("span", { class: "tag active-tag" }, "Active"), builtin && h("span", { class: "tag" }, icon("lock", 12), "Built-in"));
        return h("li", { class: `theme-row${active ? " active" : ""}` }, h("button", { type: "button", class: "theme-pick", "data-id": theme.id, "data-action": "pick", "aria-current": active ? "true" : undefined, onclick: () => handlers.pick(theme.id) }, swatch, h("span", { class: "theme-name" }, theme.name), tags), h("button", { type: "button", class: "button icon-button", "data-id": theme.id, "data-action": "duplicate", "aria-label": `Duplicate ${theme.name}`, title: "Duplicate", onclick: () => handlers.duplicate(theme.id) }, icon("copy")), builtin ? null : h("button", { type: "button", class: "button icon-button danger-icon", "data-id": theme.id, "data-action": "remove", "aria-label": `Delete ${theme.name}`, title: "Delete", onclick: () => handlers.remove(theme.id) }, icon("trash")));
    }));
    if (keep)
        list.querySelector(keep)?.focus();
}
