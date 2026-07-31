// Pro'Ink — Firebase Config
// ATENÇÃO: ainda aponta pro projeto Firebase do Pro'Bronze (pro-b-bronze) como placeholder.
// Antes de qualquer teste real, crie um projeto Firebase separado pro Pro'Ink e troque os
// valores abaixo pelos dele (Firebase Console > Configurações do projeto > SDK config) —
// usar o projeto do Pro'Bronze aqui gravaria dados de tatuagem no banco de produção errado.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCd43MswTK67CbddpLLyWNou8uTv9W3Chc",
  authDomain: "pro-b-bronze.firebaseapp.com",
  projectId: "pro-b-bronze",
  storageBucket: "pro-b-bronze.firebasestorage.app",
  messagingSenderId: "724732352512",
  appId: "1:724732352512:web:e02aaef77e9711c47be0e5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
