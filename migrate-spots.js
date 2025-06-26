const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, deleteField } = require('firebase/firestore');

// Firebase 설정 (실제 프로젝트 설정으로 교체 필요)
const firebaseConfig = {
    apiKey: "AIzaSyD0E3dFYjzexk74---sWt-3AslSCRFze4s",
    authDomain: "cdc-home-fb4d1.firebaseapp.com",
    projectId: "cdc-home-fb4d1",
    storageBucket: "cdc-home-fb4d1.firebasestorage.app",
    messagingSenderId: "761536582659",
    appId: "1:761536582659:web:b87d45fc4b91a087f16a36",
    measurementId: "G-5BSXT1V2W1"
  };

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 타입 옵션 매핑
const TYPE_OPTIONS = [
  { value: "관광지", label: { ko: "관광지", en: "Tourist Attraction" } },
  { value: "맛집", label: { ko: "맛집", en: "Restaurant" } },
  { value: "카페", label: { ko: "카페", en: "Cafe" } },
  { value: "쇼핑", label: { ko: "쇼핑", en: "Shopping" } },
  { value: "숙박", label: { ko: "숙박", en: "Accommodation" } },
  { value: "교통", label: { ko: "교통", en: "Transportation" } },
  { value: "엔터테인먼트", label: { ko: "엔터테인먼트", en: "Entertainment" } },
  { value: "자연", label: { ko: "자연", en: "Nature" } },
  { value: "문화", label: { ko: "문화", en: "Culture" } },
  { value: "스포츠", label: { ko: "스포츠", en: "Sports" } },
  { value: "기타", label: { ko: "기타", en: "Other" } }
];

// 계절 옵션 매핑
const SEASON_OPTIONS = [
  { value: "봄", label: { ko: "봄", en: "Spring" } },
  { value: "여름", label: { ko: "여름", en: "Summer" } },
  { value: "가을", label: { ko: "가을", en: "Autumn" } },
  { value: "겨울", label: { ko: "겨울", en: "Winter" } },
  { value: "아침", label: { ko: "아침", en: "Morning" } },
  { value: "점심", label: { ko: "점심", en: "Noon" } },
  { value: "저녁", label: { ko: "저녁", en: "Evening" } },
  { value: "일출", label: { ko: "일출", en: "Sunrise" } },
  { value: "일몰", label: { ko: "일몰", en: "Sunset" } }
];

// 데이터 변환 함수
function transformSpotData(oldData) {
  const newData = { ...oldData };
  
  // 1. type 변환
  if (oldData.type) {
    if (Array.isArray(oldData.type)) {
      // 이미 배열인 경우 그대로 유지
      newData.type = oldData.type;
    } else if (typeof oldData.type === 'string') {
      // 문자열인 경우 배열로 변환
      newData.type = [oldData.type];
    } else if (oldData.type.ko) {
      // {ko, en} 객체인 경우 ko 값으로 변환
      newData.type = [oldData.type.ko];
    }
  } else {
    newData.type = [];
  }

  // 2. bestTime 변환
  if (oldData.bestTime) {
    if (typeof oldData.bestTime === 'string') {
      // 문자열을 배열로 분할하고 {ko, en} 객체로 변환
      const timeArray = oldData.bestTime.split(',').map(t => t.trim()).filter(t => t);
      newData.bestTime = {
        ko: timeArray.join(', '),
        en: timeArray
          .map(val => SEASON_OPTIONS.find(opt => opt.value === val)?.label.en || val)
          .join(', ')
      };
    } else if (Array.isArray(oldData.bestTime)) {
      // 배열인 경우 {ko, en} 객체로 변환
      newData.bestTime = {
        ko: oldData.bestTime.join(', '),
        en: oldData.bestTime
          .map(val => SEASON_OPTIONS.find(opt => opt.value === val)?.label.en || val)
          .join(', ')
      };
    } else if (oldData.bestTime.ko && oldData.bestTime.en) {
      // 이미 {ko, en} 객체인 경우 그대로 유지
      newData.bestTime = oldData.bestTime;
    }
  } else {
    newData.bestTime = { ko: '', en: '' };
  }

  // 3. 불필요한 필드 제거
  const fieldsToRemove = ['mealType', 'mealTypeKo', 'mealTypeEn'];
  fieldsToRemove.forEach(field => {
    if (newData[field] !== undefined) {
      delete newData[field];
    }
  });

  // 4. 다국어 필드 정규화
  const multilingualFields = ['name', 'description', 'address', 'region', 'duration', 'price'];
  multilingualFields.forEach(field => {
    if (newData[field] && typeof newData[field] === 'string') {
      // 문자열인 경우 {ko, en} 객체로 변환
      newData[field] = { ko: newData[field], en: newData[field] };
    } else if (!newData[field]) {
      // 없는 경우 빈 객체로 초기화
      newData[field] = { ko: '', en: '' };
    }
  });

  // 5. 배열 필드 정규화
  const arrayFields = ['tags', 'extraImages'];
  arrayFields.forEach(field => {
    if (!Array.isArray(newData[field])) {
      newData[field] = [];
    }
  });

  return newData;
}

// 마이그레이션 실행 함수
async function migrateSpots() {
  try {
    console.log('마이그레이션 시작...');
    
    const spotsRef = collection(db, 'spots');
    const snapshot = await getDocs(spotsRef);
    
    console.log(`총 ${snapshot.size}개의 문서를 처리합니다.`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const docSnapshot of snapshot.docs) {
      try {
        const oldData = docSnapshot.data();
        const newData = transformSpotData(oldData);
        
        // 문서 업데이트
        await updateDoc(doc(db, 'spots', docSnapshot.id), newData);
        
        console.log(`✅ 문서 ${docSnapshot.id} 변환 완료`);
        successCount++;
      } catch (error) {
        console.error(`❌ 문서 ${docSnapshot.id} 변환 실패:`, error);
        errorCount++;
      }
    }
    
    console.log(`\n마이그레이션 완료!`);
    console.log(`성공: ${successCount}개`);
    console.log(`실패: ${errorCount}개`);
    
  } catch (error) {
    console.error('마이그레이션 중 오류 발생:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  migrateSpots();
}

module.exports = { migrateSpots, transformSpotData }; 