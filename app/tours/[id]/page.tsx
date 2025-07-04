"use client";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navigation from "@/components/Navigation";
import { useLanguage } from "@/components/LanguageContext";
import { safeLang } from "@/lib/types";
import { getPHPPrice } from "@/lib/types";

interface Spot {
  id: string;
  type: string;
  name: { ko: string; en: string };
  description: { ko: string; en: string };
  address: { ko: string; en: string };
  region: { ko: string; en: string };
  imageUrl: string;
  tags: string[];
  mealType: string | { ko: string; en: string };
  extraImages: string[];
  mapUrl: string;
  duration: { ko: string; en: string };
  price: { ko: string; en: string };
  bestTime: { ko: string; en: string };
}

interface Product {
  id: string;
  title: { ko: string; en: string };
  subtitle: { ko: string; en: string };
  description: { ko: string; en: string };
  duration: { ko: string; en: string };
  price: { KRW?: string; PHP?: string; USD?: string };
  originalPrice: { ko: string; en: string };
  discount: number;
  imageUrls?: string[];
  category: { ko: string; en: string };
  region: { ko: string; en: string };
  difficulty: { ko: string; en: string };
  maxGroupSize: number;
  minAge: number;
  languages: string[];
  highlights: Array<{ spotId: string; spotName: { ko: string; en: string } }>;
  schedule: Array<{
    day: number;
    spots: Array<{
      spotId: string;
      spotName: { ko: string; en: string };
      spotImage?: string;
    }>;
    title?: { ko: string; en: string };
  }>;
  includedItems: string[];
  notIncludedItems: string[];
  requirements: Array<{ ko: string; en: string }>;
  notes: Array<{ ko: string; en: string }>;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

const TEXTS = {
  ko: {
    loading: "로딩 중...",
    notFound: "투어 상품을 찾을 수 없습니다.",
    backToTours: "← 투어 목록으로",
    duration: "기간",
    category: "카테고리",
    region: "지역",
    difficulty: "난이도",
    highlights: "하이라이트",
    schedule: "일정",
    day: "일차",
    includedItems: "포함 사항",
    notIncludedItems: "불포함 사항",
    requirements: "필요 사항",
    notes: "참고 사항",
    address: "주소",
    durationLabel: "소요 시간",
    priceLabel: "가격",
    bestTime: "최적 시간",
    tags: "태그",
    viewOnMap: "지도에서 보기",
    spotDetail: "스팟 상세 정보"
  },
  en: {
    loading: "Loading...",
    notFound: "Tour product not found.",
    backToTours: "← Back to Tours",
    duration: "Duration",
    category: "Category",
    region: "Region",
    difficulty: "Difficulty",
    highlights: "Highlights",
    schedule: "Schedule",
    day: "Day",
    includedItems: "Included Items",
    notIncludedItems: "Not Included Items",
    requirements: "Requirements",
    notes: "Notes",
    address: "Address",
    durationLabel: "Duration",
    priceLabel: "Price",
    bestTime: "Best Time",
    tags: "Tags",
    viewOnMap: "View on Map",
    spotDetail: "Spot Details"
  }
};

const SUMMARY_TEXT = {
  included: {
    ko: "항공 + 호텔 + 가이드",
    en: "Flight + Hotel + Guide"
  },
  price: {
    ko: "가격",
    en: "Price"
  },
  period: {
    ko: "기간",
    en: "Period"
  },
  region: {
    ko: "지역",
    en: "Region"
  }
};

export default function TourDetailPage() {
  const params = useParams();
  const { lang } = useLanguage();
  const texts = TEXTS[lang];
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [activeDay, setActiveDay] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch product
        const productRef = doc(db, 'products', params.id as string);
        const productSnap = await getDoc(productRef);
        
        if (productSnap.exists()) {
          setProduct({ id: productSnap.id, ...productSnap.data() } as Product);
        }
        
        // Fetch spots
        // const spotsSnapshot = await getDocs(collection(db, 'spots'));
        // const spotsData = spotsSnapshot.docs.map(doc => ({
        //   id: doc.id,
        //   ...doc.data()
        // })) as Spot[];
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="pt-32 text-center">{texts.loading}</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="pt-32 text-center">{texts.notFound}</div>
      </div>
    );
  }

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
            <p className="text-xl text-gray-600 mb-4">{safeLang(product.subtitle, lang)}</p>
            <div className="flex justify-center items-center gap-4 text-lg">
              <span className="text-2xl font-bold text-blue-600">{getPHPPrice(product.price)}</span>
              {product.discount > 0 && (
                <>
                  <span className="text-gray-400 line-through">{safeLang(product.originalPrice, lang)}</span>
                  <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm">
                    {product.discount}% 할인
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Product Image */}
          {product.imageUrls && product.imageUrls.length > 0 ? (
            <div className="relative h-64 md:h-96 rounded-lg overflow-hidden">
              <Image
                src={product.imageUrls[0]}
                alt={safeLang(product.title, lang)}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="relative h-64 md:h-96 rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">이미지 없음</span>
            </div>
          )}

          {/* Product Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700">{SUMMARY_TEXT.price[lang]}</h3>
              <p>{getPHPPrice(product.price)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700">{SUMMARY_TEXT.period[lang]}</h3>
              <p>{getPeriodText(product.schedule, lang)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700">{SUMMARY_TEXT.region[lang]}</h3>
              <p>{product.region?.[lang] || '-'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700">{SUMMARY_TEXT.included[lang]}</h3>
              <p>{SUMMARY_TEXT.included[lang]}</p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-3">상품 설명</h2>
            <p className="text-gray-700 leading-relaxed">{safeLang(product.description, lang)}</p>
          </div>

          {/* Highlights */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-3">{texts.highlights}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {product.highlights?.map((highlight, index) =>
                highlight?.spotName ? (
                  <div
                    key={index}
                    className="flex items-center gap-2 cursor-pointer hover:underline"
                    onClick={() => {
                      const allSpots = product.schedule?.flatMap(day => day.spots) || [];
                      const spot = allSpots.find(s => s.spotId === highlight.spotId);
                      if (spot) setSelectedSpot({
                        id: spot.spotId,
                        name: spot.spotName,
                        imageUrl: spot.spotImage || '',
                        type: '',
                        description: { ko: '', en: '' },
                        address: { ko: '', en: '' },
                        region: { ko: '', en: '' },
                        tags: [],
                        mealType: '',
                        extraImages: [],
                        mapUrl: '',
                        duration: { ko: '', en: '' },
                        price: { ko: '', en: '' },
                        bestTime: { ko: '', en: '' }
                      });
                    }}
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>{safeLang(highlight.spotName, lang)}</span>
                  </div>
                ) : null
              )}
            </div>
          </div>

          {/* Schedule */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">{texts.schedule}</h2>
            {/* Day Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {product.schedule?.filter(Boolean).map((day) => (
                <button
                  key={day.day}
                  onClick={() => setActiveDay(day.day)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
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
              <h3 className="text-xl font-semibold mb-3">
                {safeLang(product.schedule?.find(d => d.day === activeDay)?.title ?? '', lang)}
              </h3>
              <div className="space-y-3">
                {product.schedule?.find(d => d.day === activeDay)?.spots?.filter(Boolean).map((spot, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 cursor-pointer hover:underline"
                    onClick={() => setSelectedSpot({
                      id: spot.spotId,
                      name: spot.spotName,
                      imageUrl: spot.spotImage || '',
                      type: '',
                      description: { ko: '', en: '' },
                      address: { ko: '', en: '' },
                      region: { ko: '', en: '' },
                      tags: [],
                      mealType: '',
                      extraImages: [],
                      mapUrl: '',
                      duration: { ko: '', en: '' },
                      price: { ko: '', en: '' },
                      bestTime: { ko: '', en: '' }
                    })}
                  >
                    {spot.spotImage && (
                      <Image src={spot.spotImage} alt={safeLang(spot.spotName, lang)} width={40} height={40} />
                    )}
                    <span>{safeLang(spot.spotName, lang)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Included/Not Included Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-3 text-green-700">{texts.includedItems}</h2>
              <ul className="space-y-2">
                {product.includedItems?.filter(Boolean).map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-3 text-red-700">{texts.notIncludedItems}</h2>
              <ul className="space-y-2">
                {product.notIncludedItems?.filter(Boolean).map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Requirements */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-3">{texts.requirements}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {product.requirements?.filter(Boolean).map((req, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>{safeLang(req, lang)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-3">{texts.notes}</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              {product.notes?.filter(Boolean).map((note, index) => (
                <p key={index} className="text-gray-700 mb-2 last:mb-0">
                  • {safeLang(note, lang)}
                </p>
              ))}
            </div>
          </div>
        </motion.section>
      </main>

      {/* Spot Detail Modal */}
      <AnimatePresence>
        {selectedSpot && (
          <SpotDetailModal
            spot={selectedSpot}
            onClose={() => setSelectedSpot(null)}
            lang={lang}
            texts={texts}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Spot Detail Modal Component
interface SpotDetailModalProps {
  spot: Spot;
  onClose: () => void;
  lang: 'ko' | 'en';
  texts: Record<string, string>;
}

function SpotDetailModal({ spot, onClose, lang, texts }: SpotDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const allImages = [spot.imageUrl, ...spot.extraImages].filter(Boolean);

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">{spot.name[lang]}</h2>
              <p className="text-gray-600">{spot.type}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Image Gallery */}
        {allImages.length > 0 && (
          <div className="relative">
            <div className="relative h-64">
              <Image
                src={allImages[currentImageIndex]}
                alt={spot.name[lang]}
                fill
                className="object-cover"
              />
            </div>
            {allImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {allImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-3 h-3 rounded-full ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">설명</h3>
            <p className="text-gray-700">{spot.description[lang]}</p>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-600">{texts.address}</h4>
              <p className="text-sm">{spot.address[lang]}</p>
            </div>
            {spot.duration && spot.duration[lang] && (
              <div>
                <h4 className="font-semibold text-gray-600">{texts.durationLabel}</h4>
                <p className="text-sm">{spot.duration[lang]}</p>
              </div>
            )}
            <div>
              <h4 className="font-semibold text-gray-600">{texts.priceLabel}</h4>
              <p className="text-sm">{spot.price[lang]}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-600">{texts.bestTime}</h4>
              <p className="text-sm">{spot.bestTime[lang]}</p>
            </div>
          </div>

          {/* Tags */}
          {spot.tags.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-600 mb-2">{texts.tags}</h4>
              <div className="flex flex-wrap gap-2">
                {spot.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Map Link */}
          {spot.mapUrl && (
            <div>
              <a
                href={spot.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {texts.viewOnMap}
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function getPeriodText(schedule: Product['schedule'], lang: 'ko' | 'en') {
  const days = schedule?.length || 0;
  if (days <= 1) return lang === 'ko' ? '1일' : '1 day';
  const nights = days - 1;
  if (lang === 'ko') {
    return `${nights}박 ${days}일`;
  } else {
    return `${days} days ${nights} nights`;
  }
} 