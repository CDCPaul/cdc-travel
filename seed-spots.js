const admin = require('firebase-admin');
const serviceAccount = require('./frontend/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedSpots() {
  const spots = [
    {
      type: '관광지',
      name: { ko: '남이섬', en: 'Nami Island' },
      description: {
        ko: '자연이 아름다운 섬, 사계절 관광지로 유명. 겨울에는 눈꽃이, 가을에는 단풍이 아름다워 많은 관광객이 찾는 곳입니다.',
        en: 'A beautiful island famous for its scenery in all seasons. Winter snow and autumn foliage attract many tourists.'
      },
      address: { ko: '경기도 가평군', en: 'Gapyeong-gun, Gyeonggi-do' },
      region: { ko: '경기', en: 'Gyeonggi' },
      imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
      tags: ['인기', '자연', '가족', '사진'],
      mealType: '',
      extraImages: [],
      mapUrl: 'https://maps.google.com/?q=남이섬',
      duration: { ko: '2-3시간', en: '2-3 hours' },
      price: { ko: '무료', en: 'Free' },
      bestTime: { ko: '사계절', en: 'All seasons' }
    },
    {
      type: '관광지',
      name: { ko: '쁘띠 프랑스', en: 'Petite France' },
      description: {
        ko: '프랑스 테마의 아름다운 마을. 어린왕자 테마파크와 프랑스 문화를 체험할 수 있는 곳입니다.',
        en: 'A beautiful French-themed village where you can experience French culture and the Little Prince theme park.'
      },
      address: { ko: '경기도 가평군', en: 'Gapyeong-gun, Gyeonggi-do' },
      region: { ko: '경기', en: 'Gyeonggi' },
      imageUrl: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=800',
      tags: ['인기', '문화', '로맨틱', '사진'],
      mealType: '',
      extraImages: [],
      mapUrl: 'https://maps.google.com/?q=쁘띠프랑스',
      duration: { ko: '2-3시간', en: '2-3 hours' },
      price: { ko: '유료', en: 'Paid' },
      bestTime: { ko: '봄, 가을', en: 'Spring, Autumn' }
    },
    {
      type: '관광지',
      name: { ko: '경복궁', en: 'Gyeongbokgung Palace' },
      description: {
        ko: '조선왕조의 정궁으로, 한국의 전통 건축과 문화를 체험할 수 있는 대표적인 관광지입니다.',
        en: 'The main palace of the Joseon Dynasty, a representative tourist destination to experience traditional Korean architecture and culture.'
      },
      address: { ko: '서울특별시 종로구', en: 'Jongno-gu, Seoul' },
      region: { ko: '서울', en: 'Seoul' },
      imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
      tags: ['역사', '문화', '전통', '사진'],
      mealType: '',
      extraImages: [],
      mapUrl: 'https://maps.google.com/?q=경복궁',
      duration: { ko: '3-4시간', en: '3-4 hours' },
      price: { ko: '유료', en: 'Paid' },
      bestTime: { ko: '봄, 가을', en: 'Spring, Autumn' }
    },
    {
      type: '식당',
      name: { ko: '한식당', en: 'Korean Restaurant' },
      description: {
        ko: '전통 한식을 맛볼 수 있는 식당. 비빔밥, 불고기, 갈비찜 등 한국의 대표 요리를 즐길 수 있습니다.',
        en: 'A restaurant where you can taste traditional Korean cuisine. Enjoy representative Korean dishes like bibimbap, bulgogi, and galbijjim.'
      },
      address: { ko: '서울특별시 강남구', en: 'Gangnam-gu, Seoul' },
      region: { ko: '서울', en: 'Seoul' },
      imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
      tags: ['한식', '전통', '맛집'],
      mealType: { ko: '점심', en: 'Lunch' },
      extraImages: [],
      mapUrl: 'https://maps.google.com/?q=한식당',
      duration: { ko: '1-2시간', en: '1-2 hours' },
      price: { ko: '2만원', en: '20,000 KRW' },
      bestTime: { ko: '점심시간', en: 'Lunch time' }
    },
    {
      type: '체험',
      name: { ko: '한복체험', en: 'Hanbok Experience' },
      description: {
        ko: '전통 한복을 입고 궁궐에서 사진을 찍는 체험. 한국의 전통 문화를 직접 체험할 수 있는 인기 프로그램입니다.',
        en: 'Experience wearing traditional hanbok and taking photos at the palace. A popular program to directly experience Korean traditional culture.'
      },
      address: { ko: '서울특별시 종로구', en: 'Jongno-gu, Seoul' },
      region: { ko: '서울', en: 'Seoul' },
      imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
      tags: ['체험', '전통', '문화', '사진'],
      mealType: '',
      extraImages: [],
      mapUrl: 'https://maps.google.com/?q=한복체험',
      duration: { ko: '2-3시간', en: '2-3 hours' },
      price: { ko: '3만원', en: '30,000 KRW' },
      bestTime: { ko: '오전', en: 'Morning' }
    },
    {
      type: '관광지',
      name: { ko: '부산 해운대', en: 'Busan Haeundae Beach' },
      description: {
        ko: '부산의 대표적인 해변으로, 아름다운 해안선과 함께 도시의 활기를 느낄 수 있는 곳입니다.',
        en: 'Busan\'s representative beach where you can feel the city\'s vitality along with the beautiful coastline.'
      },
      address: { ko: '부산광역시 해운대구', en: 'Haeundae-gu, Busan' },
      region: { ko: '부산', en: 'Busan' },
      imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
      tags: ['해변', '자연', '여름', '사진'],
      mealType: '',
      extraImages: [],
      mapUrl: 'https://maps.google.com/?q=부산해운대',
      duration: { ko: '3-4시간', en: '3-4 hours' },
      price: { ko: '무료', en: 'Free' },
      bestTime: { ko: '여름', en: 'Summer' }
    }
  ];

  // 기존 데이터 삭제
  const existingSpots = await db.collection('spots').get();
  const deletePromises = existingSpots.docs.map(doc => doc.ref.delete());
  await Promise.all(deletePromises);
  console.log('Deleted existing spots');

  // 새 데이터 추가
  for (const spot of spots) {
    await db.collection('spots').add(spot);
    console.log(`Added spot: ${spot.name.ko}`);
  }
  
  console.log('Spots seeding completed!');
  process.exit();
}

seedSpots(); 