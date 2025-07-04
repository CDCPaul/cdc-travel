"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useLanguage } from "../../../components/LanguageContext";
import { collection, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, deleteObject } from "firebase/storage";
import Image from 'next/image';
import { useRouter } from "next/navigation";
import Select, { StylesConfig, CSSObjectWithLabel } from 'react-select';
import { XMarkIcon } from '@heroicons/react/24/solid';

// 다국어 텍스트
const TEXT = {
  title: { ko: "스팟 관리", en: "Spot Management" },
  region: { ko: "지역", en: "Region" },
  listImage: { ko: "대표 이미지", en: "Main Image" },
  listName: { ko: "이름", en: "Name" },
  listTags: { ko: "태그", en: "Tags" },
  listCreated: { ko: "등록일", en: "Created" },
  edit: { ko: "편집", en: "Edit" },
  delete: { ko: "삭제", en: "Delete" },
  addSpot: { ko: "+ 새 스팟 등록", en: "+ Add Spot" },
  noData: { ko: "등록된 스팟이 없습니다.", en: "No spots found." },
  loading: { ko: "로딩 중...", en: "Loading..." },
  confirmDelete: { ko: "정말 삭제하시겠습니까?", en: "Are you sure you want to delete?" },
  deleted: { ko: "삭제되었습니다.", en: "Deleted." },
  deleteFailed: { ko: "삭제에 실패했습니다.", en: "Failed to delete." },
  deleting: { ko: "삭제 중...", en: "Deleting..." },
  selectCountry: { ko: '국가 선택', en: 'Select Country' },
  selectRegion: { ko: '지역 선택', en: 'Select Region' },
  searchPlaceholder: { ko: '이름/설명으로 검색', en: 'Search by name/description' },
  resetFilters: { ko: '필터 초기화', en: 'Reset Filters' },
  results: { ko: '개 결과', en: 'results' },
  page: { ko: '페이지', en: 'Page' },
  previous: { ko: '이전', en: 'Previous' },
  next: { ko: '다음', en: 'Next' },
};

// 타입 정의
interface Spot {
  id: string;
  name: { ko: string; en: string } | string;
  description?: { ko: string; en: string } | string;
  region: { ko: string; en: string } | string;
  country?: { ko: string; en: string } | string;
  imageUrl?: string;
  extraImages?: string[];
  tags?: Array<string | { ko: string; en: string }>;
  createdAt?: { seconds: number };
}

type TagOption = { value: string; label: string };

// 국가 및 지역 상수
const COUNTRIES = [
  { code: 'KR', name: { ko: '한국', en: 'Korea' }, flag: '/images/kr.png', enabled: true },
  { code: 'PH', name: { ko: '필리핀', en: 'Philippines' }, flag: '/images/ph.png', enabled: true },
];

const REGIONS: Record<string, { code: string; name: { ko: string; en: string }; enabled: boolean }[]> = {
  KR: [
    { code: 'seoul', name: { ko: '서울', en: 'Seoul' }, enabled: true },
    { code: 'gyeonggi', name: { ko: '경기', en: 'Gyeonggi' }, enabled: true },
    { code: 'busan', name: { ko: '부산', en: 'Busan' }, enabled: true },
    { code: 'jeju', name: { ko: '제주', en: 'Jeju' }, enabled: true },
    { code: 'jeonnam', name: { ko: '전남', en: 'Jeonnam' }, enabled: true },
    { code: 'gyeongju', name: { ko: '경주', en: 'Gyeongju' }, enabled: true },
  ],
  PH: [
    { code: 'cebu', name: { ko: '세부', en: 'Cebu' }, enabled: true },
    { code: 'bohol', name: { ko: '보홀', en: 'Bohol' }, enabled: true },
  ],
};

// pill 스타일 상수
const pillSelected = "px-4 py-1 rounded-full bg-blue-600 text-white font-semibold shadow flex items-center gap-1";
const pillUnselected = "px-4 py-1 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-blue-50 cursor-pointer";

// 타입 가드 함수
function isMultilingualTag(tag: unknown): tag is { ko: string; en: string } {
  return tag !== null && 
         typeof tag === 'object' && 
         'ko' in tag && 
         'en' in tag &&
         typeof (tag as { ko: string; en: string }).ko === 'string' &&
         typeof (tag as { ko: string; en: string }).en === 'string';
}

function normalizeTag(tag: unknown, lang: 'ko' | 'en'): string {
  if (typeof tag === 'string') {
    return tag;
  } else if (isMultilingualTag(tag)) {
    return tag[lang] || tag.ko || '';
  } else {
    return String(tag);
  }
}

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

