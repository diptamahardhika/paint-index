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
  getCitadelIndexRange,
} from "./data.js";
import {
  activeProfile,
  getInventoryItem,
  getInventorySort,
  inventoryCounts,
  setInventorySort,
  setInventoryStatus as updateInventoryStatus,
  setProfileName,
  subscribe as subscribeToInventory,
} from "./stores/inventoryStore.js?v=1.0.0-beta.5";
import {
  hydrateInventoryFromCloud,
  overwriteCloudInventory,
  setCurrentUser,
  subscribeToSyncState,
} from "./services/inventorySyncService.js?v=1.0.0-beta.5";

const state = {
  selectedMatch: null,
  browseQuery: "",
  browseBrand: "all",
  browseLine: "all",
  inventoryQuery: "",
  inventoryStatus: "all",
  inventoryBrand: "all",
  inventorySort: getInventorySort(),
  hexSync: true,
};

const $ = (sel) => document.querySelector(sel);

function getPaintHue(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  if (delta === 0) return 0;

  let hue;

  if (max === r) {
    hue = ((g - b) / delta) % 6;
  } else if (max === g) {
    hue = (b - r) / delta + 2;
  } else {
    hue = (r - g) / delta + 4;
  }

  hue *= 60;

  if (hue < 0) {
    hue += 360;
  }

  return Math.round(hue);
}

function sortInventoryCards(cards) {
  const sort = state.inventorySort;

  return [...cards].sort((a, b) => {
    if (!state.inventoryQuery) {
      const byStatus = a.item.status.localeCompare(b.item.status);
      if (byStatus) return byStatus;
    }

    if (sort === "brand") {
      const byBrand = a.paint.brand.localeCompare(b.paint.brand);
      if (byBrand) return byBrand;

      const byLine = a.paint.line.localeCompare(b.paint.line);
      if (byLine) return byLine;
    }

    if (sort === "hue") {
      const byHue = getPaintHue(a.paint.hex) - getPaintHue(b.paint.hex);
      if (byHue) return byHue;
    }

    return a.paint.name.localeCompare(b.paint.name);
  });
}

function setInventoryStatus(p, status) {
  const result = updateInventoryStatus(p, status);
  refreshInventoryViews();
  showToast(result.message);
}

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
    .replace(/\"/g, "&quot;");
}

function swatchBackground(p) {
  if (p.hex2) {
    return `linear-gradient(90deg, ${p.hex} 0%, ${p.hex2} 100%)`;
  }
  return p.hex;
}

function paintCard(p, { onClick, selected = false, showInventory = true } = {}) {
  const inventoryItem = getInventoryItem(p);
  const statusLabel =
    inventoryItem?.status === "owned"
      ? "Owned"
      : inventoryItem?.status === "wishlist"
      ? "Wishlist"
      : "";
  const el = document.createElement("article");
  el.className = "card" + (selected ? " selected" : "");
  el.dataset.brand = p.brand;
  el.dataset.id = String(p.id);
  el.innerHTML = [
    `<div class="card-swatch" style="background:${swatchBackground(p)}"></div>`,
    `<div class="card-body">`,
    `<span class="brand-pill ${p.brand}">${brandLabel(p.brand)} · ${escapeHtml(p.line)}</span>`,
    `<h3>${escapeHtml(p.name)}</h3>`,
    `<code>${escapeHtml(p.hex)} · ${escapeHtml(p.indexLabel)}</code>`,
    statusLabel
      ? `<span class="inventory-pill ${inventoryItem.status}">${statusLabel}</span>`
      : "",
    `</div>`,
    showInventory
      ? `<div class="card-actions">
          <button type="button" class="mini-action ${
            inventoryItem?.status === "owned" ? "active" : ""
          }" data-inventory-action="owned" title="Mark as owned">Own</button>
          <button type="button" class="mini-action ${
            inventoryItem?.status === "wishlist" ? "active" : ""
          }" data-inventory-action="wishlist" title="Add to wishlist">Wish</button>
          <button type="button" class="mini-action danger" data-inventory-action="remove" title="Remove from inventory">Remove</button>
        </div>`
      : "",
  ].join("");
  if (onClick) el.addEventListener("click", () => onClick(p));
  el.querySelectorAll("[data-inventory-action]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      const action = btn.dataset.inventoryAction;
      setInventoryStatus(p, action === "remove" ? null : action);
    });
  });
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
        <span>${escapeHtml(p.line)} · ${escapeHtml(p.indexLabel)} · ${escapeHtml(p.hex)}</span>
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
}

function paintFromKey(key) {
  const [brand, id] = String(key).split(":");
  return findById(brand, id);
}

function inventoryPaints() {
  const profile = activeProfile();

  return sortInventoryCards(
    Object.entries(profile.items)
      .map(([key, item]) => {
        const paint = paintFromKey(key);
        return paint ? { paint, item } : null;
      })
      .filter(Boolean)
  );
}

