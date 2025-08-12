
// This file is intentionally left blank.
// The application has been configured to run offline,
// so Firebase connectivity is no longer required.
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// IMPORTANT: This is a public configuration and is safe to be exposed.
// Security is handled by Firestore Security Rules.
const firebaseConfig = {
  apiKey: "API_KEY",
  authDomain: "assistec-now.firebaseapp.com",
  projectId: "assistec-now",
  storageBucket: "assistec-now.appspot.com",
  messagingSenderId: "567083944342",
  appId: "1:567083944342:web:7f6d4e287232230a109a1a",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a Firestore instance
export const db = getFirestore(app);
