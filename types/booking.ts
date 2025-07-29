export type BookingStatus = 'new' | 'confirmed' | 'completed' | 'cancelled';
export type BookingType = 'FIT' | 'PKG' | 'GROUP' | 'REVISION';
export type PaymentStatus = 'pending' | 'partial' | 'completed';
export type BookingPart = 'AIR' | 'CINT';

export interface Customer {
  id?: string;
  firstName: string;
  lastName: string;
  gender: string;
  nationality: string;
  passportNumber: string;
  passportExpiry: string;
}

export interface BookingStatusHistory {
  id: string;
  bookingId: string;
  status: BookingStatus;
  changedBy: string;
  changedAt: Date;
  remarks?: string;
}

export interface GuideInfo {
  name: string;
  contact: string;
  notes: string;
}

export interface Booking {
  id: string;
  
  // 기본 정보
  part?: BookingPart;           // AIR 또는 CINT
  bookingNumber: string;        // 예약번호 (자동 생성)
  status: BookingStatus;
  bookingType: BookingType;
  tourStartDate: Date;
  tourEndDate: Date;
  country: string;
  region: string;
  
  // 접수 정보
  receivedBy: string;           // 접수자 UID
  receivedAt: Date;
  agentCode: string;
  agentName: string;
  localLandCode: string;
  
  // 투어 정보
  hotelName: string;
  airline: string;
  airlineRoute1: string;
  airlineRoute2: string;
  departureRoute?: string;    // 출발 노선
  returnRoute?: string;       // 도착 노선
  flightType?: string;        // 편도/왕복/다구간
  returnDepartureRoute?: string;  // 왕복 시 오는편 출발
  returnArrivalRoute?: string;    // 왕복 시 오는편 도착
  flightSegments?: Array<{ departure: string; arrival: string }>;  // 다구간 세그먼트
  roomType: string;
  localLandName: string;
  roomCount: number;
  airIncluded?: boolean;     // 항공포함 여부 (airlineIncluded와 별개)
  airlineIncluded: boolean;  // 항공포함 여부
  nights?: number;           // 박수
  tourRegion?: string;       // 투어지역
  land?: string;             // LAND
  
  // 인원 정보
  totalPax: number;
  adults: number;
  children: number;
  infants: number;
  foc: number;              // FOC 인원
  
  // 가격 정보
  costPrice: number;
  markup: number;
  sellingPrice: number;
  totalPayment: number;
  deposit: number;
  balance: number;
  
  // 결제 정보
  paymentMethod: string;
  paymentDate?: Date;
  paymentStatus: PaymentStatus;
  
  // 확정 정보
  confirmedAt?: Date;
  confirmedBy?: string;
  deadline?: Date;
  actualDeadline?: Date;
  
  // 고객 정보
  customers: Customer[];
  
  // 가이드 정보
  guideInfo?: GuideInfo;
  
  // 메타데이터
  remarks: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface BookingFilters {
  status?: BookingStatus[];
  bookingType?: BookingType[];
  dateRange?: { start: Date; end: Date };
  agentCode?: string;
  region?: string;
  receivedBy?: string;
  searchTerm?: string;
}

export interface BookingStats {
  total: number;
  new: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  revenue: number;
  pendingPayments: number;
}

export interface BookingFormData {
  bookingType: BookingType;
  tourStartDate: string;
  tourEndDate: string;
  country: string;
  region: string;
  agentCode: string;
  agentName: string;
  localLandName: string;
  localLandCode: string;
  hotelName: string;
  airline: string;
  airlineRoute1: string;
  airlineRoute2: string;
  departureRoute?: string;
  returnRoute?: string;
  flightType?: string;
  returnDepartureRoute?: string;
  returnArrivalRoute?: string;
  flightSegments?: Array<{ departure: string; arrival: string }>;
  roomType: string;
  roomCount: number;
  airIncluded?: boolean;
  airlineIncluded: boolean;  // 항공포함 여부
  adults: number;
  children: number;
  infants: number;
  costPrice: number;
  markup: number;
  sellingPrice: number;
  customers: Omit<Customer, 'id'>[];
  remarks: string;
} 