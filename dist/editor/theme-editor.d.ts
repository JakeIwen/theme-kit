import type { ThemeAdapter } from "./adapter.js";
export declare class ThemeEditorElement extends HTMLElement {
    #private;
    get adapter(): ThemeAdapter | undefined;
    set adapter(adapter: ThemeAdapter | undefined);
    get isOpen(): boolean;
    /** The loaded theme has changes that aren't saved. */
    get isDirty(): boolean;
    show(): void;
    /** Closes the pane, first asking to discard unsaved changes. */
    requestClose(): void;
    toggle(): void;
    disconnectedCallback(): void;
}
