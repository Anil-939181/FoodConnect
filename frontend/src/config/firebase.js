import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

console.log(import.meta.env.VITE_FIREBASE_API_KEY || "DUMMY_API_KEY");
// Replace these with your actual Firebase project configuration keys
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "DUMMY_API_KEY",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "DUMMY_AUTH_DOMAIN",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "DUMMY_PROJECT_ID",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "DUMMY_STORAGE_BUCKET",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "DUMMY_SENDER_ID",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "DUMMY_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
