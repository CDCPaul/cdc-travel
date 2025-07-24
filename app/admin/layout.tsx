"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { checkAuth, setupTokenRefresh } from "@/lib/auth";
import { LanguageProvider } from "../../components/LanguageContext";
import AdminNavbar from "./components/AdminNavbar";
import TokenMonitor from "../../components/ui/TokenMonitor";
import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/outline";

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
      
      {/* 공통 헤더 영역 */}
      {pathname !== "/admin/login" && (
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {getPageTitle(pathname)}
                </h1>
                <p className="text-gray-600">
                  {getPageSubtitle(pathname)}
                </p>
              </div>
              <div className="flex space-x-3">
                {getPageActions(pathname)}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 메인 콘텐츠 */}
      <main className={pathname !== "/admin/login" ? "pt-0" : ""}>
        {children}
      </main>
      
      {/* 토큰 모니터 (개발 환경에서만 표시) */}
      {pathname !== "/admin/login" && <TokenMonitor />}
    </LanguageProvider>
  );
}

// 페이지별 제목 반환 함수
function getPageTitle(pathname: string): string {
  console.log('getPageTitle called with pathname:', pathname);
  
  const pageTitles: { [key: string]: string } = {
    '/admin/dashboard': '대시보드',
    '/admin/bookings': '신규 부킹 관리',
    '/admin/bookings/new': '새 예약 입력',
    '/admin/bookings/confirmed': '확정 부킹 관리',
    '/admin/bookings/confirmed/[id]': '확정 예약 상세보기',
    '/admin/bookings/confirmed/[id]/edit': '확정 예약 수정',
    '/admin/bookings/[id]': '신규부킹 예약 상세보기',
    '/admin/bookings/[id]/edit': '신규부킹 예약 수정',
    '/admin/products': '상품 관리',
    '/admin/spots': '스팟 관리',
    '/admin/destinations': '목적지 관리',
    '/admin/banners': '배너 관리',
    '/admin/posters': '포스터 관리',
    '/admin/letters': '레터 관리',
    '/admin/ta-list': 'TA 관리',
    '/admin/users': '사용자 관리',
    '/admin/users/activity': '사용자 활동',
    '/admin/settings': '설정',
    '/admin/about-us': '회사소개 관리',
    '/admin/about-us/ebooks': 'eBook 관리',
    '/admin/db': 'DB 관리',
    '/admin/files': '파일 관리',
    '/admin/include-items': '포함 항목 관리',
    '/admin/not-include-items': '불포함 항목 관리',
    '/admin/itineraries': '여행 일정 관리',
    '/admin/migrate-spot-countries': '스팟 국가 마이그레이션',
    '/admin/migrate-users': '사용자 마이그레이션',
    '/admin/optimize-images': '이미지 최적화',
    '/admin/travelers': '여행객 관리',
    '/admin/travelers/new': '새 여행객 등록',
  };
  
  // 정확한 경로 먼저 확인
  if (pageTitles[pathname]) {
    console.log('Exact match found:', pathname, '->', pageTitles[pathname]);
    return pageTitles[pathname];
  }
  
  console.log('No exact match, checking dynamic patterns...');
  
  // 동적 라우트 패턴 매칭
  if (pathname.match(/^\/admin\/bookings\/[^\/]+\/edit$/)) {
    console.log('Dynamic edit pattern matched:', pathname);
    return '예약 수정';
  }
  if (pathname.match(/^\/admin\/bookings\/[^\/]+$/) && !pathname.includes('/confirmed/')) {
    console.log('Dynamic detail pattern matched (non-confirmed):', pathname);
    return '신규부킹 예약 상세보기';
  }
  if (pathname.match(/^\/admin\/bookings\/confirmed\/[^\/]+$/)) {
    console.log('Dynamic confirmed detail pattern matched:', pathname);
    return '확정 예약 상세보기';
  }
  
  console.log('No pattern matched, returning default');
  return '관리자 페이지';
}

// 페이지별 부제목 반환 함수
function getPageSubtitle(pathname: string): string {
  const pageSubtitles: { [key: string]: string } = {
    '/admin/dashboard': 'CDC Travel 관리자 대시보드',
    '/admin/bookings': '신규 예약 관리',
    '/admin/bookings/new': '새로운 예약을 등록합니다',
    '/admin/bookings/confirmed': '확정된 예약 관리',
    '/admin/bookings/confirmed/[id]': '확정 예약 상세보기',
    '/admin/bookings/confirmed/[id]/edit': '확정 예약 수정',
    '/admin/bookings/[id]': '신규부킹 예약 상세보기',
    '/admin/bookings/[id]/edit': '신규부킹 예약 수정',
    '/admin/products': '투어 상품 관리',
    '/admin/spots': '관광지 및 스팟 관리',
    '/admin/destinations': '목적지 정보 관리',
    '/admin/banners': '메인 배너 관리',
    '/admin/posters': '포스터 이미지 관리',
    '/admin/letters': '레터 템플릿 관리',
    '/admin/ta-list': 'Travel Agent 관리',
    '/admin/users': '사용자 계정 관리',
    '/admin/users/activity': '사용자 활동 기록 관리',
    '/admin/settings': '시스템 설정',
    '/admin/about-us': '회사 정보 관리',
    '/admin/about-us/ebooks': 'eBook 자료 관리',
    '/admin/db': '데이터베이스 관리',
    '/admin/files': '파일 업로드 관리',
    '/admin/include-items': '투어 포함 항목 관리',
    '/admin/not-include-items': '투어 불포함 항목 관리',
    '/admin/itineraries': '여행 일정 관리',
    '/admin/migrate-spot-countries': '스팟 국가 데이터 마이그레이션',
    '/admin/migrate-users': '사용자 데이터 마이그레이션',
    '/admin/optimize-images': '이미지 최적화 도구',
    '/admin/travelers': '여행객 관리',
    '/admin/travelers/new': '새로운 여행객을 등록합니다',
  };
  
  // 정확한 경로 먼저 확인
  if (pageSubtitles[pathname]) {
    return pageSubtitles[pathname];
  }
  
  // 동적 라우트 패턴 매칭
  if (pathname.match(/^\/admin\/bookings\/[^\/]+\/edit$/)) {
    return '예약 수정';
  }
  if (pathname.match(/^\/admin\/bookings\/[^\/]+$/) && !pathname.includes('/confirmed/')) {
    return '신규부킹 예약 상세보기';
  }
  if (pathname.match(/^\/admin\/bookings\/confirmed\/[^\/]+$/)) {
    return '확정 예약 상세보기';
  }
  
  return '관리자 페이지';
}

