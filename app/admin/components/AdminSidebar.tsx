"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useLanguage } from "../../../components/LanguageContext";
import { motion } from "framer-motion";
import { auth } from "../../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

const MAIN_MENU = {
  ko: [
    { label: "대시보드", href: "/admin/dashboard" },
    { label: "배너 관리", href: "/admin/banners" },
    { label: "상품 관리", href: "/admin/products" },
    { label: "TA 관리", href: "/admin/ta-list" },
    { label: "회사소개 관리", href: "/admin/about-us" },
    { label: "사이트 설정", href: "/admin/settings" },
    { label: "사용자 마이그레이션", href: "/admin/migrate-users" },
  ],
  en: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Banner Management", href: "/admin/banners" },
    { label: "Product Management", href: "/admin/products" },
    { label: "TA Management", href: "/admin/ta-list" },
    { label: "About Us Management", href: "/admin/about-us" },
    { label: "Site Settings", href: "/admin/settings" },
    { label: "User Migration", href: "/admin/migrate-users" },
  ]
};

const ABOUT_US_MENU = {
  ko: [
    { label: "eBook 관리", href: "/admin/about-us/ebooks" },
  ],
  en: [
    { label: "Ebook Management", href: "/admin/about-us/ebooks" },
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
  const [aboutUsOpen, setAboutUsOpen] = useState(pathname.startsWith("/admin/about-us"));
  const { lang, setLang } = useLanguage();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserEmail(user?.email || null);
    });
    return () => unsubscribe();
  }, []);

  if (!userEmail) {
    // 로그인하지 않은 경우 사이드바를 렌더링하지 않음
    return null;
  }

  const handleLogout = async () => {
    await signOut(auth);
    await fetch('/api/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const currentMainMenu = MAIN_MENU[lang];
  const currentDbMenu = DB_MENU[lang];
  const currentAboutUsMenu = ABOUT_US_MENU[lang];

  return (
    <aside className="h-screen w-64 bg-gradient-to-b from-[#1A3A3A] to-[#2C6E6F] text-white flex flex-col fixed left-0 top-0 z-40 shadow-2xl">
      {/* 로고 영역 */}
      <div className="p-6 border-b border-[#3A8A8B]/30">
        <Link href="/admin/dashboard" className="block">
          <div className="relative h-12 w-40 mx-auto mb-3">
            <Image
              src="/images/CDC_LOGO.webp"
              alt="CDC Travel Admin"
              fill
              className="object-contain"
              priority
              sizes="160px"
            />
          </div>
          <div className="text-center text-[#7FC4C5] text-sm font-medium tracking-wider">
            ADMIN PANEL
          </div>
        </Link>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto w-72 min-w-[18rem]">
        {currentMainMenu.map((item, index) => (
          item.href === "/admin/about-us" ? (
            <motion.div 
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <button
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-all duration-300 group whitespace-nowrap text-base ${
                  aboutUsOpen 
                    ? 'bg-white/20 text-white shadow-lg' 
                    : 'hover:bg-white/10 text-white/90 hover:text-white'
                }`}
                onClick={() => setAboutUsOpen(open => !open)}
                aria-expanded={aboutUsOpen}
              >
                <span className="whitespace-nowrap">{item.label}</span>
                <motion.span 
                  animate={{ rotate: aboutUsOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm"
                >
                  ▼
                </motion.span>
              </button>
              {aboutUsOpen && (
                <motion.div 
                  className="ml-4 mt-2 space-y-1"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentAboutUsMenu.map(sub => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                        pathname.startsWith(sub.href) 
                          ? 'bg-white/20 text-white shadow-md' 
                          : 'hover:bg-white/10 text-white/80 hover:text-white'
                      }`}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-300 font-medium whitespace-nowrap text-base ${
                  pathname.startsWith(item.href) 
                    ? 'bg-white text-[#2C6E6F] shadow-lg' 
                    : 'hover:bg-white/10 text-white/90 hover:text-white'
                }`}
              >
                <span className="whitespace-nowrap">{item.label}</span>
                {pathname.startsWith(item.href) && (
                  <motion.div 
                    className="ml-auto w-1 h-6 bg-[#7FC4C5] rounded-full"
                    layoutId="activeIndicator"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            </motion.div>
          )
        ))}
        
        {/* DB 관리 아코디언 */}
        <motion.div 
          className="pt-4 mt-4 border-t border-[#3A8A8B]/30"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <button
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-all duration-300 group whitespace-nowrap text-base ${
              dbOpen 
                ? 'bg-white/20 text-white shadow-lg' 
                : 'hover:bg-white/10 text-white/90 hover:text-white'
            }`}
            onClick={() => setDbOpen(open => !open)}
            aria-expanded={dbOpen}
          >
            <span className="whitespace-nowrap">{lang === 'ko' ? 'DB 관리' : 'DB Management'}</span>
            <motion.span 
              animate={{ rotate: dbOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="text-sm"
            >
              ▼
            </motion.span>
          </button>
          {dbOpen && (
            <motion.div 
              className="ml-4 mt-2 space-y-1"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Link 
                href="/admin/db" 
                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                  pathname === '/admin/db' 
                    ? 'bg-white/20 text-white shadow-md' 
                    : 'hover:bg-white/10 text-white/80 hover:text-white'
                }`}
              >
                {lang === 'ko' ? 'DB 관리 대시보드' : 'DB Management Dashboard'}
              </Link>
              {currentDbMenu.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                    pathname.startsWith(item.href) 
                      ? 'bg-white/20 text-white shadow-md' 
                      : 'hover:bg-white/10 text-white/80 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </motion.div>
          )}
        </motion.div>
      </nav>
      
      {/* 언어 전환 버튼 (하단) */}
      <div className="p-6 border-t border-[#3A8A8B]/30">
        <div className="flex justify-center">
          {/* 세련된 언어 토글 스위치 */}
          <div className="relative inline-flex items-center bg-white/10 rounded-full p-1 shadow-inner backdrop-blur-sm">
            <button
              className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ease-in-out ${
                lang === 'ko' 
                  ? 'bg-white text-[#2C6E6F] shadow-md transform scale-105' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              onClick={() => setLang('ko')}
            >
              <Image 
                src="/images/KR.webp" 
                alt="한국어" 
                width={16} 
                height={12} 
                className="w-4 h-3 rounded-sm"
              />
              <span className="hidden sm:inline">한국어</span>
            </button>
            <button
              className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ease-in-out ${
                lang === 'en' 
                  ? 'bg-white text-[#2C6E6F] shadow-md transform scale-105' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              onClick={() => setLang('en')}
            >
              <Image 
                src="/images/PH.webp" 
                alt="English" 
                width={16} 
                height={12} 
                className="w-4 h-3 rounded-sm"
              />
              <span className="hidden sm:inline">English</span>
            </button>
          </div>
        </div>
      </div>

      {/* 하단: 로그인 정보 및 로그아웃 */}
      <div className="mt-auto p-4 border-t border-[#3A8A8B]/30 text-sm text-white/80">
        {userEmail && (
          <div className="mb-2 truncate">로그인: {userEmail}</div>
        )}
        <button
          onClick={handleLogout}
          className="w-full bg-[#7FC4C5] text-[#1A3A3A] font-bold py-2 rounded hover:bg-[#5A7A7A] transition-colors mt-2"
        >
          로그아웃
        </button>
      </div>
    </aside>
  );
} 