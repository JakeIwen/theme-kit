// Theme previews in the saved-themes list. Apps derive their colors from the
// knobs differently, so a swatch shows a generic reading of them: background,
// surface, brand and accent, at lightness levels that suit the current mode.
import type { KnobValues } from "../core/knobs.js";

const light = { background: [0.97, 0.01], surface: [0.9, 0.025], brand: [0.45, 0.09], accent: [0.6, 0.12] } as const;
const dark = { background: [0.27, 0.01], surface: [0.38, 0.03], brand: [0.8, 0.08], accent: [0.8, 0.11] } as const;

export function swatchColors(knobs: KnobValues, darkMode: boolean): string[] {
  const levels = darkMode ? dark : light;
  const color = ([lightness, chroma]: readonly [number, number], hue: number) =>
    `oklch(${lightness} ${(chroma * knobs.chroma).toFixed(3)} ${hue})`;
  return [
    color(levels.background, knobs.hueNeutral),
    color(levels.surface, knobs.hueNeutral),
    color(levels.brand, knobs.hueBrand),
    color(levels.accent, knobs.hueAccent),
  ];
}
