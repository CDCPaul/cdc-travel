"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageContext";
import MainLayout from "@/components/MainLayout";
import Link from "next/link";

// 다국어 텍스트
const TEXT = {
  languageSwitch: { ko: "English", en: "한국어" },
  lastUpdated: { ko: "최종 업데이트", en: "Last Updated" },
  backToHome: { ko: "홈으로 돌아가기", en: "Back to Home" },
};

const TERMS_OF_SERVICE_KO = {
  title: "서비스 이용약관",
  lastUpdated: "2025년 7월 18일",
  content: `
    <h2>제1조 (목적)</h2>
    <p>이 약관은 CDC Travel(이하 "회사")이 운영하는 웹사이트를 이용함에 있어 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>

    <h2>제2조 (이용자의 정의)</h2>
    <p>"이용자"란 회사의 웹사이트에 접속하여 이 약관에 따라 서비스를 이용하는 자를 말합니다.</p>

    <h2>제3조 (서비스 내용)</h2>
    <p>회사는 여행 관련 콘텐츠, 상품 정보, 회사 소개 등의 콘텐츠를 제공합니다. 현재 고객 대상 로그인 기능은 제공되지 않으며, 관리자 전용 기능만 존재합니다.</p>

    <h2>제4조 (지적 재산권)</h2>
    <p>웹사이트에 게시된 모든 콘텐츠의 저작권은 회사 또는 제공자에게 있으며, 무단 복제 및 배포를 금지합니다.</p>

    <h2>제5조 (책임 제한)</h2>
    <p>회사는 제공하는 정보의 정확성 및 완전성을 보장하지 않으며, 이를 이용함에 따른 책임은 이용자에게 있습니다.</p>

    <h2>제6조 (약관 변경)</h2>
    <p>본 약관은 변경될 수 있으며, 변경 시 웹사이트를 통해 사전 공지합니다. 변경 후에도 서비스를 계속 이용할 경우 변경에 동의한 것으로 간주합니다.</p>

    <h2>제7조 (문의처)</h2>
    <ul>
      <li>회사명: CDC Travel</li>
      <li>담당자: Jessiebel</li>
      <li>이메일: jessiebel@cebudirectclub.com</li>
    </ul>
  `
};

const TERMS_OF_SERVICE_EN = {
  title: "Terms of Service",
  lastUpdated: "July 18, 2025",
  content: `
    <h2>Article 1 (Purpose)</h2>
    <p>These terms and conditions establish the rights, obligations, and responsibilities between CDC Travel (hereinafter "Company") and users when using the website operated by the Company.</p>

    <h2>Article 2 (Definition of Users)</h2>
    <p>"User" refers to any person who accesses the Company's website and uses the services in accordance with these terms and conditions.</p>

    <h2>Article 3 (Service Content)</h2>
    <p>The Company provides travel-related content, product information, company introduction, and other content. Currently, customer login functionality is not provided, and only administrator functions exist.</p>

    <h2>Article 4 (Intellectual Property Rights)</h2>
    <p>All content posted on the website is copyrighted by the Company or content providers, and unauthorized copying and distribution is prohibited.</p>

    <h2>Article 5 (Limitation of Liability)</h2>
    <p>The Company does not guarantee the accuracy and completeness of the information provided, and users are responsible for any consequences arising from its use.</p>

    <h2>Article 6 (Changes to Terms)</h2>
    <p>These terms may be changed, and any changes will be announced in advance through the website. Continued use of the service after changes will be considered as agreement to the changes.</p>

    <h2>Article 7 (Contact Information)</h2>
    <ul>
      <li>Company: CDC Travel</li>
      <li>Contact Person: Jessiebel</li>
      <li>Email: jessiebel@cebudirectclub.com</li>
    </ul>
  `
};

export default function TermsOfServicePage() {
  const { setLang } = useLanguage();
  const [showEnglish, setShowEnglish] = useState(false);

  const currentTerms = showEnglish ? TERMS_OF_SERVICE_EN : TERMS_OF_SERVICE_KO;
  const currentLang = showEnglish ? 'en' : 'ko';

  const handleLanguageSwitch = () => {
    setShowEnglish(!showEnglish);
    setLang(showEnglish ? 'ko' : 'en');
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold text-gray-900">
                {currentTerms.title}
              </h1>
              <button
                onClick={handleLanguageSwitch}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                {TEXT.languageSwitch[currentLang]}
              </button>
            </div>
            <p className="text-gray-600">
              {TEXT.lastUpdated[currentLang]}: {currentTerms.lastUpdated}
            </p>
          </div>

          {/* 내용 */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div 
              className="max-w-none text-gray-800 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-gray-900 [&>h2]:mt-8 [&>h2]:mb-4 [&>p]:mb-4 [&>p]:leading-relaxed [&>ul]:mb-4 [&>ul]:pl-6 [&>li]:mb-2 [&>li]:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: currentTerms.content }}
            />
          </div>

          {/* 하단 버튼 */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {TEXT.backToHome[currentLang]}
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 