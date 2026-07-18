import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';

const firebaseConfig = {
  apiKey: window.__PAINT_INDEX_FIREBASE_CONFIG__?.apiKey,
  authDomain: window.__PAINT_INDEX_FIREBASE_CONFIG__?.authDomain,
  projectId: window.__PAINT_INDEX_FIREBASE_CONFIG__?.projectId,
  storageBucket: window.__PAINT_INDEX_FIREBASE_CONFIG__?.storageBucket,
  messagingSenderId: window.__PAINT_INDEX_FIREBASE_CONFIG__?.messagingSenderId,
  appId: window.__PAINT_INDEX_FIREBASE_CONFIG__?.appId,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

export const firebaseApp = isFirebaseConfigured
  ? initializeApp(firebaseConfig)
  : null;
