import {
  getInventoryState,
  hasInventoryItems,
  normalizeInventory,
  replaceInventoryState,
  subscribe,
} from '../stores/inventoryStore.js?v=1.0.0-beta.5';
import { loadInventory, saveInventory } from '../firebase/firestore.js?v=1.0.0-beta.5';

const SYNC_DELAY_MS = 1500;

const syncListeners = new Set();

let currentUid = null;
let syncTimeout = null;
let syncState = {
  message: 'Cloud sync is off',
  status: 'signed-out',
};

function cloneInventory(inventory) {
  return JSON.parse(JSON.stringify(normalizeInventory(inventory)));
}

function sortedInventoryPayload(inventory) {
  const normalized = normalizeInventory(inventory);

  return JSON.stringify({
    activeProfileId: normalized.activeProfileId,
    profiles: normalized.profiles
      .map((profile) => ({
        ...profile,
        items: Object.fromEntries(
          Object.entries(profile.items).sort(([a], [b]) => a.localeCompare(b))
        ),
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    version: normalized.version,
  });
}

function inventoriesMatch(left, right) {
  return sortedInventoryPayload(left) === sortedInventoryPayload(right);
}

function latestTimestamp(...values) {
  return values
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => b - a)[0];
}

function newerItem(left, right) {
  if (!left) return right;
  if (!right) return left;

  const leftUpdated = latestTimestamp(left.updatedAt, left.addedAt) || 0;
  const rightUpdated = latestTimestamp(right.updatedAt, right.addedAt) || 0;

  return leftUpdated >= rightUpdated ? left : right;
}

function mergeInventories(localInventory, cloudInventory) {
  const local = cloneInventory(localInventory);
  const cloud = cloneInventory(cloudInventory);
  const merged = cloneInventory(cloud);
  const profilesById = new Map(merged.profiles.map((profile) => [profile.id, profile]));

  for (const localProfile of local.profiles) {
    const cloudProfile = profilesById.get(localProfile.id);

    if (!cloudProfile) {
      merged.profiles.push(localProfile);
      profilesById.set(localProfile.id, localProfile);
      continue;
    }

    const localUpdated = latestTimestamp(localProfile.updatedAt) || 0;
    const cloudUpdated = latestTimestamp(cloudProfile.updatedAt) || 0;

    if (localUpdated > cloudUpdated) {
      cloudProfile.name = localProfile.name;
      cloudProfile.updatedAt = localProfile.updatedAt;
    }

    for (const [key, localItem] of Object.entries(localProfile.items)) {
      cloudProfile.items[key] = newerItem(localItem, cloudProfile.items[key]);
    }
  }

  if (local.profiles.some((profile) => profile.id === local.activeProfileId)) {
    merged.activeProfileId = local.activeProfileId;
  }

  return normalizeInventory(merged);
}

function setSyncState(status, message) {
  syncState = { message, status };
  syncListeners.forEach((listener) => listener(syncState));
}

export function subscribeToSyncState(listener) {
  syncListeners.add(listener);
  listener(syncState);

  return () => syncListeners.delete(listener);
}

export function setCurrentUser(user) {
  currentUid = user?.uid || null;
  clearTimeout(syncTimeout);

  if (!currentUid) {
    setSyncState('signed-out', 'Cloud sync is off');
  }
}

export async function hydrateInventoryFromCloud({ resolveConflict } = {}) {
  if (!currentUid) {
    return { action: 'signed-out' };
  }

  setSyncState('loading', 'Checking cloud inventory...');

  const localInventory = cloneInventory(getInventoryState());
  const cloudDocument = await loadInventory(currentUid);
  const cloudInventory = cloudDocument?.inventory
    ? normalizeInventory(cloudDocument.inventory)
    : null;

  if (!cloudInventory) {
    await saveInventory(currentUid, localInventory);
    setSyncState('synced', 'Cloud inventory created');

    return { action: 'created-cloud' };
  }

  if (inventoriesMatch(localInventory, cloudInventory)) {
    replaceInventoryState(cloudInventory, { source: 'cloud' });
    setSyncState('synced', 'Cloud inventory synced');

    return { action: 'matched-cloud' };
  }

  if (!hasInventoryItems(localInventory)) {
    replaceInventoryState(cloudInventory, { source: 'cloud' });
    setSyncState('synced', 'Cloud inventory loaded');

    return { action: 'loaded-cloud' };
  }

  const selectedAction =
    (await resolveConflict?.({
      cloudInventory,
      localInventory,
      remoteUpdatedAt: cloudDocument?.updatedAt,
    })) || 'merge';

  if (selectedAction === 'cloud') {
    replaceInventoryState(cloudInventory, { source: 'cloud' });
    setSyncState('synced', 'Cloud inventory loaded');

    return { action: 'loaded-cloud' };
  }

  if (selectedAction === 'local') {
    await saveInventory(currentUid, localInventory);
    setSyncState('synced', 'Cloud inventory overwritten');

    return { action: 'overwrote-cloud' };
  }

  const merged = mergeInventories(localInventory, cloudInventory);

  replaceInventoryState(merged, { source: 'cloud' });
  await saveInventory(currentUid, merged);
  setSyncState('synced', 'Inventories merged and synced');

  return { action: 'merged' };
}

export async function syncInventoryToCloud() {
  if (!currentUid) {
    return false;
  }

  clearTimeout(syncTimeout);
  setSyncState('saving', 'Saving inventory...');

  try {
    await saveInventory(currentUid, getInventoryState());
    setSyncState('synced', 'Cloud inventory synced');
    return true;
  } catch (error) {
    console.error('Inventory cloud sync failed', error);
    setSyncState('error', 'Cloud sync failed');
    return false;
  }
}

export function scheduleSync() {
  if (!currentUid) {
    return;
  }

  clearTimeout(syncTimeout);
  setSyncState('pending', 'Cloud sync pending...');

  syncTimeout = setTimeout(() => {
    syncInventoryToCloud();
  }, SYNC_DELAY_MS);
}

export async function overwriteCloudInventory() {
  if (!currentUid) {
    return false;
  }

  return syncInventoryToCloud();
}

subscribe((_inventory, change) => {
  if (change?.source === 'local') {
    scheduleSync();
  }
});
