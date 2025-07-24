export type BannerType = "image" | "video";

export interface Banner {
  id: string;           // Firestore document ID
  type: BannerType;     // "image" | "video"
  url: string;          // 이미지/영상 파일 URL
  link: string;         // 클릭 시 이동할 URL
  title_ko: string;     // 한글 제목
  title_en: string;     // 영어 제목
  order: number;        // 정렬 순서 (1~10)
  active: boolean;      // 활성/비활성
  createdAt: number;    // 타임스탬프
  
  // 왼쪽 영역 컨트롤을 위한 새로운 필드들
  leftBackgroundColor?: string;  // 왼쪽 배경 색상 (예: "from-[#2C6E6F] via-[#3A8A8B] to-[#4A9D9E]")
  leftTitle_ko?: string;        // 왼쪽 영역 한글 제목
  leftTitle_en?: string;        // 왼쪽 영역 영어 제목
  leftSubtitle_ko?: string;     // 왼쪽 영역 한글 부제목
  leftSubtitle_en?: string;     // 왼쪽 영역 영어 부제목
  leftTextColor?: string;       // 왼쪽 텍스트 색상 (기본: "text-white")
} 