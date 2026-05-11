import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDnqkfkO7OIM2BhwuuzWWfAOwd0uwuBO5I",
  authDomain: "prode-mundial-2026-9599d.firebaseapp.com",
  databaseURL: "https://prode-mundial-2026-9599d-default-rtdb.firebaseio.com",
  projectId: "prode-mundial-2026-9599d",
  storageBucket: "prode-mundial-2026-9599d.firebasestorage.app",
  messagingSenderId: "798316010435",
  appId: "1:798316010435:web:cd3bbf3db54f73ed90fb76",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
