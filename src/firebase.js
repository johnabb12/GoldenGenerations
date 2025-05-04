import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBie8bXzo9aD5YLJPiiSWLaQ3z1pxGCKrk",
  authDomain: "golden-generation-21928.firebaseapp.com",
  projectId: "golden-generation-21928",
  storageBucket: "golden-generation-21928.firebasestorage.app",
  messagingSenderId: "30086857682",
  appId: "1:30086857682:web:5985d2b05c8f259c24be0b",
  measurementId: "G-H9XFPYK4ET"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, auth, db, storage }; 