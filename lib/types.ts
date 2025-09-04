// 목적지(Destination)
export interface Destination {
  id: string;
  region: string;
  name: string;
  name_kr: string;
  mainImageUrl: string;
  netPrice: number;
  sellPrice: number;
  duration: string;
  description?: string;
  tags?: string[];
}

// 포함/불포함 항목
export interface IncludeItem {
  id: string;
  name: string;
  iconUrl?: string;
}

export interface NotIncludeItem {
  id: string;
  name: string;
  iconUrl?: string;
}

// 일정 요소(Spot) - 목적지, 식당, 체험 등
export interface Spot {
  id: string;
  type: string; // '관광지' | '식당' | '체험' 등
  name: string;
  name_kr: string;
  imageUrl: string;
  description?: string;
  address?: string;
  tags?: string[];
}

// 투어상품(Product)
export interface Product {
  id: string;
  mainImageUrl: string;
  title: string;
  price: {
    adult: number;
    child: number;
    childWithBed: number;
    infant: number;
  };
  dates: string[]; // or {start: string, end: string}[]
  description: string;
  tags?: string[];
  schedule: Array<{
    day: number;
    spots: Array<{
      id: string;
      name: string;
      name_kr: string;
      imageUrl: string;
      description?: string;
      type: string;
    }>;
  }>;
  included: IncludeItem[];
  notIncluded: NotIncludeItem[];
}

// eBook(Ebook) 타입
export interface Ebook {
  id: string;
  title: { ko: string; en: string };
  description: { ko: string; en: string };
  fileUrl: string;
  thumbUrl?: string;
  pageImageUrls?: string[]; // 🚀 플리핑북용 이미지 배열
  pageCount?: number; // 총 페이지 수
  ebookId?: string; // 파일 관리용 ID
  isPublic: boolean;
  createdAt: number; // timestamp(ms)
  updatedAt: number; // timestamp(ms)
}

export const TRAVEL_INFO_TEXTS = {
  ko: {
    loading: "로딩 중...",
    backToDashboard: "← 대시보드로 돌아가기",
    title: "여행정보 관리",
    addNewInfo: "새 여행정보 추가",
    editInfo: "여행정보 수정",
    addNewInfoForm: "새 여행정보 추가",
    formTitle: "제목",
    formContent: "내용",
    formCategory: "카테고리",
    formImageUpload: "이미지 업로드",
    formImageUrl: "이미지 URL",
    formTags: "태그",
    tagsPlaceholder: "태그를 입력하세요 (쉼표로 구분)",
    delete: "삭제",
    addTag: "태그 추가",
    save: "추가",
    edit: "수정",
    cancel: "취소",
    imageUploading: "이미지 업로드 중...",
    imageUploadError: "이미지 업로드에 실패했습니다.",
    preview: "미리보기",
    confirmDelete: "정말로 이 여행정보를 삭제하시겠습니까?",
    editButton: "수정",
    deleteButton: "삭제",
    backToList: "← 목록으로",
    notFound: "여행정보를 찾을 수 없습니다.",
    saving: "저장 중...",
    saveError: "저장 중 오류가 발생했습니다.",
    dragDrop: "여러 이미지를 드래그하거나 클릭하여 업로드하세요.",
    dragActive: "여기에 이미지를 놓으세요!",
    categoryOptions: {
      destination: "목적지 정보",
      culture: "문화 정보",
      food: "음식 정보",
      transportation: "교통 정보",
      accommodation: "숙박 정보",
      tips: "여행 팁"
    }
  },
  en: {
    loading: "Loading...",
    backToDashboard: "← Back to Dashboard",
    title: "Travel Info Management",
    addNewInfo: "Add New Travel Info",
    editInfo: "Edit Travel Info",
    addNewInfoForm: "Add New Travel Info",
    formTitle: "Title",
    formContent: "Content",
    formCategory: "Category",
    formImageUpload: "Image Upload",
    formImageUrl: "Image URL",
    formTags: "Tags",
    tagsPlaceholder: "Enter tags (separated by commas)",
    delete: "Delete",
    addTag: "Add Tag",
    save: "Add",
    edit: "Edit",
    cancel: "Cancel",
    imageUploading: "Uploading image...",
    imageUploadError: "Image upload failed.",
    preview: "Preview",
    confirmDelete: "Are you sure you want to delete this travel info?",
    editButton: "Edit",
    deleteButton: "Delete",
    backToList: "← Back to List",
    notFound: "Travel info not found.",
    saving: "Saving...",
    saveError: "An error occurred while saving.",
    dragDrop: "Drag or click to upload multiple images.",
    dragActive: "Drop images here!",
    categoryOptions: {
      destination: "Destination Info",
      culture: "Culture Info",
      food: "Food Info",
      transportation: "Transportation Info",
      accommodation: "Accommodation Info",
      tips: "Travel Tips"
    }
  }
};

