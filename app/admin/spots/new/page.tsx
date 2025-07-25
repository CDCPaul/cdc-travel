"use client";

/// <reference types="@types/google.maps" />

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../../../../components/LanguageContext";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { PillButton } from "@/components/ui/PillButton";
import ImageUploader from "@/components/ui/ImageUploader";
import { useRouter } from "next/navigation";
import { loadGoogleMapsAPI } from "@/lib/google-maps";
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
  tags: { ko: string; en: string }[];
  mapUrl: string;
  imageUrl: string;
  extraImages: string[];
  country: { ko: string; en: string }; // 추가된 필드
  coordinates?: { lat: number; lng: number }; // 위도/경도 추가
  isPublic: boolean; // 공개 여부 추가
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
  isPublic: { ko: "공개 여부", en: "Public Status" },
  public: { ko: "공개", en: "Public" },
  private: { ko: "비공개", en: "Private" },
  publicDescription: { ko: "공개로 설정하면 여행정보 페이지에서 보입니다.", en: "When set to public, it will be visible on the travel info page." },
  privateDescription: { ko: "비공개로 설정하면 여행정보 페이지에서 숨겨집니다.", en: "When set to private, it will be hidden from the travel info page." },
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



export default function NewSpotPage() {
  const { lang } = useLanguage();
  const router = useRouter();
  
  // ImageUploader refs
  const mainImageUploaderRef = useRef<{ uploadToStorage: () => Promise<{ urls: string[] }>; getLocalImages: () => { file: File; preview: string; originalName: string }[]; clearAll: () => void }>(null);
  const galleryImageUploaderRef = useRef<{ uploadToStorage: () => Promise<{ urls: string[] }>; getLocalImages: () => { file: File; preview: string; originalName: string }[]; clearAll: () => void }>(null);
  
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
    coordinates: undefined, // 좌표 필드 추가
    isPublic: true, // 공개 여부 (기본값: 공개)
  });

  // 이미지 업로드 관련 상태


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


  // Google Maps API 관련 상태
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  // Google Maps API 로드
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadAPI = async () => {
      try {
        await loadGoogleMapsAPI();
        setIsGoogleMapsLoaded(true);
      } catch (error) {
        console.error('Failed to load Google Maps API:', error);
      }
    };

    loadAPI();
  }, []);
  const [addressSearchResults, setAddressSearchResults] = useState<GooglePlaceResult[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);

  // 주소 검색 기능
  const searchAddress = async (query: string) => {
    if (!isGoogleMapsLoaded || !query.trim()) {
      setAddressSearchResults([]);
      return;
    }

    try {
      const service = new window.google.maps.places.AutocompleteService();
      const results = await service.getPlacePredictions({
        input: query,
        componentRestrictions: { country: ['kr', 'ph', 'us'] }
      });

      if (results.predictions) {
        const places = await Promise.all(
          results.predictions.slice(0, 5).map(async (prediction) => {
            const geocoder = new window.google.maps.Geocoder();
            const geocodeResult = await geocoder.geocode({ placeId: prediction.place_id });
            if (geocodeResult.results && geocodeResult.results[0]) {
              const place = geocodeResult.results[0];
              return {
                formatted_address: place.formatted_address,
                address_components: place.address_components,
                geometry: place.geometry ? {
                  location: {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                  }
                } : undefined
              } as GooglePlaceResult;
            }
            return null;
          })
        );

        setAddressSearchResults(places.filter(Boolean) as GooglePlaceResult[]);
      }
    } catch (error) {
      console.error('Address search error:', error);
      setAddressSearchResults([]);
    }
  };




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
        },
        // 좌표 정보 추가
        coordinates: place.geometry?.location ? {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng
        } : undefined
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

  const addTag = (tag: { ko: string; en: string }): void => {
    if (!formData.tags.some((t: { ko: string; en: string }) => t.ko === tag.ko && t.en === tag.en)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags as { ko: string; en: string }[]), tag]
      }));
      setValidationErrors(prev => ({
        ...prev,
        tags: false
      }));
    }
  };

  const removeTag = (tag: { ko: string; en: string }): void => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags as { ko: string; en: string }[]).filter(t => !(t.ko === tag.ko && t.en === tag.en))
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





  // FileReader를 사용한 이미지 미리보기 생성




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
    // ImageUploader ref를 통해 실제 이미지 선택 여부 확인
    const hasMainImage = mainImageUploaderRef.current && 
      mainImageUploaderRef.current.getLocalImages().length > 0;
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
      mainImage: !hasMainImage, // ImageUploader ref를 통해 확인
      bestTime: formData.bestTime.length ===0,
      country: !country, // 추가된 에러 상태
    };
    setValidationErrors(errors);
    
    return !Object.values(errors).some(field => 
      typeof field === 'boolean' ? field : field.ko || field.en
    );
  };

  // 이미지 업로드 함수
  // 이미지 업로드는 ImageUploader 컴포넌트에서 처리되므로 별도 함수 불필요

  // 5. handleSubmit에서 country 반영
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    console.log('=== 저장 버튼 클릭됨 ===');
    if (!validateForm()) {
      console.log('검증 실패로 저장 중단');
      return;
    }
    
    console.log('검증 통과, 저장 시작');
    setIsSaving(true);
    
    try {
      console.log('이미지업로드 처리 시작');
      // 이미지 업로드 처리
      let mainImageUrl = formData.imageUrl;
      let extraImageUrls = [...formData.extraImages];
      
      // 대표 이미지 업로드
      if (mainImageUploaderRef.current) {
        console.log('대표 이미지 업로드 시작');
        const mainImageResult = await mainImageUploaderRef.current.uploadToStorage();
        if (mainImageResult.urls.length > 0) {
          mainImageUrl = mainImageResult.urls[0];
          console.log('대표 이미지 업로드 완료:', mainImageUrl);
        }
      } else {
        console.log('mainImageUploaderRef.current가 null입니다');
      }
      
      // 갤러리 이미지 업로드
      if (galleryImageUploaderRef.current) {
        console.log('갤러리 이미지 업로드 시작');
        const galleryResult = await galleryImageUploaderRef.current.uploadToStorage();
        if (galleryResult.urls.length > 0) {
          extraImageUrls = [...extraImageUrls, ...galleryResult.urls];
          console.log('갤러리 이미지 업로드 완료:', galleryResult.urls);
        }
      } else {
        console.log('galleryImageUploaderRef.current가 null입니다');
      }
      
      console.log('Firestore 저장 시작');
      const spotData = {
        ...formData,
        imageUrl: mainImageUrl,
        extraImages: extraImageUrls,
        country: country ? { ko: country.ko, en: COUNTRY_OPTIONS.find(opt => opt.ko === country.ko)?.en || '' } : { ko: '', en: '' },
        coordinates: formData.coordinates, // 좌표 정보 포함
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      console.log('저장할 데이터:', spotData);
      await addDoc(collection(db, "spots"), spotData);
      console.log('Firestore 저장 완료');
      
      // 활동 기록
      try {
        const user = auth.currentUser;
        if (user) {
          const idToken = await user.getIdToken();
          await fetch('/api/users/activity', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              action: 'spotCreate',
              details: `새 스팟 "${formData.name[lang]}" 생성 - ${Object.keys(spotData).join(', ')}`,
              userId: user.uid,
              userEmail: user.email
            })
          });
        }
      } catch (error) {
        console.error('활동 기록 실패:', error);
      }
      
      alert(TEXT.saveSuccess[lang]);
      router.push('/admin/spots');
    } catch (error) {
      console.error('Save failed:', error);
      alert(TEXT.saveFailed[lang]);
    } finally {
      setIsSaving(false);
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
        mapUrl: `https://maps.google.com/?q=${tempPlace.address}`,
        coordinates: {
          lat: tempPlace.lat,
          lng: tempPlace.lng
        }
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
              <div className="relative">
                <input
                  type="text"
                  value={formData.address.ko}
                  onChange={(e) => handleInputChange('address', 'ko', e.target.value)}
                  placeholder={TEXT.addressKo[lang]}
                  className={`w-full p-2 border rounded pr-20 ${validationErrors.address.ko ? 'border-red-500' : ''}`}
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

          {/* 좌표 정보 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">좌표 정보</label>
            <div className="bg-gray-50 p-3 rounded border">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">위도 (Latitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.coordinates?.lat || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      coordinates: {
                        lat: parseFloat(e.target.value) || 0,
                        lng: prev.coordinates?.lng || 0
                      }
                    }))}
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">경도 (Longitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.coordinates?.lng || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      coordinates: {
                        lat: prev.coordinates?.lat || 0,
                        lng: parseFloat(e.target.value) || 0
                      }
                    }))}
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Google Maps에서 자동으로 가져온 좌표입니다. 필요시 수동으로 수정할 수 있습니다.
              </div>
            </div>
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
            <ImageUploader
              ref={mainImageUploaderRef}
              onImagesSelected={(files) => {
                // 로컬 파일 선택 시 처리
                console.log('대표 이미지 선택됨:', files.length);
              }}
              folder="spots"
              multiple={false}
              usage="spot-main"
              className={validationErrors.mainImage ? 'border-red-500' : ''}
            />
            {validationErrors.mainImage && (
              <p className="text-red-500 text-sm mt-2">대표 이미지를 업로드해주세요.</p>
            )}
          </div>

          {/* 갤러리 이미지 */}
          <div>
            <label className="block text-sm font-medium mb-2">{TEXT.extraImages[lang]}</label>
            <ImageUploader
              ref={galleryImageUploaderRef}
              onImagesSelected={(files) => {
                // 로컬 파일 선택 시 처리
                console.log('갤러리 이미지 선택됨:', files.length);
              }}
              folder="spots"
              multiple={true}
              maxFiles={10}
              usage="spot-gallery"
            />
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
                  selected={formData.tags.some(t => t.ko === tag.ko && t.en === tag.en)}
                  onClick={() => {
                    if (formData.tags.some(t => t.ko === tag.ko && t.en === tag.en)) {
                      removeTag(tag);
                    } else {
                      addTag(tag);
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

          {/* 공개 여부 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">{TEXT.isPublic[lang]}</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isPublic"
                  value="true"
                  checked={formData.isPublic === true}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.value === 'true' }))}
                  className="mr-2"
                />
                <span className="text-sm">{TEXT.public[lang]}</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isPublic"
                  value="false"
                  checked={formData.isPublic === false}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.value === 'true' }))}
                  className="mr-2"
                />
                <span className="text-sm">{TEXT.private[lang]}</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formData.isPublic ? TEXT.publicDescription[lang] : TEXT.privateDescription[lang]}
            </p>
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="space-y-4">
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
              <h3 className="text-lg font-semibold">주소 검색</h3>
              <button
                onClick={() => setShowAddressModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <input
                ref={inputRef}
                type="text"
                placeholder="주소를 검색하세요..."
                className="w-full p-2 border rounded"
                onChange={(e) => searchAddress(e.target.value)}
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
                  <p className="text-gray-500">검색 결과가 없습니다.</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowAddressModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                취소
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