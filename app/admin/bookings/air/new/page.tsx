'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomerSelector, CustomerInfo } from '@/components/bookings/CustomerSelector';
import { CompactTravelDateSelector, getCompactGlobalInstance } from '@/components/bookings/CompactTravelDateSelector';
import { ModernPaxSelector, SimplePaxInfo } from '@/components/bookings/ModernPaxSelector';
import { Plane, ArrowLeft, Users, Calendar, User, CheckCircle, AlertCircle } from 'lucide-react';
import { z } from 'zod';

// 항공예약 전용 스키마
const airBookingSchema = z.object({
  airline: z.string().optional(),
  flightNumber: z.string().optional(),
  departureTime: z.string().optional(),
  arrivalTime: z.string().optional(),
  returnFlightNumber: z.string().optional(),
  returnDepartureTime: z.string().optional(),
  returnArrivalTime: z.string().optional(),
  notes: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  tags: z.array(z.string()),
});

type AirBookingFormData = z.infer<typeof airBookingSchema>;

export default function AirBookingPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // 고객 정보
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    type: 'DIRECT',
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // 승객 인원수
  const [paxInfo, setPaxInfo] = useState<SimplePaxInfo>({
    adults: 1,
    children: 0,
    infants: 0,
    total: 1,
    notes: ''
  });

  const form = useForm<AirBookingFormData>({
    resolver: zodResolver(airBookingSchema),
    defaultValues: {
      priority: 'MEDIUM',
      tags: [],
      notes: ''
    }
  });

  const handleSubmit = async (data: AirBookingFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 여행일정 데이터 가져오기
      const travelData = getCompactGlobalInstance().getData();
      
      // 항공예약 데이터 구성
      const bookingData = {
        projectType: 'AIR_ONLY',
        customer: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
          company: customerInfo.type === 'TA' ? customerInfo.name : undefined,
          address: customerInfo.address,
          nationality: 'KR',
          notes: ''
        },
        dates: {
          start: travelData.segments[0]?.departureDate 
            ? new Date(travelData.segments[0].departureDate)
            : new Date(),
          end: travelData.type === 'ROUND_TRIP' && travelData.returnDate
            ? new Date(travelData.returnDate)
            : travelData.segments[travelData.segments.length - 1]?.departureDate
            ? new Date(travelData.segments[travelData.segments.length - 1].departureDate)
            : new Date()
        },
        paxInfo: {
          adults: paxInfo.adults,
          children: paxInfo.children,
          infants: paxInfo.infants,
          total: paxInfo.total,
          details: [] // 상세 정보는 나중에 추가
        },
        flightDetails: {
          route: travelData.segments.length > 0 
            ? `${travelData.segments[0].origin}-${travelData.segments[0].destination}`
            : 'ICN-CEB',
          departureDate: travelData.segments[0]?.departureDate
            ? new Date(travelData.segments[0].departureDate)
            : new Date(),
          returnDate: travelData.type === 'ROUND_TRIP' && travelData.returnDate
            ? new Date(travelData.returnDate)
            : undefined,
          flightType: travelData.type === 'ONE_WAY' ? 'ONE_WAY' : 'ROUND_TRIP',
          departureFlights: data.flightNumber ? [{
            airline: data.airline || '',
            flightNumber: data.flightNumber,
            departureTime: data.departureTime || '',
            arrivalTime: data.arrivalTime || ''
          }] : [],
          returnFlights: data.returnFlightNumber ? [{
            airline: data.airline || '',
            flightNumber: data.returnFlightNumber,
            departureTime: data.returnDepartureTime || '',
            arrivalTime: data.returnArrivalTime || ''
          }] : []
        },
        groupType: 'GROUP',
        ticketingDeadline: undefined, // 나중에 입력
        specialRequests: data.notes ? [data.notes] : [],
        notes: data.notes || '',
        priority: data.priority || 'MEDIUM',
        tags: data.tags || []
      };

      console.log('🛫 항공예약 데이터:', bookingData);

      // API 호출
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(bookingData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '항공예약 생성에 실패했습니다.');
      }

      setSubmitSuccess(true);

      // 성공 시 상세 페이지로 이동
      setTimeout(() => {
        router.push(`/admin/bookings/${result.data.bookingId}`);
      }, 2000);

    } catch (error) {
      console.error('항공예약 생성 실패:', error);
      setSubmitError(error instanceof Error ? error.message : '항공예약 생성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 헤더 */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/admin/bookings/new')}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  예약 타입 선택으로
                </Button>
                
                <div className="border-l border-gray-300 pl-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Plane className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">항공 예약 등록</h1>
                      <p className="text-sm text-gray-600">
                        항공권 단독 예약을 등록합니다 (AIR ONLY)
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
                    <span className="text-sm">저장 중...</span>
                  </div>
                )}

                {submitSuccess && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">등록 완료!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 에러/성공 메시지 */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">예약 등록 실패</h3>
                <p className="text-sm text-red-700 mt-1">{submitError}</p>
              </div>
            </div>
          </div>
        )}

        {submitSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-green-800">항공예약 등록 완료</h3>
                <p className="text-sm text-green-700 mt-1">
                  새로운 항공예약이 성공적으로 등록되었습니다. 상세 페이지로 이동합니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 예약 폼 */}
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          
          {/* 1. 고객 정보 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <User className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">고객 정보</h3>
            </div>
            <CustomerSelector
              value={customerInfo}
              onChange={setCustomerInfo}
            />
          </div>

          {/* 2. 여행 일정 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Calendar className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">여행 일정</h3>
            </div>
            <CompactTravelDateSelector />
          </div>

          {/* 3. 승객 인원수 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Users className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">승객 인원수</h3>
            </div>
            <ModernPaxSelector
              value={paxInfo}
              onChange={setPaxInfo}
            />
          </div>

          {/* 4. 항공편 정보 (선택사항) */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Plane className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">항공편 정보 (선택사항)</h3>
              <span className="text-sm text-gray-500">항공사 확정 후 입력 가능</span>
            </div>
            
            <div className="space-y-6">
              {/* 항공사 정보 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  항공사
                </label>
                <Input
                  type="text"
                  placeholder="예) 세부퍼시픽, 필리핀항공, 에어아시아"
                  {...form.register('airline')}
                  className="max-w-md"
                />
              </div>

              {/* 출발편 정보 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  출발편 정보
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">편명</label>
                    <Input
                      type="text"
                      placeholder="예) 5J815"
                      {...form.register('flightNumber')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">출발시간</label>
                    <Input
                      type="time"
                      {...form.register('departureTime')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">도착시간</label>
                    <Input
                      type="time"
                      {...form.register('arrivalTime')}
                    />
                  </div>
                </div>
              </div>

              {/* 복귀편 정보 (왕복일 경우만) */}
              <div className="border border-gray-200 rounded-lg p-4" id="return-flight-section">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  복귀편 정보
                  <span className="ml-2 text-xs text-gray-500">(왕복일 경우)</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">편명</label>
                    <Input
                      type="text"
                      placeholder="예) 5J816"
                      {...form.register('returnFlightNumber')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">출발시간</label>
                    <Input
                      type="time"
                      {...form.register('returnDepartureTime')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">도착시간</label>
                    <Input
                      type="time"
                      {...form.register('returnArrivalTime')}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. 추가 정보 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">추가 정보</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  우선순위
                </label>
                <select 
                  {...form.register('priority')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="LOW">낮음</option>
                  <option value="MEDIUM">보통</option>
                  <option value="HIGH">높음</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  메모 및 특별 요청사항
                </label>
                <textarea
                  {...form.register('notes')}
                  placeholder="특별 요청사항이나 메모를 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/bookings/new')}
              disabled={isSubmitting}
            >
              취소
            </Button>
            
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting || !customerInfo.name || !customerInfo.email || !customerInfo.phone}
            >
              {isSubmitting ? '저장 중...' : '항공예약 등록'}
            </Button>
          </div>
        </form>

        {/* 안내사항 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">🛫 항공예약 안내</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 항공권만 발권하는 예약으로 AIR팀에서 처리합니다.</li>
            <li>• 승객 상세 정보는 예약금 확인 후 별도로 입력 가능합니다.</li>
            <li>• 항공편 정보는 항공사 확정 후 수정할 수 있습니다.</li>
            <li>• 그룹 발권 시 발권 마감일은 나중에 업데이트 예정입니다.</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
