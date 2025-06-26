"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../../../components/LanguageContext";
import Script from "next/script";
import { collection, addDoc, getDocs, Timestamp, query, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CheckIcon } from '@heroicons/react/24/solid';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase";

// 구글맵 타입 오류 방지용 글로벌 선언
declare global {
  interface Window {
    google: any;
  }
}

// 다국어 텍스트
const TEXT = {
  title: { ko: "스팟 관리", en: "Spot Management" },
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
  listRegion: { ko: "지역", en: "Region" },
  listImage: { ko: "대표 이미지", en: "Main Image" },
  listName: { ko: "이름", en: "Name" },
  listTags: { ko: "태그", en: "Tags" },
  listCreated: { ko: "등록일", en: "Created" },
  edit: { ko: "편집", en: "Edit" },
  delete: { ko: "삭제", en: "Delete" },
  addSpot: { ko: "+ 새 스팟 등록", en: "+ Add Spot" },
  backToList: { ko: "목록으로 돌아가기", en: "Back to List" },
  noData: { ko: "등록된 스팟이 없습니다.", en: "No spots found." },
  loading: { ko: "로딩 중...", en: "Loading..." },
  confirmDelete: { ko: "정말 삭제하시겠습니까?", en: "Are you sure you want to delete?" },
  deleted: { ko: "삭제되었습니다.", en: "Deleted." },
  deleteFailed: { ko: "삭제에 실패했습니다.", en: "Failed to delete." },
  updated: { ko: "수정되었습니다.", en: "Updated." },
  spotEdit: { ko: "스팟 편집", en: "Edit Spot" },
  spotAdd: { ko: "새 스팟 등록", en: "Add New Spot" },
  imageUploading: { ko: "이미지 업로드 중...", en: "Image uploading..." },
};

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

// 계절 옵션
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

// 구글 place types → 내부 태그 매핑
const PLACE_TYPE_TO_TAG: Record<string, { ko: string; en: string }> = {
  restaurant: { ko: "맛집탐방", en: "Food Tour" },
  food: { ko: "맛집탐방", en: "Food Tour" },
  cafe: { ko: "카페", en: "Cafe" },
  park: { ko: "자연", en: "Nature" },
  natural_feature: { ko: "자연", en: "Nature" },
  museum: { ko: "문화", en: "Culture" },
  art_gallery: { ko: "문화", en: "Culture" },
  shopping_mall: { ko: "쇼핑", en: "Shopping" },
  store: { ko: "쇼핑", en: "Shopping" },
  spa: { ko: "온천", en: "Hot Spring" },
  golf_course: { ko: "골프", en: "Golf" },
  amusement_park: { ko: "테마파크", en: "Theme Park" },
  zoo: { ko: "테마파크", en: "Theme Park" },
  aquarium: { ko: "테마파크", en: "Theme Park" },
  lodging: { ko: "휴양", en: "Resort" },
  hotel: { ko: "휴양", en: "Resort" },
  night_club: { ko: "야경", en: "Night View" },
  bar: { ko: "야경", en: "Night View" },
  tourist_attraction: { ko: "관광지", en: "Tourist Attraction" },
  city_hall: { ko: "시티투어", en: "City Tour" },
  // ... 필요시 추가
};

// 국가 옵션 상수 추가
const COUNTRY_OPTIONS = [
  { en: 'KR', ko: '대한민국' },
  { en: 'PH', ko: '필리핀' },
  { en: 'JP', ko: '일본' },
  { en: 'TW', ko: '대만' },
];

