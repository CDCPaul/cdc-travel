"use client";
import { useLanguage } from "@/components/LanguageContext";
import MainLayout from "@/components/MainLayout";
import Link from "next/link";

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
  return (
    <MainLayout>
      <div className="min-h-screen flex bg-gray-50">
        {/* 사이드바 */}
        <aside className="w-64 bg-white border-r flex flex-col gap-2 py-12 px-6">
          <h2 className="text-2xl font-bold mb-8">{TEXT.title[lang]}</h2>
          {SIDEBAR.map(item => (
            <Link key={item.href} href={item.href} className="block px-4 py-2 rounded hover:bg-blue-50 font-medium text-gray-700">
              {item.label[lang]}
            </Link>
          ))}
        </aside>
        {/* 본문 */}
        <main className="flex-1 flex flex-col items-center justify-center p-12">
          <h1 className="text-4xl font-bold mb-6">{TEXT.title[lang]}</h1>
          <p className="text-lg text-gray-700 mb-8">{TEXT.desc[lang]}</p>
          <section className="bg-white rounded-xl shadow p-8 w-full max-w-2xl flex flex-col gap-8">
            <div>
              <h2 className="text-2xl font-semibold mb-2">{TEXT.vision[lang]}</h2>
              <p className="text-gray-700">{TEXT.mission[lang]}</p>
            </div>
          </section>
        </main>
      </div>
    </MainLayout>
  );
} 