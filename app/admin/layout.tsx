"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { checkAuth } from "@/lib/auth";
import { LanguageProvider } from "../../components/LanguageContext";
import AdminSidebar from "./components/AdminSidebar";

export default function AdminUILayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // 로그인 페이지는 인증 확인 제외
    if (pathname === "/admin/login") {
      setIsLoading(false);
      return;
    }
    checkAuth().then(user => {
      if (!user) {
        router.replace("/admin/login");
      } else {
        setIsLoading(false);
      }
    });
  }, [router, pathname]);

  if (isLoading) {
    return (
      <LanguageProvider>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">인증 확인 중...</p>
          </div>
        </div>
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      {/* 모바일 햄버거 버튼 */}
      {pathname !== "/admin/login" && (
        <button
          className="fixed top-4 left-4 z-50 block md:hidden bg-[#1A3A3A] border-2 border-[#7FC4C5] rounded-lg p-2 shadow hover:bg-[#2C6E6F] hover:border-white transition-colors"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">메뉴 열기</span>
          <svg width="28" height="28" fill="none" stroke="#7FC4C5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="24" height="24" rx="6" fill="none"/>
            <line x1="8" y1="10" x2="20" y2="10" />
            <line x1="8" y1="14" x2="20" y2="14" />
            <line x1="8" y1="18" x2="20" y2="18" />
          </svg>
        </button>
      )}
      {/* 모바일 사이드바 오버레이 */}
      {sidebarOpen && pathname !== "/admin/login" && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute left-0 top-0 h-full w-64 bg-gradient-to-b from-[#1A3A3A] to-[#2C6E6F] shadow-2xl" onClick={e => e.stopPropagation()}>
            <AdminSidebar />
            <button
              className="absolute top-4 right-4 text-white bg-black/30 rounded-full p-2 hover:bg-black/60 transition"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">메뉴 닫기</span>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        </div>
      )}
      {/* 데스크탑 사이드바 */}
      {pathname !== "/admin/login" && (
        <div className="hidden md:block">
          <AdminSidebar />
        </div>
      )}
      <div className={pathname !== "/admin/login" ? "md:ml-64" : ""}>
        {children}
      </div>
    </LanguageProvider>
  );
} 