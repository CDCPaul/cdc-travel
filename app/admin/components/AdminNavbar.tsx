"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useLanguage } from "../../../components/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "../../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

// 드롭다운 화살표 아이콘
const ChevronDownIcon = ({ isOpen }: { isOpen: boolean }) => (
  <motion.svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    animate={{ rotate: isOpen ? 180 : 0 }}
    transition={{ duration: 0.2 }}
  >
    <polyline points="6,9 12,15 18,9" />
  </motion.svg>
);

// 햄버거 메뉴 아이콘
const HamburgerIcon = ({ isOpen }: { isOpen: boolean }) => (
  <div className="w-6 h-6 flex flex-col justify-center items-center">
    <motion.span
      className="w-5 h-0.5 bg-current block"
      animate={{ rotate: isOpen ? 45 : 0, y: isOpen ? 6 : 0 }}
      transition={{ duration: 0.2 }}
    />
    <motion.span
      className="w-5 h-0.5 bg-current block mt-1"
      animate={{ opacity: isOpen ? 0 : 1 }}
      transition={{ duration: 0.2 }}
    />
    <motion.span
      className="w-5 h-0.5 bg-current block mt-1"
      animate={{ rotate: isOpen ? -45 : 0, y: isOpen ? -6 : 0 }}
      transition={{ duration: 0.2 }}
    />
  </div>
);

const MAIN_MENU = {
  ko: [
    { label: "대시보드", href: "/admin/dashboard" },
  ],
  en: [
    { label: "Dashboard", href: "/admin/dashboard" },
  ]
};

