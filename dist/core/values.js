export const isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
export const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);
