"use client";

/// <reference types="@types/google.maps" />

import { useState, useEffect } from "react";
import { useLanguage } from "../../../../../components/LanguageContext";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from 'next/image';
import { useParams, useRouter } from "next/navigation";
import { PillButton } from "@/components/ui/PillButton";
import { uploadFileToServer } from "@/lib/utils";
import { loadGoogleMapsAPI } from "@/lib/google-maps";
import { useRef } from "react";



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
  country: { ko: string; en: string };
  coordinates?: { lat: number; lng: number }; // 위도/경도 추가
  isPublic: boolean; // 공개 여부 추가
}

// 타입 옵션
const TYPE_OPTIONS = [
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

// 태그 옵션
const TAG_OPTIONS = [
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

// 계절/추천시기 옵션
const SEASON_OPTIONS = [
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

// 1. COUNTRY_OPTIONS 상수 추가
const COUNTRY_OPTIONS = [
  { ko: '대한민국', en: 'Korea', code: 'KR' },
  { ko: '필리핀', en: 'Philippines', code: 'PH' },
  { ko: '일본', en: 'Japan', code: 'JP' },
  { ko: '베트남', en: 'Vietnam', code: 'VN' },
  { ko: '대만', en: 'Taiwan', code: 'TW' },
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

// TEXT에 country 관련 다국어 추가
const TEXT = {
  title: { ko: "스팟 편집", en: "Edit Spot" },
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
  cancel: { ko: "취소", en: "Cancel" },
  loading: { ko: "로딩 중...", en: "Loading..." },
  notFound: { ko: "스팟을 찾을 수 없습니다.", en: "Spot not found." },
  updateSuccess: { ko: "성공적으로 수정되었습니다!", en: "Updated successfully!" },
  updateFailed: { ko: "수정에 실패했습니다.", en: "Failed to update." },
  backToList: { ko: "목록으로 돌아가기", en: "Back to List" },
  // 섹션 제목
  basicInfoSection: { ko: "기본 정보", en: "Basic Information" },
  imageSection: { ko: "이미지", en: "Images" },
  categorySection: { ko: "분류", en: "Category" },
  additionalInfoSection: { ko: "추가 정보", en: "Additional Information" },
  // 입력 필드 플레이스홀더
  nameKoPlaceholder: { ko: "한국어 이름", en: "Korean Name" },
  nameEnPlaceholder: { ko: "영어 이름", en: "English Name" },
  descKoPlaceholder: { ko: "한국어 설명", en: "Korean Description" },
  descEnPlaceholder: { ko: "영어 설명", en: "English Description" },
  addressKoPlaceholder: { ko: "한국어 주소", en: "Korean Address" },
  addressEnPlaceholder: { ko: "영어 주소", en: "English Address" },
  regionKoPlaceholder: { ko: "한국어 지역 (예: 서울, 부산)", en: "Korean Region (e.g., 서울, 부산)" },
  regionEnPlaceholder: { ko: "영어 지역 (예: Seoul, Busan)", en: "English Region (e.g., Seoul, Busan)" },
  durationKoPlaceholder: { ko: "한국어 소요시간 (예: 2시간)", en: "Korean Duration (e.g., 2시간)" },
  durationEnPlaceholder: { ko: "영어 소요시간 (예: 2 hours)", en: "English Duration (e.g., 2 hours)" },
  // 이미지 업로드 관련
  uploadingText: { ko: "업로드 중...", en: "Uploading..." },
  dragDropText: { ko: "이미지를 드래그하여 업로드하거나", en: "Drag and drop image or" },
  clickSelectText: { ko: "클릭하여 선택하세요", en: "click to select" },
  multipleImagesText: { ko: "(여러 장 선택 가능)", en: "(Multiple images allowed)" },
  uploadFailedText: { ko: "이미지 업로드에 실패했습니다.", en: "Failed to upload image." },
  deleteText: { ko: "삭제", en: "Delete" },
  // 확인 메시지
  unsavedChangesText: { ko: "저장하지 않은 변경사항이 있습니다. 정말 나가시겠습니까?", en: "You have unsaved changes. Are you sure you want to leave?" },
  confirmCancelText: { ko: "변경사항을 저장하지 않고 나가시겠습니까?", en: "Do you want to leave without saving changes?" },
  country: { ko: '국가', en: 'Country' },
  selectCountry: { ko: '국가 선택', en: 'Select Country' },
  countryRequired: { ko: '국가를 선택해주세요.', en: 'Please select a country.' },
  regionRequired: { ko: '지역을 선택해주세요.', en: 'Please select a region.' },
  selectCountryFirst: { ko: '먼저 국가를 선택해주세요.', en: 'Please select a country first.' },
  validationFailed: { ko: '다음 필수 항목을 입력해주세요:', en: 'Please fill in the following required fields:' },
  // 공개 여부 관련
  isPublic: { ko: "공개 여부", en: "Public Status" },
  public: { ko: "공개", en: "Public" },
  private: { ko: "비공개", en: "Private" },
  publicDescription: { ko: "공개로 설정하면 여행정보 페이지에서 보입니다.", en: "When set to public, it will be visible on the travel info page." },
  privateDescription: { ko: "비공개로 설정하면 여행정보 페이지에서 숨겨집니다.", en: "When set to private, it will be hidden from the travel info page." },
};

// Firebase Storage 업로드 함수
const uploadImageToStorage = async (file: File, folder: string = "spots"): Promise<string> => {
  // 서버 API를 통한 업로드로 변경
  const result = await uploadFileToServer(file, folder);
  if (!result.success || !result.url) {
    throw new Error(result.error || 'Upload failed');
  }
  return result.url;
};

// Firebase Storage에서 이미지 삭제
const deleteImageFromStorage = async (url: string): Promise<void> => {
  try {
    const res = await fetch('/api/delete-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (!data.success) {
      // 에러는 콘솔에만 찍고 throw하지 않음
      console.error('Error deleting image from storage via API:', data.error);
      return;
    }
    console.log('Successfully deleted image from storage via API');
  } catch (error) {
    console.error('Error deleting image from storage via API:', error);
    // throw하지 않음
  }
};

export default function EditSpotPage() {
  const { lang } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const spotId = params.id as string;
  
  // 로딩 상태
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [spotNotFound, setSpotNotFound] = useState(false);
  
  // 원본 데이터 보관 (취소 시 복원용)
  const [originalData, setOriginalData] = useState<SpotFormData | null>(null);
  
  // 삭제할 이미지 URL 추적 (저장 시 Storage에서 삭제)
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  
  // 새로 업로드할 이미지 파일들 (저장 시에만 업로드)
  const [newMainImageFile, setNewMainImageFile] = useState<File | null>(null);
  const [newExtraImageFiles, setNewExtraImageFiles] = useState<File[]>([]);
  
  // 이미지 미리보기 (새로 선택된 파일들)
  const [mainImagePreview, setMainImagePreview] = useState<string>("");
  const [extraImagePreviews, setExtraImagePreviews] = useState<string[]>([]);
  
  // country 상태 추가
  const [country, setCountry] = useState<{ ko: string; en: string } | null>(null);
  
  // 지역 선택 상태 추가
  const [selectedRegion, setSelectedRegion] = useState<{ ko: string; en: string } | null>(null);
  
  // 폼 상태
  const [formData, setFormData] = useState<SpotFormData>({
    name: { ko: "", en: "", slug: "" },
    description: { ko: "", en: "", slug: "" },
    address: { ko: "", en: "", slug: "" },
    region: { ko: "", en: "", slug: "" },
    type: [],
    duration: { ko: "", en: "" },
    price: { KRW: "", PHP: "", USD: "" },
    bestTime: [],
    tags: [],
    mapUrl: "",
    imageUrl: "",
    extraImages: [],
    country: { ko: "", en: "" },
    isPublic: true, // 공개 여부 (기본값: 공개)
  });

  // 검증 오류 상태
  const [validationErrors, setValidationErrors] = useState<{
    name: boolean;
    description: boolean;
    address: boolean;
    region: boolean;
    type: boolean;
    duration: boolean;
    price: boolean;
    bestTime: boolean;
    tags: boolean;
    mapUrl: boolean;
    imageUrl: boolean;
    extraImages: boolean;
    country: boolean;
  }>({
    name: false,
    description: false,
    address: false,
    region: false,
    type: false,
    duration: false,
    price: false,
    bestTime: false,
    tags: false,
    mapUrl: false,
    imageUrl: false,
    extraImages: false,
    country: false,
  });

  // 검증 오류 메시지 상태
  const [validationMessage, setValidationMessage] = useState<string>("");

  // Google Maps 관련 상태
  const [showMapModal, setShowMapModal] = useState(false);
  
  // 이미지 미리보기 생성 함수
  const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  };

  // 지역 선택 핸들러
  const handleRegionSelect = (region: { ko: string; en: string }) => {
    setSelectedRegion(region);
    setFormData(prev => ({
      ...prev,
      region: { ko: region.ko, en: region.en }
    }));
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [tempPlace, setTempPlace] = useState<{ address: string; addressEn: string; lat: number; lng: number } | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  // 지도 모달 useEffect
  useEffect(() => {
    if (!showMapModal) return;
    let marker: google.maps.Marker | null = null;
    const mapDiv = document.getElementById('map');
    if (!mapDiv) return;
    const map = new window.google.maps.Map(mapDiv, {
      center: formData.coordinates || { lat: 37.5665, lng: 126.9780 },
      zoom: 13,
    });
    if (formData.coordinates) {
      marker = new window.google.maps.Marker({
        position: formData.coordinates,
        map: map,
      });
      markerRef.current = marker;
      setTempPlace({
        address: formData.address.ko,
        addressEn: formData.address.en,
        lat: formData.coordinates.lat,
        lng: formData.coordinates.lng,
      });
    }
    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      if (marker) marker.setMap(null);
      marker = new window.google.maps.Marker({ position: { lat, lng }, map: map });
      markerRef.current = marker;
      // Geocoding API로 주소(ko/en) 가져오기
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng }, language: 'ko' }, (resultsKo, statusKo) => {
        let addressKo = '';
        if (statusKo === 'OK' && resultsKo && resultsKo[0]) {
          addressKo = resultsKo[0].formatted_address || '';
        }
        geocoder.geocode({ location: { lat, lng }, language: 'en' } , (resultsEn, statusEn) => {
          let addressEn = '';
          if (statusEn === 'OK' && resultsEn && resultsEn[0]) {
            addressEn = resultsEn[0].formatted_address || '';
          }
          setTempPlace({ address: addressKo, addressEn, lat, lng });
        });
      });
    });
  }, [showMapModal, formData.coordinates, formData.address.ko, formData.address.en]);

  // 검색어 입력 시 Google Places Autocomplete
  useEffect(() => {
    if (!showMapModal || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const service = new window.google.maps.places.AutocompleteService();
    service.getPlacePredictions({ input: searchQuery, componentRestrictions: { country: ["kr", "ph", "us"] } }, (predictions, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
        setSearchResults(predictions);
      } else {
        setSearchResults([]);
      }
    });
  }, [searchQuery, showMapModal]);

  // 검색 결과 클릭 시 지도/마커 이동 및 주소(ko/en) 갱신
  const handleSearchResultClick = (placeId: string) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ placeId }, (results, status) => {
      if (status === 'OK' && results && results[0] && results[0].geometry && results[0].geometry.location) {
        const lat = results[0].geometry.location.lat();
        const lng = results[0].geometry.location.lng();
        const mapDiv = document.getElementById('map');
        if (!mapDiv) return;
        const map = markerRef.current ? markerRef.current.getMap() as google.maps.Map : new window.google.maps.Map(mapDiv, { center: { lat, lng }, zoom: 13 });
        if (markerRef.current) markerRef.current.setMap(null);
        const marker = new window.google.maps.Marker({ position: { lat, lng }, map: map });
        markerRef.current = marker;
        map.setCenter({ lat, lng });
        // 주소(ko/en) 동시 갱신
        geocoder.geocode({ location: { lat, lng }, language: 'ko' }, (resultsKo, statusKo) => {
          let addressKo = '';
          if (statusKo === 'OK' && resultsKo && resultsKo[0]) {
            addressKo = resultsKo[0].formatted_address || '';
          }
          geocoder.geocode({ location: { lat, lng }, language: 'en' }, (resultsEn, statusEn) => {
            let addressEn = '';
            if (statusEn === 'OK' && resultsEn && resultsEn[0]) {
              addressEn = resultsEn[0].formatted_address || '';
            }
            setTempPlace({ address: addressKo, addressEn, lat, lng });
          });
        });
      }
    });
  };

  // 적용 버튼 클릭 시 폼에 반영
  const handleApplyMapSelection = () => {
    if (tempPlace) {
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, ko: tempPlace.address, en: tempPlace.addressEn },
        coordinates: { lat: tempPlace.lat, lng: tempPlace.lng },
      }));
    }
    setShowMapModal(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  // 폼 검증 함수
  const validateForm = (): boolean => {
    const errors = {
      name: !formData.name.ko || !formData.name.en,
      description: !formData.description.ko || !formData.description.en,
      address: !formData.address.ko || !formData.address.en,
      region: !selectedRegion,
      type: formData.type.length === 0,
      duration: false, // duration은 선택사항이므로 항상 유효
      price: false, // price는 선택사항이므로 항상 유효
      bestTime: formData.bestTime.length === 0,
      tags: formData.tags.length === 0,
      mapUrl: !formData.mapUrl,
      imageUrl: !formData.imageUrl && !newMainImageFile, // 기존 이미지가 있거나 새 이미지가 선택되어야 함
      extraImages: formData.extraImages.length === 0 && newExtraImageFiles.length === 0, // 기존 이미지가 있거나 새 이미지가 선택되어야 함
      country: !country,
    };
    
    console.log('=== 검증 상세 결과 ===');
    console.log('name:', formData.name.ko, formData.name.en, '->', errors.name);
    console.log('description:', formData.description.ko, formData.description.en, '->', errors.description);
    console.log('address:', formData.address.ko, formData.address.en, '->', errors.address);
    console.log('region:', selectedRegion, '->', errors.region);
    console.log('type:', formData.type, '->', errors.type);
    console.log('duration:', formData.duration.ko, formData.duration.en, '->', errors.duration);
    console.log('price:', formData.price, '->', errors.price);
    console.log('price 구조:', JSON.stringify(formData.price));
    console.log('bestTime:', formData.bestTime, '->', errors.bestTime);
    console.log('tags:', formData.tags, '->', errors.tags);
    console.log('mapUrl:', formData.mapUrl, '->', errors.mapUrl);
    console.log('imageUrl:', formData.imageUrl, '->', errors.imageUrl);
    console.log('extraImages:', formData.extraImages, '->', errors.extraImages);
    console.log('country:', country, '->', errors.country);
    
    const hasErrors = Object.values(errors).some(error => error === true);
    console.log('전체 검증 결과:', hasErrors);
    
    // 검증 오류 메시지 생성
    if (hasErrors) {
      const errorMessages: string[] = [];
      
      if (errors.name) errorMessages.push(TEXT.name[lang]);
      if (errors.description) errorMessages.push(TEXT.description[lang]);
      if (errors.address) errorMessages.push(TEXT.address[lang]);
      if (errors.region) errorMessages.push(TEXT.region[lang]);
      if (errors.type) errorMessages.push(TEXT.type[lang]);
      if (errors.bestTime) errorMessages.push(TEXT.bestTime[lang]);
      if (errors.tags) errorMessages.push(TEXT.tags[lang]);
      if (errors.mapUrl) errorMessages.push(TEXT.mapUrl[lang]);
      if (errors.imageUrl) errorMessages.push(TEXT.image[lang]);
      if (errors.extraImages) errorMessages.push(TEXT.extraImages[lang]);
      if (errors.country) errorMessages.push(TEXT.country[lang]);
      
      const message = `${TEXT.validationFailed[lang]}\n\n${errorMessages.join('\n')}`;
      setValidationMessage(message);
    } else {
      setValidationMessage("");
    }
    
    setValidationErrors(errors);
    return !hasErrors;
  };

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
  };

  const handleDrop = async (
    e: React.DragEvent<HTMLDivElement>,
    isMain: boolean = false
  ): Promise<void> => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      if (isMain) {
        await handleImageFile(files[0], true);
      } else {
        // 추가 이미지는 여러 개 처리
        for (const file of files) {
          await handleImageFile(file, false);
        }
      }
    }
  };

  const handleImageFile = async (file: File, isMain: boolean = true): Promise<void> => {
    if (!file.type.startsWith('image/')) return;
    
    try {
      const preview = await createImagePreview(file);
      
      if (isMain) {
        setNewMainImageFile(file);
        setMainImagePreview(preview);
      } else {
        setNewExtraImageFiles(prev => [...prev, file]);
        setExtraImagePreviews(prev => [...prev, preview]);
      }
    } catch (error) {
      console.error('Image preview creation failed:', error);
      alert(TEXT.uploadFailedText[lang]);
    }
  };

  // 새로 업로드할 이미지들 처리 함수
  const uploadNewImages = async (): Promise<{ imageUrl: string; extraImages: string[] }> => {
    const uploadPromises: Promise<string>[] = [];
    
    // 새 대표 이미지 업로드
    if (newMainImageFile) {
      uploadPromises.push(
        uploadImageToStorage(newMainImageFile, "spots").then(url => {
          return url;
        })
      );
    }

    // 새 추가 이미지들 업로드
    newExtraImageFiles.forEach(file => {
      uploadPromises.push(
        uploadImageToStorage(file, "spots").then(url => {
          return url;
        })
      );
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    
    return {
      imageUrl: newMainImageFile ? uploadedUrls[0] : formData.imageUrl,
      extraImages: [
        ...formData.extraImages, // 기존 이미지들
        ...(newMainImageFile ? uploadedUrls.slice(1) : uploadedUrls) // 새로 업로드된 이미지들
      ]
    };
  };

  // 스팟 데이터 불러오기
  useEffect(() => {
    const fetchSpot = async () => {
      try {
        const spotDoc = await getDoc(doc(db, "spots", spotId));
        if (spotDoc.exists()) {
          const data = spotDoc.data();
          
                  // Raw data from Firebase loaded
          
          // tags가 객체인 경우 배열로 변환
          let tagsArray: { ko: string; en: string }[] = [];
          if (Array.isArray(data.tags)) {
            tagsArray = data.tags.map(tag => {
              if (typeof tag === 'object' && tag !== null && 'ko' in tag && 'en' in tag) {
                const t = tag as { ko: unknown; en: unknown };
                return { ko: String(t.ko), en: String(t.en) };
              } else if (typeof tag === 'string') {
                return { ko: tag, en: tag };
              }
              return { ko: '', en: '' };
            });
          } else if (data.tags && typeof data.tags === 'object') {
            const values = Object.values(data.tags);
            tagsArray = values.map(tag => {
              if (typeof tag === 'object' && tag !== null && 'ko' in tag && 'en' in tag) {
                const t = tag as { ko: unknown; en: unknown };
                return { ko: String(t.ko), en: String(t.en) };
              } else if (typeof tag === 'string') {
                return { ko: tag, en: tag };
              }
              return { ko: '', en: '' };
            });
          }
          
                      // Tags processed successfully
          
          // 데이터 형식 맞추기
          const spotFormData: SpotFormData = {
            name: data.name || { ko: "", en: "", slug: "" },
            description: data.description || { ko: "", en: "", slug: "" },
            address: data.address || { ko: "", en: "", slug: "" },
            region: data.region || { ko: "", en: "", slug: "" },
            type: Array.isArray(data.type) ? data.type : [],
            duration: data.duration || { ko: "", en: "" },
            price: data.price || { KRW: "", PHP: "", USD: "" },
            bestTime: Array.isArray(data.bestTime) ? data.bestTime : [],
            tags: tagsArray,
            mapUrl: data.mapUrl || "",
            imageUrl: data.imageUrl || "",
            extraImages: Array.isArray(data.extraImages) ? data.extraImages : [],
            country: data.country || { ko: "", en: "" },
            coordinates: data.coordinates || undefined, // 좌표 정보 추가
            isPublic: data.isPublic !== undefined ? data.isPublic : true, // 공개 여부 (기본값: 공개)
          };
          
          setFormData(spotFormData);
          setOriginalData(spotFormData); // 원본 데이터 저장
          
          // 지역 선택 상태 설정
          if (spotFormData.region && spotFormData.region.ko && spotFormData.region.en) {
            setSelectedRegion({ ko: spotFormData.region.ko, en: spotFormData.region.en });
          }
          
          if (spotFormData.country) {
            if (typeof spotFormData.country === 'object' && 'ko' in spotFormData.country && 'en' in spotFormData.country) {
              setCountry({ ko: spotFormData.country.ko, en: spotFormData.country.en });
            } else if (typeof spotFormData.country === 'string') {
              // 만약 문자열로만 저장된 경우(이전 데이터 호환)
              const countryStr = spotFormData.country as unknown as string;
              const found = COUNTRY_OPTIONS.find(opt => opt.code === countryStr || opt.ko === countryStr || opt.en === countryStr);
              if (found) setCountry({ ko: found.ko, en: found.code });
            }
          }
        } else {
          setSpotNotFound(true);
        }
      } catch (error) {
        console.error("Error fetching spot:", error);
        setSpotNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (spotId) {
      fetchSpot();
    }
  }, [spotId]);

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== 저장 버튼 클릭됨 ===');
    console.log('formData:', formData);
    console.log('country:', country);
    console.log('selectedRegion:', selectedRegion);
    
    const isValid = validateForm();
    console.log('validateForm 결과:', isValid);
    console.log('validationErrors:', validationErrors);
    
    if (!isValid) {
      console.log('검증 실패로 저장 중단');
      alert(validationMessage);
      return;
    }
    
    setIsSubmitting(true);

    try {
      console.log('=== 저장 프로세스 시작 ===');
      console.log('spotId:', spotId);
      
      // 1. 새로 업로드할 이미지들 먼저 처리
      let finalImageUrl = formData.imageUrl;
      let finalExtraImages = [...formData.extraImages];
      
      if (newMainImageFile || newExtraImageFiles.length > 0) {
        console.log('새 이미지 업로드 시작...');
        const { imageUrl, extraImages } = await uploadNewImages();
        finalImageUrl = imageUrl;
        finalExtraImages = extraImages;
        console.log('새 이미지 업로드 완료');
      }
      
      // 2. Firestore에 저장할 데이터 정제
      const payload = {
        name: { ko: formData.name.ko, en: formData.name.en },
        description: { ko: formData.description.ko, en: formData.description.en },
        address: { ko: formData.address.ko, en: formData.address.en },
        region: { ko: formData.region.ko, en: formData.region.en },
        type: formData.type,
        duration: { ko: formData.duration.ko, en: formData.duration.en },
        price: formData.price,
        bestTime: formData.bestTime,
        tags: formData.tags,
        mapUrl: formData.mapUrl,
        imageUrl: finalImageUrl,
        extraImages: finalExtraImages,
        country: country ? { ko: country.ko, en: COUNTRY_OPTIONS.find(opt => opt.ko === country.ko)?.code || '' } : { ko: '', en: '' },
        coordinates: formData.coordinates, // 좌표 정보 포함
        isPublic: formData.isPublic, // 공개 여부 포함
        updatedAt: Timestamp.now(),
      };
      
      console.log('업데이트할 데이터:', payload);
      
      // 3. 데이터베이스 업데이트
      await updateDoc(doc(db, "spots", spotId), payload);
      
      // 4. Storage에서 삭제할 이미지들 처리 (DB 업데이트 성공 후)
      if (imagesToDelete.length > 0) {
        console.log('삭제할 이미지들 처리 중...', imagesToDelete);
        const uniqueImagesToDelete = Array.from(new Set(imagesToDelete));
        for (const url of uniqueImagesToDelete) {
          await deleteImageFromStorage(url);
        }
        console.log('이미지 삭제 완료');
      }
      
      console.log('=== 저장 성공 ===');
      alert(TEXT.updateSuccess[lang]);
      router.push("/admin/spots");
    } catch (error) {
      console.error("=== 저장 실패 ===");
      console.error("Error updating spot:", error);
      console.error("Error details:", error);
      alert(TEXT.updateFailed[lang]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google Maps API 로딩
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadAPI = async () => {
      try {
        await loadGoogleMapsAPI();
      } catch (error) {
        console.error('Failed to load Google Maps API:', error);
      }
    };

    loadAPI();
  }, []);

  // 페이지를 떠날 때 경고
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (originalData && JSON.stringify(formData) !== JSON.stringify(originalData)) {
        e.preventDefault();
        e.returnValue = TEXT.unsavedChangesText[lang];
        return TEXT.unsavedChangesText[lang];
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData, originalData, lang]);

  // 로딩 중
  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center py-10">{TEXT.loading[lang]}</div>
      </div>
    );
  }

  // 스팟을 찾을 수 없음
  if (spotNotFound) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center py-10">
          <p className="mb-4">{TEXT.notFound[lang]}</p>
          <button
            onClick={() => {
              router.push("/admin/spots");
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {TEXT.backToList[lang]}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{TEXT.title[lang]}</h1>
        <button
          type="button"
          onClick={() => {
            if (originalData && JSON.stringify(formData) !== JSON.stringify(originalData)) {
              if (window.confirm(TEXT.confirmCancelText[lang])) {
                setImagesToDelete([]);
                router.push("/admin/spots");
              }
            } else {
              setImagesToDelete([]);
              router.push("/admin/spots");
            }
          }}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          disabled={isSubmitting}
        >
          {TEXT.backToList[lang]}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 섹션 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">{TEXT.basicInfoSection[lang]}</h2>
          
          {/* 이름 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">{TEXT.name[lang]}</label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={formData.name.ko}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  name: { ...prev.name, ko: e.target.value }
                }))}
                placeholder={TEXT.nameKoPlaceholder[lang]}
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="text"
                value={formData.name.en}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  name: { ...prev.name, en: e.target.value }
                }))}
                placeholder={TEXT.nameEnPlaceholder[lang]}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>

          {/* 설명 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">{TEXT.description[lang]}</label>
            <div className="grid grid-cols-2 gap-4">
              <textarea
                value={formData.description.ko}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  description: { ...prev.description, ko: e.target.value }
                }))}
                placeholder={TEXT.descKoPlaceholder[lang]}
                rows={4}
                className="w-full p-2 border rounded"
              />
              <textarea
                value={formData.description.en}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  description: { ...prev.description, en: e.target.value }
                }))}
                placeholder={TEXT.descEnPlaceholder[lang]}
                rows={4}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* 주소 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">{TEXT.address[lang]}</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <input
                  type="text"
                  value={formData.address.ko}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address, ko: e.target.value }
                  }))}
                  placeholder={TEXT.addressKoPlaceholder[lang]}
                  className="w-full p-2 border rounded pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowMapModal(true)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                >
                  지도에서 선택
                </button>
              </div>
              <input
                type="text"
                value={formData.address.en}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  address: { ...prev.address, en: e.target.value }
                }))}
                placeholder={TEXT.addressEnPlaceholder[lang]}
                className="w-full p-2 border rounded"
              />
            </div>
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
            <label className="block text-sm font-medium mb-2">{TEXT.country[lang]}</label>
            <div className="flex flex-wrap gap-2">
              {COUNTRY_OPTIONS.map((countryOption) => (
                <PillButton
                  key={countryOption.code}
                  selected={country?.ko === countryOption.ko}
                  onClick={() => {
                    setCountry({ ko: countryOption.ko, en: countryOption.en });
                    // 국가가 변경되면 지역 선택 초기화
                    setSelectedRegion(null);
                    setFormData(prev => ({
                      ...prev,
                      region: { ko: "", en: "" }
                    }));
                  }}
                >
                  {lang === 'ko' ? countryOption.ko : countryOption.en}
                </PillButton>
              ))}
            </div>
            {validationErrors.country && (
              <p className="text-red-500 text-sm mt-1">{TEXT.countryRequired[lang]}</p>
            )}
          </div>

          {/* 지역 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">{TEXT.region[lang]}</label>
            <div className="flex flex-wrap gap-2">
              {country ? (
                REGION_OPTIONS_BY_COUNTRY[country.ko === '대한민국' ? 'KR' : 
                  country.ko === '필리핀' ? 'PH' :
                  country.ko === '일본' ? 'JP' :
                  country.ko === '베트남' ? 'VN' :
                  country.ko === '대만' ? 'TW' : 'KR']?.map((region) => (
                  <PillButton
                    key={region.ko}
                    selected={selectedRegion?.ko === region.ko}
                    onClick={() => handleRegionSelect(region)}
                  >
                    {lang === 'ko' ? region.ko : region.en}
                  </PillButton>
                )) || []
              ) : (
                <p className="text-gray-500 text-sm">{TEXT.selectCountryFirst[lang]}</p>
              )}
            </div>
            {validationErrors.region && (
              <p className="text-red-500 text-sm mt-1">{TEXT.regionRequired[lang]}</p>
            )}
          </div>
        </div>

        {/* 이미지 섹션 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">{TEXT.imageSection[lang]}</h2>
          
          {/* 대표 이미지 */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">{TEXT.image[lang]}</label>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, true)}
            >
              {mainImagePreview ? (
                // 새로 선택된 이미지 미리보기
                <div className="relative inline-block">
                  <Image
                    src={mainImagePreview}
                    alt="대표 이미지 미리보기"
                    width={400}
                    height={300}
                    className="max-w-full h-48 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setNewMainImageFile(null);
                      setMainImagePreview("");
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ) : formData.imageUrl ? (
                // 기존 이미지
                <div className="relative inline-block">
                  <Image
                    src={formData.imageUrl}
                    alt="대표 이미지"
                    width={400}
                    height={300}
                    className="max-w-full h-48 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.imageUrl) {
                        setImagesToDelete(prev => [...prev, formData.imageUrl]);
                      }
                      setFormData(prev => ({ ...prev, imageUrl: '' }));
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ) : (
                // 업로드 UI
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0], true)}
                    className="hidden"
                    id="main-image"
                  />
                  <label htmlFor="main-image" className="cursor-pointer">
                    <div className="text-gray-500">
                      <p className="mb-2">{TEXT.dragDropText[lang]}</p>
                      <p className="text-blue-500 hover:text-blue-600">{TEXT.clickSelectText[lang]}</p>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* 추가 이미지 */}
          <div>
            <label className="block text-sm font-medium mb-2">{TEXT.extraImages[lang]}</label>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, false)}
            >
              {/* 기존 추가 이미지들 */}
              {formData.extraImages.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {formData.extraImages.map((url, index) => (
                    <div key={`existing-${index}`} className="relative">
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
                          const imageToDelete = formData.extraImages[index];
                          if (imageToDelete) {
                            setImagesToDelete(prev => [...prev, imageToDelete]);
                          }
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
              
              {/* 새로 선택된 추가 이미지들 미리보기 */}
              {extraImagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {extraImagePreviews.map((preview, index) => (
                    <div key={`new-${index}`} className="relative">
                      <Image
                        src={preview}
                        alt={`새 추가 이미지 ${index + 1}`}
                        width={200}
                        height={150}
                        className="w-full h-32 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setNewExtraImageFiles(prev => prev.filter((_, i) => i !== index));
                          setExtraImagePreviews(prev => prev.filter((_, i) => i !== index));
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
                  <p className="mb-2">{TEXT.dragDropText[lang]}</p>
                  <p className="text-blue-500 hover:text-blue-600">{TEXT.clickSelectText[lang]}</p>
                  <p className="text-sm mt-2">{TEXT.multipleImagesText[lang]}</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* 타입과 태그 섹션 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">{TEXT.categorySection[lang]}</h2>
          
          {/* 타입 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">{TEXT.type[lang]}</label>
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((option) => (
                <PillButton
                  key={option.value}
                  type="button"
                  selected={formData.type.includes(option.value)}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      type: prev.type.includes(option.value)
                        ? prev.type.filter(t => t !== option.value)
                        : [...prev.type, option.value]
                    }));
                  }}
                >
                  {option.label[lang]}
                </PillButton>
              ))}
            </div>
          </div>

          {/* 태그 선택 */}
          <div>
            <label className="block text-sm font-medium mb-2">{TEXT.tags[lang]}</label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((tag) => (
                <PillButton
                  key={tag.ko}
                  type="button"
                  selected={formData.tags.some(t => t.ko === tag.ko && t.en === tag.en)}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      tags: prev.tags.some(t => t.ko === tag.ko && t.en === tag.en)
                        ? prev.tags.filter(t => !(t.ko === tag.ko && t.en === tag.en))
                        : [...prev.tags, tag]
                    }));
                  }}
                >
                  {tag[lang]}
                </PillButton>
              ))}
            </div>
          </div>
        </div>

        {/* 추가 정보 섹션 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">{TEXT.additionalInfoSection[lang]}</h2>

          {/* 소요시간 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">{TEXT.duration[lang]}</label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={formData.duration.ko}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  duration: { ...prev.duration, ko: e.target.value }
                }))}
                placeholder={TEXT.durationKoPlaceholder[lang]}
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                value={formData.duration.en}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  duration: { ...prev.duration, en: e.target.value }
                }))}
                placeholder={TEXT.durationEnPlaceholder[lang]}
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
                  type="button"
                  selected={formData.bestTime.includes(option.value)}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      bestTime: prev.bestTime.includes(option.value)
                        ? prev.bestTime.filter(t => t !== option.value)
                        : [...prev.bestTime, option.value]
                    }));
                  }}
                >
                  {option.label[lang]}
                </PillButton>
              ))}
            </div>
          </div>

          {/* 지도 URL */}
          <div>
            <label className="block text-sm font-medium mb-2">{TEXT.mapUrl[lang]}</label>
            <input
              type="url"
              value={formData.mapUrl}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                mapUrl: e.target.value
              }))}
              placeholder="Google Maps URL"
              className="w-full p-2 border rounded"
            />
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
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => {
              if (originalData && JSON.stringify(formData) !== JSON.stringify(originalData)) {
                if (window.confirm(TEXT.confirmCancelText[lang])) {
                  setImagesToDelete([]);
                  setNewMainImageFile(null);
                  setNewExtraImageFiles([]);
                  setMainImagePreview("");
                  setExtraImagePreviews([]);
                  router.push("/admin/spots");
                }
              } else {
                setImagesToDelete([]);
                setNewMainImageFile(null);
                setNewExtraImageFiles([]);
                setMainImagePreview("");
                setExtraImagePreviews([]);
                router.push("/admin/spots");
              }
            }}
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

      {/* 지도 선택 모달 */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">지도에서 위치 선택</h3>
              <button
                onClick={() => setShowMapModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                닫기
              </button>
            </div>
            <div className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="장소 또는 주소를 검색하세요..."
                className="w-full p-2 border rounded mb-2"
              />
              {searchResults.length > 0 && (
                <div className="max-h-40 overflow-y-auto border rounded mb-2 bg-white z-10">
                  {searchResults.map(result => (
                    <div
                      key={result.place_id}
                      className="p-2 cursor-pointer hover:bg-blue-100"
                      onClick={() => handleSearchResultClick(result.place_id)}
                    >
                      {result.description}
                    </div>
                  ))}
                </div>
              )}
              <div id="map" style={{ width: '100%', height: 350, marginBottom: 16, borderRadius: 8, border: '1px solid #eee' }}></div>
              {tempPlace && (
                <div className="space-y-2 mb-4">
                  <p><strong>선택된 위치:</strong></p>
                  <p>주소 (한국어): {tempPlace.address}</p>
                  <p>주소 (영어): {tempPlace.addressEn}</p>
                  <p>좌표: {tempPlace.lat}, {tempPlace.lng}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleApplyMapSelection}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={!tempPlace}
              >
                적용
              </button>
              <button
                onClick={() => setShowMapModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 