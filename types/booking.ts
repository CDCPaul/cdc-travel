// 통합 예약 타입 정의

import { WorkflowStep } from './workflow';
import { Team } from './team';

/**
 * 프로젝트 타입
 */
export type ProjectType = 'AIR_ONLY' | 'CINT_PACKAGE' | 'CINT_INCENTIVE_GROUP';

/**
 * 예약 상태
 */
export type BookingStatus = 'ACTIVE' | 'CANCELLED' | 'COMPLETED' | 'ON_HOLD';

/**
 * 통화 타입
 */
export type Currency = 'KRW' | 'PHP' | 'USD';

/**
 * 우선순위 타입
 */
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

/**
 * 협업 요청 상태 타입
 */
export type CollaborationStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';

/**
 * 날짜 범위
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * 고객 정보
 */
export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  company?: string;
  address?: string;
  nationality?: string;
  notes?: string;
  taId?: string; // TA ID (TA인 경우)
  taCode?: string; // TA 코드 (TA인 경우)
  assignedManager?: string; // 담당자 이름 (TA인 경우 선택된 담당자, 개인고객인 경우 'Individual')
}

/**
 * 승객 정보
 */
export interface PassengerInfo {
  adults: number;
  children: number; // 만 2-11세
  infants: number;  // 만 24개월 미만
  total: number;
  details?: Array<{
  name: string;
    age?: number;
    gender?: 'M' | 'F';
    passport?: string;
    birthDate?: Date;
  }>;
}

/**
 * 가격 정보
 */
export interface PricingInfo {
  currency: Currency;
  
  // 원가 정보
  costPrice: {
    flight?: number;
    land?: number;
    visa?: number;
    others?: number;
    total: number;
  };
  
  // 판매가 정보
  sellPrice: {
    flight?: number;
    land?: number;
    visa?: number;
    others?: number;
    total: number;
  };
  
  // 커미션 정보
  commission: {
    air?: number;
    cint?: number;
    visa?: number;
    ta?: number;
    total: number;
  };
  
  // 최종 판매가
  finalPrice: number;
}

/**
 * 결제 정보
 */
export interface PaymentInfo {
  id: string;
  type: 'DEPOSIT' | 'FINAL' | 'FULL';
  amount: number;
  currency: Currency;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  dueDate: Date;
  paidDate?: Date;
  invoiceUrl?: string;
  receiptUrl?: string;
  notes?: string;
}

/**
 * 항공편 정보 (AIR팀용)
 */
export interface FlightInfo {
  route: string; // 예: "ICN-CEB"
  departureDate: Date;
  returnDate?: Date; // 왕복인 경우
  flightType: 'ONE_WAY' | 'ROUND_TRIP';
  departureFlights: Array<{
    airline: string;
    flightNumber: string;
    departureTime: string;
    arrivalTime: string;
    aircraft?: string;
  }>;
  returnFlights?: Array<{
    airline: string;
    flightNumber: string;
    departureTime: string;
    arrivalTime: string;
    aircraft?: string;
  }>;
}

/**
 * 항공사 견적 정보
 */
export interface AirlineQuote {
  id: string;
  airline: string;
  quoteDate: Date;
  validUntil: Date;
  pricePerPax: number;
  currency: Currency;
  conditions: string[];
  contactPerson?: string;
  notes?: string;
  isSelected: boolean;
}

/**
 * 블럭킹 정보
 */
export interface BlockingInfo {
  id: string;
  airline: string;
  blockDate: Date;
  releaseDate: Date;
  blockingReference: string;
  seats: number;
  depositRequired?: number;
  depositPaid?: boolean;
  notes?: string;
}

/**
 * 랜드 정보 (CINT팀용)
 */
export interface LandInfo {
  destination: string;
  partner: string; // 현지 LAND 파트너
  partnerContact?: {
    name: string;
    email: string;
    phone: string;
  };
  itinerary: Array<{
    day: number;
    title: string;
    description: string;
    meals?: string[];
    accommodation?: string;
  }>;
  inclusions: string[];
  exclusions: string[];
}

