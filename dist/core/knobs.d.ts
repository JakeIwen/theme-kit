export declare const knobKeys: readonly ["hueNeutral", "hueBrand", "hueAccent", "chroma"];
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
export declare const defaultKnobSpecs: KnobSpecs;
/** The default specs with an app's property names, labels, ranges or defaults. */
export declare function knobSpecs(overrides?: KnobSpecOverrides): KnobSpecs;
/** Clamps to the spec's range and snaps to its step, so saved values carry no float noise. */
export declare function clampKnob(spec: KnobSpec, value: number): number;
export declare const defaultKnobs: (specs: KnobSpecs) => KnobValues;
/** Reads stored or pasted knobs leniently: unknown keys are dropped, missing
 * or non-numeric ones take the fallback, and the rest are clamped. */
export declare function normalizeKnobs(specs: KnobSpecs, value: unknown, fallback?: KnobValues): KnobValues;
/** Validates a write strictly: the reason it is invalid, or nothing. */
export declare function knobsProblem(specs: KnobSpecs, value: unknown): string | undefined;
export declare const sameKnobs: (a: KnobValues, b: KnobValues) => boolean;
export declare function formatKnob(spec: KnobSpec, value: number): string;
/** Sets each knob's custom property, e.g. on document.documentElement.style. */
export declare function applyKnobs(specs: KnobSpecs, knobs: KnobValues, style: Pick<CSSStyleDeclaration, "setProperty">): void;
