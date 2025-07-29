'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { Booking, BookingFilters, BookingStats, BookingStatus } from '@/types/booking';
import { motion } from 'framer-motion';
import { apiFetchJson } from '@/lib/api-utils';
import { DataTable } from '@/components/ui/data-table';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
      total: "전체 신규 부킹",
      inProgress: "진행 중",
      transferred: "확정 전환",
      cancelled: "취소",
      pendingPayments: "미결제",
      revenue: "총 예상 수익",
      conversionRate: "전환율"
    },
    bookingType: "부킹타입",
    airIncluded: "항공포함",
    airline: "항공사",
    yes: "네",
    no: "아니오",
    viewType: "보기 방식",
    daily: "일별",
    weekly: "주별",
    monthly: "월별",
    custom: "기간별",
    // 새로운 텍스트 추가
    partFilter: "파트 필터",
    allParts: "전체",
    airPart: "AIR",
    cintPart: "CINT",
    agentName: "에이전트명",
    customers: "고객정보",
    flightInfo: "항공정보",
    tourInfo: "투어정보",
    hotelName: "호텔명",
    roomType: "룸타입",
    roomCount: "룸수",
    departureRoute: "출발경로",
    returnRoute: "도착경로",
    flightType: "항공타입",
    oneWay: "편도",
    roundTrip: "왕복",
    multiCity: "다구간",
    costPrice: "원가",
    markup: "마크업",
    totalPrice: "총가격",
    // 확장된 행 텍스트
    basicInfo: "기본 정보",
    paxInfo: "인원 정보",
    customerInfo: "고객 정보",
    pricingInfo: "가격 정보",
    remarks: "비고",
    part: "파트",
    tourRegion: "투어지역",
    adults: "성인",
    children: "소아",
    infants: "유아",
    foc: "FOC",
    totalPax: "총 인원",
    customerRegistration: "등록 완료",
    startDate: "시작일",
    endDate: "종료일",
    hotel: "호텔",
    cost: "원가",
    completed: "완료",
    partial: "부분",
    pending: "대기",
    noRemarks: "-"
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
    bookingNumber: "Booking Number",
    tourStartDate: "Tour Start Date",
    tourEndDate: "Tour End Date",
    nights: "Nights",
    agentCode: "Agent Code",
    customerName: "Customer Name",
    pax: "Pax",
    region: "Tour Region",
    localLandCode: "Local Land Code",
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
      total: "Total New Bookings",
      inProgress: "In Progress",
      transferred: "Transferred",
      cancelled: "Cancelled",
      pendingPayments: "Pending Payments",
      revenue: "Total Expected Revenue",
      conversionRate: "Conversion Rate"
    },
    bookingType: "Booking Type",
    airIncluded: "Airline Included",
    airline: "Airline",
    yes: "Yes",
    no: "No",
    viewType: "View Type",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    custom: "Custom",
    // 새로운 텍스트 추가
    partFilter: "Part Filter",
    allParts: "All",
    airPart: "AIR",
    cintPart: "CINT",
    agentName: "Agent Name",
    customers: "Customer Info",
    flightInfo: "Flight Info",
    tourInfo: "Tour Info",
    hotelName: "Hotel Name",
    roomType: "Room Type",
    roomCount: "Room Count",
    departureRoute: "Departure Route",
    returnRoute: "Return Route",
    flightType: "Flight Type",
    oneWay: "One Way",
    roundTrip: "Round Trip",
    multiCity: "Multi City",
    costPrice: "Cost Price",
    markup: "Markup",
    totalPrice: "Total Price",
    // 확장된 행 텍스트
    basicInfo: "Basic Info",
    paxInfo: "Pax Info",
    customerInfo: "Customer Info",
    pricingInfo: "Pricing Info",
    remarks: "Remarks",
    part: "Part",
    tourRegion: "Tour Region",
    adults: "Adults",
    children: "Children",
    infants: "Infants",
    foc: "FOC",
    totalPax: "Total Pax",
    customerRegistration: "Registration",
    startDate: "Start Date",
    endDate: "End Date",
    hotel: "Hotel",
    cost: "Cost",
    completed: "Completed",
    partial: "Partial",
    pending: "Pending",
    noRemarks: "-"
  }
};

