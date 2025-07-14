"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLanguage } from "@/components/LanguageContext";
import { safeLang } from "@/lib/types";
import MainLayout from "@/components/MainLayout";
import { logPageView } from "@/lib/analytics";
import Image from "next/image";
import { airlineLogoMap } from '@/lib/utils';

interface Product {
  id: string;
  title: string | { ko: string; en: string };
  subtitle?: string | { ko: string; en: string };
  description: string | { ko: string; en: string };
  price: string | { ko: string; en: string };
  originalPrice?: string | { ko: string; en: string };
  duration: string | { ko: string; en: string } | { startDate: string; endDate: string };
  imageUrls?: string[];
  category?: string | { ko: string; en: string };
  region?: string | { ko: string; en: string };
  discount?: number;
  highlights?: Array<string | { ko: string; en: string }>;
  isActive?: boolean;
  isFeatured?: boolean;
  createdAt?: Date | string;
  schedule?: Array<{
    day: number;
    spots: Array<{
      id: string;
      name: string;
      name_kr: string;
      imageUrl: string;
      description?: string;
      type: string;
    }>;
  }>;
  nights?: number;
  days?: number;
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

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 }
};

const TEXT = {
  title: { ko: "투어상품", en: "Tours" },
  desc: {
    ko: "다양한 인기 투어 상품을 만나보세요!",
    en: "Discover a variety of popular tour products!"
  },
  seeDetail: { ko: "자세히 보기", en: "See Details" },
  loading: { ko: "로딩 중...", en: "Loading..." },
  noData: { ko: "투어 상품이 없습니다.", en: "No tour products available." }
};

function getPeriodText(schedule: unknown, lang: 'ko' | 'en') {
  if (!schedule || !Array.isArray(schedule)) {
    return lang === 'ko' ? '1일' : '1 day';
  }
  
  const days = schedule.length;
  if (days <= 1) return lang === 'ko' ? '1일' : '1 day';
  const nights = days - 1;
  if (lang === 'ko') {
    return `${nights}박 ${days}일`;
  } else {
    return `${days} days ${nights} nights`;
  }
}

function getDisplayPrice(price: Record<string, string | undefined> | undefined, lang: 'ko' | 'en'): string {
  if (!price) return '';
  const { KRW, PHP, USD } = price;
  const values = [KRW, PHP, USD].filter(Boolean);
  if (values.length === 1) {
    if (KRW) return `₩${KRW}`;
    if (USD) return `$${USD}`;
    if (PHP) return `₱${PHP}`;
  }
  if (lang === 'ko' && KRW) return `₩${KRW}`;
  if (lang === 'en' && USD) return `$${USD}`;
  if (lang === 'en' && PHP) return `₱${PHP}`;
  if (KRW) return `₩${KRW}`;
  if (USD) return `$${USD}`;
  if (PHP) return `₱${PHP}`;
  return '';
}

