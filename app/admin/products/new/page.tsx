"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, getDocs, query, orderBy, addDoc } from 'firebase/firestore';
import { auth, storage, db } from '@/lib/firebase';
import { useLanguage } from '../../../../components/LanguageContext';
import Link from 'next/link';
import Image from 'next/image';

interface Spot {
  id: string;
  name: { ko: string; en: string };
  region: { ko: string; en: string };
  country: { en: string; ko: string };
  address: { ko: string; en: string };
  imageUrl?: string;
}

interface IncludeItem { id: string; ko: string; en: string; }
interface NotIncludeItem { id: string; ko: string; en: string; }

const PRODUCTS_TEXTS = {
  ko: {
    loading: "로딩 중...",
    backToList: "← 목록으로 돌아가기",
    title: "새 상품 등록",
    formTitle: "제목",
    formDescription: "설명",
    formCountry: "국가",
    formRegion: "지역",
    formPrice: "가격",
    formDuration: "기간",
    formImageUpload: "상품 이미지 업로드",
    formSchedule: "일정",
    formHighlights: "하이라이트",
    formIncluded: "포함 사항",
    formNotIncluded: "불포함 사항",
    startDate: "시작일",
    endDate: "종료일",
    selectCountry: "국가 선택",
    selectRegion: "지역 선택",
    imageUploading: "이미지 업로드 중...",
    imageUploadError: "이미지 업로드에 실패했습니다.",
    dragDropImages: "이미지를 드래그하여 업로드하거나 클릭하여 선택하세요",
    noSpotsInRegion: "이 지역에 등록된 스팟이 없습니다.",
    selectSpotsForDay: "이 날짜에 방문할 스팟을 선택하세요",
    selectHighlightSpotsFromSchedule: "일정에 포함된 스팟 중에서 하이라이트를 선택하세요",
    day: "일차",
    addDay: "일차 추가",
    removeDay: "일차 삭제",
    selectHighlightSpots: "하이라이트 스팟 선택",
    includedPlaceholder: "포함 사항을 입력하세요",
    notIncludedPlaceholder: "불포함 사항을 입력하세요",
    delete: "삭제",
    addIncluded: "포함 사항 추가",
    addNotIncluded: "불포함 사항 추가",
    save: "등록",
    cancel: "취소",
    saveSuccess: "상품이 성공적으로 등록되었습니다!",
    saveFailed: "상품 등록에 실패했습니다."
  },
  en: {
    loading: "Loading...",
    backToList: "← Back to List",
    title: "Add New Product",
    formTitle: "Title",
    formDescription: "Description",
    formCountry: "Country",
    formRegion: "Region",
    formPrice: "Price",
    formDuration: "Duration",
    formImageUpload: "Product Image Upload",
    formSchedule: "Schedule",
    formHighlights: "Highlights",
    formIncluded: "Included Items",
    formNotIncluded: "Not Included Items",
    startDate: "Start Date",
    endDate: "End Date",
    selectCountry: "Select Country",
    selectRegion: "Select Region",
    imageUploading: "Uploading image...",
    imageUploadError: "Image upload failed.",
    dragDropImages: "Drag and drop images or click to select",
    noSpotsInRegion: "No spots registered in this region.",
    selectSpotsForDay: "Select spots to visit on this day",
    selectHighlightSpotsFromSchedule: "Select highlights from spots in the schedule",
    day: "Day",
    addDay: "Add Day",
    removeDay: "Remove Day",
    selectHighlightSpots: "Select Highlight Spots",
    includedPlaceholder: "Enter included items",
    notIncludedPlaceholder: "Enter not included items",
    delete: "Delete",
    addIncluded: "Add Included Item",
    addNotIncluded: "Add Not Included Item",
    save: "Add",
    cancel: "Cancel",
    saveSuccess: "Product added successfully!",
    saveFailed: "Failed to add product."
  }
};

