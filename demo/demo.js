import { createLocalThemeStore, knobSpecs, mountThemeEditor } from "../dist/index.js";

const specs = knobSpecs();
const builtins = [
  { id: "sage", name: "Sage", knobs: { hueNeutral: 125, hueBrand: 160, hueAccent: 75, chroma: 1 } },
  { id: "slate", name: "Slate", knobs: { hueNeutral: 250, hueBrand: 240, hueAccent: 70, chroma: 0.9 } },
  { id: "clay", name: "Clay", knobs: { hueNeutral: 75, hueBrand: 55, hueAccent: 200, chroma: 0.9 } },
];
const root = document.documentElement;
const modeListeners = new Set();
const mode = {
  options: [{ id: "light", label: "Light" }, { id: "dark", label: "Dark" }],
  get: () => (root.dataset.theme === "dark" ? "dark" : "light"),
  set(id) { root.dataset.theme = id; modeListeners.forEach(listener => listener()); },
  subscribe(listener) { modeListeners.add(listener); return () => modeListeners.delete(listener); },
};
const store = createLocalThemeStore({ specs, builtins, storageKey: "theme-kit-demo" });
const editor = mountThemeEditor({ builtins, store, mode });
document.getElementById("open-editor").addEventListener("click", () => editor.toggle());
