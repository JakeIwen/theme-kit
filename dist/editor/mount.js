import { ThemeEditorElement } from "./theme-editor.js";
export const themeEditorTag = "theme-editor";
export function defineThemeEditor() {
    if (!customElements.get(themeEditorTag))
        customElements.define(themeEditorTag, ThemeEditorElement);
}
/** Appends the page's one editor pane (or reuses it) with this adapter and returns it. */
export function mountThemeEditor(adapter, parent = document.body) {
    defineThemeEditor();
    let editor = parent.querySelector(themeEditorTag);
    if (!editor) {
        editor = document.createElement(themeEditorTag);
        parent.append(editor);
    }
    editor.adapter = adapter;
    return editor;
}
