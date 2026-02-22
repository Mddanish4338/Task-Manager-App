import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB0AVK2cJMoqu5w1iNqV867wcJ46yQbjvA",
  authDomain: "coursecraft-2bd9a.firebaseapp.com",
  projectId: "coursecraft-2bd9a",
  storageBucket: "coursecraft-2bd9a.firebasestorage.app",
  messagingSenderId: "16915243623",
  appId: "1:16915243623:web:5099af4e8a29e41f3a2ac2",
  measurementId: "G-7K2M61KT6R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;