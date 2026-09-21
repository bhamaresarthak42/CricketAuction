import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from "firebase/auth";

/**
 * Firebase Configuration for project: cricket-auction
 */
const firebaseConfig = {
  apiKey: "AIzaSyBn027WrP5QXI9o_navr5OJkzNRAKPkNAU",
  authDomain: "cricket-auction-a2f15.firebaseapp.com",
  databaseURL: "https://cricket-auction-a2f15-default-rtdb.firebaseio.com",
  projectId: "cricket-auction-a2f15",
  storageBucket: "cricket-auction-a2f15.firebasestorage.app",
  messagingSenderId: "899656474523",
  appId: "1:899656474523:web:3ba6e5ccd31d0fa23b8b3e",
  measurementId: "G-YCL2BVB42D"
};

// Initialize Firebase Application
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export { signInAnonymously, onAuthStateChanged, signOut };

// Initialize Firebase Analytics (optional browser check)
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

// Initialize Firebase Firestore (Teams, Players, Rosters)
export const db = getFirestore(app);

// Initialize Firebase Realtime Database (Live auction state & rapid bidding)
// Explicitly pass databaseURL to guarantee cross-tab WebSocket synchronization across all devices
export const rtdb = getDatabase(app, firebaseConfig.databaseURL);

// Initialize Firebase Storage (Player profile pictures & Team logos)
export const storage = getStorage(app);

export default app;
