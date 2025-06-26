const admin = require('firebase-admin');
const serviceAccount = require('./frontend/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedIncludeItems() {
  const includeItems = [
    {
      category: { ko: '교통', en: 'Transportation' },
      name: { ko: '왕복 교통비', en: 'Round-trip transportation' },
      description: {
        ko: '출발지에서 목적지까지의 왕복 교통비가 포함됩니다.',
        en: 'Round-trip transportation from departure point to destination is included.'
      },
      isActive: true,
      order: 1
    },
    {
      category: { ko: '교통', en: 'Transportation' },
      name: { ko: '전용 차량', en: 'Private vehicle' },
      description: {
        ko: '전용 차량으로 편안하게 이동할 수 있습니다.',
        en: 'Comfortable travel with private vehicle.'
      },
      isActive: true,
      order: 2
    },
    {
      category: { ko: '식사', en: 'Meals' },
      name: { ko: '점심 식사', en: 'Lunch' },
      description: {
        ko: '투어 중 점심 식사가 포함됩니다.',
        en: 'Lunch during the tour is included.'
      },
      isActive: true,
      order: 3
    },
    {
      category: { ko: '식사', en: 'Meals' },
      name: { ko: '저녁 식사', en: 'Dinner' },
      description: {
        ko: '투어 중 저녁 식사가 포함됩니다.',
        en: 'Dinner during the tour is included.'
      },
      isActive: true,
      order: 4
    },
    {
      category: { ko: '숙박', en: 'Accommodation' },
      name: { ko: '호텔 숙박', en: 'Hotel accommodation' },
      description: {
        ko: '3성급 이상 호텔에서 숙박할 수 있습니다.',
        en: 'Stay at 3-star or higher hotel.'
      },
      isActive: true,
      order: 5
    },
    {
      category: { ko: '가이드', en: 'Guide' },
      name: { ko: '전문 가이드', en: 'Professional guide' },
      description: {
        ko: '경험 많은 전문 가이드가 동행합니다.',
        en: 'Experienced professional guide accompanies.'
      },
      isActive: true,
      order: 6
    },
    {
      category: { ko: '입장료', en: 'Entrance fees' },
      name: { ko: '관광지 입장료', en: 'Tourist attraction entrance fees' },
      description: {
        ko: '방문하는 모든 관광지의 입장료가 포함됩니다.',
        en: 'Entrance fees for all tourist attractions are included.'
      },
      isActive: true,
      order: 7
    },
    {
      category: { ko: '보험', en: 'Insurance' },
      name: { ko: '여행자 보험', en: 'Travel insurance' },
      description: {
        ko: '기본 여행자 보험이 포함됩니다.',
        en: 'Basic travel insurance is included.'
      },
      isActive: true,
      order: 8
    }
  ];

  // 기존 데이터 삭제
  const existingItems = await db.collection('include-items').get();
  const deletePromises = existingItems.docs.map(doc => doc.ref.delete());
  await Promise.all(deletePromises);
  console.log('Deleted existing include-items');

  // 새 데이터 추가
  for (const item of includeItems) {
    await db.collection('include-items').add(item);
    console.log(`Added include item: ${item.name.ko}`);
  }
  
  console.log('Include items seeding completed!');
  process.exit();
}

seedIncludeItems(); 