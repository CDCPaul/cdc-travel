import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';

// 키 파일 경로
const serviceAccountPath = path.join(process.cwd(), 'lib', 'cdc-home-fb4d1-firebase-adminsdk.json');

let app: App;

if (!getApps().length) {
  app = initializeApp({
    credential: cert(serviceAccountPath),
    storageBucket: 'cdc-home-fb4d1',
  });
} else {
  app = getApps()[0];
}

// Firebase Admin Storage 초기화
export const adminStorage = getStorage(app);
export const adminDb = getFirestore(app);

export { app }; 