import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBURnqjTL1Id_-EUQoIYYJdC-_a3b4FVZM",
  authDomain: "sensale-63ff8.firebaseapp.com",
  projectId: "sensale-63ff8",
  storageBucket: "sensale-63ff8.firebasestorage.app",
  messagingSenderId: "539605319788",
  appId: "1:539605319788:web:1dd060b8a0e76fd4071849",
  measurementId: "G-4CEHGR9F40"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
