"use client";
import { useLanguage } from "@/components/LanguageContext";
import MainLayout from "@/components/MainLayout";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { Ebook } from "@/lib/types";

const TEXT = {
  title: { ko: "CDC 비즈니스 eBook관", en: "CDC Business eBook Collection" },
  desc: {
    ko: "CDC 비즈니스 eBook관에서는 CDC의 다양한 비즈니스 자료와 eBook을 확인하실 수 있습니다.",
    en: "In the CDC Business eBook Collection, you can find various business materials and eBooks from CDC."
  }
};

const SIDEBAR = [
  { href: "/about-us", label: { ko: "비전/미션", en: "Vision/Mission" } },
  { href: "/about-us/history", label: { ko: "연혁", en: "History" } },
  { href: "/about-us/team", label: { ko: "대표/팀소개", en: "Team" } },
  { href: "/about-us/office", label: { ko: "오피스/연락처", en: "Office/Contact" } },
  { href: "/about-us/awards", label: { ko: "인증/파트너/수상", en: "Awards/Partners" } },
  { href: "/about-us/ebook-collection", label: { ko: "CDC 비즈니스 eBook관", en: "CDC Business eBook Collection" } },
  { href: "/about-us/contact", label: { ko: "문의/상담", en: "Contact" } },
];

const MODERN_BG = "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)"; // 차분한 그라데이션

export default function EbookCollectionPage() {
  const { lang } = useLanguage();
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date"); // date or name

  useEffect(() => {
    async function fetchEbooks() {
      if (!db) {
        console.warn('Firebase 데이터베이스가 초기화되지 않았습니다.');
        return;
      }
      
      try {
        let q;
        if (sort === "date") {
          q = query(
            collection(db, "ebooks"),
            where("isPublic", "==", true),
            orderBy("createdAt", "desc")
          );
        } else {
          // 이름순 정렬은 클라이언트 사이드에서 처리
          q = query(
            collection(db, "ebooks"),
            where("isPublic", "==", true)
          );
        }
        
        const snapshot = await getDocs(q);
        const fetchedEbooks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ebook));
        
        // 이름순 정렬이면 클라이언트에서 정렬
        if (sort === "name") {
          fetchedEbooks.sort((a, b) => a.title[lang].localeCompare(b.title[lang]));
        }
        
        setEbooks(fetchedEbooks);
      } catch (error) {
        console.error('eBook 데이터 로딩 실패:', error);
        // 에러 발생 시 기본 쿼리로 재시도
        try {
          const q = query(
            collection(db, "ebooks"),
            where("isPublic", "==", true)
          );
          const snapshot = await getDocs(q);
          const fetchedEbooks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ebook));
          setEbooks(fetchedEbooks);
        } catch (retryError) {
          console.error('eBook 데이터 재시도 실패:', retryError);
        }
      }
    }
    fetchEbooks();
  }, [sort, lang]);

  // 검색 필터링
  const filtered = ebooks.filter(e =>
    e.title[lang].toLowerCase().includes(search.toLowerCase()) ||
    e.description[lang].toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="min-h-screen flex" style={{ background: MODERN_BG }}>
        {/* 사이드바 */}
        <aside className="w-64 bg-white/90 backdrop-blur-sm border-r border-gray-200 flex flex-col gap-2 py-12 px-6">
          <h2 className="text-2xl font-bold mb-8 text-gray-800">{TEXT.title[lang]}</h2>
          {SIDEBAR.map(item => (
            <Link key={item.href} href={item.href} className={`block px-4 py-2 rounded-lg hover:bg-blue-50 font-medium text-gray-700 transition-colors ${item.href === "/about-us/ebook-collection" ? "bg-blue-100 text-blue-700" : ""}`}>
              {item.label[lang]}
            </Link>
          ))}
        </aside>
        {/* 본문(책장) */}
        <main className="flex-1 flex flex-col items-center py-8 px-4">
          {/* 헤더 섹션 */}
          <div className="w-full max-w-6xl mb-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 drop-shadow-lg">
                {TEXT.title[lang]}
              </h1>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                {TEXT.desc[lang]}
              </p>
            </div>
            
            {/* 검색 및 정렬 바 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-200 shadow-lg">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder={lang === 'ko' ? "eBook 검색..." : "Search eBooks..."}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    🔍
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      sort === "name" 
                        ? "bg-blue-600 text-white shadow-lg" 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                    }`}
                    onClick={() => setSort("name")}
                  >
                    {lang === 'ko' ? '이름순' : 'Name'}
                  </button>
                  <button
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      sort === "date" 
                        ? "bg-blue-600 text-white shadow-lg" 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                    }`}
                    onClick={() => setSort("date")}
                  >
                    {lang === 'ko' ? '날짜순' : 'Date'}
                  </button>
                </div>
              </div>
            </div>
          </div>

                    {/* 책장 그리드 */}
          <div className="w-full max-w-6xl">
            {filtered.length === 0 ? (
              <div className="text-center text-gray-600 py-16">
                <div className="text-6xl mb-4">📚</div>
                <p className="text-xl">
                  {lang === 'ko' ? '등록된 eBook이 없습니다.' : 'No eBooks found.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filtered.map(ebook => (
                  <div
                    key={ebook.id}
                    className="group cursor-pointer transform hover:scale-105 transition-all duration-300"
                    tabIndex={0}
                    role="button"
                    title={ebook.title[lang]}
                    onClick={() => window.open(`/about-us/ebook-collection/${ebook.id}`, '_blank', 'noopener,noreferrer')}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        window.open(`/about-us/ebook-collection/${ebook.id}`, '_blank', 'noopener,noreferrer');
                      }
                    }}
                  >
                    {/* 책 표지 */}
                    <div className="relative mb-4">
                      <div className="w-full aspect-[3/4] bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg overflow-hidden flex items-center justify-center relative border border-gray-200 group-hover:shadow-2xl transition-all duration-300">
                        {ebook.thumbUrl ? (
                          <Image
                            src={ebook.thumbUrl}
                            alt={ebook.title[lang]}
                            width={200}
                            height={267}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="text-6xl text-gray-400">📄</div>
                        )}
                        {/* 호버 오버레이 */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-2xl">
                            👁️
                          </div>
                        </div>
                      </div>
                      {/* 책장 그림자 효과 */}
                      <div className="absolute -bottom-2 left-2 right-2 h-2 bg-black/10 rounded-full blur-sm"></div>
                    </div>
                    
                    {/* 책 정보 */}
                    <div className="text-center">
                      <h3 className="font-semibold text-sm text-gray-800 mb-1 truncate" title={ebook.title[lang]}>
                        {ebook.title[lang]}
                      </h3>
                      <p className="text-xs text-gray-600 truncate" title={ebook.description[lang]}>
                        {ebook.description[lang]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </MainLayout>
  );
} 