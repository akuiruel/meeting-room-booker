// Firebase configuration
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBq7l6I0t9dlthzV18rpR1acL2tXfNAMQ4",
    authDomain: "pengeluaran-dd4d0.firebaseapp.com",
    projectId: "pengeluaran-dd4d0",
    storageBucket: "pengeluaran-dd4d0.firebasestorage.app",
    messagingSenderId: "254908773545",
    appId: "1:254908773545:web:88dd07ba9fdcb0cd6425b8",
    measurementId: "G-LXRTG3J8J2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
