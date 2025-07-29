import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// 빌드 시에만 환경 변수 체크 (런타임에서는 무시됨)
if (typeof window === 'undefined' && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  console.warn('Firebase 환경 변수가 설정되지 않았습니다. 빌드 시에만 이 경고가 표시됩니다.');
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Analytics 지연 로드 (필요할 때만 초기화)
let analytics: Analytics | null = null;

export const initAnalytics = async () => {
  if (typeof window !== 'undefined' && !analytics) {
    const { isSupported, getAnalytics } = await import('firebase/analytics');
    const supported = await isSupported();
    if (supported) {
      analytics = getAnalytics(app);
    }
  }
  return analytics;
};

export const db = getFirestore(app);
// Firebase Storage 초기화 (기본 설정 사용)
export const storage = getStorage(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Gmail API 권한 추가
googleProvider.addScope('https://www.googleapis.com/auth/gmail.compose');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.modify');

export { app, analytics }; 