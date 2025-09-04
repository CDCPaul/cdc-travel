"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BookingTable } from '@/components/bookings/BookingTable';
import { BookingFilters, BookingFilterState } from '@/components/bookings/BookingFilters';
import { TeamBadge } from '@/components/bookings/StatusBadge';
import { Button } from '@/components/ui/button';
import { Booking, BookingListResponse } from '@/types/booking';
import { Team } from '@/types/team';
import { WorkflowStep } from '@/types/workflow';
import { 
  Plus, 
  RefreshCw, 
  Download, 
  BarChart3, 
  Users,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Home
} from 'lucide-react';
import Link from 'next/link';

// API 호출 함수들
async function fetchBookings(filters: BookingFilterState, page: number = 1, pageSize: number = 20): Promise<BookingListResponse> {
  const params = new URLSearchParams();
  
  // 필터 파라미터 추가
  if (filters.team) params.append('team', filters.team);
  if (filters.projectType) params.append('projectType', filters.projectType);
  if (filters.status) params.append('status', filters.status);
  if (filters.currentStep) params.append('currentStep', filters.currentStep);
  if (filters.priority) params.append('priority', filters.priority);
  if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);
  if (filters.searchText) params.append('searchText', filters.searchText);
  if (filters.tags && filters.tags.length > 0) params.append('tags', filters.tags.join(','));
  
  params.append('page', page.toString());
  params.append('pageSize', pageSize.toString());

  const response = await fetch(`/api/bookings?${params.toString()}`, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch bookings');
  }

  const data = await response.json();
  return data.data;
}

// 통계 데이터 인터페이스
interface DashboardStats {
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  urgentDeadlines: number;
  pendingCollaboration: number;
  airBookings: number;
  cintBookings: number;
}

