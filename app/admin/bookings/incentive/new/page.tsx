'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomerSelector, CustomerInfo } from '@/components/bookings/CustomerSelector';
import { StandaloneTravelDateSelector, getGlobalInstance } from '@/components/bookings/StandaloneTravelDateSelector';
import { SimplePaxSelector, SimplePaxInfo } from '@/components/bookings/SimplePaxSelector';
import { Users, ArrowLeft, Calendar, User, CheckCircle, AlertCircle, DollarSign, Settings } from 'lucide-react';
import { z } from 'zod';

// 인센티브 그룹예약 전용 스키마
const incentiveBookingSchema = z.object({
  groupName: z.string().min(1, '그룹명을 입력해주세요'),
  eventType: z.string().optional(),
  budgetMin: z.number().min(0),
  budgetMax: z.number().min(0),
  budgetCurrency: z.enum(['KRW', 'USD', 'PHP']),
  
  // 포함 서비스
  includeFlights: z.boolean(),
  includeAccommodation: z.boolean(),
  includeMeals: z.boolean(),
  includeTransportation: z.boolean(),
  includeGuide: z.boolean(),
  includeShopping: z.boolean(),
  
  // 추가 정보
  specialRequests: z.string().optional(),
  notes: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  tags: z.array(z.string()),
});

type IncentiveBookingFormData = z.infer<typeof incentiveBookingSchema>;

