"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { checkAuth, setupTokenRefresh } from "@/lib/auth";
import { LanguageProvider } from "../../components/LanguageContext";
import AdminNavbar from "./components/AdminNavbar";
import TokenMonitor from "../../components/ui/TokenMonitor";

export default function AdminUILayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const tokenRefreshCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // 로그인 페이지는 인증 확인 제외
    if (pathname === "/admin/login") {
      setIsLoading(false);
      return;
    }
    
    console.log('🔐 관리자 레이아웃에서 인증 확인 시작...');
    
    checkAuth().then(user => {
      if (!user) {
        console.log('❌ 인증되지 않은 사용자. 로그인 페이지로 리다이렉트...');
        router.replace("/admin/login");
      } else {
        console.log('✅ 인증된 사용자 확인됨:', user.email);
        
        // 이전 토큰 갱신 설정이 있다면 정리
        if (tokenRefreshCleanupRef.current) {
          console.log('🧹 이전 토큰 갱신 설정 정리...');
          tokenRefreshCleanupRef.current();
        }
        
        // 토큰 자동 갱신 설정
        console.log('🔄 토큰 자동 갱신 설정 시작...');
        const unsubscribe = setupTokenRefresh();
        tokenRefreshCleanupRef.current = unsubscribe;
        setIsLoading(false);
      }
    });

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      if (tokenRefreshCleanupRef.current) {
        console.log('🧹 관리자 레이아웃 언마운트. 토큰 갱신 구독 해제...');
        tokenRefreshCleanupRef.current();
        tokenRefreshCleanupRef.current = null;
      }
    };
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
      {/* 상단 네비게이션 바 */}
      {pathname !== "/admin/login" && <AdminNavbar />}
      
      {/* 메인 콘텐츠 */}
      <main className={pathname !== "/admin/login" ? "pt-0" : ""}>
        {children}
      </main>
      
      {/* 토큰 모니터 (개발 환경에서만 표시) */}
      {pathname !== "/admin/login" && <TokenMonitor />}
    </LanguageProvider>
  );
} 