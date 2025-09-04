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
import { Package, ArrowLeft, Users, Calendar, User, CheckCircle, AlertCircle, MapPin } from 'lucide-react';
import { z } from 'zod';

// 패키지예약 전용 스키마
const packageBookingSchema = z.object({
  packageName: z.string().min(1, '패키지명을 입력해주세요'),
  packageType: z.enum(['STANDARD', 'PREMIUM', 'LUXURY']),
  minimumPax: z.number().min(1),
  maximumPax: z.number().min(1),
  accommodation: z.string().optional(),
  tourIncluded: z.string().optional(),
  mealPlan: z.string().optional(),
  notes: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  tags: z.array(z.string()),
});

type PackageBookingFormData = z.infer<typeof packageBookingSchema>;

export default function PackageBookingPage() {
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
    adults: 2,
    children: 0,
    infants: 0,
    total: 2,
    notes: ''
  });

  const form = useForm<PackageBookingFormData>({
    resolver: zodResolver(packageBookingSchema),
    defaultValues: {
      packageType: 'STANDARD',
      minimumPax: 2,
      maximumPax: 50,
      priority: 'MEDIUM',
      tags: [],
      notes: ''
    }
  });

  const handleSubmit = async (data: PackageBookingFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 여행일정 데이터 가져오기
      const travelData = getGlobalInstance().getData();
      
      // 패키지예약 데이터 구성
      const bookingData = {
        projectType: 'CINT_PACKAGE',
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
          details: []
        },
        packageInfo: {
          packageId: `PKG-${Date.now()}`,
          packageName: data.packageName,
          packageType: data.packageType,
          minimumPax: data.minimumPax,
          maximumPax: data.maximumPax,
          isPublished: false,
          marketingMaterials: []
        },
        landInfo: {
          accommodation: data.accommodation || '',
          tourPrograms: data.tourIncluded ? [data.tourIncluded] : [],
          mealPlan: data.mealPlan || '',
          transportation: '',
          guide: '',
          additionalServices: []
        },
        flightDetails: travelData.segments.length > 0 ? {
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
        tags: data.tags || []
      };

      console.log('📦 패키지예약 데이터:', bookingData);

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
        throw new Error(result.error || '패키지예약 생성에 실패했습니다.');
      }

      setSubmitSuccess(true);

      // 성공 시 상세 페이지로 이동
      setTimeout(() => {
        router.push(`/admin/bookings/${result.data.bookingId}`);
      }, 2000);

    } catch (error) {
      console.error('패키지예약 생성 실패:', error);
      setSubmitError(error instanceof Error ? error.message : '패키지예약 생성 중 오류가 발생했습니다.');
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
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Package className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">패키지 예약 등록</h1>
                      <p className="text-sm text-gray-600">
                        세부 인터내셔널 패키지 상품 예약을 등록합니다
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 상태 표시 */}
              <div className="flex items-center space-x-4">
                {isSubmitting && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600" />
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
                <h3 className="text-sm font-medium text-green-800">패키지예약 등록 완료</h3>
                <p className="text-sm text-green-700 mt-1">
                  새로운 패키지예약이 성공적으로 등록되었습니다. 상세 페이지로 이동합니다.
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
            <StandaloneTravelDateSelector />
          </div>

          {/* 3. 승객 인원수 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Users className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">승객 인원수</h3>
            </div>
            <SimplePaxSelector
              value={paxInfo}
              onChange={setPaxInfo}
            />
          </div>

          {/* 4. 패키지 정보 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Package className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">패키지 정보</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  패키지명 *
                </label>
                <Input
                  type="text"
                  placeholder="예) 세부 3박 4일 완전일주"
                  {...form.register('packageName')}
                  className={form.formState.errors.packageName ? 'border-red-500' : ''}
                />
                {form.formState.errors.packageName && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.packageName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    패키지 타입
                  </label>
                  <select 
                    {...form.register('packageType')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="STANDARD">스탠다드</option>
                    <option value="PREMIUM">프리미엄</option>
                    <option value="LUXURY">럭셔리</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    최소 인원
                  </label>
                  <Input
                    type="number"
                    min="1"
                    {...form.register('minimumPax', { valueAsNumber: true })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    최대 인원
                  </label>
                  <Input
                    type="number"
                    min="1"
                    {...form.register('maximumPax', { valueAsNumber: true })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 5. 투어 내용 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <MapPin className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">투어 내용 (선택사항)</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  숙박 시설
                </label>
                <Input
                  type="text"
                  placeholder="예) 세부 시티 스위트, 4성급"
                  {...form.register('accommodation')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  포함된 투어
                </label>
                <Input
                  type="text"
                  placeholder="예) 보홀 투어, 시마라 교회, 템플 오브 리야"
                  {...form.register('tourIncluded')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  식사 계획
                </label>
                <Input
                  type="text"
                  placeholder="예) 조식 포함, 현지 전통 점심"
                  {...form.register('mealPlan')}
                />
              </div>
            </div>
          </div>

          {/* 6. 추가 정보 */}
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
                  placeholder="패키지 관련 특별 요청사항이나 메모를 입력하세요"
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
              className="bg-green-600 hover:bg-green-700"
              disabled={isSubmitting || !customerInfo.name || !customerInfo.email || !customerInfo.phone}
            >
              {isSubmitting ? '저장 중...' : '패키지예약 등록'}
            </Button>
          </div>
        </form>

        {/* 안내사항 */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">📦 패키지예약 안내</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• 세부 인터내셔널 패키지 상품으로 CINT팀에서 처리합니다.</li>
            <li>• 항공+숙박+관광이 포함된 통합 상품입니다.</li>
            <li>• 최소/최대 인원은 패키지 가격 산정에 활용됩니다.</li>
            <li>• 투어 내용은 선택사항으로 나중에 상세하게 추가할 수 있습니다.</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
