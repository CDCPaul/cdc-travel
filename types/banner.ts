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
} 