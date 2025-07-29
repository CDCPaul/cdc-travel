import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

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
  
  // 환경 변수에서 직접 JSON 가져오기 (우선순위)
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    try {
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch (error) {
      console.error('Firebase Admin SDK JSON 파싱 오류:', error);
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON format');
    }
  } else {
    // 파일 경로에서 읽기 (fallback)
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    if (!serviceAccountPath) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH environment variable is required');
    }

    try {
      // fs 모듈을 사용하여 파일 읽기
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path');
      const absolutePath = path.resolve(process.cwd(), serviceAccountPath);
      
      if (!fs.existsSync(absolutePath)) {
        throw new Error(`File not found: ${absolutePath}`);
      }
      
      const fileContent = fs.readFileSync(absolutePath, 'utf8');
      serviceAccount = JSON.parse(fileContent);
    } catch (error) {
      console.error('Firebase Admin SDK 초기화 오류:', error);
      throw new Error(`Firebase service account key file not found at ${serviceAccountPath}. Please ensure the file exists and the path is correct.`);
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

export function getAdminAuth() {
  const adminApp = initializeFirebaseAdmin();
  return getAuth(adminApp);
}

// 빌드 시에는 null 반환, 런타임에만 실제 초기화
// process.env.NODE_ENV === 'production' && !process.env.FIREBASE_SERVICE_ACCOUNT_JSON 조건으로 빌드 시 초기화 방지
export const adminStorage = (process.env.NODE_ENV === 'production' && !process.env.FIREBASE_SERVICE_ACCOUNT_JSON) ? null : getAdminStorage();
export const adminDb = (process.env.NODE_ENV === 'production' && !process.env.FIREBASE_SERVICE_ACCOUNT_JSON) ? null : getAdminDb();
export const adminAuth = (process.env.NODE_ENV === 'production' && !process.env.FIREBASE_SERVICE_ACCOUNT_JSON) ? null : getAdminAuth();
export { app }; 