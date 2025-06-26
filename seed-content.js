const admin = require('firebase-admin');
const serviceAccount = require('./frontend/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedContent() {
  const contents = [
    {
      title: { ko: '한국의 사계절 관광지 추천', en: 'Recommended Tourist Spots for Korea\'s Four Seasons' },
      content: {
        ko: `한국은 사계절이 뚜렷한 나라로, 각 계절마다 다른 매력을 가진 관광지들이 있습니다.

## 봄 (3월-5월)
### 제주도 벚꽃
- 3월 말부터 4월 초까지 벚꽃이 만개
- 제주도 전역에서 벚꽃 축제 개최
- 추천 장소: 제주시, 서귀포시

### 여의도 벚꽃
- 서울에서 가장 유명한 벚꽃 명소
- 4월 초순에 절정
- 벚꽃 터널이 아름다움

## 여름 (6월-8월)
### 부산 해운대
- 한국 최고의 해수욕장
- 7-8월 성수기
- 해산물과 함께 즐기는 여름

### 강원도 설악산
- 시원한 계곡과 폭포
- 등산과 트레킹
- 피서지로 인기

## 가을 (9월-11월)
### 내장산 단풍
- 전국 최고의 단풍 명소
- 10월 말-11월 초 절정
- 단풍 축제 개최

### 남이섬
- 사계절 아름다운 섬
- 가을 단풍이 특히 유명
- 로맨틱한 데이트 코스

## 겨울 (12월-2월)
### 강원도 스키장
- 알펜시아, 용평 등 유명 스키장
- 12월-3월 스키 시즌
- 눈썰매와 겨울 스포츠

### 제주도 겨울
- 따뜻한 겨울 날씨
- 오렌지 수확 체험
- 온천과 힐링

## 팁
- 계절별 옷차림 준비
- 성수기 예약 필수
- 날씨 확인 후 출발`,
        en: `Korea is a country with distinct four seasons, and each season has tourist spots with different charms.

## Spring (March-May)
### Jeju Island Cherry Blossoms
- Cherry blossoms in full bloom from late March to early April
- Cherry blossom festivals held throughout Jeju Island
- Recommended places: Jeju City, Seogwipo City

### Yeouido Cherry Blossoms
- Most famous cherry blossom spot in Seoul
- Peak in early April
- Beautiful cherry blossom tunnel

## Summer (June-August)
### Busan Haeundae Beach
- Korea's best beach
- Peak season in July-August
- Summer with seafood

### Gangwon-do Seoraksan
- Cool valleys and waterfalls
- Hiking and trekking
- Popular summer resort

## Autumn (September-November)
### Naejangsan Autumn Foliage
- Nation's best autumn foliage spot
- Peak in late October-early November
- Autumn foliage festival

### Nami Island
- Beautiful island in all seasons
- Especially famous for autumn foliage
- Romantic date course

## Winter (December-February)
### Gangwon-do Ski Resorts
- Famous ski resorts like Alpensia, Yongpyong
- Ski season from December to March
- Sledding and winter sports

### Jeju Island Winter
- Warm winter weather
- Orange harvesting experience
- Hot springs and healing

## Tips
- Prepare seasonal clothing
- Book in advance during peak season
- Check weather before departure`
      },
      category: { ko: '가이드', en: 'Guide' },
      author: { ko: 'CDC Travel', en: 'CDC Travel' },
      imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
      tags: ['사계절', '관광지', '추천'],
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: { ko: '한국 여행 필수 앱 10선', en: '10 Essential Apps for Korea Travel' },
      content: {
        ko: `한국 여행을 더욱 편리하게 만들어주는 필수 앱들을 소개합니다.

## 교통 앱
### 1. 카카오맵
- 한국 최고의 지도 앱
- 실시간 교통정보 제공
- 대중교통 경로 안내

### 2. 네이버 지도
- 상세한 지도 정보
- 버스/지하철 실시간 정보
- 주변 시설 검색

### 3. T-money
- 교통카드 잔액 확인
- 충전 및 사용 내역
- 편리한 결제

## 음식 앱
### 4. 배달의민족
- 음식 배달 서비스
- 다양한 음식점
- 빠른 배달

### 5. 카카오톡
- 한국인 필수 메신저
- 음식점 예약
- 친구들과 소통

## 쇼핑 앱
### 6. 쿠팡
- 온라인 쇼핑몰
- 빠른 배송
- 다양한 상품

### 7. 11번가
- 종합 쇼핑몰
- 할인 정보
- 리뷰 확인

## 여행 앱
### 8. 트립어드바이저
- 여행 리뷰
- 관광지 정보
- 맛집 추천

### 9. 에어비앤비
- 숙박 예약
- 현지인 집
- 독특한 경험

### 10. 구글 번역
- 실시간 번역
- 카메라 번역
- 오프라인 사용

## 팁
- 앱 다운로드는 여행 전에
- 인터넷 연결 확인
- 배터리 절약 모드 사용`,
        en: `Introducing essential apps that make traveling in Korea more convenient.

## Transportation Apps
### 1. KakaoMap
- Korea's best map app
- Real-time traffic information
- Public transportation route guidance

### 2. Naver Map
- Detailed map information
- Real-time bus/subway information
- Nearby facility search

### 3. T-money
- Transportation card balance check
- Recharge and usage history
- Convenient payment

## Food Apps
### 4. Baemin
- Food delivery service
- Various restaurants
- Fast delivery

### 5. KakaoTalk
- Essential messenger for Koreans
- Restaurant reservations
- Communication with friends

## Shopping Apps
### 6. Coupang
- Online shopping mall
- Fast delivery
- Various products

### 7. 11st
- Comprehensive shopping mall
- Discount information
- Review check

## Travel Apps
### 8. TripAdvisor
- Travel reviews
- Tourist attraction information
- Restaurant recommendations

### 9. Airbnb
- Accommodation booking
- Local homes
- Unique experiences

### 10. Google Translate
- Real-time translation
- Camera translation
- Offline use

## Tips
- Download apps before travel
- Check internet connection
- Use battery saving mode`
      },
      category: { ko: '팁', en: 'Tips' },
      author: { ko: 'CDC Travel', en: 'CDC Travel' },
      imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
      tags: ['앱', '스마트폰', '편의'],
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: { ko: '한국 문화 체험 프로그램', en: 'Korean Culture Experience Programs' },
      content: {
        ko: `한국의 전통 문화를 직접 체험할 수 있는 프로그램들을 소개합니다.

## 전통 의상 체험
### 한복 체험
- 궁궐에서 한복 입기
- 전통 사진 촬영
- 한복의 역사와 의미

### 궁녀 체험
- 조선시대 궁녀 복장
- 궁중 예법 배우기
- 전통 다과 체험

## 전통 공예 체험
### 도자기 만들기
- 전통 도자기 제작
- 개인 작품 제작
- 도자기 역사 학습

### 한지 공예
- 전통 한지 만들기
- 한지 공예품 제작
- 한지의 특성 이해

## 전통 음식 체험
### 김치 만들기
- 전통 김치 제작법
- 지역별 김치 특성
- 김치의 건강 효과

### 떡 만들기
- 전통 떡 제작
- 계절별 떡 종류
- 떡의 문화적 의미

## 전통 예술 체험
### 사물놀이
- 전통 타악기 연주
- 농악의 역사
- 단체 협동 체험

### 판소리
- 전통 음악 감상
- 판소리 기법 배우기
- 한국 음악의 특징

## 체험 장소
### 서울
- 경복궁 한복 체험
- 남산골 한옥마을
- 전통문화체험관

### 부산
- 감천문화마을
- 부산민속관
- 해운대 전통시장

### 제주
- 제주민속촌
- 성읍민속마을
- 전통문화체험장

## 예약 및 비용
- 사전 예약 필수
- 1-3시간 소요
- 2만원~5만원 비용
- 가이드 동반 가능`,
        en: `Introducing programs where you can directly experience Korean traditional culture.

## Traditional Clothing Experience
### Hanbok Experience
- Wearing hanbok at palaces
- Traditional photo shooting
- History and meaning of hanbok

### Court Lady Experience
- Joseon Dynasty court lady attire
- Learning court etiquette
- Traditional tea ceremony

## Traditional Craft Experience
### Pottery Making
- Traditional pottery production
- Creating personal works
- Learning pottery history

### Hanji Craft
- Making traditional hanji paper
- Creating hanji crafts
- Understanding hanji characteristics

## Traditional Food Experience
### Kimchi Making
- Traditional kimchi making method
- Regional kimchi characteristics
- Health benefits of kimchi

### Rice Cake Making
- Traditional rice cake making
- Seasonal rice cake varieties
- Cultural meaning of rice cakes

## Traditional Art Experience
### Samulnori
- Traditional percussion performance
- History of nongak
- Group cooperation experience

### Pansori
- Traditional music appreciation
- Learning pansori techniques
- Characteristics of Korean music

## Experience Locations
### Seoul
- Gyeongbokgung Hanbok Experience
- Namsangol Hanok Village
- Traditional Culture Experience Center

### Busan
- Gamcheon Culture Village
- Busan Folk Museum
- Haeundae Traditional Market

### Jeju
- Jeju Folk Village
- Seongeup Folk Village
- Traditional Culture Experience Center

## Booking and Costs
- Advance booking required
- Takes 1-3 hours
- Costs 20,000-50,000 KRW
- Guide accompaniment available`
      },
      category: { ko: '체험', en: 'Experience' },
      author: { ko: 'CDC Travel', en: 'CDC Travel' },
      imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
      tags: ['문화', '체험', '전통'],
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // 기존 데이터 삭제
  const existingContents = await db.collection('content').get();
  const deletePromises = existingContents.docs.map(doc => doc.ref.delete());
  await Promise.all(deletePromises);
  console.log('Deleted existing content');

  // 새 데이터 추가
  for (const content of contents) {
    await db.collection('content').add(content);
    console.log(`Added content: ${content.title.ko}`);
  }
  
  console.log('Content seeding completed!');
  process.exit();
}

seedContent(); 