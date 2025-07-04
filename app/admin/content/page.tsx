'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useLanguage } from '../../../components/LanguageContext';
import Link from 'next/link';

const CONTENT_TEXTS = {
  ko: {
    title: "콘텐츠 관리",
    subtitle: "개발 진행 중",
    description: "이 페이지는 현재 개발 중입니다. 곧 완성될 예정입니다.",
    backToDashboard: "← 대시보드로 돌아가기",
    comingSoon: "곧 만나요!",
    features: [
      "게시판 관리",
      "콘텐츠 작성 및 편집",
      "카테고리 관리",
      "태그 시스템",
      "이미지 업로드",
      "발행 상태 관리"
    ]
  },
  en: {
    title: "Content Management",
    subtitle: "Under Development",
    description: "This page is currently under development. It will be completed soon.",
    backToDashboard: "← Back to Dashboard",
    comingSoon: "Coming Soon!",
    features: [
      "Board Management",
      "Content Creation & Editing",
      "Category Management",
      "Tag System",
      "Image Upload",
      "Publish Status Management"
    ]
  }
};

export default function AdminContent() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { lang } = useLanguage();
  const texts = CONTENT_TEXTS[lang];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoading(false);
      } else {
        router.push('/admin/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link 
                href="/admin/dashboard"
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                {texts.backToDashboard}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {texts.title}
          </h1>
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">
            {texts.subtitle}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {texts.description}
          </p>
        </div>

        {/* Development Status */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {texts.comingSoon}
            </h3>
            <p className="text-gray-600">
              콘텐츠 관리 시스템이 곧 완성됩니다
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {texts.features.map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{feature}</h4>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
            개발 진행률
          </h3>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div className="bg-blue-600 h-4 rounded-full transition-all duration-1000 ease-out" style={{ width: '25%' }}></div>
          </div>
          <p className="text-center text-gray-600">
            25% 완료 - 기획 및 설계 단계
          </p>
        </div>
      </div>
    </div>
  );
} 