// 국가 옵션
const COUNTRY_OPTIONS = [
  { en: 'KR', ko: '대한민국' },
  { en: 'PH', ko: '필리핀' },
  { en: 'JP', ko: '일본' },
  { en: 'TW', ko: '대만' },
];

// 지역 옵션 (국가별)
const REGION_OPTIONS = {
  KR: [
    { ko: '서울', en: 'Seoul' },
    { ko: '부산', en: 'Busan' },
    { ko: '제주', en: 'Jeju' },
    { ko: '경주', en: 'Gyeongju' },
  ],
  PH: [
    { ko: '마닐라', en: 'Manila' },
    { ko: '세부', en: 'Cebu' },
    { ko: '보라카이', en: 'Boracay' },
    { ko: '팔라완', en: 'Palawan' },
  ],
  JP: [
    { ko: '도쿄', en: 'Tokyo' },
    { ko: '오사카', en: 'Osaka' },
    { ko: '교토', en: 'Kyoto' },
    { ko: '후쿠오카', en: 'Fukuoka' },
  ],
  TW: [
    { ko: '타이페이', en: 'Taipei' },
    { ko: '가오슝', en: 'Kaohsiung' },
    { ko: '타이중', en: 'Taichung' },
    { ko: '화롄', en: 'Hualien' },
  ],
};