// 리전 표준화 유틸리티
const REGION_NORMALIZATION: Record<string, { ko: string; en: string; slug: string }> = {
  '서울특별시': { ko: '서울', en: 'Seoul', slug: 'seoul' },
  '부산광역시': { ko: '부산', en: 'Busan', slug: 'busan' },
  '대구광역시': { ko: '대구', en: 'Daegu', slug: 'daegu' },
  '인천광역시': { ko: '인천', en: 'Incheon', slug: 'incheon' },
  '광주광역시': { ko: '광주', en: 'Gwangju', slug: 'gwangju' },
  '대전광역시': { ko: '대전', en: 'Daejeon', slug: 'daejeon' },
  '울산광역시': { ko: '울산', en: 'Ulsan', slug: 'ulsan' },
  '세종특별자치시': { ko: '세종', en: 'Sejong', slug: 'sejong' },
  '경기도': { ko: '경기', en: 'Gyeonggi', slug: 'gyeonggi' },
  '강원도': { ko: '강원', en: 'Gangwon', slug: 'gangwon' },
  '충청북도': { ko: '충북', en: 'Chungbuk', slug: 'chungbuk' },
  '충청남도': { ko: '충남', en: 'Chungnam', slug: 'chungnam' },
  '전라북도': { ko: '전북', en: 'Jeonbuk', slug: 'jeonbuk' },
  '전라남도': { ko: '전남', en: 'Jeonnam', slug: 'jeonnam' },
  '경상북도': { ko: '경북', en: 'Gyeongbuk', slug: 'gyeongbuk' },
  '경상남도': { ko: '경남', en: 'Gyeongnam', slug: 'gyeongnam' },
  '제주특별자치도': { ko: '제주', en: 'Jeju', slug: 'jeju' },
  // 필요시 추가
};

function normalizeRegion(regionKo: string, regionEn: string) {
  if (REGION_NORMALIZATION[regionKo]) {
    return {
      ko: REGION_NORMALIZATION[regionKo].ko,
      en: REGION_NORMALIZATION[regionKo].en,
      slug: REGION_NORMALIZATION[regionKo].slug,
    };
  }
  // 영문도 표준화할 수 있으면 추가
  // 첫 글자만 대문자, 나머지는 소문자
  const en = regionEn ? regionEn.charAt(0).toUpperCase() + regionEn.slice(1).toLowerCase() : '';
  return { ko: regionKo, en, slug: en.toLowerCase() };
}

