// Drives the pane through its rendered controls, the way a person would, with
// an in-memory store that records what the app would be asked to do.
import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body><button id=opener>Open</button></body></html>", { pretendToBeVisual: true });
for (const key of ["window", "document", "HTMLElement", "customElements", "getComputedStyle", "Node", "CSSStyleSheet", "Event", "KeyboardEvent"])
  globalThis[key] = dom.window[key];
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
const { mountThemeEditor } = await import("../dist/index.js");

const sage = { id: "sage", name: "Sage", knobs: { hueNeutral: 125, hueBrand: 160, hueAccent: 75, chroma: 1 } };
const slate = { id: "slate", name: "Slate", knobs: { hueNeutral: 250, hueBrand: 240, hueAccent: 70, chroma: 0.9 } };

function memoryStore(initial) {
  const listeners = new Set();
  const calls = [];
  let state = structuredClone(initial);
  const notify = () => listeners.forEach(listener => listener());
  return {
    calls,
    snapshot: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    async saveTheme(theme) {
      calls.push(["save", theme]);
      const themes = state.themes.filter(saved => saved.id !== theme.id);
      state = { ...state, themes: state.themes.some(saved => saved.id === theme.id) ? state.themes.map(saved => (saved.id === theme.id ? theme : saved)) : [...themes, theme] };
      notify();
    },
    async deleteTheme(id) { calls.push(["delete", id]); state = { ...state, themes: state.themes.filter(theme => theme.id !== id) }; notify(); },
    async activate(active) { calls.push(["activate", active.id]); state = { ...state, active }; notify(); },
    preview(knobs) { calls.push(["preview", knobs && { ...knobs }]); },
  };
}

function setup(initial = { themes: [], active: { id: "sage", knobs: sage.knobs } }, overrides = {}) {
  document.querySelector("theme-editor")?.remove();
  const store = memoryStore(initial);
  const editor = mountThemeEditor({ builtins: [sage, slate], store, knobs: { hueAccent: { property: "--hue-focus", label: "Focus hue" } }, ...overrides });
  const root = editor.shadowRoot;
  const $ = selector => root.querySelector(selector);
  const byText = (text, scope = root) => [...scope.querySelectorAll("button")].find(button => button.textContent.trim() === text);
  const rows = () => [...root.querySelectorAll(".theme-row")].map(row => row.querySelector(".theme-name").textContent + (row.classList.contains("active") ? "*" : ""));
  const slide = (key, value) => { const input = $(`#te-knob-${key}`); input.value = String(value); input.dispatchEvent(new Event("input")); };
  const settle = () => new Promise(resolve => setTimeout(resolve, 0));
  return { editor, store, $, byText, rows, slide, settle };
}

test("saved-theme swatches use the generic fallback without an app callback", async () => {
  const { swatchColors } = await import("../dist/editor/swatch.js");
  const { editor, $, store } = setup();
  editor.style.colorScheme = "dark";
  editor.show();
  const colors = [...$(".swatch").children].map(chip => chip.style.background);
  const expected = swatchColors(sage.knobs, true).map(color => {
    const chip = document.createElement("span");
    chip.style.background = color;
    return chip.style.background;
  });
  assert.deepEqual(colors, expected);
  assert.deepEqual(store.calls, []);
});

test("app swatches receive each saved theme and refresh on mode changes without store writes", () => {
  const calls = [];
  let mode = "soft", notify;
  const colors = dark => dark ? ["rgb(10, 20, 30)", "rgb(40, 50, 60)"] : ["rgb(100, 110, 120)"];
  const { editor, $, store, slide } = setup(undefined, {
    mode: { options: [], get: () => mode, set: () => {}, subscribe: listener => { notify = listener; return () => {}; } },
    swatchColors(knobs, dark) { calls.push([structuredClone(knobs), dark]); return colors(dark); },
  });
  editor.show();
  assert.deepEqual(calls.slice(-2), [[sage.knobs, false], [slate.knobs, false]]);
  assert.deepEqual([...$(".swatch").children].map(chip => chip.style.background), colors(false));
  mode = "dark";
  editor.style.colorScheme = "dark";
  notify();
  assert.deepEqual(calls.slice(-2), [[sage.knobs, true], [slate.knobs, true]]);
  assert.deepEqual([...$(".swatch").children].map(chip => chip.style.background), colors(true));
  assert.deepEqual(store.calls, []);
  const beforeSlide = calls.length;
  slide("hueBrand", 20);
  assert.ok(calls.length > beforeSlide, "slider input renders fresh swatches");
  assert.deepEqual(calls.slice(-2), [[sage.knobs, true], [slate.knobs, true]], "rows preview saved knobs, not an unsaved draft");
  assert.deepEqual(store.calls.map(([kind]) => kind), ["preview"]);
  const rosewood = { id: "rosewood-slate", name: "Rosewood Slate", knobs: { hueNeutral: 360, hueBrand: 240, hueAccent: 70, chroma: 1.15 } };
  store.saveTheme(rosewood);
  assert.deepEqual(calls.slice(-3), [[sage.knobs, true], [slate.knobs, true], [rosewood.knobs, true]]);
});

