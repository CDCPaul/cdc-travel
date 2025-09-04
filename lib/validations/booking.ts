import { z } from 'zod';

// 기본 스키마들
const dateSchema = z.string().min(1, '날짜를 선택해주세요.').or(z.date());

const customerSchema = z.object({
  name: z.string().min(1, '고객명을 입력해주세요.'),
  email: z.string().email('유효한 이메일 주소를 입력해주세요.'),
  phone: z.string().min(1, '연락처를 입력해주세요.'),
  company: z.string().optional(),
  address: z.string().optional(),
  nationality: z.string().optional(),
  notes: z.string().optional()
});

const paxInfoSchema = z.object({
  adults: z.number().min(1, '성인 승객은 최소 1명이어야 합니다.'),
  children: z.number().min(0).default(0),
  infants: z.number().min(0).default(0),
  total: z.number().min(1),
  details: z.array(z.object({
    type: z.enum(['adult', 'child', 'infant']),
    firstName: z.string(),
    lastName: z.string(),
    dateOfBirth: dateSchema.optional(),
    passportNumber: z.string().optional(),
    passportExpiry: dateSchema.optional(),
    specialRequests: z.string().optional()
  })).optional()
});

const flightInfoSchema = z.object({
  route: z.string().min(1, '경로를 입력해주세요.'),
  departureDate: dateSchema,
  returnDate: dateSchema.optional(),
  flightType: z.enum(['ONE_WAY', 'ROUND_TRIP']),
  departureFlights: z.array(z.object({
    airline: z.string().min(1, '항공사를 입력해주세요.'),
    flightNumber: z.string().min(1, '항공편명을 입력해주세요.'),
    departureTime: z.string().min(1, '출발시간을 입력해주세요.'),
    arrivalTime: z.string().min(1, '도착시간을 입력해주세요.'),
    aircraft: z.string().optional()
  })).min(1, '최소 1개의 출발편이 필요합니다.'),
  returnFlights: z.array(z.object({
    airline: z.string().min(1, '항공사를 입력해주세요.'),
    flightNumber: z.string().min(1, '항공편명을 입력해주세요.'),
    departureTime: z.string().min(1, '출발시간을 입력해주세요.'),
    arrivalTime: z.string().min(1, '도착시간을 입력해주세요.'),
    aircraft: z.string().optional()
  })).optional()
});

const landInfoSchema = z.object({
  destination: z.string().min(1, '목적지를 입력해주세요.'),
  partner: z.string().min(1, '현지 파트너를 입력해주세요.'),
  partnerContact: z.object({
    name: z.string().min(1, '담당자명을 입력해주세요.'),
    email: z.string().email('유효한 이메일을 입력해주세요.'),
    phone: z.string().min(1, '연락처를 입력해주세요.')
  }).optional(),
  itinerary: z.array(z.object({
    day: z.number().min(1),
    title: z.string().min(1, '일정 제목을 입력해주세요.'),
    description: z.string().min(1, '일정 내용을 입력해주세요.'),
    meals: z.array(z.string()).default([]),
    accommodation: z.string().optional()
  })).min(1, '최소 1일의 일정이 필요합니다.'),
  inclusions: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([])
});

const packageInfoSchema = z.object({
  packageId: z.string().min(1, '패키지 ID를 입력해주세요.'),
  packageName: z.string().min(1, '패키지명을 입력해주세요.'),
  packageType: z.enum(['STANDARD', 'PREMIUM', 'CUSTOM']),
  minimumPax: z.number().min(1, '최소 인원을 입력해주세요.'),
  maximumPax: z.number().min(1, '최대 인원을 입력해주세요.'),
  isPublished: z.boolean().default(false),
  marketingMaterials: z.array(z.string().url('유효한 URL을 입력해주세요.')).default([])
});

const customRequirementsSchema = z.object({
  includeFlights: z.boolean().default(false),
  includeAccommodation: z.boolean().default(false),
  includeMeals: z.boolean().default(false),
  includeTransportation: z.boolean().default(false),
  includeGuide: z.boolean().default(false),
  includeShopping: z.boolean().default(false),
  specialRequests: z.array(z.string()).default([]),
  budgetRange: z.object({
    min: z.number().min(0, '최소 금액을 입력해주세요.'),
    max: z.number().min(0, '최대 금액을 입력해주세요.'),
    currency: z.enum(['KRW', 'PHP', 'USD'])
  }).optional()
});

const deadlinesSchema = z.object({
  confirmation: dateSchema.optional(),
  deposit: dateSchema.optional(),
  finalPayment: dateSchema.optional(),
  departure: dateSchema.optional()
});

const paymentInfoSchema = z.object({
  totalAmount: z.number().min(0),
  currency: z.enum(['KRW', 'PHP', 'USD']),
  depositAmount: z.number().min(0).optional(),
  depositReceived: z.boolean().default(false),
  depositReceivedAt: dateSchema.optional(),
  finalPaymentReceived: z.boolean().default(false),
  finalPaymentReceivedAt: dateSchema.optional(),
  paymentMethod: z.enum(['BANK_TRANSFER', 'CREDIT_CARD', 'CASH', 'OTHER']).optional(),
  paymentNotes: z.string().optional()
});

