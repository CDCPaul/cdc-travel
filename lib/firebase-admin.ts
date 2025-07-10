import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';

let app: App;

if (!getApps().length) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is required');
  }
  
  const serviceAccount = JSON.parse(serviceAccountJson);
  
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