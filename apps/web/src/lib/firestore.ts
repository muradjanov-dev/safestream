// Firestore (database) + Storage (video files) handles.
// Returns null when Firebase isn't configured, so callers can fall back to localStorage.

import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { isFirebaseConfigured } from '@/lib/firebase';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

function getApp(): FirebaseApp | null {
  if (!isFirebaseConfigured || typeof window === 'undefined') return null;
  if (!app) app = getApps()[0] ?? initializeApp(firebaseConfig);
  return app;
}

export function getDb(): Firestore | null {
  const a = getApp();
  if (!a) return null;
  if (!db) db = getFirestore(a);
  return db;
}

export function getStorageInstance(): FirebaseStorage | null {
  const a = getApp();
  if (!a) return null;
  if (!storage) storage = getStorage(a);
  return storage;
}

/** True when we should use Firestore as the backend. */
export const useFirestore = isFirebaseConfigured;
