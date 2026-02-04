
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Project: ckxr-webapp
const firebaseConfig = {
  apiKey: "AIzaSyAksEbd907afwMTl-8XRixUtKEGwRF5L8I",
  authDomain: "ckxr-webapp.firebaseapp.com",
  projectId: "ckxr-webapp",
  storageBucket: "ckxr-webapp.firebasestorage.app",
  messagingSenderId: "597300419746",
  appId: "1:597300419746:web:926b4362faed5ba9c70bfb",
  measurementId: "G-V6TFHW69E3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const isDbConfigured = true;
