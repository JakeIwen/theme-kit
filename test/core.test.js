import assert from "node:assert/strict";
import test from "node:test";
import {
  clampKnob, decodeThemeCode, defaultKnobSpecs, draftFromActive, encodeThemeCode, isDirty, knobSpecs, knobsProblem,
  nameProblem, normalizeKnobs, normalizeThemes, themeIdFor, themeProblem, uniqueThemeName,
} from "../dist/core/index.js";

const specs = knobSpecs({ hueAccent: { property: "--hue-focus", label: "Focus hue" } });
const slate = { id: "slate", name: "Slate", knobs: { hueNeutral: 250, hueBrand: 240, hueAccent: 70, chroma: 0.9 } };
const sage = { id: "sage", name: "Sage", knobs: { hueNeutral: 125, hueBrand: 160, hueAccent: 75, chroma: 1 } };

test("app overrides keep the canonical keys and replace only what they name", () => {
  assert.equal(specs.hueAccent.property, "--hue-focus");
  assert.equal(specs.hueAccent.max, 360);
  assert.equal(specs.chroma.property, defaultKnobSpecs.chroma.property);
});

test("knobs clamp to range and snap to the slider step without float noise", () => {
  assert.equal(clampKnob(specs.chroma, 1.1500000001), 1.15);
  assert.equal(clampKnob(specs.chroma, 7), 2);
  assert.equal(clampKnob(specs.hueBrand, -4), 0);
  assert.deepEqual(normalizeKnobs(specs, { hueBrand: 400, extra: 1, chroma: "x" }), { hueNeutral: 125, hueBrand: 360, hueAccent: 75, chroma: 1 });
});

test("strict validation names the first problem", () => {
  assert.equal(knobsProblem(specs, slate.knobs), undefined);
  assert.match(knobsProblem(specs, { ...slate.knobs, glow: 1 }), /Unknown knob glow/);
  assert.match(knobsProblem(specs, { ...slate.knobs, chroma: 3 }), /chroma must be a number from 0 to 2/);
  assert.match(themeProblem(specs, { ...slate, id: "Bad Id" }), /Theme id/);
  assert.match(themeProblem(specs, { ...slate, name: "  " }), /name is required/);
  assert.equal(themeProblem(specs, slate), undefined);
});

test("stored theme lists drop unusable entries and repeated ids", () => {
  assert.deepEqual(normalizeThemes(specs, [slate, { id: "slate", name: "Again", knobs: {} }, { id: "", name: "x" }, "junk"]), [slate]);
  assert.deepEqual(normalizeThemes(specs, "junk"), []);
});

test("new ids and names stay readable and unique", () => {
  assert.equal(themeIdFor("Rosewood Slate", ["slate"]), "rosewood-slate");
  assert.equal(themeIdFor("Slate", ["slate", "slate-2"]), "slate-3");
  assert.equal(themeIdFor("!!!", []), "theme");
  assert.equal(uniqueThemeName("Slate", ["slate", "Slate 2"]), "Slate 3");
});

test("theme codes round-trip and reject what they can't read", () => {
  const code = encodeThemeCode({ name: "Rosewood Slate", knobs: slate.knobs });
  assert.deepEqual(decodeThemeCode(specs, `  ${code}\n`), { ok: true, theme: { name: "Rosewood Slate", knobs: slate.knobs } });
  const partial = decodeThemeCode(specs, '{"theme-kit":1,"knobs":{"hueBrand":20,"glow":3}}');
  assert.deepEqual(partial, { ok: true, theme: { name: "Imported theme", knobs: { hueNeutral: 125, hueBrand: 20, hueAccent: 75, chroma: 1 } } });
  assert.equal(decodeThemeCode(specs, "not json").ok, false);
  assert.equal(decodeThemeCode(specs, '{"knobs":{}}').ok, false);
  assert.match(decodeThemeCode(specs, '{"theme-kit":2,"knobs":{}}').error, /newer theme editor/);
});

test("active knobs that match no theme load as an unsaved theme", () => {
  const lib = { builtins: [sage, slate], themes: [], active: { id: "slate", knobs: { ...slate.knobs, hueNeutral: 360 } } };
  const draft = draftFromActive(lib);
  assert.deepEqual(draft, { baseId: null, name: "Slate adjusted", knobs: lib.active.knobs });
  assert.equal(isDirty(lib, draft), true);
  const clean = draftFromActive({ ...lib, active: { id: "slate", knobs: slate.knobs } });
  assert.equal(clean.baseId, "slate");
  assert.equal(isDirty(lib, clean), false);
});

test("names must be unique across built-in and saved themes, ignoring case", () => {
  const lib = { builtins: [sage, slate], themes: [], active: { id: "sage", knobs: sage.knobs } };
  assert.match(nameProblem(lib, "slate", null), /A theme named Slate already exists/);
  assert.equal(nameProblem(lib, "Slate", "slate"), undefined);
  assert.match(nameProblem(lib, "", null), /required/);
});
