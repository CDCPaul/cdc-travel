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

export function safeLang(val: string | { ko: string; en: string }, lang: string): string {
  if (typeof val === 'object' && val !== null) {
    return (val as any)[lang] || (val as any).ko || '';
  }
  return typeof val === 'string' ? val : '';
} 