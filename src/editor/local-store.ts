// A ThemeStore kept in this browser's localStorage, for static pages and the
// demo. Apps with viewers keep their library on their server instead.
import { applyKnobs, type KnobSpecs, type KnobValues } from "../core/knobs.js";
import { normalizeActiveTheme, normalizeThemes, type ActiveTheme, type Theme } from "../core/themes.js";
import { isRecord } from "../core/values.js";
import type { ThemeLibrarySnapshot, ThemeStore } from "./adapter.js";

export type LocalThemeStoreOptions = {
  specs: KnobSpecs;
  builtins: readonly Theme[];
  storageKey: string;
  root?: HTMLElement;
};

export function createLocalThemeStore({ specs, builtins, storageKey, root = document.documentElement }: LocalThemeStoreOptions): ThemeStore {
  const first = builtins[0];
  if (!first) throw new Error("A theme store needs at least one built-in theme");
  const fallback: ActiveTheme = { id: first.id, knobs: { ...first.knobs } };
  const listeners = new Set<() => void>();
  let state: ThemeLibrarySnapshot = read();

  function read(): ThemeLibrarySnapshot {
    let stored: unknown = null;
    try { stored = JSON.parse(localStorage.getItem(storageKey) ?? "null"); } catch { /* Start empty. */ }
    const value = isRecord(stored) ? stored : {};
    return { themes: normalizeThemes(specs, value.themes), active: normalizeActiveTheme(specs, value.active, fallback) };
  }
  function write(next: ThemeLibrarySnapshot) {
    state = next;
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Kept for this page only. */ }
    listeners.forEach(listener => listener());
  }
  const show = (knobs: KnobValues) => applyKnobs(specs, knobs, root.style);
  show(state.active.knobs);

  return {
    snapshot: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    async saveTheme(theme) {
      const exists = state.themes.some(saved => saved.id === theme.id);
      const themes = exists ? state.themes.map(saved => (saved.id === theme.id ? theme : saved)) : [...state.themes, theme];
      write({ ...state, themes });
    },
    async deleteTheme(id) {
      write({ ...state, themes: state.themes.filter(theme => theme.id !== id) });
    },
    async activate(active) {
      show(active.knobs);
      write({ ...state, active });
    },
    preview(knobs) {
      show(knobs ?? state.active.knobs);
    },
  };
}
