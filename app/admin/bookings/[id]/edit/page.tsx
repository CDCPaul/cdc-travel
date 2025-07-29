'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/components/LanguageContext';
import { Booking } from '@/types/booking';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { apiFetchJson } from '@/lib/api-utils';
import CustomerSelectionModal from '@/components/CustomerSelectionModal';
import TASelectionModal from '@/components/TASelectionModal';

const BOOKING_EDIT_TEXTS = {
  ko: {
    title: "예약 수정",
    subtitle: "예약 정보를 수정합니다",
    back: "목록으로",
    save: "저장",
    cancel: "취소",
    loading: "로딩 중...",
    notFound: "예약을 찾을 수 없습니다",
    saveSuccess: "예약이 성공적으로 수정되었습니다",
    saveError: "예약 수정에 실패했습니다",
    partSelection: "파트 선택",
    air: "AIR",
    cint: "CINT",
    basicInfo: "기본 정보",
    tourInfo: "투어 정보",
    customerInfo: "고객 정보",
    paymentInfo: "결제 정보",
    bookingNumber: "예약번호",
    status: "상태",
    bookingType: "예약 타입",
    tourStartDate: "투어시작일",
    tourEndDate: "투어종료일",
    nights: "박수",
    country: "국가",
    region: "지역",
    agentCode: "에이전트 코드",
    agentName: "에이전트명",
    hotelName: "호텔명",
    airline: "항공사",
    departureRoute: "출발 노선",
    returnRoute: "도착 노선",
    roomType: "객실 타입",
    roomCount: "객실 수",
    airIncluded: "항공포함",
    totalPax: "총 인원",
    adults: "성인",
    children: "아동",
    infants: "유아",
    costPrice: "원가",
    markup: "마크업",
    sellingPrice: "판매가",
    totalPayment: "총 결제액",
    deposit: "입금액",
    balance: "잔액",
    paymentMethod: "결제 방법",
    paymentStatus: "결제 상태",
    remarks: "비고",
    selectTA: "TA 선택",
    searchCustomer: "DB에서 고객 검색",
    addCustomer: "고객 추가",
    removeCustomer: "고객 삭제",
    firstName: "이름",
    lastName: "성",
    gender: "성별",
    nationality: "국적",
    passportNumber: "여권번호",
    passportExpiry: "여권만료일",
    basicInfoReadOnly: "기본 정보는 수정할 수 없습니다. 수정이 필요한 경우 취소 후 재예약해주세요.",
    new: "신규",
    confirmed: "확정",
    completed: "완료",
    cancelled: "취소",
    pending: "미결제",
    partial: "부분결제",
    fit: "FIT",
    pkg: "PKG",
    group: "GROUP",
    revision: "REVISION",
    // 항공편 관련 텍스트 추가
    flightType: "여정 유형",
    oneway: "편도",
    roundtrip: "왕복",
    multicity: "다구간",
    flightInfo: "여정 정보",
    departure: "출발지",
    arrival: "도착지",
    outbound: "가는 편",
    inbound: "오는 편",
    flightSegments: "여정 구간",
    addSegment: "구간 추가",
    removeSegment: "구간 삭제",
    segment: "구간",
    // 섹션 제목 추가
    hotelInfo: "호텔 정보",
    airlineInfo: "항공 정보"
  },
  en: {
    title: "Edit Booking",
    subtitle: "Edit booking information",
    back: "Back to List",
    save: "Save",
    cancel: "Cancel",
    loading: "Loading...",
    notFound: "Booking not found",
    saveSuccess: "Booking updated successfully",
    saveError: "Failed to update booking",
    partSelection: "Part Selection",
    air: "AIR",
    cint: "CINT",
    basicInfo: "Basic Information",
    tourInfo: "Tour Information",
    customerInfo: "Customer Information",
    paymentInfo: "Payment Information",
    bookingNumber: "Booking Number",
    status: "Status",
    bookingType: "Booking Type",
    tourStartDate: "Tour Start Date",
    tourEndDate: "Tour End Date",
    nights: "Nights",
    country: "Country",
    region: "Region",
    agentCode: "Agent Code",
    agentName: "Agent Name",
    hotelName: "Hotel Name",
    airline: "Airline",
    departureRoute: "Departure Route",
    returnRoute: "Return Route",
    roomType: "Room Type",
    roomCount: "Room Count",
    airIncluded: "Air Included",
    totalPax: "Total Pax",
    adults: "Adults",
    children: "Children",
    infants: "Infants",
    costPrice: "Cost Price",
    markup: "Markup",
    sellingPrice: "Selling Price",
    totalPayment: "Total Payment",
    deposit: "Deposit",
    balance: "Balance",
    paymentMethod: "Payment Method",
    paymentStatus: "Payment Status",
    remarks: "Remarks",
    selectTA: "Select TA",
    searchCustomer: "Search Customer from DB",
    addCustomer: "Add Customer",
    removeCustomer: "Remove Customer",
    firstName: "First Name",
    lastName: "Last Name",
    gender: "Gender",
    nationality: "Nationality",
    passportNumber: "Passport Number",
    passportExpiry: "Passport Expiry",
    basicInfoReadOnly: "Basic information cannot be modified. Please cancel and re-book if modification is needed.",
    new: "New",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
    pending: "Pending",
    partial: "Partial",
    fit: "FIT",
    pkg: "PKG",
    group: "GROUP",
    revision: "REVISION",
    // 항공편 관련 텍스트 추가
    flightType: "Flight Type",
    oneway: "One-way",
    roundtrip: "Round-trip",
    multicity: "Multi-city",
    flightInfo: "Flight Information",
    departure: "Departure",
    arrival: "Arrival",
    outbound: "Outbound",
    inbound: "Inbound",
    flightSegments: "Flight Segments",
    addSegment: "Add Segment",
    removeSegment: "Remove Segment",
    segment: "Segment",
    // 섹션 제목 추가
    hotelInfo: "Hotel Information",
    airlineInfo: "Airline Information"
  }
};

