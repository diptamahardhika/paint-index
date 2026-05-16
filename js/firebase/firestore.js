import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

import { firebaseApp } from './config.js';

const db = getFirestore(firebaseApp);

export async function saveInventory(uid, inventory) {
  const ref = doc(db, 'users', uid);

  await setDoc(ref, {
    inventory,
    updatedAt: Date.now(),
    version: 1,
  });
}

export async function loadInventory(uid) {
  const ref = doc(db, 'users', uid);

  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data();
}
