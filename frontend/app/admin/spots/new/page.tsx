"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../../../../components/LanguageContext";
import Script from "next/script";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from 'next/image';
import { useRouter } from "next/navigation";
import { z } from "zod";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

// Google Places API 스키마 (Zod)
const GooglePlaceSchema = z.object({
  formatted_address: z.string().optional(),
  address_components: z.array(z.object({
    long_name: z.string(),
    short_name: z.string(),
    types: z.array(z.string())
  })).optional(),
  geometry: z.object({
    location: z.object({
      lat: z.number(),
      lng: z.number()
    })
  }).optional()
});

type GooglePlaceResult = z.infer<typeof GooglePlaceSchema>;

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
  mainImage: string;
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
  const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
};

export default function NewSpotPage() {
  const { lang } = useLanguage();
  const router = useRouter();
  
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
    mainImage: "",
    extraImages: [],
  });

  const [customType, setCustomType] = useState("");
  const [customTag, setCustomTag] = useState("");
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
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [addressSearchResults, setAddressSearchResults] = useState<GooglePlaceResult[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 디바운싱을 위한 타이머
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 지역 선택 상태
  const [selectedRegion, setSelectedRegion] = useState<{ ko: string; en: string } | null>(null);

  // 주소 검색 함수
  const searchAddress = async (query: string): Promise<void> => {
    console.log('Searching address:', query);
    console.log('Google Maps loaded:', isGoogleMapsLoaded);
    
    if (!isGoogleMapsLoaded || !query.trim()) {
      console.log('Search skipped - Maps not loaded or empty query');
      setAddressSearchResults([]);
      return;
    }

    setIsSearchingAddress(true);
    try {
      // 실제 DOM 요소를 사용하여 PlacesService 초기화
      const mapDiv = document.getElementById('google-maps-container') || document.createElement('div');
      if (!document.getElementById('google-maps-container')) {
        mapDiv.id = 'google-maps-container';
        mapDiv.style.display = 'none';
        document.body.appendChild(mapDiv);
      }

      const service = new google.maps.places.PlacesService(mapDiv as HTMLDivElement);
      console.log('PlacesService created successfully');

      const request = {
        query: query,
        fields: ['formatted_address', 'address_components', 'geometry']
      };

      console.log('Making Places API request:', request);

      service.textSearch(request, (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
        console.log('Places API response status:', status);
        console.log('Places API results:', results);
        
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          // Zod로 결과 검증
          const validatedResults = results
            .map(result => {
              try {
                return GooglePlaceSchema.parse(result);
              } catch (error) {
                console.warn('Invalid place result:', error);
                return null;
              }
            })
            .filter((result): result is GooglePlaceResult => result !== null)
            .slice(0, 5); // 최대 5개 결과만

          console.log('Validated results:', validatedResults);
          setAddressSearchResults(validatedResults);
        } else {
          console.log('No results or error status');
          setAddressSearchResults([]);
        }
        setIsSearchingAddress(false);
      });
    } catch (error) {
      console.error('Address search failed:', error);
      setAddressSearchResults([]);
      setIsSearchingAddress(false);
    }
  };

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
      // 태그가 추가되면 태그 에러 해제
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
      
      // 타입 에러 상태 업데이트
      setValidationErrors(validationPrev => ({
        ...validationPrev,
        type: newTypes.length === 0
      }));
      
      return { ...prev, type: newTypes };
    });
  };

  const toggleBestTime = (timeValue: string): void => {
    setFormData(prev => {
      const newBestTime = prev.bestTime.includes(timeValue)
        ? prev.bestTime.filter(t => t !== timeValue)
        : [...prev.bestTime, timeValue];
      
      // 추천시기 에러 상태 업데이트
      setValidationErrors(validationPrev => ({
        ...validationPrev,
        bestTime: newBestTime.length === 0
      }));
      
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
        setFormData(prev => ({ ...prev, mainImage: url }));
        setValidationErrors(prev => ({
          ...prev,
          mainImage: false
        }));
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

    // 실시간 유효성 검사 (필수 필드만)
    if (['name', 'description', 'address', 'region'].includes(field)) {
      if (value.trim()) {
        setValidationErrors(prev => ({
          ...prev,
          [field]: { ...prev[field], [lang]: false }
        }));
      } else {
        setValidationErrors(prev => ({
          ...prev,
          [field]: { ...prev[field], [lang]: true }
        }));
      }
    }
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
      mainImage: !formData.mainImage.trim(),
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
      alert("필수 필드를 모두 입력해주세요.");
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
      router.push('/admin/spots');
    } catch (error) {
      console.error('Save failed:', error);
      alert(TEXT.saveFailed[lang]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 지도 선택 적용 (address.ko → address.en 자동 번역)
  const applyMapSelection = async () => {
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
      setShowMapModal(false);
      setTempPlace(null);
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
  };

  useEffect(() => {
    if (showMapModal && isGoogleMapsLoaded) {
      const mapDiv = document.getElementById('map');
      console.log('지도 div:', mapDiv);
      console.log('window.google:', google);
      if (!mapDiv || !google || !google.maps) return;
      const map = new google.maps.Map(mapDiv as HTMLElement, {
        center: { lat: 37.5665, lng: 126.9780 }, // 서울
        zoom: 13,
      });
      console.log('지도 초기화 완료');
      let marker: google.maps.Marker | null = null;
      // 지도 클릭 시 마커 및 주소/좌표 추출
      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        if (marker) marker.setMap(null);
        marker = new google.maps.Marker({ position: { lat, lng }, map });
        // Geocoding API로 주소 가져오기 (영어/한국어)
        const geocoder = new google.maps.Geocoder();
        // 영어 주소
        geocoder.geocode({ location: { lat, lng }, language: 'en' }, (resultsEn: google.maps.GeocoderResult[] | null, statusEn: google.maps.GeocoderStatus) => {
          let addressEn = '', regionEn = '';
          if (statusEn === 'OK' && resultsEn && resultsEn[0]) {
            addressEn = resultsEn[0].formatted_address || '';
            for (const comp of resultsEn[0].address_components) {
              if (comp.types.includes('administrative_area_level_1')) {
                regionEn = comp.long_name || '';
                break;
              }
            }
          }
          // 한국어 주소
          geocoder.geocode({ location: { lat, lng }, language: 'ko' }, (resultsKo: google.maps.GeocoderResult[] | null, statusKo: google.maps.GeocoderStatus) => {
            let addressKo = addressEn, regionKo = regionEn;
            if (statusKo === 'OK' && resultsKo && resultsKo[0]) {
              addressKo = resultsKo[0].formatted_address || addressEn;
              for (const comp of resultsKo[0].address_components) {
                if (comp.types.includes('administrative_area_level_1')) {
                  regionKo = comp.long_name || regionEn;
                  break;
                }
              }
            }
            setTempPlace({
              address: addressKo,
              region: regionKo,
              lat,
              lng,
              addressEn,
              regionEn,
            });
          });
        });
      });
      // 자동완성
      if (searchInputRef.current) {
        const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current);
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place.geometry || !place.geometry.location) return;
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          map.setCenter({ lat, lng });
          map.setZoom(16);
          if (marker) marker.setMap(null);
          marker = new google.maps.Marker({ position: { lat, lng }, map });
          // region 추출
          let regionString = '';
          if (place.address_components) {
            for (const comp of place.address_components) {
              if (comp.types.includes('administrative_area_level_1')) {
                regionString = comp.long_name || '';
                break;
              }
            }
          }
          setTempPlace({
            address: place.formatted_address || '',
            region: regionString,
            lat,
            lng,
            addressEn: place.formatted_address || '',
            regionEn: regionString,
          });
        });
      }
    }
  }, [showMapModal, isGoogleMapsLoaded]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="p-6">
      {/* Google Maps API 스크립트 */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        onLoad={() => {
          setIsGoogleMapsLoaded(true);
        }}
        strategy="afterInteractive"
      />
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{TEXT.title[lang]}</h1>
        <button
          onClick={() => router.push('/admin/spots')}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          {TEXT.backToList[lang]}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">{TEXT.basicInfo[lang]}</h2>
          
          {/* 이름 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">{TEXT.nameKo[lang]}</label>
              <input
                type="text"
                value={formData.name.ko}
                onChange={(e) => handleInputChange('name', 'ko', e.target.value)}
                className={`w-full p-2 border rounded ${validationErrors.name.ko ? 'border-red-500' : ''}`}
                required
              />
              {validationErrors.name.ko && (
                <p className="text-red-500 text-sm mt-1">한국어 이름을 입력해주세요.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{TEXT.nameEn[lang]}</label>
              <input
                type="text"
                value={formData.name.en}
                onChange={(e) => handleInputChange('name', 'en', e.target.value)}
                className={`w-full p-2 border rounded ${validationErrors.name.en ? 'border-red-500' : ''}`}
                required
              />
              {validationErrors.name.en && (
                <p className="text-red-500 text-sm mt-1">English name is required.</p>
              )}
            </div>
          </div>

          {/* 설명 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">{TEXT.descKo[lang]}</label>
              <textarea
                value={formData.description.ko}
                onChange={(e) => handleInputChange('description', 'ko', e.target.value)}
                className={`w-full p-2 border rounded h-24 ${validationErrors.description.ko ? 'border-red-500' : ''}`}
                required
              />
              {validationErrors.description.ko && (
                <p className="text-red-500 text-sm mt-1">한국어 설명을 입력해주세요.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{TEXT.descEn[lang]}</label>
              <textarea
                value={formData.description.en}
                onChange={(e) => handleInputChange('description', 'en', e.target.value)}
                className={`w-full p-2 border rounded h-24 ${validationErrors.description.en ? 'border-red-500' : ''}`}
                required
              />
              {validationErrors.description.en && (
                <p className="text-red-500 text-sm mt-1">English description is required.</p>
              )}
            </div>
          </div>

          {/* 주소 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">{TEXT.addressKo[lang]}</label>
              <div className="relative flex gap-2 items-center">
                <input
                  type="text"
                  value={formData.address.ko}
                  onChange={(e) => handleInputChange('address', 'ko', e.target.value)}
                  className={`w-full p-2 pr-10 border rounded ${validationErrors.address.ko ? 'border-red-500' : ''}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowMapModal(true)}
                  className="ml-1 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                >
                  {TEXT.selectFromMap[lang]}
                </button>
              </div>
              {validationErrors.address.ko && (
                <p className="text-red-500 text-sm mt-1">한국어 주소를 입력해주세요.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{TEXT.addressEn[lang]}</label>
              <input
                type="text"
                value={formData.address.en}
                onChange={(e) => handleInputChange('address', 'en', e.target.value)}
                className={`w-full p-2 border rounded ${validationErrors.address.en ? 'border-red-500' : ''}`}
                required
              />
              {validationErrors.address.en && (
                <p className="text-red-500 text-sm mt-1">English address is required.</p>
              )}
            </div>
          </div>

          {/* 지역 선택 버튼 UI */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">{TEXT.regionKo[lang]}</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {REGION_OPTIONS.map(region => (
                <button
                  key={region.ko}
                  type="button"
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${selectedRegion && selectedRegion.ko === region.ko ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  onClick={() => handleRegionSelect(region)}
                >
                  {region.ko} ({region.en})
                </button>
              ))}
            </div>
            <input
              type="text"
              value={formData.region.ko}
              readOnly
              className="w-full p-2 border rounded mb-2"
              placeholder="한국어 지역명"
            />
            <input
              type="text"
              value={formData.region.en}
              readOnly
              className="w-full p-2 border rounded"
              placeholder="영어 지역명"
            />
          </div>
        </div>

        {/* 타입 선택 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">{TEXT.type[lang]}</h2>
          <div className="flex flex-wrap gap-2 mb-4">
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
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={TEXT.customTypeInput[lang]}
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              className="flex-1 p-2 border rounded"
            />
            <button
              type="button"
              onClick={() => {
                if (customType.trim()) {
                  toggleType(customType.trim());
                  setCustomType("");
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {TEXT.addTag[lang]}
            </button>
          </div>
          {validationErrors.type && (
            <p className="text-red-500 text-sm mt-2">최소 1개의 타입을 선택해주세요.</p>
          )}
        </div>

        {/* 태그 선택 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">{TEXT.tags[lang]}</h2>
          <div className="flex flex-wrap gap-2 mb-4">
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
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="커스텀 태그 입력"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              className="flex-1 p-2 border rounded"
            />
            <button
              type="button"
              onClick={() => {
                if (customTag.trim()) {
                  addTag(customTag.trim());
                  setCustomTag("");
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {TEXT.addTag[lang]}
            </button>
          </div>
          {validationErrors.tags && (
            <p className="text-red-500 text-sm mt-2">최소 1개의 태그를 선택해주세요.</p>
          )}
        </div>

        {/* 이미지 업로드 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">{TEXT.image[lang]}</h2>
          
          {/* 대표 이미지 */}
          <div>
            <label className="block text-sm font-medium mb-2">{TEXT.image[lang]}</label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 ${
                validationErrors.mainImage ? 'border-red-500' : 'border-gray-300'
              }`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, true)}
              onClick={() => fileInputRef.current?.click()}
            >
              {formData.mainImage ? (
                <div className="relative">
                  <Image
                    src={formData.mainImage}
                    alt="Main"
                    width={200}
                    height={150}
                    className="mx-auto rounded"
                  />
                </div>
              ) : (
                <div>
                  <p className="text-gray-500">{TEXT.dragDropImage[lang]}</p>
                  {isUploading && <p className="text-blue-500 mt-2">{TEXT.imageUploading[lang]}</p>}
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0], true)}
              className="hidden"
            />
            {validationErrors.mainImage && (
              <p className="text-red-500 text-sm mt-2">대표 이미지를 업로드해주세요.</p>
            )}
          </div>
        </div>

        {/* 소요시간 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">{TEXT.duration[lang]}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{TEXT.duration[lang]} (한국어)</label>
              <input
                type="text"
                value={formData.duration.ko}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  duration: { ...prev.duration, ko: e.target.value, slug: e.target.value } 
                }))}
                placeholder="예: 30분, 1시간, 2시간 30분"
                className="w-full p-2 border rounded"
              />
              <p className="text-gray-500 text-sm mt-1">분 단위로 입력하세요 (예: 30분, 1시간)</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{TEXT.duration[lang]} (English)</label>
              <input
                type="text"
                value={formData.duration.en}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  duration: { ...prev.duration, en: e.target.value, slug: e.target.value } 
                }))}
                placeholder="예: 30 minutes, 1 hour, 2 hours 30 minutes"
                className="w-full p-2 border rounded"
              />
              <p className="text-gray-500 text-sm mt-1">Enter in minutes (e.g., 30 minutes, 1 hour)</p>
            </div>
          </div>
        </div>

        {/* 가격 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">{TEXT.price[lang]}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">KRW</label>
              <input
                type="text"
                value={formData.price.KRW}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  price: { ...prev.price, KRW: e.target.value } 
                }))}
                placeholder="₩"
                className="w-full p-2 border rounded"
              />
              <p className="text-gray-500 text-sm mt-1">한국 원화</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">PHP</label>
              <input
                type="text"
                value={formData.price.PHP}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  price: { ...prev.price, PHP: e.target.value } 
                }))}
                placeholder="₱"
                className="w-full p-2 border rounded"
              />
              <p className="text-gray-500 text-sm mt-1">필리핀 페소</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">USD</label>
              <input
                type="text"
                value={formData.price.USD}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  price: { ...prev.price, USD: e.target.value } 
                }))}
                placeholder="$"
                className="w-full p-2 border rounded"
              />
              <p className="text-gray-500 text-sm mt-1">미국 달러</p>
            </div>
          </div>
        </div>

        {/* 추천시기 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">{TEXT.bestTime[lang]}</h2>
          <div className="flex flex-wrap gap-2 mb-4">
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
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">{TEXT.mapUrl[lang]}</h2>
          <div>
            <label className="block text-sm font-medium mb-2">지도 URL</label>
            <input
              type="url"
              value={formData.mapUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, mapUrl: e.target.value }))}
              placeholder="https://maps.google.com/?q=..."
              className="w-full p-2 border rounded"
            />
            <p className="text-gray-500 text-sm mt-1">Google Maps URL을 입력하세요 (선택사항)</p>
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || 
              validationErrors.name.ko || 
              validationErrors.name.en || 
              validationErrors.description.ko || 
              validationErrors.description.en || 
              validationErrors.address.ko || 
              validationErrors.address.en || 
              validationErrors.region.ko || 
              validationErrors.region.en || 
              validationErrors.type || 
              validationErrors.tags || 
              validationErrors.mainImage || 
              validationErrors.bestTime}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isSubmitting ? "저장 중..." : TEXT.save[lang]}
          </button>
        </div>
      </form>

      {/* 주소 검색 모달 */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                type="text"
                placeholder={TEXT.mapModalSearchPlaceholder[lang]}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (searchTimeoutRef.current) {
                    clearTimeout(searchTimeoutRef.current);
                  }
                  searchTimeoutRef.current = setTimeout(() => {
                    searchAddress(e.target.value);
                  }, 500);
                }}
                className="w-full p-2 border rounded"
                autoFocus
              />
            </div>

            <div className="max-h-60 overflow-y-auto">
              {isSearchingAddress ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">{TEXT.mapModalSearching[lang]}</p>
                </div>
              ) : addressSearchResults.length > 0 ? (
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                ref={searchInputRef}
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