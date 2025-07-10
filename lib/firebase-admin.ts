import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';

let app: App | null = null;

export function initializeFirebaseAdmin(): App {
  if (app) {
    return app;
  }

  if (getApps().length > 0) {
    app = getApps()[0];
    return app;
  }

  let serviceAccount;
  
  if (process.env.NODE_ENV === 'production') {
    // 프로덕션 환경 (Vercel 등)
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is required in production');
    }
    serviceAccount = JSON.parse(serviceAccountJson);
  } else {
    // 개발 환경 (development, test 등)
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      serviceAccount = require('./cdc-home-fb4d1-firebase-adminsdk.json');
    } catch {
      throw new Error('Firebase service account key file not found. Please ensure cdc-home-fb4d1-firebase-adminsdk.json exists in lib/ directory for local development.');
    }
  }
  
  app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: 'cdc-home-fb4d1',
  });
  
  return app;
}

export function getAdminStorage() {
  const adminApp = initializeFirebaseAdmin();
  return getStorage(adminApp);
}

export function getAdminDb() {
  const adminApp = initializeFirebaseAdmin();
  return getFirestore(adminApp);
}

// 빌드 시에는 null 반환, 런타임에만 실제 초기화
// process.env.NODE_ENV === 'production' && !process.env.FIREBASE_SERVICE_ACCOUNT_JSON 조건으로 빌드 시 초기화 방지
export const adminStorage = (process.env.NODE_ENV === 'production' && !process.env.FIREBASE_SERVICE_ACCOUNT_JSON) ? null : getAdminStorage();
export const adminDb = (process.env.NODE_ENV === 'production' && !process.env.FIREBASE_SERVICE_ACCOUNT_JSON) ? null : getAdminDb();
export { app }; 