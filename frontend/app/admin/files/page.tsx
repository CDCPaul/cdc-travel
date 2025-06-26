'use client';

import Link from 'next/link';
import { useLanguage } from "../../../components/LanguageContext";

const TEXT = {
  title: { ko: "파일 관리", en: "File Management" },
  desc: { ko: "파일 관리 기능은 준비중입니다.", en: "File management is under preparation." },
  back: { ko: "DB 관리 대시보드로 돌아가기", en: "Back to DB Management Dashboard" }
};

export default function FilesAdminPage() {
  const { lang } = useLanguage();
  return (
    <div className="max-w-4xl mx-auto py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-6">{TEXT.title[lang]}</h1>
      <div className="border rounded p-6 bg-white mb-4">{TEXT.desc[lang]}</div>
      <Link href="/admin/db" className="inline-block bg-gray-200 text-gray-800 px-4 py-2 rounded">{TEXT.back[lang]}</Link>
    </div>
  );
} 