export default function SpotsPage() {
  const { lang } = useLanguage();
  const router = useRouter();
  
  // 상태 관리
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // 필터 상태
  const [selectedCountry, setSelectedCountry] = useState('ALL');
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  // spots 목록 불러오기
  const fetchSpots = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "spots"), orderBy("name.ko"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Spot));
      setSpots(data);
    } catch (error) {
      console.error("Error fetching spots:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpots();
  }, [fetchSpots]);
  
  // 필터링된 스팟 목록
  const filteredSpots = useMemo(() => {
    let filtered = spots;
    
    // 국가 필터
    if (selectedCountry !== 'ALL') {
      filtered = filtered.filter(spot => {
        if (!spot.country) return false;
        if (typeof spot.country === 'object') {
          return spot.country.en?.toLowerCase() === selectedCountry.toLowerCase() ||
                 spot.country.ko === selectedCountry;
        }
        return String(spot.country).toLowerCase() === selectedCountry.toLowerCase();
      });
    }
    
    // 지역 필터
    if (selectedRegion !== 'ALL') {
      filtered = filtered.filter(spot => {
        if (!spot.region) return false;
        if (typeof spot.region === 'object') {
          return spot.region.en?.toLowerCase() === selectedRegion.toLowerCase() ||
                 spot.region.ko === selectedRegion;
        }
        return String(spot.region).toLowerCase() === selectedRegion.toLowerCase();
      });
    }
    
    // 태그 필터
    if (selectedTags.length > 0) {
      filtered = filtered.filter(spot => {
        if (!spot.tags || spot.tags.length === 0) return false;
        return selectedTags.some(selectedTag => 
          spot.tags!.some(tag => normalizeTag(tag, lang) === selectedTag)
        );
      });
    }
    
    // 검색어 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(spot => {
        const name = typeof spot.name === 'object' ? spot.name[lang] : spot.name;
        const description = spot.description ? 
          (typeof spot.description === 'object' ? spot.description[lang] : spot.description) : '';
        
        return name?.toLowerCase().includes(query) || 
               description?.toLowerCase().includes(query);
      });
    }
    
    return filtered;
  }, [spots, selectedCountry, selectedRegion, selectedTags, searchQuery, lang]);
  
  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredSpots.length / itemsPerPage);
  const paginatedSpots = filteredSpots.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // 사용 가능한 태그 목록
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    filteredSpots.forEach(spot => {
      if (spot.tags) {
        spot.tags.forEach(tag => {
          tagSet.add(normalizeTag(tag, lang));
        });
      }
    });
    return Array.from(tagSet).map(tag => ({ value: tag, label: tag }));
  }, [filteredSpots, lang]);
  
  // react-select 스타일
  const filterSelectStyles: StylesConfig<TagOption, true> = {
    control: (base: CSSObjectWithLabel) => ({ 
      ...base, 
      minHeight: 32, 
      borderRadius: 9999,
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#2563eb'
      }
    }),
    valueContainer: (base: CSSObjectWithLabel) => ({ ...base, padding: '0 8px' }),
    input: (base: CSSObjectWithLabel) => ({ ...base, margin: 0, padding: 0 }),
    indicatorsContainer: (base: CSSObjectWithLabel) => ({ ...base, height: 32 }),
    dropdownIndicator: (base: CSSObjectWithLabel) => ({ ...base, padding: 4 }),
    clearIndicator: (base: CSSObjectWithLabel) => ({ ...base, padding: 4 }),
  };
  
  // 삭제 처리
  const handleDelete = useCallback(async (id: string) => {
    if (confirm(TEXT.confirmDelete[lang])) {
      setDeletingId(id);
      try {
        // 삭제할 스팟 찾기
        const spotToDelete = spots.find(spot => spot.id === id);
        
        if (spotToDelete) {
          // Storage에서 이미지 삭제
          const imagesToDelete: string[] = [];
          
          if (spotToDelete.imageUrl) {
            imagesToDelete.push(spotToDelete.imageUrl);
          }
          
          if (spotToDelete.extraImages && spotToDelete.extraImages.length > 0) {
            imagesToDelete.push(...spotToDelete.extraImages);
          }
          
          // 모든 이미지 삭제
          const deletePromises = imagesToDelete.map(url => deleteImageFromStorage(url));
          await Promise.all(deletePromises);
        }
        
        // Firestore에서 문서 삭제
        await deleteDoc(doc(db, 'spots', id));
        
        alert(TEXT.deleted[lang]);
        fetchSpots();
      } catch (error) {
        console.error('Error deleting spot:', error);
        alert(TEXT.deleteFailed[lang]);
      } finally {
        setDeletingId(null);
      }
    }
  }, [lang, spots, fetchSpots]);

  // 편집 페이지로 이동
  const handleEdit = useCallback((spotId: string) => {
    router.push(`/admin/spots/${spotId}/edit`);
  }, [router]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{TEXT.title[lang]}</h1>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => router.push('/admin/spots/new')}
        >
          {TEXT.addSpot[lang]}
        </button>
      </div>

      {/* 필터 바 */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
          {/* 국가 필터 */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{TEXT.selectCountry[lang]}:</span>
            <div className="flex gap-2">
              <button
                className={selectedCountry === 'ALL' ? pillSelected : pillUnselected}
                onClick={() => { setSelectedCountry('ALL'); setSelectedRegion('ALL'); }}
              >
                All
              </button>
              {COUNTRIES.filter(c => c.enabled).map(country => (
                <button
                  key={country.code}
                  className={selectedCountry === country.code ? pillSelected : pillUnselected}
                  onClick={() => { setSelectedCountry(country.code); setSelectedRegion('ALL'); }}
                >
                  {country.name[lang]}
                  {selectedCountry === country.code && (
                    <XMarkIcon 
                      className="w-4 h-4 ml-1" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setSelectedCountry('ALL'); 
                        setSelectedRegion('ALL'); 
                      }} 
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 지역 필터 */}
          {selectedCountry !== 'ALL' && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{TEXT.selectRegion[lang]}:</span>
              <div className="flex gap-2">
                <button
                  className={selectedRegion === 'ALL' ? pillSelected : pillUnselected}
                  onClick={() => setSelectedRegion('ALL')}
                >
                  All
                </button>
                {REGIONS[selectedCountry]?.filter(r => r.enabled).map(region => (
                  <button
                    key={region.code}
                    className={selectedRegion === region.code ? pillSelected : pillUnselected}
                    onClick={() => setSelectedRegion(region.code)}
                  >
                    {region.name[lang]}
                    {selectedRegion === region.code && (
                      <XMarkIcon 
                        className="w-4 h-4 ml-1" 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setSelectedRegion('ALL'); 
                        }} 
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 태그 필터 */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Tags:</span>
            <div style={{ minWidth: 200, maxWidth: 300 }}>
              <Select
                isMulti
                placeholder={TEXT.searchPlaceholder[lang]}
                options={availableTags}
                value={selectedTags.map(tag => ({ value: tag, label: tag }))}
                onChange={(selected) => setSelectedTags(selected ? selected.map(s => s.value) : [])}
                styles={filterSelectStyles}
              />
            </div>
          </div>

          {/* 검색 */}
          <div className="flex-1">
            <input
              type="text"
              placeholder={TEXT.searchPlaceholder[lang]}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1 border rounded-full text-sm"
            />
          </div>

          {/* 필터 초기화 */}
          <button
            onClick={() => {
              setSelectedCountry('ALL');
              setSelectedRegion('ALL');
              setSelectedTags([]);
              setSearchQuery('');
              setCurrentPage(1);
            }}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 text-sm"
          >
            {TEXT.resetFilters[lang]}
          </button>

          {/* 결과 개수 */}
          <span className="text-gray-500 text-sm">
            {filteredSpots.length} {TEXT.results[lang]}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>{TEXT.loading[lang]}</p>
        </div>
      ) : filteredSpots.length === 0 ? (
        <div className="text-center py-10 text-gray-500">{TEXT.noData[lang]}</div>
      ) : (
        <>
          {/* 카드 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedSpots.map(spot => (
              <div key={spot.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden">
                {/* 이미지 */}
                <div className="h-48 bg-gray-100 relative">
                  {spot.imageUrl ? (
                    <Image 
                      src={spot.imageUrl} 
                      alt={typeof spot.name === 'object' ? spot.name[lang] : spot.name || ''} 
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span className="text-4xl">🖼️</span>
                    </div>
                  )}
                </div>

                {/* 정보 */}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1">
                    {typeof spot.name === 'object' ? spot.name[lang] : spot.name || '-'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {typeof spot.region === 'object' ? spot.region[lang] : spot.region || '-'}
                    {spot.country && (
                      <span> · {typeof spot.country === 'object' ? spot.country[lang] : spot.country}</span>
                    )}
                  </p>

                  {/* 태그 */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {spot.tags && spot.tags.length > 0 && 
                      spot.tags.slice(0, 3).map((tag, i) => (
                        <span 
                          key={i} 
                          className="inline-block bg-blue-100 text-blue-700 rounded-full px-2 py-1 text-xs"
                        >
                          {normalizeTag(tag, lang)}
                        </span>
                      ))
                    }
                    {spot.tags && spot.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{spot.tags.length - 3}</span>
                    )}
                  </div>

                  {/* 버튼 */}
                  <div className="flex gap-2">
                    <button 
                      className="flex-1 px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-sm"
                      onClick={() => handleEdit(spot.id)}
                    >
                      {TEXT.edit[lang]}
                    </button>
                    <button 
                      className="flex-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm disabled:opacity-50"
                      onClick={() => handleDelete(spot.id)}
                      disabled={deletingId === spot.id}
                    >
                      {deletingId === spot.id ? TEXT.deleting[lang] : TEXT.delete[lang]}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-1 sm:gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-2 sm:px-3 py-1 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
              >
                <span className="hidden sm:inline">{TEXT.previous[lang]}</span>
                <span className="sm:hidden">‹</span>
              </button>
              
              {/* 모바일: 현재 페이지 정보만 표시 */}
              <div className="sm:hidden px-3 py-1 text-sm">
                {currentPage} / {totalPages}
              </div>
              
              {/* 데스크톱: 페이지 번호들 표시 */}
              <div className="hidden sm:flex gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }
                  return pageNum;
                }).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded transition-all ${
                      currentPage === page 
                        ? 'bg-blue-500 text-white shadow-md transform scale-110' 
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-2 sm:px-3 py-1 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
              >
                <span className="hidden sm:inline">{TEXT.next[lang]}</span>
                <span className="sm:hidden">›</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 