const admin = require('firebase-admin');
const serviceAccount = require('./frontend/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedTravelInfo() {
  const travelInfos = [
    {
      title: { ko: '한국 여행 준비 가이드', en: 'Korea Travel Preparation Guide' },
      content: {
        ko: `한국 여행을 위한 완벽한 준비 가이드입니다.

## 여행 준비물
- 여권 (6개월 이상 유효기간)
- 편안한 신발
- 계절에 맞는 옷
- 충전기와 어댑터
- 카메라

## 환전
- 공항이나 은행에서 환전 가능
- 신용카드도 널리 사용됨
- 현금과 카드 모두 준비 권장

## 교통
- 지하철이 가장 편리
- T-money 카드 구매 권장
- 택시도 안전하고 편리

## 음식
- 한국 음식은 대부분 맵지 않음
- 식당에서 물은 무료
- 팁 문화 없음

## 인터넷
- 공항에서 WiFi egg 대여 가능
- 대부분 관광지에 무료 WiFi
- 한국어 앱 다운로드 권장`,
        en: `Complete preparation guide for traveling to Korea.

## Travel Essentials
- Passport (valid for 6+ months)
- Comfortable shoes
- Season-appropriate clothing
- Charger and adapter
- Camera

## Currency Exchange
- Available at airports or banks
- Credit cards widely accepted
- Recommended to have both cash and cards

## Transportation
- Subway is most convenient
- Recommended to buy T-money card
- Taxis are safe and convenient

## Food
- Most Korean food is not spicy
- Water is free at restaurants
- No tipping culture

## Internet
- WiFi egg rental available at airport
- Free WiFi at most tourist spots
- Recommended to download Korean apps`
      },
      category: { ko: '가이드', en: 'Guide' },
      imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
      tags: ['가이드', '준비물', '초보자'],
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: { ko: '서울 최고의 맛집 추천', en: 'Best Restaurants in Seoul' },
      content: {
        ko: `서울에서 꼭 가봐야 할 맛집들을 소개합니다.

## 전통 한식
### 광장시장
- 비빔밥과 마약김밥으로 유명
- 위치: 종로구 창경궁로 88
- 가격: 1만원~2만원

### 명동교자
- 50년 전통의 교자 전문점
- 위치: 중구 명동길 25
- 가격: 1.5만원~2.5만원

## 현대 한식
### 삼청동 수제비
- 수제비와 만두가 맛있는 곳
- 위치: 종로구 삼청로 101
- 가격: 2만원~3만원

### 홍대 닭갈비
- 홍대 거리의 유명 닭갈비집
- 위치: 마포구 홍대로 123
- 가격: 2.5만원~3.5만원

## 팁
- 점심시간(12-1시)은 피하기
- 현지인들이 많은 곳 선택
- 리뷰 사이트 참고하기`,
        en: `Introducing must-visit restaurants in Seoul.

## Traditional Korean Food
### Gwangjang Market
- Famous for bibimbap and mayak kimbap
- Location: 88 Changgyeonggung-ro, Jongno-gu
- Price: 10,000-20,000 KRW

### Myeongdong Kyoja
- 50-year-old dumpling specialty restaurant
- Location: 25 Myeongdong-gil, Jung-gu
- Price: 15,000-25,000 KRW

## Modern Korean Food
### Samcheongdong Sujebi
- Delicious sujebi and dumplings
- Location: 101 Samcheong-ro, Jongno-gu
- Price: 20,000-30,000 KRW

### Hongdae Dakgalbi
- Famous dakgalbi restaurant in Hongdae
- Location: 123 Hongdae-ro, Mapo-gu
- Price: 25,000-35,000 KRW

## Tips
- Avoid lunch time (12-1 PM)
- Choose places with many locals
- Check review sites`
      },
      category: { ko: '맛집', en: 'Restaurants' },
      imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
      tags: ['맛집', '한식', '추천'],
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: { ko: '한국 쇼핑 가이드', en: 'Korea Shopping Guide' },
      content: {
        ko: `한국에서 쇼핑하기 좋은 곳들을 소개합니다.

## 의류 쇼핑
### 명동
- 한국의 대표 쇼핑 거리
- 브랜드 매장과 화장품점
- 지하철 4호선 명동역

### 홍대
- 젊은이들의 쇼핑 거리
- 독특한 디자인 의류
- 지하철 2호선 홍대입구역

### 강남
- 고급 브랜드 매장
- 백화점과 쇼핑몰
- 지하철 2호선 강남역

## 화장품
### 올리브영
- 한국 화장품 체인점
- 전국에 매장 분포
- 면세점보다 저렴

### 이니스프리
- 자연주의 화장품
- 한국 대표 브랜드
- 온라인 구매 가능

## 팁
- 면세점은 출국 전날 이용
- 온라인 쇼핑몰도 활용
- 환율 확인 필수`,
        en: `Introducing great shopping places in Korea.

## Clothing Shopping
### Myeongdong
- Korea's representative shopping street
- Brand stores and cosmetics shops
- Subway Line 4 Myeongdong Station

### Hongdae
- Shopping street for young people
- Unique design clothing
- Subway Line 2 Hongik University Station

### Gangnam
- High-end brand stores
- Department stores and shopping malls
- Subway Line 2 Gangnam Station

## Cosmetics
### Olive Young
- Korean cosmetics chain store
- Stores nationwide
- Cheaper than duty-free shops

### Innisfree
- Natural cosmetics
- Representative Korean brand
- Available online

## Tips
- Use duty-free shops the day before departure
- Also utilize online shopping malls
- Check exchange rates`
      },
      category: { ko: '쇼핑', en: 'Shopping' },
      imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
      tags: ['쇼핑', '의류', '화장품'],
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // 기존 데이터 삭제
  const existingInfos = await db.collection('travel-info').get();
  const deletePromises = existingInfos.docs.map(doc => doc.ref.delete());
  await Promise.all(deletePromises);
  console.log('Deleted existing travel-info');

  // 새 데이터 추가
  for (const info of travelInfos) {
    await db.collection('travel-info').add(info);
    console.log(`Added travel info: ${info.title.ko}`);
  }
  
  console.log('Travel info seeding completed!');
  process.exit();
}

seedTravelInfo(); 