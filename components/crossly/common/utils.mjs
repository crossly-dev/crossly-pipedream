/** Parse a prop that may arrive as a JSON string or an object. */
export function parseObject(value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`Expected a JSON object, got: ${String(value).slice(0, 80)}`);
  }
}

/** Drop undefined / empty values so request bodies and queries stay sparse. */
export function compact(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([
    , v,
  ]) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)));
}

/** Optional numeric string prop -> number (or undefined). */
export function toNumber(value, label) {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`${label} must be a number, got "${value}"`);
  return n;
}
