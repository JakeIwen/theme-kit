// paletteSwatchColors reads the role tokens off a hidden probe carrying the
// candidate knobs, and leaves nothing behind.
import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
for (const key of ["window", "document", "HTMLElement", "Node"]) globalThis[key] = dom.window[key];
const seen = [];
globalThis.getComputedStyle = element => {
  seen.push({ probe: element.parentElement, token: element.style.backgroundColor });
  return { backgroundColor: `resolved ${element.style.backgroundColor}` };
};
const { knobSpecs, paletteProbeClass, paletteSwatchColors } = await import("../dist/index.js");

const specs = knobSpecs({ hueAccent: { property: "--hue-focus" } });
const knobs = { hueNeutral: 360, hueBrand: 240, hueAccent: 70, chroma: 1.15 };

test("the probe carries the app's knob properties and the mode, and the tokens read in order", () => {
  seen.length = 0;
  const colors = paletteSwatchColors(specs, ["--paper", "--primary"])(knobs, true);
  assert.deepEqual(colors, ["resolved var(--paper)", "resolved var(--primary)"]);
  const [probe] = seen.map(entry => entry.probe);
  assert.ok(seen.every(entry => entry.probe === probe));
  assert.equal(probe.className, paletteProbeClass);
  assert.equal(probe.dataset.theme, "dark");
  assert.equal(probe.hidden, true);
  assert.equal(probe.style.getPropertyValue("--hue-focus"), "70");
  assert.equal(probe.style.getPropertyValue("--hue-accent"), "70", "the palette reads the default property");
  assert.equal(probe.style.getPropertyValue("--chroma"), "1.15");
  assert.equal(document.body.childElementCount, 0, "the probe is removed after reading");
});

test("light mode reads the default tokens", () => {
  seen.length = 0;
  const colors = paletteSwatchColors(specs)(knobs, false);
  assert.equal(colors.length, 4);
  assert.equal(seen[0].probe.dataset.theme, "light");
  assert.deepEqual(seen.map(entry => entry.token), ["var(--paper)", "var(--surface)", "var(--brand)", "var(--accent)"]);
});

test("a failing read still removes the probe", () => {
  const read = globalThis.getComputedStyle;
  globalThis.getComputedStyle = () => { throw new Error("no style"); };
  try {
    assert.throws(() => paletteSwatchColors(specs)(knobs, false), /no style/);
    assert.equal(document.body.childElementCount, 0);
  } finally {
    globalThis.getComputedStyle = read;
  }
});
