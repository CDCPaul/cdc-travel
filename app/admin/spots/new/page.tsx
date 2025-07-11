"use client";

/// <reference types="@types/google.maps" />

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../../../../components/LanguageContext";
import { uploadFileToServer } from '@/lib/utils';
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PillButton } from "@/components/ui/PillButton";
import { useRouter } from "next/navigation";
import Image from "next/image";
// import Script from "next/script"; // 완전히 제거

// Google Places API 타입 정의
type GooglePlaceResult = {
  formatted_address?: string;
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
};

// 타입 정의
interface MultilingualField {
  ko: string;
  en: string;
  slug?: string;
}

interface SpotFormData {
  name: MultilingualField;
  description: MultilingualField;
  address: MultilingualField;
  region: MultilingualField;
  type: string[];
  duration: MultilingualField;
  price: { KRW: string; PHP: string; USD: string };
  bestTime: string[];
  tags: string[];
  mapUrl: string;
  imageUrl: string;
  extraImages: string[];
  country: { ko: string; en: string }; // 추가된 필드
}

interface TypeOption {
  value: string;
  label: MultilingualField;
}

interface SeasonOption {
  value: string;
  label: MultilingualField;
}

interface TagOption {
  ko: string;
  en: string;
}

// 다국어 텍스트
const TEXT = {
  title: { ko: "새 스팟 등록", en: "Add New Spot" },
  name: { ko: "이름", en: "Name" },
  description: { ko: "설명", en: "Description" },
  address: { ko: "주소", en: "Address" },
  region: { ko: "지역", en: "Region" },
  image: { ko: "대표 이미지", en: "Main Image" },
  extraImages: { ko: "추가 이미지", en: "Extra Images" },
  tags: { ko: "태그", en: "Tags" },
  type: { ko: "타입", en: "Type" },
  mapUrl: { ko: "지도 URL", en: "Map URL" },
  duration: { ko: "소요시간", en: "Duration" },
  price: { ko: "가격", en: "Price" },
  bestTime: { ko: "추천시기", en: "Best Time" },
  save: { ko: "저장", en: "Save" },
  selectFromMap: { ko: "지도에서 선택", en: "Select from Map" },
  dragDropImage: { ko: "이미지를 드래그하여 업로드하거나 클릭하여 선택하세요", en: "Drag and drop image or click to select" },
  addTag: { ko: "태그 추가", en: "Add Tag" },
  customType: { ko: "기타 (직접입력)", en: "Other (Custom)" },
  uploadSuccess: { ko: "업로드 성공!", en: "Upload successful!" },
  uploadFailed: { ko: "업로드 실패", en: "Upload failed" },
  saveSuccess: { ko: "성공적으로 저장되었습니다!", en: "Saved successfully!" },
  saveFailed: { ko: "저장에 실패했습니다.", en: "Failed to save." },
  backToList: { ko: "목록으로 돌아가기", en: "Back to List" },
  imageUploading: { ko: "이미지 업로드 중...", en: "Image uploading..." },
  mapModalTitle: { ko: "지도에서 위치 선택", en: "Select Location on Map" },
  mapModalSearchPlaceholder: { ko: "장소를 검색하세요...", en: "Search for a place..." },
  mapModalSelected: { ko: "선택된 위치:", en: "Selected Location:" },
  mapModalApply: { ko: "적용", en: "Apply" },
  mapModalCancel: { ko: "취소", en: "Cancel" },
  mapModalClose: { ko: "닫기", en: "Close" },
  mapModalNoResult: { ko: "검색 결과가 없습니다.", en: "No search results." },
  mapModalSearching: { ko: "검색 중...", en: "Searching..." },
  basicInfo: { ko: "기본 정보", en: "Basic Info" },
  nameKo: { ko: "이름 (한국어)", en: "Name (Korean)" },
  nameEn: { ko: "이름 (영어)", en: "Name (English)" },
  descKo: { ko: "설명 (한국어)", en: "Description (Korean)" },
  descEn: { ko: "설명 (영어)", en: "Description (English)" },
  regionKo: { ko: "지역 (한국어)", en: "Region (Korean)" },
  regionEn: { ko: "지역 (영어)", en: "Region (English)" },
  addressKo: { ko: "주소 (한국어)", en: "Address (Korean)" },
  addressEn: { ko: "주소 (영어)", en: "Address (English)" },
  customTypeInput: { ko: "기타 타입 입력", en: "Enter custom type" },
  ko: { ko: "한국어", en: "Korean" },
  en: { ko: "영어", en: "English" },
  cancel: { ko: "취소", en: "Cancel" },
  loading: { ko: "저장 중...", en: "Saving..." },
  galleryDrop: { ko: "이미지를 드래그하여 업로드하거나 클릭하여 선택하세요", en: "Drag and drop image or click to select" },
  galleryClick: { ko: "클릭하여 선택하세요", en: "Click to select" },
  galleryMulti: { ko: "(여러 장 선택 가능)", en: "(Multiple selection allowed)" },
  imageClick: { ko: "클릭하여 선택하세요", en: "Click to select" },
};

