// The pane's stylesheet. It has no palette of its own: apps map the --te-*
// tokens onto their own colors once (see README), and the fallbacks are system
// colors so an unmapped app still gets a readable pane in either mode.
export const editorCss = `
:host {
  --_bg: var(--te-bg, Canvas);
  --_surface: var(--te-surface, color-mix(in oklab, CanvasText 4%, Canvas));
  --_hover: var(--te-hover, color-mix(in oklab, CanvasText 8%, Canvas));
  --_selected: var(--te-selected, color-mix(in oklab, CanvasText 11%, Canvas));
  --_field: var(--te-field, var(--_bg));
  --_text: var(--te-text, CanvasText);
  --_muted: var(--te-muted, color-mix(in oklab, CanvasText 66%, Canvas));
  --_border: var(--te-border, color-mix(in oklab, CanvasText 18%, Canvas));
  --_control-border: var(--te-control-border, color-mix(in oklab, CanvasText 45%, Canvas));
  --_accent: var(--te-accent, LinkText);
  --_focus: var(--te-focus, Highlight);
  --_danger: var(--te-danger, #b3261e);
  --_shadow: var(--te-shadow, -12px 0 32px rgb(0 0 0 / 18%));
  --_radius: var(--te-radius, 8px);
}
[hidden] { display: none !important; }
* { box-sizing: border-box; }
.pane {
  position: fixed;
  inset-block: 0;
  inset-inline-end: 0;
  z-index: var(--te-z, 1000);
  display: flex;
  flex-direction: column;
  inline-size: min(680px, 100vw);
  background: var(--_bg);
  color: var(--_text);
  border-inline-start: 1px solid var(--_border);
  box-shadow: var(--_shadow);
  font-size: var(--te-font-size, 0.875rem);
  line-height: 1.45;
}
.pane-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px 10px 18px;
  border-block-end: 1px solid var(--_border);
}
h2 { margin: 0; font-size: 1rem; font-weight: 650; }
h3 { margin: 0 0 8px; font-size: 0.8125rem; font-weight: 650; color: var(--_muted); }
p { margin: 0; }
.columns {
  flex: 1;
  overflow: auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-content: start;
  gap: 20px 24px;
  padding: 16px 18px 24px;
}
.column { display: grid; align-content: start; gap: 14px; min-inline-size: 0; }
.row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.field, .inline-form { display: grid; gap: 6px; }
.field-label, .knob-label { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
label { font-weight: 600; }
input[type="text"], textarea {
  inline-size: 100%;
  min-block-size: 34px;
  padding: 6px 9px;
  border: 1px solid var(--_control-border);
  border-radius: calc(var(--_radius) - 2px);
  background: var(--_field);
  color: var(--_text);
  font: inherit;
}
textarea { resize: vertical; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.75rem; }
input[readonly] { color: var(--_muted); background: var(--_surface); }
.knobs { display: grid; gap: 12px; }
.knob { display: grid; gap: 2px; }
.knob output { font-variant-numeric: tabular-nums; color: var(--_muted); }
input[type="range"] { inline-size: 100%; margin: 0; accent-color: var(--_accent); }
.segmented {
  display: inline-flex;
  justify-self: start;
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--_control-border);
  border-radius: var(--_radius);
  background: var(--_surface);
}
.segmented button {
  min-block-size: 30px;
  padding: 4px 12px;
  border: 0;
  border-radius: calc(var(--_radius) - 3px);
  background: none;
  color: var(--_muted);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
.segmented button:hover { color: var(--_text); background: var(--_hover); }
.segmented button[aria-pressed="true"] { color: var(--_text); background: var(--_bg); box-shadow: 0 1px 3px rgb(0 0 0 / 14%); }
.button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-block-size: 32px;
  padding: 5px 10px;
  border: 1px solid var(--_control-border);
  border-radius: calc(var(--_radius) - 2px);
  background: transparent;
  color: var(--_text);
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}
.button:hover:not(:disabled) { background: var(--_hover); }
.button.primary { border-color: var(--_accent); color: var(--_accent); }
.button.danger { border-color: var(--_danger); color: var(--_danger); }
.button:disabled { opacity: 0.45; cursor: default; }
.icon-button { justify-content: center; inline-size: 32px; padding: 0; border-color: transparent; color: var(--_muted); }
.icon-button:hover:not(:disabled) { color: var(--_text); }
.danger-icon:hover:not(:disabled) { color: var(--_danger); }
:focus-visible { outline: 2px solid var(--_focus); outline-offset: 2px; }
.tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 0 7px;
  border: 1px solid var(--_border);
  border-radius: 999px;
  color: var(--_muted);
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 18px;
  white-space: nowrap;
}
.active-tag { border-color: var(--_accent); color: var(--_accent); }
.status { min-block-size: 1.45em; color: var(--_muted); }
.error { margin: 12px 18px 0; color: var(--_danger); font-weight: 600; }
.confirm {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  margin: 12px 18px 0;
  padding: 10px 12px;
  border: 1px solid var(--_control-border);
  border-radius: var(--_radius);
  background: var(--_surface);
}
.confirm p { flex: 1 1 220px; font-weight: 600; }
.theme-list { display: grid; gap: 6px; margin: 0; padding: 0; list-style: none; }
.theme-row {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px 4px 3px 3px;
  border: 1px solid var(--_border);
  border-radius: var(--_radius);
  background: var(--_surface);
}
.theme-row.active { border-color: var(--_accent); background: var(--_selected); }
.theme-pick {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  min-inline-size: 0;
  padding: 5px 6px;
  border: 0;
  border-radius: calc(var(--_radius) - 3px);
  background: none;
  color: inherit;
  font: inherit;
  text-align: start;
  cursor: pointer;
}
.theme-pick:hover { background: var(--_hover); }
.swatch { display: flex; flex: none; inline-size: 56px; block-size: 28px; overflow: hidden; border: 1px solid var(--_border); border-radius: 6px; }
.swatch span { flex: 1; }
.theme-name { flex: 1; min-inline-size: 0; overflow: hidden; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.tags { display: inline-flex; flex-wrap: wrap; justify-content: end; gap: 4px; }
@media (max-width: 640px) {
  .columns { grid-template-columns: minmax(0, 1fr); padding-inline: 16px; }
  .themes-column { order: -1; }
}
`;
