"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useLanguage } from "@/components/LanguageContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import MainLayout from '@/components/MainLayout';
import Image from 'next/image';
import Select, { SingleValue, StylesConfig, ControlProps, CSSObjectWithLabel } from 'react-select';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface TravelInfo {
  id: string;
  name?: string | { ko: string; en: string };
  title?: string | { ko: string; en: string };
  content?: string | { ko: string; en: string };
  category?: string | { ko: string; en: string };
  imageUrls?: string[];
  tags?: Array<string | { ko: string; en: string }>;
  createdAt?: Date | string | { seconds: number; nanoseconds: number };
  region?: string | { ko: string; en: string };
  imageUrl?: string;
  country?: string | { ko: string; en: string };
  mapUrl?: string;
  description?: string | { ko: string; en: string };
  extraImages?: string[];
  price?: string | { KRW?: string; PHP?: string; USD?: string } | { ko: string; en: string };
  duration?: string | { ko: string; en: string };
  isPublic?: boolean; // 공개 여부 추가
}

const COUNTRIES = [
  { code: 'KR', name: { ko: '한국', en: 'Korea' }, flag: '/images/kr.png', enabled: true },
  { code: 'PH', name: { ko: '필리핀', en: 'Philippines' }, flag: '/images/ph.png', enabled: true },
  { code: 'JP', name: { ko: '일본', en: 'Japan' }, flag: '/images/jp.png', enabled: true },
  { code: 'VN', name: { ko: '베트남', en: 'Vietnam' }, flag: '/images/vn.png', enabled: true },
  { code: 'TW', name: { ko: '대만', en: 'Taiwan' }, flag: '/images/tw.png', enabled: true },
];
const REGIONS: Record<string, { code: string; name: { ko: string; en: string }; enabled: boolean }[]> = {
  KR: [
    { code: 'seoul', name: { ko: '서울', en: 'Seoul' }, enabled: true },
    { code: 'busan', name: { ko: '부산', en: 'Busan' }, enabled: true },
    { code: 'jeju', name: { ko: '제주', en: 'Jeju' }, enabled: true },
    { code: 'gyeongju', name: { ko: '경주', en: 'Gyeongju' }, enabled: true },
    { code: 'jeonnam', name: { ko: '전남', en: 'Jeonnam' }, enabled: true },
    { code: 'gyeonggi', name: { ko: '경기도', en: 'Gyeonggi' }, enabled: true },
    { code: 'gangwon', name: { ko: '강원도', en: 'Gangwon' }, enabled: true },
    { code: 'incheon', name: { ko: '인천', en: 'Incheon' }, enabled: true },
    { code: 'daegu', name: { ko: '대구', en: 'Daegu' }, enabled: true },
    { code: 'gwangju', name: { ko: '광주', en: 'Gwangju' }, enabled: true },
  ],
  PH: [
    { code: 'manila', name: { ko: '마닐라', en: 'Manila' }, enabled: true },
    { code: 'cebu', name: { ko: '세부', en: 'Cebu' }, enabled: true },
    { code: 'bohol', name: { ko: '보홀', en: 'Bohol' }, enabled: true },
    { code: 'palawan', name: { ko: '팔라완', en: 'Palawan' }, enabled: true },
    { code: 'davao', name: { ko: '다바오', en: 'Davao' }, enabled: true },
    { code: 'baguio', name: { ko: '바기오', en: 'Baguio' }, enabled: true },
    { code: 'puerto-princesa', name: { ko: '푸에르토프린세사', en: 'Puerto Princesa' }, enabled: true },
    { code: 'el-nido', name: { ko: '엘니도', en: 'El Nido' }, enabled: true },
    { code: 'boracay', name: { ko: '보라카이', en: 'Boracay' }, enabled: true },
    { code: 'siargao', name: { ko: '시아르가오', en: 'Siargao' }, enabled: true },
  ],
  JP: [
    { code: 'tokyo', name: { ko: '도쿄', en: 'Tokyo' }, enabled: true },
    { code: 'osaka', name: { ko: '오사카', en: 'Osaka' }, enabled: true },
    { code: 'kyoto', name: { ko: '교토', en: 'Kyoto' }, enabled: true },
    { code: 'yokohama', name: { ko: '요코하마', en: 'Yokohama' }, enabled: true },
    { code: 'nagoya', name: { ko: '나고야', en: 'Nagoya' }, enabled: true },
    { code: 'sapporo', name: { ko: '삿포로', en: 'Sapporo' }, enabled: true },
    { code: 'fukuoka', name: { ko: '후쿠오카', en: 'Fukuoka' }, enabled: true },
    { code: 'kobe', name: { ko: '고베', en: 'Kobe' }, enabled: true },
    { code: 'kawasaki', name: { ko: '가와사키', en: 'Kawasaki' }, enabled: true },
    { code: 'hiroshima', name: { ko: '히로시마', en: 'Hiroshima' }, enabled: true },
  ],
  VN: [
    { code: 'ho-chi-minh', name: { ko: '호치민', en: 'Ho Chi Minh City' }, enabled: true },
    { code: 'hanoi', name: { ko: '하노이', en: 'Hanoi' }, enabled: true },
    { code: 'da-nang', name: { ko: '다낭', en: 'Da Nang' }, enabled: true },
    { code: 'hai-phong', name: { ko: '하이퐁', en: 'Hai Phong' }, enabled: true },
    { code: 'phu-quoc', name: { ko: '푸꾸옥', en: 'Phu Quoc' }, enabled: true },
    { code: 'nha-trang', name: { ko: '나트랑', en: 'Nha Trang' }, enabled: true },
    { code: 'hoi-an', name: { ko: '호이안', en: 'Hoi An' }, enabled: true },
    { code: 'da-lat', name: { ko: '달랏', en: 'Da Lat' }, enabled: true },
    { code: 'sapa', name: { ko: '사파', en: 'Sapa' }, enabled: true },
    { code: 'ha-long-bay', name: { ko: '하롱베이', en: 'Ha Long Bay' }, enabled: true },
  ],
  TW: [
    { code: 'taipei', name: { ko: '타이페이', en: 'Taipei' }, enabled: true },
    { code: 'kaohsiung', name: { ko: '가오슝', en: 'Kaohsiung' }, enabled: true },
    { code: 'taichung', name: { ko: '타이중', en: 'Taichung' }, enabled: true },
    { code: 'tainan', name: { ko: '타이난', en: 'Tainan' }, enabled: true },
    { code: 'keelung', name: { ko: '지룽', en: 'Keelung' }, enabled: true },
    { code: 'hsinchu', name: { ko: '신주', en: 'Hsinchu' }, enabled: true },
    { code: 'chiayi', name: { ko: '자이', en: 'Chiayi' }, enabled: true },
    { code: 'hualien', name: { ko: '화롄', en: 'Hualien' }, enabled: true },
    { code: 'taitung', name: { ko: '타이둥', en: 'Taitung' }, enabled: true },
    { code: 'pingtung', name: { ko: '핑둥', en: 'Pingtung' }, enabled: true },
  ],
};

