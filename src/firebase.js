import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace this with your actual Firebase Config object
// 1. Go to Firebase Console (console.firebase.google.com)
// 2. Create a new Web App
// 3. Enable 'Email/Password' in Authentication > Sign-in method
// 4. Copy the config object below:
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDoJ40IpTdT8PeHOa771m4HNlUAfjHf0Bg",
  authDomain: "smart-yoga-mat-c1b5c.firebaseapp.com",
  projectId: "smart-yoga-mat-c1b5c",
  storageBucket: "smart-yoga-mat-c1b5c.firebasestorage.app",
  messagingSenderId: "533022631721",
  appId: "1:533022631721:web:ad51eb7b354a6af9887938",
  measurementId: "G-464GLLZN5R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
