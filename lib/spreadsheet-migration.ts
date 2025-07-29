import { Booking, BookingStatus, BookingType, BookingPart, Customer, PaymentStatus } from '@/types/booking';
import { addBookingToDepartment, getDepartmentFromPart } from './booking-utils';

export interface SpreadsheetRow {
  CODE?: string;           // A - agentCode
  AGT?: string;            // B - agentName
  AGT_H?: string;          // C
  CDC_S?: string;          // D
  CDC_MH?: string;         // E
  CDC_SH?: string;         // F
  BK_CODE?: string;        // G - bookingNumber
  I_D?: string;            // H - part
  R_O?: string;            // I - flightType
  ROUTE?: string;          // J - route
  DEP?: string;            // K - tourStartDate
  RET?: string;            // L - tourEndDate
  FLT_D?: string;          // M - airlineRoute1
  FLT_R?: string;          // N - airlineRoute2
  PAX?: number;            // O - totalPax
  ADT?: number;            // P - adults
  CHD?: number;            // Q - children
  INF?: number;            // R - infants
  NAME?: string;           // S - customer name
  BK_REMARKS?: string;     // T - remarks
  ISSUE_BY?: string;       // U - airline
  CLASS?: string;          // V - pnr
  PNR?: string;            // W - deadline
  TL?: string;             // X - forex
  FOREX?: string;          // Y - chdPp
  ADT_P_P?: string;        // Z - infPp
  CHD_P_P?: string;        // AA - totalKrw
  INF_P_P?: string;        // AB - rate
  PHP_KRW?: string;        // AC - usd
  RATE?: string;           // AD - due
  USD?: string;            // AE - paymentStatus
  DUE?: string;            // AF - paidDate
  PAID?: string;           // AG - paymentMethod
  PAID_DATE?: string;      // AH - fare
  BY?: string;             // AI - tax
  PAYMENT_REMARKS?: string; // AJ - phTax
  EMAIL?: string;          // AK - airNett
  FARE?: string;           // AL - airNettKrw
  TAX?: string;            // AM - airNettRate
  PH_TAX?: string;         // AN - airNettUsd
  AIR_NETT?: string;       // AO - issueDate
  AIR_NETT_2?: string;     // AP - commission
  RATE_2?: string;         // AQ - otherExpenses
  ISSUE_D?: string;        // AR - profit
  COM?: string;            // AS - confirmedBy
  기타지출?: string;        // AT - remarks
  수익?: string;            // AU - remarks
}

export interface ProcessedBooking extends Omit<Booking, 'id'> {
  bookingNumber: string;
  customers: Customer[];
}

export class SpreadsheetMigrationService {
  
  /**
   * 스프레드시트 데이터를 부킹 데이터로 변환
   */
  static processSpreadsheetData(rawData: SpreadsheetRow[]): ProcessedBooking[] {
    const bookings: Map<string, ProcessedBooking> = new Map();
    let currentBookingNumber = '';
    
    for (const row of rawData) {
      // BK CODE가 있으면 새로운 예약 시작
      if (row.BK_CODE) {
        currentBookingNumber = row.BK_CODE;
      }
      
      // NAME이 있으면 고객 정보 추가
      if (row.NAME && currentBookingNumber) {
        const customer = this.parseCustomerName(row.NAME);
        
        if (!bookings.has(currentBookingNumber)) {
          // 새로운 예약 생성
          bookings.set(currentBookingNumber, {
            bookingNumber: currentBookingNumber,
            customers: [customer],
            // 첫 번째 고객 행에서 예약 정보 가져오기
            ...this.extractBookingInfo(row)
          });
        } else {
          // 기존 예약에 고객 추가
          const booking = bookings.get(currentBookingNumber)!;
          booking.customers.push(customer);
        }
      }
    }
    
    return Array.from(bookings.values());
  }
  
  /**
   * 고객 이름 파싱 (AN JUYOUN → firstName: 'AN', lastName: 'JUYOUN')
   * NTBA는 승객명단 미확정 상태로 처리
   */
  private static parseCustomerName(fullName: string): Customer {
    // NTBA는 승객명단 미확정 상태
    if (fullName === 'NTBA') {
      return {
        firstName: 'NTBA',
        lastName: '(승객명단 미확정)',
        gender: '',
        nationality: '',
        passportNumber: '',
        passportExpiry: ''
      };
    }
    
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    return {
      firstName,
      lastName,
      gender: '', // 스프레드시트에 없음
      nationality: '', // 스프레드시트에 없음
      passportNumber: '', // 스프레드시트에 없음
      passportExpiry: '' // 스프레드시트에 없음
    };
  }
  