// 기본 예약 스키마
const baseBookingSchema = z.object({
  projectType: z.enum(['AIR_ONLY', 'CINT_PACKAGE', 'CINT_INCENTIVE_GROUP']),
  customer: customerSchema,
  dates: z.object({
    start: dateSchema,
    end: dateSchema
  }),
  paxInfo: paxInfoSchema,
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  deadlines: deadlinesSchema.optional(),
  paymentInfo: paymentInfoSchema.optional()
});

// AIR 전용 스키마
export const airBookingSchema = baseBookingSchema.extend({
  projectType: z.literal('AIR_ONLY'),
  flightDetails: flightInfoSchema,
  groupType: z.enum(['INDIVIDUAL', 'GROUP']),
  ticketingDeadline: dateSchema.optional(),
  specialRequests: z.array(z.string()).default([])
});

// CINT 패키지 스키마
export const cintPackageBookingSchema = baseBookingSchema.extend({
  projectType: z.literal('CINT_PACKAGE'),
  packageInfo: packageInfoSchema,
  landInfo: landInfoSchema.optional(),
  flightDetails: flightInfoSchema.optional()
});

// CINT 인센티브 그룹 스키마
export const cintIncentiveBookingSchema = baseBookingSchema.extend({
  projectType: z.literal('CINT_INCENTIVE_GROUP'),
  customRequirements: customRequirementsSchema,
  landInfo: landInfoSchema.optional(),
  flightDetails: flightInfoSchema.optional()
});

// 통합 예약 스키마 (프로젝트 타입에 따라 동적 검증)
export const bookingFormSchema = z.discriminatedUnion('projectType', [
  airBookingSchema,
  cintPackageBookingSchema,
  cintIncentiveBookingSchema
]);

// 폼 데이터 타입
export type BookingFormData = z.infer<typeof bookingFormSchema>;
export type AIRBookingFormData = z.infer<typeof airBookingSchema>;
export type CINTPackageBookingFormData = z.infer<typeof cintPackageBookingSchema>;
export type CINTIncentiveBookingFormData = z.infer<typeof cintIncentiveBookingSchema>;

// 기본값 생성 함수들
export const getDefaultBookingValues = (projectType: 'AIR_ONLY' | 'CINT_PACKAGE' | 'CINT_INCENTIVE_GROUP' = 'AIR_ONLY'): Partial<BookingFormData> => {
  const baseDefaults = {
    projectType,
    customer: {
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      nationality: 'KR',
      notes: ''
    },
    dates: {
      start: '',
      end: ''
    },
    paxInfo: {
      adults: 1,
      children: 0,
      infants: 0,
      total: 1,
      details: []
    },
    priority: 'MEDIUM' as const,
    tags: [],
    notes: '',
    internalNotes: '',
    deadlines: {
      confirmation: '',
      deposit: '',
      finalPayment: '',
      departure: ''
    },
    paymentInfo: {
      totalAmount: 0,
      currency: 'KRW' as const,
      depositAmount: 0,
      depositReceived: false,
      finalPaymentReceived: false,
      paymentMethod: undefined,
      paymentNotes: ''
    }
  };

  switch (projectType) {
    case 'AIR_ONLY':
      return {
        ...baseDefaults,
        flightDetails: {
          route: '',
          departureDate: '',
          returnDate: '',
          flightType: 'ROUND_TRIP' as const,
          departureFlights: [{
            airline: '',
            flightNumber: '',
            departureTime: '',
            arrivalTime: '',
            aircraft: ''
          }],
          returnFlights: [{
            airline: '',
            flightNumber: '',
            departureTime: '',
            arrivalTime: '',
            aircraft: ''
          }]
        },
        groupType: 'GROUP' as const,
        ticketingDeadline: '',
        specialRequests: []
      };

    case 'CINT_PACKAGE':
      return {
        ...baseDefaults,
        packageInfo: {
          packageId: '',
          packageName: '',
          packageType: 'STANDARD' as const,
          minimumPax: 1,
          maximumPax: 50,
          isPublished: false,
          marketingMaterials: []
        },
        landInfo: {
          destination: '',
          partner: '',
          partnerContact: {
            name: '',
            email: '',
            phone: ''
          },
          itinerary: [{
            day: 1,
            title: '',
            description: '',
            meals: [],
            accommodation: ''
          }],
          inclusions: [],
          exclusions: []
        }
      };

    case 'CINT_INCENTIVE_GROUP':
      return {
        ...baseDefaults,
        customRequirements: {
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
            currency: 'KRW' as const
          }
        }
      };

    default:
      return baseDefaults;
  }
};

// 검증 헬퍼 함수들
export const validateBookingData = (data: unknown): data is BookingFormData => {
  try {
    bookingFormSchema.parse(data);
    return true;
  } catch {
    return false;
  }
};

export const getBookingValidationErrors = (data: unknown) => {
  try {
    bookingFormSchema.parse(data);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors;
    }
    return null;
  }
};

