export const INVENTORY_STORAGE_KEY = 'paint-index.inventory.v1';
export const INVENTORY_SORT_STORAGE_KEY = 'paint-index.inventory-sort';

export function saveLocalInventory(inventory) {
  localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
}

export function loadLocalInventory() {
  const raw = localStorage.getItem(INVENTORY_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  return JSON.parse(raw);
}

export function loadInventorySort(fallback = 'name') {
  return localStorage.getItem(INVENTORY_SORT_STORAGE_KEY) || fallback;
}

export function saveInventorySort(sort) {
  localStorage.setItem(INVENTORY_SORT_STORAGE_KEY, sort);
}
