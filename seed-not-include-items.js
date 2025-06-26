const admin = require('firebase-admin');
const serviceAccount = require('./frontend/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedNotIncludeItems() {
  const notIncludeItems = [
    {
      category: { ko: '교통', en: 'Transportation' },
      name: { ko: '개인 교통비', en: 'Personal transportation' },
      description: {
        ko: '투어 시작 전과 종료 후의 개인 교통비는 포함되지 않습니다.',
        en: 'Personal transportation before tour start and after tour end is not included.'
      },
      isActive: true,
      order: 1
    },
    {
      category: { ko: '식사', en: 'Meals' },
      name: { ko: '개인 식사', en: 'Personal meals' },
      description: {
        ko: '투어에 포함되지 않은 개인 식사는 포함되지 않습니다.',
        en: 'Personal meals not included in the tour are not covered.'
      },
      isActive: true,
      order: 2
    },
    {
      category: { ko: '숙박', en: 'Accommodation' },
      name: { ko: '투어 전후 숙박', en: 'Pre/post tour accommodation' },
      description: {
        ko: '투어 시작 전과 종료 후의 숙박은 포함되지 않습니다.',
        en: 'Accommodation before tour start and after tour end is not included.'
      },
      isActive: true,
      order: 3
    },
    {
      category: { ko: '입장료', en: 'Entrance fees' },
      name: { ko: '선택 관광지', en: 'Optional attractions' },
      description: {
        ko: '선택적으로 방문하는 관광지의 입장료는 포함되지 않습니다.',
        en: 'Entrance fees for optional attractions are not included.'
      },
      isActive: true,
      order: 4
    },
    {
      category: { ko: '개인비용', en: 'Personal expenses' },
      name: { ko: '개인 쇼핑', en: 'Personal shopping' },
      description: {
        ko: '개인적인 쇼핑 비용은 포함되지 않습니다.',
        en: 'Personal shopping expenses are not included.'
      },
      isActive: true,
      order: 5
    },
    {
      category: { ko: '개인비용', en: 'Personal expenses' },
      name: { ko: '개인 팁', en: 'Personal tips' },
      description: {
        ko: '가이드나 운전기사에게 주는 개인 팁은 포함되지 않습니다.',
        en: 'Personal tips for guides or drivers are not included.'
      },
      isActive: true,
      order: 6
    },
    {
      category: { ko: '보험', en: 'Insurance' },
      name: { ko: '추가 보험', en: 'Additional insurance' },
      description: {
        ko: '기본 보험 외 추가 보험은 포함되지 않습니다.',
        en: 'Additional insurance beyond basic coverage is not included.'
      },
      isActive: true,
      order: 7
    },
    {
      category: { ko: '기타', en: 'Others' },
      name: { ko: '개인 의료비', en: 'Personal medical expenses' },
      description: {
        ko: '개인적인 의료비나 약품비는 포함되지 않습니다.',
        en: 'Personal medical expenses or medication costs are not included.'
      },
      isActive: true,
      order: 8
    }
  ];

  // 기존 데이터 삭제
  const existingItems = await db.collection('not-include-items').get();
  const deletePromises = existingItems.docs.map(doc => doc.ref.delete());
  await Promise.all(deletePromises);
  console.log('Deleted existing not-include-items');

  // 새 데이터 추가
  for (const item of notIncludeItems) {
    await db.collection('not-include-items').add(item);
    console.log(`Added not-include item: ${item.name.ko}`);
  }
  
  console.log('Not-include items seeding completed!');
  process.exit();
}

seedNotIncludeItems(); 