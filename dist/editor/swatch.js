const light = { background: [0.97, 0.01], surface: [0.9, 0.025], brand: [0.45, 0.09], accent: [0.6, 0.12] };
const dark = { background: [0.27, 0.01], surface: [0.38, 0.03], brand: [0.8, 0.08], accent: [0.8, 0.11] };
export function swatchColors(knobs, darkMode) {
    const levels = darkMode ? dark : light;
    const color = ([lightness, chroma], hue) => `oklch(${lightness} ${(chroma * knobs.chroma).toFixed(3)} ${hue})`;
    return [
        color(levels.background, knobs.hueNeutral),
        color(levels.surface, knobs.hueNeutral),
        color(levels.brand, knobs.hueBrand),
        color(levels.accent, knobs.hueAccent),
    ];
}
