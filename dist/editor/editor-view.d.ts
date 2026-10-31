import { type KnobKey, type KnobSpecs } from "../core/knobs.js";
import type { Theme } from "../core/themes.js";
import type { ThemeModeOption } from "./adapter.js";
type Child = Node | string | null | undefined | false;
type Props = Record<string, string | number | boolean | undefined | EventListener>;
export declare function h<K extends keyof HTMLElementTagNameMap>(tag: K, props?: Props, ...children: Child[]): HTMLElementTagNameMap[K];
export type EditorHandlers = {
    close(): void;
    confirmYes(): void;
    confirmNo(): void;
    name(value: string): void;
    mode(id: string): void;
    knob(key: KnobKey, value: number): void;
    save(): void;
    saveAsNew(): void;
    revert(): void;
    saveAsSubmit(name: string): void;
    copy(): void;
    paste(): void;
    pasteSubmit(text: string): void;
    closePanel(): void;
    keydown(event: KeyboardEvent): void;
};
export type KnobControl = {
    input: HTMLInputElement;
    output: HTMLOutputElement;
};
export type EditorView = ReturnType<typeof buildEditorView>;
export declare function buildEditorView(title: string, specs: KnobSpecs, modeOptions: readonly ThemeModeOption[], handlers: EditorHandlers): {
    pane: HTMLElement;
    close: HTMLButtonElement;
    confirm: HTMLDivElement;
    confirmText: HTMLParagraphElement;
    confirmYes: HTMLButtonElement;
    confirmNo: HTMLButtonElement;
    error: HTMLParagraphElement;
    status: HTMLParagraphElement;
    name: HTMLInputElement;
    builtinTag: HTMLSpanElement;
    mode: HTMLDivElement;
    modeButtons: Map<string, HTMLButtonElement>;
    knobs: Map<"hueNeutral" | "hueBrand" | "hueAccent" | "chroma", KnobControl>;
    save: HTMLButtonElement;
    saveAsNew: HTMLButtonElement;
    revert: HTMLButtonElement;
    copy: HTMLButtonElement;
    paste: HTMLButtonElement;
    saveAsName: HTMLInputElement;
    saveAs: HTMLFormElement;
    pasteText: HTMLTextAreaElement;
    pasteForm: HTMLFormElement;
    copyText: HTMLTextAreaElement;
    copyFallback: HTMLDivElement;
    list: HTMLUListElement;
};
export type ThemeRow = {
    theme: Theme;
    active: boolean;
    builtin: boolean;
    colors: string[];
};
export type ThemeRowHandlers = {
    pick(id: string): void;
    duplicate(id: string): void;
    remove(id: string): void;
};
/** Replaces the list, keeping keyboard focus on the same row control. */
export declare function renderThemeList(list: HTMLUListElement, rows: ThemeRow[], handlers: ThemeRowHandlers): void;
export {};
