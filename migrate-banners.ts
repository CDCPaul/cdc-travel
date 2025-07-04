// Firestore 마이그레이션 스크립트: settings/banners 컬렉션에 예시 배너 2개 추가
// 실행 전: Firebase Admin SDK 서비스 계정 키 필요

import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Banner } from './types/banner';
import * as serviceAccountKey from './serviceAccountKey.json';

// 서비스 계정 정보 사용
const serviceAccount: ServiceAccount = serviceAccountKey as ServiceAccount;

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function migrateBanners() {
  const banners: Omit<Banner, 'id'>[] = [
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&h=1080&fit=crop',
      link: '/about-us',
      title_ko: '아름다운 여행지',
      title_en: 'Beautiful Destinations',
      order: 1,
      active: true,
      createdAt: Date.now(),
    },
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop',
      link: '/tours',
      title_ko: '특별한 여행 경험',
      title_en: 'Special Travel Experience',
      order: 2,
      active: true,
      createdAt: Date.now(),
    },
  ];

  try {
    console.log('🚀 배너 마이그레이션을 시작합니다...');
    
    for (const banner of banners) {
      const docRef = await db.collection('settings').doc('banners').collection('items').add(banner);
      await docRef.update({ id: docRef.id });
      console.log(`✅ Banner added: ${docRef.id}`);
    }
    
    console.log('🎉 Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateBanners().catch(console.error); 