// 타입/추천시기/태그 pill 스타일 버튼 컴포넌트
function PillButton({ selected, children, ...props }: any) {
  return (
    <button
      {...props}
      className={`flex items-center gap-1 px-4 py-2 rounded-full border transition select-none
        ${selected ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
    >
      {selected && <CheckIcon className="w-4 h-4 mr-1" />}
      {children}
    </button>
  );
}

export default function SpotsPage() {
  const { lang } = useLanguage();
  
  // 폼 상태
  const [name, setName] = useState({ ko: "", en: "" });
  const [description, setDescription] = useState({ ko: "", en: "" });
  const [address, setAddress] = useState({ ko: "", en: "" });
  const [region, setRegion] = useState({ ko: "", en: "" });
  const [imageUrl, setImageUrl] = useState("");
  const [extraImages, setExtraImages] = useState<string[]>([]);
  const [tags, setTags] = useState<{ko: string, en: string}[]>([]);
  const [type, setType] = useState<string[]>([]);
  const [customType, setCustomType] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [duration, setDuration] = useState({ ko: "", en: "" });
  const [price, setPrice] = useState({ ko: "", en: "" });
  const [bestTime, setBestTime] = useState<string[]>([]);
  const [country, setCountry] = useState({ en: 'KR', ko: '대한민국' });
  
  // 파일 업로드 상태
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string>("");
  const [extraImageFiles, setExtraImageFiles] = useState<File[]>([]);
  const [extraImagePreviews, setExtraImagePreviews] = useState<string[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadError, setUploadError] = useState("");
  
  // 구글맵 상태
  const [showMapModal, setShowMapModal] = useState(false);
  const [tempPlace, setTempPlace] = useState<any>(null);
  const [tempLatLng, setTempLatLng] = useState<{lat: number, lng: number} | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // 저장 성공/실패 알림 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  
  // 구글맵 API 키 (실제 배포시엔 .env 등 환경변수로 분리 권장)
  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  // 목록/등록폼 전환 상태
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null); // 편집 대상 spot
  // spots 목록 상태
  const [spots, setSpots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // spots 목록 불러오기
  const fetchSpots = async () => {
    setLoading(true);
    const q = query(collection(db, "spots"), orderBy("name.ko"));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setSpots(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!showForm) fetchSpots();
  }, [showForm]);
  
  // 태그 추가
  const addTag = (tag: string | {ko: string, en: string}) => {
    if (typeof tag === 'string') {
      // 커스텀 입력 시 한/영 모두 동일하게 저장
      if (!tags.some(t => t.ko === tag || t.en === tag)) {
        setTags([...tags, { ko: tag, en: tag }]);
      }
    } else {
      if (!tags.some(t => t.ko === tag.ko)) {
        setTags([...tags, tag]);
      }
    }
  };
  
  // 태그 삭제
  const removeTag = (tag: string | {ko: string, en: string}) => {
    if (typeof tag === 'string') {
      setTags(tags.filter(t => t.ko !== tag && t.en !== tag));
    } else {
      setTags(tags.filter(t => t.ko !== tag.ko));
    }
  };
  
  // 타입 토글
  const toggleType = (typeValue: string) => {
    if (type.includes(typeValue)) {
      setType(type.filter(t => t !== typeValue));
    } else {
      setType([...type, typeValue]);
    }
  };
  
  // 추천시기 토글
  const toggleBestTime = (timeValue: string) => {
    if (bestTime.includes(timeValue)) {
      setBestTime(bestTime.filter(t => t !== timeValue));
    } else {
      setBestTime([...bestTime, timeValue]);
    }
  };
  
  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // 파일 드롭 핸들러 개선: 여러 장 지원
  const handleDrop = async (
    e: React.DragEvent,
    isMain: boolean = false
  ) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    if (isMain) {
      // 대표사진: 첫 파일만
      await handleImageFile(files[0], true);
    } else {
      // 추가사진: 여러 장
      for (const file of files) {
        await handleImageFile(file, false);
      }
    }
  };
  
  // Firebase Storage 업로드 함수
  const uploadImageToStorage = async (file: File, folder: string = "spots") => {
    const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  // 이미지 파일 처리 (Storage 업로드)
  const handleImageFile = (file: File, isMain: boolean = true) => {
    if (file && file.type.startsWith('image/')) {
      if (isMain) {
        setMainImageFile(file);
        setMainImagePreview(URL.createObjectURL(file));
      } else {
        setExtraImageFiles(prev => [...prev, file]);
        setExtraImagePreviews(prev => [...prev, URL.createObjectURL(file)]);
      }
    }
  };
  
  // 구글맵 초기화
  useEffect(() => {
    if (showMapModal && window.google) {
      const map = new window.google.maps.Map(document.getElementById('map'), {
        center: { lat: 37.5665, lng: 126.9780 },
        zoom: 10
      });
      let marker: any = null;
      map.addListener('click', (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setTempLatLng({ lat, lng });
        
        if (marker) {
          marker.setMap(null);
        }
        
        marker = new window.google.maps.Marker({
          position: { lat, lng },
          map: map
        });
        
        // Geocoding API로 주소 가져오기
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
          if (status === 'OK' && results[0]) {
            const place = results[0];
            let region = '';
            
            // 행정구역 찾기 (시/도 단위)
            for (const component of place.address_components) {
              if (component.types.includes('administrative_area_level_1')) {
                region = component.long_name;
                break;
              }
            }
            
            setTempPlace({
              address: place.formatted_address,
              region: region
            });
          }
        });
      });
      if (searchInputRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current);
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place.geometry) return;
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          map.setCenter({ lat, lng });
          map.setZoom(16);
          if (marker) marker.setMap(null);
          marker = new window.google.maps.Marker({ position: { lat, lng }, map });
          setTempLatLng({ lat, lng });
          // Place Details API로 상세 정보 요청
          const service = new window.google.maps.places.PlacesService(map);
          service.getDetails({ placeId: place.place_id, language: 'en' }, (detailsEn: any, statusEn: any) => {
            if (statusEn === 'OK' && detailsEn) {
              service.getDetails({ placeId: place.place_id, language: 'ko' }, (detailsKo: any, statusKo: any) => {
                // 이름
                setName({
                  ko: (statusKo === 'OK' && detailsKo && detailsKo.name) ? detailsKo.name : detailsEn.name,
                  en: detailsEn.name || ''
                });
                // 주소
                setAddress({
                  ko: (statusKo === 'OK' && detailsKo && detailsKo.formatted_address) ? detailsKo.formatted_address : detailsEn.formatted_address,
                  en: detailsEn.formatted_address || ''
                });
                // 설명(영문만)
                setDescription({
                  ko: '',
                  en: detailsEn.editorial_summary?.overview || detailsEn.types?.join(', ') || ''
                });
                // region(시/도)
                let regionKo = '';
                let regionEn = '';
                if (detailsKo && detailsKo.address_components) {
                  for (const component of detailsKo.address_components) {
                    if (component.types.includes('administrative_area_level_1')) {
                      regionKo = component.long_name;
                      break;
                    }
                  }
                }
                if (detailsEn && detailsEn.address_components) {
                  for (const component of detailsEn.address_components) {
                    if (component.types.includes('administrative_area_level_1')) {
                      regionEn = component.long_name;
                      break;
                    }
                  }
                }
                const normalizedRegion = normalizeRegion(regionKo, regionEn);
                setRegion({ ko: normalizedRegion.ko, en: normalizedRegion.en });
                // 태그 자동 매핑
                const mappedTags = (detailsEn.types as string[]).map((type: string) => PLACE_TYPE_TO_TAG[type]).filter((mt): mt is {ko:string, en:string} => Boolean(mt));
                // 중복 제거 및 기존 태그와 합침
                const uniqueTags = [...tags, ...mappedTags.filter(mt => !tags.some(t => t.ko === mt.ko))];
                setTags(uniqueTags);
                // tempPlace와 tempLatLng를 반드시 세팅
                setTempPlace({
                  address: {
                    ko: detailsKo?.formatted_address || detailsEn.formatted_address || place.name,
                    en: detailsEn.formatted_address || ''
                  },
                  region: {
                    ko: normalizedRegion.ko,
                    en: normalizedRegion.en,
                    slug: normalizedRegion.slug
                  }
                });
                setTempLatLng({ lat, lng });
              });
            }
          });
        });
      }
    }
  }, [showMapModal]);
  
  // 지도 선택 적용
  const applyMapSelection = () => {
    if (tempPlace) {
      setAddress(tempPlace.address);
      setRegion(tempPlace.region);
      setMapUrl(`https://maps.google.com/?q=${tempPlace.address.ko}`);
      setShowMapModal(false);
      setTempPlace(null);
      setTempLatLng(null);
    }
  };
  
  // 삭제 핸들러
  const handleDelete = async (id: string) => {
    if (!window.confirm(TEXT.confirmDelete[lang])) return;
    try {
      await deleteDoc(doc(db, 'spots', id));
      setModalMessage(TEXT.deleted[lang]);
      setModalOpen(true);
      fetchSpots();
    } catch (e) {
      setModalMessage(TEXT.deleteFailed[lang]);
      setModalOpen(true);
    }
  };

  // 편집 버튼 클릭 시 폼에 값 세팅
  const handleEdit = (spot: any) => {
    setEditTarget(spot);
    setName(spot.name || { ko: '', en: '' });
    setDescription(spot.description || { ko: '', en: '' });
    setAddress(spot.address || { ko: '', en: '' });
    setRegion(spot.region || { ko: '', en: '' });
    setImageUrl("");
    setExtraImages(spot.extraImages || []);
    setTags(spot.tags || []);
    setType(Array.isArray(spot.type) ? spot.type : spot.type ? [spot.type] : []);
    setCustomType('');
    setMapUrl(spot.mapUrl || '');
    setDuration(spot.duration || { ko: '', en: '' });
    setPrice(spot.price || { ko: '', en: '' });
    setBestTime(Array.isArray(spot.bestTime) ? spot.bestTime : spot.bestTime?.ko ? spot.bestTime.ko.split(',').map((s:string)=>s.trim()) : []);
    setShowForm(true);
  };

  // 지역(region) 선택 시 해당 국가 자동 세팅 (예시: 한국 지역이면 KR)
  const handleRegionChange = (regionValue: string) => {
    setRegion({ ko: regionValue, en: regionValue });
    // 예시: 부산, 서울, 경기, 제주, 전남, 경주 → KR, 세부, 보홀 → PH
    const krRegions = ['서울', '경기', '부산', '제주', '전남', '경주'];
    const phRegions = ['세부', '보홀'];
    if (krRegions.includes(regionValue)) setCountry({ en: 'KR', ko: '대한민국' });
    else if (phRegions.includes(regionValue)) setCountry({ en: 'PH', ko: '필리핀' });
    // 필요시 일본, 대만 등 추가
  };

  // 등록 폼에 국가 드롭다운 추가
  <div>
    <label className="block text-sm font-medium mb-2">국가</label>
    <select
      value={country.en}
      onChange={e => {
        const selected = COUNTRY_OPTIONS.find(c => c.en === e.target.value);
        if (selected) setCountry(selected);
      }}
      className="w-full p-2 border rounded"
    >
      {COUNTRY_OPTIONS.map(c => (
        <option key={c.en} value={c.en}>{lang === 'en' ? c.en : c.ko}</option>
      ))}
    </select>
  </div>

  // 등록/수정 핸들러 통합
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalMessage("");
    setUploadError("");
    setUploadingCount(0);
    try {
      let imageUrl = "";
      let extraImages: string[] = [];
      // 대표 이미지 업로드
      if (mainImageFile) {
        setUploadingCount((prev) => prev + 1);
        imageUrl = await uploadImageToStorage(mainImageFile);
        setUploadingCount((prev) => prev - 1);
      }
      // 추가 이미지 업로드
      for (const file of extraImageFiles) {
        setUploadingCount((prev) => prev + 1);
        const url = await uploadImageToStorage(file);
        extraImages.push(url);
        setUploadingCount((prev) => prev - 1);
      }
      let typeToSave = [...type];
      if (type.includes("기타") && customType.trim()) {
        typeToSave = typeToSave.filter(t => t !== "기타");
        typeToSave.push(customType.trim());
      }
      const bestTimeToSave = {
        ko: bestTime.join(", "),
        en: bestTime.map(val => SEASON_OPTIONS.find(opt => opt.value === val)?.label.en || val).join(", ")
      };
      if (editTarget) {
        // 수정
        await updateDoc(doc(db, 'spots', editTarget.id), {
          type: typeToSave.length === 1 ? typeToSave[0] : typeToSave,
          name, description, address, region, imageUrl, tags, extraImages, mapUrl, duration, price, bestTime: bestTimeToSave, country
        });
        setModalMessage(TEXT.updated[lang]);
      } else {
        // 신규 등록
        await addDoc(collection(db, "spots"), {
          type: typeToSave.length === 1 ? typeToSave[0] : typeToSave,
          name, description, address, region, imageUrl, tags, extraImages, mapUrl, duration, price, bestTime: bestTimeToSave, country, createdAt: Timestamp.now()
        });
        setModalMessage(TEXT.saveSuccess[lang]);
      }
      setModalOpen(true);
      // 폼 리셋 및 상태 초기화
      setName({ ko: "", en: "" });
      setDescription({ ko: "", en: "" });
      setAddress({ ko: "", en: "" });
      setRegion({ ko: "", en: "" });
      setImageUrl("");
      setExtraImages([]);
      setMainImageFile(null);
      setMainImagePreview("");
      setExtraImageFiles([]);
      setExtraImagePreviews([]);
      setTags([]);
      setType([]);
      setCustomType("");
      setMapUrl("");
      setDuration({ ko: "", en: "" });
      setPrice({ ko: "", en: "" });
      setBestTime([]);
      setEditTarget(null);
      // 목록 즉시 새로고침
      fetchSpots();
      setTimeout(() => {
        setModalOpen(false);
        setShowForm(false);
      }, 1200);
    } catch (err) {
      setModalMessage(TEXT.saveFailed[lang]);
      setModalOpen(true);
    }
  };

  // 추가: extra 이미지 삭제 함수
  const handleRemoveExtraImage = (idx: number) => {
    setExtraImageFiles(prev => prev.filter((_, i) => i !== idx));
    setExtraImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`}
        onLoad={() => console.log('Google Maps loaded')}
      />
      
      <h1 className="text-2xl font-bold mb-6">{TEXT.title[lang]}</h1>
      
      {!showForm ? (
        <>
          <div className="flex justify-end mb-4">
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => { setShowForm(true); setEditTarget(null); }}
            >
              {TEXT.addSpot[lang]}
            </button>
          </div>
          {loading ? (
            <div className="text-center py-10">{TEXT.loading[lang]}</div>
          ) : spots.length === 0 ? (
            <div className="text-center py-10 text-gray-500">{TEXT.noData[lang]}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border">{TEXT.region[lang]}</th>
                    <th className="p-2 border">{TEXT.listRegion[lang]}</th>
                    <th className="p-2 border">{TEXT.listImage[lang]}</th>
                    <th className="p-2 border">{TEXT.listName[lang]}</th>
                    <th className="p-2 border">{TEXT.listTags[lang]}</th>
                    <th className="p-2 border">{TEXT.listCreated[lang]}</th>
                    <th className="p-2 border">{TEXT.edit[lang]}</th>
                    <th className="p-2 border">{TEXT.delete[lang]}</th>
                  </tr>
                </thead>
                <tbody>
                  {spots.map(spot => (
                    <tr key={spot.id} className="hover:bg-gray-50">
                      <td className="p-2 border">{spot.country?.[lang] || spot.country?.ko || spot.country || '-'}</td>
                      <td className="p-2 border">{spot.region?.[lang] || spot.region?.ko || spot.region || '-'}</td>
                      <td className="p-2 border text-center">
                        {spot.imageUrl ? (
                          <img src={spot.imageUrl} alt="img" className="w-20 h-14 object-cover rounded mx-auto" />
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="p-2 border">{spot.name?.[lang] || spot.name?.ko || spot.name || '-'}</td>
                      <td className="p-2 border">
                        {Array.isArray(spot.tags) && spot.tags.length > 0
                          ? spot.tags.map((t: any, i: number) => <span key={i} className="inline-block bg-gray-200 rounded-full px-2 py-1 text-xs mr-1">{t[lang]}</span>)
                          : '-'}
                      </td>
                      <td className="p-2 border text-xs">
                        {spot.createdAt?.seconds ? new Date(spot.createdAt.seconds * 1000).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-2 border text-center">
                        <button className="px-2 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-xs" onClick={() => handleEdit(spot)}>{TEXT.edit[lang]}</button>
                      </td>
                      <td className="p-2 border text-center">
                        <button className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs" onClick={() => handleDelete(spot.id)}>{TEXT.delete[lang]}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold">{TEXT.spotEdit[lang]}</span>
            <button
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
              onClick={() => { setShowForm(false); setEditTarget(null); }}
              type="button"
            >
              {TEXT.backToList[lang]}
            </button>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* 이름 */}
            <div>
              <label className="block text-sm font-medium mb-2">{TEXT.name[lang]}</label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={name.ko}
                  onChange={(e) => setName({ ...name, ko: e.target.value })}
                  placeholder="한국어 이름"
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  value={name.en}
                  onChange={(e) => setName({ ...name, en: e.target.value })}
                  placeholder="English name"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            
            {/* 설명 */}
            <div>
              <label className="block text-sm font-medium mb-2">{TEXT.description[lang]}</label>
              <div className="grid grid-cols-2 gap-4">
                <textarea
                  value={description.ko}
                  onChange={(e) => setDescription({ ...description, ko: e.target.value })}
                  placeholder="한국어 설명"
                  rows={4}
                  className="w-full p-2 border rounded"
                />
                <textarea
                  value={description.en}
                  onChange={(e) => setDescription({ ...description, en: e.target.value })}
                  placeholder="English description"
                  rows={4}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            
            {/* 주소 */}
            <div>
              <label className="block text-sm font-medium mb-2">{TEXT.address[lang]}</label>
              <div className="flex gap-2">
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={address.ko}
                    onChange={(e) => setAddress({ ...address, ko: e.target.value })}
                    placeholder="한국어 주소"
                    className="w-full p-2 border rounded"
                  />
                  <input
                    type="text"
                    value={address.en}
                    onChange={(e) => setAddress({ ...address, en: e.target.value })}
                    placeholder="English address"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowMapModal(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {TEXT.selectFromMap[lang]}
                </button>
              </div>
            </div>
            
            {/* 지역 */}
            <div>
              <label className="block text-sm font-medium mb-2">{TEXT.region[lang]}</label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={region.ko}
                  onChange={(e) => setRegion({ ...region, ko: e.target.value })}
                  placeholder="한국어 지역"
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  value={region.en}
                  onChange={(e) => setRegion({ ...region, en: e.target.value })}
                  placeholder="English region"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            
            {/* 대표 이미지 */}
            <div>
              <label className="block text-sm font-medium mb-2">{TEXT.image[lang]}</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, true)}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0], true)}
                  className="hidden"
                  id="main-image"
                />
                <label htmlFor="main-image" className="cursor-pointer">
                  {mainImagePreview ? (
                    <div className="relative inline-block">
                      <img src={mainImagePreview} alt="Main" className="max-w-full h-48 object-cover mx-auto rounded" />
                      <button type="button" onClick={() => { setMainImagePreview(""); setMainImageFile(null); }}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-lg font-bold hover:bg-black/80 z-10"
                        aria-label="Remove main image"
                      >×</button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-500">{TEXT.dragDropImage[lang]}</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
            
            {/* 추가 이미지 */}
            <div>
              <label className="block text-sm font-medium mb-2">{TEXT.extraImages[lang]}</label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, false)}
              >
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
                  <p className="text-gray-500">{TEXT.dragDropImage[lang]}</p>
                </label>
                {extraImagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {extraImagePreviews.map((url, index) => (
                      <div key={index} className="relative">
                        <img src={url} alt={`Extra ${index + 1}`} className="w-full h-32 object-cover rounded" />
                        <button type="button" onClick={() => handleRemoveExtraImage(index)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-lg font-bold hover:bg-black/80 z-10"
                          aria-label="Remove extra image"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* 태그 */}
            <div>
              <label className="block text-sm font-medium mb-2">{TEXT.tags[lang]}</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {TAG_OPTIONS.map((tag) => (
                  <PillButton
                    key={tag.ko}
                    selected={tags.some(t => t.ko === tag.ko)}
                    type="button"
                    onClick={() => tags.some(t => t.ko === tag.ko) ? removeTag(tag) : addTag(tag)}
                  >
                    {tag[lang]}
                  </PillButton>
                ))}
              </div>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="태그 직접입력"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                  className="flex-1 p-2 border rounded"
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.querySelector('input[placeholder=\"태그 직접입력\"]') as HTMLInputElement;
                    if (input) {
                      addTag(input.value);
                      input.value = '';
                    }
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  {TEXT.addTag[lang]}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.filter(tag => !TAG_OPTIONS.some(opt => opt.ko === tag.ko)).map((tag, index) => (
                  <PillButton key={tag.ko + index} selected={true} type="button" onClick={() => removeTag(tag)}>
                    {tag[lang]}
                    <span className="ml-1 text-xs">×</span>
                  </PillButton>
                ))}
              </div>
            </div>
            
            {/* 타입 */}
            <div>
              <label className="block text-sm font-medium mb-2">{TEXT.type[lang]}</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {TYPE_OPTIONS.map((option) => (
                  <PillButton
                    key={option.value}
                    type="button"
                    selected={type.includes(option.value)}
                    onClick={() => toggleType(option.value)}
                  >
                    {option.label[lang]}
                  </PillButton>
                ))}
              </div>
              {type.includes("기타") && (
                <input
                  type="text"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  placeholder={TEXT.customType[lang]}
                  className="w-full p-2 border rounded"
                />
              )}
            </div>
            
            {/* 지도 URL */}
            <div>
              <label className="block text-sm font-medium mb-2">{TEXT.mapUrl[lang]}</label>
              <input
                type="url"
                value={mapUrl}
                onChange={(e) => setMapUrl(e.target.value)}
                placeholder="https://maps.google.com/..."
                className="w-full p-2 border rounded"
              />
            </div>
            
            {/* 소요시간 */}
            <div>
              <label className="block text-sm font-medium mb-2">{TEXT.duration[lang]}</label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={duration.ko}
                  onChange={(e) => setDuration({ ...duration, ko: e.target.value })}
                  placeholder="한국어 소요시간"
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  value={duration.en}
                  onChange={(e) => setDuration({ ...duration, en: e.target.value })}
                  placeholder="English duration"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            
            {/* 가격 */}
            <div>
              <label className="block text-sm font-medium mb-2">{TEXT.price[lang]}</label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={price.ko}
                  onChange={(e) => setPrice({ ...price, ko: e.target.value })}
                  placeholder="한국어 가격"
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  value={price.en}
                  onChange={(e) => setPrice({ ...price, en: e.target.value })}
                  placeholder="English price"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            
            {/* 추천시기 */}
            <div>
              <label className="block text-sm font-medium mb-2">{TEXT.bestTime[lang]}</label>
              <div className="flex flex-wrap gap-2">
                {SEASON_OPTIONS.map((option) => (
                  <PillButton
                    key={option.value}
                    type="button"
                    selected={bestTime.includes(option.value)}
                    onClick={() => toggleBestTime(option.value)}
                  >
                    {option.label[lang]}
                  </PillButton>
                ))}
              </div>
            </div>
            
            {/* 국가 */}
            <div>
              <label className="block text-sm font-medium mb-2">국가</label>
              <select
                value={country.en}
                onChange={e => {
                  const selected = COUNTRY_OPTIONS.find(c => c.en === e.target.value);
                  if (selected) setCountry(selected);
                }}
                className="w-full p-2 border rounded"
              >
                {COUNTRY_OPTIONS.map(c => (
                  <option key={c.en} value={c.en}>{lang === 'en' ? c.en : c.ko}</option>
                ))}
              </select>
            </div>
            
            {/* 저장 버튼 */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {TEXT.save[lang]}
              </button>
            </div>
          </form>
        </>
      )}
      
      {/* 구글맵 모달 */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 h-5/6 max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">지도에서 위치 선택</h3>
              <button
                onClick={() => setShowMapModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="장소명 또는 주소 검색"
              className="w-full p-2 border rounded mb-4"
              autoFocus
            />
            <div id="map" className="w-full h-96 mb-4 rounded"></div>
            {tempPlace && (
              <div className="mb-4 p-3 bg-gray-100 rounded">
                <p><strong>주소:</strong> {tempPlace.address.ko}</p>
                <p><strong>지역:</strong> {tempPlace.region.ko}</p>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={applyMapSelection}
                disabled={!tempPlace}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
              >
                선택 완료
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
      
      {/* 저장 성공/실패 모달 */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm w-full text-center">
            <div className="mb-4 text-lg">{modalMessage}</div>
            <button
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => { setModalOpen(false); window.location.reload(); }}
            >
              확인
            </button>
          </div>
        </div>
      )}
      
      {/* 업로드 중/에러 UI 안내 (폼 내 적절한 위치에 추가) */}
      {uploadingCount > 0 && <div className="text-blue-600 text-sm mt-1">{TEXT.imageUploading?.[lang] || "이미지 업로드 중..."}</div>}
      {uploadError && <div className="text-red-600 text-sm mt-1">{uploadError}</div>}
    </div>
  );
} 