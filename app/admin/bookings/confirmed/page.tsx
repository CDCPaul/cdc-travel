'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { Booking } from '@/types/booking';
import { CalendarIcon, CheckIcon, CheckCircleIcon, CurrencyDollarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { apiFetchJson } from '@/lib/api-utils';
import { DataTable } from '@/components/ui/data-table';
import { Eye, Edit } from 'lucide-react';

const CONFIRMED_BOOKINGS_TEXTS = {
  ko: {
    title: "확정예약 목록",
    subtitle: "확정된 예약을 관리합니다",
    back: "목록으로",
    calendar: "캘린더",
    reports: "리포트",
    search: "검색...",
    filters: "필터",
    clearFilters: "필터 초기화",
    status: "상태",
    type: "투어 타입",
    dateRange: "날짜 범위",
    agent: "에이전트",
    region: "지역",
    bookingNumber: "예약번호",
    receivedBy: "접수자",
    tourStartDate: "투어시작일",
    tourEndDate: "투어종료일",
    nights: "박수",
    agentCode: "AGT",
    pax: "인원",
    tourRegion: "투어지역",
    land: "LAND",
    emptyField: "빈필드",
    passengerList: "명단",
    airIncluded: "항공포함",
    airline: "항공사",
    yes: "예",
    no: "아니오",
    actions: "액션",
    view: "보기",
    edit: "수정",
    loading: "로딩 중...",
    noBookings: "확정된 예약이 없습니다",
    stats: {
      total: "전체",
      confirmed: "확정",
      completed: "완료",
      revenue: "수익",
      pendingPayments: "미결제"
    }
  },
  en: {
    title: "Confirmed Bookings",
    subtitle: "Manage confirmed bookings",
    back: "Back to List",
    calendar: "Calendar",
    reports: "Reports",
    search: "Search...",
    filters: "Filters",
    clearFilters: "Clear Filters",
    status: "Status",
    type: "Tour Type",
    dateRange: "Date Range",
    agent: "Agent",
    region: "Region",
    receivedBy: "Received By",
    bookingNumber: "Booking No.",
    tourStartDate: "Tour Start Date",
    tourEndDate: "Tour End Date",
    nights: "Nights",
    agentCode: "AGT",
    pax: "Pax",
    tourRegion: "Tour Region",
    land: "LAND",
    emptyField: "Empty Field",
    passengerList: "Passenger List",
    airIncluded: "Airline Included",
    airline: "Airline",
    yes: "Yes",
    no: "No",
    actions: "Actions",
    view: "View",
    edit: "Edit",
    loading: "Loading...",
    noBookings: "No confirmed bookings found",
    stats: {
      total: "Total",
      confirmed: "Confirmed",
      completed: "Completed",
      revenue: "Revenue",
      pendingPayments: "Pending Payments"
    }
  }
};

export default function ConfirmedBookingsPage() {
  const { lang } = useLanguage();
  const texts = CONFIRMED_BOOKINGS_TEXTS[lang];

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    completed: 0,
    revenue: 0,
    pendingPayments: 0
  });
  const [filters, setFilters] = useState<{ status?: string[] }>({ status: ['confirmed'] });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const setupAuth = async () => {
      const { setupTokenRefresh, checkAuth } = await import('@/lib/auth');
      
      // 토큰 자동 갱신 설정
      setupTokenRefresh();
      
      // 인증 상태 확인
      const user = await checkAuth();
      if (!user) {
        console.error('사용자가 로그인되어 있지 않습니다.');
        return;
      }
    };
    
    setupAuth();
    fetchConfirmedBookings();
  }, [filters]);

  const fetchConfirmedBookings = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('status', 'confirmed');
      
      const data = await apiFetchJson<{bookings: Booking[], stats: {
        total: number;
        confirmed: number;
        completed: number;
        revenue: number;
        pendingPayments: number;
      }}>(`/api/bookings?${queryParams.toString()}`);
      
      const confirmedBookings = data.bookings.filter((booking: Booking) =>
        booking.status === 'confirmed' || booking.status === 'completed'
      );
      setBookings(confirmedBookings);
      
      setStats(data.stats);
    } catch (error) {
      console.error('확정 예약 데이터 로딩 실패:', error);
      setBookings([]);
      setStats({
        total: 0,
        confirmed: 0,
        completed: 0,
        revenue: 0,
        pendingPayments: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return lang === 'ko' ? '확정' : 'Confirmed';
      case 'completed': return lang === 'ko' ? '완료' : 'Completed';
      default: return status;
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{texts.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{texts.stats.total}</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckIcon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{texts.stats.confirmed}</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.confirmed}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{texts.stats.completed}</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <CurrencyDollarIcon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{texts.stats.revenue}</p>
                <p className="text-2xl font-semibold text-gray-900">${stats.revenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{texts.stats.pendingPayments}</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingPayments}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <input
                  type="text"
                  placeholder={texts.search}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={filters.status?.[0] || 'confirmed'}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value ? [e.target.value] : ['confirmed'] })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="confirmed">{getStatusText('confirmed')}</option>
                  <option value="completed">{getStatusText('completed')}</option>
                </select>
                <button
                  onClick={() => setFilters({ status: ['confirmed'] })}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  {texts.clearFilters}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 확정 예약 목록 */}
        <div className="bg-white rounded-lg shadow">
          <DataTable 
            data={bookings}
            columns={[
              {
                key: "bookingNumber",
                header: texts.bookingNumber,
                cell: (booking) => <div className="font-medium">{booking.bookingNumber}</div>,
                sortable: true,
              },
              {
                key: "receivedBy",
                header: texts.receivedBy,
                cell: (booking) => <div>{booking.receivedBy || '-'}</div>,
                sortable: true,
              },
              {
                key: "tourStartDate",
                header: texts.tourStartDate,
                cell: (booking) => <div>{booking.tourStartDate ? new Date(booking.tourStartDate).toLocaleDateString() : '-'}</div>,
                sortable: true,
              },
              {
                key: "tourEndDate",
                header: texts.tourEndDate,
                cell: (booking) => <div>{booking.tourEndDate ? new Date(booking.tourEndDate).toLocaleDateString() : '-'}</div>,
                sortable: true,
              },
              {
                key: "nights",
                header: texts.nights,
                cell: (booking) => {
                  let nightsDisplay = booking.nights;
                  if (!nightsDisplay && booking.tourStartDate && booking.tourEndDate) {
                    const startDate = new Date(booking.tourStartDate);
                    const endDate = new Date(booking.tourEndDate);
                    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    nightsDisplay = diffDays;
                  }
                  return <div>{nightsDisplay || '-'}</div>;
                },
                sortable: false,
              },
              {
                key: "agentCode",
                header: texts.agentCode,
                cell: (booking) => <div>{booking.agentCode}</div>,
                sortable: true,
              },
              {
                key: "totalPax",
                header: texts.pax,
                cell: (booking) => <div>{booking.totalPax}({booking.adults}+{booking.children}+{booking.infants})</div>,
                sortable: true,
              },
              {
                key: "tourRegion",
                header: texts.tourRegion,
                cell: (booking) => {
                  const tourRegionDisplay = booking.tourRegion || booking.region || '-';
                  return <div>{tourRegionDisplay}</div>;
                },
                sortable: true,
              },
              {
                key: "airIncluded",
                header: texts.airIncluded,
                cell: (booking) => <div>{booking.airIncluded ? texts.yes : texts.no}</div>,
                sortable: false,
              },
              {
                key: "airline",
                header: texts.airline,
                cell: (booking) => <div>{booking.airline || '-'}</div>,
                sortable: true,
              },
              {
                key: "land",
                header: texts.land,
                cell: (booking) => {
                  const landDisplay = booking.land || booking.localLandCode || '-';
                  return <div>{landDisplay}</div>;
                },
                sortable: true,
              },
              {
                key: "emptyField",
                header: texts.emptyField,
                cell: () => <div>-</div>,
                sortable: false,
              },
              {
                key: "passengerList",
                header: texts.passengerList,
                cell: (booking) => {
                  const totalPax = booking.totalPax || 0;
                  const filledPax = booking.customers?.length || 0;
                  const passengerListText = `${filledPax}/${totalPax}`;
                  return <div>{passengerListText}</div>;
                },
                sortable: false,
              },
            ]}
            actions={[
              {
                label: "보기",
                icon: <Eye className="h-4 w-4" />,
                href: (booking) => `/admin/bookings/confirmed/${booking.id}`,
                variant: "ghost",
              },
              {
                label: "수정",
                icon: <Edit className="h-4 w-4" />,
                href: (booking) => `/admin/bookings/confirmed/${booking.id}/edit`,
                variant: "ghost",
              },
            ]}
            searchKey="bookingNumber"
            searchPlaceholder="예약번호, 접수자로 검색..."
            itemsPerPage={10}
            emptyMessage={texts.noBookings}
          />
        </div>
      </main>
    </div>
  );
} 