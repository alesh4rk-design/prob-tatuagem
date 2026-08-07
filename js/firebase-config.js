// Pro'Ink — Firebase Config

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAC7dqhWfwjK1XixZm7FMzGzKoUKHnUNIA",
  authDomain: "prob-tatuagem.firebaseapp.com",
  projectId: "prob-tatuagem",
  storageBucket: "prob-tatuagem.firebasestorage.app",
  messagingSenderId: "151431512598",
  appId: "1:151431512598:web:f25865912348ba01fc6b37"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
