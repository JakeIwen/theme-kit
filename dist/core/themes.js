// A theme is a named set of knob values. Built-in themes come from each app's
// adapter and are locked; saved themes belong to the app's store.
import { knobsProblem, normalizeKnobs } from "./knobs.js";
import { isRecord } from "./values.js";
export const themeNameMaxLength = 40;
const themeIdPattern = /^[a-z0-9][a-z0-9-]{0,47}$/;
export function themeNameProblem(name) {
    if (typeof name !== "string" || !name.trim())
        return "Theme name is required";
    if (name.trim().length > themeNameMaxLength)
        return `Theme name must be at most ${themeNameMaxLength} characters`;
    return undefined;
}
export function themeIdProblem(id) {
    return typeof id === "string" && themeIdPattern.test(id)
        ? undefined
        : "Theme id must be 1–48 lowercase letters, digits or hyphens";
}
/** Validates a saved-theme write: the reason it is invalid, or nothing. */
export function themeProblem(specs, value) {
    if (!isRecord(value))
        return "theme must be an object";
    return themeIdProblem(value.id) ?? themeNameProblem(value.name) ?? knobsProblem(specs, value.knobs);
}
export function activeThemeProblem(specs, value) {
    if (!isRecord(value))
        return "active theme must be an object";
    return themeIdProblem(value.id) ?? knobsProblem(specs, value.knobs);
}
/** Reads one stored theme leniently, or nothing when its id or name is unusable. */
export function normalizeTheme(specs, value) {
    if (!isRecord(value) || themeIdProblem(value.id) || themeNameProblem(value.name))
        return undefined;
    return { id: value.id, name: value.name.trim(), knobs: normalizeKnobs(specs, value.knobs) };
}
/** Reads a stored theme list leniently: unusable entries and repeated ids are dropped. */
export function normalizeThemes(specs, value) {
    if (!Array.isArray(value))
        return [];
    const seen = new Set();
    return value.flatMap(entry => {
        const theme = normalizeTheme(specs, entry);
        if (!theme || seen.has(theme.id))
            return [];
        seen.add(theme.id);
        return [theme];
    });
}
export function normalizeActiveTheme(specs, value, fallback) {
    if (!isRecord(value) || themeIdProblem(value.id))
        return fallback;
    return { id: value.id, knobs: normalizeKnobs(specs, value.knobs, fallback.knobs) };
}
/** A readable id for a new theme ("rosewood-slate"), suffixed to stay unique. */
export function themeIdFor(name, taken) {
    const used = new Set(taken);
    const base = name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "theme";
    if (!used.has(base))
        return base;
    for (let n = 2;; n++)
        if (!used.has(`${base}-${n}`))
            return `${base}-${n}`;
}
/** The name itself, or "Name 2", "Name 3"… when another theme already uses it. */
export function uniqueThemeName(name, taken) {
    const used = new Set([...taken].map(existing => existing.toLowerCase()));
    const base = name.trim().slice(0, themeNameMaxLength - 3) || "Theme";
    if (!used.has(base.toLowerCase()))
        return base;
    for (let n = 2;; n++)
        if (!used.has(`${base} ${n}`.toLowerCase()))
            return `${base} ${n}`;
}
