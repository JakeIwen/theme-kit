export const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
