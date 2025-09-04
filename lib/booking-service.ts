import { getAdminDb } from './firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { 
  Booking, 
  CreateBookingRequest, 
  UpdateBookingRequest,
  BookingFilters, 
  BookingSortOptions,
  BookingListResponse,
  CollaborationRequest,
  AIRBooking,
  CINTPackageBooking,
  CINTIncentiveGroupBooking,
  PaymentInfo
} from '@/types/booking';
import { WorkflowStep, WorkflowHistory } from '@/types/workflow';
import { Team } from '@/types/team';

/**
 * 예약 관리 핵심 서비스 클래스
 * CDC Travel의 AIR팀과 CINT팀을 위한 통합 예약 관리 시스템
 */
export class BookingService {
  private static db = getAdminDb();

  /**
   * 새로운 예약을 생성합니다
   * @param bookingData 예약 생성 요청 데이터
   * @param createdBy 생성자 사용자 ID
   * @returns 생성된 예약 ID
   */
  static async createBooking(bookingData: CreateBookingRequest, createdBy: string): Promise<string> {
    try {
      // 부킹 넘버 생성 (CDC-AIR-YYMMDD-XXX 형식)
      const bookingNumber = await this.generateBookingNumber(bookingData.projectType);
      
      // 기본 예약 데이터 구성
      const now = new Date();
      const baseBooking = {
        bookingNumber,
        primaryTeam: this.determineTeam(bookingData.projectType),
        assignedTo: {
          primary: createdBy
        },
        customer: bookingData.customer,
        dates: bookingData.dates,
        paxInfo: {
          ...bookingData.paxInfo,
          total: bookingData.paxInfo.adults + bookingData.paxInfo.children + bookingData.paxInfo.infants
        },
        status: 'ACTIVE' as const,
        currentStep: WorkflowStep.INQUIRY,
        pricing: {
          currency: 'PHP' as const,
          costPrice: { total: 0 },
          sellPrice: { total: 0 },
          commission: { total: 0 },
          finalPrice: 0
        },
        payments: [] as PaymentInfo[],
        collaborationRequests: [] as CollaborationRequest[],
        createdBy,
        createdAt: now,
        updatedBy: createdBy,
        updatedAt: now,
        notes: bookingData.notes || '',
        priority: bookingData.priority || 'MEDIUM',
        tags: bookingData.tags || [],
        deadlines: {}
      };

      // 프로젝트 타입별 특화 데이터 추가
      let booking: Booking;
      
      if (bookingData.projectType === 'AIR_ONLY') {
        booking = {
          ...baseBooking,
          id: '', // Firestore에서 자동 생성
          projectType: 'AIR_ONLY',
          primaryTeam: 'AIR',
          flightDetails: bookingData.flightDetails as AIRBooking['flightDetails'],
          airlineQuotes: [],
          groupType: 'GROUP', // 기본값, 나중에 수정 가능
          specialRequests: []
        } as AIRBooking;
      } else if (bookingData.projectType === 'CINT_PACKAGE') {
        booking = {
          ...baseBooking,
          id: '', // Firestore에서 자동 생성
          projectType: 'CINT_PACKAGE',
          primaryTeam: 'CINT',
          packageInfo: bookingData.packageInfo as CINTPackageBooking['packageInfo'],
          landInfo: bookingData.landInfo as CINTPackageBooking['landInfo'],
          landPartnerQuotes: [],
          airlineQuotes: bookingData.flightDetails ? [] : undefined,
          collaboratingTeam: bookingData.flightDetails ? 'AIR' : undefined
        } as CINTPackageBooking;
      } else { // CINT_INCENTIVE_GROUP
        booking = {
          ...baseBooking,
          id: '', // Firestore에서 자동 생성
          projectType: 'CINT_INCENTIVE_GROUP',
          primaryTeam: 'CINT',
          customRequirements: bookingData.customRequirements as CINTIncentiveGroupBooking['customRequirements'],
          landInfo: bookingData.landInfo,
          landPartnerQuotes: [],
          airlineQuotes: bookingData.customRequirements?.includeFlights ? [] : undefined,
          collaboratingTeam: bookingData.customRequirements?.includeFlights ? 'AIR' : undefined
        } as CINTIncentiveGroupBooking;
      }

      // Firestore에 저장 (단순한 flat structure)
      const docRef = this.db.collection('bookings').doc();
      
      booking.id = docRef.id;
      await docRef.set(this.convertToFirestoreFormat(booking));

      // 워크플로우 히스토리 초기 기록
      await this.addWorkflowHistory(booking.id, null, WorkflowStep.INQUIRY, createdBy, '예약 생성', true);

      console.log(`✅ 예약 생성 완료: ${bookingNumber} (${booking.id})`);
      return booking.id;

    } catch (error) {
      console.error('❌ 예약 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 예약 ID로 단일 예약을 조회합니다
   * @param bookingId 예약 ID
   * @returns 예약 데이터 또는 null
   */
  static async getBookingById(bookingId: string): Promise<Booking | null> {
    try {
      // 년/월별로 검색 (최근 2년간)
      const currentYear = new Date().getFullYear();
      const searchYears = [currentYear, currentYear - 1, currentYear - 2];
      
      for (let yearIndex = 0; yearIndex < searchYears.length; yearIndex++) {
        for (let monthIndex = 1; monthIndex <= 12; monthIndex++) {
          const docRef = this.db.collection(`bookings`).doc(bookingId);
          const doc = await docRef.get();
          
          if (doc.exists) {
            const data = doc.data();
            return this.convertFromFirestoreFormat({ id: doc.id, ...data });
          }
        }
      }

      return null;
    } catch (error) {
      console.error('❌ 예약 조회 실패:', bookingId, error);
      return null;
    }
  }

  /**
   * 전체 팀 예약 목록을 조회합니다
   * @param filters 필터 옵션
   * @param sort 정렬 옵션
   * @param page 페이지 번호 (1부터 시작)
   * @param pageSize 페이지 크기
   * @returns 예약 목록 응답
   */
  static async getAllBookings(
    filters?: BookingFilters,
    sort: BookingSortOptions = { field: 'createdAt', direction: 'desc' },
    page: number = 1,
    pageSize: number = 20
  ): Promise<BookingListResponse> {
    try {
      const bookings: Booking[] = [];
      
      // 검색 범위 결정 (기본: 최근 1년)
      const searchRange = this.getSearchRange(filters?.dateRange);
      
      // 각 년/월별로 쿼리 실행 (전체 팀)  
      for (let i = 0; i < searchRange.length; i++) {
        const query: FirebaseFirestore.Query = this.db.collection(`bookings`);

        // Firebase Index 문제를 피하기 위해 최소한의 필터만 적용
        // 팀 필터 없이 전체 조회

        const snapshot = await query.get();
        snapshot.forEach(doc => {
          const data = this.convertFromFirestoreFormat({ id: doc.id, ...doc.data() });
          bookings.push(data);
        });
      }

      // 메모리에서 정렬 수행
      bookings.sort((a, b) => {
        const fieldA = this.getFieldValue(a, sort.field) as number;
        const fieldB = this.getFieldValue(b, sort.field) as number;
        
        if (fieldA === fieldB) return 0;
        
        const comparison = fieldA > fieldB ? 1 : -1;
        return sort.direction === 'asc' ? comparison : -comparison;
      });

      // 추가 필터링 (메모리에서 처리)
      let filteredBookings = bookings;
      
      // 모든 필터를 메모리에서 처리
      if (filters?.team) {
        filteredBookings = filteredBookings.filter(booking => 
          booking.primaryTeam === filters.team
        );
      }
      
      if (filters?.projectType) {
        filteredBookings = filteredBookings.filter(booking => 
          booking.projectType === filters.projectType
        );
      }
      
      if (filters?.status) {
        filteredBookings = filteredBookings.filter(booking => 
          booking.status === filters.status
        );
      }
      
      if (filters?.currentStep) {
        filteredBookings = filteredBookings.filter(booking => 
          booking.currentStep === filters.currentStep
        );
      }
      
      if (filters?.assignedTo) {
        filteredBookings = filteredBookings.filter(booking => 
          booking.assignedTo.primary === filters.assignedTo
        );
      }
      
      if (filters?.priority?.length) {
        filteredBookings = filteredBookings.filter(booking => 
          filters.priority!.includes(booking.priority)
        );
      }
      
      if (filters?.tags?.length) {
        filteredBookings = filteredBookings.filter(booking => 
          filters.tags!.some(tag => booking.tags.includes(tag))
        );
      }
      
      if (filters?.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        filteredBookings = filteredBookings.filter(booking => 
          booking.bookingNumber.toLowerCase().includes(searchLower) ||
          booking.customer.name.toLowerCase().includes(searchLower) ||
          booking.customer.email.toLowerCase().includes(searchLower) ||
          booking.notes?.toLowerCase().includes(searchLower)
        );
      }

      // 페이지네이션
      const totalCount = filteredBookings.length;
      const startIndex = (page - 1) * pageSize;
      const paginatedBookings = filteredBookings.slice(startIndex, startIndex + pageSize);

      return {
        bookings: paginatedBookings,
        totalCount,
        page,
        pageSize,
        hasNext: (page * pageSize) < totalCount,
        filters: filters || {},
        sort: sort || { field: 'createdAt', direction: 'desc' }
      };
    } catch (error) {
      console.error('❌ 전체 예약 조회 실패:', error);
      throw new Error('예약 조회에 실패했습니다.');
    }
  }

  /**
   * 팀별 예약 목록을 조회합니다
   * @param team 팀 구분
   * @param filters 필터 옵션
   * @param sort 정렬 옵션
   * @param page 페이지 번호 (1부터 시작)
   * @param pageSize 페이지 크기
   * @returns 예약 목록 응답
   */
  static async getBookingsByTeam(
    team: Team, 
    filters?: BookingFilters,
    sort: BookingSortOptions = { field: 'createdAt', direction: 'desc' },
    page: number = 1,
    pageSize: number = 20
  ): Promise<BookingListResponse> {
    try {
      const bookings: Booking[] = [];
      
      // 검색 범위 결정 (기본: 최근 1년)
      const searchRange = this.getSearchRange(filters?.dateRange);
      
      // 각 년/월별로 쿼리 실행
      for (let i = 0; i < searchRange.length; i++) {
        let query: FirebaseFirestore.Query = this.db.collection(`bookings`);

        // Firebase Index 문제를 피하기 위해 팀 필터만 적용하고 나머지는 메모리에서 처리
        query = query.where('primaryTeam', '==', team);

        // Firebase Index 문제를 피하기 위해 정렬을 메모리에서 수행
        const snapshot = await query.get();
        snapshot.forEach(doc => {
          const data = this.convertFromFirestoreFormat({ id: doc.id, ...doc.data() });
          bookings.push(data);
        });
      }

      // 메모리에서 정렬 수행
      bookings.sort((a, b) => {
        const fieldA = this.getFieldValue(a, sort.field) as number;
        const fieldB = this.getFieldValue(b, sort.field) as number;
        
        if (fieldA === fieldB) return 0;
        
        const comparison = fieldA > fieldB ? 1 : -1;
        return sort.direction === 'asc' ? comparison : -comparison;
      });

      // 추가 필터링 (Firebase Index 문제를 피하기 위해 메모리에서 처리)
      let filteredBookings = bookings;
      
      // 팀 이외의 모든 필터를 메모리에서 처리
      if (filters?.projectType) {
        filteredBookings = filteredBookings.filter(booking => 
          booking.projectType === filters.projectType
        );
      }
      
      if (filters?.status) {
        filteredBookings = filteredBookings.filter(booking => 
          booking.status === filters.status
        );
      }
      
      if (filters?.currentStep) {
        filteredBookings = filteredBookings.filter(booking => 
          booking.currentStep === filters.currentStep
        );
      }
      
      if (filters?.assignedTo) {
        filteredBookings = filteredBookings.filter(booking => 
          booking.assignedTo.primary === filters.assignedTo
        );
      }
      
      if (filters?.priority?.length) {
        filteredBookings = filteredBookings.filter(booking => 
          filters.priority!.includes(booking.priority)
        );
      }
      
      if (filters?.tags?.length) {
        filteredBookings = filteredBookings.filter(booking => 
          filters.tags!.some(tag => booking.tags.includes(tag))
        );
      }
      
      if (filters?.searchText) {
        const searchText = filters.searchText.toLowerCase();
        filteredBookings = filteredBookings.filter(booking => 
          booking.bookingNumber.toLowerCase().includes(searchText) ||
          booking.customer.name.toLowerCase().includes(searchText) ||
          booking.customer.company?.toLowerCase().includes(searchText)
        );
      }

      // 정렬 (메모리에서)
      filteredBookings.sort((a, b) => {
        const fieldA = this.getFieldValue(a, sort.field) as number;
        const fieldB = this.getFieldValue(b, sort.field) as number;
        
        if (fieldA < fieldB) return sort.direction === 'asc' ? -1 : 1;
        if (fieldA > fieldB) return sort.direction === 'asc' ? 1 : -1;
        return 0;
      });

      // 페이지네이션
      const totalCount = filteredBookings.length;
      const startIndex = (page - 1) * pageSize;
      const paginatedBookings = filteredBookings.slice(startIndex, startIndex + pageSize);

      return {
        bookings: paginatedBookings,
        totalCount,
        page,
        pageSize,
        hasNext: startIndex + pageSize < totalCount,
        filters: filters || {},
        sort
      };

    } catch (error) {
      console.error('❌ 팀별 예약 조회 실패:', team, error);
      return {
        bookings: [],
        totalCount: 0,
        page,
        pageSize,
        hasNext: false,
        filters: filters || {},
        sort
      };
    }
  }

  /**
   * 예약 정보를 업데이트합니다
   * @param bookingId 예약 ID
   * @param updateData 업데이트할 데이터
   * @param updatedBy 수정자 사용자 ID
   * @returns 성공 여부
   */
  static async updateBooking(
    bookingId: string, 
    updateData: UpdateBookingRequest, 
    updatedBy: string
  ): Promise<boolean> {
    try {
      const booking = await this.getBookingById(bookingId);
      if (!booking) {
        throw new Error('예약을 찾을 수 없습니다.');
      }

      const updates: Record<string, unknown> = {
        ...updateData,
        updatedBy,
        updatedAt: new Date()
      };

      // 파셜 업데이트 처리
      if (updateData.paxInfo) {
        updates.paxInfo = {
          ...booking.paxInfo,
          ...updateData.paxInfo,
          total: (updateData.paxInfo.adults ?? booking.paxInfo.adults) +
                 (updateData.paxInfo.children ?? booking.paxInfo.children) +
                 (updateData.paxInfo.infants ?? booking.paxInfo.infants)
        };
      }

      // Firestore 업데이트
      const docRef = this.db.collection('bookings').doc(bookingId);
      
      await docRef.update(this.convertToFirestoreFormat(updates as Partial<Booking>));

      console.log(`✅ 예약 업데이트 완료: ${booking.bookingNumber} (${bookingId})`);
      return true;

    } catch (error) {
      console.error('❌ 예약 업데이트 실패:', bookingId, error);
      return false;
    }
  }

  /**
   * 예약 상태를 변경합니다
   * @param bookingId 예약 ID
   * @param newStep 새로운 워크플로우 단계
   * @param changedBy 변경자 사용자 ID
   * @param notes 변경 사유
   * @returns 성공 여부
   */
  static async updateBookingStatus(
    bookingId: string, 
    newStep: WorkflowStep, 
    changedBy: string,
    notes?: string
  ): Promise<boolean> {
    try {
      const booking = await this.getBookingById(bookingId);
      if (!booking) {
        throw new Error('예약을 찾을 수 없습니다.');
      }

      const oldStep = booking.currentStep;
      
      // 상태 변경
      const docRef = this.db.collection('bookings').doc(bookingId);
      
      await docRef.update({
        currentStep: newStep,
        updatedBy: changedBy,
        updatedAt: new Date()
      });

      // 워크플로우 히스토리 기록
      await this.addWorkflowHistory(bookingId, oldStep, newStep, changedBy, notes, false);

      console.log(`✅ 예약 상태 변경 완료: ${booking.bookingNumber} ${oldStep} → ${newStep}`);
      return true;

    } catch (error) {
      console.error('❌ 예약 상태 변경 실패:', bookingId, error);
      return false;
    }
  }

  /**
   * 협업 요청을 생성합니다
   * @param bookingId 예약 ID
   * @param requestData 협업 요청 데이터
   * @returns 협업 요청 ID
   */
  static async requestCollaboration(
    bookingId: string,
    requestData: Omit<CollaborationRequest, 'id' | 'bookingId' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const collaborationRequest: Omit<CollaborationRequest, 'id'> = {
        bookingId,
        ...requestData,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await this.db.collection('collaboration_requests').add(collaborationRequest);

      console.log(`✅ 협업 요청 생성 완료: ${docRef.id} (예약: ${bookingId})`);
      return docRef.id;

    } catch (error) {
      console.error('❌ 협업 요청 생성 실패:', bookingId, error);
      throw error;
    }
  }

  /**
   * 부킹 넘버를 생성합니다 (CDC-AIR-YYMMDD-XXX 형식)
   * @param projectType 프로젝트 타입 (AIR_ONLY, CINT_PACKAGE, CINT_INCENTIVE_GROUP)
   * @returns 생성된 부킹 넘버
   */
  private static async generateBookingNumber(projectType: 'AIR_ONLY' | 'CINT_PACKAGE' | 'CINT_INCENTIVE_GROUP'): Promise<string> {
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2); // YY 형식으로 변경
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // 프로젝트 타입별 접두사 설정
    const typePrefix = {
      'AIR_ONLY': 'AIR',
      'CINT_PACKAGE': 'PKG', 
      'CINT_INCENTIVE_GROUP': 'ISG'
    }[projectType];
    
    const datePrefix = `CDC-${typePrefix}-${year}${month}${day}`;

    try {
      // 트랜잭션으로 시퀀스 생성 (타입별로 별도 관리)
      const sequenceRef = this.db.collection('booking_sequences').doc(`${typePrefix}_${year}`);
      
      return await this.db.runTransaction(async (transaction) => {
        const doc = await transaction.get(sequenceRef);
        
        let sequence = 1;
        if (doc.exists) {
          const data = doc.data();
          const lastDate = data?.lastDate || '';
          const currentDate = `${month}${day}`;
          
          if (lastDate === currentDate) {
            sequence = (data?.sequence || 0) + 1;
          }
        }

        const sequenceStr = String(sequence).padStart(3, '0');
        
        transaction.set(sequenceRef, {
          lastDate: `${month}${day}`,
          sequence,
          year: parseInt(year),
          projectType,
          updatedAt: new Date()
        });

        return `${datePrefix}-${sequenceStr}`;
      });

    } catch (error) {
      console.error('❌ 부킹 넘버 생성 실패:', error);
      // 실패 시 타임스탬프 기반 fallback
      return `${datePrefix}-${Date.now().toString().slice(-3)}`;
    }
  }

  /**
   * 워크플로우 히스토리를 추가합니다
   */
  private static async addWorkflowHistory(
    bookingId: string,
    fromStep: WorkflowStep | null,
    toStep: WorkflowStep,
    changedBy: string,
    notes?: string,
    automaticChange: boolean = false
  ): Promise<void> {
    try {
      const historyData: Omit<WorkflowHistory, 'id'> = {
        bookingId,
        fromStep,
        toStep,
        changedBy,
        changedByName: '', // TODO: 사용자 이름 조회
        changedAt: new Date(),
        notes,
        automaticChange
      };

      await this.db.collection('workflow_history').add(historyData);
    } catch (error) {
      console.error('❌ 워크플로우 히스토리 추가 실패:', error);
    }
  }

  /**
   * 프로젝트 타입에 따라 팀을 결정합니다
   */
  private static determineTeam(projectType: string): Team {
    return projectType === 'AIR_ONLY' ? 'AIR' : 'CINT';
  }

  /**
   * 검색 범위를 계산합니다
   */
  private static getSearchRange(dateRange?: BookingFilters['dateRange']): Array<{ year: number; month: number }> {
    const ranges: Array<{ year: number; month: number }> = [];
    const currentDate = new Date();
    
    let startDate: Date, endDate: Date;
    
    if (dateRange) {
      startDate = dateRange.start;
      endDate = dateRange.end;
    } else {
      // 기본: 최근 1년
      startDate = new Date();
      startDate.setFullYear(currentDate.getFullYear() - 1);
      endDate = currentDate;
    }

    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (current <= end) {
      ranges.push({
        year: current.getFullYear(),
        month: current.getMonth() + 1
      });
      current.setMonth(current.getMonth() + 1);
    }

    return ranges;
  }

  /**
   * 정렬을 위한 필드 값을 가져옵니다
   */
  private static getFieldValue(booking: Booking, field: string): number {
    switch (field) {
      case 'createdAt':
        return booking.createdAt.getTime();
      case 'updatedAt':
        return booking.updatedAt.getTime();
      case 'departureDate':
        return booking.dates.start.getTime();
      case 'confirmationDeadline':
        return booking.deadlines.confirmation?.getTime() || 0;
      case 'priority':
        const priorityOrder = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'URGENT': 4 };
        return priorityOrder[booking.priority];
      default:
        return 0;
    }
  }

  /**
   * Firestore 저장 형식으로 변환합니다
   */
  private static convertToFirestoreFormat(data: Partial<Booking>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Date) {
        result[key] = value;
      } else if (value && typeof value === 'object') {
        result[key] = this.convertObjectToFirestore(value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  /**
   * 객체를 Firestore 형식으로 재귀적으로 변환합니다
   */
  private static convertObjectToFirestore(obj: unknown): unknown {
    if (obj instanceof Date) {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.convertObjectToFirestore(item));
    }
    
    if (obj && typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.convertObjectToFirestore(value);
      }
      return result;
    }
    
    return obj;
  }

  /**
   * Firestore 형식에서 일반 형식으로 변환합니다
   */
  private static convertFromFirestoreFormat(data: Record<string, unknown>): Booking {
    const result: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'object' && 'toDate' in value) {
        // Firestore Timestamp
        result[key] = (value as Timestamp).toDate();
      } else if (value && typeof value === 'object') {
        result[key] = this.convertObjectFromFirestore(value);
      } else {
        result[key] = value;
      }
    }
    
    return result as unknown as Booking;
  }

  /**
   * 객체를 Firestore 형식에서 재귀적으로 변환합니다
   */
  private static convertObjectFromFirestore(obj: unknown): unknown {
    if (obj && typeof obj === 'object' && 'toDate' in obj) {
      return (obj as Timestamp).toDate();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.convertObjectFromFirestore(item));
    }
    
    if (obj && typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.convertObjectFromFirestore(value);
      }
      return result;
    }
    
    return obj;
  }
}