  /**
   * 예약 정보 추출
   */
  private static extractBookingInfo(row: SpreadsheetRow) {
          return {
        // 기본 정보
        part: row.I_D === 'INT' ? 'AIR' as BookingPart : 'CINT' as BookingPart,
        status: 'confirmed' as BookingStatus,
        bookingType: 'FIT' as BookingType,
        
        // 날짜 변환
        tourStartDate: this.parseDate(row.DEP) || new Date(),
        tourEndDate: row.RET && row.RET !== 'x' ? this.parseDate(row.RET) || new Date() : new Date(),
        
        // 기본값
        country: 'PH',
        region: 'CEBU',
        
        // 접수 정보
        receivedBy: 'dev@cebudirectclub.com',
        receivedAt: new Date(),
        agentCode: row.CODE || 'CDC',
        agentName: row.AGT || '',
        localLandCode: 'CDC',
        
        // 투어 정보 (기본값)
        hotelName: '',
        roomType: '',
        localLandName: '',
        roomCount: 0,
        airIncluded: false,
        airlineIncluded: false,
        
        // 항공 정보
        airline: this.extractAirlineCode(row.ISSUE_BY),
        airlineRoute1: row.FLT_D || '',
        airlineRoute2: row.FLT_R || '',
        departureRoute: this.extractDepartureRoute(row.ROUTE),
        returnRoute: this.extractReturnRoute(row.ROUTE),
        flightType: row.R_O === 'OW' ? 'oneWay' : 'roundTrip',
        
        // 인원 정보
        totalPax: row.PAX || 0,
        adults: row.ADT || 0,
        children: row.CHD || 0,
        infants: row.INF || 0,
        foc: 0,
        
        // 가격 정보
        costPrice: this.parseNumber(row.CHD_P_P) || 0,
        sellingPrice: this.parseNumber(row.USD) || 0,
        markup: this.parseNumber(row.수익) || 0,
        totalPayment: this.parseNumber(row.USD) || 0,
        deposit: 0, // 이미 결제 완료
        balance: 0, // 이미 결제 완료
        
        // 결제 정보
        paymentMethod: row.BY || '',
        paymentStatus: (row.PAID ? 'completed' : 'pending') as PaymentStatus,
        
        // 확정 정보
        confirmedAt: this.parseDate(row.TL) || undefined,
        confirmedBy: 'dev@cebudirectclub.com',
        deadline: this.parseDate(row.TL) || undefined,
        actualDeadline: this.parseDate(row.ISSUE_D) || undefined,
        
        // 메타데이터
        remarks: row.BK_REMARKS || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'dev@cebudirectclub.com',
        updatedBy: 'dev@cebudirectclub.com'
      };
  }
  
  /**
   * 날짜 파싱 (10/2 → 2024-10-02)
   */
  private static parseDate(dateStr: string | undefined): Date | null {
    if (!dateStr || dateStr === 'x') return null;
    
    try {
      const [month, day] = dateStr.split('/');
      const year = 2024; // 기본값, 필요시 수정
      return new Date(year, parseInt(month) - 1, parseInt(day));
    } catch {
      return null;
    }
  }

  /**
   * 숫자 파싱 (문자열에서 숫자 추출)
   */
  private static parseNumber(value: string | undefined): number {
    if (!value) return 0;
    
    // 통화 기호와 쉼표 제거
    const cleaned = value.replace(/[₩₱$,]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  /**
   * 항공사 코드 추출 (BX WEB → BX)
   */
  private static extractAirlineCode(issueBy: string | undefined): string {
    if (!issueBy) return '';
    return issueBy.split(' ')[0] || issueBy;
  }
  
  /**
   * 출발 경로 추출 (CEB-PUS → CEB)
   */
  private static extractDepartureRoute(route: string | undefined): string {
    if (!route) return '';
    return route.split('-')[0] || '';
  }
  
  /**
   * 도착 경로 추출 (CEB-PUS → PUS)
   */
  private static extractReturnRoute(route: string | undefined): string {
    if (!route) return '';
    const parts = route.split('-');
    return parts.length > 1 ? parts[1] : '';
  }
  
  /**
   * 부킹 데이터를 Firestore에 저장
   */
  static async saveBookingsToFirestore(bookings: ProcessedBooking[]): Promise<{ success: number; errors: string[] }> {
    const errors: string[] = [];
    let successCount = 0;
    
    for (const booking of bookings) {
      try {
        // 부서 결정
        const department = getDepartmentFromPart(booking.part || 'AIR');
        
        // 부서별 컬렉션에 저장
        await addBookingToDepartment(booking, department);
        successCount++;
        console.log(`✅ 예약 저장 성공: ${booking.bookingNumber} (${department} 부서)`);
      } catch (error) {
        const errorMsg = `❌ 예약 저장 실패: ${booking.bookingNumber} - ${error}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }
    
    return { success: successCount, errors };
  }
} 