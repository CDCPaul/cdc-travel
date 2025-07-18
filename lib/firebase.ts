import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAuth, Auth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// 빌드 시에는 초기화하지 않음
let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;
let auth: Auth;
let googleProvider: GoogleAuthProvider;
let analytics: Analytics | null = null;

// 클라이언트 사이드에서만 Firebase 초기화
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  
  // Gmail API 권한 추가
  googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');
  
  // Analytics 초기화 (브라우저 환경에서만)
  isSupported().then(yes => yes ? getAnalytics(app) : null).then(analyticsInstance => {
    analytics = analyticsInstance;
  });
} else {
  // 빌드 시에는 더미 객체 생성
  app = {} as FirebaseApp;
  db = {} as Firestore;
  storage = {} as FirebaseStorage;
  auth = {} as Auth;
  googleProvider = {} as GoogleAuthProvider;
}

export { app, db, storage, auth, googleProvider, analytics }; 