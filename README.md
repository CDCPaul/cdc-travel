# CDC Travel

CDC Travel은 여행 정보와 상품을 제공하는 웹 애플리케이션입니다.

## 주요 기능

- 여행 정보 제공
- 상품 관리
- 이미지 최적화
- 다국어 지원 (한국어/영어)

## 기술 스택

- Next.js 15
- React19 TypeScript
- Tailwind CSS
- Firebase (Firestore, Storage)
- Sharp (이미지 최적화)

## 설치 및 실행

```bash
npm install
npm run dev
```

## 환경 변수

`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```
# Firebase 설정
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# 환율 API 설정
NEXT_PUBLIC_EXCHANGE_RATE_API_URL=https://api.exchangerate.host/live
NEXT_PUBLIC_EXCHANGE_RATE_API_KEY=your_exchange_rate_api_key

# Cron Job 시크릿 (자동 환율 업데이트용)
CRON_SECRET=your_cron_secret_key
```

## 프로젝트 구조

```
cdc-travel/
├── app/                    # Next.js App Router
│   ├── admin/             # 관리자 페이지
│   ├── api/               # API 라우트
│   ├── tours/             # 투어 페이지
│   └── travel-info/       # 여행 정보 페이지
├── components/            # React 컴포넌트
├── lib/                   # 유틸리티 함수들
├── public/                # 정적 파일들
└── types/                 # TypeScript 타입 정의
```

## 이미지 최적화

이 프로젝트는 Sharp 라이브러리를 사용하여 이미지를 자동으로 최적화합니다:

- WebP 형식으로 변환
- 용도별 최적화 (배너, 상품, 스팟 등)
- 원본 비율 유지
- 품질 최적화

## 환율 자동 업데이트

매일 필리핀 시간 오전 9시에 자동으로 환율 정보를 업데이트합니다:

- Vercel Cron Jobs를 사용한 자동 스케줄링
- 필리핀 시간대 (Asia/Manila) 기준
- USD, KRW, PHP 통화 지원
- 관리자 페이지에서 수동 업데이트 가능
- 실시간 환율 상태 모니터링

## 관리자 기능

- 상품 관리 (추가/편집/삭제)
- 스팟 관리 (추가/편집/삭제)
- 배너 관리
- 사용자 관리
- 파일 업로드 및 최적화
- 환율 자동 업데이트 관리
- 시스템 설정 및 모니터링

## 개발 가이드

### 코드 스타일

- TypeScript strict 모드 사용
- ESLint 규칙 준수
- Tailwind CSS 클래스 사용

### 이미지 업로드

이미지 업로드 시 자동으로 최적화됩니다:

```typescript
// 용도별 최적화 설정
usage="spot-main      // 스팟 대표 이미지
usage="spot-gallery   // 스팟 갤러리 이미지
usage="product-detail" // 상품 상세 이미지
```

### 다국어 지원

언어 컨텍스트를 통해 한국어/영어를 지원합니다:

```typescript
const { lang } = useLanguage();
const text = TEXT.someKey[lang];
```

## 배포

```bash
npm run build
npm start
```

## 라이선스

이 프로젝트는 CDC Travel의 내부 프로젝트입니다.
