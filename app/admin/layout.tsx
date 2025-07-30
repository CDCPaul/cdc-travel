"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { setupTokenRefresh } from "@/lib/auth";
import { useLanguage } from "../../components/LanguageContext";
import AdminNavbar from "./components/AdminNavbar";
import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";

export default function AdminUILayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const tokenRefreshCleanupRef = useRef<(() => void) | null>(null);
  const { user, loading: authLoading } = useAuth();
  const { lang } = useLanguage();

  useEffect(() => {
    // 로그인 페이지는 인증 확인 제외
    if (pathname === "/admin/login") {
      setIsLoading(false);
      return;
    }
    
    // AuthContext에서 로딩 상태 확인
    if (authLoading) {
      return;
    }
    
    console.log('🔐 관리자 레이아웃에서 인증 확인 시작...');
    
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
      
      // 토큰 자동 갱신 설정 (더 안정적인 방식)
      console.log('🔄 토큰 자동 갱신 설정 시작...');
      try {
        const unsubscribe = setupTokenRefresh();
        tokenRefreshCleanupRef.current = unsubscribe;
      } catch (error) {
        console.error('❌ 토큰 갱신 설정 실패:', error);
        // 토큰 갱신 설정 실패해도 페이지는 계속 사용 가능
      }
      setIsLoading(false);
    }

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      if (tokenRefreshCleanupRef.current) {
        console.log('🧹 관리자 레이아웃 언마운트. 토큰 갱신 구독 해제...');
        tokenRefreshCleanupRef.current();
        tokenRefreshCleanupRef.current = null;
      }
    };
  }, [router, pathname, user, authLoading]);

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{lang === 'ko' ? '인증 확인 중...' : 'Verifying authentication...'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 상단 네비게이션 바 */}
      {pathname !== "/admin/login" && <AdminNavbar />}
      
      {/* 공통 헤더 영역 */}
      {pathname !== "/admin/login" && (
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {getPageTitle(pathname, lang)}
                </h1>
                <p className="text-gray-600">
                  {getPageSubtitle(pathname, lang)}
                </p>
              </div>
              <div className="flex space-x-3">
                {getPageActions(pathname, lang)}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 메인 콘텐츠 */}
      <main className={pathname !== "/admin/login" ? "pt-0" : ""}>
        {children}
      </main>
    </>
  );
}

// 페이지별 제목 반환 함수
function getPageTitle(pathname: string, lang: 'ko' | 'en'): string {
  const pageTitles: { [key: string]: { ko: string; en: string } } = {
    '/admin/dashboard': { ko: '대시보드', en: 'Dashboard' },
    '/admin/bookings': { ko: '신규 부킹 관리', en: 'New Booking Management' },
    '/admin/bookings/new': { ko: '새 예약 등록', en: 'New Booking Registration' },
    '/admin/bookings/confirmed': { ko: '확정 예약 관리', en: 'Confirmed Booking Management' },
    '/admin/bookings/confirmed/[id]': { ko: '확정 예약 상세보기', en: 'Confirmed Booking Details' },
    '/admin/bookings/confirmed/[id]/edit': { ko: '확정 예약 수정', en: 'Edit Confirmed Booking' },
    '/admin/bookings/[id]': { ko: '신규부킹 예약 상세보기', en: 'New Booking Details' },
    '/admin/bookings/[id]/edit': { ko: '신규부킹 예약 수정', en: 'Edit New Booking' },
    '/admin/products': { ko: '투어 상품 관리', en: 'Tour Product Management' },
    '/admin/spots': { ko: '관광지 및 스팟 관리', en: 'Tourist Spots Management' },
    '/admin/destinations': { ko: '목적지 정보 관리', en: 'Destination Information Management' },
    '/admin/banners': { ko: '메인 배너 관리', en: 'Main Banner Management' },
    '/admin/posters': { ko: '포스터 이미지 관리', en: 'Poster Image Management' },
    '/admin/letters': { ko: '레터 템플릿 관리', en: 'Letter Template Management' },
    '/admin/ta-list': { ko: 'Travel Agent 관리', en: 'Travel Agent Management' },
    '/admin/ta-list/send-email': { ko: '이메일 보내기', en: 'Send Email' },
    '/admin/users': { ko: '사용자 계정 관리', en: 'User Account Management' },
    '/admin/users/activity': { ko: '사용자 활동 기록 관리', en: 'User Activity Log Management' },
    '/admin/settings': { ko: '시스템 설정', en: 'System Settings' },
    '/admin/about-us': { ko: '회사 정보 관리', en: 'Company Information Management' },
    '/admin/about-us/ebooks': { ko: 'eBook 자료 관리', en: 'eBook Material Management' },
    '/admin/db': { ko: '데이터베이스 관리', en: 'Database Management' },
    '/admin/files': { ko: '파일 업로드 관리', en: 'File Upload Management' },
    '/admin/include-items': { ko: '투어 포함 항목 관리', en: 'Tour Included Items Management' },
    '/admin/not-include-items': { ko: '투어 불포함 항목 관리', en: 'Tour Excluded Items Management' },
    '/admin/itineraries': { ko: '여행 일정 관리', en: 'Travel Itinerary Management' },
    '/admin/migrate-spot-countries': { ko: '스팟 국가 데이터 마이그레이션', en: 'Spot Country Data Migration' },
    '/admin/migrate-users': { ko: '사용자 데이터 마이그레이션', en: 'User Data Migration' },
    '/admin/optimize-images': { ko: '이미지 최적화', en: 'Image Optimization' },
    '/admin/travelers': { ko: '여행객 관리', en: 'Traveler Management' },
    '/admin/travelers/new': { ko: '새 여행객 등록', en: 'New Traveler Registration' },
    '/admin/flights': { ko: '항공정보 관리', en: 'Flight Information Management' },
  };
  
  // 정확한 경로 먼저 확인
  if (pageTitles[pathname]) {
    return pageTitles[pathname][lang];
  }
  
  // 동적 라우트 패턴 매칭
  if (pathname.match(/^\/admin\/bookings\/[^\/]+\/edit$/)) {
    return lang === 'ko' ? '예약 수정' : 'Edit Booking';
  }
  if (pathname.match(/^\/admin\/bookings\/[^\/]+$/) && !pathname.includes('/confirmed/')) {
    return lang === 'ko' ? '신규부킹 예약 상세보기' : 'New Booking Details';
  }
  if (pathname.match(/^\/admin\/bookings\/confirmed\/[^\/]+$/)) {
    return lang === 'ko' ? '확정 예약 상세보기' : 'Confirmed Booking Details';
  }
  
  return lang === 'ko' ? '관리자 페이지' : 'Admin Page';
}

