# CDC Travel

CDC Travel은 Next.js와 Firebase를 기반으로 한 전문 여행사 웹사이트입니다.

## 주요 기능

- 🌏 다국어 지원 (한국어/영어)
- 📱 반응형 디자인
- 🔥 Firebase 기반 실시간 데이터
- 📊 Analytics 대시보드
- 🎨 모던한 UI/UX
- 🖼️ 자동 이미지 최적화 (Sharp 라이브러리)

## 기술 스택

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Storage, Analytics)
- **Image Processing**: Sharp (이미지 최적화)
- **Deployment**: Vercel

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start
```

## Analytics 설정

### Firebase Analytics

Firebase Analytics가 자동으로 설정되어 있습니다. 주요 이벤트 추적:

- 페이지 뷰 (`page_view`)
- 투어 클릭 (`tour_click`)
- 연락처 클릭 (`contact_click`)
- 배너 클릭 (`banner_click`)
- 언어 변경 (`language_change`)

### Google Analytics 4 연동 (선택사항)

실제 Google Analytics 데이터를 사용하려면:

1. Google Analytics 4 프로퍼티 생성
2. 서비스 계정 키 파일 다운로드
3. 환경 변수 설정:



현재는 Mock 데이터를 사용하여 Analytics 대시보드가 작동합니다.

## 프로젝트 구조

```
cdc-travel/
├── app/                    # Next.js App Router
│   ├── admin/             # 관리자 페이지
│   ├── tours/             # 투어 페이지
│   └── api/               # API 라우트
├── components/             # React 컴포넌트
├── lib/                   # 유틸리티 및 설정
│   ├── firebase.ts        # Firebase 설정
│   └── analytics.ts       # Analytics 유틸리티
└── types/                 # TypeScript 타입 정의
```

## 관리자 기능

- 📊 Analytics 대시보드
- 🎨 배너 관리
- 🏖️ 투어 상품 관리
- 📍 관광지 관리
- ⚙️ 설정 관리
- 🖼️ 이미지 최적화 관리

## 이미지 최적화 기능

### Sharp 라이브러리를 활용한 자동 이미지 최적화

이 프로젝트는 Sharp 라이브러리를 사용하여 업로드된 이미지를 자동으로 최적화합니다.

#### 주요 기능

- **자동 포맷 변환**: JPEG/PNG → WebP 변환
- **다중 크기 생성**: 메인 이미지, 썸네일, 웹 최적화 버전
- **압축 최적화**: 품질 조정으로 파일 크기 최소화
- **리사이징**: 최대 크기 제한으로 성능 향상

#### 생성되는 이미지 버전

1. **메인 이미지**: WebP 포맷, 품질 85%, 최대 1200x800
2. **썸네일**: JPEG 포맷, 300x200 크기
3. **웹 최적화**: WebP 포맷, 최대 1200x800, 비율 유지

#### 사용 방법

```typescript
import ImageUploader from '@/components/ui/ImageUploader';
import { URL_EXPIRY_DAYS } from '@/lib/constants';

// 기본 이미지 업로드 (1년 만료)
<ImageUploader
  onImagesUploaded={(urls) => console.log('업로드된 URL:', urls)}
  folder="spots"
  multiple={false}
/>

// 다중 이미지 업로드 (6개월 만료)
<ImageUploader
  onImagesUploaded={(urls, thumbnailUrls, webOptimizedUrls) => {
    console.log('메인 URL:', urls);
    console.log('썸네일 URL:', thumbnailUrls);
    console.log('웹 최적화 URL:', webOptimizedUrls);
  }}
  folder="products"
  multiple={true}
  maxFiles={10}
  expiryDays={URL_EXPIRY_DAYS.IMPORTANT}
/>

// 테스트용 업로드 (7일 만료)
<ImageUploader
  onImagesUploaded={handleImagesUploaded}
  folder="test"
  expiryDays={URL_EXPIRY_DAYS.TEST}
/>
```

#### URL 만료일 설정

Firebase Storage Signed URL의 만료일을 설정할 수 있습니다:

- **테스트용**: 7일
- **임시**: 30일  
- **중요**: 6개월
- **일반**: 1년 (기본값)
- **영구**: 7년 (최대)

```typescript
import { URL_EXPIRY_DAYS } from '@/lib/constants';

// 만료일 상수 사용
expiryDays={URL_EXPIRY_DAYS.DEFAULT}  // 1년
expiryDays={URL_EXPIRY_DAYS.IMPORTANT} // 6개월
expiryDays={URL_EXPIRY_DAYS.TEST}      // 7일

// 직접 일수 지정
expiryDays={90} // 90일
```

#### 테스트

이미지 최적화 기능을 테스트하려면 `/test-image-optimization` 페이지를 방문하세요.

## 배포

Vercel을 통한 자동 배포가 설정되어 있습니다.

## 라이선스

All rights reserved.
