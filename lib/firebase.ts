import { initializeApp, getApps, getApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Database, getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if we have an API Key (prevents build errors)
let app;
try {
    if (firebaseConfig.apiKey) {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    }
} catch (error) {
    console.error("Firebase initialization error:", error);
}

const auth = (app ? getAuth(app) : null) as Auth;
const db = (app ? getDatabase(app) : {}) as Database;

export { app, auth, db };
