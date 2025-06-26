const admin = require('firebase-admin');
const serviceAccount = require('./frontend/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedSettings() {
  // 사이트 기본 설정
  const siteSettings = {
    siteName: { ko: 'CDC Travel', en: 'CDC Travel' },
    siteDescription: {
      ko: '한국 여행의 모든 것, CDC Travel에서 만나보세요',
      en: 'Everything about Korea travel, meet at CDC Travel'
    },
    contactEmail: 'info@cdctravel.com',
    contactPhone: '+82-2-1234-5678',
    address: {
      ko: '서울특별시 강남구 테헤란로 123',
      en: '123 Teheran-ro, Gangnam-gu, Seoul'
    },
    socialMedia: {
      facebook: 'https://facebook.com/cdctravel',
      instagram: 'https://instagram.com/cdctravel',
      twitter: 'https://twitter.com/cdctravel',
      youtube: 'https://youtube.com/cdctravel'
    },
    businessHours: {
      ko: '월-금: 09:00-18:00, 토: 09:00-15:00, 일: 휴무',
      en: 'Mon-Fri: 09:00-18:00, Sat: 09:00-15:00, Sun: Closed'
    },
    timezone: 'Asia/Seoul',
    currency: 'KRW',
    language: 'ko',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // 메인페이지 설정
  const mainPageSettings = {
    bannerVideo: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    bannerImage: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1920',
    mainTitle: {
      ko: '한국 여행의 모든 것',
      en: 'Everything About Korea Travel'
    },
    mainSubtitle: {
      ko: '전문 가이드와 함께하는 특별한 한국 여행',
      en: 'Special Korea travel with professional guides'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // 기존 데이터 삭제
  const existingSettings = await db.collection('settings').get();
  const deletePromises = existingSettings.docs.map(doc => doc.ref.delete());
  await Promise.all(deletePromises);
  console.log('Deleted existing settings');

  // 새 데이터 추가
  await db.collection('settings').doc('site').set(siteSettings);
  console.log('Added site settings');

  await db.collection('settings').doc('mainPage').set(mainPageSettings);
  console.log('Added main page settings');
  
  console.log('Settings seeding completed!');
  process.exit();
}

seedSettings(); 