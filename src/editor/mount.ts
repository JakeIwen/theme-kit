import type { ThemeAdapter } from "./adapter.js";
import { ThemeEditorElement } from "./theme-editor.js";

export const themeEditorTag = "theme-editor";

export function defineThemeEditor() {
  if (!customElements.get(themeEditorTag)) customElements.define(themeEditorTag, ThemeEditorElement);
}

/** Appends the page's one editor pane (or reuses it) with this adapter and returns it. */
export function mountThemeEditor(adapter: ThemeAdapter, parent: HTMLElement = document.body): ThemeEditorElement {
  defineThemeEditor();
  let editor = parent.querySelector<ThemeEditorElement>(themeEditorTag);
  if (!editor) {
    editor = document.createElement(themeEditorTag) as ThemeEditorElement;
    parent.append(editor);
  }
  editor.adapter = adapter;
  return editor;
}