test("opens on the active theme with built-ins locked and saved themes listed", () => {
  const { editor, $, rows, byText } = setup({ themes: [{ id: "dusk", name: "Dusk", knobs: { ...slate.knobs, hueBrand: 10 } }], active: { id: "sage", knobs: sage.knobs } });
  document.getElementById("opener").focus();
  editor.show();
  assert.equal(editor.isOpen, true);
  assert.deepEqual(rows(), ["Sage*", "Slate", "Dusk"]);
  assert.equal($("#te-name").value, "Sage");
  assert.equal($("#te-name").readOnly, true);
  assert.equal($("label[for=te-knob-hueAccent]").textContent, "Focus hue");
  assert.equal(byText("Save").disabled, true);
  assert.equal($(".theme-row.active .theme-pick").getAttribute("aria-current"), "true");
  assert.equal($('[aria-label="Delete Sage"]'), null, "built-ins can't be deleted");
  assert.ok($('[aria-label="Delete Dusk"]'));
});

test("slider edits preview live, and closing asks before discarding them", async () => {
  const { editor, store, $, byText, slide } = setup();
  document.getElementById("opener").focus();
  editor.show();
  slide("hueBrand", 20);
  assert.deepEqual(store.calls.at(-1), ["preview", { ...sage.knobs, hueBrand: 20 }]);
  assert.equal($(".status").textContent, "Unsaved changes");
  assert.equal(byText("Save").disabled, true, "a built-in can only be saved as new");
  editor.requestClose();
  assert.equal($(".confirm").hidden, false);
  assert.equal($("#te-confirm-text").textContent, "Discard unsaved changes to Sage?");
  byText("Keep editing").click();
  assert.equal(editor.isOpen, true);
  assert.equal($("#te-knob-hueBrand").value, "20");
  editor.requestClose();
  byText("Discard").click();
  assert.equal(editor.isOpen, false);
  assert.deepEqual(store.calls.at(-1), ["preview", null]);
  assert.equal(document.activeElement.id, "opener", "focus returns to what opened the pane");
});

test("Save as new stores the edited knobs under a readable id and activates them", async () => {
  const { editor, store, $, byText, rows, slide, settle } = setup({ themes: [], active: { id: "slate", knobs: slate.knobs } });
  editor.show();
  slide("hueNeutral", 360);
  slide("chroma", 1.15);
  byText("Save as new").click();
  assert.equal($("#te-save-as-name").value, "Slate copy");
  $("#te-save-as-name").value = "Rosewood Slate";
  $(".inline-form").dispatchEvent(new Event("submit", { cancelable: true }));
  await settle();
  const knobs = { hueNeutral: 360, hueBrand: 240, hueAccent: 70, chroma: 1.15 };
  assert.deepEqual(store.calls.filter(([kind]) => kind !== "preview"), [["save", { id: "rosewood-slate", name: "Rosewood Slate", knobs }], ["activate", "rosewood-slate"]]);
  assert.deepEqual(rows(), ["Sage", "Slate", "Rosewood Slate*"]);
  assert.equal($("#te-name").readOnly, false);
  assert.equal($(".status").textContent, "Saved Rosewood Slate");
});

test("a saved theme can be renamed and edited in place", async () => {
  const dusk = { id: "dusk", name: "Dusk", knobs: { ...slate.knobs, hueBrand: 10 } };
  const { editor, store, $, byText, slide, settle } = setup({ themes: [dusk], active: { id: "dusk", knobs: dusk.knobs } });
  editor.show();
  $("#te-name").value = "Dusk rose";
  $("#te-name").dispatchEvent(new Event("input"));
  slide("hueBrand", 5);
  byText("Save").click();
  await settle();
  assert.deepEqual(store.calls.find(([kind]) => kind === "save"), ["save", { id: "dusk", name: "Dusk rose", knobs: { ...dusk.knobs, hueBrand: 5 } }]);
  assert.equal(editor.isDirty, false);
});