export function safeLang(val: string | { ko: string; en: string } | undefined | null, lang: string): string {
  if (val === undefined || val === null) return '';
  if (typeof val === 'object') {
    return (val as Record<string, string>)[lang] || (val as Record<string, string>).ko || '';
  }
  return typeof val === 'string' ? val : '';
}

// 가격 타입 가드 함수들
export function isCurrencyPrice(price: unknown): price is { KRW?: string; PHP?: string; USD?: string } {
  if (!price || typeof price !== 'object' || price === null) return false;
  
  const priceObj = price as Record<string, unknown>;
  const hasCurrencyKey = 'KRW' in priceObj || 'PHP' in priceObj || 'USD' in priceObj;
  
  if (!hasCurrencyKey) return false;
  
  // 각 통화 키가 문자열이거나 undefined인지 확인
  return (typeof priceObj.KRW === 'string' || typeof priceObj.KRW === 'undefined') &&
         (typeof priceObj.PHP === 'string' || typeof priceObj.PHP === 'undefined') &&
         (typeof priceObj.USD === 'string' || typeof priceObj.USD === 'undefined');
}

export function isLanguagePrice(price: unknown): price is { ko: string; en: string } {
  if (!price || typeof price !== 'object' || price === null) return false;
  
  const priceObj = price as Record<string, unknown>;
  
  return 'ko' in priceObj && 'en' in priceObj &&
         typeof priceObj.ko === 'string' && typeof priceObj.en === 'string';
}

export function isStringPrice(price: unknown): price is string {
  return typeof price === 'string';
}

// 가격에서 PHP 값 추출 (우선순위: PHP > KRW > USD)
export function getPHPPrice(price: unknown): string {
  if (!price) return '-';
  
  if (isStringPrice(price)) {
    return price;
  }
  
  if (isCurrencyPrice(price)) {
    if (price.PHP && price.PHP.trim()) return `₱${price.PHP}`;
    if (price.KRW && price.KRW.trim()) return `₩${price.KRW}`;
    if (price.USD && price.USD.trim()) return `$${price.USD}`;
  }
  
  if (isLanguagePrice(price)) {
    // 언어별 가격인 경우 한국어 값을 반환 (필리핀 고객이므로)
    return price.ko || price.en || '-';
  }
  
  return '-';
}

// 가격에서 특정 통화 값 추출
export function getCurrencyPrice(price: unknown, currency: 'KRW' | 'PHP' | 'USD'): string {
  if (!price) return '';
  
  if (isCurrencyPrice(price)) {
    return price[currency] || '';
  }
  
  return '';
}

// 가격 표시용 텍스트 생성
export function getPriceDisplayText(price: unknown, lang: 'ko' | 'en' = 'ko'): string {
  if (!price) return lang === 'ko' ? '가격 미지정' : 'Price not set';
  
  if (isStringPrice(price)) {
    return price;
  }
  
  if (isCurrencyPrice(price)) {
    const parts: string[] = [];
    if (price.KRW && price.KRW.trim()) parts.push(`₩${price.KRW}`);
    if (price.PHP && price.PHP.trim()) parts.push(`₱${price.PHP}`);
    if (price.USD && price.USD.trim()) parts.push(`$${price.USD}`);
    return parts.length > 0 ? parts.join(' ') : (lang === 'ko' ? '가격 미지정' : 'Price not set');
  }
  
  if (isLanguagePrice(price)) {
    return price[lang] || price.ko || price.en || (lang === 'ko' ? '가격 미지정' : 'Price not set');
  }
  
  return lang === 'ko' ? '가격 미지정' : 'Price not set';
}

// 다국어 텍스트 타입
export interface MultilingualText {
  ko: string;
  en: string;
  slug?: string;
}

// 타입 가드 함수
export function isMultilingualText(text: unknown): text is MultilingualText {
  return text !== null && 
         typeof text === 'object' && 
         'ko' in text && 
         'en' in text &&
         typeof (text as MultilingualText).ko === 'string' &&
         typeof (text as MultilingualText).en === 'string';
}

// 다국어 텍스트 정규화 함수
export function normalizeMultilingualText(text: unknown, lang: 'ko' | 'en'): string {
  if (typeof text === 'string') {
    return text;
  } else if (isMultilingualText(text)) {
    return text[lang] || text.ko || '';
  } else {
    return String(text || '');
  }
}

// Firebase 객체 배열을 정상 배열로 변환
export function normalizeFirebaseArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data;
  } else if (data && typeof data === 'object') {
    // 객체를 배열로 변환
    return Object.values(data);
  }
  return [];
} 