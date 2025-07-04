import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD0E3dFYjzexk74---sWt-3AslSCRFze4s",
  authDomain: "cdc-home-fb4d1.firebaseapp.com",
  projectId: "cdc-home-fb4d1",
  storageBucket: "cdc-home-fb4d1.firebasestorage.app",
  messagingSenderId: "761536582659",
  appId: "1:761536582659:web:b87d45fc4b91a087f16a36",
  measurementId: "G-5BSXT1V2W1"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app); 