/**
 * 패키지 정보 (CINT 자체상품용)
 */
export interface PackageInfo {
  packageId: string;
  packageName: string;
  packageType: 'STANDARD' | 'PREMIUM' | 'CUSTOM';
  minimumPax: number;
  maximumPax: number;
  isPublished: boolean;
  marketingMaterials?: string[]; // URLs
}

/**
 * 랜드 파트너 견적 정보
 */
export interface LandQuote {
  id: string;
  partner: string;
  quoteDate: Date;
  validUntil: Date;
  pricePerPax: number;
  currency: Currency;
  inclusions: string[];
  exclusions: string[];
  conditions: string[];
  contactPerson?: string;
  notes?: string;
  isSelected: boolean;
}

/**
 * 협업 요청 타입
 */
export type CollaborationType = 
  | 'FLIGHT_QUOTE_REQUEST'    // 항공 견적 요청
  | 'LAND_QUOTE_REQUEST'      // 랜드 견적 요청
  | 'PACKAGE_CONSULTATION'    // 패키지 상담
  | 'PRICING_REVIEW'          // 가격 검토
  | 'DOCUMENT_REVIEW'         // 문서 검토
  | 'CUSTOMER_CONSULTATION'   // 고객 상담
  | 'OTHER';                  // 기타

/**
 * 협업 요청 정보
 */
