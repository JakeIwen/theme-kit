import { type KnobSpecs } from "../core/knobs.js";
import { type Theme } from "../core/themes.js";
import type { ThemeStore } from "./adapter.js";
export type LocalThemeStoreOptions = {
    specs: KnobSpecs;
    builtins: readonly Theme[];
    storageKey: string;
    root?: HTMLElement;
};
export declare function createLocalThemeStore({ specs, builtins, storageKey, root }: LocalThemeStoreOptions): ThemeStore;