export default function BookingsPage() {
  const router = useRouter();
  
  // 상태 관리
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    urgentDeadlines: 0,
    pendingCollaboration: 0,
    airBookings: 0,
    cintBookings: 0
  });

  // 필터 상태
  const [filters, setFilters] = useState<BookingFilterState>({
    team: 'AIR' // 기본값으로 AIR 팀 설정
  });

  // 현재 사용자 정보 (실제로는 인증 컨텍스트에서 가져와야 함)
  const [currentUser] = useState({
    team: 'AIR' as Team,
    canViewAllTeams: true,
    email: 'admin@cebudirectclub.com'
  });

  // 데이터 로드 함수
  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetchBookings(filters, currentPage);
      setBookings(result.bookings);
      setTotalCount(result.totalCount);
      
      // 통계 계산
      const newStats: DashboardStats = {
        totalBookings: result.totalCount,
        activeBookings: result.bookings.filter(b => b.status === 'ACTIVE').length,
        completedBookings: result.bookings.filter(b => b.status === 'COMPLETED').length,
        cancelledBookings: result.bookings.filter(b => b.status === 'CANCELLED').length,
        urgentDeadlines: result.bookings.filter(b => {
          const now = new Date();
          return (b.deadlines?.confirmation && b.deadlines.confirmation.getTime() - now.getTime() < 24 * 60 * 60 * 1000) ||
                 (b.deadlines?.deposit && b.deadlines.deposit.getTime() - now.getTime() < 24 * 60 * 60 * 1000) ||
                 (b.deadlines?.finalPayment && b.deadlines.finalPayment.getTime() - now.getTime() < 24 * 60 * 60 * 1000);
        }).length,
        pendingCollaboration: result.bookings.filter(b => 
          b.currentStep === WorkflowStep.QUOTE_REQUESTED || 
          b.currentStep === WorkflowStep.CUSTOMER_NOTIFIED
        ).length,
        airBookings: result.bookings.filter(b => b.projectType === 'AIR_ONLY').length,
        cintBookings: result.bookings.filter(b => 
          b.projectType === 'CINT_PACKAGE' || b.projectType === 'CINT_INCENTIVE_GROUP'
        ).length
      };
      
      setStats(newStats);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 로드 중 오류가 발생했습니다.');
      console.error('Failed to load bookings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage]);

  // 초기 로드 및 필터 변경 시 데이터 재로드
  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // 필터 변경 핸들러
  const handleFiltersChange = (newFilters: BookingFilterState) => {
    setFilters(newFilters);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
  };

  // 필터 초기화 핸들러
  const handleFiltersReset = () => {
    setFilters({
      team: currentUser.canViewAllTeams ? undefined : currentUser.team
    });
    setCurrentPage(1);
  };

  // 예약 액션 핸들러들
  const handleBookingClick = (booking: Booking) => {
    console.log('Booking clicked:', booking.bookingNumber);
    router.push(`/admin/bookings/${booking.id}`);
  };

  const handleBookingEdit = (booking: Booking) => {
    console.log('Edit booking:', booking.bookingNumber);
    router.push(`/admin/bookings/${booking.id}/edit`);
  };

  const handleCollaborate = (booking: Booking) => {
    console.log('Collaborate on booking:', booking.bookingNumber);
    // TODO: 협업 요청 모달 열기 (추후 구현)
    alert(`${booking.bookingNumber} 협업 요청 기능은 곧 구현될 예정입니다.`);
  };

  const handleViewDetails = (booking: Booking) => {
    console.log('View booking details:', booking.bookingNumber);
    router.push(`/admin/bookings/${booking.id}`);
  };

  const handleBookingDelete = async (booking: Booking) => {
    if (!confirm(`예약 "${booking.bookingNumber}"를 정말 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '예약 삭제에 실패했습니다.');
      }

      // 성공적으로 삭제되면 목록 새로고침
      loadBookings();
      alert('예약이 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('예약 삭제 실패:', error);
      alert(error instanceof Error ? error.message : '예약 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleExport = () => {
    console.log('Export bookings');
    // TODO: 엑셀 다운로드 구현
  };

  const handleRefresh = () => {
    loadBookings();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 전용 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8">
          {/* 브레드크럼 */}
          <div className="flex items-center text-sm text-gray-500 py-3 border-b border-gray-100">
            <Link href="/admin/dashboard" className="flex items-center hover:text-gray-700">
              <Home className="h-4 w-4 mr-1" />
              대시보드
            </Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-gray-900 font-medium">예약 관리</span>
          </div>
          
          {/* 메인 헤더 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">통합 예약 관리</h1>
              <p className="mt-2 text-gray-600">
                AIR팀과 CINT팀의 모든 예약을 통합 관리하고 실시간으로 협업하세요
              </p>
            </div>
            
            <div className="mt-6 sm:mt-0 flex space-x-3">
              <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                새로고침
              </Button>
              
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                내보내기
              </Button>
              
              <Link href="/admin/bookings/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  새 예약
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">전체 예약</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">활성 예약</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeBookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">긴급 마감일</p>
                <p className="text-2xl font-bold text-gray-900">{stats.urgentDeadlines}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">협업 대기</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingCollaboration}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 팀별 통계 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">팀별 예약 현황</h3>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <TeamBadge team="AIR" />
                <span className="text-2xl font-bold text-blue-600">{stats.airBookings}</span>
              </div>
              <div className="flex items-center justify-between">
                <TeamBadge team="CINT" />
                <span className="text-2xl font-bold text-purple-600">{stats.cintBookings}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">상태별 현황</h3>
              <CheckCircle className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">활성</span>
                </div>
                <span className="font-semibold text-green-600">{stats.activeBookings}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">완료</span>
                </div>
                <span className="font-semibold text-gray-600">{stats.completedBookings}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">취소</span>
                </div>
                <span className="font-semibold text-red-600">{stats.cancelledBookings}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* 필터 */}
        <BookingFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onReset={handleFiltersReset}
          availableTeams={currentUser.canViewAllTeams ? ['AIR', 'CINT'] : [currentUser.team]}
          currentUser={currentUser}
        />

        {/* 예약 테이블 */}
        <BookingTable
          bookings={bookings}
          currentTeam={currentUser.team}
          isLoading={isLoading}
          onBookingClick={handleBookingClick}
          onBookingEdit={handleBookingEdit}
          onCollaborate={handleCollaborate}
          onViewDetails={handleViewDetails}
          onBookingDelete={handleBookingDelete}
        />

        {/* 페이지네이션 정보 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>총 {totalCount}개의 예약</span>
            <span>페이지 {currentPage}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