export interface CollaborationRequest {
  id: string;
  bookingId: string;
  requestedBy: {
    team: Team;
    userId: string;
    userName: string;
  };
  requestedTo: {
    team: Team;
    userIds?: string[]; // 특정 사용자들에게 요청 (없으면 팀 전체)
  };
  type: CollaborationType;
  priority: Priority;
  title: string;
  description: string;
  dueDate?: Date;
  status: CollaborationStatus;
  response?: string;
  respondedBy?: {
    userId: string;
    userName: string;
    respondedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 기본 예약 정보 (공통 필드)
 */
export interface BaseBooking {
  id: string;
  bookingNumber: string; // 자동 생성: CDC-YYYY-MMDD-XXX 형식
  projectType: ProjectType;
  
  // 팀 정보
  primaryTeam: Team;
  collaboratingTeam?: Team;
  assignedTo: {
    primary: string; // 주담당자 userId
    secondary?: string; // 부담당자 userId
  };
  
  // 기본 정보
  customer: CustomerInfo;
  dates: DateRange;
  paxInfo: PassengerInfo;
  
  // 상태 관리
  status: BookingStatus;
  currentStep: WorkflowStep;
  
  // 가격 및 결제
  pricing: PricingInfo;
  payments: PaymentInfo[];
  
  // 협업 관리
  collaborationRequests: CollaborationRequest[];
  
  // 메타데이터
  createdBy: string; // 생성자 userId
  createdAt: Date;
  updatedBy: string; // 최종 수정자 userId  
  updatedAt: Date;
  
  // 일반 메모
  notes?: string;
  internalNotes?: string; // 내부 전용 메모
  
  // 중요도 및 태그
  priority: Priority;
  tags: string[];
  
  // 기한 관리
  deadlines: {
    confirmation?: Date; // 확정 기한
    deposit?: Date;      // 예약금 기한
    finalPayment?: Date; // 잔금 기한
    departure?: Date;    // 출발 기한
  };
}

/**
 * AIR 전용 예약 (항공만)
 */
export interface AIRBooking extends BaseBooking {
  projectType: 'AIR_ONLY';
  primaryTeam: 'AIR';
  
  // 항공 관련 정보
  flightDetails: FlightInfo;
  airlineQuotes: AirlineQuote[];
  blockingInfo?: BlockingInfo;
  
  // AIR 팀 전용 필드
  groupType: 'INDIVIDUAL' | 'GROUP'; // 개인/그룹 구분
  ticketingDeadline?: Date;
  specialRequests?: string[]; // 특별 요청사항
}

/**
 * CINT 패키지 예약 (자체 상품)
 */
export interface CINTPackageBooking extends BaseBooking {
  projectType: 'CINT_PACKAGE';
  primaryTeam: 'CINT';
  collaboratingTeam?: 'AIR'; // 항공 포함 시
  
  // 패키지 정보
  packageInfo: PackageInfo;
  landInfo: LandInfo;
  
  // 견적 정보
  landPartnerQuotes: LandQuote[];
  airlineQuotes?: AirlineQuote[]; // 항공 포함 시
  
  // 마케팅 정보
  targetTAs?: string[]; // 대상 TA IDs
  marketingStatus?: 'DRAFT' | 'PUBLISHED' | 'PROMOTED' | 'CLOSED';
}

/**
 * CINT 인센티브 그룹 예약 (견적 요청)
 */
export interface CINTIncentiveGroupBooking extends BaseBooking {
  projectType: 'CINT_INCENTIVE_GROUP';
  primaryTeam: 'CINT';
  collaboratingTeam?: 'AIR'; // 항공 포함 시
  
  // 맞춤 요청 정보
  customRequirements: {
    includeFlights: boolean;
    includeAccommodation: boolean;
    includeMeals: boolean;
    includeTransportation: boolean;
    includeGuide: boolean;
    includeShopping: boolean;
    specialRequests: string[];
    budgetRange?: {
      min: number;
      max: number;
      currency: Currency;
    };
  };
  
  // 랜드 정보 (선택적)
  landInfo?: LandInfo;
  
  // 견적 정보  
  landPartnerQuotes: LandQuote[];
  airlineQuotes?: AirlineQuote[]; // 항공 포함 시
  
  // 견적 관련
  quoteSentDate?: Date;
  quoteValidUntil?: Date;
  clientFeedback?: string;
}

/**
 * 통합 예약 타입 (Union Type)
 */
export type Booking = AIRBooking | CINTPackageBooking | CINTIncentiveGroupBooking;

/**
 * 예약 생성 요청 데이터
 */
export interface CreateBookingRequest {
  projectType: ProjectType;
  customer: CustomerInfo;
  dates: DateRange;
  paxInfo: PassengerInfo;
  flightDetails?: Partial<FlightInfo>;
  landInfo?: Partial<LandInfo>;
  packageInfo?: Partial<PackageInfo>;
  customRequirements?: Partial<CINTIncentiveGroupBooking['customRequirements']>;
  notes?: string;
  priority?: Priority;
  tags?: string[];
}

/**
 * 예약 수정 요청 데이터
 */
export interface UpdateBookingRequest {
  customer?: Partial<CustomerInfo>;
  dates?: DateRange;
  paxInfo?: Partial<PassengerInfo>;
  flightDetails?: Partial<FlightInfo>;
  landInfo?: Partial<LandInfo>;
  packageInfo?: Partial<PackageInfo>;
  customRequirements?: Partial<CINTIncentiveGroupBooking['customRequirements']>;
  notes?: string;
  internalNotes?: string;
  priority?: Priority;
  tags?: string[];
  deadlines?: Partial<BaseBooking['deadlines']>;
}

/**
 * 예약 필터 옵션
 */
export interface BookingFilters {
  team?: Team;
  projectType?: ProjectType;
  status?: BookingStatus;
  currentStep?: WorkflowStep;
  assignedTo?: string;
  dateRange?: {
    field: 'createdAt' | 'departureDate' | 'confirmationDeadline';
    start: Date;
    end: Date;
  };
  priority?: Priority[];
  tags?: string[];
  searchText?: string; // 고객명, 부킹넘버 등 검색
}

/**
 * 예약 정렬 옵션
 */
export interface BookingSortOptions {
  field: 'createdAt' | 'updatedAt' | 'departureDate' | 'confirmationDeadline' | 'priority';
  direction: 'asc' | 'desc';
}

/**
 * 예약 목록 응답
 */
export interface BookingListResponse {
  bookings: Booking[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  filters: BookingFilters;
  sort: BookingSortOptions;
}
