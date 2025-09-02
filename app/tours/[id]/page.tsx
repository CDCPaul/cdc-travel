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
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation as SwiperNavigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { incrementSpotClick, incrementTourClick } from "@/lib/analytics";
import { PageLoading } from "@/components/ui/LoadingSpinner";

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
  countries?: Array<{ en: string; ko: string; code: string }>; // 다중 국가 선택 지원
  imageUrls?: string[];
  schedule?: Array<{
    day: number;
    spots: Array<{
      spotId: string;
      spotName: { ko: string; en: string };
      spotImage?: string;
    }>;
  }>;
  includedItems?: string[];
  notIncludedItems?: string[];
  // 상품 상세 설명 필드 추가
  detailedDescription?: { ko: string; en: string };
  detailImages?: string[]; // 상품 상세 설명용 이미지들
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
  // 아이콘 정보 섹션 추가
  iconInfo?: {
    tripDuration?: { ko: string; en: string }; // 여행기간 (예: "5박7일")
    airline?: { ko: string; en: string }; // 항공사 정보 (예: "티웨이 항공 직항")
    groupSize?: { ko: string; en: string }; // 그룹 규모 (예: "소형 3인")
    guideFee?: string; // 가이드비 (예: "$70")
    selectInfo?: { ko: string; en: string }; // 선택 정보 (예: "선택관광 있음")
  };

  // 새로운 예약 시스템 필드들 추가
  visitingCities?: {
    ko: string[];  // ["남부 시드니", "시드니", "블루 마운틴"]
    en: string[];  // ["Southern Sydney", "Sydney", "Blue Mountains"]
  };

  bookingStatus?: {
    currentBookings: number;     // 현재 예약인원 (14명)
    availableSeats: number;      // 여유좌석 (0명)
    minimumPax: number;          // 최소 출발인원 (6명)
    maxCapacity: number;         // 최대 수용인원
  };

  departureOptions?: Array<{
    departureDate: string;     // 출발일 "2025-09-03"
    returnDate: string;        // 도착일/종료일 "2025-09-07"
  }>;

  detailedPricing?: {
    adult: {
      age: string;           // "만 12세 이상"
      priceKRW: number;      // 1250800
      pricePHP?: number;     // PHP 가격
      priceUSD?: number;     // USD 가격
    };
    childExtraBed: {
      age: string;           // "만 12세 미만"
      priceKRW: number;      // 1250800
      pricePHP?: number;
      priceUSD?: number;
    };
    childNoBed: {
      age: string;           // "만 12세 미만"  
      priceKRW: number;      // 1250800
      pricePHP?: number;
      priceUSD?: number;
    };
    infant: {
      age: string;           // "만 2세 미만"
      priceKRW: number;      // 300000
      pricePHP?: number;
      priceUSD?: number;
    };
  };

  additionalInfo?: {
    fuelSurcharge: {
      ko: string;          // "유류할증료 127,600원 포함"
      en: string;          // "Fuel surcharge 127,600 KRW included"
    };
    taxes: {
      ko: string;          // "제세공과금 0원 포함"  
      en: string;          // "Taxes 0 KRW included"
    };
  };

  localExpenses?: {
    adult: number;         // 성인 현지 필수 경비 (USD)
    child: number;         // 아동 현지 필수 경비 (USD)  
  };
}

