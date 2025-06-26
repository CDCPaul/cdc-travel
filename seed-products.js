const admin = require('firebase-admin');
const serviceAccount = require('./frontend/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedProducts() {
  const products = [
    {
      title: { ko: '서울 1박 2일 투어', en: 'Seoul 1 Night 2 Days Tour' },
      subtitle: { ko: '서울의 핵심 관광지를 둘러보는 완벽한 투어', en: 'Perfect tour to explore Seoul\'s core attractions' },
      description: {
        ko: '경복궁, 남산타워, 명동, 홍대 등 서울의 대표 관광지를 둘러보는 1박 2일 투어입니다. 한국의 전통과 현대를 모두 체험할 수 있습니다.',
        en: 'A 1-night 2-day tour exploring Seoul\'s representative attractions including Gyeongbokgung Palace, N Seoul Tower, Myeongdong, and Hongdae. Experience both traditional and modern Korea.'
      },
      duration: { ko: '1박 2일', en: '1 Night 2 Days' },
      price: { ko: '350,000원', en: '350,000 KRW' },
      originalPrice: { ko: '400,000원', en: '400,000 KRW' },
      discount: 12.5,
      imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
      category: { ko: '도시투어', en: 'City Tour' },
      region: { ko: '서울', en: 'Seoul' },
      difficulty: { ko: '쉬움', en: 'Easy' },
      maxGroupSize: 15,
      minAge: 5,
      languages: ['ko', 'en', 'ja', 'zh'],
      highlights: [
        { ko: '경복궁 관람', en: 'Gyeongbokgung Palace Visit' },
        { ko: '남산타워 전망', en: 'N Seoul Tower View' },
        { ko: '명동 쇼핑', en: 'Myeongdong Shopping' },
        { ko: '홍대 거리 탐방', en: 'Hongdae Street Exploration' }
      ],
      schedule: [
        {
          day: 1,
          title: { ko: '첫째 날', en: 'Day 1' },
          activities: [
            { ko: '09:00 - 서울역 집합', en: '09:00 - Meet at Seoul Station' },
            { ko: '10:00 - 경복궁 관람', en: '10:00 - Visit Gyeongbokgung Palace' },
            { ko: '12:00 - 전통 한식 점심', en: '12:00 - Traditional Korean Lunch' },
            { ko: '14:00 - 남산타워 방문', en: '14:00 - Visit N Seoul Tower' },
            { ko: '16:00 - 명동 쇼핑', en: '16:00 - Myeongdong Shopping' },
            { ko: '18:00 - 호텔 체크인', en: '18:00 - Hotel Check-in' }
          ]
        },
        {
          day: 2,
          title: { ko: '둘째 날', en: 'Day 2' },
          activities: [
            { ko: '08:00 - 호텔 조식', en: '08:00 - Hotel Breakfast' },
            { ko: '09:00 - 홍대 거리 탐방', en: '09:00 - Hongdae Street Exploration' },
            { ko: '12:00 - 현대식 한식 점심', en: '12:00 - Modern Korean Lunch' },
            { ko: '14:00 - 자유 시간', en: '14:00 - Free Time' },
            { ko: '16:00 - 서울역 해산', en: '16:00 - Disband at Seoul Station' }
          ]
        }
      ],
      includedItems: ['교통비', '숙박', '가이드', '입장료'],
      notIncludedItems: ['개인 식사', '개인 쇼핑', '개인 팁'],
      requirements: [
        { ko: '여권 또는 신분증', en: 'Passport or ID' },
        { ko: '편안한 신발', en: 'Comfortable shoes' },
        { ko: '카메라', en: 'Camera' }
      ],
      notes: [
        { ko: '날씨에 따라 일정이 변경될 수 있습니다.', en: 'Schedule may change depending on weather.' },
        { ko: '최소 5명 이상 출발합니다.', en: 'Minimum 5 people required for departure.' }
      ],
      isActive: true,
      isFeatured: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: { ko: '부산 2박 3일 투어', en: 'Busan 2 Nights 3 Days Tour' },
      subtitle: { ko: '부산의 아름다운 해변과 문화를 체험하는 투어', en: 'Experience Busan\'s beautiful beaches and culture' },
      description: {
        ko: '해운대, 광안대교, 감천문화마을 등 부산의 대표 관광지를 둘러보는 2박 3일 투어입니다. 바다와 도시의 조화를 느껴보세요.',
        en: 'A 2-night 3-day tour exploring Busan\'s representative attractions including Haeundae Beach, Gwangan Bridge, and Gamcheon Culture Village. Feel the harmony of sea and city.'
      },
      duration: { ko: '2박 3일', en: '2 Nights 3 Days' },
      price: { ko: '450,000원', en: '450,000 KRW' },
      originalPrice: { ko: '500,000원', en: '500,000 KRW' },
      discount: 10,
      imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
      category: { ko: '해변투어', en: 'Beach Tour' },
      region: { ko: '부산', en: 'Busan' },
      difficulty: { ko: '쉬움', en: 'Easy' },
      maxGroupSize: 12,
      minAge: 5,
      languages: ['ko', 'en'],
      highlights: [
        { ko: '해운대 해변', en: 'Haeundae Beach' },
        { ko: '광안대교 야경', en: 'Gwangan Bridge Night View' },
        { ko: '감천문화마을', en: 'Gamcheon Culture Village' },
        { ko: '부산타워', en: 'Busan Tower' }
      ],
      schedule: [
        {
          day: 1,
          title: { ko: '첫째 날', en: 'Day 1' },
          activities: [
            { ko: '09:00 - 부산역 집합', en: '09:00 - Meet at Busan Station' },
            { ko: '10:00 - 해운대 해변', en: '10:00 - Haeundae Beach' },
            { ko: '12:00 - 해산물 점심', en: '12:00 - Seafood Lunch' },
            { ko: '14:00 - 부산타워', en: '14:00 - Busan Tower' },
            { ko: '18:00 - 호텔 체크인', en: '18:00 - Hotel Check-in' }
          ]
        },
        {
          day: 2,
          title: { ko: '둘째 날', en: 'Day 2' },
          activities: [
            { ko: '08:00 - 호텔 조식', en: '08:00 - Hotel Breakfast' },
            { ko: '09:00 - 감천문화마을', en: '09:00 - Gamcheon Culture Village' },
            { ko: '12:00 - 부산 전통 음식', en: '12:00 - Busan Traditional Food' },
            { ko: '14:00 - 자유 시간', en: '14:00 - Free Time' },
            { ko: '19:00 - 광안대교 야경', en: '19:00 - Gwangan Bridge Night View' }
          ]
        },
        {
          day: 3,
          title: { ko: '셋째 날', en: 'Day 3' },
          activities: [
            { ko: '08:00 - 호텔 조식', en: '08:00 - Hotel Breakfast' },
            { ko: '09:00 - 국제시장', en: '09:00 - Jagalchi Market' },
            { ko: '12:00 - 부산역 해산', en: '12:00 - Disband at Busan Station' }
          ]
        }
      ],
      includedItems: ['교통비', '숙박', '가이드', '입장료'],
      notIncludedItems: ['개인 식사', '개인 쇼핑', '개인 팁'],
      requirements: [
        { ko: '여권 또는 신분증', en: 'Passport or ID' },
        { ko: '수영복 (선택)', en: 'Swimsuit (optional)' },
        { ko: '카메라', en: 'Camera' }
      ],
      notes: [
        { ko: '해수욕장 이용은 계절에 따라 제한될 수 있습니다.', en: 'Beach use may be limited depending on season.' },
        { ko: '최소 4명 이상 출발합니다.', en: 'Minimum 4 people required for departure.' }
      ],
      isActive: true,
      isFeatured: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // 기존 데이터 삭제
  const existingProducts = await db.collection('products').get();
  const deletePromises = existingProducts.docs.map(doc => doc.ref.delete());
  await Promise.all(deletePromises);
  console.log('Deleted existing products');

  // 새 데이터 추가
  for (const product of products) {
    await db.collection('products').add(product);
    console.log(`Added product: ${product.title.ko}`);
  }
  
  console.log('Products seeding completed!');
  process.exit();
}

seedProducts(); 