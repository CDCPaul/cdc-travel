"use client";
import Link from "next/link";
import React from "react";
import { useLanguage } from "../../../components/LanguageContext";

const TEXT = {
  title: { ko: "불포함사항 관리", en: "Not Included Items Management" },
  desc: { ko: "불포함사항 관리 기능은 준비중입니다.", en: "Not included items management is under preparation." },
  back: { ko: "DB 관리 대시보드로 돌아가기", en: "Back to DB Management Dashboard" }
};

export default function NotIncludeItemsAdminPage() {
  const { lang } = useLanguage();
  return (
    <div className="max-w-4xl mx-auto py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-6">{TEXT.title[lang]}</h1>
      <div className="border rounded p-4 mb-4 bg-white">{TEXT.desc[lang]}</div>
      <Link href="/admin/db" className="inline-block bg-gray-200 text-gray-800 px-4 py-2 rounded">{TEXT.back[lang]}</Link>
    </div>
  );
} 