// 타입 옵션
const TYPE_OPTIONS: TypeOption[] = [
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

// 계절 옵션
const SEASON_OPTIONS: SeasonOption[] = [
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

// 태그 옵션
const TAG_OPTIONS: TagOption[] = [
  { ko: "가족여행", en: "Family" },
  { ko: "커플여행", en: "Couple" },
  { ko: "친구와", en: "Friends" },
  { ko: "혼자", en: "Solo" },
  { ko: "효도여행", en: "Parents" },
  { ko: "인생샷", en: "Photo Spot" },
  { ko: "포토존", en: "Photo Zone" },
  { ko: "힐링", en: "Healing" },
  { ko: "액티비티", en: "Activity" },
  { ko: "트레킹", en: "Trekking" },
  { ko: "맛집탐방", en: "Food Tour" },
  { ko: "쇼핑", en: "Shopping" },
  { ko: "야경", en: "Night View" },
  { ko: "휴양", en: "Resort" },
  { ko: "온천", en: "Hot Spring" },
  { ko: "역사", en: "History" },
  { ko: "문화", en: "Culture" },
  { ko: "자연", en: "Nature" },
  { ko: "바다", en: "Sea" },
  { ko: "산", en: "Mountain" },
  { ko: "섬", en: "Island" },
  { ko: "골프", en: "Golf" },
  { ko: "스키/보드", en: "Ski/Board" },
  { ko: "테마파크", en: "Theme Park" },
  { ko: "축제/이벤트", en: "Festival/Event" },
  { ko: "시티투어", en: "City Tour" },
  { ko: "미식", en: "Gourmet" },
  { ko: "럭셔리", en: "Luxury" },
  { ko: "저렴이", en: "Budget" },
  { ko: "당일치기", en: "Day Trip" },
  { ko: "주말여행", en: "Weekend" }
];



// 국가별 지역 옵션
const REGION_OPTIONS_BY_COUNTRY = {
  KR: [
    { ko: '서울', en: 'Seoul' },
    { ko: '부산', en: 'Busan' },
    { ko: '제주', en: 'Jeju' },
    { ko: '경주', en: 'Gyeongju' },
    { ko: '전남', en: 'Jeonnam' },
    { ko: '경기도', en: 'Gyeonggi' },
    { ko: '강원도', en: 'Gangwon' },
    { ko: '인천', en: 'Incheon' },
    { ko: '대구', en: 'Daegu' },
    { ko: '광주', en: 'Gwangju' },
  ],
  PH: [
    { ko: '마닐라', en: 'Manila' },
    { ko: '세부', en: 'Cebu' },
    { ko: '보홀', en: 'Bohol' },
    { ko: '팔라완', en: 'Palawan' },
    { ko: '다바오', en: 'Davao' },
    { ko: '바기오', en: 'Baguio' },
    { ko: '푸에르토프린세사', en: 'Puerto Princesa' },
    { ko: '엘니도', en: 'El Nido' },
    { ko: '보라카이', en: 'Boracay' },
    { ko: '시아르가오', en: 'Siargao' },
  ],
  JP: [
    { ko: '도쿄', en: 'Tokyo' },
    { ko: '오사카', en: 'Osaka' },
    { ko: '교토', en: 'Kyoto' },
    { ko: '요코하마', en: 'Yokohama' },
    { ko: '나고야', en: 'Nagoya' },
    { ko: '삿포로', en: 'Sapporo' },
    { ko: '후쿠오카', en: 'Fukuoka' },
    { ko: '고베', en: 'Kobe' },
    { ko: '가와사키', en: 'Kawasaki' },
    { ko: '히로시마', en: 'Hiroshima' },
  ],
  VN: [
    { ko: '호치민', en: 'Ho Chi Minh City' },
    { ko: '하노이', en: 'Hanoi' },
    { ko: '다낭', en: 'Da Nang' },
    { ko: '하이퐁', en: 'Hai Phong' },
    { ko: '푸꾸옥', en: 'Phu Quoc' },
    { ko: '나트랑', en: 'Nha Trang' },
    { ko: '호이안', en: 'Hoi An' },
    { ko: '달랏', en: 'Da Lat' },
    { ko: '사파', en: 'Sapa' },
    { ko: '하롱베이', en: 'Ha Long Bay' },
  ],
  TW: [
    { ko: '타이페이', en: 'Taipei' },
    { ko: '가오슝', en: 'Kaohsiung' },
    { ko: '타이중', en: 'Taichung' },
    { ko: '타이난', en: 'Tainan' },
    { ko: '지룽', en: 'Keelung' },
    { ko: '신주', en: 'Hsinchu' },
    { ko: '자이', en: 'Chiayi' },
    { ko: '화롄', en: 'Hualien' },
    { ko: '타이둥', en: 'Taitung' },
    { ko: '핑둥', en: 'Pingtung' },
  ],
};

// 1. 타입 정의 추가
interface CountryOption {
  ko: string;
  en: string;
  code: string; // DB 저장용
}

// 2. 국가 옵션 상수 추가
const COUNTRY_OPTIONS: CountryOption[] = [
  { ko: '대한민국', en: 'Korea', code: 'KR' },
  { ko: '필리핀', en: 'Philippines', code: 'PH' },
  { ko: '일본', en: 'Japan', code: 'JP' },
  { ko: '베트남', en: 'Vietnam', code: 'VN' },
  { ko: '대만', en: 'Taiwan', code: 'TW' },
];

// Firebase Storage 업로드 함수 복구
const uploadImageToStorage = async (file: File, folder: string = "spots"): Promise<string> => {
  // 서버 API를 통한 업로드로 변경
  const result = await uploadFileToServer(file, folder);
  if (!result.success || !result.url) {
    throw new Error(result.error || 'Upload failed');
  }
  return result.url;
};

export default function NewSpotPage() {
  const { lang } = useLanguage();
  const router = useRouter();
  
  // Google Maps API 키
  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  
  // 폼 상태
  const [formData, setFormData] = useState<SpotFormData>({
    name: { ko: "", en: "", slug: "" },
    description: { ko: "", en: "", slug: "" },
    address: { ko: "", en: "", slug: "" },
    region: { ko: "", en: "", slug: "" },
    type: [] as string[],
    duration: { ko: "", en: "", slug: "" },
    price: { KRW: "", PHP: "", USD: "" },
    bestTime: [],
    tags: [],
    mapUrl: "",
    imageUrl: "",
    extraImages: [],
    country: { ko: "", en: "" }, // 추가된 상태
  });

  // 이미지 업로드 관련 상태
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // 1. 상태 추가
  const [country, setCountry] = useState<{ ko: string; en: string } | null>(null);

  const [validationErrors, setValidationErrors] = useState<{
    name: { ko: boolean; en: boolean };
    description: { ko: boolean; en: boolean };
    address: { ko: boolean; en: boolean };
    region: { ko: boolean; en: boolean };
    type: boolean;
    tags: boolean;
    mainImage: boolean;
    bestTime: boolean;
    country: boolean; // 추가된 에러 상태
  }>({
    name: { ko: false, en: false },
    description: { ko: false, en: false },
    address: { ko: false, en: false },
    region: { ko: false, en: false },
    type: false,
    tags: false,
    mainImage: false,
    bestTime: false,
    country: false, // 추가된 에러 상태
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Google Maps API 관련 상태
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  // Google Maps API 동적 로드 (중복 load 이벤트 등록 방지)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    function handleReady() {
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsGoogleMapsLoaded(true);
      }
    }

    // 이미 완전히 로드된 경우
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsGoogleMapsLoaded(true);
      return;
    }

    // 이미 스크립트가 추가된 경우
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      // load 이벤트 중복 등록 방지
      existingScript.removeEventListener('load', handleReady);
      existingScript.addEventListener('load', handleReady);
      // 이미 로드된 상태라면 바로 실행
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsGoogleMapsLoaded(true);
      }
      return;
    }

    // 스크립트가 없으면 추가
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.setAttribute('loading', 'async');
    script.onload = handleReady;
    document.body.appendChild(script);
  }, [GOOGLE_MAPS_API_KEY]);
  const [addressSearchResults, setAddressSearchResults] = useState<GooglePlaceResult[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);




  // 지도 모달 상태 및 임시 장소 상태
  const [showMapModal, setShowMapModal] = useState(false);
  const [tempPlace, setTempPlace] = useState<{
    address: string;
    region: string;
    lat: number;
    lng: number;
    addressEn: string;
    regionEn: string;
  } | null>(null);

  // 지역 선택 상태
  const [selectedRegion, setSelectedRegion] = useState<{ ko: string; en: string } | null>(null);

  // 지도 모달 내 input ref 준비
  const inputRef = useRef<HTMLInputElement>(null);
  // 지도 인스턴스와 마커 ref 추가
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);



  // 주소 선택 함수
  const selectAddress = (place: GooglePlaceResult): void => {
    const formattedAddress = place.formatted_address || '';
    if (formattedAddress) {
      // 한국어 주소 필드에 선택된 주소 설정
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          ko: formattedAddress,
          slug: formattedAddress
        }
      }));

      // 주소 컴포넌트에서 지역 추출
      if (place.address_components) {
        const regionComponent = place.address_components.find(component =>
          component.types.includes('administrative_area_level_1') ||
          component.types.includes('locality')
        );
        
        if (regionComponent) {
          setFormData(prev => ({
            ...prev,
            region: {
              ...prev.region,
              ko: regionComponent.long_name,
              slug: regionComponent.long_name
            }
          }));
        }
      }

      // 에러 상태 해제
      setValidationErrors(prev => ({
        ...prev,
        address: { ...prev.address, ko: false },
        region: { ...prev.region, ko: false }
      }));

      setShowAddressModal(false);
      setAddressSearchResults([]);
    }
  };

  const addTag = (tag: string): void => {
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      // 태그 선택 시 에러 상태 해제
      setValidationErrors(prev => ({
        ...prev,
        tags: false
      }));
    }
  };

  const removeTag = (tag: string): void => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const toggleType = (typeValue: string): void => {
    setFormData(prev => {
      const newTypes = prev.type.includes(typeValue)
        ? prev.type.filter(t => t !== typeValue)
        : [...prev.type, typeValue];
      
      // 타입 선택 시 에러 상태 해제
      if (newTypes.length > 0) {
        setValidationErrors(validationPrev => ({
          ...validationPrev,
          type: false
        }));
      }
      
      return { ...prev, type: newTypes };
    });
  };

  const toggleBestTime = (timeValue: string): void => {
    setFormData(prev => {
      const newBestTime = prev.bestTime.includes(timeValue)
        ? prev.bestTime.filter(t => t !== timeValue)
        : [...prev.bestTime, timeValue];
      
      // 추천시기 선택 시 에러 상태 해제
      if (newBestTime.length > 0) {
        setValidationErrors(validationPrev => ({
          ...validationPrev,
          bestTime: false
        }));
      }
      
      return { ...prev, bestTime: newBestTime };
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
  };



  // FileReader를 사용한 이미지 미리보기 생성
  const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  };

  // 대표 이미지 처리
  const handleImageChange = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    setThumbnailFile(file);
    const preview = await createImagePreview(file);
    setThumbnailPreview(preview);
    setValidationErrors(prev => ({ ...prev, mainImage: false }));
  };

  // 갤러리 이미지 처리
  const handleGalleryChange = async (files: FileList) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    setGalleryFiles(prev => [...prev, ...imageFiles]);
    
    const newPreviews = await Promise.all(imageFiles.map(file => createImagePreview(file)));
    setGalleryPreviews(prev => [...prev, ...newPreviews]);
  };

  // 갤러리 이미지 제거
  const removeGalleryImage = (index: number) => {
    setGalleryFiles(prev => prev.filter((_, i) => i !== index));
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // 대표 이미지 제거
  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview("");
  };

  const handleInputChange = (
    field: keyof Pick<SpotFormData, 'name' | 'description' | 'address' | 'region'>,
    lang: keyof MultilingualField,
    value: string
  ): void => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [lang]: value,
        slug: value
      }
    }));
  };

  // 4. validateForm 수정
  const validateForm = (): boolean => {
    const errors = {
      name: { 
        ko: !formData.name.ko.trim(), 
        en: !formData.name.en.trim() 
      },
      description: { 
        ko: !formData.description.ko.trim(), 
        en: !formData.description.en.trim() 
      },
      address: { 
        ko: !formData.address.ko.trim(), 
        en: !formData.address.en.trim() 
      },
      region: { 
        ko: !formData.region.ko.trim(), 
        en: !formData.region.en.trim() 
      },
      type: formData.type.length === 0,
      tags: formData.tags.length === 0,
      mainImage: !thumbnailFile,
      bestTime: formData.bestTime.length === 0,
      country: !country, // 추가된 에러 상태
    };
    setValidationErrors(errors);
    
    return !Object.values(errors).some(field => 
      typeof field === 'boolean' ? field : field.ko || field.en
    );
  };

  // 이미지 업로드 함수
  const uploadImages = async (): Promise<{ imageUrl: string; extraImages: string[] }> => {
    const uploadPromises: Promise<string>[] = [];
    const totalFiles = (thumbnailFile ? 1 : 0) + galleryFiles.length;
    let uploadedCount = 0;

    // 대표 이미지 업로드
    if (thumbnailFile) {
      uploadPromises.push(
        uploadImageToStorage(thumbnailFile, "spots").then(url => {
          uploadedCount++;
          setUploadProgress((uploadedCount / totalFiles) * 100);
          return url;
        })
      );
    }

    // 갤러리 이미지들 업로드
    galleryFiles.forEach(file => {
      uploadPromises.push(
        uploadImageToStorage(file, "spots").then(url => {
          uploadedCount++;
          setUploadProgress((uploadedCount / totalFiles) * 100);
          return url;
        })
      );
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    
    return {
      imageUrl: thumbnailFile ? uploadedUrls[0] : "",
      extraImages: thumbnailFile ? uploadedUrls.slice(1) : uploadedUrls
    };
  };

  // 5. handleSubmit에서 country 반영
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    setUploadProgress(0);
    
    try {
      // 이미지 업로드
      const imageUrls = await uploadImages();
      
      const spotData = {
        ...formData,
        country: country ? { ko: country.ko, en: COUNTRY_OPTIONS.find(opt => opt.ko === country.ko)?.code || '' } : { ko: '', en: '' },
        imageUrl: imageUrls.imageUrl,
        extraImages: imageUrls.extraImages,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      await addDoc(collection(db, "spots"), spotData);
      alert(TEXT.saveSuccess[lang]);
      router.push('/admin/spots');
    } catch (error) {
      console.error('Save failed:', error);
      alert(TEXT.saveFailed[lang]);
    } finally {
      setIsSaving(false);
      setUploadProgress(0);
    }
  };

  // 지도 선택 적용 (address.ko → address.en 자동 번역)
  const applyMapSelection = async () => {
            // Apply button clicked
    
    if (tempPlace) {
      setFormData(prev => ({
        ...prev,
        address: {
          ko: tempPlace.address,
          en: tempPlace.addressEn || tempPlace.address,
          slug: tempPlace.address
        },
        region: {
          ko: tempPlace.region,
          en: tempPlace.regionEn || tempPlace.region,
          slug: tempPlace.region
        },
        mapUrl: `https://maps.google.com/?q=${tempPlace.address}`
      }));
      // 주소 선택 시 에러 상태 해제
      setValidationErrors(prev => ({
        ...prev,
        address: { ko: false, en: false }
      }));
      setShowMapModal(false);
      setTempPlace(null);
    } else {
      console.error('tempPlace가 없습니다');
    }
  };

  // 지역 버튼 클릭 핸들러
  const handleRegionSelect = (region: { ko: string; en: string }) => {
    setSelectedRegion(region);
    setFormData(prev => ({
      ...prev,
      region: {
        ko: region.ko,
        en: region.en,
      }
    }));
    // 지역 선택 시 에러 상태 해제
    setValidationErrors(prev => ({
      ...prev,
      region: { ko: false, en: false }
    }));
  };

  // 지도 모달이 열릴 때 지도 초기화
  useEffect(() => {
    if (!isGoogleMapsLoaded || !showMapModal) return;
    
    // 약간의 지연을 추가하여 DOM이 완전히 렌더링되도록 함
    const timer = setTimeout(() => {
      const mapDiv = document.getElementById('map');
      if (!mapDiv) return;
      
      // 기존 지도 인스턴스가 있으면 제거
      if (mapInstance.current) {
        mapInstance.current = null;
      }
      
      const map = (new window.google.maps.Map(mapDiv, {
        center: { lat: 37.5665, lng: 126.9780 },
        zoom: 13,
      }) as google.maps.Map);
      
      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        if (markerRef.current) markerRef.current.setMap(null);
        markerRef.current = new window.google.maps.Marker({ position: { lat, lng }, map: map }) as google.maps.Marker;
        
        // Geocoding API로 주소 가져오기 (영어/한국어)
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng }, language: 'en' }, (resultsEn, statusEn) => {
          let addressEn = '';
          if (statusEn === 'OK' && resultsEn && resultsEn[0]) {
            addressEn = resultsEn[0].formatted_address || '';
          }
          
          // 한국어 주소 가져오기
          geocoder.geocode({ location: { lat, lng }, language: 'ko' }, (resultsKo, statusKo) => {
            let addressKo = '';
            if (statusKo === 'OK' && resultsKo && resultsKo[0]) {
              addressKo = resultsKo[0].formatted_address || '';
            }
            
            // 주소 폴백: 영어 주소가 없으면 한국어 주소 사용, 둘 다 없으면 빈 문자열
            const finalAddressEn = addressEn || (addressKo ? addressKo : '');
            const finalAddressKo = addressKo || (addressEn ? addressEn : '');
            
            setTempPlace({
              address: finalAddressKo,
              addressEn: finalAddressEn,
              region: '',
              regionEn: '',
              lat,
              lng
            });
          });
        });
      });
      
      mapInstance.current = map;
    }, 100);
    
    return () => {
      clearTimeout(timer);
    };
  }, [isGoogleMapsLoaded, showMapModal]);

  // Autocomplete 인스턴스 생성 및 이벤트 등록
  useEffect(() => {
    if (!isGoogleMapsLoaded || !showMapModal) return;
    
    // DOM이 완전히 렌더링될 때까지 대기
    const timer = setTimeout(() => {
      if (!inputRef.current) return;
      
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: ['kr', 'ph', 'us'] }
      });
      
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) return;
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        if (mapInstance.current) {
          mapInstance.current.setCenter({ lat, lng });
          mapInstance.current.setZoom(16);
        }
        if (markerRef.current) markerRef.current.setMap(null);
        markerRef.current = new window.google.maps.Marker({
          position: { lat, lng },
          map: mapInstance.current!
        }) as google.maps.Marker;
        
        // Geocoding API로 한국어와 영어 주소 각각 가져오기
        const geocoder = new window.google.maps.Geocoder();
        
        // 영어 주소 가져오기
        geocoder.geocode({ location: { lat, lng }, language: 'en' }, (resultsEn, statusEn) => {
          let addressEn = '';
          if (statusEn === 'OK' && resultsEn && resultsEn[0]) {
            addressEn = resultsEn[0].formatted_address || '';
          }
          
          // 한국어 주소 가져오기
          geocoder.geocode({ location: { lat, lng }, language: 'ko' }, (resultsKo, statusKo) => {
            let addressKo = '';
            if (statusKo === 'OK' && resultsKo && resultsKo[0]) {
              addressKo = resultsKo[0].formatted_address || '';
            }
            
            // 주소 폴백: 영어 주소가 없으면 한국어 주소 사용, 둘 다 없으면 빈 문자열
            const finalAddressEn = addressEn || (addressKo ? addressKo : '');
            const finalAddressKo = addressKo || (addressEn ? addressEn : '');
            
            setTempPlace({
              address: finalAddressKo,
              addressEn: finalAddressEn,
              region: '',
              regionEn: '',
              lat,
              lng
            });
          });
        });
      });
      
      // Cleanup function for autocomplete
      return () => {
        window.google.maps.event.clearInstanceListeners(autocomplete);
      };
    }, 100);
    
    return () => {
      clearTimeout(timer);
    };
  }, [isGoogleMapsLoaded, showMapModal]);

  // 지도 모달 닫힐 때 지도/마커 ref 초기화
  useEffect(() => {
    if (!showMapModal) {
      // 지도 인스턴스 정리
      if (mapInstance.current) {
        // 모든 이벤트 리스너 제거
        window.google.maps.event.clearInstanceListeners(mapInstance.current);
        mapInstance.current = null;
      }
      
      // 마커 정리
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      
      // 임시 장소 정보 초기화
      setTempPlace(null);
    }
  }, [showMapModal]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
        {/* Removed Script */}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{TEXT.title[lang]}</h1>
        {/* Removed router.push('/admin/spots') */}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6"
        onKeyDown={e => {
          if (e.key === 'Enter') e.preventDefault();
        }}
      >
        {/* 기본 정보 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">{TEXT.basicInfo[lang]}</h2>
          
          {/* 이름 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">{TEXT.name[lang]}</label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={formData.name.ko}
                onChange={(e) => handleInputChange('name', 'ko', e.target.value)}
                placeholder={TEXT.nameKo[lang]}
                className={`w-full p-2 border rounded ${validationErrors.name.ko ? 'border-red-500' : ''}`}
                required
              />
              <input
                type="text"
                value={formData.name.en}
                onChange={(e) => handleInputChange('name', 'en', e.target.value)}
                placeholder={TEXT.nameEn[lang]}
                className={`w-full p-2 border rounded ${validationErrors.name.en ? 'border-red-500' : ''}`}
                required
              />
            </div>
            {(validationErrors.name.ko || validationErrors.name.en) && (
              <p className="text-red-500 text-sm mt-1">이름을 모든 언어로 입력해주세요.</p>
            )}
          </div>

          {/* 설명 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">{TEXT.description[lang]}</label>
            <div className="grid grid-cols-2 gap-4">
              <textarea
                value={formData.description.ko}
                onChange={(e) => handleInputChange('description', 'ko', e.target.value)}
                placeholder={TEXT.descKo[lang]}
                rows={4}
                className={`w-full p-2 border rounded ${validationErrors.description.ko ? 'border-red-500' : ''}`}
                required
              />
              <textarea
                value={formData.description.en}
                onChange={(e) => handleInputChange('description', 'en', e.target.value)}
                placeholder={TEXT.descEn[lang]}
                rows={4}
                className={`w-full p-2 border rounded ${validationErrors.description.en ? 'border-red-500' : ''}`}
                required
              />
            </div>
            {(validationErrors.description.ko || validationErrors.description.en) && (
              <p className="text-red-500 text-sm mt-1">설명을 모든 언어로 입력해주세요.</p>
            )}
          </div>

          {/* 주소 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">{TEXT.address[lang]}</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  value={formData.address.ko}
                  onChange={(e) => handleInputChange('address', 'ko', e.target.value)}
                  placeholder={TEXT.addressKo[lang]}
                  className={`w-full p-2 border rounded ${validationErrors.address.ko ? 'border-red-500' : ''}`}
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  value={formData.address.en}
                  onChange={(e) => handleInputChange('address', 'en', e.target.value)}
                  placeholder={TEXT.addressEn[lang]}
                  className={`w-full p-2 border rounded ${validationErrors.address.en ? 'border-red-500' : ''}`}
                  required
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowMapModal(true)}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              {TEXT.selectFromMap[lang]}
            </button>
            {(validationErrors.address.ko || validationErrors.address.en) && (
              <p className="text-red-500 text-sm mt-1">주소를 모든 언어로 입력해주세요.</p>
            )}
          </div>

          {/* 국가 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">국가</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {COUNTRY_OPTIONS.map(option => (
                <PillButton
                  key={option.ko}
                  selected={country?.ko === option.ko}
                  onClick={() => {
                    setCountry({ ko: option.ko, en: option.code });
                    setValidationErrors(prev => ({ ...prev, country: false }));
                    // 국가가 변경되면 지역 선택 초기화
                    setSelectedRegion(null);
                    setFormData(prev => ({
                      ...prev,
                      region: { ko: "", en: "" }
                    }));
                  }}
                >
                  {lang === 'ko' ? option.ko : option.en}
                </PillButton>
              ))}
            </div>
            {validationErrors.country && (
              <p className="text-red-500 text-sm mt-1">국가를 선택해주세요.</p>
            )}
          </div>

          {/* 지역 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">{TEXT.region[lang]}</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {country ? (
                REGION_OPTIONS_BY_COUNTRY[country.ko === '대한민국' ? 'KR' : 
                  country.ko === '필리핀' ? 'PH' :
                  country.ko === '일본' ? 'JP' :
                  country.ko === '베트남' ? 'VN' :
                  country.ko === '대만' ? 'TW' : 'KR']?.map(region => (
                  <PillButton
                    key={region.ko}
                    selected={selectedRegion?.ko === region.ko}
                    onClick={() => handleRegionSelect(region)}
                  >
                    {region[lang]}
                  </PillButton>
                )) || []
              ) : (
                <p className="text-gray-500 text-sm">먼저 국가를 선택해주세요.</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={formData.region.ko}
                readOnly
                className={`w-full p-2 border rounded bg-gray-50 ${validationErrors.region.ko ? 'border-red-500' : ''}`}
                placeholder={TEXT.regionKo[lang]}
                required
              />
              <input
                type="text"
                value={formData.region.en}
                readOnly
                className={`w-full p-2 border rounded bg-gray-50 ${validationErrors.region.en ? 'border-red-500' : ''}`}
                placeholder={TEXT.regionEn[lang]}
                required
              />
            </div>
            {(validationErrors.region.ko || validationErrors.region.en) && (
              <p className="text-red-500 text-sm mt-1">지역을 선택해주세요.</p>
            )}
          </div>
        </div>



        {/* 이미지 업로드 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">{TEXT.image[lang]}</h2>
          
          {/* 대표 이미지 */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">{TEXT.image[lang]}</label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                validationErrors.mainImage ? 'border-red-500' : 'border-gray-300'
              }`}
              onDragOver={handleDragOver}
              onDrop={(e) => {
                e.preventDefault();
                const files = Array.from(e.dataTransfer.files);
                if (files.length > 0) {
                  handleImageChange(files[0]);
                }
              }}
            >
              {thumbnailPreview ? (
                <div className="relative inline-block">
                  <Image
                    src={thumbnailPreview}
                    alt="대표 이미지"
                    width={400}
                    height={192}
                    className="max-w-full h-48 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={removeThumbnail}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleImageChange(e.target.files[0])}
                    className="hidden"
                    id="main-image"
                  />
                  <label htmlFor="main-image" className="cursor-pointer">
                    <div className="text-gray-500">
                      <p className="mb-2">{TEXT.dragDropImage[lang]}</p>
                      <p className="text-blue-500 hover:text-blue-600">{TEXT.imageClick[lang]}</p>
                    </div>
                  </label>
                </div>
              )}
            </div>
            {validationErrors.mainImage && (
              <p className="text-red-500 text-sm mt-2">대표 이미지를 업로드해주세요.</p>
            )}
          </div>

          {/* 갤러리 이미지 */}
          <div>
            <label className="block text-sm font-medium mb-2">{TEXT.extraImages[lang]}</label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors"
              onDragOver={handleDragOver}
              onDrop={(e) => {
                e.preventDefault();
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                  handleGalleryChange(files);
                }
              }}
            >
              {galleryPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {galleryPreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <Image
                        src={preview}
                        alt={`갤러리 이미지 ${index + 1}`}
                        width={200}
                        height={128}
                        className="w-full h-32 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    handleGalleryChange(e.target.files);
                  }
                }}
                className="hidden"
                id="gallery-images"
              />
              <label htmlFor="gallery-images" className="cursor-pointer">
                <div className="text-gray-500">
                  <p className="mb-2">{TEXT.galleryDrop[lang]}</p>
                  <p className="text-blue-500 hover:text-blue-600">{TEXT.galleryClick[lang]}</p>
                  <p className="text-sm mt-2">{TEXT.galleryMulti[lang]}</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* 타입과 태그 섹션 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">분류</h2>
          
          {/* 타입 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">{TEXT.type[lang]}</label>
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((option) => (
                <PillButton
                  key={option.value}
                  selected={formData.type.includes(option.value)}
                  onClick={() => toggleType(option.value)}
                >
                  {option.label[lang]}
                </PillButton>
              ))}
            </div>
            {validationErrors.type && (
              <p className="text-red-500 text-sm mt-2">최소 1개의 타입을 선택해주세요.</p>
            )}
          </div>

          {/* 태그 선택 */}
          <div>
            <label className="block text-sm font-medium mb-2">{TEXT.tags[lang]}</label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((tag) => (
                <PillButton
                  key={tag[lang]}
                  selected={formData.tags.includes(tag[lang])}
                  onClick={() => {
                    if (formData.tags.includes(tag[lang])) {
                      removeTag(tag[lang]);
                    } else {
                      addTag(tag[lang]);
                    }
                  }}
                >
                  {tag[lang]}
                </PillButton>
              ))}
            </div>
            {validationErrors.tags && (
              <p className="text-red-500 text-sm mt-2">최소 1개의 태그를 선택해주세요.</p>
            )}
          </div>
        </div>

        {/* 추가 정보 섹션 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">추가 정보</h2>
          
          {/* 소요시간 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">{TEXT.duration[lang]}</label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={formData.duration.ko}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  duration: { ...prev.duration, ko: e.target.value, slug: e.target.value } 
                }))}
                placeholder="Korean duration (e.g : 2 hours)"
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                value={formData.duration.en}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  duration: { ...prev.duration, en: e.target.value, slug: e.target.value } 
                }))}
                placeholder="English duration (e.g., 2 hours)"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* 가격 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">{TEXT.price[lang]}</label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">KRW (₩)</label>
                <input
                  type="text"
                  value={formData.price.KRW}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    price: { ...prev.price, KRW: e.target.value } 
                  }))}
                  placeholder="0"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">PHP (₱)</label>
                <input
                  type="text"
                  value={formData.price.PHP}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    price: { ...prev.price, PHP: e.target.value } 
                  }))}
                  placeholder="0"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">USD ($)</label>
                <input
                  type="text"
                  value={formData.price.USD}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    price: { ...prev.price, USD: e.target.value } 
                  }))}
                  placeholder="0"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>

          {/* 추천시기 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">{TEXT.bestTime[lang]}</label>
            <div className="flex flex-wrap gap-2">
              {SEASON_OPTIONS.map((option) => (
                <PillButton
                  key={option.value}
                  selected={formData.bestTime.includes(option.value)}
                  onClick={() => toggleBestTime(option.value)}
                >
                  {option.label[lang]}
                </PillButton>
              ))}
            </div>
            {validationErrors.bestTime && (
              <p className="text-red-500 text-sm mt-2">최소 1개의 추천시기를 선택해주세요.</p>
            )}
          </div>

          {/* 지도 URL */}
          <div>
            <label className="block text-sm font-medium mb-2">{TEXT.mapUrl[lang]}</label>
            <input
              type="url"
              value={formData.mapUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, mapUrl: e.target.value }))}
              placeholder="Google Maps URL"
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="space-y-4">
          {/* 업로드 진행률 */}
          {isSaving && uploadProgress > 0 && (
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">이미지 업로드 중...</span>
                <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => {/* Removed router.push('/admin/spots') */}}
              className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              disabled={isSaving}
            >
              {TEXT.cancel[lang]}
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? TEXT.loading[lang] : TEXT.save[lang]}
            </button>
          </div>
        </div>
      </form>

      {/* 주소 검색 모달 */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{TEXT.mapModalTitle[lang]}</h3>
              <button
                onClick={() => setShowAddressModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                {TEXT.mapModalClose[lang]}
              </button>
            </div>
            
            <div className="mb-4">
              <input
                ref={inputRef}
                type="text"
                placeholder={TEXT.mapModalSearchPlaceholder[lang]}
                className="w-full p-2 border rounded"
                autoFocus
              />
            </div>

            <div className="max-h-60 overflow-y-auto">
              {addressSearchResults.length > 0 ? (
                <div className="space-y-2">
                  {addressSearchResults.map((place, index) => (
                    <button
                      key={index}
                      onClick={() => selectAddress(place)}
                      className="w-full text-left p-3 border rounded hover:bg-gray-50 transition-colors"
                    >
                      <p className="font-medium text-sm">
                        {place.formatted_address || '주소 없음'}
                      </p>
                      {place.geometry?.location && (
                        <p className="text-xs text-gray-500 mt-1">
                          좌표: {place.geometry.location.lat.toFixed(6)}, {place.geometry.location.lng.toFixed(6)}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">{TEXT.mapModalNoResult[lang]}</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowAddressModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                {TEXT.mapModalCancel[lang]}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 지도 선택 모달 */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{TEXT.mapModalTitle[lang]}</h3>
              <button
                onClick={() => setShowMapModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                {TEXT.mapModalClose[lang]}
              </button>
            </div>
            <div className="mb-4">
              <input
                ref={inputRef}
                type="text"
                placeholder={TEXT.mapModalSearchPlaceholder[lang]}
                className="w-full p-2 border rounded"
                autoFocus
              />
            </div>
            <div id="map" style={{ width: '100%', height: 350, marginBottom: 16, borderRadius: 8, border: '1px solid #eee' }} />
            {tempPlace && (
              <div className="space-y-2 mb-4">
                <p><strong>{TEXT.mapModalSelected[lang]}</strong></p>
                <p>주소 (한국어): {tempPlace.address}</p>
                <p>주소 (영어): {tempPlace.addressEn}</p>
                <p>좌표: {tempPlace.lat}, {tempPlace.lng}</p>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={applyMapSelection}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={!tempPlace}
              >
                {TEXT.mapModalApply[lang]}
              </button>
              <button
                onClick={() => setShowMapModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                {TEXT.mapModalCancel[lang]}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 