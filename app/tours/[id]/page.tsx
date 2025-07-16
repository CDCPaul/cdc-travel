"use client";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState, useRef, useCallback } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navigation from "@/components/Navigation";
import { useLanguage } from "@/components/LanguageContext";
import { safeLang } from "@/lib/types";
import { getPHPPrice } from "@/lib/types";
import { AnimatePresence } from "framer-motion";
import { loadGoogleMapsAPI } from "@/lib/google-maps";

// Spot 타입을 명확히 선언
interface Spot {
  spotId: string;
  spotName: { ko: string; en: string };
  spotImage?: string;
  imageUrls?: string[]; // 이미지 배열 추가
  extraImages?: string[]; // 추가 이미지 배열 추가
  coordinates?: { lat: number; lng: number }; // 좌표 추가
  description?: { ko: string; en: string }; // 설명 추가
  region?: { ko: string; en: string }; // 지역 추가
  country?: { ko: string; en: string }; // 국가 추가
  tags?: Array<string | { ko: string; en: string }>; // 태그 추가
  mapUrl?: string; // 지도 URL 추가
  price?: string | { ko: string; en: string }; // 가격 추가
  duration?: string | { ko: string; en: string }; // 소요시간 추가
  // 필요시 추가 필드
}

// 실제 Firestore에 저장되는 데이터 구조에 맞는 타입 정의
interface Product {
  id: string;
  title: { ko: string; en: string };
  description: { ko: string; en: string };
  duration: { startDate: string; endDate: string };
  nights?: number;
  days?: number;
  price: { KRW?: string; PHP?: string; USD?: string };
  region: { ko: string; en: string };
  country?: { en: string; ko: string };
  imageUrls?: string[];
  schedule?: Array<{
    day: number;
    spots: Array<{
      spotId: string;
      spotName: { ko: string; en: string };
      spotImage?: string;
    }>;
  }>;
  highlights?: Array<{
    spotId: string;
    spotName: { ko: string; en: string };
  }>;
  includedItems?: string[];
  notIncludedItems?: string[];
  flightCombos?: Array<{
    departure: {
      airline: { ko: string; en: string };
      flightNumber: string;
      from: string;
      to: string;
      departTime: string;
      arriveTime: string;
    };
    return: {
      airline: { ko: string; en: string };
      flightNumber: string;
      from: string;
      to: string;
      departTime: string;
      arriveTime: string;
    };
  }>;
}

const TEXTS = {
  ko: {
    loading: "로딩 중...",
    notFound: "투어 상품을 찾을 수 없습니다.",
    backToTours: "← 투어 목록으로",
    duration: "기간",
    region: "지역",
    highlights: "하이라이트",
    schedule: "일정",
    day: "일차",
    includedItems: "포함 사항",
    notIncludedItems: "불포함 사항",
    price: "가격",
    period: "기간",
    included: "항공 + 호텔 + 가이드",
    viewMap: "지도보기",
    closeMap: "닫기"
  },
  en: {
    loading: "Loading...",
    notFound: "Tour product not found.",
    backToTours: "← Back to Tours",
    duration: "Duration",
    region: "Region",
    highlights: "Highlights",
    schedule: "Schedule",
    day: "Day",
    includedItems: "Included Items",
    notIncludedItems: "Not Included Items",
    price: "Price",
    period: "Period",
    included: "Flight + Hotel + Guide",
    viewMap: "View Map",
    closeMap: "Close"
  }
};

// nights, days를 자연어로 조합해주는 함수
function getNightsDaysText(nights?: number, days?: number, lang: 'ko' | 'en' = 'ko') {
  if (!nights || !days) return '';
  return lang === 'ko'
    ? `${nights}박 ${days}일`
    : `${nights} night${nights > 1 ? 's' : ''} ${days} day${days > 1 ? 's' : ''}`;
}

