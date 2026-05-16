import { saveInventory } from '../firebase/firestore.js';
import { getInventory } from '../stores/inventoryStore.js';

let currentUid = null;

let syncTimeout = null;

export function setCurrentUid(uid) {
  currentUid = uid;
}

export async function syncInventoryToCloud() {
  if (!currentUid) {
    return;
  }

  const inventory = getInventory();

  await saveInventory(currentUid, inventory);
}

export function scheduleSync() {
  clearTimeout(syncTimeout);

  syncTimeout = setTimeout(() => {
    syncInventoryToCloud();
  }, 1500);
}
