const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: '.env.local' });

const OLD_BUCKET = 'cdc-home-fb4d1.firebasestorage.app';
const NEW_BUCKET = 'cdc-home-fb4d1.appspot.com';

// 환경변수에서 Admin SDK 정보 읽기
initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore();

async function migrateCollection(collectionName, urlFields) {
  const snapshot = await db.collection(collectionName).get();
  let updated = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    let changed = false;

    // 각 필드에 대해 URL 교체
    for (const field of urlFields) {
      if (typeof data[field] === 'string' && data[field].includes(OLD_BUCKET)) {
        data[field] = data[field].replace(OLD_BUCKET, NEW_BUCKET);
        changed = true;
      }
      // 배열(여러 이미지)인 경우
      if (Array.isArray(data[field])) {
        const newArr = data[field].map(url =>
          typeof url === 'string' && url.includes(OLD_BUCKET)
            ? url.replace(OLD_BUCKET, NEW_BUCKET)
            : url
        );
        if (JSON.stringify(newArr) !== JSON.stringify(data[field])) {
          data[field] = newArr;
          changed = true;
        }
      }
    }

    if (changed) {
      await doc.ref.update(data);
      updated++;
      console.log(`[${collectionName}] Updated: ${doc.id}`);
    }
  }
  console.log(`[${collectionName}] Migration complete. Updated ${updated} docs.`);
}

async function migrateProductScheduleSpotImages() {
  const snapshot = await db.collection('products').get();
  let updated = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    let changed = false;

    if (Array.isArray(data.schedule)) {
      for (const day of data.schedule) {
        if (Array.isArray(day.spots)) {
          for (const spot of day.spots) {
            if (
              typeof spot.spotImage === 'string' &&
              spot.spotImage.includes(OLD_BUCKET)
            ) {
              spot.spotImage = spot.spotImage.replace(OLD_BUCKET, NEW_BUCKET);
              changed = true;
            }
          }
        }
      }
    }

    if (changed) {
      await doc.ref.update({ schedule: data.schedule });
      updated++;
      console.log(`[products.schedule.spots.spotImage] Updated: ${doc.id}`);
    }
  }
  console.log(`[products.schedule.spots.spotImage] Migration complete. Updated ${updated} docs.`);
}

async function main() {
  // 기존 컬렉션
  await migrateCollection('products', ['imageUrls']);
  await migrateCollection('spots', ['imageUrl', 'extraImages']);
  // 여행정보 컬렉션
  await migrateCollection('travel-info', ['imageUrls', 'imageUrl', 'extraImages']);
  // 배너 서브컬렉션
  await migrateCollection('settings/banners/items', ['url']);
  // products 일정 내 spotImage
  await migrateProductScheduleSpotImages();
  // 필요시 다른 컬렉션/필드 추가
}

main().then(() => {
  console.log('Migration finished.');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
}); 