export default function IncentiveBookingPage() {
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

  // 승객 인원수 (그룹이므로 기본값 높게)
  const [paxInfo, setPaxInfo] = useState<SimplePaxInfo>({
    adults: 10,
    children: 0,
    infants: 0,
    total: 10,
    notes: ''
  });

  const form = useForm<IncentiveBookingFormData>({
    resolver: zodResolver(incentiveBookingSchema),
    defaultValues: {
      budgetMin: 0,
      budgetMax: 0,
      budgetCurrency: 'KRW',
      includeFlights: false,
      includeAccommodation: false,
      includeMeals: false,
      includeTransportation: false,
      includeGuide: false,
      includeShopping: false,
      priority: 'MEDIUM',
      tags: [],
      notes: ''
    }
  });

  const handleSubmit = async (data: IncentiveBookingFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 여행일정 데이터 가져오기
      const travelData = getGlobalInstance().getData();
      
      // 인센티브 그룹예약 데이터 구성
      const bookingData = {
        projectType: 'CINT_INCENTIVE_GROUP',
        customer: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
          company: customerInfo.type === 'TA' ? customerInfo.name : data.groupName,
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
          details: []
        },
        customRequirements: {
          includeFlights: data.includeFlights,
          includeAccommodation: data.includeAccommodation,
          includeMeals: data.includeMeals,
          includeTransportation: data.includeTransportation,
          includeGuide: data.includeGuide,
          includeShopping: data.includeShopping,
          specialRequests: data.specialRequests ? [data.specialRequests] : [],
          budgetRange: {
            min: data.budgetMin,
            max: data.budgetMax,
            currency: data.budgetCurrency
          }
        },
        landInfo: {
          accommodation: '',
          tourPrograms: data.eventType ? [data.eventType] : [],
          mealPlan: data.includeMeals ? '포함' : '별도',
          transportation: data.includeTransportation ? '포함' : '별도',
          guide: data.includeGuide ? '포함' : '별도',
          additionalServices: data.includeShopping ? ['쇼핑'] : []
        },
        flightDetails: data.includeFlights && travelData.segments.length > 0 ? {
          route: `${travelData.segments[0].origin}-${travelData.segments[0].destination}`,
          departureDate: new Date(travelData.segments[0].departureDate),
          returnDate: travelData.type === 'ROUND_TRIP' && travelData.returnDate
            ? new Date(travelData.returnDate)
            : undefined,
          flightType: travelData.type === 'ONE_WAY' ? 'ONE_WAY' : 'ROUND_TRIP',
          departureFlights: [],
          returnFlights: []
        } : undefined,
        notes: data.notes || '',
        priority: data.priority || 'MEDIUM',
        tags: [...(data.tags || []), 'INCENTIVE', 'GROUP']
      };

      console.log('👥 인센티브 그룹예약 데이터:', bookingData);

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
        throw new Error(result.error || '인센티브 그룹예약 생성에 실패했습니다.');
      }

      setSubmitSuccess(true);

      // 성공 시 상세 페이지로 이동
      setTimeout(() => {
        router.push(`/admin/bookings/${result.data.bookingId}`);
      }, 2000);

    } catch (error) {
      console.error('인센티브 그룹예약 생성 실패:', error);
      setSubmitError(error instanceof Error ? error.message : '인센티브 그룹예약 생성 중 오류가 발생했습니다.');
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
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">인센티브 그룹예약 등록</h1>
                      <p className="text-sm text-gray-600">
                        맞춤형 그룹 인센티브 상품 예약을 등록합니다
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 상태 표시 */}
              <div className="flex items-center space-x-4">
                {isSubmitting && (
                  <div className="flex items-center space-x-2 text-purple-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600" />
                    <span className="text-sm">저장 중...</span>
                  </div>
                )}

                {submitSuccess && (
                  <div className="flex items-center space-x-2 text-purple-600">
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
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-purple-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-purple-800">인센티브 그룹예약 등록 완료</h3>
                <p className="text-sm text-purple-700 mt-1">
                  새로운 인센티브 그룹예약이 성공적으로 등록되었습니다. 상세 페이지로 이동합니다.
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

          {/* 2. 그룹 정보 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Users className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">그룹 정보</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  그룹명 *
                </label>
                <Input
                  type="text"
                  placeholder="예) OO회사 임직원 인센티브 여행"
                  {...form.register('groupName')}
                  className={form.formState.errors.groupName ? 'border-red-500' : ''}
                />
                {form.formState.errors.groupName && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.groupName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  행사 유형
                </label>
                <Input
                  type="text"
                  placeholder="예) 회사 워크샵, 성과 포상, 팀빌딩"
                  {...form.register('eventType')}
                />
              </div>
            </div>
          </div>

          {/* 3. 여행 일정 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Calendar className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">여행 일정</h3>
            </div>
            <StandaloneTravelDateSelector />
          </div>

          {/* 4. 참가 인원수 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Users className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">참가 인원수</h3>
            </div>
            <SimplePaxSelector
              value={paxInfo}
              onChange={setPaxInfo}
            />
          </div>

          {/* 5. 예산 범위 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <DollarSign className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">예산 범위 (선택사항)</h3>
              <span className="text-sm text-gray-500">견적 작성에 참고됩니다</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  최소 예산 (1인당)
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  {...form.register('budgetMin', { valueAsNumber: true })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  최대 예산 (1인당)
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  {...form.register('budgetMax', { valueAsNumber: true })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  통화
                </label>
                <select 
                  {...form.register('budgetCurrency')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="KRW">원화 (KRW)</option>
                  <option value="USD">달러 (USD)</option>
                  <option value="PHP">페소 (PHP)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 6. 포함 서비스 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Settings className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">포함 서비스</h3>
              <span className="text-sm text-gray-500">필요한 서비스를 선택해주세요</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="includeFlights"
                  {...form.register('includeFlights')}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="includeFlights" className="text-sm font-medium text-gray-700">
                  항공권
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="includeAccommodation"
                  {...form.register('includeAccommodation')}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="includeAccommodation" className="text-sm font-medium text-gray-700">
                  숙박
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="includeMeals"
                  {...form.register('includeMeals')}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="includeMeals" className="text-sm font-medium text-gray-700">
                  식사
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="includeTransportation"
                  {...form.register('includeTransportation')}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="includeTransportation" className="text-sm font-medium text-gray-700">
                  교통수단
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="includeGuide"
                  {...form.register('includeGuide')}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="includeGuide" className="text-sm font-medium text-gray-700">
                  가이드
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="includeShopping"
                  {...form.register('includeShopping')}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="includeShopping" className="text-sm font-medium text-gray-700">
                  쇼핑
                </label>
              </div>
            </div>
          </div>

          {/* 7. 추가 정보 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">추가 정보</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  특별 요청사항
                </label>
                <textarea
                  {...form.register('specialRequests')}
                  placeholder="특별한 요구사항이나 고려사항이 있으시면 입력해주세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                />
              </div>

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
                  추가 메모
                </label>
                <textarea
                  {...form.register('notes')}
                  placeholder="추가 메모나 참고사항을 입력하세요"
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
              className="bg-purple-600 hover:bg-purple-700"
              disabled={isSubmitting || !customerInfo.name || !customerInfo.email || !customerInfo.phone}
            >
              {isSubmitting ? '저장 중...' : '인센티브 그룹예약 등록'}
            </Button>
          </div>
        </form>

        {/* 안내사항 */}
        <div className="mt-8 bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-medium text-purple-900 mb-2">👥 인센티브 그룹예약 안내</h4>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• 맞춤형 그룹 인센티브 상품으로 CINT팀에서 처리하며 필요시 AIR팀과 협업합니다.</li>
            <li>• 예산 범위는 견적 작성 시 참고자료로 활용됩니다.</li>
            <li>• 포함 서비스는 고객 요구사항에 따라 맞춤 구성됩니다.</li>
            <li>• 그룹 규모에 따라 특별 할인이나 추가 서비스가 제공될 수 있습니다.</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
