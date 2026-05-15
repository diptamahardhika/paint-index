import {
  normalizeHex,
  hexToBnc,
  bncToHex,
  hexToRgb,
  rgbToHex,
  parseRgbString,
  formatMatchScore,
} from "./color-utils.js";
import {
  loadPaints,
  getPaints,
  brandLabel,
  searchPaints,
  crossReference,
  closestPaints,
  findById,
} from "./data.js";

const state = {
  selectedMatch: null,
  browseQuery: "",
  browseBrand: "all",
  browseLine: "all",
  hexSync: true,
};

const $ = (sel) => document.querySelector(sel);

function showToast(msg = "Copied") {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.remove("show"), 1400);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast();
  } catch {
    showToast("Copy failed");
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function swatchBackground(p) {
  if (p.hex2) {
    return `linear-gradient(90deg, ${p.hex} 0%, ${p.hex2} 100%)`;
  }
  return p.hex;
}

function paintCard(p, { onClick, selected = false } = {}) {
  const el = document.createElement("article");
  el.className = "card" + (selected ? " selected" : "");
  el.dataset.brand = p.brand;
  el.dataset.id = String(p.id);
  el.innerHTML = [
    `<div class="card-swatch" style="background:${swatchBackground(p)}"></div>`,
    `<div class="card-body">`,
    `<span class="brand-pill ${p.brand}">${brandLabel(p.brand)}</span>`,
    `<h3>${escapeHtml(p.name)}</h3>`,
    `<code>${escapeHtml(p.hex)} · ${escapeHtml(p.indexLabel)}</code>`,
    `</div>`,
  ].join("");
  if (onClick) el.addEventListener("click", () => onClick(p));
  return el;
}

function renderMatchList(container, items, onPick) {
  container.innerHTML = "";
  if (!items.length) {
    const li = document.createElement("li");
    li.style.color = "var(--muted)";
    li.style.cursor = "default";
    li.textContent = "No matches";
    container.appendChild(li);
    return;
  }
  for (const { paint: p, delta } of items) {
    const li = document.createElement("li");
    const score = formatMatchScore(delta);
    li.innerHTML = `
      <div class="match-swatch" style="background:${swatchBackground(p)}"></div>
      <div class="match-meta">
        <strong>${escapeHtml(p.name)}</strong>
        <span>${escapeHtml(p.indexLabel)} · ${escapeHtml(p.hex)}</span>
      </div>
      <div class="match-score ${score.tone}">ΔE ${delta.toFixed(1)}<br>${score.label}</div>
    `;
    li.addEventListener("click", () => onPick?.(p));
    container.appendChild(li);
  }
}

function renderBrowse() {
  const grid = $("#browse-grid");
  const stats = $("#browse-stats");
  grid.nextElementSibling?.classList?.contains("stats-more") &&
    grid.nextElementSibling.remove();

  let list = getPaints();
  if (state.browseBrand !== "all") {
    list = list.filter((p) => p.brand === state.browseBrand);
  }
  if (state.browseLine !== "all") {
    list = list.filter((p) => p.line === state.browseLine);
  }
  if (state.browseQuery) {
    list = searchPaints(state.browseQuery, state.browseBrand);
    if (state.browseLine !== "all") {
      list = list.filter((p) => p.line === state.browseLine);
    }
  }

  const cap = state.browseQuery ? 200 : 120;
  stats.textContent = `${list.length} paint${list.length === 1 ? "" : "s"}${
    list.length > cap ? ` (showing ${cap})` : ""
  }`;
  grid.innerHTML = "";
  const frag = document.createDocumentFragment();
  for (const p of list.slice(0, cap)) {
    frag.appendChild(
      paintCard(p, {
        onClick: (paint) => {
          state.selectedMatch = paint;
          switchTab("match");
          renderMatchDetail();
          renderMatchGrid();
        },
      })
    );
  }
  grid.appendChild(frag);
  if (list.length > cap) {
    const more = document.createElement("p");
    more.className = "stats stats-more";
    more.textContent = `Refine your search to see more than ${cap} results.`;
    grid.after(more);
  }
}

function renderMatchGrid() {
  const grid = $("#match-grid");
  const stats = $("#match-stats");
  const q = $("#match-search").value.trim();
  const list = q ? searchPaints(q, "all") : getPaints().slice(0, 60);
  stats.textContent = q
    ? `${list.length} result${list.length === 1 ? "" : "s"}`
    : "Type to search — showing a sample of the library";
  grid.innerHTML = "";
  const frag = document.createDocumentFragment();
  for (const p of list.slice(0, 80)) {
    frag.appendChild(
      paintCard(p, {
        selected:
          state.selectedMatch?.brand === p.brand &&
          state.selectedMatch?.id === p.id,
        onClick: (paint) => {
          state.selectedMatch = paint;
          renderMatchDetail();
          renderMatchGrid();
        },
      })
    );
  }
  grid.appendChild(frag);
}

function renderMatchDetail() {
  const panel = $("#match-detail");
  const p = state.selectedMatch;
  if (!p) {
    panel.className = "detail-panel empty";
    panel.textContent =
      "Select a paint to see the closest matches in the other brand.";
    return;
  }
  const other = p.brand === "citadel" ? "Vallejo" : "Citadel Colour";
  const matches = crossReference(p, { limit: 12 });
  panel.className = "detail-panel";
  panel.innerHTML = [
    `<div class="detail-hero">`,
    `<div class="detail-swatch" style="background:${swatchBackground(p)}"></div>`,
    `<div>`,
    `<span class="brand-pill ${p.brand}">${brandLabel(p.brand)}</span>`,
    `<h2>${escapeHtml(p.name)}</h2>`,
    `<code>${escapeHtml(p.hex)} · ${escapeHtml(p.indexLabel)}</code>`,
    `<p class="stats">RGB ${escapeHtml(p.rgb)} · B&amp;C ${hexToBnc(p.hex)}</p>`,
    `</div></div>`,
    `<h3 style="margin:0 0 0.5rem;font-size:0.9rem">Closest in ${other}</h3>`,
    `<ul class="match-list" id="xref-list"></ul>`,
  ].join("");
  renderMatchList($("#xref-list"), matches, (target) => {
    state.selectedMatch = target;
    renderMatchDetail();
    renderMatchGrid();
    syncHexFromPaint(target);
    switchTab("hex");
  });
}

function updateLineFilter() {
  const sel = $("#browse-line");
  const brand = state.browseBrand;
  const lines = new Set();
  for (const p of getPaints()) {
    if (brand === "all" || p.brand === brand) lines.add(p.line);
  }
  const current = sel.value;
  sel.innerHTML = '<option value="all">All lines</option>';
  for (const line of [...lines].sort()) {
    const opt = document.createElement("option");
    opt.value = line;
    opt.textContent = line;
    sel.appendChild(opt);
  }
  sel.value = [...lines].includes(current) || current === "all" ? current : "all";
  state.browseLine = sel.value;
}

function switchTab(id) {
  document.querySelectorAll(".tabs button").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === id);
  });
  document.querySelectorAll(".panel").forEach((p) => {
    p.classList.toggle("active", p.id === `panel-${id}`);
  });
}