export default function NewProductPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { lang } = useLanguage();
  const texts = PRODUCTS_TEXTS[lang];

  // Form states
  const [formData, setFormData] = useState({
    title: { ko: '', en: '' },
    description: { ko: '', en: '' },
    country: { en: 'KR', ko: '대한민국' },
    region: { ko: '', en: '' },
    price: { KRW: '', PHP: '', USD: '' },
    duration: { startDate: '', endDate: '' },
    imageUrls: [] as string[],
    schedule: [{
      day: 1,
      spots: [] as Array<{
        spotId: string;
        spotName: { ko: string; en: string };
        spotImage?: string;
      }>
    }],
    highlights: [] as Array<{
      spotId: string;
      spotName: { ko: string; en: string };
    }>,
    included: [] as string[],
    notIncluded: [] as string[]
  });

  const [uploadingCount, setUploadingCount] = useState(0);
  const [imageUploadError, setImageUploadError] = useState('');
  const [spots, setSpots] = useState<Spot[]>([]);
  const [availableIncludedItems, setAvailableIncludedItems] = useState<IncludeItem[]>([]);
  const [availableNotIncludedItems, setAvailableNotIncludedItems] = useState<NotIncludeItem[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchSpots();
        fetchIncludeItems();
        fetchNotIncludeItems();
        setLoading(false);
      } else {
        router.push('/admin/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchSpots = async () => {
    try {
      const querySnapshot = await getDocs(query(collection(db, 'spots'), orderBy('name.ko')));
      const spotsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Spot[];
      setSpots(spotsData);
    } catch (error) {
      console.error('Error fetching spots:', error);
    }
  };

  const fetchIncludeItems = async () => {
    const querySnapshot = await getDocs(collection(db, 'includeItems'));
    setAvailableIncludedItems(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IncludeItem)));
  };
  const fetchNotIncludeItems = async () => {
    const querySnapshot = await getDocs(collection(db, 'notIncludeItems'));
    setAvailableNotIncludedItems(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotIncludeItem)));
  };

  // 선택된 국가의 지역 옵션 가져오기
  const getRegionOptions = () => {
    return REGION_OPTIONS[formData.country.en as keyof typeof REGION_OPTIONS] || [];
  };

  // 선택된 지역의 스팟들 가져오기
  const getSpotsInRegion = () => {
    return spots.filter(spot => 
      spot.country.en === formData.country.en && 
      spot.region.ko === formData.region.ko
    );
  };

  // 일정 관련 함수들
  const addDay = () => {
    setFormData(prev => ({
      ...prev,
      schedule: [...prev.schedule, { day: prev.schedule.length + 1, spots: [] }]
    }));
  };

  const removeDay = (dayIndex: number) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== dayIndex).map((day, i) => ({ ...day, day: i + 1 }))
    }));
  };

  const addSpotToDay = (dayIndex: number, spot: Spot) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.map((day, i) => 
        i === dayIndex 
          ? { 
              ...day, 
              spots: [...day.spots, {
                spotId: spot.id,
                spotName: spot.name,
                spotImage: spot.imageUrl
              }]
            }
          : day
      )
    }));
  };

  const removeSpotFromDay = (dayIndex: number, spotIndex: number) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.map((day, i) => 
        i === dayIndex 
          ? { ...day, spots: day.spots.filter((_, j) => j !== spotIndex) }
          : day
      )
    }));
  };

  // 포함/불포함 아이템 선택 토글
  const toggleIncluded = (id: string) => {
    setFormData(prev => ({
      ...prev,
      included: prev.included.includes(id)
        ? prev.included.filter(i => i !== id)
        : [...prev.included, id],
    }));
  };
  const toggleNotIncluded = (id: string) => {
    setFormData(prev => ({
      ...prev,
      notIncluded: prev.notIncluded.includes(id)
        ? prev.notIncluded.filter(i => i !== id)
        : [...prev.notIncluded, id],
    }));
  };

  // 일정에 포함된 모든 스팟들 가져오기
  const getSpotsInSchedule = () => {
    const spotIds = formData.schedule.flatMap(day => day.spots.map(spot => spot.spotId));
    return spots.filter(spot => spotIds.includes(spot.id));
  };

  // 하이라이트 관련 함수들
  const addHighlight = (spot: Spot) => {
    setFormData(prev => ({
      ...prev,
      highlights: [...prev.highlights, {
        spotId: spot.id,
        spotName: spot.name
      }]
    }));
  };

  const removeHighlight = (spotId: string) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights.filter(h => h.spotId !== spotId)
    }));
  };

  const handleImageUpload = async (file: File) => {
    const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleMultiImageUpload = async (files: FileList | File[]) => {
    setUploadingCount((prev) => prev + (files.length || 0));
    setImageUploadError('');
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await handleImageUpload(file);
        urls.push(url);
      }
      setFormData(prev => ({ ...prev, imageUrls: [...prev.imageUrls, ...urls] }));
    } catch {
      setImageUploadError(texts.imageUploadError);
    } finally {
      setUploadingCount((prev) => prev - (files.length || 0));
    }
  };

  const handleRemoveImage = (idx: number) => {
    setFormData(prev => ({ ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== idx) }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleMultiImageUpload(files);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleMultiImageUpload(files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Product Submit] formData:', formData);
    try {
      const productData = {
        title: formData.title,
        description: formData.description,
        price: formData.price,
        duration: formData.duration,
        country: formData.country,
        region: formData.region,
        imageUrls: formData.imageUrls,
        schedule: formData.schedule,
        highlights: formData.highlights,
        includedItems: formData.included.filter(item => item.trim() !== ''),
        notIncludedItems: formData.notIncluded.filter(item => item.trim() !== ''),
        createdAt: new Date()
      };
      console.log('[Product Submit] productData to save:', productData);
      await addDoc(collection(db, 'products'), productData);
      alert(texts.saveSuccess);
      router.push('/admin/products');
    } catch (error) {
      console.error('[Product Submit] Error saving product:', error);
      alert(texts.saveFailed);
    }
  };

  if (loading) {
    return <div className="p-6">{texts.loading}</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{texts.title}</h1>
        <Link
          href="/admin/products"
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          {texts.backToList}
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium mb-2">{texts.formTitle}</label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={formData.title.ko}
                onChange={(e) => setFormData(prev => ({ ...prev, title: { ...prev.title, ko: e.target.value } }))}
                placeholder="한국어 제목"
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="text"
                value={formData.title.en}
                onChange={(e) => setFormData(prev => ({ ...prev, title: { ...prev.title, en: e.target.value } }))}
                placeholder="English Title"
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium mb-2">{texts.formDescription}</label>
            <div className="grid grid-cols-2 gap-4">
              <textarea
                value={formData.description.ko}
                onChange={(e) => setFormData(prev => ({ ...prev, description: { ...prev.description, ko: e.target.value } }))}
                placeholder="한국어 설명"
                className="w-full p-2 border rounded h-24"
                required
              />
              <textarea
                value={formData.description.en}
                onChange={(e) => setFormData(prev => ({ ...prev, description: { ...prev.description, en: e.target.value } }))}
                placeholder="English Description"
                className="w-full p-2 border rounded h-24"
                required
              />
            </div>
          </div>

          {/* 국가/지역 선택 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{texts.formCountry}</label>
              <select
                value={formData.country.en}
                onChange={(e) => {
                  const country = COUNTRY_OPTIONS.find(c => c.en === e.target.value);
                  setFormData(prev => ({ 
                    ...prev, 
                    country: country || { en: 'KR', ko: '대한민국' },
                    region: { ko: '', en: '' }
                  }));
                }}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">{texts.selectCountry}</option>
                {COUNTRY_OPTIONS.map(country => (
                  <option key={country.en} value={country.en}>
                    {country.ko}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{texts.formRegion}</label>
              <select
                value={formData.region.ko}
                onChange={(e) => {
                  const region = getRegionOptions().find(r => r.ko === e.target.value);
                  setFormData(prev => ({ 
                    ...prev, 
                    region: region || { ko: '', en: '' }
                  }));
                }}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">{texts.selectRegion}</option>
                {getRegionOptions().map(region => (
                  <option key={region.ko} value={region.ko}>
                    {region.ko}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 가격 (다중 통화) */}
          <div>
            <label className="block text-sm font-medium mb-2">{texts.formPrice}</label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">KRW</label>
                <input
                  type="number"
                  value={formData.price.KRW}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    price: { ...prev.price, KRW: e.target.value } 
                  }))}
                  placeholder="₩"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">PHP</label>
                <input
                  type="number"
                  value={formData.price.PHP}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    price: { ...prev.price, PHP: e.target.value } 
                  }))}
                  placeholder="₱"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">USD</label>
                <input
                  type="number"
                  value={formData.price.USD}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    price: { ...prev.price, USD: e.target.value } 
                  }))}
                  placeholder="$"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>

          {/* 기간 선택 */}
          <div>
            <label className="block text-sm font-medium mb-2">{texts.formDuration}</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">{texts.startDate}</label>
                <input
                  type="date"
                  value={formData.duration.startDate}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    duration: { ...prev.duration, startDate: e.target.value } 
                  }))}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">{texts.endDate}</label>
                <input
                  type="date"
                  value={formData.duration.endDate}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    duration: { ...prev.duration, endDate: e.target.value } 
                  }))}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>
          </div>

          {/* 이미지 업로드 */}
          <div>
            <label className="block text-sm font-medium mb-2">{texts.formImageUpload}</label>
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <div className="text-gray-600">
                  {uploadingCount > 0 ? (
                    <div>{texts.imageUploading} ({uploadingCount})</div>
                  ) : (
                    <div>{texts.dragDropImages}</div>
                  )}
                </div>
              </label>
            </div>
            
            {imageUploadError && (
              <p className="text-red-500 text-sm mt-2">{imageUploadError}</p>
            )}

            {/* 이미지 미리보기 */}
            {formData.imageUrls.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-4">
                {formData.imageUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={url}
                      alt={`Product image ${index + 1}`}
                      width={200}
                      height={200}
                      className="w-full h-32 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 일정 관리 */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium">{texts.formSchedule}</label>
              <button
                type="button"
                onClick={addDay}
                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
              >
                {texts.addDay}
              </button>
            </div>
            
            {formData.schedule.map((day, dayIndex) => (
              <div key={dayIndex} className="border rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">{texts.day} {day.day}</h4>
                  {formData.schedule.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDay(dayIndex)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      {texts.removeDay}
                    </button>
                  )}
                </div>
                
                {/* 스팟 선택 */}
                {formData.region.ko && (
                  <div className="mb-3">
                    <label className="block text-sm text-gray-600 mb-2">
                      {texts.selectSpotsForDay}
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {getSpotsInRegion().map(spot => (
                        <button
                          key={spot.id}
                          type="button"
                          onClick={() => addSpotToDay(dayIndex, spot)}
                          disabled={day.spots.some(s => s.spotId === spot.id)}
                          className={`p-2 text-left rounded border text-sm ${
                            day.spots.some(s => s.spotId === spot.id)
                              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                              : 'bg-white hover:bg-gray-50 cursor-pointer'
                          }`}
                        >
                          {spot.name[lang]}
                        </button>
                      ))}
                    </div>
                    {getSpotsInRegion().length === 0 && (
                      <p className="text-gray-500 text-sm">{texts.noSpotsInRegion}</p>
                    )}
                  </div>
                )}
                
                {/* 선택된 스팟들 */}
                {day.spots.length > 0 && (
                  <div className="space-y-2">
                    {day.spots.map((spot, spotIndex) => (
                      <div key={spotIndex} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div className="flex items-center space-x-2">
                          {spot.spotImage && (
                            <Image
                              src={spot.spotImage}
                              alt={spot.spotName[lang]}
                              width={40}
                              height={40}
                              className="w-10 h-10 object-cover rounded"
                            />
                          )}
                          <span className="text-sm">{spot.spotName[lang]}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSpotFromDay(dayIndex, spotIndex)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          {texts.delete}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 포함 사항 */}
          <div>
            <label className="block text-sm font-medium mb-2">{texts.formIncluded}</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {availableIncludedItems.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleIncluded(item.id)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors
                    ${formData.included.includes(item.id)
                      ? 'bg-blue-600 text-white border-blue-600 shadow'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
                >
                  {item[lang]}
                </button>
              ))}
            </div>
          </div>

          {/* 하이라이트 선택 */}
          <div>
            <label className="block text-sm font-medium mb-2">{texts.formHighlights}</label>
            <p className="text-sm text-gray-600 mb-3">{texts.selectHighlightSpotsFromSchedule}</p>
            
            {/* 일정에 포함된 스팟들 중에서 선택 */}
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto mb-3">
              {getSpotsInSchedule().map(spot => (
                <button
                  key={spot.id}
                  type="button"
                  onClick={() => addHighlight(spot)}
                  disabled={formData.highlights.some(h => h.spotId === spot.id)}
                  className={`p-2 text-left rounded border text-sm ${
                    formData.highlights.some(h => h.spotId === spot.id)
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-white hover:bg-gray-50 cursor-pointer'
                  }`}
                >
                  {spot.name[lang]}
                </button>
              ))}
            </div>
            
            {/* 선택된 하이라이트들 */}
            {formData.highlights.length > 0 && (
              <div className="space-y-2">
                {formData.highlights.map((highlight, index) => (
                  <div key={index} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                    <span className="text-sm">{highlight.spotName[lang]}</span>
                    <button
                      type="button"
                      onClick={() => removeHighlight(highlight.spotId)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      {texts.delete}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 불포함 사항 */}
          <div>
            <label className="block text-sm font-medium mb-2">{texts.formNotIncluded}</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {availableNotIncludedItems.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleNotIncluded(item.id)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors
                    ${formData.notIncluded.includes(item.id)
                      ? 'bg-red-600 text-white border-red-600 shadow'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-red-50'}`}
                >
                  {item[lang]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {texts.save}
            </button>
            <Link
              href="/admin/products"
              className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              {texts.cancel}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 