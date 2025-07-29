'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useLanguage } from '@/components/LanguageContext';
import { Booking } from '@/types/booking';
import { motion } from 'framer-motion';
import { apiFetchJson } from '@/lib/api-utils';

const CONFIRMED_BOOKING_DETAIL_TEXTS = {
  ko: {
    title: "확정 예약 상세보기",
    back: "목록으로",
    loading: "로딩 중...",
    notFound: "확정 예약을 찾을 수 없습니다",
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
    receivedBy: "접수자",
    receivedAt: "접수일",
    hotelName: "호텔명",
    airline: "항공사",
    airlineRoute1: "항공노선1",
    airlineRoute2: "항공노선2",
    roomType: "객실 타입",
    roomCount: "객실 수",
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
    paymentDate: "결제일",
    confirmedAt: "확정일",
    confirmedBy: "확정자",
    remarks: "비고",
    createdAt: "생성일",
    updatedAt: "수정일"
  },
  en: {
    title: "Confirmed Booking Details",
    back: "Back to List",
    loading: "Loading...",
    notFound: "Confirmed booking not found",
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
    receivedBy: "Received By",
    receivedAt: "Received At",
    hotelName: "Hotel Name",
    airline: "Airline",
    airlineRoute1: "Airline Route 1",
    airlineRoute2: "Airline Route 2",
    roomType: "Room Type",
    roomCount: "Room Count",
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
    paymentDate: "Payment Date",
    confirmedAt: "Confirmed At",
    confirmedBy: "Confirmed By",
    remarks: "Remarks",
    createdAt: "Created At",
    updatedAt: "Updated At"
  }
};

export default function ConfirmedBookingDetailPage() {
  const { id } = useParams();
  const { lang } = useLanguage();
  const texts = CONFIRMED_BOOKING_DETAIL_TEXTS[lang];
  
  const [booking, setBooking] = useState<Booking | null>(null);
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
      } else {
        alert(texts.notFound);
      }
    } catch (error) {
      console.error('확정 예약 정보 가져오기 실패:', error);
      alert(texts.notFound);
    } finally {
      setLoading(false);
    }
  }, [id, texts.notFound]);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return '확정';
      case 'completed': return '완료';
      default: return status;
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '완료';
      case 'partial': return '부분';
      case 'pending': return '대기';
      default: return status;
    }
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ko-KR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 기본 정보 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 className="text-lg font-semibold mb-4">{texts.basicInfo}</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">{texts.bookingNumber}:</span>
                <span>{booking.bookingNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{texts.status}:</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {getStatusText(booking.status)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{texts.bookingType}:</span>
                <span>{booking.bookingType}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{texts.tourStartDate}:</span>
                <span>{formatDate(booking.tourStartDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{texts.tourEndDate}:</span>
                <span>{formatDate(booking.tourEndDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{texts.nights}:</span>
                <span>{booking.nights || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{texts.country}:</span>
                <span>{booking.country}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{texts.region}:</span>
                <span>{booking.region}</span>
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
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">{texts.agentCode}:</span>
                <span>{booking.agentCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{texts.agentName}:</span>
                <span>{booking.agentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{texts.hotelName}:</span>
                <span>{booking.hotelName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{texts.airline}:</span>
                <span>{booking.airline}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{texts.airlineRoute1}:</span>
                <span>{booking.airlineRoute1}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{texts.airlineRoute2}:</span>
                <span>{booking.airlineRoute2}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{texts.roomType}:</span>
                <span>{booking.roomType}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{texts.roomCount}:</span>
                <span>{booking.roomCount}</span>
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
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">{texts.totalPax}:</span>
                <span>{booking.totalPax}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{texts.adults}:</span>
                <span>{booking.adults}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{texts.children}:</span>
                <span>{booking.children}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{texts.infants}:</span>
                <span>{booking.infants}</span>
              </div>
            </div>
            
            {/* 고객 목록 */}
            {booking.customers && booking.customers.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">고객 목록</h3>
                <div className="space-y-2">
                  {booking.customers.map((customer, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded">
                      <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                      <div className="text-sm text-gray-600">성별: {customer.gender}</div>
                      <div className="text-sm text-gray-600">국적: {customer.nationality}</div>
                      {customer.passportNumber && (
                        <div className="text-sm text-gray-600">여권번호: {customer.passportNumber}</div>
                      )}
                      {customer.passportExpiry && (
                        <div className="text-sm text-gray-600">여권만료일: {customer.passportExpiry}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* 결제 정보 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 className="text-lg font-semibold mb-4">{texts.paymentInfo}</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">{texts.costPrice}:</span>
                <span>{formatCurrency(booking.costPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{texts.markup}:</span>
                <span>{formatCurrency(booking.markup)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{texts.sellingPrice}:</span>
                <span className="font-semibold">{formatCurrency(booking.sellingPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{texts.totalPayment}:</span>
                <span>{formatCurrency(booking.totalPayment)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{texts.deposit}:</span>
                <span>{formatCurrency(booking.deposit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{texts.balance}:</span>
                <span>{formatCurrency(booking.balance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{texts.paymentMethod}:</span>
                <span>{booking.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{texts.paymentStatus}:</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  booking.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                  booking.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {getPaymentStatusText(booking.paymentStatus)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{texts.paymentDate}:</span>
                <span>{formatDate(booking.paymentDate)}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 비고 - 전체 너비 */}
        {booking.remarks && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow p-6 mt-6"
          >
            <h2 className="text-lg font-semibold mb-4">{texts.remarks}</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{booking.remarks}</p>
          </motion.div>
        )}
      </main>
    </div>
  );
} 