function syncHexFields(hex) {
  const n = normalizeHex(hex);
  if (!n) return;
  state.hexSync = false;
  const rgb = hexToRgb(n);
  $("#hex-input").value = n;
  $("#bnc-input").value = hexToBnc(n);
  $("#rgb-input").value = rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : "";
  $("#hex-preview").style.background = n;
  state.hexSync = true;
  runLookup(n);
}

function syncHexFromPaint(p) {
  syncHexFields(p.hex);
  if (p.brand === "citadel") $("#lookup-citadel-id").value = String(p.id);
}

function runLookup(hex) {
  const list = $("#lookup-results");
  const stats = $("#lookup-stats");
  const n = normalizeHex(hex);
  if (!n) {
    list.innerHTML = "";
    stats.textContent = "";
    return;
  }
  const citadel = closestPaints(n, { limit: 5, brand: "citadel" });
  const vallejo = closestPaints(n, { limit: 5, brand: "vallejo" });
  stats.textContent = `Nearest Citadel & Vallejo matches for ${n}`;
  renderMatchList(
    list,
    [...citadel.slice(0, 4), ...vallejo.slice(0, 4)],
    (paint) => syncHexFromPaint(paint)
  );
}

function bindHexLab() {
  const hexIn = $("#hex-input");
  const bncIn = $("#bnc-input");
  const rgbIn = $("#rgb-input");

  hexIn.addEventListener("input", () => {
    if (!state.hexSync) return;
    syncHexFields(hexIn.value);
  });
  bncIn.addEventListener("input", () => {
    if (!state.hexSync) return;
    syncHexFields(bncToHex(bncIn.value));
  });
  rgbIn.addEventListener("input", () => {
    if (!state.hexSync) return;
    const rgb = parseRgbString(rgbIn.value);
    if (rgb) syncHexFields(rgbToHex(rgb));
  });

  $("#lookup-citadel-id").addEventListener("input", (e) => {
    const id = Number(e.target.value);
    if (!id || id < 1 || id > 189) return;
    const p = findById("citadel", id);
    if (p) syncHexFromPaint(p);
  });

  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const hex = normalizeHex($("#hex-input").value);
      if (!hex) return;
      const rgb = hexToRgb(hex);
      const name = state.selectedMatch?.name ?? "Color";
      const kind = btn.dataset.copy;
      if (kind === "hex") copyText(hex);
      else if (kind === "bnc") copyText(hexToBnc(hex));
      else if (kind === "rgb" && rgb)
        copyText(`${rgb.r}, ${rgb.g}, ${rgb.b}`);
      else if (kind === "bbcode")
        copyText(`[color=#${hexToBnc(hex)}]${name}: ${hexToBnc(hex)}[/color]`);
    });
  });
}

function bindTabs() {
  document.querySelectorAll(".tabs button").forEach((b) => {
    b.addEventListener("click", () => switchTab(b.dataset.tab));
  });
}

function bindBrowse() {
  $("#browse-search").addEventListener("input", (e) => {
    state.browseQuery = e.target.value;
    renderBrowse();
  });
  $("#browse-brand").addEventListener("change", (e) => {
    state.browseBrand = e.target.value;
    updateLineFilter();
    renderBrowse();
  });
  $("#browse-line").addEventListener("change", (e) => {
    state.browseLine = e.target.value;
    renderBrowse();
  });
  $("#match-search").addEventListener("input", renderMatchGrid);
}

async function init() {
  try {
    await loadPaints();
  } catch (err) {
    document.body.innerHTML = `<main style="padding:2rem;font-family:system-ui"><h1>Could not load paint data</h1><p>Start a local server in the <code>paint-index</code> folder:</p><pre>cd paint-index && python3 -m http.server 8080</pre><p>Then open <a href="http://localhost:8080">http://localhost:8080</a></p><pre>${escapeHtml(String(err))}</pre></main>`;
    return;
  }
  bindTabs();
  bindBrowse();
  bindHexLab();
  updateLineFilter();
  renderBrowse();
  renderMatchGrid();
  syncHexFields("#231f20");
}

init();
