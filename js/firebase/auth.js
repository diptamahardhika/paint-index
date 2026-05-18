import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';

import { firebaseApp, isFirebaseConfigured } from './config.js?v=1.0.0-beta.5';

const auth = isFirebaseConfigured ? getAuth(firebaseApp) : null;

const provider = new GoogleAuthProvider();

provider.setCustomParameters({
  prompt: 'select_account',
});

export async function loginWithGoogle() {
  if (!auth) {
    throw new Error('Firebase is not configured');
  }

  const result = await signInWithPopup(auth, provider);

  return result.user;
}

export async function logoutUser() {
  if (!auth) {
    return;
  }

  await signOut(auth);
}

export function subscribeToAuth(callback) {
  if (!auth) {
    callback(null);

    return () => {};
  }

  return onAuthStateChanged(auth, callback);
}

export { auth };
