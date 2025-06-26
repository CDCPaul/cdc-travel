'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { isAdmin } from '@/lib/auth';
import { useLanguage } from '../../../components/LanguageContext';
import Link from 'next/link';

interface User { email: string; }

const DASHBOARD_TEXTS = {
  ko: {
    title: "CDC Travel 관리자",
    greeting: "안녕하세요, ",
    logout: "로그아웃",
    loading: "로딩 중...",
    adminRequired: "관리자 권한이 필요합니다.",
    productManagement: {
      title: "상품 관리",
      description: "투어 상품 추가/수정",
      action: "상품 관리하기 →"
    },
    travelInfoManagement: {
      title: "여행 정보 관리",
      description: "여행 정보 추가/수정",
      action: "여행 정보 관리하기 →"
    },
    mainPageManagement: {
      title: "메인 페이지 관리",
      description: "배너 영상/이미지 교체",
      action: "메인 페이지 관리하기 →"
    },
    contentManagement: {
      title: "콘텐츠 관리",
      description: "글 작성/수정",
      action: "콘텐츠 관리하기 →"
    },
    fileManagement: {
      title: "파일 관리",
      description: "이미지/영상 업로드",
      action: "파일 관리하기 →"
    },
    siteSettings: {
      title: "사이트 설정",
      description: "기본 설정 관리",
      action: "설정 관리하기 →"
    }
  },
  en: {
    title: "CDC Travel Admin",
    greeting: "Hello, ",
    logout: "Logout",
    loading: "Loading...",
    adminRequired: "Administrator privileges required.",
    productManagement: {
      title: "Product Management",
      description: "Add/Edit Tour Products",
      action: "Manage Products →"
    },
    travelInfoManagement: {
      title: "Travel Info Management",
      description: "Add/Edit Travel Information",
      action: "Manage Travel Info →"
    },
    mainPageManagement: {
      title: "Main Page Management",
      description: "Banner Video/Image Replacement",
      action: "Manage Main Page →"
    },
    contentManagement: {
      title: "Content Management",
      description: "Write/Edit Articles",
      action: "Manage Content →"
    },
    fileManagement: {
      title: "File Management",
      description: "Image/Video Upload",
      action: "Manage Files →"
    },
    siteSettings: {
      title: "Site Settings",
      description: "Basic Settings Management",
      action: "Manage Settings →"
    }
  }
};

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminStatus, setAdminStatus] = useState(false);
  const router = useRouter();
  const { lang } = useLanguage();
  const texts = DASHBOARD_TEXTS[lang];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser({ email: user.email ?? '' });
        const adminCheck = isAdmin(user);
        setAdminStatus(adminCheck);
        
        if (!adminCheck) {
          alert(texts.adminRequired);
          router.push('/admin/login');
          return;
        }
      } else {
        router.push('/admin/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, texts.adminRequired]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">{texts.loading}</div>
      </div>
    );
  }

  if (!user || !adminStatus) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">{texts.title}</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{texts.greeting}{user.email}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                {texts.logout}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 상품 관리 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{texts.productManagement.title}</dt>
                      <dd className="text-lg font-medium text-gray-900">{texts.productManagement.description}</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link href="/admin/products" className="font-medium text-blue-700 hover:text-blue-900">
                    {texts.productManagement.action}
                  </Link>
                </div>
              </div>
            </div>

            {/* 메인 페이지 관리 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{texts.mainPageManagement.title}</dt>
                      <dd className="text-lg font-medium text-gray-900">{texts.mainPageManagement.description}</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link href="/admin/main-page" className="font-medium text-purple-700 hover:text-purple-900">
                    {texts.mainPageManagement.action}
                  </Link>
                </div>
              </div>
            </div>

            {/* 콘텐츠 관리 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{texts.contentManagement.title}</dt>
                      <dd className="text-lg font-medium text-gray-900">{texts.contentManagement.description}</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link href="/admin/content" className="font-medium text-yellow-700 hover:text-yellow-900">
                    {texts.contentManagement.action}
                  </Link>
                </div>
              </div>
            </div>

            {/* 파일 관리 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{texts.fileManagement.title}</dt>
                      <dd className="text-lg font-medium text-gray-900">{texts.fileManagement.description}</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link href="/admin/files" className="font-medium text-red-700 hover:text-red-900">
                    {texts.fileManagement.action}
                  </Link>
                </div>
              </div>
            </div>

            {/* 사이트 설정 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{texts.siteSettings.title}</dt>
                      <dd className="text-lg font-medium text-gray-900">{texts.siteSettings.description}</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link href="/admin/settings" className="font-medium text-gray-700 hover:text-gray-900">
                    {texts.siteSettings.action}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 