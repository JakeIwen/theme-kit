// palette.css is a contract with every consumer: the role tokens it defines,
// in both modes, from the four knobs and nothing else.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { defaultKnobSpecs, knobKeys } from "../dist/core/index.js";

const css = readFileSync(new URL("../palette.css", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const blocks = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({
  selector: selector.trim(),
  tokens: new Map([...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()])),
}));
const light = blocks.find(block => block.selector === ":root, .theme-probe");
const dark = blocks.find(block => block.selector === ':root[data-theme="dark"], .theme-probe[data-theme="dark"]');
const knobProperties = knobKeys.map(key => defaultKnobSpecs[key].property);
const roles = [
  "--paper", "--surface", "--surface-muted", "--surface-hover", "--surface-selected", "--hero", "--line", "--control-border",
  "--ink", "--muted", "--link", "--brand", "--primary", "--primary-hover", "--on-primary", "--accent", "--focus",
  "--selection", "--selection-ink", "--backdrop", "--panel-shadow", "--floating-shadow", "--dialog-shadow",
];
// Shadows and the focus alias are declared once; dark mode inherits them.
const lightOnly = ["--focus", "--panel-shadow", "--floating-shadow", "--dialog-shadow"];

test("the defaults block carries the kit's default knobs", () => {
  const defaults = blocks.find(block => block.selector === ":root");
  for (const key of knobKeys) assert.equal(defaults.tokens.get(defaultKnobSpecs[key].property), String(defaultKnobSpecs[key].default));
});

test("both modes define every role on :root and on the swatch probe", () => {
  assert.deepEqual([...light.tokens.keys()], roles);
  assert.deepEqual([...dark.tokens.keys()], roles.filter(role => !lightOnly.includes(role)));
  assert.match(light.selector + dark.selector, /theme-probe/);
});

test("tokens derive only from the four knobs and from roles declared beside them", () => {
  for (const block of [light, dark]) {
    for (const [name, value] of block.tokens) {
      for (const [, reference] of value.matchAll(/var\((--[\w-]+)\)/g)) {
        assert.ok(knobProperties.includes(reference) || block.tokens.has(reference), `${name} in ${block.selector} references ${reference}`);
      }
      assert.ok(/^(oklch\(|#|var\()/.test(value), `${name} in ${block.selector} is not a color: ${value}`);
    }
  }
});

test("every oklch token states a literal lightness, never one derived from a knob", () => {
  for (const block of [light, dark]) {
    for (const [name, value] of block.tokens) {
      const color = value.match(/^oklch\(([^)]*)/)?.[1];
      if (color) assert.match(color, /^\d*\.?\d+ /, `${name} in ${block.selector} has no fixed lightness: ${value}`);
    }
  }
});
