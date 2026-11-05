// The four knobs every themed app derives its oklch colors from, through the
// shared palette.css, so a theme saved in one app means the same thing in
// another. An app may relabel a knob or change its default.
import { isFiniteNumber, isRecord } from "./values.js";
export const knobKeys = ["hueNeutral", "hueBrand", "hueAccent", "chroma"];
const hue = (property, label, fallback) => ({ property, label, min: 0, max: 360, step: 1, default: fallback });
export const defaultKnobSpecs = Object.freeze({
    hueNeutral: hue("--hue-neutral", "Neutral hue", 125),
    hueBrand: hue("--hue-brand", "Brand hue", 160),
    hueAccent: hue("--hue-accent", "Accent hue", 75),
    chroma: { property: "--chroma", label: "Color intensity", min: 0, max: 2, step: 0.05, default: 1 },
});
/** The default specs with an app's property names, labels, ranges or defaults. */
export function knobSpecs(overrides = {}) {
    return Object.freeze(Object.fromEntries(knobKeys.map(key => [key, { ...defaultKnobSpecs[key], ...overrides[key] }])));
}
const decimalsOf = (step) => String(step).split(".")[1]?.length ?? 0;
/** Clamps to the spec's range and snaps to its step, so saved values carry no float noise. */
export function clampKnob(spec, value) {
    const clamped = Math.min(spec.max, Math.max(spec.min, value));
    const snapped = spec.min + Math.round((clamped - spec.min) / spec.step) * spec.step;
    return Number(Math.min(spec.max, snapped).toFixed(decimalsOf(spec.step)));
}
export const defaultKnobs = (specs) => Object.fromEntries(knobKeys.map(key => [key, specs[key].default]));
/** Reads stored or pasted knobs leniently: unknown keys are dropped, missing
 * or non-numeric ones take the fallback, and the rest are clamped. */
export function normalizeKnobs(specs, value, fallback = defaultKnobs(specs)) {
    const source = isRecord(value) ? value : {};
    return Object.fromEntries(knobKeys.map(key => {
        const knob = source[key];
        return [key, isFiniteNumber(knob) ? clampKnob(specs[key], knob) : fallback[key]];
    }));
}
/** Validates a write strictly: the reason it is invalid, or nothing. */
export function knobsProblem(specs, value) {
    if (!isRecord(value))
        return "knobs must be an object";
    const unknown = Object.keys(value).find(key => !knobKeys.includes(key));
    if (unknown)
        return `Unknown knob ${unknown}`;
    for (const key of knobKeys) {
        const { min, max } = specs[key];
        const knob = value[key];
        if (!isFiniteNumber(knob) || knob < min || knob > max)
            return `${key} must be a number from ${min} to ${max}`;
    }
    return undefined;
}
export const sameKnobs = (a, b) => knobKeys.every(key => a[key] === b[key]);
export function formatKnob(spec, value) {
    return spec.step >= 1 ? String(Math.round(value)) : value.toFixed(decimalsOf(spec.step)).replace(/\.?0+$/, "");
}
/** Sets each knob's custom property, e.g. on document.documentElement.style. */
export function applyKnobs(specs, knobs, style) {
    for (const key of knobKeys)
        style.setProperty(specs[key].property, formatKnob(specs[key], knobs[key]));
}
