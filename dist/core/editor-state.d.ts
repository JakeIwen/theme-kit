import { type KnobValues } from "./knobs.js";
import { type ActiveTheme, type Theme } from "./themes.js";
export type Library = {
    /** Locked themes from the app's adapter; the first is the fallback. */
    builtins: readonly Theme[];
    /** Saved themes from the app's store. */
    themes: readonly Theme[];
    active: ActiveTheme;
};
/** The theme being edited. baseId is the saved theme it started from, or null
 * for one not saved yet (pasted, or active knobs that match no theme). */
export type Draft = {
    baseId: string | null;
    name: string;
    knobs: KnobValues;
};
export declare const allThemes: (lib: Library) => Theme[];
export declare const findTheme: (lib: Library, id: string | null) => Theme | undefined;
export declare const isBuiltin: (lib: Library, id: string | null) => boolean;
export declare const draftFromTheme: (theme: Theme) => Draft;
/** The active theme as a draft. Active knobs that no saved theme matches (an
 * older app's slider adjustments, say) load as an unsaved theme. */
export declare function draftFromActive(lib: Library): Draft;
export declare const baseTheme: (lib: Library, draft: Draft) => Theme | undefined;
export declare function isDirty(lib: Library, draft: Draft): boolean;
/** Why this name can't be saved for the theme with ownId (null for a new theme). */
export declare function nameProblem(lib: Library, name: string, ownId: string | null): string | undefined;
/** A free name for a copy: "Slate copy", then "Slate copy 2". */
export declare const copyName: (lib: Library, name: string) => string;
export declare const freeName: (lib: Library, name: string) => string;
export declare function newTheme(lib: Library, name: string, knobs: KnobValues): Theme;
/** The theme to show when unsaved changes are discarded or the active theme is deleted. */
export declare function fallbackTheme(lib: Library, without?: string): Theme;
