// Faithful swatches for an app on the shared palette (palette.css). A hidden
// probe carrying the candidate knobs re-evaluates the role tokens, and reading
// a real color property resolves calc() and hue wrapping, so the saved-themes
// list shows the colors the app would paint. The probe's class is the one
// palette.css re-declares its tokens on.
import { applyKnobs, defaultKnobSpecs } from "../core/knobs.js";
export const paletteProbeClass = "theme-probe";
export const defaultSwatchTokens = ["--paper", "--surface", "--brand", "--accent"];
/** A ThemeAdapter.swatchColors reading these tokens with the app's knob properties. */
export function paletteSwatchColors(specs, tokens = defaultSwatchTokens) {
    return (knobs, darkMode) => {
        const probe = document.createElement("div");
        probe.className = paletteProbeClass;
        probe.dataset.theme = darkMode ? "dark" : "light";
        probe.hidden = true;
        // palette.css reads the default properties. An app that renamed one and
        // aliases it on :root would otherwise hand the probe the page's resolved
        // value, so the probe gets the knobs under both names.
        applyKnobs(specs, knobs, probe.style);
        applyKnobs(defaultKnobSpecs, knobs, probe.style);
        const chips = tokens.map(token => {
            const chip = document.createElement("span");
            chip.style.backgroundColor = `var(${token})`;
            probe.append(chip);
            return chip;
        });
        try {
            document.body.append(probe);
            return chips.map(chip => getComputedStyle(chip).backgroundColor);
        }
        finally {
            probe.remove();
        }
    };
}
