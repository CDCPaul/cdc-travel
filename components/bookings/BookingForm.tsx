"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { ProjectTypeSelector } from './ProjectTypeSelector';
import { CustomerSelector, CustomerInfo } from './CustomerSelector';
import { StandaloneTravelDateSelector, getGlobalInstance } from './StandaloneTravelDateSelector';
import { SimplePaxSelector, SimplePaxInfo } from './SimplePaxSelector';
import { FlightDetailsForm } from './FlightDetailsForm';
import { PackageInfoForm } from './PackageInfoForm';
import { LandInfoForm } from './LandInfoForm';
import { CustomRequirementsForm } from './CustomRequirementsForm';
import { AdditionalInfoForm } from './AdditionalInfoForm';
import { 
  BookingFormData, 
  getDefaultBookingValues 
} from '@/lib/validations/booking';
import { ProjectType } from '@/types/booking';
import { User, Calendar, Users, FileText, Save, X, AlertCircle, Plane, Package, Settings, CreditCard } from 'lucide-react';

interface BookingFormProps {
  initialData?: Record<string, unknown>;
  bookingId?: string;
  onSubmit: (data: BookingFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function BookingForm({
  initialData,
  bookingId,
  onSubmit,
  onCancel,
  isLoading = false,
  className = ''
}: BookingFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  console.log('🔄 BookingForm 전체 리렌더됨!', { currentStep });
  const [projectType, setProjectType] = useState<ProjectType>(
    (initialData?.projectType as ProjectType) || 'AIR_ONLY'
  );
  console.log('📋 BookingForm: 현재 projectType =', projectType);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<any>({
    // resolver: zodResolver(bookingFormSchema), // 타입 호환성 문제로 임시 제거
    defaultValues: initialData || getDefaultBookingValues(projectType),
    mode: 'onBlur'
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid, isDirty }
  } = form;

  // 새로운 컴포넌트들의 상태 관리
  const [customerInfo, setCustomerInfoState] = useState<CustomerInfo>({
    type: 'DIRECT',
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // 🚫 travelDates state 제거: StandaloneTravelDateSelector가 독립적으로 관리
  // const [travelDates, setTravelDatesState] = useState(...)

  const [paxInfo, setPaxInfoState] = useState<SimplePaxInfo>({
    adults: 1,
    children: 0,
    infants: 0,
    total: 1,
    notes: ''
  });

  // 🔥 useCallback으로 안정적인 setter 함수들 생성 (자식 컴포넌트 리렌더 방지)
  const setCustomerInfo = useCallback((info: CustomerInfo) => {
    console.log('📝 BookingForm: customerInfo 업데이트');
    setCustomerInfoState(info);
  }, []);

  const setPaxInfo = useCallback((paxData: SimplePaxInfo) => {
    console.log('👥 BookingForm: paxInfo 업데이트');
    setPaxInfoState(paxData);
  }, []);

  // 🚫 전역 이벤트 리스너 완전 제거: 불필요한 리렌더링 방지
  // StandaloneTravelDateSelector는 완전 독립적으로 동작
  // 폼 제출 시점에만 전역 인스턴스에서 데이터를 직접 가져올 예정

  // 프로젝트 타입 변경 시 폼 리셋 (watch 의존성 제거로 불필요한 실행 방지)
  useEffect(() => {
    const currentProjectType = form.getValues('projectType');
    if (projectType !== currentProjectType) {
      reset(getDefaultBookingValues(projectType));
    }
  }, [projectType, reset, form]);

  // 단계 변경 시 로그만 (스크롤 로직 제거 - 포커스 문제 방지)
  useEffect(() => {
    console.log('🔄 BookingForm: currentStep 변경됨:', currentStep);
    // 🚫 스크롤 로직 제거: 포커스 손실 문제의 원인이었음
    // 사용자는 현재 위치에서 계속 작업할 수 있음
  }, [currentStep]);

  // 기존 승객 정보 필드 배열 (현재 사용하지 않음 - 새로운 PassengerSelector 사용)
  // const { fields: passengerFields, append: appendPassenger, remove: removePassenger } = useFieldArray({
  //   control,
  //   name: 'paxInfo.details'
  // });

  const handleFormSubmit = async (data: BookingFormData) => {
    try {
      console.log('📝 폼 제출 시작...', { data, customerInfo, paxInfo });
      
      // 새로운 컴포넌트들의 데이터를 form data에 병합
      const travelDatesFromGlobal = getGlobalInstance().getData();
      
      // StandaloneTravelDateSelector 데이터를 API 형식으로 변환
      const convertedDates = {
        start: travelDatesFromGlobal.segments[0]?.departureDate 
          ? new Date(travelDatesFromGlobal.segments[0].departureDate)
          : new Date(),
        end: travelDatesFromGlobal.type === 'ROUND_TRIP' && travelDatesFromGlobal.returnDate
          ? new Date(travelDatesFromGlobal.returnDate)
          : travelDatesFromGlobal.segments[travelDatesFromGlobal.segments.length - 1]?.departureDate
          ? new Date(travelDatesFromGlobal.segments[travelDatesFromGlobal.segments.length - 1].departureDate)
          : new Date()
      };

      // 항공편 정보 변환
      let flightDetails = null;
      if (data.flightDetails && (data.flightDetails.route || projectType === 'AIR_ONLY')) {
        flightDetails = {
          route: data.flightDetails.route || `${travelDatesFromGlobal.segments[0]?.origin}-${travelDatesFromGlobal.segments[0]?.destination}`,
          departureDate: travelDatesFromGlobal.segments[0]?.departureDate 
            ? new Date(travelDatesFromGlobal.segments[0].departureDate)
            : new Date(),
          returnDate: travelDatesFromGlobal.type === 'ROUND_TRIP' && travelDatesFromGlobal.returnDate
            ? new Date(travelDatesFromGlobal.returnDate)
            : undefined,
          flightType: travelDatesFromGlobal.type === 'ONE_WAY' ? 'ONE_WAY' as const : 'ROUND_TRIP' as const,
          departureFlights: data.flightDetails.departureFlights?.filter(f => f.airline || f.flightNumber) || [],
          returnFlights: data.flightDetails.returnFlights?.filter(f => f.airline || f.flightNumber) || []
        };
      }

      // 기본 데이터 구조
      const baseData = {
        projectType: data.projectType || projectType,
        customer: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
          company: customerInfo.type === 'TA' ? customerInfo.name : undefined,
          address: customerInfo.address,
          nationality: 'KR', // 기본값
          notes: ''
        },
        dates: convertedDates,
        paxInfo: {
          adults: paxInfo.adults,
          children: paxInfo.children,
          infants: paxInfo.infants,
          total: paxInfo.total,
          details: [] // 상세 승객 정보는 나중에 별도로 입력
        },
        notes: data.notes || '',
        priority: data.priority || 'MEDIUM',
        tags: data.tags || []
      };

      // 프로젝트 타입별 추가 데이터 구성
      let enhancedData: Record<string, unknown> = { ...baseData };
      
      if (projectType === 'AIR_ONLY') {
        enhancedData = {
          ...baseData,
          flightDetails: flightDetails || {
            route: `${travelDatesFromGlobal.segments[0]?.origin || 'ICN'}-${travelDatesFromGlobal.segments[0]?.destination || 'CEB'}`,
            departureDate: convertedDates.start,
            returnDate: convertedDates.end,
            flightType: travelDatesFromGlobal.type === 'ONE_WAY' ? 'ONE_WAY' : 'ROUND_TRIP',
            departureFlights: data.flightDetails?.departureFlights?.filter(f => f.airline || f.flightNumber) || [],
            returnFlights: data.flightDetails?.returnFlights?.filter(f => f.airline || f.flightNumber) || []
          },
          groupType: (data as Record<string, unknown>).groupType || 'GROUP',
          ticketingDeadline: (data as Record<string, unknown>).ticketingDeadline,
          specialRequests: (data as Record<string, unknown>).specialRequests || []
        };
      } else if (projectType === 'CINT_PACKAGE') {
        enhancedData = {
          ...baseData,
          packageInfo: (data as Record<string, unknown>).packageInfo || {
            packageId: `PKG-${Date.now()}`,
            packageName: '패키지',
            packageType: 'STANDARD',
            minimumPax: 1,
            maximumPax: 50,
            isPublished: false,
            marketingMaterials: []
          },
          landInfo: (data as Record<string, unknown>).landInfo,
          flightDetails
        };
      } else if (projectType === 'CINT_INCENTIVE_GROUP') {
        enhancedData = {
          ...baseData,
          customRequirements: (data as Record<string, unknown>).customRequirements || {
            includeFlights: false,
            includeAccommodation: false,
            includeMeals: false,
            includeTransportation: false,
            includeGuide: false,
            includeShopping: false,
            specialRequests: [],
            budgetRange: {
              min: 0,
              max: 0,
              currency: 'KRW'
            }
          },
          landInfo: (data as Record<string, unknown>).landInfo,
          flightDetails
        };
      }

      console.log('🚀 최종 제출 데이터:', enhancedData);
      
      await onSubmit(enhancedData as BookingFormData);
    } catch (error) {
      console.error('❌ Form submission error:', error);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderErrorMessage = (error: any) => {
    if (!error || !error.message) return null;
    
    return (
      <div className="flex items-center space-x-1 text-red-600 text-sm mt-1">
        <AlertCircle className="h-4 w-4" />
        <span>{error.message}</span>
      </div>
    );
  };

  const FormSection = ({ 
    title, 
    icon, 
    children, 
    className = '' 
  }: { 
    title: string; 
    icon: React.ReactNode; 
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );

  const steps = [
    { id: 0, title: '타입 선택' },
    { id: 1, title: '기본 정보' },
    { id: 2, title: '상세 정보' },
    { id: 3, title: '추가 정보' }
  ];

  return (
    <div className={`max-w-none mx-auto space-y-6 ${className}`}>
      {/* 🎯 컴팩트한 진행 단계 표시 */}
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="flex items-center justify-center space-x-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              {/* 스텝 번호/체크 */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === step.id 
                  ? 'bg-blue-600 text-white' 
                  : currentStep > step.id 
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {currentStep > step.id ? '✓' : step.id + 1}
              </div>
              
              {/* 스텝 제목 (모바일에서는 숨김) */}
              <div className={`hidden sm:block ml-2 text-sm font-medium ${
                currentStep === step.id ? 'text-blue-600' : 'text-gray-700'
              }`}>
                {step.title}
              </div>
              
              {/* 연결선 (반응형) */}
              {index < steps.length - 1 && (
                <div className={`w-6 sm:w-12 h-px mx-2 sm:mx-3 ${
                  currentStep > step.id ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        
        {/* Step 0: 프로젝트 타입 선택 */}
        {currentStep === 0 && (
          <FormSection title="프로젝트 타입 선택" icon={<FileText className="h-5 w-5" />}>
            <Controller
              name="projectType"
              control={control}
              render={({ field }) => (
                <ProjectTypeSelector
                  value={field.value}
                  onChange={(type) => {
                    field.onChange(type);
                    setProjectType(type);
                  }}
                  disabled={isLoading}
                />
              )}
            />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {renderErrorMessage((errors as any).projectType)}
          </FormSection>
        )}

        {/* Step 1: 기본 정보 */}
        <div className={currentStep === 1 ? 'space-y-6' : 'hidden'}>
          {/* 고객 정보 */}
          <FormSection title="고객 정보" icon={<User className="h-5 w-5" />}>
            <CustomerSelector
              value={customerInfo}
              onChange={setCustomerInfo}
            />
          </FormSection>

          {/* 여행 일정 */}
          <FormSection title="여행 일정" icon={<Calendar className="h-5 w-5" />}>
            <StandaloneTravelDateSelector />
            <div className="mt-2 text-xs text-gray-500">
              🏛️ 완전 독립 인스턴스 - 리렌더링 없음, 포커스 유지!
            </div>
          </FormSection>

          {/* 승객 인원수 */}
          <FormSection title="승객 인원수" icon={<Users className="h-5 w-5" />}>
            <SimplePaxSelector
              value={paxInfo}
              onChange={setPaxInfo}
            />
          </FormSection>
        </div>

        {/* Step 2: 상세 정보 */}
        <div className={currentStep === 2 ? 'space-y-6' : 'hidden'}>
          {/* 항공편 정보 (모든 프로젝트 타입에서 표시, AIR_ONLY는 필수) */}
          <FormSection title="항공편 정보" icon={<Plane className="h-5 w-5" />}>
            <FlightDetailsForm 
              form={form} 
              projectType={projectType} 
              travelData={getGlobalInstance().getData()}
            />
          </FormSection>

          {/* CINT 패키지 정보 */}
          {projectType === 'CINT_PACKAGE' && (
            <FormSection title="패키지 정보" icon={<Package className="h-5 w-5" />}>
              <PackageInfoForm form={form} />
            </FormSection>
          )}

          {/* CINT 인센티브 맞춤 요구사항 */}
          {projectType === 'CINT_INCENTIVE_GROUP' && (
            <FormSection title="맞춤 요구사항" icon={<Settings className="h-5 w-5" />}>
              <CustomRequirementsForm form={form} />
            </FormSection>
          )}

          {/* 랜드 정보 (CINT 프로젝트용) */}
          {(projectType === 'CINT_PACKAGE' || projectType === 'CINT_INCENTIVE_GROUP') && (
            <FormSection title="현지 정보" icon={<FileText className="h-5 w-5" />}>
              <LandInfoForm form={form} />
            </FormSection>
          )}
        </div>

        {/* Step 3: 추가 정보 */}
        <div className={currentStep === 3 ? 'space-y-6' : 'hidden'}>
          <FormSection title="추가 정보 및 설정" icon={<CreditCard className="h-5 w-5" />}>
            <AdditionalInfoForm form={form} />
          </FormSection>
        </div>

        {/* 다음/이전/완료 버튼 */}
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex space-x-3">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                취소
              </Button>
            )}

            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={isLoading}
              >
                이전
              </Button>
            )}
          </div>

          <div className="flex space-x-3">
            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={isLoading || (currentStep === 0 && !projectType)}
              >
                다음
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isLoading || !isValid}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {bookingId ? '수정 완료' : '예약 등록'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

      </form>

      {/* 폼 상태 표시 (개발용) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 rounded-lg p-4 text-xs">
          <div className="mb-2">
            <strong>폼 상태:</strong> valid: {isValid ? '✓' : '✗'}, dirty: {isDirty ? '✓' : '✗'}
          </div>
          {Object.keys(errors).length > 0 && (
            <div className="text-red-600">
              <strong>에러:</strong> {JSON.stringify(errors, null, 2)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
