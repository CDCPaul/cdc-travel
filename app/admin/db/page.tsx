"use client";
import Link from "next/link";
import { useLanguage } from "../../../components/LanguageContext";

const TEXT = {
  title: { ko: "DB 관리 대시보드", en: "DB Management Dashboard" },
  spot: { ko: "스팟 관리", en: "Spot Management" },
  spotDesc: { ko: "여행 일정에 들어가는 목적지, 식당, 체험 등 관리", en: "Manage destinations, restaurants, experiences, etc. for travel schedules" },
  include: { ko: "포함사항 관리", en: "Included Items Management" },
  includeDesc: { ko: "상품에 포함되는 항목 관리", en: "Manage items included in products" },
  notInclude: { ko: "불포함사항 관리", en: "Not Included Items Management" },
  notIncludeDesc: { ko: "상품에 불포함되는 항목 관리", en: "Manage items not included in products" },
  file: { ko: "파일 관리", en: "File Management" },
  fileDesc: { ko: "이미지/문서 등 파일 업로드 및 관리", en: "Upload and manage files such as images/documents" }
};

export default function AdminDbDashboard() {
  const { lang } = useLanguage();
  return (
    <div className="max-w-4xl mx-auto py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-8">{TEXT.title[lang]}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        <Link href="/admin/spots" className="block border rounded-lg p-6 bg-white hover:shadow transition">
          <div className="text-lg font-semibold mb-2">{TEXT.spot[lang]}</div>
          <div className="text-gray-500 text-sm">{TEXT.spotDesc[lang]}</div>
        </Link>
        <Link href="/admin/include-items" className="block border rounded-lg p-6 bg-white hover:shadow transition">
          <div className="text-lg font-semibold mb-2">{TEXT.include[lang]}</div>
          <div className="text-gray-500 text-sm">{TEXT.includeDesc[lang]}</div>
        </Link>
        <Link href="/admin/not-include-items" className="block border rounded-lg p-6 bg-white hover:shadow transition">
          <div className="text-lg font-semibold mb-2">{TEXT.notInclude[lang]}</div>
          <div className="text-gray-500 text-sm">{TEXT.notIncludeDesc[lang]}</div>
        </Link>
        <Link href="/admin/files" className="block border rounded-lg p-6 bg-white hover:shadow transition">
          <div className="text-lg font-semibold mb-2">{TEXT.file[lang]}</div>
          <div className="text-gray-500 text-sm">{TEXT.fileDesc[lang]}</div>
        </Link>
      </div>
    </div>
  );
} 