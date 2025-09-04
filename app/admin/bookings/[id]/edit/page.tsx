"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookingForm } from '@/components/bookings/BookingForm';
import { BookingFormData } from '@/lib/validations/booking';
import { Booking } from '@/types/booking';
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditBookingPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditBookingPage({ params }: EditBookingPageProps) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    loadBooking();
  }, [resolvedParams.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadBooking = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/bookings/${resolvedParams.id}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('예약 정보를 불러오는데 실패했습니다.');
      }

      const result = await response.json();
      setBooking(result.data);
    } catch (error) {
      console.error('Failed to load booking:', error);
      setError(error instanceof Error ? error.message : '예약 정보 로드 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      console.log('예약 수정 데이터:', data);

      // API 호출
      const response = await fetch(`/api/bookings/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '예약 수정에 실패했습니다.');
      }

      setSubmitSuccess(true);

      // 성공 시 상세 페이지로 이동
      setTimeout(() => {
        router.push(`/admin/bookings/${resolvedParams.id}`);
      }, 2000);

    } catch (error) {
      console.error('예약 수정 실패:', error);
      setSubmitError(error instanceof Error ? error.message : '예약 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('수정 중인 내용이 있습니다. 정말 취소하시겠습니까?')) {
      router.push(`/admin/bookings/${resolvedParams.id}`);
    }
  };

  const handleBackToDetail = () => {
    router.push(`/admin/bookings/${resolvedParams.id}`);
  };

  const handleBackToList = () => {
    router.push('/admin/bookings');
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">예약 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">오류가 발생했습니다</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-3">
            <Button onClick={handleBackToList} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로 돌아가기
            </Button>
            <Button onClick={loadBooking}>
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 예약을 찾을 수 없음
  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">예약을 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-4">수정하려는 예약 정보가 존재하지 않습니다.</p>
          <Button onClick={handleBackToList} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  // BookingForm에 전달할 초기 데이터 변환
  const initialFormData = {
    projectType: booking.projectType,
    customer: booking.customer,
    dates: booking.dates,
    paxInfo: booking.paxInfo,
    flightDetails: 'flightDetails' in booking ? booking.flightDetails : undefined,
    landInfo: 'landInfo' in booking ? booking.landInfo : undefined,
    packageInfo: 'packageInfo' in booking ? booking.packageInfo : undefined,
    customRequirements: 'customRequirements' in booking ? booking.customRequirements : undefined,
    notes: booking.notes,
    internalNotes: booking.internalNotes,
    priority: booking.priority,
    tags: booking.tags,
    deadlines: booking.deadlines
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 헤더 */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToDetail}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  상세보기로
                </Button>
                
                <div className="border-l border-gray-300 pl-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">예약 수정</h1>
                      <p className="text-sm text-gray-600">
                        {booking.bookingNumber} - {booking.customer.name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 상태 표시 */}
              <div className="flex items-center space-x-4">
                {isSubmitting && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                    <span className="text-sm">수정 중...</span>
                  </div>
                )}

                {submitSuccess && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">성공적으로 수정되었습니다!</span>
                  </div>
                )}

                {submitError && (
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">수정 실패</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">예약 수정 실패</h3>
                <p className="text-sm text-red-700 mt-1">{submitError}</p>
              </div>
            </div>
          </div>
        )}

        {/* 성공 메시지 */}
        {submitSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-green-800">예약 수정 완료</h3>
                <p className="text-sm text-green-700 mt-1">
                  예약이 성공적으로 수정되었습니다. 잠시 후 상세 페이지로 이동합니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 예약 폼 */}
        <BookingForm
          initialData={initialFormData}
          bookingId={resolvedParams.id}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isSubmitting}
        />

        {/* 도움말 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="p-1 bg-blue-100 rounded">
                <BookOpen className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-2">예약 수정 안내</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 예약 수정 시 기존 정보를 기반으로 수정할 수 있습니다.</li>
                <li>• 프로젝트 타입은 수정할 수 없습니다. 다른 타입이 필요하면 새 예약을 생성하세요.</li>
                <li>• 중요한 수정사항은 내부 메모에 기록해 두시기 바랍니다.</li>
                <li>• 수정 후에도 협업팀과의 조율이 필요할 수 있습니다.</li>
                <li>• 수정 내역은 자동으로 기록되어 추적 가능합니다.</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}