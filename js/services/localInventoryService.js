const STORAGE_KEY = 'paint_inventory';

export function saveLocalInventory(inventory) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(inventory)
  );
}

export function loadLocalInventory() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  return JSON.parse(raw);
}
