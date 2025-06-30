"use client";

import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/components/LanguageContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import MainLayout from '@/components/MainLayout';
import Image from 'next/image';

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
}

const COUNTRIES = [
  { code: 'KR', name: { ko: '한국', en: 'Korea' }, flag: '/images/kr.png', enabled: true },
  { code: 'PH', name: { ko: '필리핀', en: 'Philippines' }, flag: '/images/ph.png', enabled: true },
  { code: 'JP', name: { ko: '일본', en: 'Japan' }, flag: '/images/jp.png', enabled: false },
  { code: 'TW', name: { ko: '대만', en: 'Taiwan' }, flag: '/images/tw.png', enabled: false },
];
const REGIONS: Record<string, { code: string; name: { ko: string; en: string }; enabled: boolean }[]> = {
  KR: [
    { code: 'seoul', name: { ko: '서울', en: 'Seoul' }, enabled: true },
    { code: 'gyeonggi', name: { ko: '경기', en: 'Gyeonggi' }, enabled: true },
    { code: 'busan', name: { ko: '부산', en: 'Busan' }, enabled: true },
    { code: 'jeju', name: { ko: '제주', en: 'Jeju' }, enabled: true },
    { code: 'jeonnam', name: { ko: '전남', en: 'Jeonnam' }, enabled: true },
    { code: 'gyeongju', name: { ko: '경주', en: 'Gyeongju' }, enabled: true },
    { code: 'daegu', name: { ko: '대구', en: 'Daegu' }, enabled: false },
  ],
  PH: [
    { code: 'cebu', name: { ko: '세부', en: 'Cebu' }, enabled: true },
    { code: 'bohol', name: { ko: '보홀', en: 'Bohol' }, enabled: true },
    { code: 'manila', name: { ko: '마닐라', en: 'Manila' }, enabled: false },
  ],
  JP: [
    { code: 'tokyo', name: { ko: '도쿄', en: 'Tokyo' }, enabled: false },
  ],
  TW: [
    { code: 'taipei', name: { ko: '타이베이', en: 'Taipei' }, enabled: false },
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
  searchPlaceholder: { ko: '이름/태그로 검색', en: 'Search by name/tag' },
  noSpots: { ko: '등록된 여행지가 없습니다.', en: 'No spots found.' },
  guide: {
    ko: '여행지 필터를 선택해 원하는 정보를 찾아보세요!',
    en: 'Use the filters to find your perfect travel spot!'
  },
};

// pill 스타일 상수
const pillActive = "px-4 py-1 rounded-full bg-blue-500 text-white font-semibold shadow";
const pillDefault = "px-4 py-1 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-blue-50";

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

  useEffect(() => {
    const fetchTravelInfos = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, "travel-info"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const travelInfosData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TravelInfo[];
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

  const filteredByCountry = useMemo(() => country === 'ALL' ? travelInfos : travelInfos.filter(s => {
    if (!s.country) return false;
    if (typeof s.country === 'object') return s.country.en === country || s.country.ko === country;
    return s.country === country;
  }), [travelInfos, country]);
  const filteredByRegion = useMemo(() => region === 'ALL' ? filteredByCountry : filteredByCountry.filter(s => {
    if (!s.region) return false;
    if (typeof s.region === 'object') return s.region.en === region || s.region.ko === region;
    return s.region === region;
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
  const filteredSpots = useMemo(() => tag === 'ALL' ? filteredByRegion : filteredByRegion.filter(s => {
    if (!Array.isArray(s.tags)) return false;
    return s.tags.some(t => (typeof t === 'object' ? t[lang] : t) === tag);
  }), [filteredByRegion, tag, lang]);

  console.log('filteredSpots', filteredSpots);

  // 이미지 갤러리 관련 함수들
  const getAllImages = (spot: TravelInfo) => {
    const images = [];
    if (spot.imageUrl) images.push(spot.imageUrl);
    if (spot.extraImages && Array.isArray(spot.extraImages)) {
      images.push(...spot.extraImages);
    }
    return images;
  };

  const nextImage = () => {
    if (!selectedSpot) return;
    const images = getAllImages(selectedSpot);
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (!selectedSpot) return;
    const images = getAllImages(selectedSpot);
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  // 모달 열 때 이미지 인덱스 초기화
  const openSpotModal = (spot: TravelInfo) => {
    setSelectedSpot(spot);
    setCurrentImageIndex(0);
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
      <div className="min-h-screen">
        <main className="bg-gray-50 flex flex-col items-center pt-28 px-4">
          {/* 안내 메시지 (필터 위) */}
          <div className="w-full max-w-3xl mx-auto flex items-center gap-2 mb-3 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm shadow-sm">
            <svg className="w-5 h-5 mr-1 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
            <span>{TEXT.guide[lang]}</span>
          </div>
          {travelInfos.length === 0 ? (
            <div className="text-center">
              <p className="text-lg text-gray-600">{TEXT.noData[lang]}</p>
            </div>
          ) : (
            <section className="w-full max-w-3xl mx-auto">
              {/* 필터 UI: pill 2단 구조 */}
              <div className="w-full max-w-3xl mx-auto mb-6">
                {/* 1단: 국가 pill */}
                <div className="flex gap-2 flex-wrap mb-2">
                  <button onClick={() => { setCountry('ALL'); setRegion('ALL'); setTag('ALL'); }} className={country === 'ALL' ? pillActive : pillDefault}>{lang === 'ko' ? '전체' : 'All'}</button>
                  {COUNTRIES.filter(c => c.enabled).map(c => (
                    <button key={c.code} onClick={() => { setCountry(c.code); setRegion('ALL'); setTag('ALL'); }} className={country === c.code ? pillActive : pillDefault}>{c.name[lang]}</button>
                  ))}
                </div>
                {/* 2단: 지역 pill */}
                <div className="flex gap-2 flex-wrap mb-4">
                  <button onClick={() => { setRegion('ALL'); setTag('ALL'); }} className={region === 'ALL' ? pillActive : pillDefault}>{lang === 'ko' ? '전체' : 'All'}</button>
                  {country !== 'ALL' && REGIONS[country]?.filter(r => r.enabled).map(r => (
                    <button key={r.code} onClick={() => { setRegion(r.name[lang]); setTag('ALL'); }} className={region === r.name[lang] ? pillActive : pillDefault}>{r.name[lang]}</button>
                  ))}
                </div>
                {/* 3단: 태그 pill */}
                <div className="flex gap-2 flex-wrap mb-6">
                  <button onClick={() => setTag('ALL')} className={tag === 'ALL' ? pillActive : pillDefault}>{lang === 'ko' ? '모두보기' : 'All'}</button>
                  {uniqueTags.map(t => (
                    <button key={t} onClick={() => setTag(t)} className={tag === t ? pillActive : pillDefault}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-4">
                {filteredSpots.map((spot, i) => (
                  <div
                    key={spot.id || i}
                    className="flex bg-white rounded-xl shadow-md hover:shadow-xl transition cursor-pointer overflow-hidden border h-40"
                    onClick={() => openSpotModal(spot)}
                  >
                    <div className="w-40 h-40 flex-shrink-0 bg-gray-100 flex items-center justify-center">
                      {spot.imageUrl ? (
                        <Image src={spot.imageUrl} alt="img" width={160} height={160} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-400 text-3xl">🖼️</span>
                      )}
                    </div>
                    <div className="flex-1 p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl font-bold">{typeof spot.name === 'object' ? spot.name[lang] : spot.name || 'No Name'}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            {(typeof spot.region === 'object' ? spot.region[lang] : spot.region || '-')}
                            {spot.country ? ` · ${(typeof spot.country === 'object' ? spot.country[lang] : spot.country)}` : ''}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {Array.isArray(spot.tags) && spot.tags.length > 0
                            ? spot.tags.map((t, idx) => (
                                <span key={idx} className="inline-block bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-xs font-semibold">
                                  {typeof t === 'object' ? t[lang] : t}
                                </span>
                              ))
                            : null}
                        </div>
                        <div className="text-gray-600 text-sm mb-0" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {typeof spot.description === 'object' ? spot.description[lang] : spot.description || ''}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
        {/* 상세 모달 */}
        {selectedSpot && (
          <div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            onClick={() => setSelectedSpot(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-0 relative flex flex-col"
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
              <div className="w-full bg-gray-100 flex items-center justify-center relative p-0 rounded-t-2xl overflow-hidden" style={{ minHeight: '260px' }}>
                {(() => {
                  const images = getAllImages(selectedSpot);
                  if (images.length === 0) {
                    return (
                      <div className="h-56 w-full flex items-center justify-center text-4xl text-gray-300">🖼️</div>
                    );
                  }
                  
                  return (
                    <>
                      {/* 메인 이미지 */}
                      <Image 
                        src={images[currentImageIndex]} 
                        alt={`Image ${currentImageIndex + 1}`} 
                        width={800}
                        height={224}
                        className="h-56 w-full object-cover rounded-t-2xl transition-opacity duration-300" 
                      />
                      
                      {/* 좌우 화살표 (이미지가 2개 이상일 때만) */}
                      {images.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200"
                            aria-label="Previous image"
                          >
                            ‹
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200"
                            aria-label="Next image"
                          >
                            ›
                          </button>
                        </>
                      )}
                      
                      {/* 이미지 인디케이터 (하단) */}
                      {images.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                          {images.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => goToImage(index)}
                              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                                index === currentImageIndex 
                                  ? 'bg-white shadow-lg' 
                                  : 'bg-white/50 hover:bg-white/75'
                              }`}
                              aria-label={`Go to image ${index + 1}`}
                            />
                          ))}
                        </div>
                      )}
                      
                      {/* 이미지 카운터 */}
                      {images.length > 1 && (
                        <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
                          {currentImageIndex + 1} / {images.length}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              {/* 상세 정보 */}
              <div className="p-6 flex flex-col gap-3 max-h-[70vh] overflow-y-auto">
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
                {/* 별점 영역 (공간만) */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-yellow-400 text-xl">★</span>
                  <span className="text-gray-600 text-sm">4.8</span>
                  <span className="text-gray-400 text-xs">(평균 별점, 추후 구현)</span>
                </div>
                {/* 댓글 영역 (공간만) */}
                <div className="mt-4">
                  <div className="font-semibold text-gray-700 mb-2">댓글</div>
                  <div className="bg-gray-100 rounded-lg p-3 text-gray-400 text-sm mb-2">로그인 후 댓글 작성이 가능합니다. (추후 구현)</div>
                  {/* 댓글 목록 자리 */}
                  <div className="flex flex-col gap-2">
                    {/* 예시 댓글 자리 */}
                    {/* <div className="bg-white border rounded p-2 text-sm">좋은 여행지였어요!</div> */}
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