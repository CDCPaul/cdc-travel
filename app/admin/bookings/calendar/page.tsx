'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { Booking } from '@/types/booking';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { apiFetchJson } from '@/lib/api-utils';

const CALENDAR_TEXTS = {
  ko: {
    title: "예약 캘린더",
    subtitle: "확정된 예약을 캘린더로 확인합니다",
    back: "목록으로",
    loading: "로딩 중...",
    noBookings: "확정된 예약이 없습니다",
    today: "오늘",
    prevMonth: "이전 달",
    nextMonth: "다음 달",
    bookingDetails: "예약 상세",
    customerName: "고객명",
    tourStartDate: "투어시작일",
    tourEndDate: "투어종료일",
    agent: "에이전트",
    region: "지역",
    status: "상태"
  },
  en: {
    title: "Booking Calendar",
    subtitle: "View confirmed bookings in calendar",
    back: "Back to List",
    loading: "Loading...",
    noBookings: "No confirmed bookings found",
    today: "Today",
    prevMonth: "Previous Month",
    nextMonth: "Next Month",
    bookingDetails: "Booking Details",
    customerName: "Customer Name",
    tourStartDate: "Tour Start Date",
    tourEndDate: "Tour End Date",
    agent: "Agent",
    region: "Region",
    status: "Status"
  }
};

export default function CalendarPage() {
  const { lang } = useLanguage();
  const texts = CALENDAR_TEXTS[lang];

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // 현재 월의 첫째 날과 마지막 날 계산
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

  // 캘린더 그리드 생성
  const calendarDays = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    calendarDays.push(date);
  }

  useEffect(() => {
    const setupAuth = async () => {
      try {
        console.log('캘린더 페이지: 예약 데이터 로딩 시작...');
        
        // 확정된 예약만 필터링하는 쿼리 파라미터 추가
        const queryParams = new URLSearchParams();
        queryParams.append('status', 'confirmed');
        
        const data = await apiFetchJson<{bookings: Booking[], stats: {
          total: number;
          confirmed: number;
          completed: number;
          revenue: number;
          pendingPayments: number;
        }}>(`/api/bookings?${queryParams.toString()}`);
        console.log('받아온 예약 데이터:', data);
        
        // data.bookings에서 확정된 예약만 필터링
        const confirmedBookings = data.bookings.filter((booking: Booking) => 
          booking.status === 'confirmed' || booking.status === 'completed'
        );
        console.log('필터링된 확정 예약:', confirmedBookings);
        setBookings(confirmedBookings);
      } catch (error) {
        console.error('예약 데이터 로딩 중 오류:', error);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    setupAuth();
  }, []);

  // 특정 날짜의 예약 가져오기
  const getBookingsForDate = (date: Date): Booking[] => {
    return bookings.filter((booking: Booking) => {
      if (!booking.tourStartDate || !booking.tourEndDate) return false;
      
      const startDate = new Date(booking.tourStartDate);
      const endDate = new Date(booking.tourEndDate);
      const targetDate = new Date(date);
      
      // 날짜만 비교 (시간 제외)
      const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      const targetDateOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      
      return targetDateOnly >= startDateOnly && targetDateOnly <= endDateOnly;
    });
  };

  // 날짜가 현재 월에 속하는지 확인
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth() && 
           date.getFullYear() === currentDate.getFullYear();
  };

  // 날짜가 오늘인지 확인
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // 이전 달로 이동
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // 다음 달로 이동
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // 오늘로 이동
  const goToToday = () => {
    setCurrentDate(new Date());
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
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/bookings/confirmed"
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                {texts.back}
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{texts.title}</h1>
                <p className="text-gray-600">{texts.subtitle}</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={goToToday}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                {texts.today}
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 캘린더 네비게이션 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex justify-between items-center p-4">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-semibold">
              {currentDate.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', { 
                year: 'numeric', 
                month: 'long' 
              })}
            </h2>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* 캘린더 그리드 */}
        <div className="bg-white rounded-lg shadow">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-white p-4 text-center font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {calendarDays.map((date, index) => {
              const dayBookings = getBookingsForDate(date);
              const isCurrentMonthDay = isCurrentMonth(date);
              const isTodayDate = isToday(date);

              return (
                <div
                  key={index}
                  className={`bg-white min-h-[120px] p-2 cursor-pointer hover:bg-gray-50 ${
                    !isCurrentMonthDay ? 'text-gray-400' : ''
                  } ${isTodayDate ? 'bg-blue-50' : ''}`}
                  onClick={() => {
                    setSelectedDate(date);
                    setSelectedBooking(dayBookings[0] || null);
                  }}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isTodayDate ? 'text-blue-600' : ''
                  }`}>
                    {date.getDate()}
                  </div>
                  
                  {/* 예약 표시 */}
                  <div className="space-y-1">
                    {dayBookings.slice(0, 3).map((booking) => (
                      <div
                        key={booking.id}
                        className="text-xs p-1 bg-green-100 text-green-800 rounded truncate"
                        title={`${booking.agentCode} - ${booking.region}`}
                      >
                        {booking.agentCode} - {booking.region}
                      </div>
                    ))}
                    {dayBookings.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayBookings.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 선택된 날짜의 예약 상세 모달 */}
        {selectedDate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {selectedDate.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US')}
                </h3>
                <button
                  onClick={() => {
                    setSelectedDate(null);
                    setSelectedBooking(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {selectedBooking ? (
                <div className="space-y-3">
                  <div>
                    <span className="font-medium">AGT 코드:</span>
                    <span className="ml-2">{selectedBooking.agentCode}</span>
                  </div>
                  <div>
                    <span className="font-medium">{texts.region}:</span>
                    <span className="ml-2">{selectedBooking.region}</span>
                  </div>
                  <div>
                    <span className="font-medium">{texts.tourStartDate}:</span>
                    <span className="ml-2">
                      {new Date(selectedBooking.tourStartDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">{texts.tourEndDate}:</span>
                    <span className="ml-2">
                      {new Date(selectedBooking.tourEndDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">{texts.agent}:</span>
                    <span className="ml-2">{selectedBooking.agentName}</span>
                  </div>
                  <div>
                    <span className="font-medium">{texts.status}:</span>
                    <span className="ml-2">{selectedBooking.status}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">{texts.noBookings}</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 