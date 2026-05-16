const listeners = new Set();

let inventory = [];

function emit() {
  listeners.forEach((listener) => listener(inventory));
}

export function getInventory() {
  return inventory;
}

export function setInventory(newInventory) {
  inventory = [...newInventory];

  emit();
}

export function addPaint(paint) {
  inventory.push(paint);

  emit();
}

export function removePaint(id) {
  inventory = inventory.filter((paint) => paint.id !== id);

  emit();
}

export function subscribe(listener) {
  listeners.add(listener);

  return () => listeners.delete(listener);
}
