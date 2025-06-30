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
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 pl-56 min-h-screen bg-gray-50">
          {children}
        </main>
      </div>
    </LanguageProvider>
  );
} 