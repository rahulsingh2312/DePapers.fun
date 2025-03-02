// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhvKhGhNXY_J-YDVjP6HXL_XZLKMTpK9Q",
  authDomain: "tradesync-7507f.firebaseapp.com",
  databaseURL: "https://tradesync-7507f-default-rtdb.firebaseio.com",
  projectId: "tradesync-7507f",
  storageBucket: "tradesync-7507f.firebasestorage.app",
  messagingSenderId: "629393996092",
  appId: "1:629393996092:web:492876e344e37c89c98639",
  measurementId: "G-2RVVPRS2RF"
};

// Initialize Firebase with error handling
let app;
let db;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export { app, db };