function renderInventory() {
  const profile = activeProfile();
  const profileName = $("#inventory-profile-name");
  const grid = $("#inventory-grid");
  const stats = $("#inventory-stats");
  const summary = $("#inventory-summary");
  const counts = inventoryCounts();

  if (document.activeElement !== profileName) {
    profileName.value = profile.name;
  }
  summary.innerHTML = `
    <div class="summary-stat"><strong>${counts.total}</strong><span>Total</span></div>
    <div class="summary-stat"><strong>${counts.owned}</strong><span>Owned</span></div>
    <div class="summary-stat"><strong>${counts.wishlist}</strong><span>Wishlist</span></div>
  `;

  const brand = state.inventoryBrand;
  const status = state.inventoryStatus;
  const q = state.inventoryQuery.trim();
  let cards = [];

  if (q) {
    cards = sortInventoryCards(
      searchPaints(q, brand).map((paint) => ({ paint, item: null }))
    );
  } else {
    cards = inventoryPaints().filter(({ paint, item }) => {
      if (brand !== "all" && paint.brand !== brand) return false;
      if (status !== "all" && item.status !== status) return false;
      return true;
    });
  }

  const cap = q ? 120 : 240;
  stats.textContent = q
    ? `${cards.length} library result${cards.length === 1 ? "" : "s"}${
        cards.length > cap ? ` (showing ${cap})` : ""
      }`
    : `${cards.length} inventory paint${cards.length === 1 ? "" : "s"} · Sorted by ${state.inventorySort}`;

  grid.innerHTML = "";
  if (!cards.length) {
    const empty = document.createElement("p");
    empty.className = "inventory-empty";
    empty.textContent = q
      ? "No paints match that search."
      : "Your inventory is empty. Search above or use the Own/Wish buttons while browsing paints.";
    grid.appendChild(empty);
    return;
  }

  const frag = document.createDocumentFragment();
  for (const { paint } of cards.slice(0, cap)) {
    frag.appendChild(
      paintCard(paint, {
        onClick: (target) => {
          state.selectedMatch = target;
          switchTab("match");
          renderMatchDetail();
          renderMatchGrid();
        },
      })
    );
  }
  grid.appendChild(frag);
}