export default function BookingsPage() {
  const { lang } = useLanguage();
  const texts = BOOKING_TEXTS[lang];
  const router = useRouter();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [confirmedBookingsCount, setConfirmedBookingsCount] = useState(0);
  const [filters, setFilters] = useState<BookingFilters>({ status: ['new'] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewType, setViewType] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('monthly');
  
  // 새로운 필터 상태 추가
  const [selectedPart, setSelectedPart] = useState<'all' | 'AIR' | 'CINT'>('all');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [agents, setAgents] = useState<string[]>([]);

  // 확장된 행의 내용을 정의하는 함수
  const renderExpandedRow = (booking: Booking) => {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* 기본 정보 */}
          <div className="space-y-1">
            <h4 className={`font-medium text-gray-900 text-sm ${lang === 'en' ? 'font-bold' : ''}`}>{texts.basicInfo}</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">{texts.part}:</span>
                <span className="font-medium">{booking.part || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{texts.agent}:</span>
                <span className="font-medium">{booking.agentName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{texts.receivedBy}:</span>
                <span className="font-medium">{booking.receivedBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{texts.tourRegion}:</span>
                <span className="font-medium">{booking.region || '-'}</span>
              </div>
            </div>
          </div>

          {/* 투어 정보 */}
          <div className="space-y-1">
            <h4 className={`font-medium text-gray-900 text-sm ${lang === 'en' ? 'font-bold' : ''}`}>{texts.tourInfo}</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">{texts.startDate}:</span>
                <span className="font-medium">{new Date(booking.tourStartDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{texts.endDate}:</span>
                <span className="font-medium">{new Date(booking.tourEndDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{texts.nights}:</span>
                <span className="font-medium">
                  {Math.ceil((new Date(booking.tourEndDate).getTime() - new Date(booking.tourStartDate).getTime()) / (1000 * 60 * 60 * 24))}
                </span>
              </div>
              {booking.part === 'AIR' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{texts.airline}:</span>
                    <span className="font-medium">{booking.airline || '-'}</span>
                  </div>
                  {booking.departureRoute && booking.returnRoute && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{texts.departureRoute}:</span>
                      <span className="font-medium">{booking.departureRoute} → {booking.returnRoute}</span>
                    </div>
                  )}
                  {booking.flightType && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{texts.flightType}:</span>
                      <span className="font-medium">{booking.flightType}</span>
                    </div>
                  )}
                </>
              )}
              {booking.part === 'CINT' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{texts.hotelName}:</span>
                    <span className="font-medium">{booking.hotelName || '-'}</span>
                  </div>
                  {booking.roomType && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{texts.roomType}:</span>
                      <span className="font-medium">{booking.roomType}</span>
                    </div>
                  )}
                  {booking.roomCount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{texts.roomCount}:</span>
                      <span className="font-medium">{booking.roomCount}개</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 인원 정보 */}
          <div className="space-y-1">
            <h4 className={`font-medium text-gray-900 text-sm ${lang === 'en' ? 'font-bold' : ''}`}>{texts.paxInfo}</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">{texts.adults}:</span>
                <span className="font-medium">{booking.adults}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{texts.children}:</span>
                <span className="font-medium">{booking.children}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{texts.infants}:</span>
                <span className="font-medium">{booking.infants}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{texts.foc}:</span>
                <span className="font-medium">{booking.foc || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{texts.totalPax}:</span>
                <span className="font-medium">{booking.totalPax}</span>
              </div>
            </div>
          </div>

          {/* 고객 정보 */}
          <div className="space-y-1">
            <h4 className={`font-medium text-gray-900 text-sm ${lang === 'en' ? 'font-bold' : ''}`}>{texts.customerInfo}</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">{texts.customerRegistration}:</span>
                <span className={`font-medium ${
                  booking.customers && booking.customers.length > 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {booking.customers ? booking.customers.length : 0}/{booking.totalPax}
                </span>
              </div>
              {booking.customers && booking.customers.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {booking.customers.slice(0, 2).map(c => `${c.firstName} ${c.lastName}`).join(', ')}
                  {booking.customers.length > 2 && ` +${booking.customers.length - 2}명`}
                </div>
              )}
            </div>
          </div>

          {/* 가격 정보 */}
          <div className="space-y-1">
            <h4 className={`font-medium text-gray-900 text-sm ${lang === 'en' ? 'font-bold' : ''}`}>{texts.pricingInfo}</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">{texts.cost}:</span>
                <span className="font-medium">${booking.costPrice?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{texts.markup}:</span>
                <span className="font-medium">${booking.markup?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{texts.sellingPrice}:</span>
                <span className="font-medium text-blue-600">${booking.sellingPrice?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{texts.paymentStatus}:</span>
                <span className={`px-1 py-0.5 rounded text-xs ${
                  booking.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                  booking.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {booking.paymentStatus === 'completed' ? texts.completed : 
                   booking.paymentStatus === 'partial' ? texts.partial : texts.pending}
                </span>
              </div>
            </div>
          </div>

          {/* 비고 */}
          <div className="space-y-1">
            <h4 className={`font-medium text-gray-900 text-sm ${lang === 'en' ? 'font-bold' : ''}`}>{texts.remarks}</h4>
            <div className="text-xs">
              {booking.remarks ? (
                <div className="bg-gray-50 rounded p-2 max-h-20 overflow-y-auto">
                  <p className="text-gray-700 whitespace-pre-wrap">{booking.remarks}</p>
                </div>
              ) : (
                <span className="text-gray-400">{texts.noRemarks}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // 날짜 선택 상태
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date();
    // 현재 주의 시작일(일요일)을 계산
    const startOfWeek = new Date(now.getTime() - now.getDay() * 24 * 60 * 60 * 1000);
    return startOfWeek;
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [customDateRange, setCustomDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date()
  });

  useEffect(() => {
    const setupAuth = async () => {
      const { setupTokenRefresh, checkAuth } = await import('@/lib/auth');
      setupTokenRefresh();
      const user = await checkAuth();
      if (!user) {
        console.error('사용자가 로그인되어 있지 않습니다.');
        return;
      }
    };
    
    setupAuth();
    fetchBookings();
    fetchConfirmedBookingsCount();
    fetchAgents();
  }, [filters]);

  // 뷰 타입이 변경될 때마다 통계 업데이트
  useEffect(() => {
    // 뷰 타입 변경 시 통계가 자동으로 업데이트됩니다
  }, [viewType, bookings]);

  // 날짜가 변경될 때마다 통계 업데이트
  useEffect(() => {
    // 날짜 변경 시 통계가 자동으로 업데이트됩니다
  }, [selectedDate, selectedWeek, selectedMonth, customDateRange, bookings]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await apiFetchJson<{success: boolean, bookings: Booking[], stats: BookingStats}>('/api/bookings');
      
      if (response.success) {
        setBookings(response.bookings || []);
      } else {
        setError('Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchConfirmedBookingsCount = async () => {
    try {
      const response = await apiFetchJson<{success: boolean, bookings: Booking[]}>('/api/bookings?status=confirmed');
      
      if (response.success) {
        setConfirmedBookingsCount(response.bookings?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching confirmed bookings count:', error);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await apiFetchJson<{success: boolean, agents: Array<{agentName: string}>}>('/api/ta');
      
      if (response.success && response.agents) {
        const agentNames = response.agents.map(agent => agent.agentName).filter(Boolean);
        setAgents(agentNames);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return texts.stats.inProgress;
      case 'cancelled': return texts.stats.cancelled;
      default: return status;
    }
  };

  // 뷰 타입에 따른 통계 계산
  const getFilteredStats = () => {
    let filteredBookings = bookings;

    switch (viewType) {
      case 'daily':
        const selectedDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        const nextDay = new Date(selectedDay.getTime() + 24 * 60 * 60 * 1000);
        filteredBookings = bookings.filter(booking => {
          const bookingDate = new Date(booking.createdAt);
          return bookingDate >= selectedDay && bookingDate < nextDay;
        });
        break;
      
      case 'weekly':
        const startOfSelectedWeek = new Date(selectedWeek.getTime() - selectedWeek.getDay() * 24 * 60 * 60 * 1000);
        const endOfSelectedWeek = new Date(startOfSelectedWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
        filteredBookings = bookings.filter(booking => {
          const bookingDate = new Date(booking.createdAt);
          return bookingDate >= startOfSelectedWeek && bookingDate < endOfSelectedWeek;
        });
        break;
      
      case 'monthly':
        const startOfSelectedMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
        const endOfSelectedMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1);
        filteredBookings = bookings.filter(booking => {
          const bookingDate = new Date(booking.createdAt);
          return bookingDate >= startOfSelectedMonth && bookingDate < endOfSelectedMonth;
        });
        break;
      
      case 'custom':
        const startOfCustomRange = new Date(customDateRange.startDate.getFullYear(), customDateRange.startDate.getMonth(), customDateRange.startDate.getDate());
        const endOfCustomRange = new Date(customDateRange.endDate.getFullYear(), customDateRange.endDate.getMonth(), customDateRange.endDate.getDate() + 1);
        filteredBookings = bookings.filter(booking => {
          const bookingDate = new Date(booking.createdAt);
          return bookingDate >= startOfCustomRange && bookingDate < endOfCustomRange;
        });
        break;
    }

    // 신규 부킹 목록에서는 new 상태인 부킹만 계산
    const newBookings = filteredBookings.filter(b => b.status === 'new');
    const cancelledBookings = filteredBookings.filter(b => b.status === 'cancelled');

    return {
      total: filteredBookings.length,
      inProgress: newBookings.length,
      transferred: confirmedBookingsCount, // 확정 부킹 수 사용
      cancelled: cancelledBookings.length,
      revenue: filteredBookings.reduce((sum, b) => sum + b.sellingPrice, 0),
      pendingPayments: filteredBookings.filter(b => b.paymentStatus === 'pending').length
    };
  };

  // 뷰 타입에 따른 날짜/기간 정보 계산
  const getViewTypeInfo = () => {
    switch (viewType) {
      case 'daily':
        return {
          label: texts.daily,
          period: selectedDate.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        };
      
      case 'weekly':
        const startOfSelectedWeek = new Date(selectedWeek.getTime() - selectedWeek.getDay() * 24 * 60 * 60 * 1000);
        
        // 현재 월의 주차 계산
        const currentMonth = startOfSelectedWeek.getMonth();
        const firstDayOfMonth = new Date(startOfSelectedWeek.getFullYear(), currentMonth, 1);
        const firstWeekStart = new Date(firstDayOfMonth.getTime() - firstDayOfMonth.getDay() * 24 * 60 * 60 * 1000);
        const weekDiff = Math.floor((startOfSelectedWeek.getTime() - firstWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const weekNumber = weekDiff + 1;
        
        return {
          label: texts.weekly,
          period: `${startOfSelectedWeek.getFullYear()}년 ${currentMonth + 1}월 ${weekNumber}주차`
        };
      
      case 'monthly':
        return {
          label: texts.monthly,
          period: selectedMonth.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', {
            year: 'numeric',
            month: 'long'
          })
        };
      
      case 'custom':
        return {
          label: texts.custom,
          period: `${customDateRange.startDate.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })} - ${customDateRange.endDate.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}`
        };
      
      default:
        return { label: '', period: '' };
    }
  };

  // 뷰 타입에 따라 테이블 데이터 필터링
  const getFilteredBookings = () => {
    let filteredBookings = bookings;

    switch (viewType) {
      case 'daily':
        const selectedDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        const nextDay = new Date(selectedDay.getTime() + 24 * 60 * 60 * 1000);
        filteredBookings = bookings.filter(booking => {
          const bookingDate = new Date(booking.createdAt);
          return bookingDate >= selectedDay && bookingDate < nextDay;
        });
        break;
      
      case 'weekly':
        const startOfSelectedWeek = new Date(selectedWeek.getTime() - selectedWeek.getDay() * 24 * 60 * 60 * 1000);
        const endOfSelectedWeek = new Date(startOfSelectedWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
        filteredBookings = bookings.filter(booking => {
          const bookingDate = new Date(booking.createdAt);
          return bookingDate >= startOfSelectedWeek && bookingDate < endOfSelectedWeek;
        });
        break;
      
      case 'monthly':
        const startOfSelectedMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
        const endOfSelectedMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1);
        filteredBookings = bookings.filter(booking => {
          const bookingDate = new Date(booking.createdAt);
          return bookingDate >= startOfSelectedMonth && bookingDate < endOfSelectedMonth;
        });
        break;
      
      case 'custom':
        const startOfCustomRange = new Date(customDateRange.startDate.getFullYear(), customDateRange.startDate.getMonth(), customDateRange.startDate.getDate());
        const endOfCustomRange = new Date(customDateRange.endDate.getFullYear(), customDateRange.endDate.getMonth(), customDateRange.endDate.getDate() + 1);
        filteredBookings = bookings.filter(booking => {
          const bookingDate = new Date(booking.createdAt);
          return bookingDate >= startOfCustomRange && bookingDate < endOfCustomRange;
        });
        break;
    }

    // 파트별 필터링
    if (selectedPart !== 'all') {
      filteredBookings = filteredBookings.filter(booking => booking.part === selectedPart);
    }

    // 에이전트별 필터링
    if (selectedAgent !== 'all') {
      filteredBookings = filteredBookings.filter(booking => booking.agentName === selectedAgent);
    }

    // 검색어 필터링 (통합 검색)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredBookings = filteredBookings.filter(booking =>
        booking.bookingNumber.toLowerCase().includes(searchLower) ||
        booking.receivedBy.toLowerCase().includes(searchLower) ||
        booking.agentName?.toLowerCase().includes(searchLower) ||
        booking.customers?.some(customer => 
          customer.firstName?.toLowerCase().includes(searchLower) ||
          customer.lastName?.toLowerCase().includes(searchLower) ||
          customer.passportNumber?.toLowerCase().includes(searchLower)
        ) ||
        (booking.region && booking.region.toLowerCase().includes(searchLower)) ||
        (booking.airline && booking.airline.toLowerCase().includes(searchLower)) ||
        (booking.hotelName && booking.hotelName.toLowerCase().includes(searchLower))
      );
    }

    // 상태 필터링
    if (filters.status && filters.status.length > 0) {
      filteredBookings = filteredBookings.filter(booking =>
        filters.status!.includes(booking.status)
      );
    }

    return filteredBookings;
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
        {/* 에러 메시지 표시 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">에러</h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 뷰 타입 선택기 */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">{texts.viewType}:</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setViewType('daily')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      viewType === 'daily'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {texts.daily}
                  </button>
                  <button
                    onClick={() => setViewType('weekly')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      viewType === 'weekly'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {texts.weekly}
                  </button>
                  <button
                    onClick={() => setViewType('monthly')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      viewType === 'monthly'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {texts.monthly}
                  </button>
                  <button
                    onClick={() => setViewType('custom')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      viewType === 'custom'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {texts.custom}
                  </button>
                </div>
                
                {/* 날짜 선택기 */}
                <div className="flex items-center space-x-2 ml-4">
                  <span className="text-sm text-gray-500">|</span>
                  {/* 일별 날짜 선택 */}
                  {viewType === 'daily' && (
                    <input
                      type="date"
                      value={selectedDate.toISOString().split('T')[0]}
                      onChange={(e) => setSelectedDate(new Date(e.target.value))}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                  
                  {/* 주별 주 선택 */}
                  {viewType === 'weekly' && (
                    <input
                      type="week"
                      value={(() => {
                        const year = selectedWeek.getFullYear();
                        const month = selectedWeek.getMonth();
                        
                        // 해당 월의 첫 번째 날
                        const firstDayOfMonth = new Date(year, month, 1);
                        // 해당 월의 첫 번째 주의 시작일 (일요일)
                        const firstWeekStart = new Date(firstDayOfMonth.getTime() - firstDayOfMonth.getDay() * 24 * 60 * 60 * 1000);
                        
                        // 선택된 날짜가 몇 번째 주인지 계산
                        const weekDiff = Math.floor((selectedWeek.getTime() - firstWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
                        const weekNumber = weekDiff + 1;
                        
                        // 월이 바뀌는 경우 처리
                        const adjustedWeekNumber = weekNumber > 0 ? weekNumber : 1;
                        
                        return `${year}-W${String(adjustedWeekNumber).padStart(2, '0')}`;
                      })()}
                      onChange={(e) => {
                        const [year, week] = e.target.value.split('-W');
                        const yearNum = parseInt(year);
                        const weekNum = parseInt(week);
                        
                        // 해당 년도의 첫 번째 날
                        const firstDayOfYear = new Date(yearNum, 0, 1);
                        // 첫 번째 주의 시작일 (일요일)
                        const firstWeekStart = new Date(firstDayOfYear.getTime() - firstDayOfYear.getDay() * 24 * 60 * 60 * 1000);
                        
                        // 선택된 주의 시작일 계산
                        const selectedWeekStart = new Date(firstWeekStart.getTime() + (weekNum - 1) * 7 * 24 * 60 * 60 * 1000);
                        setSelectedWeek(selectedWeekStart);
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                  
                  {/* 월별 월 선택 */}
                  {viewType === 'monthly' && (
                    <input
                      type="month"
                      value={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`}
                      onChange={(e) => setSelectedMonth(new Date(e.target.value + '-01'))}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                  
                  {/* 기간별 날짜 범위 선택 */}
                  {viewType === 'custom' && (
                    <>
                      <input
                        type="date"
                        value={customDateRange.startDate.toISOString().split('T')[0]}
                        onChange={(e) => setCustomDateRange({
                          ...customDateRange,
                          startDate: new Date(e.target.value)
                        })}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-500">~</span>
                      <input
                        type="date"
                        value={customDateRange.endDate.toISOString().split('T')[0]}
                        onChange={(e) => setCustomDateRange({
                          ...customDateRange,
                          endDate: new Date(e.target.value)
                        })}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </>
                  )}
                  
                  {/* 선택된 뷰 타입의 날짜/기간 정보 */}
                  <span className="text-sm text-gray-500">|</span>
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">{getViewTypeInfo().label}: </span>
                    <span className="text-blue-600 font-medium">{getViewTypeInfo().period}</span>
                  </div>
                </div>
              </div>
              
              {/* 검색 및 필터 */}
              <div className="flex items-center space-x-4">
                {/* 파트 필터링 버튼 */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">{texts.partFilter}:</span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setSelectedPart('all')}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        selectedPart === 'all'
                          ? 'bg-gray-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {texts.allParts}
                    </button>
                    <button
                      onClick={() => setSelectedPart('AIR')}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        selectedPart === 'AIR'
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {texts.airPart}
                    </button>
                    <button
                      onClick={() => setSelectedPart('CINT')}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        selectedPart === 'CINT'
                          ? 'bg-green-600 text-white'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {texts.cintPart}
                    </button>
                  </div>
                </div>

                {/* 에이전트 필터링 */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">{texts.agent}:</span>
                  <select
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">전체 에이전트</option>
                    {agents.map((agent, index) => (
                      <option key={index} value={agent}>{agent}</option>
                    ))}
                  </select>
                </div>

                {/* 통합 검색창 */}
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder={texts.search}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                  />
                </div>

                {/* 상태 필터링 */}
                <div className="flex items-center space-x-2">
                  <select
                    value={filters.status?.[0] || 'new'}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value ? [e.target.value as BookingStatus] : ['new'] })}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="new">{getStatusText('new')}</option>
                    <option value="cancelled">{getStatusText('cancelled')}</option>
                  </select>
                </div>

                {/* 기타 버튼들 */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setFilters({ status: ['new'] });
                      setSelectedPart('all');
                      setSelectedAgent('all');
                      setSearchTerm('');
                    }}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    {texts.clearFilters}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mb-8">
          {(() => {
            const filteredStats = getFilteredStats();
            const conversionRate = filteredStats.total > 0 ? ((filteredStats.transferred / filteredStats.total) * 100).toFixed(1) : '0';
            
            return (
              <>
                {/* 전체 신규 부킹 수 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500"
                >
                  <div className="text-sm font-medium text-gray-500">{texts.stats.total}</div>
                  <div className="text-2xl font-bold text-gray-900">{filteredStats.total}</div>
                </motion.div>
                
                {/* 진행 중 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500"
                >
                  <div className="text-sm font-medium text-gray-500">{texts.stats.inProgress}</div>
                  <div className="text-2xl font-bold text-orange-600">{filteredStats.inProgress}</div>
                </motion.div>
                
                {/* 확정 전환 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500"
                >
                  <div className="text-sm font-medium text-gray-500">{texts.stats.transferred}</div>
                  <div className="text-2xl font-bold text-green-600">{filteredStats.transferred}</div>
                  <div className="text-xs text-gray-500 mt-1">{conversionRate}%</div>
                </motion.div>
                
                {/* 미결제 (강조) */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg shadow p-4 border-l-4 border-red-500"
                >
                  <div className="text-sm font-medium text-red-600">{texts.stats.pendingPayments}</div>
                  <div className="text-2xl font-bold text-red-700">{filteredStats.pendingPayments}</div>
                </motion.div>

                {/* 취소 건수 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-lg shadow p-4 border-l-4 border-red-300"
                >
                  <div className="text-sm font-medium text-gray-500">{texts.stats.cancelled}</div>
                  <div className="text-2xl font-bold text-red-600">{filteredStats.cancelled}</div>
                </motion.div>
                
                {/* 총 예상 수익 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white rounded-lg shadow p-4 border-l-4 border-green-300"
                >
                  <div className="text-sm font-medium text-gray-500">{texts.stats.revenue}</div>
                  <div className="text-2xl font-bold text-green-600">${filteredStats.revenue.toLocaleString()}</div>
                </motion.div>
                
                {/* 전환율 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-300"
                >
                  <div className="text-sm font-medium text-gray-500">{texts.stats.conversionRate}</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {filteredStats.total > 0 ? ((filteredStats.transferred / filteredStats.total) * 100).toFixed(1) : '0'}%
                  </div>
                </motion.div>
              </>
            );
          })()}
        </div>

        {/* 범용 DataTable을 사용한 예약 목록 */}
        <div className="bg-white rounded-lg shadow">
          <DataTable 
            data={getFilteredBookings()}
            columns={[
              {
                key: "part",
                header: "파트",
                cell: (booking: Booking) => (
                  <div className={`inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium ${
                    booking.part === 'AIR' 
                      ? 'bg-blue-100 text-blue-800' 
                      : booking.part === 'CINT'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.part || '-'}
                  </div>
                ),
                sortable: true,
              },
              {
                key: "bookingNumber",
                header: "예약번호",
                cell: (booking: Booking) => <div className="font-medium text-xs">{booking.bookingNumber}</div>,
                sortable: true,
              },
              {
                key: "agentCode",
                header: "에이전트",
                cell: (booking: Booking) => <div className="text-xs">{booking.agentCode || '-'}</div>,
                sortable: true,
              },
              {
                key: "receivedBy",
                header: "접수자",
                cell: (booking: Booking) => <div className="text-xs">{booking.receivedBy}</div>,
                sortable: true,
              },
              {
                key: "tourStartDate",
                header: "시작일",
                cell: (booking: Booking) => <div className="text-xs">{new Date(booking.tourStartDate).toLocaleDateString()}</div>,
                sortable: true,
              },
              {
                key: "tourEndDate",
                header: "종료일",
                cell: (booking: Booking) => <div className="text-xs">{new Date(booking.tourEndDate).toLocaleDateString()}</div>,
                sortable: true,
              },
              {
                key: "nights",
                header: "박수",
                cell: (booking: Booking) => {
                  const nights = Math.ceil((new Date(booking.tourEndDate).getTime() - new Date(booking.tourStartDate).getTime()) / (1000 * 60 * 60 * 24));
                  return <div className="text-xs">{nights}</div>;
                },
                sortable: true,
              },
              {
                key: "totalPax",
                header: "인원",
                cell: (booking: Booking) => (
                  <div className="text-xs">
                    {booking.totalPax}({booking.adults}+{booking.children}+{booking.infants}+{booking.foc || 0})
                  </div>
                ),
                sortable: true,
              },
              {
                key: "customers",
                header: "고객정보",
                cell: (booking: Booking) => (
                  <div className="text-xs" title={booking.customers?.map(c => `${c.firstName} ${c.lastName}`).join(', ')}>
                    {booking.customers?.slice(0, 2).map(c => `${c.firstName} ${c.lastName}`).join(', ')}
                    {booking.customers && booking.customers.length > 2 && ` +${booking.customers.length - 2}명`}
                  </div>
                ),
                sortable: false,
              },
              {
                key: "flightInfo",
                header: "항공/투어정보",
                cell: (booking: Booking) => {
                  if (booking.part === 'AIR') {
                    return (
                      <div className="text-xs">
                        <div className="font-medium">{booking.airline || '-'}</div>
                        <div className="text-gray-500 text-xs">
                          {booking.departureRoute && booking.returnRoute && `${booking.departureRoute} → ${booking.returnRoute}`}
                          {booking.flightType && ` (${booking.flightType})`}
                        </div>
                      </div>
                    );
                  } else if (booking.part === 'CINT') {
                    return (
                      <div className="text-xs">
                        <div className="font-medium">{booking.hotelName || '-'}</div>
                        <div className="text-gray-500 text-xs">
                          {booking.roomType && `${booking.roomType} ${booking.roomCount}개`}
                        </div>
                      </div>
                    );
                  }
                  return <div className="text-xs">-</div>;
                },
                sortable: false,
              },
              {
                key: "region",
                header: "투어지역",
                cell: (booking: Booking) => <div className="text-xs">{booking.region || '-'}</div>,
                sortable: true,
              },
              {
                key: "sellingPrice",
                header: "판매가",
                cell: (booking: Booking) => <div className="font-medium text-xs">${booking.sellingPrice?.toLocaleString() || 0}</div>,
                sortable: true,
              },
              {
                key: "paymentStatus",
                header: "결제상태",
                cell: (booking: Booking) => (
                  <div className={`inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium ${
                    booking.paymentStatus === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : booking.paymentStatus === 'partial'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {booking.paymentStatus === 'completed' ? texts.completed : 
                     booking.paymentStatus === 'partial' ? texts.partial : texts.pending}
                  </div>
                ),
                sortable: true,
              },
            ]}
            expandable={true}
            expandedRow={renderExpandedRow}
            onRowDoubleClick={(booking: Booking) => {
              router.push(`/admin/bookings/${booking.id}/edit`);
            }}
            actions={[
              {
                label: "보기",
                icon: <Eye className="h-4 w-4" />,
                href: (booking: Booking) => `/admin/bookings/${booking.id}`,
                variant: "ghost",
              },
              {
                label: "수정",
                icon: <Edit className="h-4 w-4" />,
                href: (booking: Booking) => `/admin/bookings/${booking.id}/edit`,
                variant: "ghost",
              },
              {
                label: "삭제",
                icon: <Trash2 className="h-4 w-4" />,
                onClick: (booking: Booking) => {
                  if (confirm("정말로 이 예약을 삭제하시겠습니까?")) {
                    console.log("Delete booking:", booking.id);
                  }
                },
                variant: "ghost",
              },
            ]}
            itemsPerPage={10}
            emptyMessage="예약 내역이 없습니다."
          />
        </div>
      </main>
    </div>
  );
} 