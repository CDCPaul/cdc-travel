"use client";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navigation from "@/components/Navigation";
import { useLanguage } from "@/components/LanguageContext";
import { safeLang } from "@/lib/types";
import { getPHPPrice } from "@/lib/types";
import { AnimatePresence } from "framer-motion";

// Spot 타입을 명확히 선언
interface Spot {
  spotId: string;
  spotName: { ko: string; en: string };
  spotImage?: string;
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
    included: "항공 + 호텔 + 가이드"
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
    included: "Flight + Hotel + Guide"
  }
};

// nights, days를 자연어로 조합해주는 함수
function getNightsDaysText(nights?: number, days?: number, lang: 'ko' | 'en' = 'ko') {
  if (!nights || !days) return '';
  return lang === 'ko'
    ? `${nights}박 ${days}일`
    : `${nights} night${nights > 1 ? 's' : ''} ${days} day${days > 1 ? 's' : ''}`;
}

// Spot 상세 모달 컴포넌트
function SpotDetailModal({ spot, onClose, lang }: { spot: Spot; onClose: () => void; lang: 'ko' | 'en' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // spotId가 있으면 Firestore에서 spot 상세정보 fetch (현재는 사용하지 않음)
  useEffect(() => {
    let ignore = false;
    async function fetchSpot() {
      if (!spot.spotId) {
        setLoading(false);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const docSnap = await getDoc(doc(db, 'spots', spot.spotId));
        if (!ignore) {
          if (docSnap.exists()) {
            // 현재는 사용하지 않음
          } else {
            setError('스팟 정보를 찾을 수 없습니다.');
          }
        }
      } catch {
        if (!ignore) {
          setError('스팟 정보를 불러오지 못했습니다.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchSpot();
    return () => { ignore = true; };
  }, [spot.spotId]);

  // images: spot.spotImage만 사용 (간소화)
  const images: string[] = useMemo(() => {
    return spot.spotImage ? [spot.spotImage] : [];
  }, [spot.spotImage]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoadingStates, setImageLoadingStates] = useState<{ [key: string]: boolean }>({});
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    const preloadImagesSequentially = async (imgs: string[]) => {
      const newLoadingStates: { [key: string]: boolean } = {};
      imgs.forEach(src => { newLoadingStates[src] = true; });
      setImageLoadingStates(newLoadingStates);
      for (let i = 0; i < imgs.length; i++) {
        const src = imgs[i];
        try {
          await new Promise((resolve, reject) => {
            const img = new window.Image();
            img.onload = () => {
              setImageLoadingStates((prev: { [key: string]: boolean }) => ({ ...prev, [src]: false }));
              resolve(src);
            };
            img.onerror = () => {
              setImageLoadingStates((prev: { [key: string]: boolean }) => ({ ...prev, [src]: false }));
              reject(new Error(`Failed to load image: ${src}`));
            };
            img.src = src;
          });
          if (i > 0) await new Promise(res => setTimeout(res, 100));
        } catch {
          // ignore
        }
      }
    };
    if (images.length > 0) preloadImagesSequentially(images);
  }, [images]);

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  const goToImage = (idx: number) => setCurrentImageIndex(idx);

  const handleTouchStart = (e: React.TouchEvent) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
  const handleTouchMove = (e: React.TouchEvent) => { setTouchEnd(e.targetTouches[0].clientX); };
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) nextImage();
    if (distance < -50) prevImage();
  };

  // 상세 정보: spot만 사용 (간소화)
  const name = spot.spotName ? (typeof spot.spotName === 'object' ? spot.spotName[lang] : spot.spotName) : '';
  const description = '';

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
        {/* 이미지 슬라이더/썸네일 */}
        <div
          className="w-full bg-gray-100 flex items-center justify-center relative p-0 rounded-t-2xl overflow-hidden"
          style={{ height: '400px' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {images.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center text-4xl text-gray-300">🖼️</div>
          ) : (
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
              {/* 좌우 화살표 */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 hidden sm:flex items-center justify-center z-10"
                    aria-label="Previous image"
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 hidden sm:flex items-center justify-center z-10"
                    aria-label="Next image"
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
                  </button>
                </>
              )}
              {/* 인디케이터 */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => goToImage(idx)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        idx === currentImageIndex ? 'bg-blue-600' : 'bg-white/60 hover:bg-white/80'
                      }`}
                      aria-label={`Go to image ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* 상세 정보 */}
        <div className="p-6 flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 400px)' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-bold">{name || 'No Name'}</span>
          </div>
          {/* 설명 */}
          <div className="text-gray-700 text-base whitespace-pre-line mb-2">
            <span className="font-semibold">{lang === 'ko' ? '설명' : 'Description'}: </span>
            {description}
          </div>
          {/* 별점 영역 (공간만) */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <span key={star} className="text-yellow-400 text-xl">★</span>
              ))}
            </div>
            <span className="text-gray-600 text-sm">5.0</span>
            <span className="text-gray-400 text-sm">(0 reviews)</span>
          </div>
        </div>
        </>
        )}
      </motion.div>
    </motion.div>
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

  useEffect(() => {
    console.log("[useEffect] triggered, params.id:", params.id);
    const fetchData = async () => {
      console.log("[fetchData] called with id:", params.id);
      try {
        setLoading(true);
        
        const productRef = doc(db, 'products', params.id as string);
        const productSnap = await getDoc(productRef);
        
        if (productSnap.exists()) {
          const productData = { id: productSnap.id, ...productSnap.data() } as Product;
          console.log("[fetchData] Fetched productData:", productData);
          setProduct(productData);
        } else {
          console.log("[fetchData] No product found for id:", params.id);
          setProduct(null);
        }
      } catch (error) {
        console.error('[fetchData] Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
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
              <p className="text-lg whitespace-nowrap">
                {product.duration?.startDate && product.duration?.endDate
                  ? `${product.duration.startDate} ~ ${product.duration.endDate}`
                  : ''}
                {product.nights && product.days && (
                  <span className="ml-2 text-gray-500">{getNightsDaysText(product.nights, product.days, lang)}</span>
                )}
              </p>
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
              <h2 className="text-2xl font-bold mb-4">{texts.schedule}</h2>
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
                <h3 className="font-semibold mb-3">
                  {texts.day} {activeDay}
                </h3>
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
        </AnimatePresence>
      </main>
    </div>
  );
} 