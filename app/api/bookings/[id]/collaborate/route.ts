import { NextRequest, NextResponse } from 'next/server';
import { verifyIdTokenFromCookies } from '@/lib/auth-server';
import { BookingService } from '@/lib/booking-service';
import { CollaborationService } from '@/lib/collaboration-service';
import { CollaborationType } from '@/types/booking';
import { Team } from '@/types/team';

/**
 * 팀간 협업 요청 생성 API
 * POST /api/bookings/[id]/collaborate
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔐 협업 요청 생성 API 호출 시작...');
    
    // 인증 확인
    const decodedToken = await verifyIdTokenFromCookies(request.cookies);
    if (!decodedToken) {
      console.log('❌ 인증 실패: 토큰이 없거나 유효하지 않음');
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    console.log('✅ 인증 성공:', decodedToken.email);

    // 파라미터 추출
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: '예약 ID가 필요합니다.' }, { status: 400 });
    }

    // 예약 존재 확인
    const existingBooking = await BookingService.getBookingById(id);
    if (!existingBooking) {
      return NextResponse.json({ error: '예약을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 요청 바디 파싱
    const body = await request.json();
    const { 
      requestedToTeam, 
      requestedToUserIds, 
      type, 
      priority, 
      title, 
      description, 
      dueDate 
    } = body;

    // 필수 필드 검증
    if (!requestedToTeam || !['AIR', 'CINT'].includes(requestedToTeam)) {
      return NextResponse.json({ 
        error: '요청받을 팀을 지정해주세요. (AIR 또는 CINT)' 
      }, { status: 400 });
    }

    if (!type || !Object.values(['FLIGHT_QUOTE_REQUEST', 'LAND_QUOTE_REQUEST', 'PACKAGE_CONSULTATION', 'PRICING_REVIEW', 'DOCUMENT_REVIEW', 'CUSTOMER_CONSULTATION', 'OTHER']).includes(type)) {
      return NextResponse.json({ 
        error: '유효한 협업 요청 타입을 선택해주세요.',
        validTypes: ['FLIGHT_QUOTE_REQUEST', 'LAND_QUOTE_REQUEST', 'PACKAGE_CONSULTATION', 'PRICING_REVIEW', 'DOCUMENT_REVIEW', 'CUSTOMER_CONSULTATION', 'OTHER']
      }, { status: 400 });
    }

    if (!title?.trim()) {
      return NextResponse.json({ error: '협업 요청 제목을 입력해주세요.' }, { status: 400 });
    }

    if (!description?.trim()) {
      return NextResponse.json({ error: '협업 요청 내용을 입력해주세요.' }, { status: 400 });
    }

    // 자기 팀에게는 협업 요청할 수 없음
    if (existingBooking.primaryTeam === requestedToTeam) {
      return NextResponse.json({ 
        error: '같은 팀에게는 협업 요청을 할 수 없습니다.' 
      }, { status: 400 });
    }

    // TODO: 사용자 정보 조회해서 현재 사용자의 팀 확인
    // const currentUserTeam = await getUserTeam(decodedToken.uid);

    // 협업 요청 데이터 구성
    const collaborationData = {
      bookingId: id,
      requestedBy: {
        team: existingBooking.primaryTeam, // 현재는 예약의 주담당 팀으로 설정
        userId: decodedToken.uid,
        userName: decodedToken.email || 'Unknown User'
      },
      requestedTo: {
        team: requestedToTeam as Team,
        userIds: requestedToUserIds // 특정 사용자들에게만 요청 (선택사항)
      },
      type: type as CollaborationType,
      priority: priority || 'MEDIUM',
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate ? new Date(dueDate) : undefined
    };

    // 협업 요청 생성
    const requestId = await CollaborationService.createCollaborationRequest(collaborationData);

    console.log(`✅ 협업 요청 생성 완료: ${requestId} (예약: ${existingBooking.bookingNumber})`);

    return NextResponse.json({
      success: true,
      data: {
        requestId,
        bookingId: id,
        bookingNumber: existingBooking.bookingNumber,
        requestedToTeam,
        type,
        title,
        priority: collaborationData.priority
      },
      message: '협업 요청이 성공적으로 생성되었습니다.'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ 협업 요청 생성 API 오류:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('권한')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message.includes('유효하지 않은')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    
    return NextResponse.json(
      { error: '협업 요청 생성 중 서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 예약별 협업 요청 목록 조회 API
 * GET /api/bookings/[id]/collaborate
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔐 협업 요청 목록 조회 API 호출 시작...');
    
    // 인증 확인
    const decodedToken = await verifyIdTokenFromCookies(request.cookies);
    if (!decodedToken) {
      console.log('❌ 인증 실패: 토큰이 없거나 유효하지 않음');
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    console.log('✅ 인증 성공:', decodedToken.email);

    // 파라미터 추출
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: '예약 ID가 필요합니다.' }, { status: 400 });
    }

    // 예약 존재 확인
    const existingBooking = await BookingService.getBookingById(id);
    if (!existingBooking) {
      return NextResponse.json({ error: '예약을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 쿼리 파라미터
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    // 협업 요청 목록 조회
    const requests = await CollaborationService.getCollaborationRequestsByBooking(id);

    // 필터링
    let filteredRequests = requests;
    
    if (status) {
      filteredRequests = filteredRequests.filter(req => req.status === status);
    }
    
    if (type) {
      filteredRequests = filteredRequests.filter(req => req.type === type);
    }

    console.log(`✅ 협업 요청 목록 조회 완료: ${filteredRequests.length}개 (예약: ${existingBooking.bookingNumber})`);

    return NextResponse.json({
      success: true,
      data: {
        bookingId: id,
        bookingNumber: existingBooking.bookingNumber,
        requests: filteredRequests,
        totalCount: filteredRequests.length,
        filters: { status, type }
      }
    });

  } catch (error) {
    console.error('❌ 협업 요청 목록 조회 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