// 페이지별 액션 버튼 반환 함수
function getPageActions(pathname: string): React.ReactNode {
  // 정확한 경로 먼저 확인
  switch (pathname) {
    case '/admin/dashboard':
      return (
        <div className="flex items-center space-x-4">
          <select className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="today">오늘</option>
            <option value="yesterday">어제</option>
            <option value="thisWeek">이번 주</option>
            <option value="thisMonth">이번 달</option>
            <option value="lastMonth">지난 달</option>
            <option value="custom">커스텀</option>
          </select>
        </div>
      );
    
    case '/admin/bookings':
      return (
        <Link
          href="/admin/bookings/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          새 예약
        </Link>
      );
    
    case '/admin/bookings/new':
      return (
        <button
          type="submit"
          form="new-booking-form"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          저장
        </button>
      );
    
    case '/admin/bookings/confirmed':
      return null;
    
    case '/admin/products':
      return (
        <Link
          href="/admin/products/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          새 상품
        </Link>
      );
    
    case '/admin/spots':
      return (
        <Link
          href="/admin/spots/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          새 스팟
        </Link>
      );
    
    case '/admin/banners':
      return (
        <Link
          href="/admin/banners/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          새 배너
        </Link>
      );
    
    case '/admin/posters':
      return (
        <Link
          href="/admin/posters/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          새 포스터
        </Link>
      );
    
    case '/admin/letters':
      return (
        <Link
          href="/admin/letters/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          새 레터
        </Link>
      );
    
    case '/admin/ta-list':
      return (
        <Link
          href="/admin/ta-list/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          새 TA
        </Link>
      );
    
    case '/admin/about-us/ebooks':
      return (
        <Link
          href="/admin/about-us/ebooks/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          새 eBook
        </Link>
      );
    
    case '/admin/travelers':
      return (
        <Link
          href="/admin/travelers/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          새 여행객 등록
        </Link>
      );
    
    case '/admin/travelers/new':
      return (
        <button
          type="submit"
          form="new-traveler-form"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          저장
        </button>
      );
  }
  
  // 동적 라우트 패턴 매칭
  if (pathname.match(/^\/admin\/bookings\/[^\/]+\/edit$/)) {
    // pathname에서 id 추출 (예: /admin/bookings/123/edit -> 123)
    return (
      <button
        type="submit"
        form="booking-edit-form"
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
      >
        저장
      </button>
    );
  }
  if (pathname.match(/^\/admin\/bookings\/confirmed\/[^\/]+\/edit$/)) {
    // pathname에서 id 추출 (예: /admin/bookings/confirmed/123/edit -> 123)
    return (
      <button
        type="submit"
        form="confirmed-booking-edit-form"
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
      >
        저장
      </button>
    );
  }
  if (pathname.match(/^\/admin\/bookings\/[^\/]+$/) && !pathname.includes('/confirmed/')) {
    // pathname에서 id 추출 (예: /admin/bookings/123 -> 123)
    const bookingId = pathname.split('/').pop();
    return (
      <div className="flex space-x-3">
        <button
          onClick={async () => {
            try {
              const response = await fetch(`/api/bookings/${bookingId}/confirm`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
              });
              
              if (response.ok) {
                alert('예약이 확정되었습니다.');
                window.location.href = '/admin/bookings/confirmed';
              } else {
                alert('예약 확정에 실패했습니다.');
              }
            } catch (error) {
              console.error('예약 확정 실패:', error);
              alert('예약 확정에 실패했습니다.');
            }
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
        >
          확정
        </button>
        <Link
          href={`/admin/bookings/${bookingId}/edit`}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          수정
        </Link>
      </div>
    );
  }
  if (pathname.match(/^\/admin\/bookings\/confirmed\/[^\/]+$/)) {
    // pathname에서 id 추출 (예: /admin/bookings/confirmed/123 -> 123)
    const confirmedBookingId = pathname.split('/').pop();
    return (
      <Link
        href={`/admin/bookings/confirmed/${confirmedBookingId}/edit`}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
      >
        수정
      </Link>
    );
  }
  
  return null;
} 