import { labFromHex, deltaE76 } from "./color-utils.js";

/** @typedef {{ id: number, brand: string, line?: string, type?: string, finish?: string, code?: string, name: string, hex: string, hex2?: string, rgb: string, lab?: import('./color-utils.js').Lab, indexLabel: string }} Paint */

let paints = [];
let byBrand = new Map();

export async function loadPaints() {
  const [citadelRes, vallejoRes] = await Promise.all([
    fetch("./data/citadel.json"),
    fetch("./data/vallejo.json"),
  ]);
  const citadel = await citadelRes.json();
  const vallejo = await vallejoRes.json();

  const list = [];

  for (const c of citadel.colors) {
    const line = c.line || "Citadel Colours";
    list.push(normalize({
      id: c.id,
      brand: "citadel",
      line,
      type: c.type,
      finish: c.finish,
      name: c.name,
      hex: c.hex,
      hex2: c.hex2,
      rgb: c.rgb,
      indexLabel:
        line === "Contrast"
          ? `Citadel Contrast · ${c.name}`
          : `Citadel #${c.id}`,
    }));
  }

  for (const c of vallejo.colors) {
    list.push(normalize({
      id: c.id,
      brand: "vallejo",
      line: c.line,
      code: c.code,
      name: c.name,
      hex: c.hex,
      rgb: c.rgb,
      indexLabel: `Vallejo ${c.code}`,
    }));
  }

  paints = list;
  byBrand = new Map();
  for (const p of paints) {
    if (!byBrand.has(p.brand)) byBrand.set(p.brand, []);
    byBrand.get(p.brand).push(p);
  }
  return paints;
}

function normalize(raw) {
  const hex = raw.hex.startsWith("#") ? raw.hex : `#${raw.hex}`;
  const paint = { ...raw, hex: hex.toLowerCase() };
  paint.lab = labFromHex(paint.hex);
  return paint;
}

export function getPaints() {
  return paints;
}

export function getBrands() {
  return [...byBrand.keys()];
}

export function getByBrand(brand) {
  return byBrand.get(brand) ?? [];
}

export function brandLabel(brand) {
  return brand === "citadel" ? "Citadel Colour" : brand === "vallejo" ? "Vallejo" : brand;
}

export function findById(brand, id) {
  return paints.find((p) => p.brand === brand && p.id === Number(id));
}

export function searchPaints(query, brandFilter = "all") {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return paints.filter((p) => {
    if (brandFilter !== "all" && p.brand !== brandFilter) return false;
    const hay = [
      p.name,
      p.hex,
      p.hex2,
      p.rgb,
      p.code,
      p.line,
      p.type,
      p.finish,
      p.indexLabel,
      String(p.id),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function closestPaints(hex, { limit = 12, excludeBrand = null, brand = null } = {}) {
  const lab = labFromHex(hex);
  if (!lab) return [];
  const pool = brand
    ? getByBrand(brand)
    : paints.filter((p) => p.brand !== excludeBrand);
  const scored = pool
    .map((p) => ({
      paint: p,
      delta: p.lab ? deltaE76(lab, p.lab) : 999,
    }))
    .sort((a, b) => a.delta - b.delta);
  return scored.slice(0, limit);
}

export function crossReference(sourcePaint, { limit = 10 } = {}) {
  const otherBrand = sourcePaint.brand === "citadel" ? "vallejo" : "citadel";
  return closestPaints(sourcePaint.hex, {
    limit,
    brand: otherBrand,
  });
}
