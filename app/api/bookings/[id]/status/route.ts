import { NextRequest, NextResponse } from 'next/server';
import { verifyIdTokenFromCookies } from '@/lib/auth-server';
import { BookingService } from '@/lib/booking-service';
import { WorkflowStep, WORKFLOW_TRANSITIONS } from '@/types/workflow';

/**
 * 예약 상태 변경 API
 * PUT /api/bookings/[id]/status
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔐 예약 상태 변경 API 호출 시작...');
    
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

    // 기존 예약 확인
    const existingBooking = await BookingService.getBookingById(id);
    if (!existingBooking) {
      return NextResponse.json({ error: '예약을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 요청 바디 파싱
    const body = await request.json();
    const { newStatus, notes } = body;

    // 새 상태 검증
    if (!newStatus || !Object.values(WorkflowStep).includes(newStatus)) {
      return NextResponse.json({ 
        error: '유효한 상태를 입력해주세요.', 
        validStatuses: Object.values(WorkflowStep) 
      }, { status: 400 });
    }

    // 현재 상태와 동일한지 확인
    if (existingBooking.currentStep === newStatus) {
      return NextResponse.json({ 
        error: '이미 해당 상태입니다.',
        currentStatus: existingBooking.currentStep
      }, { status: 400 });
    }

    // 상태 전환 가능 여부 확인
    const currentStep = existingBooking.currentStep;
    const allowedTransitions = WORKFLOW_TRANSITIONS[currentStep] || [];
    
    if (!allowedTransitions.includes(newStatus)) {
      return NextResponse.json({ 
        error: '현재 상태에서 해당 상태로 변경할 수 없습니다.',
        currentStatus: currentStep,
        allowedTransitions,
        requestedStatus: newStatus
      }, { status: 400 });
    }

    // 상태 변경
    const success = await BookingService.updateBookingStatus(
      id, 
      newStatus, 
      decodedToken.uid, 
      notes || '상태 변경'
    );
    
    if (!success) {
      return NextResponse.json({ error: '상태 변경에 실패했습니다.' }, { status: 500 });
    }

    // 변경된 예약 정보 조회
    const updatedBooking = await BookingService.getBookingById(id);

    console.log(`✅ 예약 상태 변경 완료: ${existingBooking.bookingNumber} ${currentStep} → ${newStatus}`);

    return NextResponse.json({
      success: true,
      data: {
        booking: updatedBooking,
        previousStatus: currentStep,
        newStatus: newStatus,
        changedBy: decodedToken.email,
        changedAt: new Date().toISOString(),
        notes
      },
      message: `상태가 성공적으로 변경되었습니다. (${currentStep} → ${newStatus})`
    });

  } catch (error) {
    console.error('❌ 예약 상태 변경 API 오류:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('권한')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message.includes('유효하지 않은')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message.includes('찾을 수 없습니다')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }
    
    return NextResponse.json(
      { error: '상태 변경 중 서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 예약 상태 히스토리 조회 API
 * GET /api/bookings/[id]/status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔐 예약 상태 히스토리 조회 API 호출 시작...');
    
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

    // TODO: 워크플로우 히스토리 조회 기능 구현 필요
    // const history = await BookingService.getWorkflowHistory(id);

    console.log(`✅ 예약 상태 정보 조회 완료: ${existingBooking.bookingNumber}`);

    return NextResponse.json({
      success: true,
      data: {
        bookingId: id,
        bookingNumber: existingBooking.bookingNumber,
        currentStatus: existingBooking.currentStep,
        allowedTransitions: WORKFLOW_TRANSITIONS[existingBooking.currentStep] || [],
        // history: history || []
        message: '워크플로우 히스토리 기능은 추후 구현 예정입니다.'
      }
    });

  } catch (error) {
    console.error('❌ 예약 상태 히스토리 조회 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

