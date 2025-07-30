"use client";
import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { FlightSchedule } from '@/types/flight';
import { apiRequest } from '@/lib/api-client';
import Image from 'next/image';

interface FlightRoute {
  route: string;
  departureIata: string;
  arrivalIata: string;
}

export default function FlightsPage() {
  const { lang } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [availableRoutes, setAvailableRoutes] = useState<FlightRoute[]>([]);
  const [flights, setFlights] = useState<FlightSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  // 새로운 API 관련 상태
  const [activeTab, setActiveTab] = useState<'calendar' | 'new-api'>('calendar');
  const [selectedNewRoute, setSelectedNewRoute] = useState('');
  const [selectedNewDate, setSelectedNewDate] = useState('');
  const [selectedNewTimeSlot, setSelectedNewTimeSlot] = useState('00-12');
  const [selectedNewMonth, setSelectedNewMonth] = useState('');
  const [isProcessingNewApi, setIsProcessingNewApi] = useState(false);
  const [isProcessingMonth, setIsProcessingMonth] = useState(false);
  const [monthProgress, setMonthProgress] = useState({ current: 0, total: 0, message: '' });

  // 날짜 상세정보 모달 관련 상태
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    while (current <= lastDay || days.length < 42) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (date: Date) => {
    const dayFlights = getFlightsForDate(date);
    if (dayFlights.length > 0) {
      setSelectedDate(date);
      setShowDetailModal(true);
    }
  };

  // 모달 닫기
  const closeModal = () => {
    setShowDetailModal(false);
    setSelectedDate(null);
  };

  // 사용 가능한 루트 목록 가져오기
  const loadAvailableRoutes = async () => {
    setLoadingRoutes(true);
    try {
      const response = await apiRequest('/api/flights/routes');
      if (response.success) {
        setAvailableRoutes((response as { routes: FlightRoute[] }).routes || []);
      } else {
        console.error('루트 목록 로드 실패:', response.error);
      }
    } catch (error) {
      console.error('루트 목록 로드 오류:', error);
    } finally {
      setLoadingRoutes(false);
    }
  };

  // 선택된 루트의 항공편 로드
  const loadFlights = useCallback(async () => {
    if (!selectedRoute) return;
    
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      const response = await apiRequest(`/api/flights/schedules?route=${selectedRoute}&year=${year}&month=${month}`);
      
      if (response.success) {
        setFlights((response as { flights: FlightSchedule[] }).flights || []);
      } else {
        console.error('항공편 로드 실패:', response.error);
        setFlights([]);
      }
    } catch (error) {
      console.error('항공편 로드 오류:', error);
      setFlights([]);
    } finally {
      setLoading(false);
    }
  }, [selectedRoute, currentDate]);

  // 새로운 API 데이터 처리
  const processNewApiData = async () => {
    if (!selectedNewRoute || !selectedNewDate) return;
    
    setIsProcessingNewApi(true);
    try {
      const response = await apiRequest('/api/flights/new-collect', {
        method: 'POST',
        body: JSON.stringify({
          departureIata: selectedNewRoute,
          date: selectedNewDate,
          timeSlot: selectedNewTimeSlot
        })
      });
      
      if (response.success) {
        const savedCount = (response as { savedCount: number }).savedCount;
        alert(`✅ 성공적으로 ${savedCount}개의 항공편이 저장되었습니다.`);
        // 입력 필드는 초기화하지 않음 (사용자 요청)
      } else {
        alert(`❌ 오류: ${response.error}`);
      }
    } catch (error) {
      console.error('새로운 API 처리 오류:', error);
      alert('❌ API 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessingNewApi(false);
    }
  };

  // 1개월 데이터 수집
  const processMonthData = async () => {
    if (!selectedNewRoute || !selectedNewMonth) return;
    
    setIsProcessingMonth(true);
    setMonthProgress({ current: 0, total: 0, message: '시작 중...' });
    
    try {
      const response = await apiRequest('/api/flights/collect-month', {
        method: 'POST',
        body: JSON.stringify({
          departureIata: selectedNewRoute,
          month: selectedNewMonth
        })
      });
      
      if (response.success) {
        const result = response as { totalSaved: number; totalDays: number; totalApiCalls: number; message: string };
        alert(`✅ ${result.message}\n총 ${result.totalSaved}개 항공편 저장됨\n${result.totalDays}일 처리됨\n${result.totalApiCalls}회 API 호출`);
      } else {
        alert(`❌ 오류: ${response.error}`);
      }
    } catch (error) {
      console.error('1개월 데이터 수집 오류:', error);
      alert('❌ 1개월 데이터 수집 중 오류가 발생했습니다.');
    } finally {
      setIsProcessingMonth(false);
      setMonthProgress({ current: 0, total: 0, message: '' });
    }
  };

  useEffect(() => {
    loadAvailableRoutes();
  }, []);

  useEffect(() => {
    if (selectedRoute) {
      loadFlights();
    }
  }, [selectedRoute, currentDate, loadFlights]);

  const getFlightsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return flights.filter(flight => flight.departureDate === dateStr);
  };

  // 항공사 로고 URL 생성
  const getAirlineLogo = (airlineCode: string) => {
    const logoMap: { [key: string]: string } = {
      'KE': '/images/airline/KE.png',
      'OZ': '/images/airline/OZ.png',
      '7C': '/images/airline/7c.png',
      'LJ': '/images/airline/LJ.png',
      'TW': '/images/airline/TW.png',
      'BX': '/images/airline/BX.png',
      '5J': '/images/airline/5J.png',
      'PR': '/images/airline/PR.png',
      'RS': '/images/airline/RS.png',
    };
    return logoMap[airlineCode] || '/images/airline/default.png';
  };

  // 시간 포맷팅
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const time = timeStr.split('T')[1];
    return time ? time.substring(0, 5) : '';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* 탭 네비게이션 */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('calendar')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'calendar'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {lang === 'ko' ? '기존 항공정보' : 'Existing Flight Info'}
              </button>
              <button
                onClick={() => setActiveTab('new-api')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'new-api'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {lang === 'ko' ? '새로운 API 처리' : 'New API Processing'}
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'calendar' ? (
          <>
            {/* 컨트롤 패널 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
                {/* 년/월 선택 */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => changeMonth('prev')}
                    className="p-2 rounded-md hover:bg-gray-100"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <div className="text-lg font-semibold">
                    {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
                  </div>
                  <button
                    onClick={() => changeMonth('next')}
                    className="p-2 rounded-md hover:bg-gray-100"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* 루트 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {lang === 'ko' ? '항공 루트' : 'Flight Route'}
                  </label>
                  <select
                    value={selectedRoute}
                    onChange={(e) => setSelectedRoute(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loadingRoutes}
                  >
                    <option value="">{loadingRoutes ? '로딩 중...' : '루트 선택'}
                    </option>
                    {availableRoutes.map(route => (
                      <option key={route.route} value={route.route}>
                        {route.departureIata} → {route.arrivalIata}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 항공편 확인 버튼 */}
                <div className="flex items-end">
                  <button
                    onClick={loadFlights}
                    disabled={loading || !selectedRoute}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? (lang === 'ko' ? '조회 중...' : 'Loading...') : (lang === 'ko' ? '항공편 확인' : 'Check Flights')}
                  </button>
                </div>
              </div>
            </div>

            {/* 달력 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-7 gap-1">
                {/* 요일 헤더 */}
                {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                  <div key={day} className="p-2 text-center font-medium text-gray-500">
                    {day}
                  </div>
                ))}

                {/* 달력 날짜 */}
                {getCalendarDays().map((date, index) => {
                  const dayFlights = getFlightsForDate(date);
                  const isCurrentMonthDay = isCurrentMonth(date);
                  
                  return (
                    <div
                      key={index}
                      className={`p-2 min-h-[100px] border border-gray-200 ${
                        isCurrentMonthDay ? 'bg-white' : 'bg-gray-50'
                      } ${isToday(date) ? 'ring-2 ring-blue-500' : ''} ${
                        dayFlights.length > 0 ? 'cursor-pointer hover:bg-blue-50' : ''
                      }`}
                      onClick={() => handleDateClick(date)}
                    >
                      <div className={`text-sm ${isCurrentMonthDay ? 'text-gray-900' : 'text-gray-400'}`}>
                        {date.getDate()}
                      </div>
                      
                      {/* 항공편 표시 */}
                      {dayFlights.length > 0 && (
                        <div className="mt-1 space-y-1">
                          {dayFlights.slice(0, 4).map((flight, flightIndex) => (
                            <div
                              key={flightIndex}
                              className="flex items-center space-x-1 p-1 bg-blue-50 rounded text-xs"
                              title={`${flight.airline} ${flight.flightNumber} - ${flight.departureIata}→${flight.arrivalIata}`}
                            >
                              <Image
                                src={getAirlineLogo(flight.airlineCode)}
                                alt={flight.airline}
                                width={16}
                                height={16}
                                className="object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/images/airline/default.png';
                                }}
                              />
                              <span className="text-blue-800 font-medium truncate">
                                {flight.flightNumber}
                              </span>
                            </div>
                          ))}
                          {dayFlights.length > 4 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{dayFlights.length - 4} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 날짜 상세정보 모달 */}
            {showDetailModal && selectedDate && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                  {/* 모달 헤더 */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 항공편
                    </h2>
                    <button
                      onClick={closeModal}
                      className="p-2 rounded-md hover:bg-gray-100"
                    >
                      <XMarkIcon className="h-6 w-6 text-gray-500" />
                    </button>
                  </div>

                  {/* 모달 내용 */}
                  <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {(() => {
                      const dayFlights = getFlightsForDate(selectedDate);
                      return dayFlights.length > 0 ? (
                        <div className="space-y-4">
                          <div className="text-sm text-gray-600 mb-4">
                            총 {dayFlights.length}개의 항공편이 있습니다.
                          </div>
                          
                          <div className="grid gap-4">
                            {dayFlights.map((flight, index) => (
                              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-3">
                                    <Image
                                      src={getAirlineLogo(flight.airlineCode)}
                                      alt={flight.airline}
                                      width={32}
                                      height={32}
                                      className="object-contain"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/images/airline/default.png';
                                      }}
                                    />
                                    <div>
                                      <div className="font-semibold text-lg">
                                        {flight.airline} {flight.flightNumber}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        {flight.aircraftType || '항공기 정보 없음'}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      flight.status === 'Scheduled' ? 'bg-green-100 text-green-800' :
                                      flight.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {flight.status}
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* 출발 정보 */}
                                  <div className="bg-blue-50 p-3 rounded-lg">
                                    <div className="text-sm font-medium text-blue-800 mb-1">출발</div>
                                    <div className="text-lg font-semibold">{flight.departureAirport}</div>
                                    <div className="text-sm text-gray-600">{flight.departureIata}</div>
                                    <div className="text-2xl font-bold text-blue-600">
                                      {formatTime(flight.departureTime)}
                                    </div>
                                  </div>

                                  {/* 도착 정보 */}
                                  <div className="bg-green-50 p-3 rounded-lg">
                                    <div className="text-sm font-medium text-green-800 mb-1">도착</div>
                                    <div className="text-lg font-semibold">{flight.arrivalAirport}</div>
                                    <div className="text-sm text-gray-600">{flight.arrivalIata}</div>
                                    <div className="text-2xl font-bold text-green-600">
                                      {formatTime(flight.arrivalTime)}
                                    </div>
                                  </div>
                                </div>

                                {/* 추가 정보 */}
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                    {flight.callSign && (
                                      <div>
                                        <span className="font-medium">콜사인:</span> {flight.callSign}
                                      </div>
                                    )}
                                    {flight.isCargo && (
                                      <div>
                                        <span className="font-medium">화물:</span> 예
                                      </div>
                                    )}
                                    {flight.codeshareStatus && (
                                      <div>
                                        <span className="font-medium">코드쉐어:</span> {flight.codeshareStatus}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-gray-500 text-lg">
                            이 날짜에는 항공편이 없습니다.
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* 새로운 API 처리 탭 */
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-6">
              {lang === 'ko' ? '새로운 항공 API 호출' : 'New Flight API Call'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  기준 공항 코드
                </label>
                <input
                  type="text"
                  value={selectedNewRoute}
                  onChange={(e) => setSelectedNewRoute(e.target.value.toUpperCase())}
                  placeholder="예: ICN"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    날짜
                  </label>
                  <input
                    type="date"
                    value={selectedNewDate}
                    onChange={(e) => setSelectedNewDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    시간대
                  </label>
                  <select
                    value={selectedNewTimeSlot}
                    onChange={(e) => setSelectedNewTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="00-12">00:00 - 12:00</option>
                    <option value="12-00">12:00 - 23:59</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  월 선택 (1개월 데이터 수집)
                </label>
                <input
                  type="month"
                  value={selectedNewMonth}
                  onChange={(e) => setSelectedNewMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <button
                  onClick={processNewApiData}
                  disabled={isProcessingNewApi || !selectedNewRoute || !selectedNewDate}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isProcessingNewApi ? '처리 중...' : 'API 호출 및 저장'}
                </button>

                <button
                  onClick={processMonthData}
                  disabled={isProcessingMonth || !selectedNewRoute || !selectedNewMonth}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isProcessingMonth ? '1개월 데이터 수집 중...' : '1개월 데이터 수집'}
                </button>

                {isProcessingMonth && monthProgress.total > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md">
                    <div className="text-sm text-blue-700 mb-2">
                      진행률: {monthProgress.current} / {monthProgress.total} ({Math.round((monthProgress.current / monthProgress.total) * 100)}%)
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(monthProgress.current / monthProgress.total) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      {monthProgress.message}
                    </div>
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-600">
                <p>• <strong>API 호출 및 저장</strong>: 선택한 날짜와 시간대의 데이터만 수집</p>
                <p>• <strong>1개월 데이터 수집</strong>: 선택한 월의 모든 날짜를 자동으로 수집 (약 60-62회 API 호출)</p>
                <p>• 기준 공항 코드를 기준으로 출발편과 도착편을 모두 수집합니다</p>
              </div>
            </div>
          </div>
        )}

        {/* 로딩 표시 */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p>{lang === 'ko' ? '항공편 로딩 중...' : 'Loading flights...'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 