"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../../../components/LanguageContext";
import Script from "next/script";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from 'next/image';

/// <reference types="@types/google.maps" />

// 다국어 텍스트
const TEXT = {
  title: { ko: "여행지 관리", en: "Destination Management" },
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
  saveSuccess: { ko: "성공적으로 저장되었습니다!", en: "Saved successfully!" },
  saveFailed: { ko: "저장에 실패했습니다.", en: "Failed to save." }
};

// 타입 옵션
const TYPE_OPTIONS = [
  { value: "국내", label: { ko: "국내", en: "Domestic" } },
  { value: "해외", label: { ko: "해외", en: "International" } },
  { value: "도시", label: { ko: "도시", en: "City" } },
  { value: "자연", label: { ko: "자연", en: "Nature" } },
  { value: "문화", label: { ko: "문화", en: "Culture" } },
  { value: "휴양", label: { ko: "휴양", en: "Resort" } },
  { value: "역사", label: { ko: "역사", en: "Historical" } },
  { value: "모험", label: { ko: "모험", en: "Adventure" } },
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

export default function DestinationsPage() {
  const { lang } = useLanguage();
  
  // 폼 상태
  const [name, setName] = useState({ ko: "", en: "" });
  const [description, setDescription] = useState({ ko: "", en: "" });
  const [address, setAddress] = useState({ ko: "", en: "" });
  const [region, setRegion] = useState({ ko: "", en: "" });
  const [imageUrl, setImageUrl] = useState("");
  const [extraImages, setExtraImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [type, setType] = useState<string[]>([]);
  const [customType, setCustomType] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [duration, setDuration] = useState({ ko: "", en: "" });
  const [price, setPrice] = useState({ ko: "", en: "" });
  const [bestTime, setBestTime] = useState<string[]>([]);
  
  // 구글맵 상태
  const [showMapModal, setShowMapModal] = useState(false);
  const [tempPlace, setTempPlace] = useState<{
    address: string;
    region: string;
    lat: number;
    lng: number;
  } | null>(null);
  
  // 저장 성공/실패 알림 상태
  const [saveMessage, setSaveMessage] = useState("");
  
  // 구글맵 API 키 (실제 배포시엔 .env 등 환경변수로 분리 권장)
  const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY"; // 실제 API 키로 교체 필요
  
  // 태그 추가
  const addTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      setTags([...tags, tag.trim()]);
    }
  };
  
  // 태그 삭제
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
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
  
  const handleDrop = (e: React.DragEvent, setFile: (file: File) => void) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setFile(files[0]);
    }
  };
  
  // 이미지 파일 처리
  const handleImageFile = (file: File, isMain: boolean = true) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (isMain) {
          setImageUrl(result);
        } else {
          setExtraImages(prev => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // 구글맵 초기화
  useEffect(() => {
    if (showMapModal && window.google) {
      const mapElement = document.getElementById('map');
      if (!mapElement) return;
      
      const map = new window.google.maps.Map(mapElement, {
        center: { lat: 37.5665, lng: 126.9780 }, // 서울
        zoom: 10
      });
      
      let marker: google.maps.Marker | null = null;
      
      map.addListener('click', (e: { latLng: { lat: () => number; lng: () => number } }) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setTempPlace({
          address: '',
          region: '',
          lat: lat,
          lng: lng
        });
        
        if (marker) {
          marker.setMap(null);
        }
        
        marker = new window.google.maps.Marker({
          position: { lat, lng },
          map: map
        });
        
        // Geocoding API로 주소 가져오기
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const place = results[0];
            let region = '';
            
            // 행정구역 찾기 (시/도 단위)
            for (const component of place.address_components) {
              if (component.types.includes('administrative_area_level_1')) {
                region = component.long_name || '';
                break;
              }
            }
            
            setTempPlace({
              address: place.formatted_address || '',
              region: region,
              lat: lat,
              lng: lng
            });
          }
        });
      });
    }
  }, [showMapModal]);
  
  // 지도 선택 적용
  const applyMapSelection = () => {
    if (tempPlace) {
      setAddress({ ko: tempPlace.address, en: tempPlace.address });
      setRegion({ ko: tempPlace.region, en: tempPlace.region });
      setMapUrl(`https://maps.google.com/?q=${tempPlace.address}`);
      setShowMapModal(false);
      setTempPlace(null);
    }
  };
  
  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMessage("");
    try {
      // type: string[] + customType → string[]
      let typeToSave = [...type];
      if (type.includes("기타") && customType.trim()) {
        typeToSave = typeToSave.filter(t => t !== "기타");
        typeToSave.push(customType.trim());
      }
      
      // bestTime: string[] → {ko, en}
      const bestTimeToSave = {
        ko: bestTime.join(", "),
        en: bestTime
          .map(val => SEASON_OPTIONS.find(opt => opt.value === val)?.label.en || val)
          .join(", ")
      };
      
      // Firestore 저장
      await addDoc(collection(db, "destinations"), {
        type: typeToSave.length === 1 ? typeToSave[0] : typeToSave,
        name,
        description,
        address,
        region,
        imageUrl,
        tags,
        extraImages,
        mapUrl,
        duration,
        price,
        bestTime: bestTimeToSave
      });
      
      setSaveMessage(TEXT.saveSuccess[lang]);
      
      // 폼 리셋
      setName({ ko: "", en: "" });
      setDescription({ ko: "", en: "" });
      setAddress({ ko: "", en: "" });
      setRegion({ ko: "", en: "" });
      setImageUrl("");
      setExtraImages([]);
      setTags([]);
      setType([]);
      setCustomType("");
      setMapUrl("");
      setDuration({ ko: "", en: "" });
      setPrice({ ko: "", en: "" });
      setBestTime([]);
    } catch {
      setSaveMessage(TEXT.saveFailed[lang]);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`}
                    onLoad={() => {/* Google Maps loaded */}}
      />
      
      <h1 className="text-2xl font-bold mb-6">{TEXT.title[lang]}</h1>
      
      <form className="space-y-6" onSubmit={handleSubmit}>
        {saveMessage && (
          <div className={`mb-4 p-3 rounded ${
            saveMessage.includes('성공') || saveMessage.includes('success') 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {saveMessage}
          </div>
        )}
        
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
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, (file) => handleImageFile(file, true))}
          >
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0], true)}
              className="hidden"
              id="main-image"
            />
            <label htmlFor="main-image" className="cursor-pointer">
              {imageUrl ? (
                <Image src={imageUrl} alt="Main" width={400} height={192} className="max-w-full h-48 object-cover mx-auto" />
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
            onDrop={(e) => handleDrop(e, (file) => handleImageFile(file, false))}
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
            {extraImages.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                {extraImages.map((url, index) => (
                  <Image key={index} src={url} alt={`Extra ${index + 1}`} width={200} height={128} className="w-full h-32 object-cover rounded" />
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* 태그 */}
        <div>
          <label className="block text-sm font-medium mb-2">{TEXT.tags[lang]}</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="태그 입력"
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
                const input = document.querySelector('input[placeholder="태그 입력"]') as HTMLInputElement;
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
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center gap-2"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
        
        {/* 타입 */}
        <div>
          <label className="block text-sm font-medium mb-2">{TEXT.type[lang]}</label>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleType(option.value)}
                className={`p-2 rounded border ${
                  type.includes(option.value)
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {option.label[lang]}
              </button>
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
          <div className="grid grid-cols-3 gap-2">
            {SEASON_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleBestTime(option.value)}
                className={`p-2 rounded border ${
                  bestTime.includes(option.value)
                    ? 'bg-green-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {option.label[lang]}
              </button>
            ))}
          </div>
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
            <div id="map" className="w-full h-96 mb-4 rounded"></div>
            {tempPlace && (
              <div className="mb-4 p-3 bg-gray-100 rounded">
                <p><strong>주소:</strong> {tempPlace.address}</p>
                <p><strong>지역:</strong> {tempPlace.region}</p>
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
    </div>
  );
} 