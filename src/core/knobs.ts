// The four knobs every themed app derives its oklch colors from, through the
// shared palette.css, so a theme saved in one app means the same thing in
// another. An app may relabel a knob or change its default.
import { isFiniteNumber, isRecord } from "./values.js";

export const knobKeys = ["hueNeutral", "hueBrand", "hueAccent", "chroma"] as const;
export type KnobKey = (typeof knobKeys)[number];
export type KnobValues = Record<KnobKey, number>;

export type KnobSpec = {
  property: `--${string}`;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
};
export type KnobSpecs = Readonly<Record<KnobKey, KnobSpec>>;
export type KnobSpecOverrides = Partial<Record<KnobKey, Partial<KnobSpec>>>;

const hue = (property: `--${string}`, label: string, fallback: number): KnobSpec =>
  ({ property, label, min: 0, max: 360, step: 1, default: fallback });

export const defaultKnobSpecs: KnobSpecs = Object.freeze({
  hueNeutral: hue("--hue-neutral", "Neutral hue", 125),
  hueBrand: hue("--hue-brand", "Brand hue", 160),
  hueAccent: hue("--hue-accent", "Accent hue", 75),
  chroma: { property: "--chroma", label: "Color intensity", min: 0, max: 2, step: 0.05, default: 1 },
});

/** The default specs with an app's property names, labels, ranges or defaults. */
export function knobSpecs(overrides: KnobSpecOverrides = {}): KnobSpecs {
  return Object.freeze(Object.fromEntries(
    knobKeys.map(key => [key, { ...defaultKnobSpecs[key], ...overrides[key] }]),
  ) as Record<KnobKey, KnobSpec>);
}

const decimalsOf = (step: number) => String(step).split(".")[1]?.length ?? 0;

/** Clamps to the spec's range and snaps to its step, so saved values carry no float noise. */
export function clampKnob(spec: KnobSpec, value: number): number {
  const clamped = Math.min(spec.max, Math.max(spec.min, value));
  const snapped = spec.min + Math.round((clamped - spec.min) / spec.step) * spec.step;
  return Number(Math.min(spec.max, snapped).toFixed(decimalsOf(spec.step)));
}

export const defaultKnobs = (specs: KnobSpecs): KnobValues =>
  Object.fromEntries(knobKeys.map(key => [key, specs[key].default])) as KnobValues;

/** Reads stored or pasted knobs leniently: unknown keys are dropped, missing
 * or non-numeric ones take the fallback, and the rest are clamped. */
export function normalizeKnobs(specs: KnobSpecs, value: unknown, fallback = defaultKnobs(specs)): KnobValues {
  const source = isRecord(value) ? value : {};
  return Object.fromEntries(knobKeys.map(key => {
    const knob = source[key];
    return [key, isFiniteNumber(knob) ? clampKnob(specs[key], knob) : fallback[key]];
  })) as KnobValues;
}

/** Validates a write strictly: the reason it is invalid, or nothing. */
export function knobsProblem(specs: KnobSpecs, value: unknown): string | undefined {
  if (!isRecord(value)) return "knobs must be an object";
  const unknown = Object.keys(value).find(key => !(knobKeys as readonly string[]).includes(key));
  if (unknown) return `Unknown knob ${unknown}`;
  for (const key of knobKeys) {
    const { min, max } = specs[key];
    const knob = value[key];
    if (!isFiniteNumber(knob) || knob < min || knob > max) return `${key} must be a number from ${min} to ${max}`;
  }
  return undefined;
}

export const sameKnobs = (a: KnobValues, b: KnobValues) => knobKeys.every(key => a[key] === b[key]);

export function formatKnob(spec: KnobSpec, value: number): string {
  return spec.step >= 1 ? String(Math.round(value)) : value.toFixed(decimalsOf(spec.step)).replace(/\.?0+$/, "");
}

/** Sets each knob's custom property, e.g. on document.documentElement.style. */
export function applyKnobs(specs: KnobSpecs, knobs: KnobValues, style: Pick<CSSStyleDeclaration, "setProperty">) {
  for (const key of knobKeys) style.setProperty(specs[key].property, formatKnob(specs[key], knobs[key]));
}