test("deleting the active theme asks first, then falls back to the first built-in", async () => {
  const dusk = { id: "dusk", name: "Dusk", knobs: { ...slate.knobs, hueBrand: 10 } };
  const { editor, store, $, byText, rows, settle } = setup({ themes: [dusk], active: { id: "dusk", knobs: dusk.knobs } });
  editor.show();
  $('[aria-label="Delete Dusk"]').click();
  assert.equal($("#te-confirm-text").textContent, "Delete Dusk?");
  byText("Delete").click();
  await settle();
  assert.deepEqual(store.calls.filter(([kind]) => kind !== "preview"), [["delete", "dusk"], ["activate", "sage"]]);
  assert.deepEqual(rows(), ["Sage*", "Slate"]);
});

test("picking another theme with unsaved changes asks first", async () => {
  const { editor, store, $, byText, rows, slide, settle } = setup();
  editor.show();
  slide("hueBrand", 20);
  $('[data-id="slate"][data-action="pick"]').click();
  assert.equal($(".confirm").hidden, false);
  byText("Discard").click();
  await settle();
  assert.deepEqual(store.calls.filter(([kind]) => kind === "activate"), [["activate", "slate"]]);
  assert.deepEqual(rows(), ["Sage", "Slate*"]);
  assert.equal($("#te-knob-hueBrand").value, "240");
});

test("a pasted theme code loads as a new unsaved theme", async () => {
  const { editor, store, $, byText, settle } = setup();
  editor.show();
  byText("Paste theme").click();
  $("#te-paste").value = '{"theme-kit":1,"name":"Slate","knobs":{"hueNeutral":360,"hueBrand":240,"hueAccent":70,"chroma":1.15}}';
  $("#te-paste").closest("form").dispatchEvent(new Event("submit", { cancelable: true }));
  assert.equal($("#te-name").value, "Slate 2", "a pasted name that's taken gets a suffix");
  assert.equal(byText("Save").disabled, false);
  byText("Save").click();
  await settle();
  assert.equal(store.calls.find(([kind]) => kind === "save")[1].id, "slate-2");
  $("#te-paste").value = "nonsense";
  byText("Paste theme").click();
  $("#te-paste").closest("form").dispatchEvent(new Event("submit", { cancelable: true }));
  assert.equal($(".error").textContent, "That isn't a theme code");
});

test("Copy theme falls back to a selectable code when the clipboard is unavailable", async () => {
  const { editor, $, byText, settle } = setup();
  editor.show();
  byText("Copy theme").click();
  await settle();
  assert.equal($("#te-copy").closest(".inline-form").hidden, false);
  assert.deepEqual(JSON.parse($("#te-copy").value), { "theme-kit": 1, name: "Sage", knobs: sage.knobs });
});

test("active knobs from older slider adjustments open as an unsaved theme", () => {
  const { editor, $, byText } = setup({ themes: [], active: { id: "slate", knobs: { ...slate.knobs, hueNeutral: 360 } } });
  editor.show();
  assert.equal($("#te-name").value, "Slate adjusted");
  assert.equal(byText("Save").disabled, false);
  assert.equal($(".status").textContent, "Unsaved changes");
});

test("Escape closes a clean pane and dismisses an open prompt first", () => {
  const { editor, $, slide } = setup();
  editor.show();
  const escape = () => $(".pane").dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  slide("chroma", 0.5);
  editor.requestClose();
  escape();
  assert.equal($(".confirm").hidden, true);
  assert.equal(editor.isOpen, true);
  slide("chroma", 1);
  escape();
  assert.equal(editor.isOpen, false);
});

test("a store change elsewhere replaces a clean draft but never an edited one", () => {
  const { editor, store, $, slide } = setup();
  editor.show();
  store.activate({ id: "slate", knobs: slate.knobs });
  assert.equal($("#te-name").value, "Slate");
  slide("chroma", 0.5);
  store.activate({ id: "sage", knobs: sage.knobs });
  assert.equal($("#te-knob-chroma").value, "0.5");
});
