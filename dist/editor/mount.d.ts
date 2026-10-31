import type { ThemeAdapter } from "./adapter.js";
import { ThemeEditorElement } from "./theme-editor.js";
export declare const themeEditorTag = "theme-editor";
export declare function defineThemeEditor(): void;
/** Appends the page's one editor pane (or reuses it) with this adapter and returns it. */
export declare function mountThemeEditor(adapter: ThemeAdapter, parent?: HTMLElement): ThemeEditorElement;
