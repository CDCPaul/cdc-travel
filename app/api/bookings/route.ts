import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { BookingService } from '@/lib/booking-service';
import { CreateBookingRequest, BookingFilters, BookingSortOptions, ProjectType, BookingStatus, Priority } from '@/types/booking';
import { Team } from '@/types/team';
import { WorkflowStep } from '@/types/workflow';

// Rate Limiting을 위한 간단한 메모리 캐시
const requestCache = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60000; // 1분
const MAX_REQUESTS_PER_WINDOW = 30; // 1분당 최대 30개 요청

/**
 * 예약 목록 조회 API (Firebase 표준 방식)
 * GET /api/bookings?team=AIR&status=ACTIVE&page=1&pageSize=20
 */
export async function GET(request: NextRequest) {
  // 🔥 Firebase 표준 방식: requireAuth 미들웨어 사용
  return requireAuth(request, async (req, user) => {
    try {
      console.log('🔐 예약 목록 조회 API 호출 시작...', user.email);

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const team = searchParams.get('team') as Team;
    const projectType = searchParams.get('projectType');
    const status = searchParams.get('status');
    const currentStep = searchParams.get('currentStep');
    const assignedTo = searchParams.get('assignedTo');
    const priority = searchParams.get('priority');
    const tags = searchParams.get('tags');
    const searchText = searchParams.get('searchText');
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortDirection = (searchParams.get('sortDirection') || 'desc') as 'asc' | 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // 팀 파라미터 검증 (선택적)
    if (team && !['AIR', 'CINT'].includes(team)) {
      return NextResponse.json({ error: 'team 파라미터는 AIR 또는 CINT여야 합니다.' }, { status: 400 });
    }

    // 필터 구성
    const filters: BookingFilters = {};
    
    if (projectType) filters.projectType = projectType as ProjectType;
    if (status) filters.status = status as BookingStatus;
    if (currentStep) filters.currentStep = currentStep as WorkflowStep;
    if (assignedTo) filters.assignedTo = assignedTo;
    if (priority) filters.priority = priority.split(',') as Priority[];
    if (tags) filters.tags = tags.split(',');
    if (searchText) filters.searchText = searchText;

    // 정렬 옵션
    const sort: BookingSortOptions = {
      field: sortField as 'createdAt' | 'updatedAt' | 'departureDate' | 'confirmationDeadline' | 'priority',
      direction: sortDirection
    };

    // 예약 목록 조회 (팀이 없으면 전체 조회)
    const result = team 
      ? await BookingService.getBookingsByTeam(team as Team, filters, sort, page, pageSize)
      : await BookingService.getAllBookings(filters, sort, page, pageSize);

    console.log(`✅ 예약 목록 조회 완료: ${result.totalCount}개 중 ${result.bookings.length}개 반환`);

    return NextResponse.json({
      success: true,
      data: result
    });

    } catch (error) {
      console.error('❌ 예약 목록 조회 API 오류:', error);
      return new Response(
        JSON.stringify({ error: '서버 오류가 발생했습니다.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  });
}

/**
 * 새 예약 생성 API (Firebase 표준 방식)
 * POST /api/bookings
 */
export async function POST(request: NextRequest) {
  // 🔥 Firebase 표준 방식: requireAuth 미들웨어 사용
  return requireAuth(request, async (req, user) => {
    try {
      console.log('🔐 예약 생성 API 호출 시작...', user.email);

      // Rate Limiting 체크
      const clientId = user.uid;
      const userRequests = requestCache.get(clientId) || 0;
    
      if (userRequests >= MAX_REQUESTS_PER_WINDOW) {
        return new Response(
          JSON.stringify({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 요청 카운트 증가
      requestCache.set(clientId, userRequests + 1);
      
      // 1분 후 카운트 리셋
      setTimeout(() => {
        requestCache.delete(clientId);
      }, RATE_LIMIT_WINDOW);

      // 요청 바디 파싱
      const body = await req.json();
    
    // 입력 검증
    const bookingData: CreateBookingRequest = {
      projectType: body.projectType,
      customer: body.customer,
      dates: {
        start: new Date(body.dates.start),
        end: new Date(body.dates.end)
      },
      paxInfo: body.paxInfo,
      flightDetails: body.flightDetails,
      landInfo: body.landInfo,
      packageInfo: body.packageInfo,
      customRequirements: body.customRequirements,
      notes: body.notes,
      priority: body.priority || 'MEDIUM',
      tags: body.tags || []
    };

      // 필수 필드 검증
      if (!bookingData.projectType || !['AIR_ONLY', 'CINT_PACKAGE', 'CINT_INCENTIVE_GROUP'].includes(bookingData.projectType)) {
        return new Response(
          JSON.stringify({ error: 'projectType이 필요합니다. (AIR_ONLY, CINT_PACKAGE, CINT_INCENTIVE_GROUP 중 하나)' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (!bookingData.customer?.name || !bookingData.customer?.email) {
        return new Response(
          JSON.stringify({ error: '고객 정보 (이름, 이메일)가 필요합니다.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (!bookingData.dates?.start || !bookingData.dates?.end) {
        return new Response(
          JSON.stringify({ error: '예약 날짜 정보가 필요합니다.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (!bookingData.paxInfo?.adults || bookingData.paxInfo.adults < 1) {
        return new Response(
          JSON.stringify({ error: '성인 승객 수가 1명 이상이어야 합니다.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 프로젝트 타입별 추가 검증
      if (bookingData.projectType === 'AIR_ONLY' && !bookingData.flightDetails) {
        return new Response(
          JSON.stringify({ error: 'AIR_ONLY 프로젝트는 항공편 정보가 필요합니다.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (bookingData.projectType === 'CINT_PACKAGE' && !bookingData.packageInfo) {
        return new Response(
          JSON.stringify({ error: 'CINT_PACKAGE 프로젝트는 패키지 정보가 필요합니다.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (bookingData.projectType === 'CINT_INCENTIVE_GROUP' && !bookingData.customRequirements) {
        return new Response(
          JSON.stringify({ error: 'CINT_INCENTIVE_GROUP 프로젝트는 맞춤 요구사항이 필요합니다.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 예약 생성
      const bookingId = await BookingService.createBooking(bookingData, user.uid);

      console.log(`✅ 예약 생성 완료: ${bookingId}`);

      // 생성된 예약 정보 조회
      const booking = await BookingService.getBookingById(bookingId);

      return new Response(
        JSON.stringify({
          success: true,
          data: { bookingId, booking },
          message: '예약이 성공적으로 생성되었습니다.'
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );

  } catch (error) {
    console.error('❌ 예약 생성 API 오류:', error);
    
      // 구체적인 에러 메시지 처리
      if (error instanceof Error) {
        if (error.message.includes('필수')) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (error.message.includes('권한')) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    
      return new Response(
        JSON.stringify({ error: '예약 생성 중 서버 오류가 발생했습니다.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  });
}
