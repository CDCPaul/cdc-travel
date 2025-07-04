# CDC Travel

CDC Travel은 Next.js와 Firebase를 기반으로 한 전문 여행사 웹사이트입니다.

## 주요 기능

- 🌏 다국어 지원 (한국어/영어)
- 📱 반응형 디자인
- 🔥 Firebase 기반 실시간 데이터
- 📊 Analytics 대시보드
- 🎨 모던한 UI/UX

## 기술 스택

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Storage, Analytics)
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

## 배포

Vercel을 통한 자동 배포가 설정되어 있습니다.

## 라이선스

All rights reserved.
