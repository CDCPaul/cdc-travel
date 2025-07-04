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

const WOOD_BG = "linear-gradient(45deg, #e6c9a8, #d2b48c)"; // 나무색 그라데이션
const BOOK_ICON = "📚"; // 책 이모지로 대체

export default function EbookCollectionPage() {
  const { lang } = useLanguage();
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date"); // date or name

  useEffect(() => {
    async function fetchEbooks() {
      const q = query(
        collection(db, "ebooks"),
        where("isPublic", "==", true),
        orderBy(sort === "date" ? "createdAt" : "title.ko", "desc")
      );
      const snapshot = await getDocs(q);
      setEbooks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ebook)));
    }
    fetchEbooks();
  }, [sort]);

  // 검색 필터링
  const filtered = ebooks.filter(e =>
    e.title[lang].toLowerCase().includes(search.toLowerCase()) ||
    e.description[lang].toLowerCase().includes(search.toLowerCase())
  );

  // 책장 선반(한 줄에 5권씩)
  const shelfRows = [];
  for (let i = 0; i < filtered.length; i += 5) {
    shelfRows.push(filtered.slice(i, i + 5));
  }

  return (
    <MainLayout>
      <div className="min-h-screen flex" style={{ background: WOOD_BG }}>
        {/* 사이드바 */}
        <aside className="w-64 bg-white/80 border-r flex flex-col gap-2 py-12 px-6">
          <h2 className="text-2xl font-bold mb-8 text-[#7b4a1e]">{TEXT.title[lang]}</h2>
          {SIDEBAR.map(item => (
            <Link key={item.href} href={item.href} className={`block px-4 py-2 rounded hover:bg-blue-50 font-medium text-gray-700 ${item.href === "/about-us/ebook-collection" ? "bg-yellow-100" : ""}`}>
              {item.label[lang]}
            </Link>
          ))}
        </aside>
        {/* 본문(책장) */}
        <main className="flex-1 flex flex-col items-center py-8">
          {/* 상단 바 */}
          <div className="w-full max-w-4xl flex items-center gap-4 mb-8 px-2">
            <input
              type="text"
              placeholder="검색 / Search"
              className="flex-1 border rounded px-4 py-2 bg-[#f5e6d0] shadow-inner"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span className="font-bold text-2xl flex items-center gap-2 text-[#7b4a1e] drop-shadow">
              <span className="text-3xl">{BOOK_ICON}</span>
              My Bookcase
            </span>
            <button
              className={`px-3 py-1 rounded font-semibold border ${sort === "name" ? "bg-blue-600 text-white" : "bg-white text-gray-700"}`}
              onClick={() => setSort("name")}
            >Name</button>
            <button
              className={`px-3 py-1 rounded font-semibold border ${sort === "date" ? "bg-blue-600 text-white" : "bg-white text-gray-700"}`}
              onClick={() => setSort("date")}
            >Date</button>
          </div>
          {/* 책장 프레임 */}
          <div className="w-full max-w-4xl rounded-2xl shadow-2xl p-6 border-8 border-[#a97c50] bg-[#e6c9a8bb]" style={{ boxShadow: '0 4px 32px #b98c5a77' }}>
            {shelfRows.length === 0 ? (
              <div className="text-center text-gray-500 py-16">등록된 eBook이 없습니다.<br/>No eBooks found.</div>
            ) : (
              shelfRows.map((row, idx) => (
                <div key={idx} className="relative flex items-end justify-between mb-12 pb-8 last:mb-0 last:pb-0">
                  {row.map(ebook => (
                    <div
                      key={ebook.id}
                      className="flex flex-col items-center w-1/5 px-2 group cursor-pointer"
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
                      <div className="w-full aspect-[3/4] bg-white rounded-lg shadow-xl overflow-hidden flex items-center justify-center mb-2 relative border-2 border-[#d2b48c] group-hover:scale-105 group-hover:shadow-2xl transition-transform">
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
                      </div>
                      <div className="text-center font-semibold text-sm truncate w-full text-[#7b4a1e]" title={ebook.title[lang]}>{ebook.title[lang]}</div>
                      <div className="text-xs text-gray-700 truncate w-full" title={ebook.description[lang]}>{ebook.description[lang]}</div>
                    </div>
                  ))}
                  {/* 빈 공간 채우기 */}
                  {row.length < 5 && Array.from({ length: 5 - row.length }).map((_, i) => (
                    <div key={i} className="w-1/5 px-2" />
                  ))}
                  {/* 선반 bar (CSS로 대체) */}
                  <div className="absolute left-0 bottom-0 w-full h-8 bg-gradient-to-t from-[#a97c50] to-[#8b6b3a] rounded-b pointer-events-none select-none" style={{ zIndex: 1 }} />
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </MainLayout>
  );
} 