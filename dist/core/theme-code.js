// The copy/paste format that carries a theme between apps. The version lets a
// later editor read old codes and lets an old editor refuse newer ones.
import { normalizeKnobs } from "./knobs.js";
import { themeNameMaxLength } from "./themes.js";
import { isRecord } from "./values.js";
const codeKey = "theme-kit";
export const themeCodeVersion = 1;
export const encodeThemeCode = ({ name, knobs }) => JSON.stringify({ [codeKey]: themeCodeVersion, name, knobs });
/** Unknown knobs are ignored, missing ones take this app's defaults and the rest are clamped. */
export function decodeThemeCode(specs, text) {
    let parsed;
    try {
        parsed = JSON.parse(text.trim());
    }
    catch {
        return { ok: false, error: "That isn't a theme code" };
    }
    if (!isRecord(parsed) || !(codeKey in parsed) || !isRecord(parsed.knobs))
        return { ok: false, error: "That isn't a theme code" };
    const version = parsed[codeKey];
    if (typeof version !== "number" || version > themeCodeVersion)
        return { ok: false, error: "This theme code needs a newer theme editor" };
    const name = typeof parsed.name === "string" && parsed.name.trim()
        ? parsed.name.trim().slice(0, themeNameMaxLength)
        : "Imported theme";
    return { ok: true, theme: { name, knobs: normalizeKnobs(specs, parsed.knobs) } };
}
