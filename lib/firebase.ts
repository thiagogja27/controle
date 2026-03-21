// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Database, getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA8DbMSU96gaxqFYKDfC0fhakhwly6Iv78",
  authDomain: "controle-diversos.firebaseapp.com",
  databaseURL: "https://controle-diversos-default-rtdb.firebaseio.com",
  projectId: "controle-diversos",
  storageBucket: "controle-diversos.appspot.com",
  messagingSenderId: "531212269985",
  appId: "1:531212269985:web:ebb9f8decc7f28573eb3e0"
};

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