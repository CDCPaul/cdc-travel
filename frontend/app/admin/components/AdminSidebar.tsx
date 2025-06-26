"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "../../../components/LanguageContext";

const MAIN_MENU = {
  ko: [
    { label: "대시보드", href: "/admin/dashboard" },
    { label: "상품 관리", href: "/admin/products" },
    { label: "메인페이지 관리", href: "/admin/main-page" },
    { label: "콘텐츠 관리", href: "/admin/content" },
    { label: "사이트 설정", href: "/admin/settings" },
  ],
  en: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Product Management", href: "/admin/products" },
    { label: "Main Page Management", href: "/admin/main-page" },
    { label: "Content Management", href: "/admin/content" },
    { label: "Site Settings", href: "/admin/settings" },
  ]
};

const DB_MENU = {
  ko: [
    { label: "스팟 관리", href: "/admin/spots" },
    { label: "포함사항 관리", href: "/admin/include-items" },
    { label: "불포함사항 관리", href: "/admin/not-include-items" },
    { label: "파일 관리", href: "/admin/files" },
  ],
  en: [
    { label: "Spot Management", href: "/admin/spots" },
    { label: "Included Items", href: "/admin/include-items" },
    { label: "Not Included Items", href: "/admin/not-include-items" },
    { label: "File Management", href: "/admin/files" },
  ]
};

export default function AdminSidebar() {
  const pathname = usePathname();
  const [dbOpen, setDbOpen] = useState(pathname.startsWith("/admin/spots") || pathname.startsWith("/admin/include-items") || pathname.startsWith("/admin/not-include-items") || pathname.startsWith("/admin/files") || pathname.startsWith("/admin/db"));
  const { lang, setLang } = useLanguage();

  const currentMainMenu = MAIN_MENU[lang];
  const currentDbMenu = DB_MENU[lang];

  return (
    <aside className="h-screen w-56 bg-gray-900 text-white flex flex-col py-8 px-4 fixed left-0 top-0 z-40">
      <div className="text-2xl font-bold mb-10 text-blue-400">CDC Admin</div>
      {/* Debug: 현재 언어 표시 */}
      <div className="text-xs text-gray-400 mb-4">Current Lang: {lang}</div>
      <nav className="flex-1 space-y-2">
        {currentMainMenu.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-4 py-2 rounded transition-colors font-medium
              ${pathname.startsWith(item.href) ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-200'}`}
          >
            {item.label}
          </Link>
        ))}
        {/* DB 관리 아코디언 */}
        <div>
          <button
            className={`w-full flex items-center justify-between px-4 py-2 rounded font-medium transition-colors mt-4 ${dbOpen ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-200 hover:bg-gray-700'}`}
            onClick={() => setDbOpen(open => !open)}
            aria-expanded={dbOpen}
          >
            <span>{lang === 'ko' ? 'DB 관리' : 'DB Management'}</span>
            <span className="ml-2">{dbOpen ? '▲' : '▼'}</span>
          </button>
          {dbOpen && (
            <div className="ml-2 mt-1 space-y-1">
              <Link href="/admin/db" className={`block px-4 py-2 rounded text-sm font-medium ${pathname === '/admin/db' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-200'}`}>
                {lang === 'ko' ? 'DB 관리 대시보드' : 'DB Management Dashboard'}
              </Link>
              {currentDbMenu.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-2 rounded text-sm font-medium
                    ${pathname.startsWith(item.href) ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-200'}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>
      {/* 언어 전환 버튼 (하단) */}
      <div className="mt-10 flex gap-2 justify-center">
        <button
          className={`px-3 py-1 rounded text-sm font-semibold border transition-colors ${lang === 'ko' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-800 text-gray-200 border-gray-600'}`}
          onClick={() => setLang('ko')}
        >
          KOR
        </button>
        <button
          className={`px-3 py-1 rounded text-sm font-semibold border transition-colors ${lang === 'en' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-800 text-gray-200 border-gray-600'}`}
          onClick={() => setLang('en')}
        >
          ENG
        </button>
      </div>
    </aside>
  );
} 