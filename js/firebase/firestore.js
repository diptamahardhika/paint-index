import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

import { firebaseApp, isFirebaseConfigured } from './config.js?v=1.0.0-beta.5';

const db = isFirebaseConfigured ? getFirestore(firebaseApp) : null;

function requireFirestore() {
  if (!db) {
    throw new Error('Firebase is not configured');
  }

  return db;
}

export async function saveInventory(uid, inventory) {
  const ref = doc(requireFirestore(), 'users', uid, 'inventory', 'default');

  await setDoc(
    ref,
    {
      inventory,
      updatedAt: Date.now(),
      version: 1,
    },
    { merge: true }
  );
}

export async function loadInventory(uid) {
  const ref = doc(requireFirestore(), 'users', uid, 'inventory', 'default');

  const snapshot = await getDoc(ref);

  if (snapshot.exists()) {
    return snapshot.data();
  }

  const legacyRef = doc(requireFirestore(), 'users', uid);
  const legacySnapshot = await getDoc(legacyRef);

  if (legacySnapshot.exists() && legacySnapshot.data()?.inventory) {
    return legacySnapshot.data();
  }

  return null;
}
