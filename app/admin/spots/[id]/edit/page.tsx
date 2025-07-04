"use client";

/// <reference types="@types/google.maps" />

import { useState, useEffect } from "react";
import { useLanguage } from "../../../../../components/LanguageContext";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from 'next/image';
import { useRouter, useParams } from "next/navigation";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase";

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

// PillButton 컴포넌트
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

// 다국어 텍스트
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
};

// Firebase Storage 업로드 함수
const uploadImageToStorage = async (file: File, folder: string = "spots"): Promise<string> => {
  const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
};

// Firebase Storage URL에서 파일 경로 추출
const getStoragePathFromUrl = (url: string): string | null => {
  try {
    const baseUrl = "https://firebasestorage.googleapis.com/v0/b/";
    if (!url.startsWith(baseUrl)) return null;
    
    const pathMatch = url.match(/o\/(.*?)\?/);
    if (pathMatch && pathMatch[1]) {
      return decodeURIComponent(pathMatch[1]);
    }
    return null;
  } catch (error) {
    console.error("Error parsing storage URL:", error);
    return null;
  }
};

// Firebase Storage에서 이미지 삭제
const deleteImageFromStorage = async (url: string): Promise<void> => {
  const path = getStoragePathFromUrl(url);
  if (path) {
    try {
      const imageRef = ref(storage, path);
      await deleteObject(imageRef);
      console.log("Image deleted from storage:", path);
    } catch (error) {
      console.error("Error deleting image from storage:", error);
      // 이미 삭제된 파일이거나 권한 문제일 수 있음
    }
  }
};

export default function EditSpotPage() {
  const { lang } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const spotId = params.id as string;
  
  // 로딩 상태
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [spotNotFound, setSpotNotFound] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // 원본 데이터 보관 (취소 시 복원용)
  const [originalData, setOriginalData] = useState<SpotFormData | null>(null);
  
  // 삭제할 이미지 URL 추적 (저장 시 Storage에서 삭제)
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  
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
  });

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
    setIsUploading(true);
    try {
      const url = await uploadImageToStorage(file);
      if (isMain) {
        setFormData(prev => ({ ...prev, imageUrl: url }));
      } else {
        setFormData(prev => ({ ...prev, extraImages: [...prev.extraImages, url] }));
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      alert(TEXT.uploadFailedText[lang]);
    } finally {
      setIsUploading(false);
    }
  };

  // 스팟 데이터 불러오기
  useEffect(() => {
    const fetchSpot = async () => {
      try {
        const spotDoc = await getDoc(doc(db, "spots", spotId));
        if (spotDoc.exists()) {
          const data = spotDoc.data();
          
          console.log("Raw data from Firebase:", data);
          console.log("Raw tags data:", data.tags);
          
          // tags가 객체인 경우 배열로 변환
          let tagsArray: string[] = [];
          if (Array.isArray(data.tags)) {
            // 배열인 경우 각 요소를 확인
            tagsArray = data.tags.map(tag => {
              if (typeof tag === 'string') {
                return tag;
              } else if (tag && typeof tag === 'object' && 'ko' in tag) {
                // 다국어 객체인 경우 한국어 값 사용
                return tag.ko;
              }
              return String(tag);
            });
          } else if (data.tags && typeof data.tags === 'object') {
            // 객체를 배열로 변환 (Firebase에서 배열이 객체로 저장된 경우)
            const values = Object.values(data.tags);
            tagsArray = values.map(tag => {
              if (typeof tag === 'string') {
                return tag;
              } else if (tag && typeof tag === 'object' && 'ko' in tag) {
                // 다국어 객체인 경우 한국어 값 사용
                return (tag as { ko: string }).ko;
              }
              return String(tag);
            });
          }
          
          console.log("Processed tags array:", tagsArray);
          
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
          };
          
          setFormData(spotFormData);
          setOriginalData(spotFormData); // 원본 데이터 저장
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
    setIsSubmitting(true);

    try {
      // 데이터베이스 업데이트
      await updateDoc(doc(db, "spots", spotId), {
        ...formData,
        updatedAt: Timestamp.now(),
      });
      
      // Storage에서 삭제할 이미지들 처리
      if (imagesToDelete.length > 0) {
        console.log("Deleting images from storage:", imagesToDelete);
        const deletePromises = imagesToDelete.map(url => deleteImageFromStorage(url));
        await Promise.all(deletePromises);
      }
      
      alert(TEXT.updateSuccess[lang]);
      router.push("/admin/spots");
    } catch (error) {
      console.error("Error updating spot:", error);
      alert(TEXT.updateFailed[lang]);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            onClick={() => router.push("/admin/spots")}
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
              <input
                type="text"
                value={formData.address.ko}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  address: { ...prev.address, ko: e.target.value }
                }))}
                placeholder={TEXT.addressKoPlaceholder[lang]}
                className="w-full p-2 border rounded"
              />
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

          {/* 지역 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">{TEXT.region[lang]}</label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={formData.region.ko}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  region: { ...prev.region, ko: e.target.value }
                }))}
                placeholder={TEXT.regionKoPlaceholder[lang]}
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                value={formData.region.en}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  region: { ...prev.region, en: e.target.value }
                }))}
                placeholder={TEXT.regionEnPlaceholder[lang]}
                className="w-full p-2 border rounded"
              />
            </div>
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
              {formData.imageUrl ? (
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
                      {isUploading ? (
                        <p>{TEXT.uploadingText[lang]}</p>
                      ) : (
                        <>
                          <p className="mb-2">{TEXT.dragDropText[lang]}</p>
                          <p className="text-blue-500 hover:text-blue-600">{TEXT.clickSelectText[lang]}</p>
                        </>
                      )}
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
                    <p>{TEXT.uploadingText[lang]}</p>
                  ) : (
                    <>
                      <p className="mb-2">{TEXT.dragDropText[lang]}</p>
                      <p className="text-blue-500 hover:text-blue-600">{TEXT.clickSelectText[lang]}</p>
                      <p className="text-sm mt-2">{TEXT.multipleImagesText[lang]}</p>
                    </>
                  )}
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
                  selected={formData.tags.includes(tag.ko)}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      tags: prev.tags.includes(tag.ko)
                        ? prev.tags.filter(t => t !== tag.ko)
                        : [...prev.tags, tag.ko]
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
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end gap-4">
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
    </div>
  );
} 