// 일차별 지도 모달 컴포넌트
function DayMapModal({ 
  day, 
  spots, 
  onClose, 
  lang 
}: { 
  day: number; 
  spots: Spot[]; 
  onClose: () => void; 
  lang: 'ko' | 'en' 
}) {
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  // Google Maps API 로드
  useEffect(() => {
    const loadAPI = async () => {
      try {
        await loadGoogleMapsAPI();
        setIsGoogleMapsLoaded(true);
      } catch (error) {
        console.error('Failed to load Google Maps API:', error);
      }
    };
    loadAPI();
  }, []);

  // 지도 초기화 및 마커 표시
  useEffect(() => {
    if (!isGoogleMapsLoaded || !mapRef.current || spots.length === 0) return;

    const validSpots = spots.filter(spot => spot.coordinates);
    if (validSpots.length === 0) return;

    // 지도 생성
    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 12,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
    });

    mapInstance.current = map;

    // 마커 생성 및 경로 그리기
    const bounds = new window.google.maps.LatLngBounds();
    const markers: google.maps.Marker[] = [];
    const path: google.maps.LatLng[] = [];

    validSpots.forEach((spot, index) => {
      if (!spot.coordinates) return;

      const position = new window.google.maps.LatLng(
        spot.coordinates.lat,
        spot.coordinates.lng
      );

              // 마커 생성 (번호 + 스팟 이름)
        const marker = new window.google.maps.Marker({
          position,
          map,
          title: safeLang(spot.spotName, lang),
          label: {
            text: `${index + 1}. ${safeLang(spot.spotName, lang)}`,
            color: '#000000',
            fontWeight: 'bold',
            fontSize: '12px'
          },
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          }
        });

      // 정보창 생성
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 4px 0; font-weight: bold;">${safeLang(spot.spotName, lang)}</h3>
            <p style="margin: 0; color: #666;">${index + 1}번째 방문지</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      markers.push(marker);
      path.push(position);
      bounds.extend(position);
    });

    markersRef.current = markers;

    // 경로 선 그리기
    if (path.length > 1) {
      const polyline = new window.google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#4285F4',
        strokeOpacity: 0.8,
        strokeWeight: 3,
      });

      polyline.setMap(map);
      polylineRef.current = polyline;
    }

    // 지도 범위 조정
    map.fitBounds(bounds);
    if (validSpots.length === 1) {
      map.setZoom(15);
    }

    // 클린업 함수
    return () => {
      markers.forEach(marker => marker.setMap(null));
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [isGoogleMapsLoaded, spots, lang]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">
            {lang === 'ko' ? `${day}일차` : `Day ${day}`} {TEXTS[lang].viewMap}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="flex-1 p-4">
          {!isGoogleMapsLoaded ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p>{TEXTS[lang].loading}</p>
              </div>
            </div>
          ) : (
            <div ref={mapRef} className="w-full h-full rounded-lg" />
          )}
        </div>
      </div>
    </div>
  );
}

