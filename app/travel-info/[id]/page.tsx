"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import { useLanguage } from "@/components/LanguageContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { safeLang } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Pagination } from "swiper/modules";
import "swiper/css/pagination";

interface TravelInfo {
  id: string;
  title: string | { ko: string; en: string };
  content: string | { ko: string; en: string };
  category: string | { ko: string; en: string };
  imageUrls?: string[];
  tags?: Array<string | { ko: string; en: string }>;
  createdAt?: Date | string | { seconds: number; nanoseconds: number };
}

const TEXT = {
  loading: { ko: "로딩 중...", en: "Loading..." },
  notFound: { ko: "여행정보를 찾을 수 없습니다.", en: "Travel info not found." },
  backToHome: { ko: "홈으로", en: "Home" },
  backToTravelInfo: { ko: "여행정보", en: "Travel Info" },
  category: { ko: "카테고리", en: "Category" },
  tags: { ko: "태그", en: "Tags" },
  images: { ko: "이미지", en: "Images" },
  createdAt: { ko: "작성일", en: "Created" }
};

export default function TravelInfoDetailPage() {
  const params = useParams();
  const { lang } = useLanguage();
  const [info, setInfo] = useState<TravelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  useEffect(() => {
    const fetchTravelInfo = async () => {
      if (!params.id) return;
      
      try {
        setLoading(true);
        const docRef = doc(db, "travel-info", params.id as string);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const travelInfo = { id: docSnap.id, ...docSnap.data() } as TravelInfo;
          setInfo(travelInfo);
          
          // 이미지 프리로드
          if (travelInfo.imageUrls && travelInfo.imageUrls.length > 0) {
            preloadImagesSequentially(travelInfo.imageUrls);
          }
        } else {
          setError('여행정보를 찾을 수 없습니다.');
        }
      } catch (err) {
        console.error('Error fetching travel info:', err);
        setError('여행정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchTravelInfo();
  }, [params.id, preloadImagesSequentially]);



  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <main className="bg-gray-50 flex flex-col items-center pt-28 px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">{TEXT.loading[lang]}</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <main className="bg-gray-50 flex flex-col items-center pt-28 px-4">
          <div className="text-center">
            <p className="text-lg text-red-600 mb-4">{error || TEXT.notFound[lang]}</p>
            <Link 
              href="/travel-info" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              여행정보 목록으로
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <motion.main
        className="bg-gray-50 flex flex-col items-center pt-28 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Breadcrumbs */}
        <nav className="mb-6 w-full max-w-4xl text-sm text-gray-500 flex gap-2 items-center">
          <Link href="/" className="hover:underline">{TEXT.backToHome[lang]}</Link>
          <span>&gt;</span>
          <Link href="/travel-info" className="hover:underline">{TEXT.backToTravelInfo[lang]}</Link>
          <span>&gt;</span>
          <span className="text-gray-700 font-semibold">{safeLang(info.title, lang)}</span>
        </nav>
        
        <motion.section
          className="bg-white rounded-xl shadow-lg p-8 w-full max-w-4xl"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-4">{safeLang(info.title, lang)}</h1>
            {info.category && (
              <div className="mb-4">
                <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {safeLang(info.category, lang)}
                </span>
              </div>
            )}
          </div>

          {/* Main Image */}
          {info.imageUrls && info.imageUrls.length > 0 && (
            <div className="mb-6">
              <Image 
                src={info.imageUrls[0]} 
                alt={safeLang(info.title, lang)} 
                width={800} 
                height={400} 
                className="w-full h-96 object-cover rounded-lg shadow-md" 
              />
            </div>
          )}

          {/* Content */}
          <div className="mb-6">
            <div className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">
              {safeLang(info.content, lang)}
            </div>
          </div>

          {/* Tags */}
          {info.tags && info.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">{TEXT.tags[lang]}</h3>
              <div className="flex flex-wrap gap-2">
                {info.tags.map((tag: string | { ko: string; en: string }, idx: number) => (
                  <span key={idx} className="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                    {typeof tag === 'object' ? safeLang(tag, lang) : tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Image Gallery (Swiper 캐러셀) */}
          {info.imageUrls && info.imageUrls.length > 1 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{TEXT.images[lang]} ({info.imageUrls.length}개)</h3>
                {Object.values(imageLoadingStates).some(loading => loading) && (
                  <div className="text-sm text-gray-500">
                    로딩: {loadedImages.size} / {info.imageUrls.length}
                  </div>
                )}
              </div>
              <Swiper
                modules={[Pagination]}
                pagination={{ clickable: true }}
                spaceBetween={16}
                slidesPerView={1}
                className="w-full h-64 md:h-96 rounded-lg overflow-hidden"
              >
                {info.imageUrls.map((url: string, idx: number) => (
                  <SwiperSlide key={url}>
                    <div className="relative w-full h-64 md:h-96">
                      {imageLoadingStates[url] ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                          <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mb-2"></div>
                            <span className="text-xs text-white">로딩 중...</span>
                          </div>
                        </div>
                      ) : null}
                    <Image 
                      src={url} 
                        alt={`${safeLang(info.title, lang)} - ${idx + 1}`}
                        fill
                        className="object-cover w-full h-full rounded-lg shadow-md"
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                        {idx + 1}
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}

          {/* Footer */}
          <div className="text-sm text-gray-500 pt-6 border-t">
            {TEXT.createdAt[lang]}: {
              info.createdAt ? 
                typeof info.createdAt === 'object' && 'seconds' in info.createdAt ?
                  formatDate(new Date((info.createdAt as { seconds: number; nanoseconds: number }).seconds * 1000), 'YYYY-MM-DD') :
                  formatDate(new Date(info.createdAt as string | Date), 'YYYY-MM-DD')
                : 'N/A'
            }
          </div>
        </motion.section>
      </motion.main>
    </div>
  );
} 