function ToursPage() {
  const { lang } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productsRef = collection(db, "products");
        const q = query(productsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedProducts: Product[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        setProducts(fetchedProducts);
      } catch (err) {
        setError("Failed to fetch products");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    logPageView('Tours', '/tours', { language: lang });
  }, [lang]);

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const paginatedProducts = products.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading && products.length === 0) {
    return (
      <MainLayout>
        <div className="text-center py-10">
          <p>{TEXT.loading[lang]}</p>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="text-center py-10">
          <p>{error}</p>
        </div>
      </MainLayout>
    );
  }

  if (products.length === 0) {
    return (
      <MainLayout>
        <div className="text-center py-10">
          <p>{TEXT.noData[lang]}</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-4xl font-bold mb-4">{TEXT.title[lang]}</h1>
        <p className="text-lg mb-6">{TEXT.desc[lang]}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {paginatedProducts.map((product) => {
            const imageUrl = Array.isArray(product.imageUrls) && product.imageUrls.length > 0 ? product.imageUrls[0] : undefined;
            return (
              <motion.div
                key={product.id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.025, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
                className="flex bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all border border-gray-100 hover:border-blue-400 group"
                onClick={() => window.location.href = `/tours/${product.id}`}
                tabIndex={0}
                role="button"
                onKeyDown={e => { if (e.key === 'Enter') window.location.href = `/tours/${product.id}`; }}
                style={{ minHeight: 220 }}
              >
                {/* 대표 이미지 (A4 비율) */}
                <div className="relative flex-shrink-0 w-40 md:w-48 lg:w-56" style={{ aspectRatio: '1/1.414', minHeight: 180, background: '#f3f4f6' }}>
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={safeLang(product.title, lang)}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={false}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl">🖼️</div>
                  )}
                </div>
                {/* 상품 정보 */}
                <div className="flex-1 flex flex-col justify-between p-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-2xl font-bold group-hover:text-blue-600 transition-colors">{safeLang(product.title, lang)}</h2>
                      {product.isFeatured && (
                        <span className="ml-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold">Featured</span>
                      )}
                    </div>
                    {product.subtitle && (
                      <p className="text-base text-gray-500 mb-1">{safeLang(product.subtitle, lang)}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {product.region && (
                        <span className="inline-block bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-xs font-semibold">
                          {typeof product.region === 'object' ? product.region[lang] : product.region}
                        </span>
                      )}
                      {product.category && (
                        <span className="inline-block bg-green-100 text-green-700 rounded-full px-3 py-1 text-xs font-semibold">
                          {typeof product.category === 'object' ? product.category[lang] : product.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-xl font-bold text-red-600">{getDisplayPrice(typeof product.price === 'string' ? undefined : product.price, lang)}</span>
                      {product.originalPrice && (
                        <span className="text-base text-gray-400 line-through">
                          {getDisplayPrice(typeof product.originalPrice === 'string' ? undefined : product.originalPrice, lang)}
                        </span>
                      )}
                    </div>
                    <div className="text-gray-700 text-sm mb-2">
                      <span className="font-semibold">{lang === 'ko' ? '기간' : 'Duration'}: </span>
                      {/* 기간 날짜 */}
                      {product.duration && typeof product.duration === 'object' && 'startDate' in product.duration && 'endDate' in product.duration
                        ? `${product.duration.startDate} ~ ${product.duration.endDate}`
                        : product.duration && typeof product.duration === 'object' && ('ko' in product.duration || 'en' in product.duration)
                          ? product.duration[lang]
                          : typeof product.duration === 'string'
                            ? product.duration
                            : getPeriodText(product.schedule, lang)
                      }
                      {/* 몇박 몇일 정보 */}
                      {typeof product.nights === 'number' && typeof product.days === 'number' && product.nights > 0 && product.days > 0 && (
                        <span className="ml-2 text-gray-500">
                          {lang === 'ko'
                            ? `${product.nights}박 ${product.days}일`
                            : `${product.nights} night${product.nights > 1 ? 's' : ''} ${product.days} day${product.days > 1 ? 's' : ''}`
                          }
                        </span>
                      )}
                    </div>
                    {product.description && (
                      <p className="text-gray-500 text-sm line-clamp-2">{safeLang(product.description, lang)}</p>
                    )}
                  </div>
                  {/* 항공사 간략 정보 */}
                  {Array.isArray(product.flightCombos) && product.flightCombos.length > 0 && (
                    <div className="flex items-center gap-3 mt-2">
                      {product.flightCombos.slice(0,2).map((combo, idx) => {
                        const airlineName = combo.departure.airline[lang];
                        const logo = airlineLogoMap[airlineName];
                        return (
                          <div key={idx} className="flex items-center gap-1 bg-gray-50 rounded px-2 py-1 border border-gray-200">
                            {logo && (
                              <Image src={logo} alt={airlineName} width={24} height={24} style={{width:24, height:24}} />
                            )}
                            <span className="text-xs text-gray-700 font-medium whitespace-nowrap">{airlineName}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
            >
              이전
            </button>
            <span className="px-4 py-2 text-lg font-semibold">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default ToursPage;