"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import { useLanguage } from "@/components/LanguageContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { safeLang } from "@/lib/types";

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

  useEffect(() => {
    const fetchTravelInfo = async () => {
      if (!params.id) return;
      
      try {
        setLoading(true);
        const docRef = doc(db, "travel-info", params.id as string);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setInfo({ id: docSnap.id, ...docSnap.data() } as TravelInfo);
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
  }, [params.id]);

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

          {/* Image Gallery */}
          {info.imageUrls && info.imageUrls.length > 1 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">{TEXT.images[lang]} ({info.imageUrls.length}개)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {info.imageUrls.slice(1).map((url: string, idx: number) => (
                  <div key={idx} className="relative group">
                    <Image 
                      src={url} 
                      alt={`${safeLang(info.title, lang)} - ${idx + 2}`} 
                      width={300} 
                      height={200} 
                      className="w-full h-48 object-cover rounded-lg shadow-md transition-transform group-hover:scale-105" 
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      {idx + 2}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-sm text-gray-500 pt-6 border-t">
            {TEXT.createdAt[lang]}: {
              info.createdAt ? 
                typeof info.createdAt === 'object' && 'seconds' in info.createdAt ?
                  new Date((info.createdAt as { seconds: number; nanoseconds: number }).seconds * 1000).toLocaleDateString() :
                  new Date(info.createdAt as string | Date).toLocaleDateString()
                : 'N/A'
            }
          </div>
        </motion.section>
      </motion.main>
    </div>
  );
} 