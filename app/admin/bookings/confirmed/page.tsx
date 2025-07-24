'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { Booking } from '@/types/booking';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, CalendarIcon, ChartBarIcon, CheckIcon, CheckCircleIcon, CurrencyDollarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { apiFetchJson } from '@/lib/api-utils';

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
    airlineIncluded: "항공포함",
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
    airlineIncluded: "Airline Included",
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link
                href="/admin/bookings"
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{texts.title}</h1>
                <p className="text-gray-600">{texts.subtitle}</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/admin/bookings/calendar"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                {texts.calendar}
              </Link>
              <Link
                href="/admin/bookings/reports"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ChartBarIcon className="h-4 w-4 mr-2" />
                {texts.reports}
              </Link>
            </div>
          </div>
        </div>
      </div>

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
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.bookingNumber}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.receivedBy}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.tourStartDate}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.tourEndDate}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.nights}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.agentCode}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.pax}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.tourRegion}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.airlineIncluded}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.airline}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.land}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.emptyField}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.passengerList}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-6 py-12 text-center text-gray-500">
                      {texts.noBookings}
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => {
                    // 명단 정보 계산 (총 인원수 대비 작성된 인원수)
                    const totalPax = booking.totalPax || 0;
                    const filledPax = booking.customers?.length || 0;
                    const passengerListText = `${filledPax}/${totalPax}`;
                    
                    // 박수 계산 (시작일과 종료일이 있으면 계산)
                    let nightsDisplay = booking.nights;
                    if (!nightsDisplay && booking.tourStartDate && booking.tourEndDate) {
                      const startDate = new Date(booking.tourStartDate);
                      const endDate = new Date(booking.tourEndDate);
                      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      nightsDisplay = diffDays;
                    }
                    
                    // 투어지역 표시 (tourRegion이 없으면 region 사용)
                    const tourRegionDisplay = booking.tourRegion || booking.region || '-';
                    
                    // 랜드 표시 (land가 없으면 localLandCode 사용)
                    const landDisplay = booking.land || booking.localLandCode || '-';
                    
                    return (
                      <motion.tr
                        key={booking.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => window.location.href = `/admin/bookings/${booking.id}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {booking.bookingNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.receivedBy || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.tourStartDate ? new Date(booking.tourStartDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.tourEndDate ? new Date(booking.tourEndDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {nightsDisplay || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.agentCode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.totalPax}({booking.adults}+{booking.children}+{booking.infants})
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {tourRegionDisplay}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.airlineIncluded ? texts.yes : texts.no}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.airline || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {landDisplay}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          -
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {passengerListText}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
} 