interface Traveler {
  id: string;
  surname: string;
  givenNames: string;
  fullName: string;
  gender: string;
  nationality: string;
  passportNumber: string;
  passportExpiry: string;
  email: string;
  phone: string;
  passportPhotoURL: string;
  createdAt: unknown;
}

interface TA {
  id: string;
  companyName: string;
  taCode: string;
  phone: string;
  address: string;
  email: string;
  logo?: string;
  overlayImage?: string;
  contactPersons?: Array<{
    name: string;
    position: string;
    phone: string;
    email: string;
  }>;
  createdAt: unknown;
}

export default function BookingEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const { lang } = useLanguage();
  const texts = BOOKING_EDIT_TEXTS[lang];

  const [booking, setBooking] = useState<Booking | null>(null);
  const [formData, setFormData] = useState<Partial<Booking>>({});
  const [loading, setLoading] = useState(true);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showTASelectionModal, setShowTASelectionModal] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const data = await apiFetchJson<Booking>(`/api/bookings/${id}`);
        setBooking(data);
        setFormData(data);
      } catch (error) {
        console.error('예약 데이터 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBooking();
    }
  }, [id]);

  const handleInputChange = (field: keyof Booking, value: string | number | boolean | Date | Array<{ departure: string; arrival: string }>) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomerSelect = (traveler: Traveler) => {
    const newCustomer = {
      firstName: traveler.givenNames,
      lastName: traveler.surname,
      gender: traveler.gender,
      nationality: traveler.nationality,
      passportNumber: traveler.passportNumber,
      passportExpiry: traveler.passportExpiry
    };

    setFormData(prev => ({
      ...prev,
      customers: [...(prev.customers || []), newCustomer]
    }));
    setShowCustomerModal(false);
  };

  const handleTASelect = (ta: TA) => {
    setFormData(prev => ({
      ...prev,
      agentName: ta.companyName,
      agentCode: ta.taCode
    }));
    setShowTASelectionModal(false);
  };

  const removeCustomer = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customers: prev.customers?.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert(texts.saveSuccess);
        router.push(`/admin/bookings/${id}`);
      } else {
        alert(texts.saveError);
      }
    } catch (error) {
      console.error('예약 수정 실패:', error);
      alert(texts.saveError);
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

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">{texts.notFound}</p>
          <Link href="/admin/bookings" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
            {texts.back}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form id="booking-edit-form" onSubmit={handleSubmit} className="space-y-8">
          {/* 파트 선택 및 상태 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{texts.partSelection}</h2>
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">{texts.status}:</label>
                <select
                  value={formData.status || ''}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="new">{texts.new}</option>
                  <option value="confirmed">{texts.confirmed}</option>
                  <option value="completed">{texts.completed}</option>
                  <option value="cancelled">{texts.cancelled}</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => handleInputChange('part', 'AIR')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  formData.part === 'AIR'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {texts.air}
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('part', 'CINT')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  formData.part === 'CINT'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {texts.cint}
              </button>
            </div>
          </motion.div>

          {/* 기본 정보 (읽기 전용) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{texts.basicInfo}</h2>
              <div className="text-sm text-gray-500 bg-yellow-50 px-3 py-1 rounded-md">
                {texts.basicInfoReadOnly}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.bookingNumber}
                </label>
                <input
                  type="text"
                  value={formData.bookingNumber || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.bookingType}
                </label>
                <input
                  type="text"
                  value={formData.bookingType || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.tourStartDate}
                </label>
                <input
                  type="text"
                  value={formData.tourStartDate ? new Date(formData.tourStartDate).toLocaleDateString() : ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.tourEndDate}
                </label>
                <input
                  type="text"
                  value={formData.tourEndDate ? new Date(formData.tourEndDate).toLocaleDateString() : ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.nights}
                </label>
                <input
                  type="text"
                  value={formData.nights || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.country}
                </label>
                <input
                  type="text"
                  value={formData.country || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.region}
                </label>
                <input
                  type="text"
                  value={formData.region || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.agentCode}
                </label>
                <input
                  type="text"
                  value={formData.agentCode || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.agentName}
                </label>
                <input
                  type="text"
                  value={formData.agentName || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  readOnly
                />
              </div>
            </div>
          </motion.div>

          {/* 호텔 정보 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 className="text-lg font-semibold mb-4">{texts.hotelInfo}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.hotelName}
                </label>
                <input
                  type="text"
                  value={formData.hotelName || ''}
                  onChange={(e) => handleInputChange('hotelName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.roomType}
                </label>
                <input
                  type="text"
                  value={formData.roomType || ''}
                  onChange={(e) => handleInputChange('roomType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.roomCount}
                </label>
                <input
                  type="number"
                  value={formData.roomCount || ''}
                  onChange={(e) => handleInputChange('roomCount', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </motion.div>

          {/* 항공 정보 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 className="text-lg font-semibold mb-4">{texts.airlineInfo}</h2>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.airIncluded || false}
                    onChange={(e) => handleInputChange('airIncluded', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">{texts.airIncluded}</span>
                </label>
              </div>
            </div>
            
            {/* 항공사 및 여정 유형 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.airline}
                </label>
                <select
                  value={formData.airline || ''}
                  onChange={(e) => handleInputChange('airline', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">항공사 선택</option>
                  <option value="LJ">진에어 (LJ)</option>
                  <option value="BX">에어부산 (BX)</option>
                  <option value="7C">제주항공 (7C)</option>
                  <option value="KE">대한항공 (KE)</option>
                  <option value="OZ">아시아나항공 (OZ)</option>
                  <option value="TW">티웨이항공 (TW)</option>
                  <option value="RS">에어서울 (RS)</option>
                  <option value="PR">필리핀항공 (PR)</option>
                  <option value="5J">세부퍼시픽 (5J)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.flightType}
                </label>
                <select
                  value={formData.flightType || ''}
                  onChange={(e) => handleInputChange('flightType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">여정 유형 선택</option>
                  <option value="oneway">{texts.oneway}</option>
                  <option value="roundtrip">{texts.roundtrip}</option>
                  <option value="multicity">{texts.multicity}</option>
                </select>
              </div>
            </div>

            {/* 여정 정보 */}
            {formData.flightType && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  {texts.flightInfo}
                </h3>
                
                {/* 편도 */}
                {formData.flightType === 'oneway' && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {texts.departure}
                        </label>
                        <input
                          type="text"
                          placeholder="예: ICN (인천)"
                          value={formData.departureRoute || ''}
                          onChange={(e) => handleInputChange('departureRoute', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {texts.arrival}
                        </label>
                        <input
                          type="text"
                          placeholder="예: CEB (세부)"
                          value={formData.returnRoute || ''}
                          onChange={(e) => handleInputChange('returnRoute', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 왕복 */}
                {formData.flightType === 'roundtrip' && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-800 mb-3">{texts.outbound}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {texts.departure}
                          </label>
                          <input
                            type="text"
                            placeholder="예: ICN (인천)"
                            value={formData.departureRoute || ''}
                            onChange={(e) => handleInputChange('departureRoute', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {texts.arrival}
                          </label>
                          <input
                            type="text"
                            placeholder="예: CEB (세부)"
                            value={formData.returnRoute || ''}
                            onChange={(e) => handleInputChange('returnRoute', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-green-800 mb-3">{texts.inbound}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {texts.departure}
                          </label>
                          <input
                            type="text"
                            placeholder="예: CEB (세부)"
                            value={formData.returnDepartureRoute || ''}
                            onChange={(e) => handleInputChange('returnDepartureRoute', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {texts.arrival}
                          </label>
                          <input
                            type="text"
                            placeholder="예: ICN (인천)"
                            value={formData.returnArrivalRoute || ''}
                            onChange={(e) => handleInputChange('returnArrivalRoute', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 다구간 */}
                {formData.flightType === 'multicity' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-900">{texts.flightSegments}</h4>
                      <button
                        type="button"
                        onClick={() => {
                          const newSegments = [...(formData.flightSegments || []), { departure: '', arrival: '' }];
                          handleInputChange('flightSegments', newSegments);
                        }}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        + {texts.addSegment}
                      </button>
                    </div>
                    
                    {(formData.flightSegments || []).map((segment, index) => (
                      <div key={index} className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-medium text-purple-800">{texts.segment} {index + 1}</h5>
                          {(formData.flightSegments || []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newSegments = (formData.flightSegments || []).filter((_, i) => i !== index);
                                handleInputChange('flightSegments', newSegments);
                              }}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              {texts.removeSegment}
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {texts.departure}
                            </label>
                            <input
                              type="text"
                              placeholder="예: ICN (인천)"
                              value={segment.departure}
                              onChange={(e) => {
                                const newSegments = [...(formData.flightSegments || [])];
                                newSegments[index] = { ...segment, departure: e.target.value };
                                handleInputChange('flightSegments', newSegments);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {texts.arrival}
                            </label>
                            <input
                              type="text"
                              placeholder="예: CEB (세부)"
                              value={segment.arrival}
                              onChange={(e) => {
                                const newSegments = [...(formData.flightSegments || [])];
                                newSegments[index] = { ...segment, arrival: e.target.value };
                                handleInputChange('flightSegments', newSegments);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* 고객 정보 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{texts.customerInfo}</h2>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {texts.searchCustomer}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      customers: [...(prev.customers || []), {
                        firstName: '',
                        lastName: '',
                        gender: '',
                        nationality: '',
                        passportNumber: '',
                        passportExpiry: ''
                      }]
                    }));
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  {texts.addCustomer}
                </button>
              </div>
            </div>
            
            {/* 고객 목록 */}
            {formData.customers && formData.customers.length > 0 && (
              <div className="space-y-4">
                {formData.customers.map((customer, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">고객 {index + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removeCustomer(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        {texts.removeCustomer}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{texts.lastName}</label>
                        <input
                          type="text"
                          value={customer.firstName || ''}
                          onChange={(e) => {
                            const newCustomers = [...(formData.customers || [])];
                            newCustomers[index] = { ...customer, firstName: e.target.value };
                            setFormData(prev => ({ ...prev, customers: newCustomers }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{texts.firstName}</label>
                        <input
                          type="text"
                          value={customer.lastName || ''}
                          onChange={(e) => {
                            const newCustomers = [...(formData.customers || [])];
                            newCustomers[index] = { ...customer, lastName: e.target.value };
                            setFormData(prev => ({ ...prev, customers: newCustomers }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{texts.passportNumber}</label>
                        <input
                          type="text"
                          value={customer.passportNumber || ''}
                          onChange={(e) => {
                            const newCustomers = [...(formData.customers || [])];
                            newCustomers[index] = { ...customer, passportNumber: e.target.value };
                            setFormData(prev => ({ ...prev, customers: newCustomers }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{texts.passportExpiry}</label>
                        <input
                          type="date"
                          value={customer.passportExpiry || ''}
                          onChange={(e) => {
                            const newCustomers = [...(formData.customers || [])];
                            newCustomers[index] = { ...customer, passportExpiry: e.target.value };
                            setFormData(prev => ({ ...prev, customers: newCustomers }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{texts.gender}</label>
                        <select
                          value={customer.gender || ''}
                          onChange={(e) => {
                            const newCustomers = [...(formData.customers || [])];
                            newCustomers[index] = { ...customer, gender: e.target.value };
                            setFormData(prev => ({ ...prev, customers: newCustomers }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">선택</option>
                          <option value="male">남성</option>
                          <option value="female">여성</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{texts.nationality}</label>
                        <input
                          type="text"
                          value={customer.nationality || ''}
                          onChange={(e) => {
                            const newCustomers = [...(formData.customers || [])];
                            newCustomers[index] = { ...customer, nationality: e.target.value };
                            setFormData(prev => ({ ...prev, customers: newCustomers }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.totalPax}
                </label>
                <input
                  type="number"
                  value={formData.totalPax || ''}
                  onChange={(e) => handleInputChange('totalPax', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.adults}
                </label>
                <input
                  type="number"
                  value={formData.adults || ''}
                  onChange={(e) => handleInputChange('adults', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.children}
                </label>
                <input
                  type="number"
                  value={formData.children || ''}
                  onChange={(e) => handleInputChange('children', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.infants}
                </label>
                <input
                  type="number"
                  value={formData.infants || ''}
                  onChange={(e) => handleInputChange('infants', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </motion.div>

          {/* 결제 정보 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 className="text-lg font-semibold mb-4">{texts.paymentInfo}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.costPrice}
                </label>
                <input
                  type="number"
                  value={formData.costPrice || ''}
                  onChange={(e) => handleInputChange('costPrice', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.markup}
                </label>
                <input
                  type="number"
                  value={formData.markup || ''}
                  onChange={(e) => handleInputChange('markup', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.sellingPrice}
                </label>
                <input
                  type="number"
                  value={formData.sellingPrice || ''}
                  onChange={(e) => handleInputChange('sellingPrice', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.totalPayment}
                </label>
                <input
                  type="number"
                  value={formData.totalPayment || ''}
                  onChange={(e) => handleInputChange('totalPayment', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.deposit}
                </label>
                <input
                  type="number"
                  value={formData.deposit || ''}
                  onChange={(e) => handleInputChange('deposit', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.balance}
                </label>
                <input
                  type="number"
                  value={formData.balance || ''}
                  onChange={(e) => handleInputChange('balance', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.paymentMethod}
                </label>
                <input
                  type="text"
                  value={formData.paymentMethod || ''}
                  onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.paymentStatus}
                </label>
                <select
                  value={formData.paymentStatus || ''}
                  onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">{texts.pending}</option>
                  <option value="partial">{texts.partial}</option>
                  <option value="completed">{texts.completed}</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* 비고 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 className="text-lg font-semibold mb-4">{texts.remarks}</h2>
            <textarea
              value={formData.remarks || ''}
              onChange={(e) => handleInputChange('remarks', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="비고를 입력하세요..."
            />
          </motion.div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/admin/bookings"
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              {texts.cancel}
            </Link>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {texts.save}
            </button>
          </div>
        </form>

        {/* 고객 선택 모달 */}
        {showCustomerModal && (
          <CustomerSelectionModal
            isOpen={showCustomerModal}
            onClose={() => setShowCustomerModal(false)}
            onSelect={handleCustomerSelect}
          />
        )}

        {/* TA 선택 모달 */}
        {showTASelectionModal && (
          <TASelectionModal
            isOpen={showTASelectionModal}
            onClose={() => setShowTASelectionModal(false)}
            onSelect={handleTASelect}
          />
        )}
      </main>
    </div>
  );
} 