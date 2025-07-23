import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "./LanguageContext";
import { useEffect, useRef, useState } from "react";
import { useSiteSettings } from '../lib/settings';

const NAV_LABELS = {
  home: { ko: "홈", en: "Home" },
  about: { ko: "회사소개", en: "About Us" },
  tours: { ko: "투어상품", en: "Tours" },
  info: { ko: "여행정보", en: "Travel Info" },
  contact: { ko: "문의하기", en: "Contact" }
};

export default function Navigation() {
  const { lang, setLang } = useLanguage();
  const navRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { settings } = useSiteSettings();

  useEffect(() => {
    if (navRef.current) {
      const height = navRef.current.offsetHeight;
      document.documentElement.style.setProperty('--navbar-height', `${height}px`);
    }
    const handleResize = () => {
      if (navRef.current) {
        document.documentElement.style.setProperty('--navbar-height', `${navRef.current.offsetHeight}px`);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 모바일 메뉴 항목
  const mobileMenuItems = [
    { href: '/', label: NAV_LABELS.home[lang] },
    { href: '/about-us', label: NAV_LABELS.about[lang] },
    { href: '/tours', label: NAV_LABELS.tours[lang] },
    { href: '/travel-info', label: NAV_LABELS.info[lang] },
    { href: '/contact', label: NAV_LABELS.contact[lang] },
  ];

  const MENU_LABEL = lang === 'ko' ? '메뉴' : 'Menu';

  return (
    <nav ref={navRef} className="bg-white shadow-lg fixed w-full z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3" style={{ minHeight: '60px' }}>
          <div className="flex items-center">
            <Image
              src="/images/CDC_LOGO.webp"
              alt={typeof settings?.siteName === 'object' ? settings.siteName[lang] : settings?.siteName || 'CDC Travel'}
              width={40}
              height={36}
              style={{ objectFit: "contain" }}
              priority
            />
            <span className="ml-2 text-base font-bold text-gray-800">
              {typeof settings?.siteName === 'object' ? settings.siteName[lang] : settings?.siteName || 'CDC TRAVEL'}
            </span>
          </div>
          <div className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-700 hover:text-blue-600 transition-colors">
              {NAV_LABELS.home[lang]}
            </Link>
            <Link href="/about-us" className="text-gray-700 hover:text-blue-600 transition-colors">
              {NAV_LABELS.about[lang]}
            </Link>
            <Link href="/tours" className="text-gray-700 hover:text-blue-600 transition-colors">
              {NAV_LABELS.tours[lang]}
            </Link>
            <Link href="/travel-info" className="text-gray-700 hover:text-blue-600 transition-colors">
              {NAV_LABELS.info[lang]}
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-blue-600 transition-colors">
              {NAV_LABELS.contact[lang]}
            </Link>
          </div>
          <div className="flex items-center gap-2 md:ml-4">
            {/* 세련된 언어 토글 스위치 */}
            <div className="relative inline-flex items-center bg-gray-100 rounded-full p-1 shadow-inner">
              <button
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ease-in-out ${
                  lang === 'ko' 
                    ? 'bg-white text-blue-600 shadow-md transform scale-105' 
                    : 'text-gray-600 hover:text-gray-800'
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
                    ? 'bg-white text-blue-600 shadow-md transform scale-105' 
                    : 'text-gray-600 hover:text-gray-800'
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
          {/* 모바일 햄버거 메뉴 버튼 */}
          <div className="md:hidden">
            <button className="text-gray-700" onClick={() => setMobileMenuOpen(true)} aria-label="메뉴 열기">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* 모바일 메뉴 드로어 */}
      {mobileMenuOpen && (
        <>
          {/* 오버레이 */}
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setMobileMenuOpen(false)} />
          {/* 드로어 */}
          <div className="fixed top-0 right-0 w-64 h-full bg-white shadow-lg z-50 flex flex-col animate-slide-in">
            <div className="flex justify-between items-center p-4 border-b">
              <span className="text-lg font-bold text-gray-800">{MENU_LABEL}</span>
              <button onClick={() => setMobileMenuOpen(false)} aria-label="메뉴 닫기">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col p-4 gap-4">
              {mobileMenuItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-700 text-base font-medium hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          {/* 드로어 애니메이션 */}
          <style jsx global>{`
            @keyframes slide-in {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
            .animate-slide-in {
              animation: slide-in 0.2s ease-out;
            }
          `}</style>
        </>
      )}
    </nav>
  );
} 