const TEXTS = {
  ko: {
    loading: "로딩 중...",
    notFound: "투어 상품을 찾을 수 없습니다.",
    backToTours: "← 투어 목록으로",
    duration: "기간",
    region: "지역",
    schedule: "일정",
    day: "일차",
    productDetails: "상품 상세 정보",
    showFullSchedule: "전체 일정 보기",
    hideSchedule: "일정 접기",
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
    schedule: "Schedule",
    day: "Day",
    productDetails: "Product Details",
    showFullSchedule: "Show Full Schedule",
    hideSchedule: "Hide Schedule",
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
                      onError={() => {
                        console.log('Main image load error:', allImages[currentImageIndex]);
                      }}
                      unoptimized
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
  
  // 전체 내용 확장/축소 상태 (스케줄 + 상품상세 + 이미지 등 모든 것)
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(false);
  
  // 스크롤 네비게이션을 위한 상태와 ref
  const [currentActiveDay, setCurrentActiveDay] = useState<number>(1);
  const [navHeight, setNavHeight] = useState<number>(84);
  
  // 스마트 리모콘을 위한 상태
  const [remotePosition, setRemotePosition] = useState({ top: 100, show: true });
  
  // 여행기간 선택을 위한 상태
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDepartureOption, setSelectedDepartureOption] = useState<number>(0);
  
  // 예약 인터페이스 상태
  const [bookingCounts, setBookingCounts] = useState({
    adult: 1,
    childExtraBed: 0,
    childNoBed: 0,
    infant: 0
  });
  
  // 개별 가격 (PHP 기준)
  const prices = {
    adult: product?.detailedPricing?.adult?.pricePHP || 29888,
    childExtraBed: product?.detailedPricing?.childExtraBed?.pricePHP || 29888,
    childNoBed: product?.detailedPricing?.childNoBed?.pricePHP || 26888,
    infant: product?.detailedPricing?.infant?.pricePHP || 5100
  };
  
  // 총액 계산
  const totalAmount = (bookingCounts.adult * prices.adult) + 
                      (bookingCounts.childExtraBed * prices.childExtraBed) + 
                      (bookingCounts.childNoBed * prices.childNoBed) + 
                      (bookingCounts.infant * prices.infant);
  
  // 인원 수 조정 함수
  const updateCount = (type: 'adult' | 'childExtraBed' | 'childNoBed' | 'infant', increment: boolean) => {
    setBookingCounts(prev => ({
      ...prev,
      [type]: increment 
        ? prev[type] + 1 
        : Math.max(0, prev[type] - 1)
    }));
  };
  

  const currentActiveDayRef = useRef<number>(1);
  const scheduleContainerRef = useRef<HTMLDivElement>(null);
  const scheduleTabsRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

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

  // 네비게이션바 높이 측정
  useEffect(() => {
    const measureNavHeight = () => {
      const navElement = document.querySelector('nav[class*="fixed"]') as HTMLElement;
      if (navElement) {
        const height = navElement.offsetHeight;
        console.log('Navigation height measured:', height);
        setNavHeight(height);
      }
    };
    
    measureNavHeight();
    window.addEventListener('resize', measureNavHeight);
    
    return () => window.removeEventListener('resize', measureNavHeight);
  }, []);

  // currentActiveDay와 ref 동기화
  useEffect(() => {
    currentActiveDayRef.current = currentActiveDay;
  }, [currentActiveDay]);

  // 스크롤 네비게이션 유틸리티 함수들
  const scrollToDay = useCallback((dayNumber: number) => {
    const dayElement = dayRefs.current[dayNumber];
    if (dayElement) {
      const elementTop = dayElement.offsetTop;
      const tabsHeight = scheduleTabsRef.current?.offsetHeight || 60;
      
      // 동적 네비게이션바 높이 + 스티키 탭 높이 + 여유공간(20px)
      const targetScrollTop = elementTop - navHeight - tabsHeight - 20;
      
      console.log('Scroll to day:', dayNumber, 'elementTop:', elementTop, 'navHeight:', navHeight, 'targetScrollTop:', targetScrollTop);
      
      window.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth'
      });
    }
  }, [navHeight]);

  // 스크롤 기반 활성 날짜 감지 - 더 간단하고 확실한 방식
  useEffect(() => {
    if (!product?.schedule || product.schedule.length === 0) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + navHeight + 100; // 네비게이션바 + 여유공간
      
      let activeDay = 1; // 기본값
      let minDistance = Infinity;
      
      // 각 DAY 요소의 위치를 확인하여 가장 가까운 요소 찾기
      Object.entries(dayRefs.current).forEach(([dayStr, dayElement]) => {
        if (dayElement) {
          const dayNum = parseInt(dayStr);
          const elementTop = dayElement.offsetTop;
          const distance = Math.abs(elementTop - scrollPosition);
          
          console.log(`📍 Day ${dayNum}: elementTop=${elementTop}, scrollPos=${scrollPosition}, distance=${distance}`);
          
          if (distance < minDistance) {
            minDistance = distance;
            activeDay = dayNum;
          }
        }
      });
      
      if (activeDay !== currentActiveDayRef.current) {
        console.log(`✅ Active day changed from ${currentActiveDayRef.current} to ${activeDay}`);
        currentActiveDayRef.current = activeDay;
        setCurrentActiveDay(activeDay);
      }
      
      // 스마트 리모콘 위치 계산
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // 상단 기본 위치에서 시작하여 스크롤에 따라 이동
      const baseTop = 100; // 기본 상단 위치
      const maxScroll = documentHeight - viewportHeight;
      const scrollPercent = maxScroll > 0 ? scrollY / maxScroll : 0;
      
      // 스크롤에 따라 위치 조정 (최대 200px까지 아래로)
      const calculatedTop = baseTop + (scrollPercent * 200);
      const shouldShow = scrollY > 50; // 50px 스크롤 후 표시
      
      setRemotePosition({ 
        top: Math.min(calculatedTop, viewportHeight - 400), // 화면 하단에서 400px 여백
        show: shouldShow 
      });

    };

    // 스크롤 이벤트 리스너 등록
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // 초기 실행
    setTimeout(handleScroll, 500); // DOM 렌더링 후 실행
    
    console.log(`🎯 Scroll-based day detection setup complete. NavHeight: ${navHeight}px`);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [product?.schedule, navHeight]);



  // 투어 데이터 불러오기
  useEffect(() => {
    const fetchData = async () => {
      if (!params.id) return;
      
      try {
        setLoading(true);
        const docSnap = await getDoc(doc(db, 'products', params.id as string));
        
        if (docSnap.exists()) {
          const data = docSnap.data() as Product;
          
          // 테스트용 임시 데이터 추가 (실제로는 Firestore에서 가져와야 함)
          const productWithTestData = {
            ...data,
            id: docSnap.id,
            // 아이콘 정보 테스트 데이터
            iconInfo: data.iconInfo || {
              tripDuration: { ko: '3박4일', en: '3N4D' },
              airline: { ko: '티웨이 항공 직항', en: 'Tway Direct Flight' },
              groupSize: { ko: '소형 4인', en: 'Small Group 4pax' },
              guideFee: '$80',
              selectInfo: { ko: '선택관광 있음', en: 'Optional Tour Available' }
            },
            detailedDescription: {
              ko: `🌟 특별한 부산 여행을 위한 완벽한 가이드 🌟

이 투어는 부산의 숨겨진 매력과 대표 명소들을 모두 경험할 수 있도록 특별히 구성되었습니다.

✈️ 편안한 여행
- 항공료, 숙박비, 가이드비 모두 포함된 올인클루시브 패키지
- 전문 가이드가 함께하는 안전하고 알찬 여행
- 현지 맛집과 핫플레이스 완전 정복

🏨 프리미엄 숙박
- 부산 중심가 4성급 호텔 숙박
- 해운대 오션뷰 또는 시티뷰 객실
- 조식 포함으로 편리한 아침 시간

🍱 현지 미식 체험  
- 부산 3대 맛집 투어 포함
- 신선한 해산물과 전통 한식
- 현지인만 아는 숨겨진 맛집 방문

📸 인스타 핫플레이스
- 감천문화마을 포토존
- 해운대 블루라인파크
- 송도 스카이워크 등 SNS 필수 스팟`,
              en: `🌟 Perfect Guide for Special Busan Travel 🌟

This tour is specially designed to experience both hidden charms and representative attractions of Busan.

✈️ Comfortable Travel
- All-inclusive package including airfare, accommodation, and guide fees
- Safe and fulfilling travel with professional guides
- Complete conquest of local restaurants and hot places

🏨 Premium Accommodation  
- 4-star hotel accommodation in downtown Busan
- Haeundae ocean view or city view rooms
- Breakfast included for convenient morning time

🍱 Local Culinary Experience
- Busan's top 3 restaurant tour included
- Fresh seafood and traditional Korean cuisine
- Visit to hidden restaurants known only to locals

📸 Instagram Hot Places
- Gamcheon Culture Village photo zones
- Haeundae Blue Line Park  
- Songdo Skywalk and other essential SNS spots`
            },
            detailImages: [
              'https://firebasestorage.googleapis.com/v0/b/cdc-home-fb4d1/o/products%2F1752477922810_SS_Busan_CDC.webp?alt=media&token=example1',
              'https://firebasestorage.googleapis.com/v0/b/cdc-home-fb4d1/o/spots%2F1750949554259_Gamcheon%20Culture%20Village_1.webp?alt=media&token=example2',
              'https://firebasestorage.googleapis.com/v0/b/cdc-home-fb4d1/o/spots%2F1750947152397_BIFF_1.webp?alt=media&token=example3'
            ]
          };
          
          setProduct(productWithTestData);
          
          // 투어 클릭수 증가
          try {
            await incrementTourClick(params.id as string);
          } catch (error) {
            console.error('Failed to increment tour click:', error);
          }
          
          // 스팟 좌표 데이터 가져오기
          if (data.schedule) {
            await fetchSpotsWithCoordinates(data.schedule);
            // 첫 번째 일차로 초기화
            const firstDay = data.schedule[0]?.day || 1;
            setCurrentActiveDay(firstDay);
            currentActiveDayRef.current = firstDay;
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
        <div className="pt-32 flex items-center justify-center">
          <PageLoading lang={lang} />
        </div>
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
      <main className="bg-gray-50 flex flex-col items-center pt-20 px-4">
        {/* Breadcrumbs */}
        <nav className="mb-6 w-full max-w-7xl text-sm text-gray-500 flex gap-2 items-center">
          <Link href="/" className="hover:underline">Home</Link>
          <span>&gt;</span>
          <Link href="/tours" className="hover:underline">Tours</Link>
          <span>&gt;</span>
          <span className="text-gray-700 font-semibold">{safeLang(product.title, lang)}</span>
        </nav>

        <motion.section
          className="bg-white rounded-xl shadow p-6 w-full max-w-7xl flex flex-col gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Product Header - 모데투어 스타일 좌우 분할 레이아웃 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* 왼쪽: 상품 이미지 */}
            <div className="order-2 lg:order-1">
          {product.imageUrls && product.imageUrls.length > 0 ? (
                <div className="relative w-full h-full min-h-[400px] lg:min-h-[500px]" style={{ aspectRatio: '4 / 3' }}>
              <Swiper
                modules={[SwiperNavigation, Pagination]}
                navigation={true}
                pagination={{ clickable: true }}
                loop={product.imageUrls.length > 1}
                    className="w-full h-full rounded-xl shadow-lg"
              >
                {product.imageUrls.map((imageUrl, index) => (
                  <SwiperSlide key={index}>
                        <div className="relative w-full h-full bg-gray-100 rounded-xl overflow-hidden">
                      <Image
                        src={imageUrl}
                        alt={`${safeLang(product.title, lang)} - 이미지 ${index + 1}`}
                        fill
                            className="object-cover"
                        priority={index === 0}
                        onError={(e) => {
                              console.log('Swiper image load error:', imageUrl);
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                            unoptimized
                      />
                      {/* Fallback 이미지 */}
                      <div className="swiper-fallback absolute inset-0 flex items-center justify-center bg-gray-200" 
                           style={{ display: 'none' }}>
                        <span className="text-gray-500 text-2xl">🖼️</span>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          ) : (
                <div className="relative w-full h-full min-h-[400px] lg:min-h-[500px] rounded-xl overflow-hidden bg-gray-200 flex items-center justify-center" style={{ aspectRatio: '4 / 3' }}>
              <span className="text-gray-500">이미지 없음</span>
            </div>
          )}
            </div>

            {/* 오른쪽: 상품 정보 */}
            <div className="order-1 lg:order-2 flex flex-col justify-start space-y-6">
              {/* 상품 제목 */}
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3 leading-tight">{safeLang(product.title, lang)}</h1>
                
                {/* 상품 태그 또는 카테고리 */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                    {safeLang(product.region, lang) || '여행상품'}
                  </span>
                  {product.nights && product.days && (
                    <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
                      {getNightsDaysText(product.nights, product.days, lang)}
                    </span>
                  )}
            </div>
              </div>

              {/* 가격 정보 - 강조 */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">{texts.price}</p>
                    <p className="text-2xl lg:text-3xl font-bold text-blue-600">{getPHPPrice(product.price)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">1인 기준</p>
                    <p className="text-xs text-gray-500">{texts.included}</p>
                  </div>
                </div>
              </div>

              {/* 여행 기간 및 지역 정보 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 flex flex-col">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                    📅 {texts.duration}
                  </h3>
                  {product.duration?.startDate && product.duration?.endDate ? (
                    <p className="text-base font-medium text-gray-900">
                    {product.duration.startDate} ~ {product.duration.endDate}
                  </p>
                  ) : (
                    <p className="text-base text-gray-500">날짜 미정</p>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4 flex flex-col">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                    📍 {texts.region}
                  </h3>
                  <p className="text-base font-medium text-gray-900">
                    {safeLang(product.region, lang) || '-'}
                  </p>
              </div>
            </div>

                                        {/* 아이콘 정보 섹션 - 모데투어 스타일 */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-4">여행 정보</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {/* 여행기간 */}
                <div className="flex flex-col items-center text-center p-2">
                  <div className="w-8 h-8 mb-1 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
            </div>
                  <span className="text-xs text-gray-500 font-medium mb-1">
                    {lang === 'ko' ? '여행기간' : 'Duration'}
                  </span>
                  <span className="text-xs text-gray-800 font-semibold leading-tight">
                    {product.departureOptions && product.departureOptions.length > 0 && product.departureOptions[selectedDepartureOption] && product.departureOptions[selectedDepartureOption].departureDate && product.departureOptions[selectedDepartureOption].returnDate
                      ? `${product.departureOptions[selectedDepartureOption].departureDate} ~ ${product.departureOptions[selectedDepartureOption].returnDate}`
                      : product.iconInfo?.tripDuration 
                        ? safeLang(product.iconInfo.tripDuration, lang) 
                        : `${product.nights}박${product.days}일`}
                  </span>
          </div>

                {/* 항공사 */}
                <div className="flex flex-col items-center text-center p-2">
                  <div className="w-8 h-8 mb-1 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                    </svg>
                  </div>
                  <span className="text-xs text-gray-500 font-medium mb-1">
                    {lang === 'ko' ? '항공사' : 'Airline'}
                  </span>
                  <span className="text-xs text-gray-800 font-semibold leading-tight">
                    {product.iconInfo?.airline ? safeLang(product.iconInfo.airline, lang) : lang === 'ko' ? '항공편 직항' : 'Direct Flight'}
                  </span>
          </div>

                {/* 그룹 규모 */}
                <div className="flex flex-col items-center text-center p-2">
                  <div className="w-8 h-8 mb-1 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m8-10a4 4 0 100-8 4 4 0 000 8zm8.5 2.5a4 4 0 100-8 4 4 0 000 8z" />
                    </svg>
                    </div>
                  <span className="text-xs text-gray-500 font-medium mb-1">
                    {lang === 'ko' ? '그룹규모' : 'Group Size'}
                  </span>
                  <span className="text-xs text-gray-800 font-semibold leading-tight">
                    {product.iconInfo?.groupSize ? safeLang(product.iconInfo.groupSize, lang) : lang === 'ko' ? '소형 그룹' : 'Small Group'}
                  </span>
              </div>

                {/* 가이드비 */}
                <div className="flex flex-col items-center text-center p-2">
                  <div className="w-8 h-8 mb-1 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
            </div>
                  <span className="text-xs text-gray-500 font-medium mb-1">
                    {lang === 'ko' ? '가이드비' : 'Guide Fee'}
                  </span>
                  <span className="text-xs text-gray-800 font-semibold leading-tight">
                    {product.iconInfo?.guideFee || (lang === 'ko' ? '가이드 경비' : 'Guide Fee')}
                  </span>
                </div>

                {/* 선택관광 */}
                <div className="flex flex-col items-center text-center p-2">
                  <div className="w-8 h-8 mb-1 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-500 font-medium mb-1">
                    {lang === 'ko' ? '선택관광' : 'Optional Tour'}
                  </span>
                  <span className="text-xs text-gray-800 font-semibold leading-tight">
                    {product.iconInfo?.selectInfo ? safeLang(product.iconInfo.selectInfo, lang) : lang === 'ko' ? '선택관광 있음' : 'Available'}
                  </span>
                </div>
              </div>
            </div>

            

              {/* 예약 관련 버튼들 (추후 추가 예정) */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  💌 {lang === 'ko' ? '문의하기' : 'Contact'}
                </button>
                <button className="flex-1 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-3 px-6 rounded-lg transition-all duration-300">
                  ❤️ {lang === 'ko' ? '찜하기' : 'Save'}
                </button>
              </div>
            </div>
          </div>



          {/* 하이라이트 기능 제거됨 */}

          {/* 여행 주요정보 섹션 */}
          <div className="mb-8 bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full"></div>
              <h2 className="text-2xl font-bold text-gray-800">
                {lang === 'ko' ? '여행 주요일정' : 'Trip Information'}
              </h2>
            </div>

            {/* 한 줄로 통합된 여행 정보 */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
                
                {/* 방문도시 */}
                {product.visitingCities && (
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🏙️</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700 text-sm">
                        {lang === 'ko' ? '방문도시:' : 'Cities:'}
                      </span>
                      <span className="text-gray-700 text-sm">
                        {product.visitingCities && typeof product.visitingCities === 'object' && product.visitingCities[lang] 
                          ? Array.isArray(product.visitingCities[lang]) 
                            ? product.visitingCities[lang].join(', ')
                            : product.visitingCities[lang]
                          : typeof product.visitingCities === 'string' 
                            ? product.visitingCities 
                            : '정보 없음'
                        }
                      </span>
                    </div>
                  </div>
                )}

                {/* 구분선 */}
                <div className="hidden lg:block w-px h-6 bg-gray-300"></div>

                {/* 선택된 여행기간 */}
                {product.departureOptions && product.departureOptions.length > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📅</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700 text-sm">
                        {lang === 'ko' ? '선택된 여행:' : 'Selected:'}
                      </span>
                      <span className="text-blue-600 font-medium text-sm">
                        {product.departureOptions[selectedDepartureOption] ? (
                          <>
                            {new Date(product.departureOptions[selectedDepartureOption].departureDate).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', {
                              month: 'short',
                              day: 'numeric', 
                              weekday: 'short'
                            })} ~ {new Date(product.departureOptions[selectedDepartureOption].returnDate).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', {
                              month: 'short',
                              day: 'numeric',
                              weekday: 'short'
                            })}
                          </>
                        ) : (
                          lang === 'ko' ? '기간 선택 필요' : 'Select period'
                        )}
                      </span>
                      <button 
                        onClick={() => setShowDateModal(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200"
                      >
                        {lang === 'ko' ? '변경' : 'Change'}
                      </button>
                    </div>
                  </div>
                )}

                {/* 구분선 */}
                <div className="hidden lg:block w-px h-6 bg-gray-300"></div>

                {/* 출발옵션 요약 */}
                {product.departureOptions && (
                  <div className="flex items-center gap-3">
                    <span className="text-xl">✈️</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700 text-sm">
                        {lang === 'ko' ? '출발옵션:' : 'Options:'}
                      </span>
                      <div className="flex items-center gap-2">
                        {product.departureOptions && Array.isArray(product.departureOptions) ? (
                          product.departureOptions.map((option, index) => (
                            <button 
                      key={index}
                              onClick={() => setSelectedDepartureOption(index)}
                              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors duration-200 cursor-pointer ${
                                selectedDepartureOption === index 
                                  ? 'bg-purple-500 text-white' 
                                  : 'bg-gray-200 text-gray-700 hover:bg-purple-100 hover:text-purple-600'
                              }`}
                            >
                              {lang === 'ko' ? `${index + 1}차` : `${index + 1}st`}
                            </button>
                          ))
                        ) : typeof product.departureOptions === 'string' ? (
                          <span className="text-gray-700 text-sm">{product.departureOptions}</span>
                        ) : (
                          <span className="text-gray-500 text-sm">{lang === 'ko' ? '정보 없음' : 'No info'}</span>
                        )}
                    </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* 상품가격 섹션 */}
          {product.detailedPricing && (
            <div className="mb-8 bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-yellow-500 to-orange-600 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {lang === 'ko' ? '상품가격' : 'Pricing Details'}
                </h2>
                    </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 성인 가격 */}
                {product.detailedPricing.adult && (
                    <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-lg p-4 border border-slate-200">
                      <h3 className="text-sm font-semibold text-gray-600 mb-3 text-center">
                        {lang === 'ko' ? '성인 가격' : 'Adult Price'}
                        <div className="text-xs text-gray-500 mt-1">
                          {lang === 'ko' ? '(만 12세 이상)' : '(12+ years)'}
                        </div>
                      </h3>
                      <div className="text-center">
                        {Number(product.detailedPricing.adult.priceKRW) > 0 && (
                          <span className="font-bold text-lg text-gray-800">
                            ₩{Number(product.detailedPricing.adult.priceKRW).toLocaleString()}
                          </span>
                        )}
                        {Number(product.detailedPricing.adult.pricePHP) > 0 && (
                          <span className="font-bold text-lg text-gray-800">
                            ₱{Number(product.detailedPricing.adult.pricePHP).toLocaleString()}
                          </span>
                        )}
                        {Number(product.detailedPricing.adult.priceUSD) > 0 && (
                          <span className="font-bold text-lg text-gray-800">
                            ${Number(product.detailedPricing.adult.priceUSD).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                )}

                {/* 아동 Extra Bed 가격 */}
                {product.detailedPricing.childExtraBed && (
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
                      <h3 className="text-sm font-semibold text-gray-600 mb-3 text-center">
                        {lang === 'ko' ? '아동 Extra Bed' : 'Child Extra Bed'}
                        <div className="text-xs text-gray-500 mt-1">
                          {lang === 'ko' ? '(만 2세 ~ 11세)' : '(2-11 years)'}
                        </div>
                      </h3>
                      <div className="text-center">
                        {Number(product.detailedPricing.childExtraBed.priceKRW) > 0 && (
                          <span className="font-bold text-lg text-gray-800">
                            ₩{Number(product.detailedPricing.childExtraBed.priceKRW).toLocaleString()}
                          </span>
                        )}
                        {Number(product.detailedPricing.childExtraBed.pricePHP) > 0 && (
                          <span className="font-bold text-lg text-gray-800">
                            ₱{Number(product.detailedPricing.childExtraBed.pricePHP).toLocaleString()}
                          </span>
                        )}
                        {Number(product.detailedPricing.childExtraBed.priceUSD) > 0 && (
                          <span className="font-bold text-lg text-gray-800">
                            ${Number(product.detailedPricing.childExtraBed.priceUSD).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                )}

                {/* 아동 No Bed 가격 */}
                {product.detailedPricing.childNoBed && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                      <h3 className="text-sm font-semibold text-gray-600 mb-3 text-center">
                        {lang === 'ko' ? '아동 No Bed' : 'Child No Bed'}
                        <div className="text-xs text-gray-500 mt-1">
                          {lang === 'ko' ? '(만 2세 ~ 11세)' : '(2-11 years)'}
                        </div>
                      </h3>
                      <div className="text-center">
                        {Number(product.detailedPricing.childNoBed.priceKRW) > 0 && (
                          <span className="font-bold text-lg text-gray-800">
                            ₩{Number(product.detailedPricing.childNoBed.priceKRW).toLocaleString()}
                          </span>
                        )}
                        {Number(product.detailedPricing.childNoBed.pricePHP) > 0 && (
                          <span className="font-bold text-lg text-gray-800">
                            ₱{Number(product.detailedPricing.childNoBed.pricePHP).toLocaleString()}
                          </span>
                        )}
                        {Number(product.detailedPricing.childNoBed.priceUSD) > 0 && (
                          <span className="font-bold text-lg text-gray-800">
                            ${Number(product.detailedPricing.childNoBed.priceUSD).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                )}

                {/* 유아 가격 */}
                {product.detailedPricing.infant && (
                    <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg p-4 border border-pink-200">
                      <h3 className="text-sm font-semibold text-gray-600 mb-3 text-center">
                        {lang === 'ko' ? '유아' : 'Infant'}
                        <div className="text-xs text-gray-500 mt-1">
                          {lang === 'ko' ? '(만 24개월 미만)' : '(Under 24 months)'}
                        </div>
                      </h3>
                      <div className="text-center">
                        {Number(product.detailedPricing.infant.priceKRW) > 0 && (
                          <span className="font-bold text-lg text-gray-800">
                            ₩{Number(product.detailedPricing.infant.priceKRW).toLocaleString()}
                          </span>
                        )}
                        {Number(product.detailedPricing.infant.pricePHP) > 0 && (
                          <span className="font-bold text-lg text-gray-800">
                            ₱{Number(product.detailedPricing.infant.pricePHP).toLocaleString()}
                          </span>
                        )}
                        {Number(product.detailedPricing.infant.priceUSD) > 0 && (
                          <span className="font-bold text-lg text-gray-800">
                            ${Number(product.detailedPricing.infant.priceUSD).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                )}
              </div>
            </div>
          )}

          {/* Schedule */}
          {product.schedule && product.schedule.length > 0 && (
            <div className="mb-6" ref={scheduleContainerRef}>
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
              
              {/* Sticky Navigation Tabs */}
              <div
                ref={scheduleTabsRef}
                className="sticky z-40 flex gap-3 mb-4 overflow-x-auto bg-gradient-to-r from-blue-50 to-white rounded-lg p-3 transition-all duration-300 scrollbar-hide shadow-2xl border-b-4 border-blue-300 backdrop-blur-sm"
                style={{ top: `${navHeight}px` }}
              >
                {product.schedule.map((day) => (
                  <button
                    key={day.day}
                    onClick={() => scrollToDay(day.day)}
                    className={`px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap border-2 ${
                      currentActiveDay === day.day
                        ? 'bg-blue-600 text-white shadow-2xl scale-110 border-blue-800 ring-2 ring-blue-300 ring-opacity-50'
                        : 'bg-white text-gray-600 shadow-md hover:bg-blue-100 hover:text-blue-700 hover:scale-105 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {texts.day} {day.day}
                  </button>
                ))}
              </div>

              {/* All Days Content - 더보기 기능 포함 */}
              <div className="space-y-6">
                {/* Day 1 - 항상 표시 (일부 또는 전체) */}
                {product.schedule?.[0] && (
                  <div
                    ref={(el) => { dayRefs.current[product.schedule?.[0]?.day || 1] = el; }}
                    data-day={product.schedule?.[0]?.day}
                    className="bg-gray-50 rounded-lg p-6 scroll-mt-32"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold ${
                          currentActiveDay === (product.schedule?.[0]?.day || 1) ? 'bg-blue-600' : 'bg-gray-500'
                        }`}>
                          {product.schedule?.[0]?.day}
                        </span>
                        {texts.day} {product.schedule?.[0]?.day}
                  </h3>
                      {/* 해당 일차 지도보기 버튼 */}
                  <button
                        onClick={() => {
                          setActiveDay(product.schedule?.[0]?.day || 1);
                          setIsMapModalOpen(true);
                        }}
                        className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        🗺️ {lang === 'ko' ? `${product.schedule?.[0]?.day}일차 지도` : `Day ${product.schedule?.[0]?.day} Map`}
                  </button>
                </div>
                    
                <div className="space-y-3">
                      {/* Day 1의 스팟들 - 처음 3개 또는 전체 */}
                      {(isScheduleExpanded ? product.schedule?.[0]?.spots : product.schedule?.[0]?.spots?.slice(0, 3) || []).map((spot, index) => (
                        <motion.div
                        key={index}
                          className="flex items-center gap-3 p-4 bg-white rounded-lg cursor-pointer hover:bg-blue-50 hover:shadow-md transition-all duration-200 border border-gray-100"
                        onClick={async () => {
                          setSelectedSpot(spot);
                          try {
                            await incrementSpotClick(spot.spotId);
                          } catch (error) {
                            console.error('Failed to increment spot click:', error);
                          }
                        }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                        {spot.spotImage && (
                          <Image 
                            src={spot.spotImage} 
                            alt={safeLang(spot.spotName, lang)} 
                              width={48} 
                              height={48} 
                              className="rounded-lg object-cover"
                              style={{ width: 48, height: 48 }}
                              onError={(e) => {
                                console.log('Image load error:', spot.spotImage);
                                e.currentTarget.style.display = 'none';
                              }}
                              loading="lazy"
                              unoptimized
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-gray-800 block truncate">
                              {safeLang(spot.spotName, lang)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {lang === 'ko' ? '클릭하여 상세보기' : 'Click for details'}
                            </span>
                      </div>
                        </motion.div>
                    ))}
                      
                      {/* 페이드 효과 (축소 상태일 때만) */}
                      {!isScheduleExpanded && (product.schedule?.[0]?.spots?.length || 0) > 3 && (
                        <div className="relative">
                          <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none" />
                </div>
                      )}
              </div>
            </div>
          )}

                {/* 스케줄 더보기/접기 버튼 */}
                {((product.schedule?.length || 0) > 1 || (product.schedule?.[0]?.spots?.length || 0) > 3) && (
                  <div className="text-center py-8">
                    <button
                      onClick={() => setIsScheduleExpanded(!isScheduleExpanded)}
                      className="group inline-flex items-center gap-4 px-12 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl font-bold shadow-2xl hover:shadow-emerald-500/25 transform hover:scale-105 transition-all duration-300 text-lg"
                    >
                      <span>
                        {isScheduleExpanded ? texts.hideSchedule : texts.showFullSchedule}
                      </span>
                      <motion.div
                        animate={{ rotate: isScheduleExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center"
                      >
                        <svg 
                          width="24" 
                          height="24" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="3"
                          className="group-hover:animate-pulse"
                        >
                          <polyline points="6,9 12,15 18,9" />
                        </svg>
                      </motion.div>
                      {!isScheduleExpanded && (
                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                          +{(product.schedule?.length || 1) - 1}일
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {/* 나머지 Day들 - 확장 상태일 때만 표시 */}
                <AnimatePresence>
                  {isScheduleExpanded && (product.schedule?.slice(1) || []).map((daySchedule, dayIndex) => (
                    <motion.div
                      key={daySchedule.day}
                      ref={(el) => { dayRefs.current[daySchedule.day] = el; }}
                      data-day={daySchedule.day}
                      className="bg-gray-50 rounded-lg p-6 scroll-mt-32"
                      initial={{ opacity: 0, y: 20, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.98 }}
                      transition={{ duration: 0.4, delay: dayIndex * 0.1 }}
                      layout
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold ${
                            currentActiveDay === daySchedule.day ? 'bg-blue-600' : 'bg-gray-500'
                          }`}>
                            {daySchedule.day}
                          </span>
                          {texts.day} {daySchedule.day}
                        </h3>
                        <button
                          onClick={() => {
                            setActiveDay(daySchedule.day);
                            setIsMapModalOpen(true);
                          }}
                          className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          🗺️ {lang === 'ko' ? `${daySchedule.day}일차 지도` : `Day ${daySchedule.day} Map`}
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {daySchedule.spots.map((spot, index) => (
                          <motion.div
                            key={index}
                            className="flex items-center gap-3 p-4 bg-white rounded-lg cursor-pointer hover:bg-blue-50 hover:shadow-md transition-all duration-200 border border-gray-100"
                            onClick={async () => {
                              setSelectedSpot(spot);
                              try {
                                await incrementSpotClick(spot.spotId);
                              } catch (error) {
                                console.error('Failed to increment spot click:', error);
                              }
                            }}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </span>
                            {spot.spotImage && (
                              <Image 
                                src={spot.spotImage} 
                                alt={safeLang(spot.spotName, lang)} 
                                width={48} 
                                height={48} 
                                className="rounded-lg object-cover"
                                style={{ width: 48, height: 48 }}
                                onError={(e) => {
                                  console.log('Image load error:', spot.spotImage);
                                  e.currentTarget.style.display = 'none';
                                }}
                                loading="lazy"
                                unoptimized
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-gray-800 block truncate">
                                {safeLang(spot.spotName, lang)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {lang === 'ko' ? '클릭하여 상세보기' : 'Click for details'}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Product Details - 확장 시에만 표시 */}
          <AnimatePresence>
            {isScheduleExpanded && (product.detailedDescription || product.detailImages) && (
              <motion.section
                className="mb-8 bg-white rounded-xl shadow-lg p-8 border border-gray-100"
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                <h2 className="text-3xl font-bold text-gray-800">{texts.productDetails}</h2>
              </div>
              
              {/* 상품 상세 설명 텍스트 */}
              {product.detailedDescription && (
                <div className="mb-8">
                  <div 
                    className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-line"
                    style={{
                      fontSize: '16px',
                      lineHeight: '1.8',
                      letterSpacing: '0.3px'
                    }}
                    dangerouslySetInnerHTML={{
                      __html: safeLang(product.detailedDescription, lang).replace(/\n/g, '<br>')
                    }}
                  />
                </div>
              )}
              
              {/* 상품 상세 이미지들 */}
              {product.detailImages && product.detailImages.length > 0 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-block bg-gradient-to-r from-blue-100 to-purple-100 px-6 py-3 rounded-full">
                      <span className="text-lg font-semibold text-gray-700">
                        📸 {lang === 'ko' ? '상품 상세 이미지' : 'Product Detail Images'}
                        <span className="ml-2 text-sm text-gray-500">
                          ({product.detailImages.length}장)
                        </span>
                      </span>
                    </div>
                  </div>
                  
                  {/* 모든 이미지 표시 */}
                  {product.detailImages.map((imageUrl, index) => (
                    <motion.div 
                      key={index} 
                      className="relative w-full bg-gray-50 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <Image
                        src={imageUrl}
                        alt={`${safeLang(product.title, lang)} 상세 이미지 ${index + 1}`}
                        width={1000}
                        height={800}
                        className="w-full h-auto"
                        style={{ maxWidth: '100%', height: 'auto' }}
                        onError={() => {
                          console.log('Detail image load error:', imageUrl);
                        }}
                        unoptimized
                        loading="lazy"
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJ4riRBlHLilSlFLG8sWmTGMNY2bTT8lVJdXKjqRYHDv8AL3LeyMx2CfVgKqIqUDEYUKBCXNFHVL//2Q=="
                      />
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                        {index + 1} / {product.detailImages?.length || 0}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              </motion.section>
            )}
          </AnimatePresence>

          {/* Included/Not Included Items - 확장 시에만 표시 */}
          <AnimatePresence>
            {isScheduleExpanded && (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
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
              </motion.div>
            )}
                </AnimatePresence>
                
                {/* 항공편 조합 정보 - 확장 시에만 표시 */}
                <AnimatePresence>
                  {isScheduleExpanded && product.flightCombos && product.flightCombos.length > 0 && (
                    <motion.section 
                      className="w-full max-w-4xl mt-8 mb-8"
                      initial={{ opacity: 0, y: 20, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.98 }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                    >
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
            </motion.section>
        )}
        </AnimatePresence>

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
        
        {/* 예약 리모콘 - 우측 절대 위치 */}
        {remotePosition.show && (
          <div 
            className="fixed right-6 z-50 w-80 max-w-[90vw] transition-all duration-300 ease-out"
            style={{ top: `${remotePosition.top}px` }}
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* 출발/도착 정보 */}
              <div className="bg-gray-50 p-3 text-sm">
                                {product?.departureOptions && product.departureOptions.length > 0 ? (
                  <>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-600">
                        • {lang === 'ko' 
                          ? (product.countries?.[0]?.ko || '출발지') + ' 출발'
                          : 'Departure from ' + (product.countries?.[0]?.en || 'Origin')
                        }
                      </span>
                      <span className="text-gray-900 font-medium">
                        {new Date(product.departureOptions[selectedDepartureOption].departureDate).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', { 
                          year: 'numeric', 
                          month: '2-digit', 
                          day: '2-digit',
                          weekday: 'short'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        • {lang === 'ko' 
                          ? (product.countries?.[0]?.ko || '도착지') + ' 도착'
                          : 'Arrival at ' + (product.countries?.[0]?.en || 'Destination')
                        }
                      </span>
                      <span className="text-gray-900 font-medium">
                        {new Date(product.departureOptions[selectedDepartureOption].returnDate).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          weekday: 'short'
                        })}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-500">
                    {lang === 'ko' ? '출발 일정 정보가 없습니다' : 'No departure schedule available'}
                  </div>
                )}
              </div>
              
              {/* 출발일 변경 버튼 */}
              <div className="p-4">
                <button 
                  onClick={() => setShowDateModal(true)}
                  className="w-full bg-slate-600 text-white py-3 rounded-lg font-medium text-sm hover:bg-slate-700 transition-colors"
                >
                  {lang === 'ko' ? '출발일 변경' : 'Change Date'}
                </button>
              </div>
              
              {/* 예약인원 선택 */}
              <div className="px-4 pb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {lang === 'ko' ? '예약인원 선택' : 'Select Passengers'}
                </h3>
                
                {/* 성인 */}
                <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">
                      {lang === 'ko' ? '성인' : 'Adult'} ⓘ
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      ₱{prices.adult.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => updateCount('adult', false)}
                      className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                      disabled={bookingCounts.adult <= 0}
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-medium">{bookingCounts.adult}</span>
                    <button 
                      onClick={() => updateCount('adult', true)}
                      className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>
                
                {/* 아동 Extra Bed */}
                <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">
                      {lang === 'ko' ? '아동 Extra Bed' : 'Child Extra Bed'} ⓘ
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      ₱{prices.childExtraBed.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => updateCount('childExtraBed', false)}
                      className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                      disabled={bookingCounts.childExtraBed <= 0}
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-medium">{bookingCounts.childExtraBed}</span>
                    <button 
                      onClick={() => updateCount('childExtraBed', true)}
                      className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>
                
                {/* 아동 NO BED */}
                <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">
                      {lang === 'ko' ? '아동 NO BED' : 'Child NO BED'} ⓘ
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      ₱{prices.childNoBed.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => updateCount('childNoBed', false)}
                      className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                      disabled={bookingCounts.childNoBed <= 0}
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-medium">{bookingCounts.childNoBed}</span>
                    <button 
                      onClick={() => updateCount('childNoBed', true)}
                      className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>
                
                {/* 유아 */}
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">
                      {lang === 'ko' ? '유아' : 'Infant'} ⓘ
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      ₱{prices.infant.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => updateCount('infant', false)}
                      className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                      disabled={bookingCounts.infant <= 0}
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-medium">{bookingCounts.infant}</span>
                    <button 
                      onClick={() => updateCount('infant', true)}
                      className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>
                
                {/* 현지 필수 경비 */}
                {product.localExpenses && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>
                        {lang === 'ko' ? '현지 필수 경비 ⓘ' : 'Local Essential Expenses ⓘ'}
                      </span>
                      <div className="text-right">
                        <div>
                          {lang === 'ko' ? '성인' : 'Adult'} $ {product.localExpenses.adult}
                        </div>
                        <div>
                          {lang === 'ko' ? '아동' : 'Child'} $ {product.localExpenses.child}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 총 금액 */}
                <div className="mb-4 pt-3 border-t-2 border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900">
                      {lang === 'ko' ? '총 금액' : 'Total Amount'}
                    </span>
                    <span className="text-2xl font-bold text-teal-600">
                      ₱{totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    <div>
                      {lang === 'ko' ? '유류할증료+세제공과금 포함' : 'Including fuel surcharge and taxes'}
                    </div>
                  </div>
                </div>
                
                {/* 예약 버튼들 */}
                <div className="flex gap-2">
                  <button className="w-12 h-12 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50">
                    ♡
                  </button>
                  <button className="flex-1 bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 transition-colors">
                    {lang === 'ko' ? '예약문의' : 'Book Now'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 여행기간 선택 모달 */}
        {showDateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  {lang === 'ko' ? '여행기간 선택' : 'Select Travel Period'}
                </h2>
                <button 
                  onClick={() => setShowDateModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-light"
                >
                  ×
                </button>
              </div>
              
              {/* 모달 내용 */}
              <div className="p-6">
                <p className="text-gray-600 text-sm mb-4">
                  {lang === 'ko' 
                    ? '원하시는 여행 일정을 선택해주세요.' 
                    : 'Please select your preferred travel dates.'}
                </p>
                
                <div className="space-y-3">
                  {product.departureOptions && product.departureOptions.map((option, index) => (
                    <div 
                      key={index}
                      onClick={() => {
                        setSelectedDepartureOption(index);
                        setShowDateModal(false);
                      }}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedDepartureOption === index 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-blue-600 font-medium text-sm">
                            {lang === 'ko' ? `${index + 1}차` : `${index + 1}st`}
                          </span>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">
                              {new Date(option.departureDate).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                weekday: 'short'
                              })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {lang === 'ko' ? '출발' : 'Departure'}
                            </div>
                          </div>
                          <span className="text-gray-400 text-lg">→</span>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">
                              {new Date(option.returnDate).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                weekday: 'short'
                              })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {lang === 'ko' ? '귀국' : 'Return'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            {lang === 'ko' ? '예약가능' : 'Available'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 모달 푸터 */}
              <div className="p-6 border-t border-gray-200">
                <button 
                  onClick={() => setShowDateModal(false)}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-medium text-sm transition-colors duration-200"
                >
                  {lang === 'ko' ? '닫기' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        </motion.section>
      </main>
    </div>
  );
} 