function refreshInventoryViews() {
  renderInventory();
  renderBrowse();
  renderMatchGrid();
  renderMatchDetail();
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
    `<span class="brand-pill ${p.brand}">${brandLabel(p.brand)} · ${escapeHtml(p.line)}</span>`,
    `<h2>${escapeHtml(p.name)}</h2>`,
    `<code>${escapeHtml(p.hex)} · ${escapeHtml(p.indexLabel)}</code>`,
    `<p class="stats">RGB ${escapeHtml(p.rgb)} · B&amp;C ${hexToBnc(p.hex)} · ${escapeHtml(p.type || p.line)}</p>`,
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
  const sortedLines = [...lines].sort((a, b) => {
    if (a === "Classic") return 1;
    if (b === "Classic") return -1;
    return a.localeCompare(b);
  });
  for (const line of sortedLines) {
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

function syncHexFields(hex, preferredPaint = null) {
  const n = normalizeHex(hex);
  if (!n) return;
  state.hexSync = false;
  const rgb = hexToRgb(n);
  $("#hex-input").value = n;
  $("#bnc-input").value = hexToBnc(n);
  $("#rgb-input").value = rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : "";
  $("#hex-preview").style.background = n;
  state.hexSync = true;
  runLookup(n, { preferredPaint });
}

function syncHexFromPaint(p) {
  syncHexFields(p.hex, p);
  if (p.brand === "citadel") $("#lookup-citadel-id").value = String(p.id);
}

function updateLookupRange() {
  const range = getCitadelIndexRange();
  const input = $("#lookup-citadel-id");
  const guidance = $("#lookup-guidance");

  if (!range.count) {
    input.disabled = true;
    guidance.textContent = "Citadel index lookup is unavailable.";
    return;
  }

  input.min = String(range.min);
  input.max = String(range.max);
  input.placeholder = `e.g. ${range.max}`;
  guidance.textContent = `Enter a color or Citadel index # (${range.min}-${range.max}) to find the nearest paints in the library.`;
}

function runLookup(hex, { preferredPaint = null } = {}) {
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
  const matches = [...citadel.slice(0, 4), ...vallejo.slice(0, 4)];
  const ranked = preferredPaint
    ? [
        { paint: preferredPaint, delta: 0 },
        ...matches.filter(
          ({ paint }) =>
            paint.brand !== preferredPaint.brand || paint.id !== preferredPaint.id
        ),
      ]
    : matches;
  stats.textContent = `Nearest Citadel & Vallejo matches for ${n}`;
  renderMatchList(
    list,
    ranked,
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
    const range = getCitadelIndexRange();
    if (!id) return;
    if (
      !Number.isInteger(id) ||
      id < range.min ||
      id > range.max
    ) {
      $("#lookup-stats").textContent = `Enter a Citadel index from ${range.min} to ${range.max}.`;
      return;
    }
    const p = findById("citadel", id);
    if (p) {
      syncHexFromPaint(p);
    } else {
      $("#lookup-stats").textContent = `No Citadel paint found for index #${id}.`;
    }
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

function renderSyncState(sync) {
  const status = $("#auth-sync-status");
  const overwrite = $("#inventory-overwrite-cloud");

  if (status) {
    status.textContent = sync.message;
    status.className = `sync-status ${sync.status}`;
  }

  if (overwrite) {
    overwrite.disabled =
      sync.status === "loading" ||
      sync.status === "saving" ||
      sync.status === "signed-out";
  }
}

function resolveInventoryConflict({ cloudInventory, localInventory }) {
  const cloudCounts = inventoryCounts(cloudInventory);
  const localCounts = inventoryCounts(localInventory);
  const message = [
    "Your Google account already has a different inventory.",
    "",
    `Cloud: ${cloudCounts.total} paint${cloudCounts.total === 1 ? "" : "s"}`,
    `This device: ${localCounts.total} paint${localCounts.total === 1 ? "" : "s"}`,
    "",
    "Type merge to combine both inventories, keeping the newest status for matching paints.",
    "Type cloud to load Google inventory only.",
    "Type local to overwrite Google inventory with this device.",
  ].join("\n");
  const choice = window.prompt(message, "merge")?.trim().toLowerCase();

  return ["cloud", "local", "merge"].includes(choice) ? choice : "merge";
}

async function handleAuthChanged(user) {
  setCurrentUser(user);

  if (!user) {
    return;
  }

  try {
    await hydrateInventoryFromCloud({
      resolveConflict: resolveInventoryConflict,
    });
    refreshInventoryViews();
  } catch (error) {
    console.error("Inventory hydration failed", error);
    showToast("Cloud inventory could not be loaded");
  }
}

function bindInventory() {
  $("#inventory-profile-name").addEventListener("input", (e) => {
    setProfileName(e.target.value);
    renderInventory();
  });
  $("#inventory-search").addEventListener("input", (e) => {
    state.inventoryQuery = e.target.value;
    renderInventory();
  });
  $("#inventory-status").addEventListener("change", (e) => {
    state.inventoryStatus = e.target.value;
    renderInventory();
  });
  $("#inventory-brand").addEventListener("change", (e) => {
    state.inventoryBrand = e.target.value;
    renderInventory();
  });
  $("#inventory-sort").addEventListener("change", (e) => {
    state.inventorySort = e.target.value;
    setInventorySort(state.inventorySort);
    renderInventory();
  });
  $("#inventory-export").addEventListener("click", () => {
    const profile = activeProfile();
    const payload = JSON.stringify(profile, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `paint-index-${profile.name.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Inventory JSON downloaded");
  });
  $("#inventory-overwrite-cloud")?.addEventListener("click", async () => {
    const confirmed = window.confirm(
      "Overwrite your Google cloud inventory with the inventory on this device?"
    );

    if (!confirmed) {
      return;
    }

    const saved = await overwriteCloudInventory();
    showToast(saved ? "Cloud inventory overwritten" : "Cloud overwrite failed");
  });
}

function bindCloudSync() {
  subscribeToInventory((_inventory, change) => {
    if (change?.source === "cloud") {
      refreshInventoryViews();
    }

    if (change?.source === "local" && !change.saved) {
      showToast("Inventory could not be saved");
    }
  });

  subscribeToSyncState(renderSyncState);

  window.addEventListener("paint-index-auth-changed", (event) => {
    handleAuthChanged(event.detail.user);
  });

  if ("__PAINT_INDEX_AUTH_USER__" in window) {
    handleAuthChanged(window.__PAINT_INDEX_AUTH_USER__);
  }
}

/* Theme initialization and toggle */
function initTheme() {
  const stored = localStorage.getItem('theme');
  if (stored === 'light') {
    document.body.classList.add('light-theme');
  }
  const toggleBtn = $('#theme-toggle');
  if (toggleBtn) {
    const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`;
    const setIcon = () => {
      const isLight = document.body.classList.contains('light-theme');
      toggleBtn.innerHTML = isLight ? moonIcon : sunIcon;
      toggleBtn.title = isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode';
    };
    // Initialize icon based on current theme
    setIcon();
    toggleBtn.addEventListener('click', () => {
      const nowLight = document.body.classList.toggle('light-theme');
      localStorage.setItem('theme', nowLight ? 'light' : 'dark');
      setIcon();
    });
  }
}

async function init() {
  try {
    await loadPaints();
  } catch (err) {
    document.body.innerHTML = `<main style="padding:2rem;font-family:system-ui"><h1>Could not load paint data</h1><p>Start a local server in the <code>paint-index</code> folder:</p><pre>cd paint-index && python3 -m http.server 8081</pre><p>Then open <a href="http://localhost:8081">http://localhost:8081</a></p><pre>${escapeHtml(String(err))}</pre></main>`;
    return;
  }
  bindTabs();
  bindBrowse();
  bindInventory();
  bindCloudSync();
  bindHexLab();
  initTheme();
  updateLineFilter();
  updateLookupRange();
  $("#inventory-sort").value = state.inventorySort;
  renderBrowse();
  renderInventory();
  renderMatchGrid();
  syncHexFields("#231f20");
}

init();
