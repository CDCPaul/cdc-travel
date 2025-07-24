'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/components/LanguageContext';
import { Booking } from '@/types/booking';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { apiFetchJson } from '@/lib/api-utils';

const CONFIRMED_BOOKING_EDIT_TEXTS = {
  ko: {
    title: "확정 예약 수정",
    back: "상세보기로",
    save: "저장",
    loading: "로딩 중...",
    notFound: "확정 예약을 찾을 수 없습니다",
    saveSuccess: "확정 예약이 성공적으로 수정되었습니다",
    saveError: "확정 예약 수정에 실패했습니다",
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
    airlineRoute1: "항공노선1",
    airlineRoute2: "항공노선2",
    roomType: "객실 타입",
    roomCount: "객실 수",
    airlineIncluded: "항공포함",
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
    remarks: "비고"
  },
  en: {
    title: "Edit Confirmed Booking",
    back: "Back to Details",
    save: "Save",
    loading: "Loading...",
    notFound: "Confirmed booking not found",
    saveSuccess: "Confirmed booking updated successfully",
    saveError: "Failed to update confirmed booking",
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
    airlineRoute1: "Airline Route 1",
    airlineRoute2: "Airline Route 2",
    roomType: "Room Type",
    roomCount: "Room Count",
    airlineIncluded: "Airline Included",
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
    remarks: "Remarks"
  }
};

export default function ConfirmedBookingEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const { lang } = useLanguage();
  const texts = CONFIRMED_BOOKING_EDIT_TEXTS[lang];
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [formData, setFormData] = useState<Partial<Booking>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchBooking();
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchBooking = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiFetchJson<{success: boolean, booking: Booking}>(`/api/bookings/confirmed/${id}`);
      
      if (response.success && response.booking) {
        setBooking(response.booking);
        setFormData(response.booking);
      } else {
        alert(texts.notFound);
        router.push('/admin/bookings/confirmed');
      }
    } catch (error) {
      console.error('확정 예약 정보 가져오기 실패:', error);
      alert(texts.notFound);
      router.push('/admin/bookings/confirmed');
    } finally {
      setLoading(false);
    }
  }, [id, router, texts.notFound]);

  const handleInputChange = (field: keyof Booking, value: string | number | boolean | Date) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await apiFetchJson<{success: boolean}>(`/api/bookings/confirmed/${id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      
      if (response.success) {
        alert(texts.saveSuccess);
        router.push(`/admin/bookings/confirmed/${id}`);
      } else {
        alert(texts.saveError);
      }
    } catch (error) {
      console.error('확정 예약 수정 실패:', error);
      alert(texts.saveError);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{texts.loading}</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{texts.notFound}</p>
          <Link href="/admin/bookings/confirmed" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
            {texts.back}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form id="confirmed-booking-edit-form" onSubmit={handleSubmit} className="space-y-8">
          {/* 기본 정보 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 className="text-lg font-semibold mb-4">{texts.basicInfo}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.bookingNumber}
                </label>
                <input
                  type="text"
                  value={formData.bookingNumber || ''}
                  onChange={(e) => handleInputChange('bookingNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.status}
                </label>
                <select
                  value={formData.status || ''}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="confirmed">확정</option>
                  <option value="completed">완료</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.bookingType}
                </label>
                <select
                  value={formData.bookingType || ''}
                  onChange={(e) => handleInputChange('bookingType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="FIT">FIT</option>
                  <option value="PKG">PKG</option>
                  <option value="GROUP">GROUP</option>
                  <option value="REVISION">REVISION</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.tourStartDate}
                </label>
                <input
                  type="date"
                  value={formData.tourStartDate ? new Date(formData.tourStartDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleInputChange('tourStartDate', new Date(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.tourEndDate}
                </label>
                <input
                  type="date"
                  value={formData.tourEndDate ? new Date(formData.tourEndDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleInputChange('tourEndDate', new Date(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.nights}
                </label>
                <input
                  type="number"
                  value={formData.nights || ''}
                  onChange={(e) => handleInputChange('nights', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.country}
                </label>
                <input
                  type="text"
                  value={formData.country || ''}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.region}
                </label>
                <input
                  type="text"
                  value={formData.region || ''}
                  onChange={(e) => handleInputChange('region', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </motion.div>

          {/* 투어 정보 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 className="text-lg font-semibold mb-4">{texts.tourInfo}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.agentCode}
                </label>
                <input
                  type="text"
                  value={formData.agentCode || ''}
                  onChange={(e) => handleInputChange('agentCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.agentName}
                </label>
                <input
                  type="text"
                  value={formData.agentName || ''}
                  onChange={(e) => handleInputChange('agentName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
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
                  {texts.airline}
                </label>
                <input
                  type="text"
                  value={formData.airline || ''}
                  onChange={(e) => handleInputChange('airline', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.airlineRoute1}
                </label>
                <input
                  type="text"
                  value={formData.airlineRoute1 || ''}
                  onChange={(e) => handleInputChange('airlineRoute1', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.airlineRoute2}
                </label>
                <input
                  type="text"
                  value={formData.airlineRoute2 || ''}
                  onChange={(e) => handleInputChange('airlineRoute2', e.target.value)}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.airlineIncluded}
                </label>
                <input
                  type="checkbox"
                  checked={formData.airlineIncluded || false}
                  onChange={(e) => handleInputChange('airlineIncluded', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
            </div>
          </motion.div>

          {/* 고객 정보 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 className="text-lg font-semibold mb-4">{texts.customerInfo}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.costPrice}
                </label>
                <input
                  type="number"
                  value={formData.costPrice || ''}
                  onChange={(e) => handleInputChange('costPrice', parseFloat(e.target.value))}
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
                  onChange={(e) => handleInputChange('markup', parseFloat(e.target.value))}
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
                  onChange={(e) => handleInputChange('sellingPrice', parseFloat(e.target.value))}
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
                  onChange={(e) => handleInputChange('totalPayment', parseFloat(e.target.value))}
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
                  onChange={(e) => handleInputChange('deposit', parseFloat(e.target.value))}
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
                  onChange={(e) => handleInputChange('balance', parseFloat(e.target.value))}
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
                  <option value="pending">대기</option>
                  <option value="partial">부분</option>
                  <option value="completed">완료</option>
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
        </form>
      </main>
    </div>
  );
} 