// 페이지별 부제목 반환 함수
function getPageSubtitle(pathname: string, lang: 'ko' | 'en'): string {
  const pageSubtitles: { [key: string]: { ko: string; en: string } } = {
    '/admin/dashboard': { ko: 'CDC Travel 관리자 대시보드', en: 'CDC Travel Admin Dashboard' },
    '/admin/bookings': { ko: '신규 예약 관리', en: 'New Booking Management' },
    '/admin/bookings/new': { ko: '새로운 예약을 등록합니다', en: 'Register a new booking' },
    '/admin/bookings/confirmed': { ko: '확정된 예약 관리', en: 'Confirmed Booking Management' },
    '/admin/bookings/confirmed/[id]': { ko: '확정 예약 상세보기', en: 'Confirmed Booking Details' },
    '/admin/bookings/confirmed/[id]/edit': { ko: '확정 예약 수정', en: 'Edit Confirmed Booking' },
    '/admin/bookings/[id]': { ko: '신규부킹 예약 상세보기', en: 'New Booking Details' },
    '/admin/bookings/[id]/edit': { ko: '신규부킹 예약 수정', en: 'Edit New Booking' },
    '/admin/products': { ko: '투어 상품 관리', en: 'Tour Product Management' },
    '/admin/spots': { ko: '관광지 및 스팟 관리', en: 'Tourist Spots Management' },
    '/admin/destinations': { ko: '목적지 정보 관리', en: 'Destination Information Management' },
    '/admin/banners': { ko: '메인 배너 관리', en: 'Main Banner Management' },
    '/admin/posters': { ko: '포스터 이미지 관리', en: 'Poster Image Management' },
    '/admin/letters': { ko: '레터 템플릿 관리', en: 'Letter Template Management' },
    '/admin/ta-list': { ko: 'Travel Agent 관리', en: 'Travel Agent Management' },
    '/admin/ta-list/send-email': { ko: '선택된 TA들에게 이메일을 발송합니다', en: 'Send emails to selected travel agents' },
    '/admin/users': { ko: '사용자 계정 관리', en: 'User Account Management' },
    '/admin/users/activity': { ko: '사용자 활동 기록 관리', en: 'User Activity Log Management' },
    '/admin/settings': { ko: '시스템 설정', en: 'System Settings' },
    '/admin/about-us': { ko: '회사 정보 관리', en: 'Company Information Management' },
    '/admin/about-us/ebooks': { ko: 'eBook 자료 관리', en: 'eBook Material Management' },
    '/admin/db': { ko: '데이터베이스 관리', en: 'Database Management' },
    '/admin/files': { ko: '파일 업로드 관리', en: 'File Upload Management' },
    '/admin/include-items': { ko: '투어 포함 항목 관리', en: 'Tour Included Items Management' },
    '/admin/not-include-items': { ko: '투어 불포함 항목 관리', en: 'Tour Excluded Items Management' },
    '/admin/itineraries': { ko: '여행 일정 관리', en: 'Travel Itinerary Management' },
    '/admin/migrate-spot-countries': { ko: '스팟 국가 데이터 마이그레이션', en: 'Spot Country Data Migration' },
    '/admin/migrate-users': { ko: '사용자 데이터 마이그레이션', en: 'User Data Migration' },
    '/admin/optimize-images': { ko: '이미지 최적화 도구', en: 'Image Optimization Tool' },
    '/admin/travelers': { ko: '여행객 관리', en: 'Traveler Management' },
    '/admin/travelers/new': { ko: '새로운 여행객을 등록합니다', en: 'Register a new traveler' },
    '/admin/flights': { ko: '항공 스케줄 및 루트 관리', en: 'Flight Schedule and Route Management' },
  };
  
  // 정확한 경로 먼저 확인
  if (pageSubtitles[pathname]) {
    return pageSubtitles[pathname][lang];
  }
  
  // 동적 라우트 패턴 매칭
  if (pathname.match(/^\/admin\/bookings\/[^\/]+\/edit$/)) {
    return lang === 'ko' ? '예약 수정' : 'Edit Booking';
  }
  if (pathname.match(/^\/admin\/bookings\/[^\/]+$/) && !pathname.includes('/confirmed/')) {
    return lang === 'ko' ? '신규부킹 예약 상세보기' : 'New Booking Details';
  }
  if (pathname.match(/^\/admin\/bookings\/confirmed\/[^\/]+$/)) {
    return lang === 'ko' ? '확정 예약 상세보기' : 'Confirmed Booking Details';
  }
  
  return lang === 'ko' ? '관리자 페이지' : 'Admin Page';
}

