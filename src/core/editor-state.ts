// Pure rules behind the editor pane: what is loaded, whether it has unsaved
// changes, and which names and ids are free. The element only wires these to DOM.
import { sameKnobs, type KnobValues } from "./knobs.js";
import {
  themeIdFor, themeNameProblem, uniqueThemeName, type ActiveTheme, type Theme,
} from "./themes.js";

export type Library = {
  /** Locked themes from the app's adapter; the first is the fallback. */
  builtins: readonly Theme[];
  /** Saved themes from the app's store. */
  themes: readonly Theme[];
  active: ActiveTheme;
};
/** The theme being edited. baseId is the saved theme it started from, or null
 * for one not saved yet (pasted, or active knobs that match no theme). */
export type Draft = { baseId: string | null; name: string; knobs: KnobValues };

export const allThemes = (lib: Library): Theme[] => [...lib.builtins, ...lib.themes];
export const findTheme = (lib: Library, id: string | null) =>
  id === null ? undefined : allThemes(lib).find(theme => theme.id === id);
export const isBuiltin = (lib: Library, id: string | null) => lib.builtins.some(theme => theme.id === id);
const names = (lib: Library) => allThemes(lib).map(theme => theme.name);

export const draftFromTheme = (theme: Theme): Draft =>
  ({ baseId: theme.id, name: theme.name, knobs: { ...theme.knobs } });

/** The active theme as a draft. Active knobs that no saved theme matches (an
 * older app's slider adjustments, say) load as an unsaved theme. */
export function draftFromActive(lib: Library): Draft {
  const theme = findTheme(lib, lib.active.id);
  if (theme && sameKnobs(theme.knobs, lib.active.knobs)) return draftFromTheme(theme);
  const name = uniqueThemeName(`${theme?.name ?? "Current"} adjusted`, names(lib));
  return { baseId: null, name, knobs: { ...lib.active.knobs } };
}

export const baseTheme = (lib: Library, draft: Draft) => findTheme(lib, draft.baseId);

export function isDirty(lib: Library, draft: Draft): boolean {
  const base = baseTheme(lib, draft);
  return !base || base.name !== draft.name || !sameKnobs(base.knobs, draft.knobs);
}

/** Why this name can't be saved for the theme with ownId (null for a new theme). */
export function nameProblem(lib: Library, name: string, ownId: string | null): string | undefined {
  const problem = themeNameProblem(name);
  if (problem) return problem;
  const wanted = name.trim().toLowerCase();
  const clash = allThemes(lib).find(theme => theme.id !== ownId && theme.name.toLowerCase() === wanted);
  return clash ? `A theme named ${clash.name} already exists` : undefined;
}

/** A free name for a copy: "Slate copy", then "Slate copy 2". */
export const copyName = (lib: Library, name: string) => uniqueThemeName(`${name} copy`, names(lib));
export const freeName = (lib: Library, name: string) => uniqueThemeName(name, names(lib));

export function newTheme(lib: Library, name: string, knobs: KnobValues): Theme {
  const trimmed = name.trim();
  return { id: themeIdFor(trimmed, allThemes(lib).map(theme => theme.id)), name: trimmed, knobs: { ...knobs } };
}

/** The theme to show when unsaved changes are discarded or the active theme is deleted. */
export function fallbackTheme(lib: Library, without?: string): Theme {
  const active = findTheme(lib, lib.active.id);
  const theme = active && active.id !== without ? active : lib.builtins[0];
  if (!theme) throw new Error("A theme editor needs at least one built-in theme");
  return theme;
}