// Spot 상세 모달 컴포넌트 (여행정보 페이지 스타일로 업그레이드)
function SpotDetailModal({ spot, onClose, lang }: { spot: Spot; onClose: () => void; lang: 'ko' | 'en' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spotDetail, setSpotDetail] = useState<Spot | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoadingStates, setImageLoadingStates] = useState<{ [key: string]: boolean }>({});
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // 이미지 갤러리 관련 함수들
  const getAllImages = useCallback((spotData: Spot) => {
    const images = [];
    
    // imageUrls 필드 처리 (배열)
    if (spotData.imageUrls && Array.isArray(spotData.imageUrls)) {
      images.push(...spotData.imageUrls);
    }
    // spotImage 필드 처리 (단일 문자열)
    else if (spotData.spotImage) {
      images.push(spotData.spotImage);
      // extraImages가 있으면 추가
      if (spotData.extraImages && Array.isArray(spotData.extraImages)) {
        images.push(...spotData.extraImages);
      }
    }
    
    return images;
  }, []);

  // Firestore에서 스팟 상세 정보 가져오기
  useEffect(() => {
    let ignore = false;
    async function fetchSpotDetail() {
      if (!spot.spotId) {
        setSpotDetail(spot); // spotId가 없으면 기본 정보만 사용
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      try {
        const docSnap = await getDoc(doc(db, 'spots', spot.spotId));
        if (!ignore) {
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Firestore 데이터를 Spot 타입으로 안전하게 변환
            const spotData: Spot = {
              spotId: docSnap.id,
              spotName: data.spotName || spot.spotName,
              spotImage: data.spotImage || spot.spotImage,
              imageUrls: data.imageUrls,
              extraImages: data.extraImages,
              coordinates: data.coordinates || spot.coordinates,
              description: data.description,
              region: data.region,
              country: data.country,
              tags: data.tags,
              mapUrl: data.mapUrl,
              price: data.price,
              duration: data.duration,
            };
            setSpotDetail(spotData);
          } else {
            setSpotDetail(spot); // Firestore에 없으면 기본 정보 사용
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error('Error fetching spot detail:', err);
          setSpotDetail(spot); // 에러 시 기본 정보 사용
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchSpotDetail();
    return () => { ignore = true; };
  }, [spot]);



  // 순차적 이미지 프리로드
  const preloadImagesSequentially = useCallback(async (imgs: string[]) => {
    const newLoadingStates: { [key: string]: boolean } = {};
    imgs.forEach(src => { newLoadingStates[src] = true; });
    setImageLoadingStates(newLoadingStates);
    setLoadedImages(new Set());

    for (let i = 0; i < imgs.length; i++) {
      const src = imgs[i];
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

  // 모달이 열릴 때 이미지 인덱스 초기화 및 순차적 이미지 프리로드
  useEffect(() => {
    if (spotDetail || spot) {
      setCurrentImageIndex(0);
      const allImages = getAllImages(spotDetail || spot);
      if (allImages.length > 0) {
        preloadImagesSequentially(allImages);
      }
    }
  }, [spotDetail, spot, getAllImages, preloadImagesSequentially]);

  const nextImage = () => {
    const allImages = getAllImages(spotDetail || spot);
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };
  const prevImage = () => {
    const allImages = getAllImages(spotDetail || spot);
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };
  const goToImage = (idx: number) => setCurrentImageIndex(idx);

  const handleTouchStart = (e: React.TouchEvent) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
  const handleTouchMove = (e: React.TouchEvent) => { setTouchEnd(e.targetTouches[0].clientX); };
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) nextImage();
    if (distance < -50) prevImage();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] p-0 relative flex flex-col overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          className="absolute top-3 right-3 text-white bg-black/60 hover:bg-black/80 rounded-full w-10 h-10 flex items-center justify-center text-3xl font-bold shadow-lg z-10 border-2 border-white"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        {/* 이미지 슬라이더 */}
        <div
          className="w-full bg-gray-100 flex items-center justify-center relative p-0 rounded-t-2xl overflow-hidden"
          style={{ height: '400px' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {(() => {
            const allImages = getAllImages(spotDetail || spot);
            if (allImages.length === 0) {
              return (
                <div className="h-full w-full flex items-center justify-center text-4xl text-gray-300">🖼️</div>
              );
            }
            
            return (
              <>
                {/* 메인 이미지 */}
                <div className="relative w-full h-full">
                  {imageLoadingStates[allImages[currentImageIndex]] ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                        <span className="text-sm text-gray-600">이미지 로딩 중...</span>
                      </div>
                    </div>
                  ) : (
                    <Image
                      src={allImages[currentImageIndex]}
                      alt={`Image ${currentImageIndex + 1}`}
                      fill
                      className="object-cover transition-opacity duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                      priority
                    />
                  )}
                </div>
                
                {/* 좌우 화살표 (이미지가 2개 이상일 때만) */}
                {allImages.length > 1 && (
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
                {allImages.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {allImages.map((imageSrc, index) => (
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
                {allImages.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
                    {currentImageIndex + 1} / {allImages.length}
                    {Object.values(imageLoadingStates).some(loading => loading) && (
                      <div className="mt-1 text-xs">
                        로딩: {loadedImages.size} / {allImages.length}
                      </div>
                    )}
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* 로딩/에러 처리 */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <span className="text-lg text-gray-600">스팟 정보를 불러오는 중...</span>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
            <span className="text-lg text-red-600">{error}</span>
          </div>
        ) : (
        <>
        {/* 상세 정보 */}
        <div className="p-6 flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 400px)' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-bold">{safeLang((spotDetail || spot).spotName, lang)}</span>
            <span className="text-base text-gray-500 ml-2">
              {(spotDetail || spot).region ? safeLang((spotDetail || spot).region!, lang) : '-'}
              {(spotDetail || spot).country ? ` · ${safeLang((spotDetail || spot).country!, lang)}` : ''}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {Array.isArray((spotDetail || spot).tags) && (spotDetail || spot).tags!.length > 0
              ? (spotDetail || spot).tags!.map((t, idx) => (
                  <span key={idx} className="inline-block bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-xs font-semibold">
                    {typeof t === 'object' ? t[lang] : t}
                  </span>
                ))
              : null}
          </div>
          {/* 설명 */}
          <div className="text-gray-700 text-base whitespace-pre-line mb-2">
            <span className="font-semibold">{lang === 'ko' ? '설명' : 'Description'}: </span>
            {(spotDetail || spot).description ? safeLang((spotDetail || spot).description!, lang) : (lang === 'ko' ? '상세 정보를 확인하려면 스팟을 클릭하세요.' : 'Click on the spot to see detailed information.')}
          </div>
          {/* 지도 보기 버튼 */}
          {(spotDetail || spot).mapUrl && (
            <a
              href={(spotDetail || spot).mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mb-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold hover:bg-blue-200 transition"
            >
              {lang === 'ko' ? '지도에서 위치 보기' : 'View on Map'}
            </a>
          )}

          
          {(spotDetail || spot).duration && (
            <div className="mb-3">
              <span className="font-semibold text-sm">{lang === 'ko' ? '소요시간' : 'Duration'}: </span>
              <span className="text-sm">
                {typeof (spotDetail || spot).duration === 'object' ? safeLang((spotDetail || spot).duration!, lang) : (spotDetail || spot).duration as string}
              </span>
            </div>
          )}
          
          {/* 별점 영역 */}
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
          
          {/* 댓글 영역 */}
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
        </>
        )}
      </motion.div>
    </motion.div>
  );
}

// 일차별 색상 정의
const DAY_COLORS = [
  '#4285F4', // 1일차 - 파란색
  '#34A853', // 2일차 - 초록색
  '#FBBC04', // 3일차 - 노란색
  '#EA4335', // 4일차 - 빨간색
  '#FF6B35', // 5일차 - 주황색
  '#8E63CE', // 6일차 - 보라색
  '#00BCD4', // 7일차 - 청록색
  '#FF5722', // 8일차 - 주황빨강
];

// 전체 일정 지도 모달 컴포넌트
function FullScheduleMapModal({ 
  schedule, 
  spotsWithCoordinates, 
  onClose, 
  lang 
}: { 
  schedule: Product['schedule']; 
  spotsWithCoordinates: { [day: number]: Spot[] }; 
  onClose: () => void; 
  lang: 'ko' | 'en' 
}) {
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  // 초기화: 모든 일차 선택
  useEffect(() => {
    if (schedule) {
      setSelectedDays(new Set(schedule.map(day => day.day)));
    }
  }, [schedule]);

  // Google Maps API 로드
  useEffect(() => {
    const loadAPI = async () => {
      try {
        await loadGoogleMapsAPI();
        setIsGoogleMapsLoaded(true);
      } catch (error) {
        console.error('Failed to load Google Maps API:', error);
      }
    };
    loadAPI();
  }, []);

  // 지도 초기화 및 필터링된 일차 마커 표시
  useEffect(() => {
    if (!isGoogleMapsLoaded || !mapRef.current || !schedule) return;

    // 기존 마커와 경로 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    polylinesRef.current.forEach(polyline => polyline.setMap(null));

    // 지도 생성
    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 10,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
    });

    mapInstance.current = map;

    const bounds = new window.google.maps.LatLngBounds();
    const allMarkers: google.maps.Marker[] = [];
    const allPolylines: google.maps.Polyline[] = [];

    // 선택된 일차만 마커와 경로 생성
    schedule.forEach((daySchedule, dayIndex) => {
      // 선택되지 않은 일차는 건너뛰기
      if (!selectedDays.has(daySchedule.day)) return;

      const daySpots = spotsWithCoordinates[daySchedule.day] || [];
      const validSpots = daySpots.filter(spot => spot.coordinates);
      
      if (validSpots.length === 0) return;

      const dayColor = DAY_COLORS[dayIndex % DAY_COLORS.length];
      const path: google.maps.LatLng[] = [];

      // 해당 일차의 마커들 생성
      validSpots.forEach((spot, spotIndex) => {
        if (!spot.coordinates) return;

        const position = new window.google.maps.LatLng(
          spot.coordinates.lat,
          spot.coordinates.lng
        );

        // 마커 생성 (일차별 색상 적용, 번호 + 스팟 이름)
        const marker = new window.google.maps.Marker({
          position,
          map,
          title: `${daySchedule.day}${lang === 'ko' ? '일차' : ' Day'} - ${safeLang(spot.spotName, lang)}`,
          label: {
            text: `${daySchedule.day}. ${safeLang(spot.spotName, lang)}`,
            color: '#000000',
            fontWeight: 'bold',
            fontSize: '11px'
          },
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: dayColor,
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          }
        });

        // 정보창 생성
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="margin: 0 0 4px 0; font-weight: bold; color: ${dayColor};">${daySchedule.day}${lang === 'ko' ? '일차' : ' Day'}</h3>
              <h4 style="margin: 0 0 4px 0; font-weight: bold;">${safeLang(spot.spotName, lang)}</h4>
              <p style="margin: 0; color: #666;">${spotIndex + 1}${lang === 'ko' ? '번째 방문지' : 'th visit'}</p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        allMarkers.push(marker);
        path.push(position);
        bounds.extend(position);
      });

      // 해당 일차의 경로 선 그리기
      if (path.length > 1) {
        const polyline = new window.google.maps.Polyline({
          path,
          geodesic: true,
          strokeColor: dayColor,
          strokeOpacity: 0.8,
          strokeWeight: 4,
        });

        polyline.setMap(map);
        allPolylines.push(polyline);
      }
    });

    markersRef.current = allMarkers;
    polylinesRef.current = allPolylines;

    // 지도 범위 조정
    if (allMarkers.length > 0) {
      map.fitBounds(bounds);
      if (selectedDays.size === 1) {
        map.setZoom(12);
      }
    }

    // 클린업 함수
    return () => {
      allMarkers.forEach(marker => marker.setMap(null));
      allPolylines.forEach(polyline => polyline.setMap(null));
    };
  }, [isGoogleMapsLoaded, schedule, spotsWithCoordinates, lang, selectedDays]);

  // 일차 토글 함수
  const toggleDay = (day: number) => {
    setSelectedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(day)) {
        newSet.delete(day);
      } else {
        newSet.add(day);
      }
      return newSet;
    });
  };

  // 모든 일차 선택/해제 함수
  const toggleAllDays = () => {
    if (selectedDays.size === schedule?.length) {
      setSelectedDays(new Set());
    } else {
      setSelectedDays(new Set(schedule?.map(day => day.day) || []));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">
            {lang === 'ko' ? '전체 일정 지도보기' : 'Full Schedule Map'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        {/* 필터 섹션 - 모바일 대응 */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 mr-2">
              {lang === 'ko' ? '일차별 구분:' : 'Day Filter:'}
            </span>
            <button
              onClick={toggleAllDays}
              className={`px-3 py-1 text-xs rounded-full border ${
                selectedDays.size === schedule?.length
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {lang === 'ko' ? '전체' : 'All'}
            </button>
            {schedule?.map((daySchedule, index) => {
              const dayColor = DAY_COLORS[index % DAY_COLORS.length];
              const daySpots = spotsWithCoordinates[daySchedule.day] || [];
              const validSpots = daySpots.filter(spot => spot.coordinates);
              const isSelected = selectedDays.has(daySchedule.day);
              
              return (
                <button
                  key={daySchedule.day}
                  onClick={() => toggleDay(daySchedule.day)}
                  className={`px-3 py-1 text-xs rounded-full border flex items-center gap-1 ${
                    isSelected
                      ? 'text-white border-transparent'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                  style={{
                    backgroundColor: isSelected ? dayColor : undefined,
                    borderColor: isSelected ? dayColor : undefined
                  }}
                >
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: isSelected ? 'white' : dayColor }}
                  ></div>
                  {daySchedule.day}{lang === 'ko' ? '일차' : 'D'} ({validSpots.length})
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="flex-1 p-4">
          {!isGoogleMapsLoaded ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p>{TEXTS[lang].loading}</p>
              </div>
            </div>
          ) : (
            <div ref={mapRef} className="w-full h-full rounded-lg" />
          )}
        </div>
      </div>
    </div>
  );
}

export default function TourDetailPage() {
  const params = useParams();
  const { lang } = useLanguage();
  const texts = TEXTS[lang];
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(1);
  const [includedItems, setIncludedItems] = useState<string[]>([]);
  const [notIncludedItems, setNotIncludedItems] = useState<string[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false); // 지도 모달 상태
  const [isFullMapModalOpen, setIsFullMapModalOpen] = useState(false); // 전체 지도 모달 상태
  const [spotsWithCoordinates, setSpotsWithCoordinates] = useState<{ [day: number]: Spot[] }>({});

  // 스팟 좌표 데이터 가져오기
  const fetchSpotsWithCoordinates = async (schedule: Product['schedule']) => {
    if (!schedule) return;

    const spotsData: { [day: number]: Spot[] } = {};

    for (const daySchedule of schedule) {
      const spotsWithCoords: Spot[] = [];
      
      for (const spot of daySchedule.spots) {
        try {
          const spotDoc = await getDoc(doc(db, 'spots', spot.spotId));
          if (spotDoc.exists()) {
            const spotData = spotDoc.data();
            spotsWithCoords.push({
              ...spot,
              coordinates: spotData.coordinates || undefined,
            });
          } else {
            spotsWithCoords.push(spot);
          }
        } catch (error) {
          console.error(`Failed to fetch spot ${spot.spotId}:`, error);
          spotsWithCoords.push(spot);
        }
      }
      
      spotsData[daySchedule.day] = spotsWithCoords;
    }

    setSpotsWithCoordinates(spotsData);
  };

  // 포함/불포함 항목 다국어 정보 불러오기
  useEffect(() => {
    const fetchIncludeNotInclude = async () => {
      if (!product) return;
      // 포함사항
      if (product.includedItems && product.includedItems.length > 0) {
        const promises = product.includedItems.map(async (id) => {
          const docSnap = await getDoc(doc(db, 'includeItems', id));
          if (docSnap.exists()) {
            const data = docSnap.data();
            return data[lang] || data.ko || id;
          }
          return id;
        });
        setIncludedItems(await Promise.all(promises));
      } else {
        setIncludedItems([]);
      }
      // 불포함사항
      if (product.notIncludedItems && product.notIncludedItems.length > 0) {
        const promises = product.notIncludedItems.map(async (id) => {
          const docSnap = await getDoc(doc(db, 'notIncludeItems', id));
          if (docSnap.exists()) {
            const data = docSnap.data();
            return data[lang] || data.ko || id;
          }
          return id;
        });
        setNotIncludedItems(await Promise.all(promises));
      } else {
        setNotIncludedItems([]);
      }
    };
    fetchIncludeNotInclude();
  }, [product, lang]);

  // 투어 데이터 불러오기
  useEffect(() => {
    const fetchData = async () => {
      if (!params.id) return;
      
      try {
        setLoading(true);
        const docSnap = await getDoc(doc(db, 'products', params.id as string));
        
        if (docSnap.exists()) {
          const data = docSnap.data() as Product;
          setProduct({ ...data, id: docSnap.id });
          
          // 스팟 좌표 데이터 가져오기
          if (data.schedule) {
            await fetchSpotsWithCoordinates(data.schedule);
          }
        } else {
          console.error('Product not found');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  if (loading) {
    console.log("[Render] 로딩중");
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="pt-32 text-center">{texts.loading}</div>
      </div>
    );
  }

  if (!product) {
    console.log("[Render] 상품 없음");
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="pt-32 text-center">{texts.notFound}</div>
      </div>
    );
  }

  console.log("[Render] 상품 상세페이지", product);

  // 상품기본정보 스타일 개선
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="bg-gray-50 flex flex-col items-center pt-28 px-4">
        {/* Breadcrumbs */}
        <nav className="mb-6 w-full max-w-4xl text-sm text-gray-500 flex gap-2 items-center">
          <Link href="/" className="hover:underline">Home</Link>
          <span>&gt;</span>
          <Link href="/tours" className="hover:underline">Tours</Link>
          <span>&gt;</span>
          <span className="text-gray-700 font-semibold">{safeLang(product.title, lang)}</span>
        </nav>

        <motion.section
          className="bg-white rounded-xl shadow p-6 w-full max-w-4xl flex flex-col gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Product Header */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold mb-2">{safeLang(product.title, lang)}</h1>
          </div>

          {/* Product Image (A4 비율) */}
          {product.imageUrls && product.imageUrls.length > 0 ? (
            <div className="relative w-full" style={{ aspectRatio: '1 / 1.414', maxWidth: '100%' }}>
              <Image
                src={product.imageUrls[0]}
                alt={safeLang(product.title, lang)}
                fill
                className="object-cover rounded-lg"
                priority
              />
            </div>
          ) : (
            <div className="relative h-[calc(100vw/1.414)] max-h-[600px] rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">이미지 없음</span>
            </div>
          )}

          {/* 상품기본정보 영역 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:[grid-template-columns:0.8fr_1.4fr_0.8fr] gap-4 mb-6 text-center">
            <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center justify-center">
              <h3 className="font-semibold text-gray-700 mb-1">{texts.price}</h3>
              <p className="text-lg">{getPHPPrice(product.price)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center justify-center min-w-[160px] break-keep">
              <h3 className="font-semibold text-gray-700 mb-1">{texts.period}</h3>
              <div className="text-center">
                {product.duration?.startDate && product.duration?.endDate && (
                  <p className="text-lg font-medium">
                    {product.duration.startDate} ~ {product.duration.endDate}
                  </p>
                )}
                {product.nights && product.days && (
                  <p className="text-sm text-gray-500 mt-1">
                    {getNightsDaysText(product.nights, product.days, lang)}
                  </p>
                )}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center justify-center">
              <h3 className="font-semibold text-gray-700 mb-1">{texts.region}</h3>
              <p className="text-lg">{safeLang(product.region, lang) || '-'}</p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-3">상품 설명</h2>
            <p className="text-gray-700 leading-relaxed">{safeLang(product.description, lang)}</p>
          </div>

          {/* Highlights */}
          {product.highlights && product.highlights.length > 0 && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-3">{texts.highlights}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {product.highlights.map((highlight, index) => {
                  // 해당 spot 정보 찾기 (일정에서)
                  const allSpots = product.schedule?.flatMap(day => day.spots) || [];
                  const spot = allSpots.find(s => s.spotId === highlight.spotId);
                  if (!spot) return null;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 cursor-pointer hover:underline"
                      onClick={() => setSelectedSpot(spot)}
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>{safeLang(highlight.spotName, lang)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Schedule */}
          {product.schedule && product.schedule.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{texts.schedule}</h2>
                {/* 전체 일정 지도보기 버튼 */}
                <button
                  onClick={() => setIsFullMapModalOpen(true)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                >
                  🗺️ {lang === 'ko' ? '전체 일정 지도보기' : 'Full Schedule Map'}
                </button>
              </div>
              {/* Day Tabs */}
              <div className="flex gap-2 mb-4 overflow-x-auto">
                {product.schedule.map((day) => (
                  <button
                    key={day.day}
                    onClick={() => setActiveDay(day.day)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeDay === day.day
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {texts.day} {day.day}
                  </button>
                ))}
              </div>

              {/* Day Content */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">
                    {texts.day} {activeDay}
                  </h3>
                  {/* 지도보기 버튼 */}
                  <button
                    onClick={() => setIsMapModalOpen(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    🗺️ {texts.viewMap}
                  </button>
                </div>
                <div className="space-y-3">
                  {product.schedule
                    .find(d => d.day === activeDay)
                    ?.spots.map((spot, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-blue-50"
                        onClick={() => setSelectedSpot(spot)}
                      >
                        {spot.spotImage && (
                          <Image 
                            src={spot.spotImage} 
                            alt={safeLang(spot.spotName, lang)} 
                            width={40} 
                            height={40} 
                            style={{ width: 40, height: 40, objectFit: 'cover' }} 
                          />
                        )}
                        <span>{safeLang(spot.spotName, lang)}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Included/Not Included Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {includedItems.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-3">{texts.includedItems}</h2>
                <div className="space-y-2">
                  {includedItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {notIncludedItems.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-3">{texts.notIncludedItems}</h2>
                <div className="space-y-2">
                  {notIncludedItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.section>
        {/* 항공편 조합 정보 */}
        {product.flightCombos && product.flightCombos.length > 0 && (
          <section className="w-full max-w-4xl mt-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">{lang === 'ko' ? '항공편 정보' : 'Flight Information'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {product.flightCombos.map((combo, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow p-5 flex flex-col gap-3 border border-blue-100">
                  {/* 출발편 */}
                  <div className="flex flex-row flex-wrap items-center gap-x-4 gap-y-1 text-base whitespace-nowrap">
                    <span className="font-bold text-blue-700 min-w-[80px]">{combo.departure.airline[lang]} {combo.departure.flightNumber}</span>
                    <span className="text-gray-500">{combo.departure.from} → {combo.departure.to}</span>
                    <span className="text-gray-400 text-sm">{combo.departure.departTime.replace('T', ' ')} ~ {combo.departure.arriveTime.replace('T', ' ')}</span>
                  </div>
                  {/* 리턴편 */}
                  <div className="flex flex-row flex-wrap items-center gap-x-4 gap-y-1 text-base whitespace-nowrap">
                    <span className="font-bold text-blue-700 min-w-[80px]">{combo.return.airline[lang]} {combo.return.flightNumber}</span>
                    <span className="text-gray-500">{combo.return.from} → {combo.return.to}</span>
                    <span className="text-gray-400 text-sm">{combo.return.departTime.replace('T', ' ')} ~ {combo.return.arriveTime.replace('T', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        <AnimatePresence>
          {selectedSpot && (
            <SpotDetailModal
              spot={selectedSpot}
              onClose={() => setSelectedSpot(null)}
              lang={lang}
            />
          )}
          {isMapModalOpen && (
            <DayMapModal
              day={activeDay}
              spots={spotsWithCoordinates[activeDay] || []}
              onClose={() => setIsMapModalOpen(false)}
              lang={lang}
            />
          )}
          {isFullMapModalOpen && (
            <FullScheduleMapModal
              schedule={product.schedule}
              spotsWithCoordinates={spotsWithCoordinates}
              onClose={() => setIsFullMapModalOpen(false)}
              lang={lang}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
} 