// 페이지별 액션 버튼 반환 함수
function getPageActions(pathname: string, lang: 'ko' | 'en'): React.ReactNode {
  // 정확한 경로 먼저 확인
  switch (pathname) {
    case '/admin/dashboard':
      return (
        <div className="flex items-center space-x-4">
          <select className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="today">{lang === 'ko' ? '오늘' : 'Today'}</option>
            <option value="yesterday">{lang === 'ko' ? '어제' : 'Yesterday'}</option>
            <option value="thisWeek">{lang === 'ko' ? '이번 주' : 'This Week'}</option>
            <option value="thisMonth">{lang === 'ko' ? '이번 달' : 'This Month'}</option>
            <option value="lastMonth">{lang === 'ko' ? '지난 달' : 'Last Month'}</option>
            <option value="custom">{lang === 'ko' ? '커스텀' : 'Custom'}</option>
          </select>
        </div>
      );
    
    case '/admin/bookings':
      return (
        <Link
          href="/admin/bookings/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          {lang === 'ko' ? '새 예약' : 'New Booking'}
        </Link>
      );
    
    case '/admin/bookings/new':
      return (
        <button
          type="submit"
          form="new-booking-form"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          {lang === 'ko' ? '저장' : 'Save'}
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
          {lang === 'ko' ? '새 상품' : 'New Product'}
        </Link>
      );
    
    case '/admin/spots':
      return (
        <Link
          href="/admin/spots/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          {lang === 'ko' ? '새 스팟' : 'New Spot'}
        </Link>
      );
    
    case '/admin/banners':
      return (
        <Link
          href="/admin/banners/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          {lang === 'ko' ? '새 배너' : 'New Banner'}
        </Link>
      );
    
    case '/admin/posters':
      return (
        <Link
          href="/admin/posters/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          {lang === 'ko' ? '새 포스터' : 'New Poster'}
        </Link>
      );
    
    case '/admin/letters':
      return (
        <Link
          href="/admin/letters/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          {lang === 'ko' ? '새 레터' : 'New Letter'}
        </Link>
      );
    
    case '/admin/flights':
      return (
        <div className="flex items-center space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            {lang === 'ko' ? '항공사별 일정보기' : 'View by Airline'}
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
            {lang === 'ko' ? '루트별 항공사 확인' : 'Check Airlines by Route'}
          </button>
        </div>
      );
    
    case '/admin/ta-list':
      return (
        <Link
          href="/admin/ta-list/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          {lang === 'ko' ? '새 TA' : 'New TA'}
        </Link>
      );
    
    case '/admin/ta-list/send-email':
      return (
        <Link
          href="/admin/ta-list"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          {lang === 'ko' ? 'TA 목록으로' : 'Back to TA List'}
        </Link>
      );
    
    case '/admin/about-us/ebooks':
      return (
        <Link
          href="/admin/about-us/ebooks/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          {lang === 'ko' ? '새 eBook' : 'New eBook'}
        </Link>
      );
    
    case '/admin/travelers':
      return (
        <Link
          href="/admin/travelers/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          {lang === 'ko' ? '새 여행객 등록' : 'New Traveler'}
        </Link>
      );
    
    case '/admin/travelers/new':
      return (
        <button
          type="submit"
          form="new-traveler-form"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          {lang === 'ko' ? '저장' : 'Save'}
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