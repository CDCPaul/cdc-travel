"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLanguage } from "@/components/LanguageContext";
import { safeLang } from "@/lib/types";
import MainLayout from "@/components/MainLayout";
import { getPHPPrice } from "@/lib/types";
import { logEvent, logPageView } from "@/lib/analytics";

interface Product {
  id: string;
  title: string | { ko: string; en: string };
  subtitle?: string | { ko: string; en: string };
  description: string | { ko: string; en: string };
  price: string | { ko: string; en: string };
  originalPrice?: string | { ko: string; en: string };
  duration: string | { ko: string; en: string };
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

const SUMMARY_TEXT = {
  included: {
    ko: "항공+호텔+가이드",
    en: "Flight+Hotel+Guide"
  }
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

export default function ToursPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { lang } = useLanguage();

  useEffect(() => {
    // 페이지 로드 이벤트 추적
    logPageView('Tours', '/tours', { language: lang });

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        setProducts(productsData);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('투어 상품을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [lang]);

  // 투어 클릭 이벤트 핸들러
  const handleTourClick = (tourId: string, tourTitle: string) => {
    logEvent('tour_click', {
      tour_id: tourId,
      tour_title: tourTitle,
      location: 'tours_list_page',
      language: lang
    });
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
          <h1 className="text-3xl font-bold mb-8 text-center">{TEXT.title[lang]}</h1>
          <p className="text-lg text-gray-700 mb-8">{TEXT.desc[lang]}</p>
          
          {products.length === 0 ? (
            <div className="text-center">
              <p className="text-lg text-gray-600">{TEXT.noData[lang]}</p>
            </div>
          ) : (
            <section className="w-full max-w-5xl">
              <div className="grid md:grid-cols-2 gap-8">
                {products.map((product: Product, i: number) => (
                  <motion.div
                    key={product.id}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                    transition={{ delay: i * 0.15 }}
                  >
                    <Link 
                      href={`/tours/${product.id}`} 
                      className="flex bg-white rounded-xl shadow p-6 flex-col hover:shadow-lg transition"
                      onClick={() => handleTourClick(product.id, safeLang(product.title, lang))}
                    >
                      {product.imageUrls && product.imageUrls.length > 0 ? (
                        <Image 
                          src={product.imageUrls[0]} 
                          alt={safeLang(product.title, lang)} 
                          width={600} 
                          height={400} 
                          className="rounded mb-4 object-cover w-full h-48" 
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 rounded mb-4 flex items-center justify-center">
                          <span className="text-gray-500">이미지 없음</span>
                        </div>
                      )}
                      
                      <h3 className="text-2xl font-semibold mb-2">{safeLang(product.title, lang)}</h3>
                      
                      {product.subtitle && (
                        <p className="text-gray-600 mb-2">{safeLang(product.subtitle, lang)}</p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-2 mb-2 text-sm text-gray-600">
                        <span>{getPHPPrice(product.price)}</span>
                        <span>• {getPeriodText(product.schedule, lang)}</span>
                        {product.region && <span>• {typeof product.region === 'object' ? product.region[lang] : product.region}</span>}
                        <span>• {SUMMARY_TEXT.included[lang]}</span>
                      </div>
                      
                      <p className="mb-2 text-gray-700 line-clamp-3">
                        {safeLang(product.description, lang)}
                      </p>
                      
                      {product.highlights && product.highlights.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {product.highlights.slice(0, 3).map((highlight: string | { ko: string; en: string }, idx: number) => (
                            <span key={idx} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              {typeof highlight === 'object' ? safeLang(highlight, lang) : highlight}
                            </span>
                          ))}
                          {product.highlights.length > 3 && (
                            <span className="text-xs text-gray-500">+{product.highlights.length - 3}</span>
                          )}
                        </div>
                      )}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </MainLayout>
  );
} 