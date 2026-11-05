import { type KnobSpecs, type KnobValues } from "../core/knobs.js";
export declare const paletteProbeClass = "theme-probe";
export declare const defaultSwatchTokens: readonly string[];
/** A ThemeAdapter.swatchColors reading these tokens with the app's knob properties. */
export declare function paletteSwatchColors(specs: KnobSpecs, tokens?: readonly string[]): (knobs: KnobValues, darkMode: boolean) => string[];
