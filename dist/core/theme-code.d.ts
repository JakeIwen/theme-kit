import { type KnobSpecs, type KnobValues } from "./knobs.js";
export declare const themeCodeVersion = 1;
export type ThemeCode = {
    name: string;
    knobs: KnobValues;
};
export type DecodedThemeCode = {
    ok: true;
    theme: ThemeCode;
} | {
    ok: false;
    error: string;
};
export declare const encodeThemeCode: ({ name, knobs }: ThemeCode) => string;
/** Unknown knobs are ignored, missing ones take this app's defaults and the rest are clamped. */
export declare function decodeThemeCode(specs: KnobSpecs, text: string): DecodedThemeCode;
