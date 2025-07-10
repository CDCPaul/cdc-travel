import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';

let app: App;

if (!getApps().length) {
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } else {
    // 로컬 개발용 파일 로드
    serviceAccount = require('./cdc-home-fb4d1-firebase-adminsdk.json');
  }
  app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: 'cdc-home-fb4d1',
  });
} else {
  app = getApps()[0];
}

export const adminStorage = getStorage(app);
export const adminDb = getFirestore(app);
export { app }; 