import Image from "next/image";
import Link from "next/link";

export default function Navigation() {
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
              홈
            </Link>
            <Link href="/about-us" className="text-gray-700 hover:text-blue-600 transition-colors">
              회사소개
            </Link>
            <Link href="/tours" className="text-gray-700 hover:text-blue-600 transition-colors">
              투어상품
            </Link>
            <Link href="/travel-info" className="text-gray-700 hover:text-blue-600 transition-colors">
              여행정보
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-blue-600 transition-colors">
              문의하기
            </Link>
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