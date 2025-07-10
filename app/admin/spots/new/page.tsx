"use client";

/// <reference types="@types/google.maps" />

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../../../../components/LanguageContext";
import Image from 'next/image';
import { uploadFileToServer } from '@/lib/utils';
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected: boolean;
}

function PillButton({ selected, children, ...props }: PillButtonProps) {
  return (
    <button
      {...props}
      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
        selected
          ? "bg-blue-500 text-white"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
      }`}
    >
      {children}
    </button>
  );
}

// 지역 옵션 (한국어/영어)
const REGION_OPTIONS = [
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
  });


  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    name: { ko: boolean; en: boolean };
    description: { ko: boolean; en: boolean };
    address: { ko: boolean; en: boolean };
    region: { ko: boolean; en: boolean };
    type: boolean;
    tags: boolean;
    mainImage: boolean;
    bestTime: boolean;
  }>({
    name: { ko: false, en: false },
    description: { ko: false, en: false },
    address: { ko: false, en: false },
    region: { ko: false, en: false },
    type: false,
    tags: false,
    mainImage: false,
    bestTime: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Google Maps API 관련 상태
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  
  // 컴포넌트 마운트 시 Google Maps API 상태 확인
  useEffect(() => {
    // Google Maps API가 이미 로드되어 있는지 확인
    const checkGoogleMapsLoaded = () => {
      if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
        // Google Maps API already loaded
        setIsGoogleMapsLoaded(true);
        return true;
      }
      return false;
    };
    
    // 즉시 체크
    if (!checkGoogleMapsLoaded()) {
      // 100ms 후 다시 체크 (스크립트 로딩 시간 고려)
      const timer = setTimeout(() => {
        checkGoogleMapsLoaded();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, []);
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

  const handleDrop = async (
    e: React.DragEvent<HTMLDivElement>,
    isMain: boolean = false
  ): Promise<void> => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleImageFile(files[0], isMain);
    }
  };

  const handleImageFile = async (file: File, isMain: boolean = true): Promise<void> => {
    if (!file.type.startsWith('image/')) return;
    setIsUploading(true);
    try {
      const url = await uploadImageToStorage(file);
      if (isMain) {
        setFormData(prev => ({ ...prev, imageUrl: url }));
        setValidationErrors(prev => ({ ...prev, mainImage: false }));
      } else {
        setFormData(prev => ({ ...prev, extraImages: [...prev.extraImages, url] }));
      }
    } catch (error) {
      console.error('Image upload failed:', error);
    } finally {
      setIsUploading(false);
    }
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
      mainImage: !formData.imageUrl.trim(),
      bestTime: formData.bestTime.length === 0,
    };

    setValidationErrors(errors);
    
    return !Object.values(errors).some(field => 
      typeof field === 'boolean' ? field : field.ko || field.en
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    try {
      const spotData = {
        ...formData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      await addDoc(collection(db, "spots"), spotData);
      alert(TEXT.saveSuccess[lang]);
      // router.push('/admin/spots'); // Removed as per edit hint
    } catch (error) {
      console.error('Save failed:', error);
      alert(TEXT.saveFailed[lang]);
    } finally {
      setIsSubmitting(false);
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

          {/* 지역 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">{TEXT.region[lang]}</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {REGION_OPTIONS.map(region => (
                <button
                  key={region.ko}
                  type="button"
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedRegion && selectedRegion.ko === region.ko 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  onClick={() => handleRegionSelect(region)}
                >
                  {region[lang]}
                </button>
              ))}
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
              onDrop={(e) => handleDrop(e, true)}
            >
              {formData.imageUrl ? (
                <div className="relative inline-block">
                  <Image
                    src={formData.imageUrl}
                    alt="대표 이미지"
                    width={400}
                    height={300}
                    className="max-w-full h-48 object-cover rounded"
                    style={{ width: '100%', height: 'auto' }}
                    priority
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
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
                    onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0], true)}
                    className="hidden"
                    id="main-image"
                  />
                  <label htmlFor="main-image" className="cursor-pointer">
                    <div className="text-gray-500">
                      {isUploading ? (
                        <p>{TEXT.imageUploading[lang]}</p>
                      ) : (
                        <>
                          <p className="mb-2">{TEXT.dragDropImage[lang]}</p>
                          <p className="text-blue-500 hover:text-blue-600">클릭하여 선택하세요</p>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              )}
            </div>
            {validationErrors.mainImage && (
              <p className="text-red-500 text-sm mt-2">대표 이미지를 업로드해주세요.</p>
            )}
          </div>

          {/* 추가 이미지 */}
          <div>
            <label className="block text-sm font-medium mb-2">{TEXT.extraImages[lang]}</label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, false)}
            >
              {formData.extraImages.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {formData.extraImages.map((url, index) => (
                    <div key={index} className="relative">
                      <Image
                        src={url}
                        alt={`추가 이미지 ${index + 1}`}
                        width={200}
                        height={150}
                        className="w-full h-32 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newExtraImages = formData.extraImages.filter((_, i) => i !== index);
                          setFormData(prev => ({ ...prev, extraImages: newExtraImages }));
                        }}
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
                  Array.from(e.target.files || []).forEach(file => handleImageFile(file, false));
                }}
                className="hidden"
                id="extra-images"
              />
              <label htmlFor="extra-images" className="cursor-pointer">
                <div className="text-gray-500">
                  {isUploading ? (
                    <p>{TEXT.imageUploading[lang]}</p>
                  ) : (
                    <>
                      <p className="mb-2">추가 이미지를 드래그하여 업로드하거나</p>
                      <p className="text-blue-500 hover:text-blue-600">클릭하여 선택하세요</p>
                      <p className="text-sm mt-2">(여러 장 선택 가능)</p>
                    </>
                  )}
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
                placeholder="한국어 소요시간 (예: 2시간)"
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
        <div className="flex justify-end gap-4">
          {/* Removed router.push('/admin/spots') */}
          <button
            type="button"
            onClick={() => {/* Removed router.push('/admin/spots') */}}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            disabled={isSubmitting}
          >
            {TEXT.cancel[lang]}
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? TEXT.loading[lang] : TEXT.save[lang]}
          </button>
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
                <p>지역 (한국어): {tempPlace.region}</p>
                <p>지역 (영어): {tempPlace.regionEn}</p>
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