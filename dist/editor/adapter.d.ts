import type { KnobSpecOverrides, KnobValues } from "../core/knobs.js";
import type { ActiveTheme, Theme } from "../core/themes.js";
export type ThemeLibrarySnapshot = {
    themes: readonly Theme[];
    active: ActiveTheme;
};
export interface ThemeStore {
    /** The saved themes and the active theme; re-read whenever subscribe's listener fires. */
    snapshot(): ThemeLibrarySnapshot;
    subscribe(listener: () => void): () => void;
    /** Creates or replaces the saved theme with this id. */
    saveTheme(theme: Theme): Promise<void>;
    deleteTheme(id: string): Promise<void>;
    /** Makes this the theme the app shows (to everyone, where the app has viewers). */
    activate(active: ActiveTheme): Promise<void>;
    /** Shows knobs on the page without saving anything; null shows the active theme again. */
    preview(knobs: KnobValues | null): void;
}
export type ThemeModeOption = {
    id: string;
    label: string;
};
/** The app's light/dark switch, shown in the pane when present. */
export interface ThemeModeControl {
    options: readonly ThemeModeOption[];
    get(): string;
    set(id: string): void;
    subscribe?(listener: () => void): () => void;
}
export interface ThemeAdapter {
    /** Pane heading; defaults to "Appearance & Theme Editor". */
    title?: string;
    /** This app's custom property names, labels or ranges for the four knobs. */
    knobs?: KnobSpecOverrides;
    /** Locked themes shipped with the app; the first is the fallback. */
    builtins: readonly Theme[];
    store: ThemeStore;
    mode?: ThemeModeControl;
}
