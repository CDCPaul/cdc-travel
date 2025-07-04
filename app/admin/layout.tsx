'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { isAdmin } from '@/lib/auth';
import { LanguageProvider } from "../../components/LanguageContext";
import AdminSidebar from "./components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (pathname === '/admin/login') {
        setLoading(false);
        return;
      }

      if (user) {
        const adminCheck = isAdmin(user);
        if (adminCheck) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          alert('관리자 권한이 필요합니다.');
          router.push('/admin/login');
        }
      } else {
        setIsAuthenticated(false);
        router.push('/admin/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname]);

  // 로그인 페이지는 별도 레이아웃
  if (pathname === '/admin/login') {
    return (
      <LanguageProvider>
        {children}
      </LanguageProvider>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">인증 중...</div>
      </div>
    );
  }

  return (
    <LanguageProvider>
      {/* 모바일 햄버거 버튼 */}
      {!sidebarOpen && (
        <button
          className="fixed top-4 left-4 z-50 p-2 rounded bg-white shadow md:hidden"
          aria-label="Open sidebar"
          onClick={() => setSidebarOpen(true)}
        >
          <svg className="w-7 h-7 text-[#2C6E6F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
      {/* 오버레이 및 사이드바 (모바일) */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar overlay"
          />
          <aside className="fixed top-0 left-0 h-full w-64 z-50 bg-gradient-to-b from-[#1A3A3A] to-[#2C6E6F] shadow-2xl md:hidden animate-slide-in">
            <button
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow"
              aria-label="Close sidebar"
              onClick={() => setSidebarOpen(false)}
            >
              <svg className="w-6 h-6 text-[#2C6E6F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <AdminSidebar />
          </aside>
          <style jsx global>{`
            @keyframes slide-in {
              from { transform: translateX(-100%); }
              to { transform: translateX(0); }
            }
            .animate-slide-in {
              animation: slide-in 0.2s ease-out;
            }
          `}</style>
        </>
      )}
      {/* 데스크탑 사이드바 */}
      <div className="hidden md:block">
        <AdminSidebar />
      </div>
      {/* 메인 컨텐츠 */}
      <div className="md:ml-64">
        {children}
      </div>
    </LanguageProvider>
  );
} 