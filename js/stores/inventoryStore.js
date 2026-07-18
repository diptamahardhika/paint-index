import {
  loadInventorySort,
  loadLocalInventory,
  saveInventorySort,
  saveLocalInventory,
} from '../services/localInventoryService.js?v=1.0.0-beta.5';

const listeners = new Set();

let inventory = normalizeInventory(readLocalInventory());
let inventorySort = readInventorySort();

function nowIso() {
  return new Date().toISOString();
}

function readLocalInventory() {
  try {
    return loadLocalInventory();
  } catch {
    return null;
  }
}

function readInventorySort() {
  try {
    return loadInventorySort('name');
  } catch {
    return 'name';
  }
}

function persistInventory() {
  try {
    saveLocalInventory(inventory);
    return true;
  } catch {
    return false;
  }
}

function emit(change) {
  listeners.forEach((listener) => listener(inventory, change));
}

export function createDefaultInventory() {
  const timestamp = nowIso();

  return {
    version: 1,
    activeProfileId: 'default',
    profiles: [
      {
        id: 'default',
        name: 'My paints',
        createdAt: timestamp,
        updatedAt: timestamp,
        items: {},
      },
    ],
  };
}

export function normalizeInventory(raw) {
  const fallback = createDefaultInventory();

  if (!raw || typeof raw !== 'object') {
    return fallback;
  }

  const profiles = Array.isArray(raw.profiles)
    ? raw.profiles
        .filter((profile) => profile && typeof profile === 'object')
        .map((profile) => ({
          id: String(profile.id || 'default'),
          name: String(profile.name || 'My paints').slice(0, 48),
          createdAt: profile.createdAt || nowIso(),
          updatedAt: profile.updatedAt || nowIso(),
          items:
            profile.items && typeof profile.items === 'object'
              ? { ...profile.items }
              : {},
        }))
    : [];

  fallback.profiles = profiles.length ? profiles : fallback.profiles;
  fallback.activeProfileId =
    raw.activeProfileId &&
    fallback.profiles.some((profile) => profile.id === raw.activeProfileId)
      ? raw.activeProfileId
      : fallback.profiles[0].id;

  return fallback;
}

export function getInventoryState() {
  return inventory;
}

export function replaceInventoryState(
  nextInventory,
  { persist = true, source = 'replace' } = {}
) {
  inventory = normalizeInventory(nextInventory);
  const saved = persist ? persistInventory() : true;

  emit({
    saved,
    source,
    type: 'replace',
  });

  return { saved };
}

export function activeProfile(targetInventory = inventory) {
  const normalized = normalizeInventory(targetInventory);
  let profile = normalized.profiles.find(
    (item) => item.id === normalized.activeProfileId
  );

  if (!profile) {
    profile = normalized.profiles[0];
    normalized.activeProfileId = profile.id;
  }

  if (targetInventory === inventory && normalized !== inventory) {
    inventory = normalized;
  }

  return profile;
}

export function paintKey(paint) {
  return `${paint.brand}:${paint.id}`;
}

export function getInventoryItem(paint) {
  return activeProfile().items[paintKey(paint)] || null;
}

export function setInventoryStatus(paint, status) {
  const profile = activeProfile();
  const key = paintKey(paint);
  const timestamp = nowIso();

  if (!status) {
    delete profile.items[key];
    profile.updatedAt = timestamp;
    const saved = persistInventory();

    emit({
      saved,
      source: 'local',
      type: 'mutation',
    });

    return {
      saved,
      message: saved ? 'Removed from inventory' : 'Inventory could not be saved',
    };
  }

  profile.items[key] = {
    ...(profile.items[key] || { addedAt: timestamp }),
    status,
    updatedAt: timestamp,
  };
  profile.updatedAt = timestamp;

  const saved = persistInventory();

  emit({
    saved,
    source: 'local',
    type: 'mutation',
  });

  return {
    saved,
    message: saved
      ? status === 'owned'
        ? 'Marked as owned'
        : 'Added to wishlist'
      : 'Inventory could not be saved',
  };
}

export function setProfileName(name) {
  const profile = activeProfile();

  profile.name = String(name || 'My paints')
    .trim()
    .slice(0, 48) || 'My paints';
  profile.updatedAt = nowIso();

  const saved = persistInventory();

  emit({
    saved,
    source: 'local',
    type: 'mutation',
  });

  return { saved };
}

export function inventoryCounts(targetInventory = inventory) {
  const items = Object.values(activeProfile(targetInventory).items);
  const owned = items.filter((item) => item.status === 'owned').length;
  const wishlist = items.filter((item) => item.status === 'wishlist').length;

  return {
    owned,
    wishlist,
    total: owned + wishlist,
  };
}

export function hasInventoryItems(targetInventory = inventory) {
  return inventoryCounts(targetInventory).total > 0;
}

export function getInventorySort() {
  return inventorySort;
}

export function setInventorySort(sort) {
  inventorySort = sort;
  saveInventorySort(sort);
}

export function subscribe(listener) {
  listeners.add(listener);

  return () => listeners.delete(listener);
}
