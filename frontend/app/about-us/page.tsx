"use client";
import { useLanguage } from "@/components/LanguageContext";
import MainLayout from "@/components/MainLayout";

const TEXT = {
  title: { ko: "회사소개", en: "About Us" },
  desc: {
    ko: "CDC Travel은 고객 만족을 최우선으로 생각하는 전문 여행사입니다. 안전하고 즐거운 여행을 약속드립니다.",
    en: "CDC Travel is a professional travel company that puts customer satisfaction first. We are committed to providing safe and enjoyable travel experiences."
  }
};

export default function AboutUsPage() {
  const { lang } = useLanguage();
  return (
    <MainLayout>
      <main className="bg-gray-50 flex flex-col items-center pt-28 px-4">
        <h1 className="text-4xl font-bold mb-6">{TEXT.title[lang]}</h1>
        <p className="text-lg text-gray-700">{TEXT.desc[lang]}</p>
        <section className="bg-white rounded-xl shadow p-6 w-full max-w-3xl flex flex-col gap-8 mb-12">
          <div>
            <h2 className="text-xl font-semibold mb-2">Company Introduction</h2>
            <div className="text-gray-600 min-h-[60px] italic">(Company introduction will be added soon.)</div>
          </div>
        </section>
      </main>
    </MainLayout>
  );
} 