/** @typedef {{ r: number, g: number, b: number }} RGB */
/** @typedef {{ l: number, a: number, b: number }} Lab */

export function normalizeHex(input) {
  if (!input) return null;
  let s = String(input).trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(s)) {
    s = s
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
  return "#" + s.toLowerCase();
}

export function hexToBnc(hex) {
  const n = normalizeHex(hex);
  return n ? n.slice(1).toUpperCase() : null;
}

export function bncToHex(bnc) {
  return normalizeHex(bnc);
}

/** @param {string} hex */
export function hexToRgb(hex) {
  const n = normalizeHex(hex);
  if (!n) return null;
  const v = parseInt(n.slice(1), 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}

/** @param {RGB} rgb */
export function rgbToHex(rgb) {
  const clamp = (x) => Math.max(0, Math.min(255, Math.round(x)));
  const r = clamp(rgb.r);
  const g = clamp(rgb.g);
  const b = clamp(rgb.b);
  return (
    "#" +
    [r, g, b]
      .map((c) => c.toString(16).padStart(2, "0"))
      .join("")
  );
}

/** @param {RGB} rgb */
export function rgbToLab(rgb) {
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;
  r = r <= 0.04045 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  g = g <= 0.04045 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  b = b <= 0.04045 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  let y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116);
  x = f(x);
  y = f(y);
  z = f(z);
  return { l: 116 * y - 16, a: 500 * (x - y), b: 200 * (y - z) };
}

/** @param {Lab} a @param {Lab} b */
export function deltaE76(a, b) {
  return Math.hypot(a.l - b.l, a.a - b.a, a.b - b.b);
}

/** @param {string} hex */
export function labFromHex(hex) {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToLab(rgb) : null;
}

export function parseRgbString(str) {
  const parts = String(str)
    .replace(/rgb\s*\(|\)|\s/g, "")
    .split(/[, ]+/)
    .filter(Boolean)
    .map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  return { r: parts[0], g: parts[1], b: parts[2] };
}

export function formatMatchScore(delta) {
  if (delta < 2) return { label: "Very close", tone: "excellent" };
  if (delta < 5) return { label: "Close", tone: "good" };
  if (delta < 10) return { label: "Approximate", tone: "fair" };
  return { label: "Distant", tone: "weak" };
}