const TEXT = {
  title: { ko: "여행정보", en: "Travel Info" },
  desc: {
    ko: "여행에 필요한 다양한 정보를 확인하세요!",
    en: "Find a variety of useful travel information!"
  },
  loading: { ko: "로딩 중...", en: "Loading..." },
  noData: { ko: "여행정보가 없습니다.", en: "No travel information available." },
  recommended: { ko: '추천 스팟', en: 'Recommended Spots' },
  selectCountry: { ko: '국가 선택', en: 'Select Country' },
  selectRegion: { ko: '지역 선택', en: 'Select Region' },
  comingSoon: { ko: '커밍순', en: 'Coming Soon' },
  searchPlaceholder: { ko: '이름/설명으로 검색', en: 'Search by name/description' },
  noSpots: { ko: '등록된 여행지가 없습니다.', en: 'No spots found.' },
  guide: {
    ko: '여행지 필터를 선택해 원하는 정보를 찾아보세요!',
    en: 'Use the filters to find your perfect travel spot!'
  },
  resetFilters: { ko: '필터 초기화', en: 'Reset Filters' },
  results: { ko: '개 결과', en: 'results' },
  page: { ko: '페이지', en: 'Page' },
  previous: { ko: '이전', en: 'Previous' },
  next: { ko: '다음', en: 'Next' },
};

