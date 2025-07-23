"use client";
import { useLanguage } from "@/components/LanguageContext";
import MainLayout from "@/components/MainLayout";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SIDEBAR = [
  { href: "/about-us", label: { ko: "비전/미션", en: "Vision/Mission" } },
  { href: "/about-us/history", label: { ko: "연혁", en: "History" } },
  { href: "/about-us/team", label: { ko: "대표/팀소개", en: "Team" } },
  { href: "/about-us/office", label: { ko: "오피스/연락처", en: "Office/Contact" } },
  { href: "/about-us/awards", label: { ko: "인증/파트너/수상", en: "Awards/Partners" } },
  { href: "/about-us/ebook-collection", label: { ko: "CDC 비즈니스 eBook관", en: "CDC Business eBook Collection" } },
  { href: "/about-us/contact", label: { ko: "문의/상담", en: "Contact" } },
];

const TEXT = {
  title: { ko: "비전/미션", en: "Vision & Mission" },
  desc: {
    ko: "CDC Travel은 고객 만족을 최우선으로 생각하는 전문 여행사입니다. 안전하고 즐거운 여행을 약속드립니다.",
    en: "CDC Travel is a professional travel company that puts customer satisfaction first. We are committed to providing safe and enjoyable travel experiences."
  },
  vision: {
    ko: "여행을 통해 세상을 넓히고, 고객의 행복을 실현합니다.",
    en: "We broaden the world through travel and realize customer happiness."
  },
  mission: {
    ko: "고객 중심의 맞춤형 여행 서비스 제공, 신뢰와 감동을 주는 여행 파트너가 되겠습니다.",
    en: "We provide customer-centered, tailored travel services and strive to be a trustworthy and inspiring travel partner."
  }
};

export default function AboutUsVisionPage() {
  const { lang } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <MainLayout>
      <div className="min-h-screen flex bg-gray-50">
        {/* 데스크톱 사이드바 */}
        <aside className="hidden md:flex w-64 bg-white border-r flex-col gap-2 py-12 px-6">
          <h2 className="text-2xl font-bold mb-8">{TEXT.title[lang]}</h2>
          {SIDEBAR.map(item => (
            <Link key={item.href} href={item.href} className="block px-4 py-2 rounded hover:bg-blue-50 font-medium text-gray-700">
              {item.label[lang]}
            </Link>
          ))}
        </aside>

        {/* 모바일 햄버거 버튼 */}
        <div className="md:hidden fixed top-20 left-4 z-50">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* 모바일 사이드바 오버레이 */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              {/* 배경 오버레이 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              />
              
              {/* 모바일 사이드바 */}
              <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="md:hidden fixed left-0 top-0 h-full w-80 bg-white shadow-xl z-50 flex flex-col gap-2 py-12 px-6"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold">{TEXT.title[lang]}</h2>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {SIDEBAR.map(item => (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    onClick={() => setIsSidebarOpen(false)}
                    className="block px-4 py-3 rounded hover:bg-blue-50 font-medium text-gray-700"
                  >
                    {item.label[lang]}
                  </Link>
                ))}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* 본문 */}
        <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">{TEXT.title[lang]}</h1>
          <p className="text-base md:text-lg text-gray-700 mb-8 text-center">{TEXT.desc[lang]}</p>
          <section className="bg-white rounded-xl shadow p-6 md:p-8 w-full max-w-2xl flex flex-col gap-8">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold mb-2">{TEXT.vision[lang]}</h2>
              <p className="text-gray-700">{TEXT.mission[lang]}</p>
            </div>
          </section>
        </main>
      </div>
    </MainLayout>
  );
} 