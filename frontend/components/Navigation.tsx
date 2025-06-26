import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "./LanguageContext";

const NAV_LABELS = {
  home: { ko: "홈", en: "Home" },
  about: { ko: "회사소개", en: "About Us" },
  tours: { ko: "투어상품", en: "Tours" },
  info: { ko: "여행정보", en: "Travel Info" },
  contact: { ko: "문의하기", en: "Contact" }
};

export default function Navigation() {
  const { lang, setLang } = useLanguage();
  return (
    <nav className="bg-white shadow-lg fixed w-full z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-1">
          <div className="flex items-center">
            <Image
              src="/images/CDC_LOGO.png"
              alt="CDC Travel"
              width={72}
              height={24}
              className="h-6 w-auto"
              priority
              style={{ width: "auto", height: "auto" }}
            />
            <span className="ml-2 text-lg font-bold text-gray-800">CDC TRAVEL</span>
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
            <button
              className={`px-3 py-1 rounded text-sm font-semibold border transition-colors ${lang === 'ko' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
              onClick={() => setLang('ko')}
            >
              KOR
            </button>
            <button
              className={`px-3 py-1 rounded text-sm font-semibold border transition-colors ${lang === 'en' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
              onClick={() => setLang('en')}
            >
              ENG
            </button>
          </div>
          <div className="md:hidden">
            <button className="text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 