// pill 스타일 상수
const pillSelected = "px-4 py-1 rounded-full bg-blue-600 text-white font-semibold shadow flex items-center gap-1";
const pillUnselected = "px-4 py-1 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-blue-50 cursor-pointer";

type TagOption = { value: string; label: string };

export default function TravelInfoPage() {
  const { lang } = useLanguage();
  const [travelInfos, setTravelInfos] = useState<TravelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [country, setCountry] = useState('ALL');
  const [region, setRegion] = useState('ALL');
  const [tag, setTag] = useState('ALL');
  const [selectedSpot, setSelectedSpot] = useState<TravelInfo | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  // 스와이프 관련 상태
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);



  useEffect(() => {
    const fetchTravelInfos = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, "spots"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const travelInfosData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data
          };
        }) as TravelInfo[];
        setTravelInfos(travelInfosData);
      } catch (err) {
        console.error('Error fetching travel infos:', err);
        setError('여행정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchTravelInfos();
  }, []);

  // 공개된 스팟만 필터링
  const publicSpots = useMemo(() => {
    return travelInfos.filter(spot => {
      // isPublic이 undefined이거나 true인 경우 공개로 간주
      return spot.isPublic !== false;
    });
  }, [travelInfos]);

  const filteredByCountry = useMemo(() => country === 'ALL' ? publicSpots : publicSpots.filter(s => {
    if (!s.country) return false;
    if (typeof s.country === 'object') {
      return (
        (s.country.en && s.country.en.toLowerCase() === country.toLowerCase()) ||
        (s.country.ko && s.country.ko === country)
      );
    }
    return String(s.country).toLowerCase() === country.toLowerCase();
  }), [publicSpots, country]);
  const filteredByRegion = useMemo(() => region === 'ALL' ? filteredByCountry : filteredByCountry.filter(s => {
    if (!s.region) return false;
    if (typeof s.region === 'object') {
      return (
        (s.region.en && s.region.en.toLowerCase() === region.toLowerCase()) ||
        (s.region.ko && s.region.ko === region)
      );
    }
    return String(s.region).toLowerCase() === region.toLowerCase();
  }), [filteredByCountry, region]);
  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    filteredByRegion.forEach(s => {
      if (Array.isArray(s.tags)) {
        s.tags.forEach(t => tags.add(typeof t === 'object' ? t[lang] : t));
      }
    });
    return Array.from(tags);
  }, [filteredByRegion, lang]);
  const filteredByTag = useMemo(() => tag === 'ALL' ? filteredByRegion : filteredByRegion.filter(s => {
    if (!Array.isArray(s.tags)) return false;
    return s.tags.some(t => (typeof t === 'object' ? t[lang] : t) === tag);
  }), [filteredByRegion, tag, lang]);
  
  // 검색어 필터 추가
  const filteredSpots = useMemo(() => {
    if (!searchQuery) return filteredByTag;
    
    const query = searchQuery.toLowerCase();
    return filteredByTag.filter(spot => {
      const name = typeof spot.name === 'object' ? spot.name[lang] : spot.name;
      const description = spot.description ? 
        (typeof spot.description === 'object' ? spot.description[lang] : spot.description) : '';
      
      return name?.toLowerCase().includes(query) || 
             description?.toLowerCase().includes(query);
    });
  }, [filteredByTag, searchQuery, lang]);
  
  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredSpots.length / itemsPerPage);
  const paginatedSpots = filteredSpots.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 이미지 갤러리 관련 함수들
  const getAllImages = useCallback((spot: TravelInfo) => {
    const images = [];
    
    // imageUrls 필드 처리 (배열)
    if (spot.imageUrls && Array.isArray(spot.imageUrls)) {
      images.push(...spot.imageUrls);
    }
    // imageUrl 필드 처리 (단일 문자열)
    else if (spot.imageUrl) {
      images.push(spot.imageUrl);
      // extraImages가 있으면 추가
      if (spot.extraImages && Array.isArray(spot.extraImages)) {
        images.push(...spot.extraImages);
      }
    }
    
    return images;
  }, []);

  // 이미지 로딩 상태 관리
  const [imageLoadingStates, setImageLoadingStates] = useState<{ [key: string]: boolean }>({});
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  // 순차적 이미지 프리로드
  const preloadImagesSequentially = useCallback(async (images: string[]) => {
    const newLoadingStates: { [key: string]: boolean } = {};
    images.forEach(src => {
      newLoadingStates[src] = true;
    });
    setImageLoadingStates(newLoadingStates);
    setLoadedImages(new Set());

    for (let i = 0; i < images.length; i++) {
      const src = images[i];
      try {
        await new Promise((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => {
            setLoadedImages(prev => new Set([...prev, src]));
            setImageLoadingStates(prev => ({ ...prev, [src]: false }));
            resolve(src);
          };
          img.onerror = () => {
            setImageLoadingStates(prev => ({ ...prev, [src]: false }));
            reject(new Error(`Failed to load image: ${src}`));
          };
          img.src = src;
        });
        
        // 첫 번째 이미지는 즉시 로드, 나머지는 약간의 지연
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.warn(`Failed to preload image: ${src}`, error);
      }
    }
  }, []);

  const nextImage = useCallback(() => {
    if (!selectedSpot) return;
    const images = getAllImages(selectedSpot);
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [selectedSpot, getAllImages]);

  const prevImage = useCallback(() => {
    if (!selectedSpot) return;
    const images = getAllImages(selectedSpot);
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [selectedSpot, getAllImages]);

  const goToImage = useCallback((index: number) => {
    setCurrentImageIndex(index);
  }, []);

  // 모달 열 때 이미지 인덱스 초기화 및 순차적 이미지 프리로드
  const openSpotModal = useCallback(async (spot: TravelInfo) => {
    setSelectedSpot(spot);
    setCurrentImageIndex(0);
    
    // 모든 이미지 순차적 프리로드
    const images = getAllImages(spot);
    if (images.length > 0) {
      await preloadImagesSequentially(images);
    }
  }, [getAllImages, preloadImagesSequentially]);
  
  // 스와이프 핸들러
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);
  
  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe) {
      nextImage();
    }
    if (isRightSwipe) {
      prevImage();
    }
  }, [touchStart, touchEnd, nextImage, prevImage]);

  // react-select 스타일 타입 명시
  const filterSelectStyles: StylesConfig<TagOption, false> = {
    control: (base: CSSObjectWithLabel, state: ControlProps<TagOption, false>) => ({ ...base, minHeight: 32, borderRadius: 9999, boxShadow: state.isFocused ? '0 0 0 2px #2563eb' : undefined }),
    valueContainer: (base: CSSObjectWithLabel) => ({ ...base, padding: '0 8px' }),
    input: (base: CSSObjectWithLabel) => ({ ...base, margin: 0, padding: 0 }),
    indicatorsContainer: (base: CSSObjectWithLabel) => ({ ...base, height: 32 }),
    dropdownIndicator: (base: CSSObjectWithLabel) => ({ ...base, padding: 4 }),
    clearIndicator: (base: CSSObjectWithLabel) => ({ ...base, padding: 4 }),
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen">
          <main className="bg-gray-50 flex flex-col items-center pt-28 px-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg text-gray-600">{TEXT.loading[lang]}</p>
            </div>
          </main>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="min-h-screen">
          <main className="bg-gray-50 flex flex-col items-center pt-28 px-4">
            <div className="text-center">
              <p className="text-lg text-red-600 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                다시 시도
              </button>
            </div>
          </main>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* 필터 바: 네비게이션바 바로 아래, 페이지 최상단에 sticky */}
      <div className="sticky z-30 bg-white py-3 px-2 sm:py-4 sm:px-4 border-b border-gray-200 shadow-md w-full" style={{ top: 'var(--navbar-height, 50px)' }}>
        <div className="max-w-7xl mx-auto flex flex-wrap gap-2 sm:gap-3 items-center">
          {/* 국가 필터 */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{TEXT.selectCountry[lang]}:</span>
            {['ALL', ...COUNTRIES.filter(c => c.enabled).map(c => c.code)].map(code => (
              <button
                key={code}
                className={country === code ? pillSelected : pillUnselected}
                onClick={() => { setCountry(code); setRegion('ALL'); setCurrentPage(1); }}
              >
                {code === 'ALL' ? 'All' : COUNTRIES.find(c => c.code === code)?.name[lang]}
                {country === code && code !== 'ALL' && (
                  <XMarkIcon className="w-4 h-4 ml-1" onClick={e => {e.stopPropagation(); setCountry('ALL'); setRegion('ALL');}} />
                )}
              </button>
            ))}
          </div>
          
          {/* 지역 필터 */}
          {country !== 'ALL' && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{TEXT.selectRegion[lang]}:</span>
              {['ALL', ...REGIONS[country].filter(r => r.enabled).map(r => r.code)].map(code => (
                <button
                  key={code}
                  className={region === code ? pillSelected : pillUnselected}
                  onClick={() => { setRegion(code); setCurrentPage(1); }}
                >
                  {code === 'ALL' ? 'All' : REGIONS[country].find(r => r.code === code)?.name[lang]}
                  {region === code && code !== 'ALL' && (
                    <XMarkIcon className="w-4 h-4 ml-1" onClick={e => {e.stopPropagation(); setRegion('ALL');}} />
                  )}
                </button>
              ))}
            </div>
          )}
          
          {/* 태그 필터 */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Tag:</span>
            <div style={{ minWidth: 180, maxWidth: 240 }}>
              <Select
                isClearable
                placeholder="Select tag"
                options={[{ value: 'ALL', label: 'All' }, ...uniqueTags.map(t => ({ value: t, label: t }))]}
                value={tag === 'ALL' ? null : { value: tag, label: tag }}
                onChange={(opt: SingleValue<TagOption>) => { setTag(opt?.value || 'ALL'); setCurrentPage(1); }}
                styles={filterSelectStyles}
              />
            </div>
          </div>
          
          {/* 검색 */}
          <div className="w-full sm:flex-1 sm:min-w-[200px] order-last sm:order-none">
            <input
              type="text"
              placeholder={TEXT.searchPlaceholder[lang]}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-1 border rounded-full text-sm"
            />
          </div>
          
          {/* 초기화 버튼 */}
          <button
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full font-semibold text-sm"
            onClick={() => { 
              setCountry('ALL'); 
              setRegion('ALL'); 
              setTag('ALL'); 
              setSearchQuery('');
              setCurrentPage(1);
            }}
          >
            {TEXT.resetFilters[lang]}
          </button>
          
          {/* 결과 개수 */}
          <span className="text-gray-500 text-sm">{filteredSpots.length} {TEXT.results[lang]}</span>
        </div>
      </div>
      {/* 본문: 필터 바와 겹치지 않게 padding-top 추가 */}
      <div className="min-h-screen pt-8">
        <main className="bg-gray-50 flex flex-col items-center px-4">
          <h1 className="text-3xl font-bold mb-2 text-center">{TEXT.title[lang]}</h1>
          <p className="text-lg text-gray-700 mb-8">{TEXT.desc[lang]}</p>
          {travelInfos.length === 0 ? (
            <div className="text-center">
              <p className="text-lg text-gray-600">{TEXT.noData[lang]}</p>
            </div>
          ) : (
            <>
              <section className="w-full max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {paginatedSpots.map((spot, index) => (
                    <div
                      key={spot.id}
                      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden cursor-pointer"
                      onClick={() => openSpotModal(spot)}
                    >
                      {/* 이미지 */}
                      <div className="h-48 bg-gray-100 relative overflow-hidden">
                        {(spot.imageUrls && spot.imageUrls[0]) || spot.imageUrl ? (
                          <Image 
                            src={spot.imageUrls?.[0] || spot.imageUrl || ''} 
                            alt={typeof spot.name === 'object' ? spot.name[lang] : spot.name || ''} 
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            priority={index === 0}
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
                                {typeof tag === 'object' ? tag[lang] : tag}
                              </span>
                            ))
                          }
                          {spot.tags && spot.tags.length > 3 && (
                            <span className="text-xs text-gray-500">+{spot.tags.length - 3}</span>
                          )}
                        </div>

                        {/* 설명 (2줄 제한) */}
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {typeof spot.description === 'object' ? spot.description[lang] : spot.description || ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

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
        </main>
        {/* 상세 모달 */}
        {selectedSpot && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            onClick={() => setSelectedSpot(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] p-0 relative flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* 닫기 버튼 */}
              <button
                className="absolute top-3 right-3 text-white bg-black/60 hover:bg-black/80 rounded-full w-10 h-10 flex items-center justify-center text-3xl font-bold shadow-lg z-10 border-2 border-white"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}
                onClick={() => setSelectedSpot(null)}
                aria-label="Close"
              >
                ×
              </button>
              {/* 이미지 슬라이더/썸네일 */}
              <div 
                className="w-full bg-gray-100 flex items-center justify-center relative p-0 rounded-t-2xl overflow-hidden" 
                style={{ height: '400px' }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {(() => {
                  const images = getAllImages(selectedSpot);
                  if (images.length === 0) {
                    return (
                      <div className="h-full w-full flex items-center justify-center text-4xl text-gray-300">🖼️</div>
                    );
                  }
                  
                  return (
                    <>
                      {/* 메인 이미지 */}
                      <div className="relative w-full h-full">
                        {imageLoadingStates[images[currentImageIndex]] ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <div className="flex flex-col items-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                              <span className="text-sm text-gray-600">이미지 로딩 중...</span>
                            </div>
                          </div>
                        ) : (
                        <Image 
                          src={images[currentImageIndex]} 
                          alt={`Image ${currentImageIndex + 1}`} 
                          fill
                          className="object-cover transition-opacity duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                          priority
                        />
                        )}
                      </div>
                      
                      {/* 좌우 화살표 (이미지가 2개 이상일 때만) */}
                      {images.length > 1 && (
                        <>
                          {/* 왼쪽 화살표 */}
                          <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 hidden sm:flex items-center justify-center z-10"
                            aria-label="Previous image"
                          >
                            {/* 더 두껍고 진한 파란색 왼쪽 화살표 SVG */}
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                          </button>
                          {/* 오른쪽 화살표 */}
                          <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 hidden sm:flex items-center justify-center z-10"
                            aria-label="Next image"
                          >
                            {/* 더 두껍고 진한 파란색 오른쪽 화살표 SVG */}
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
                          </button>
                        </>
                      )}
                      
                      {/* 이미지 인디케이터 (하단) */}
                      {images.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                          {images.map((imageSrc, index) => (
                            <button
                              key={index}
                              onClick={() => goToImage(index)}
                              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                                index === currentImageIndex 
                                  ? 'bg-white shadow-lg' 
                                  : imageLoadingStates[imageSrc]
                                  ? 'bg-yellow-400 animate-pulse'
                                  : loadedImages.has(imageSrc)
                                  ? 'bg-white/50 hover:bg-white/75'
                                  : 'bg-gray-400'
                              }`}
                              aria-label={`Go to image ${index + 1}`}
                              title={imageLoadingStates[imageSrc] ? '로딩 중...' : loadedImages.has(imageSrc) ? '로드됨' : '미로드'}
                            />
                          ))}
                        </div>
                      )}
                      
                      {/* 이미지 카운터 및 로딩 진행률 */}
                      {images.length > 1 && (
                        <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
                          {currentImageIndex + 1} / {images.length}
                          {Object.values(imageLoadingStates).some(loading => loading) && (
                            <div className="mt-1 text-xs">
                              로딩: {loadedImages.size} / {images.length}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              {/* 상세 정보 */}
              <div className="p-6 flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 400px)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl font-bold">{typeof selectedSpot.name === 'object' ? selectedSpot.name[lang] : selectedSpot.name || 'No Name'}</span>
                  <span className="text-base text-gray-500 ml-2">
                    {(typeof selectedSpot.region === 'object' ? selectedSpot.region[lang] : selectedSpot.region || '-')}
                    {selectedSpot.country ? ` · ${(typeof selectedSpot.country === 'object' ? selectedSpot.country[lang] : selectedSpot.country)}` : ''}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {Array.isArray(selectedSpot.tags) && selectedSpot.tags.length > 0
                    ? selectedSpot.tags.map((t, idx) => (
                        <span key={idx} className="inline-block bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-xs font-semibold">
                          {typeof t === 'object' ? t[lang] : t}
                        </span>
                      ))
                    : null}
                </div>
                {/* 설명 */}
                <div className="text-gray-700 text-base whitespace-pre-line mb-2">
                  <span className="font-semibold">{lang === 'ko' ? '설명' : 'Description'}: </span>
                  {typeof selectedSpot.description === 'object' ? selectedSpot.description[lang] : selectedSpot.description || ''}
                </div>
                {/* 지도 보기 버튼 */}
                {selectedSpot.mapUrl && (
                  <a
                    href={selectedSpot.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mb-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold hover:bg-blue-200 transition"
                  >
                    {lang === 'ko' ? '지도에서 위치 보기' : 'View on Map'}
                  </a>
                )}
                {/* 추가 정보 */}
                {selectedSpot.price && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <span className="font-semibold text-sm">{lang === 'ko' ? '가격' : 'Price'}: </span>
                    <span className="text-sm">
                      {typeof selectedSpot.price === 'object' ? 
                        Object.entries(selectedSpot.price).map(([currency, value]) => 
                          value ? `${currency}: ${value}` : null
                        ).filter(Boolean).join(' / ') : 
                        selectedSpot.price
                      }
                    </span>
                  </div>
                )}
                
                {selectedSpot.duration && (
                  <div className="mb-3">
                    <span className="font-semibold text-sm">{lang === 'ko' ? '소요시간' : 'Duration'}: </span>
                    <span className="text-sm">
                      {typeof selectedSpot.duration === 'object' ? selectedSpot.duration[lang] : selectedSpot.duration}
                    </span>
                  </div>
                )}
                
                {/* 별점 영역 (공간만) */}
                <div className="flex items-center gap-2 mb-2 p-3 bg-yellow-50 rounded-lg">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} className="text-yellow-400 text-xl">
                        {star <= 4.8 ? '★' : '☆'}
                      </span>
                    ))}
                  </div>
                  <span className="text-gray-700 font-semibold">4.8</span>
                  <span className="text-gray-500 text-sm">(리뷰 128개)</span>
                </div>
                
                {/* 댓글 영역 (공간만) */}
                <div className="mt-4 border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-700">{lang === 'ko' ? '리뷰' : 'Reviews'}</h3>
                    <button className="text-blue-600 text-sm hover:underline">
                      {lang === 'ko' ? '리뷰 작성' : 'Write a review'}
                    </button>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4 text-gray-500 text-sm text-center">
                    {lang === 'ko' ? '로그인 후 리뷰 작성이 가능합니다.' : 'Please login to write a review.'}
                  </div>
                  {/* 예시 리뷰 */}
                  <div className="mt-3 space-y-3">
                    <div className="bg-white border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">김여행</span>
                        <span className="text-yellow-400 text-sm">★★★★★</span>
                        <span className="text-gray-400 text-xs">2024.01.15</span>
                      </div>
                      <p className="text-sm text-gray-600">정말 좋은 여행지였어요! 가족과 함께 다시 오고 싶습니다.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 