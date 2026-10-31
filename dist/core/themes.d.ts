import { type KnobSpecs, type KnobValues } from "./knobs.js";
export type Theme = {
    id: string;
    name: string;
    knobs: KnobValues;
};
/** What an app shows: the chosen theme's id and the knob values it applies. */
export type ActiveTheme = {
    id: string;
    knobs: KnobValues;
};
export declare const themeNameMaxLength = 40;
export declare function themeNameProblem(name: unknown): string | undefined;
export declare function themeIdProblem(id: unknown): string | undefined;
/** Validates a saved-theme write: the reason it is invalid, or nothing. */
export declare function themeProblem(specs: KnobSpecs, value: unknown): string | undefined;
export declare function activeThemeProblem(specs: KnobSpecs, value: unknown): string | undefined;
/** Reads one stored theme leniently, or nothing when its id or name is unusable. */
export declare function normalizeTheme(specs: KnobSpecs, value: unknown): Theme | undefined;
/** Reads a stored theme list leniently: unusable entries and repeated ids are dropped. */
export declare function normalizeThemes(specs: KnobSpecs, value: unknown): Theme[];
export declare function normalizeActiveTheme(specs: KnobSpecs, value: unknown, fallback: ActiveTheme): ActiveTheme;
/** A readable id for a new theme ("rosewood-slate"), suffixed to stay unique. */
export declare function themeIdFor(name: string, taken: Iterable<string>): string;
/** The name itself, or "Name 2", "Name 3"… when another theme already uses it. */
export declare function uniqueThemeName(name: string, taken: Iterable<string>): string;
