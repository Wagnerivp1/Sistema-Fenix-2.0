
'use client';

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "API_KEY",
  authDomain: "assistec-now.firebaseapp.com",
  projectId: "assistec-now",
  storageBucket: "assistec-now.appspot.com",
  messagingSenderId: "567083944342",
  appId: "1:567083944342:web:7f6d4e287232230a109a1a",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with offline persistence
const db = initializeFirestore(app, {
  localCache: { kind: 'persistent' }
});

export { db };
