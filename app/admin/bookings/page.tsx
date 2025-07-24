'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { Booking, BookingFilters, BookingStats, BookingStatus } from '@/types/booking';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';
import { apiFetchJson } from '@/lib/api-utils';

const BOOKING_TEXTS = {
  ko: {
    title: "신규 부킹 관리",
    subtitle: "신규 부킹 목록",
    newBooking: "새 예약",
    calendar: "캘린더",
    reports: "리포트",
    search: "검색...",
    filters: "필터",
    clearFilters: "필터 초기화",
    status: "상태",
    type: "투어 타입",
    dateRange: "날짜 범위",
    agent: "에이전트",
    receivedBy: "접수자",
    bookingNumber: "예약번호",
    tourStartDate: "투어시작일",
    tourEndDate: "투어종료일",
    nights: "박수",
    agentCode: "에이전트코드",
    customerName: "고객명",
    pax: "인원",
    region: "투어지역",
    localLandCode: "랜드사코드",
    emptyFields: "빈필드",
    sellingPrice: "판매가",
    paymentStatus: "결제상태",
    actions: "액션",
    view: "보기",
    edit: "수정",
    confirm: "확정",
    cancel: "취소",
    loading: "로딩 중...",
    noBookings: "예약이 없습니다",
    stats: {
      total: "전체",
      new: "신규",
      confirmed: "확정",
      completed: "완료",
      cancelled: "취소",
      revenue: "수익",
      pendingPayments: "미결제"
    },
    bookingType: "부킹타입",
    airlineIncluded: "항공포함",
    airline: "항공사",
    yes: "네",
    no: "아니오"
  },
  en: {
    title: "New Booking Management",
    subtitle: "New Booking List",
    newBooking: "New Booking",
    calendar: "Calendar",
    reports: "Reports",
    search: "Search...",
    filters: "Filters",
    clearFilters: "Clear Filters",
    status: "Status",
    type: "Tour Type",
    dateRange: "Date Range",
    agent: "Agent",
    receivedBy: "Received By",
    bookingNumber: "Booking No.",
    tourStartDate: "Tour Start Date",
    tourEndDate: "Tour End Date",
    nights: "Nights",
    agentCode: "Agent Code",
    customerName: "Customer Name",
    pax: "Pax",
    region: "Region",
    localLandCode: "Land Code",
    emptyFields: "Empty Fields",
    sellingPrice: "Selling Price",
    paymentStatus: "Payment Status",
    actions: "Actions",
    view: "View",
    edit: "Edit",
    confirm: "Confirm",
    cancel: "Cancel",
    loading: "Loading...",
    noBookings: "No bookings found",
    stats: {
      total: "Total",
      new: "New",
      confirmed: "Confirmed",
      completed: "Completed",
      cancelled: "Cancelled",
      revenue: "Revenue",
      pendingPayments: "Pending Payments"
    },
    bookingType: "Booking Type",
    airlineIncluded: "Airline Included",
    airline: "Airline",
    yes: "Yes",
    no: "No"
  }
};

export default function BookingsPage() {
  const { lang } = useLanguage();
  const texts = BOOKING_TEXTS[lang];
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats>({
    total: 0,
    new: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    revenue: 0,
    pendingPayments: 0
  });
  const [filters, setFilters] = useState<BookingFilters>({ status: ['new'] }); // 기본값을 'new'로 설정
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
    fetchBookings();
  }, [filters]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      // API 호출로 예약 데이터 가져오기 (신규 예약만)
      const queryParams = new URLSearchParams();
      queryParams.append('status', 'new'); // 항상 신규 예약만 요청
      
      const data = await apiFetchJson<{bookings: Booking[], stats: BookingStats}>(`/api/bookings?${queryParams.toString()}`);
      
      // 클라이언트 사이드에서도 신규 예약만 필터링
      const newBookings = data.bookings.filter(booking => booking.status === 'new');
      setBookings(newBookings);
      
      // 통계는 신규 예약 기준으로 계산
      setStats({
        ...data.stats,
        total: newBookings.length,
        new: newBookings.length,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        revenue: newBookings.reduce((sum, b) => sum + b.sellingPrice, 0),
        pendingPayments: newBookings.filter(b => b.paymentStatus === 'pending').length
      });
    } catch (error) {
      console.error('예약 데이터 로딩 실패:', error);
      // 에러 시 빈 배열로 설정
      setBookings([]);
      setStats({
        total: 0,
        new: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        revenue: 0,
        pendingPayments: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return texts.stats.new;
      case 'confirmed': return texts.stats.confirmed;
      case 'completed': return texts.stats.completed;
      case 'cancelled': return texts.stats.cancelled;
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{texts.title}</h1>
              <p className="text-gray-600">{texts.subtitle}</p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/admin/bookings/new"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                {texts.newBooking}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="px-4 sm:px-6 lg:px-8 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow p-4"
          >
            <div className="text-sm font-medium text-gray-500">{texts.stats.total}</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow p-4"
          >
            <div className="text-sm font-medium text-gray-500">{texts.stats.new}</div>
            <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow p-4"
          >
            <div className="text-sm font-medium text-gray-500">{texts.stats.confirmed}</div>
            <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow p-4"
          >
            <div className="text-sm font-medium text-gray-500">{texts.stats.completed}</div>
            <div className="text-2xl font-bold text-purple-600">{stats.completed}</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow p-4"
          >
            <div className="text-sm font-medium text-gray-500">{texts.stats.cancelled}</div>
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow p-4"
          >
            <div className="text-sm font-medium text-gray-500">{texts.stats.revenue}</div>
            <div className="text-2xl font-bold text-green-600">${stats.revenue.toLocaleString()}</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-lg shadow p-4"
          >
            <div className="text-sm font-medium text-gray-500">{texts.stats.pendingPayments}</div>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingPayments}</div>
          </motion.div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={texts.search}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-2">
                <select
                  value={filters.status?.[0] || 'new'}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value ? [e.target.value as BookingStatus] : ['new'] })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="new">{getStatusText('new')}</option>
                  <option value="confirmed">{getStatusText('confirmed')}</option>
                  <option value="completed">{getStatusText('completed')}</option>
                  <option value="cancelled">{getStatusText('cancelled')}</option>
                </select>
                <Link
                  href="/admin/bookings/confirmed"
                  className="px-4 py-2 text-sm text-green-600 hover:text-green-800 border border-green-300 rounded-md hover:bg-green-50"
                >
                  확정 예약 보기
                </Link>
                <button
                  onClick={() => setFilters({ status: ['new'] })}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  {texts.clearFilters}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 예약 목록 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.bookingType}
                  </th>
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
                    AGT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.pax}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.region}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.airlineIncluded}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.airline}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LAND
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-12 text-center text-gray-500">
                      {texts.noBookings}
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <motion.tr
                      key={booking.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => window.location.href = `/admin/bookings/${booking.id}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {booking.bookingType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {booking.bookingNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.receivedBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(booking.tourStartDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(booking.tourEndDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Math.ceil((new Date(booking.tourEndDate).getTime() - new Date(booking.tourStartDate).getTime()) / (1000 * 60 * 60 * 24))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.agentCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.totalPax}({booking.adults}+{booking.children}+{booking.infants})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.region}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.airlineIncluded ? texts.yes : texts.no}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.airline || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.localLandCode}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
} 