const BOOKING_MENU = {
  ko: [
    { label: "신규부킹목록", href: "/admin/bookings" },
    { label: "확정예약목록", href: "/admin/bookings/confirmed" },
  ],
  en: [
    { label: "New Booking List", href: "/admin/bookings" },
    { label: "Confirmed Bookings", href: "/admin/bookings/confirmed" },
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

const TA_MENU = {
  ko: [
    { label: "TA 목록", href: "/admin/ta-list" },
    { label: "전단지 관리", href: "/admin/posters" },
    { label: "IT 관리", href: "/admin/itineraries" },
    { label: "레터 관리", href: "/admin/letters" },
  ],
  en: [
    { label: "TA List", href: "/admin/ta-list" },
    { label: "Poster Management", href: "/admin/posters" },
    { label: "IT Management", href: "/admin/itineraries" },
    { label: "Letter Management", href: "/admin/letters" },
  ]
};

const SITE_SETTINGS_MENU = {
  ko: [
    { label: "배너 관리", href: "/admin/banners" },
    { label: "사이트 설정", href: "/admin/settings" },
  ],
  en: [
    { label: "Banner Management", href: "/admin/banners" },
    { label: "Site Settings", href: "/admin/settings" },
  ]
};

const DB_MENU = {
  ko: [
    { label: "상품 관리", href: "/admin/products" },
    { label: "스팟 관리", href: "/admin/spots" },
    { label: "포함사항 관리", href: "/admin/include-items" },
    { label: "불포함사항 관리", href: "/admin/not-include-items" },
    { label: "파일 관리", href: "/admin/files" },
    { label: "여행객 관리", href: "/admin/travelers" },
  ],
  en: [
    { label: "Product Management", href: "/admin/products" },
    { label: "Spot Management", href: "/admin/spots" },
    { label: "Included Items", href: "/admin/include-items" },
    { label: "Not Included Items", href: "/admin/not-include-items" },
    { label: "File Management", href: "/admin/files" },
    { label: "Traveler Management", href: "/admin/travelers" },
  ]
};

const USER_MENU = {
  ko: [
    { label: "사용자 목록", href: "/admin/users" },
    { label: "사용자 활동", href: "/admin/users/activity" },
    { label: "사용자 마이그레이션", href: "/admin/migrate-users" },
  ],
  en: [
    { label: "User List", href: "/admin/users" },
    { label: "User Activity", href: "/admin/users/activity" },
    { label: "User Migration", href: "/admin/migrate-users" },
  ]
};

export default function AdminNavbar() {
  const pathname = usePathname();
  const { lang, setLang } = useLanguage();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  // 드롭다운 상태 관리
  const [bookingOpen, setBookingOpen] = useState(false);
  const [aboutUsOpen, setAboutUsOpen] = useState(false);
  const [taOpen, setTaOpen] = useState(false);
  const [dbOpen, setDbOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [siteSettingsOpen, setSiteSettingsOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserEmail(user?.email || null);
    });
    return () => unsubscribe();
  }, []);

  // 현재 경로에 따라 드롭다운 상태 자동 설정
  useEffect(() => {
    const currentPath = pathname;
    
    setBookingOpen(currentPath.startsWith("/admin/bookings"));
    setAboutUsOpen(currentPath.startsWith("/admin/about-us"));
    setTaOpen(["/admin/ta-list", "/admin/posters", "/admin/itineraries", "/admin/letters"].some(path => currentPath.startsWith(path)));
    setDbOpen(["/admin/products", "/admin/spots", "/admin/include-items", "/admin/not-include-items", "/admin/files", "/admin/travelers"].some(path => currentPath.startsWith(path)));
    setUserOpen(["/admin/users", "/admin/migrate-users"].some(path => currentPath.startsWith(path)));
    setSiteSettingsOpen(["/admin/banners", "/admin/settings"].some(path => currentPath.startsWith(path)));
  }, [pathname]);

  // 드롭다운 토글 함수들
  const toggleAboutUs = () => {
    setAboutUsOpen(!aboutUsOpen);
    setBookingOpen(false);
    setTaOpen(false);
    setDbOpen(false);
    setUserOpen(false);
    setSiteSettingsOpen(false);
  };

  const toggleBooking = () => {
    setBookingOpen(!bookingOpen);
    setAboutUsOpen(false);
    setTaOpen(false);
    setDbOpen(false);
    setUserOpen(false);
    setSiteSettingsOpen(false);
  };

  const toggleTa = () => {
    setTaOpen(!taOpen);
    setBookingOpen(false);
    setAboutUsOpen(false);
    setDbOpen(false);
    setUserOpen(false);
    setSiteSettingsOpen(false);
  };

  const toggleDb = () => {
    setDbOpen(!dbOpen);
    setBookingOpen(false);
    setAboutUsOpen(false);
    setTaOpen(false);
    setUserOpen(false);
    setSiteSettingsOpen(false);
  };

  const toggleUser = () => {
    setUserOpen(!userOpen);
    setBookingOpen(false);
    setAboutUsOpen(false);
    setTaOpen(false);
    setDbOpen(false);
    setSiteSettingsOpen(false);
  };

  const toggleSiteSettings = () => {
    setSiteSettingsOpen(!siteSettingsOpen);
    setBookingOpen(false);
    setAboutUsOpen(false);
    setTaOpen(false);
    setDbOpen(false);
    setUserOpen(false);
  };

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setBookingOpen(false);
        setAboutUsOpen(false);
        setTaOpen(false);
        setDbOpen(false);
        setUserOpen(false);
        setSiteSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    await fetch('/api/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const currentMainMenu = MAIN_MENU[lang];
  const currentTaMenu = TA_MENU[lang];
  const currentDbMenu = DB_MENU[lang];
  const currentUserMenu = USER_MENU[lang];
  const currentAboutUsMenu = ABOUT_US_MENU[lang];
  const currentSiteSettingsMenu = SITE_SETTINGS_MENU[lang];
  const currentBookingMenu = BOOKING_MENU[lang];

  if (!userEmail) {
    return null;
  }

  return (
    <>
      {/* 상단 네비게이션 바 */}
      <nav className="bg-gradient-to-r from-[#1A3A3A] to-[#2C6E6F] text-white shadow-lg fixed top-0 left-0 right-0 z-50">
        <div className="max-w-[1980px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 왼쪽: 로고와 ADMIN PANEL */}
            <div className="flex items-center">
              <Link href="/admin/dashboard" className="flex items-center space-x-3">
                <div className="relative h-8 w-24">
                  <Image
                    src="/images/CDC_LOGO.webp"
                    alt="CDC Travel Admin"
                    fill
                    className="object-contain"
                    priority
                    sizes="96px"
                  />
                </div>
                <span className="text-[#7FC4C5] text-sm font-medium tracking-wider hidden sm:block">
                  ADMIN PANEL
                </span>
              </Link>
            </div>

            {/* 중앙: 데스크탑 메뉴 */}
            <div className="hidden lg:flex items-center space-x-1">
              {/* 메인 메뉴 */}
              {currentMainMenu.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname.startsWith(item.href)
                      ? 'bg-white text-[#2C6E6F]'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              {/* 회사소개 드롭다운 */}
              <div className="relative dropdown-container">
                <button
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                    aboutUsOpen
                      ? 'bg-white text-[#2C6E6F]'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                  onClick={toggleAboutUs}
                >
                  <span>{lang === 'ko' ? '회사소개' : 'About Us'}</span>
                  <ChevronDownIcon isOpen={aboutUsOpen} />
                </button>
                <AnimatePresence>
                  {aboutUsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-50"
                    >
                      {currentAboutUsMenu.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 예약 관리 드롭다운 */}
              <div className="relative dropdown-container">
                <button
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                    bookingOpen
                      ? 'bg-white text-[#2C6E6F]'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                  onClick={toggleBooking}
                >
                  <span>{lang === 'ko' ? '예약 관리' : 'Booking'}</span>
                  <ChevronDownIcon isOpen={bookingOpen} />
                </button>
                <AnimatePresence>
                  {bookingOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-50"
                    >
                      {currentBookingMenu.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* DB 관리 드롭다운 */}
              <div className="relative dropdown-container">
                <button
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                    dbOpen
                      ? 'bg-white text-[#2C6E6F]'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                  onClick={toggleDb}
                >
                  <span>{lang === 'ko' ? 'DB 관리' : 'DB'}</span>
                  <ChevronDownIcon isOpen={dbOpen} />
                </button>
                <AnimatePresence>
                  {dbOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-50"
                    >
                      {currentDbMenu.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* TA 관리 드롭다운 */}
              <div className="relative dropdown-container">
                <button
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                    taOpen
                      ? 'bg-white text-[#2C6E6F]'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                  onClick={toggleTa}
                >
                  <span>{lang === 'ko' ? 'TA 관리' : 'TA'}</span>
                  <ChevronDownIcon isOpen={taOpen} />
                </button>
                <AnimatePresence>
                  {taOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-50"
                    >
                      {currentTaMenu.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 사용자 관리 드롭다운 */}
              <div className="relative dropdown-container">
                <button
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                    userOpen
                      ? 'bg-white text-[#2C6E6F]'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                  onClick={toggleUser}
                >
                  <span>{lang === 'ko' ? '사용자' : 'Users'}</span>
                  <ChevronDownIcon isOpen={userOpen} />
                </button>
                <AnimatePresence>
                  {userOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-50"
                    >
                      {currentUserMenu.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 사이트설정 드롭다운 */}
              <div className="relative dropdown-container">
                <button
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                    siteSettingsOpen
                      ? 'bg-white text-[#2C6E6F]'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                  onClick={toggleSiteSettings}
                >
                  <span>{lang === 'ko' ? '설정' : 'Settings'}</span>
                  <ChevronDownIcon isOpen={siteSettingsOpen} />
                </button>
                <AnimatePresence>
                  {siteSettingsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-50"
                    >
                      {currentSiteSettingsMenu.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* 오른쪽: 언어 설정, 사용자 정보, 로그아웃 */}
            <div className="flex items-center space-x-4">
              {/* 언어 전환 */}
              <div className="hidden sm:flex items-center space-x-2">
                <button
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    lang === 'ko' 
                      ? 'bg-white text-[#2C6E6F]' 
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
                </button>
                <button
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    lang === 'en' 
                      ? 'bg-white text-[#2C6E6F]' 
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
                </button>
              </div>

              {/* 사용자 정보 */}
              <div className="hidden sm:block text-sm text-white/80">
                {userEmail}
              </div>

              {/* 로그아웃 버튼 */}
              <button
                onClick={handleLogout}
                className="bg-[#7FC4C5] text-[#1A3A3A] font-bold px-3 py-1 rounded text-sm hover:bg-[#5A7A7A] transition-colors"
              >
                로그아웃
              </button>

              {/* 모바일 메뉴 버튼 */}
              <button
                className="lg:hidden p-2 rounded-md text-white hover:bg-white/10"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <HamburgerIcon isOpen={mobileMenuOpen} />
              </button>
            </div>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-[#1A3A3A] border-t border-[#3A8A8B]/30"
            >
              <div className="px-4 py-2 space-y-1">
                {/* 메인 메뉴 */}
                {currentMainMenu.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      pathname.startsWith(item.href)
                        ? 'bg-white text-[#2C6E6F]'
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}

                {/* 회사소개 */}
                <div className="border-t border-[#3A8A8B]/30 pt-2">
                  <div className="px-3 py-2 text-sm font-medium text-white/70">
                    {lang === 'ko' ? '회사소개' : 'About Us'}
                  </div>
                  {currentAboutUsMenu.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-6 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                {/* 예약 관리 */}
                <div className="border-t border-[#3A8A8B]/30 pt-2">
                  <div className="px-3 py-2 text-sm font-medium text-white/70">
                    {lang === 'ko' ? '예약 관리' : 'Booking Management'}
                  </div>
                  {currentBookingMenu.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-6 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                {/* DB 관리 */}
                <div className="border-t border-[#3A8A8B]/30 pt-2">
                  <div className="px-3 py-2 text-sm font-medium text-white/70">
                    {lang === 'ko' ? 'DB 관리' : 'DB Management'}
                  </div>
                  {currentDbMenu.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-6 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                {/* TA 관리 */}
                <div className="border-t border-[#3A8A8B]/30 pt-2">
                  <div className="px-3 py-2 text-sm font-medium text-white/70">
                    {lang === 'ko' ? 'TA 관리' : 'TA Management'}
                  </div>
                  {currentTaMenu.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-6 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                {/* 사용자 관리 */}
                <div className="border-t border-[#3A8A8B]/30 pt-2">
                  <div className="px-3 py-2 text-sm font-medium text-white/70">
                    {lang === 'ko' ? '사용자 관리' : 'User Management'}
                  </div>
                  {currentUserMenu.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-6 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                {/* 사이트설정 */}
                <div className="border-t border-[#3A8A8B]/30 pt-2">
                  <div className="px-3 py-2 text-sm font-medium text-white/70">
                    {lang === 'ko' ? '사이트설정' : 'Site Settings'}
                  </div>
                  {currentSiteSettingsMenu.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-6 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* 상단 여백 (네비게이션 바 높이만큼) */}
      <div className="h-16"></div>
    </>
  );
} 