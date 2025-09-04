import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { BookingService } from '@/lib/booking-service';
import { UpdateBookingRequest } from '@/types/booking';

/**
 * 개별 예약 조회 API
 * GET /api/bookings/[id]
 */
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(request, async (req, user) => {
    try {
      const resolvedParams = await params;
      console.log(`🔐 예약 조회 API 호출: ${resolvedParams.id}`, user.email);

      // ID 검증
      if (!resolvedParams.id) {
        return new Response(
          JSON.stringify({ error: '예약 ID가 필요합니다.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 예약 조회
      const booking = await BookingService.getBookingById(resolvedParams.id);

      if (!booking) {
        return new Response(
          JSON.stringify({ error: '예약을 찾을 수 없습니다.' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      console.log(`✅ 예약 조회 완료: ${booking.bookingNumber}`);

      return new Response(
        JSON.stringify({ success: true, data: booking }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('❌ 예약 조회 API 오류:', error);
      return new Response(
        JSON.stringify({ error: '서버 오류가 발생했습니다.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  });
}

/**
 * 예약 수정 API
 * PUT /api/bookings/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(request, async (req, user) => {
    try {
      const resolvedParams = await params;
      console.log(`🔐 예약 수정 API 호출: ${resolvedParams.id}`, user.email);

    // ID 검증
    if (!resolvedParams.id) {
      return NextResponse.json({ error: '예약 ID가 필요합니다.' }, { status: 400 });
    }

    // 기존 예약 확인
    const existingBooking = await BookingService.getBookingById(resolvedParams.id);
    if (!existingBooking) {
      return NextResponse.json({ error: '수정할 예약을 찾을 수 없습니다.' }, { status: 404 });
    }

      // 요청 바디 파싱
      const body = await req.json();
    
    // 수정 데이터 구성
    const updateData: UpdateBookingRequest = {
      customer: body.customer,
      dates: body.dates ? {
        start: new Date(body.dates.start),
        end: new Date(body.dates.end)
      } : undefined,
      paxInfo: body.paxInfo,
      flightDetails: body.flightDetails,
      landInfo: body.landInfo,
      packageInfo: body.packageInfo,
      customRequirements: body.customRequirements,
      notes: body.notes,
      internalNotes: body.internalNotes,
      priority: body.priority,
      tags: body.tags,
      deadlines: body.deadlines
    };

    // 빈 값들 제거 (undefined가 아닌 실제 값만 업데이트)
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof UpdateBookingRequest] === undefined) {
        delete updateData[key as keyof UpdateBookingRequest];
      }
    });

      // 예약 수정
      const updateSuccess = await BookingService.updateBooking(resolvedParams.id, updateData, user.uid);
    
    if (!updateSuccess) {
      throw new Error('예약 수정에 실패했습니다.');
    }

    // 수정된 예약 정보 다시 조회
    const updatedBooking = await BookingService.getBookingById(resolvedParams.id);
    
    console.log(`✅ 예약 수정 완료: ${updatedBooking?.bookingNumber}`);

      return new Response(
        JSON.stringify({
          success: true,
          data: updatedBooking,
          message: '예약이 성공적으로 수정되었습니다.'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('❌ 예약 수정 API 오류:', error);
      
      // 구체적인 에러 메시지 처리
      if (error instanceof Error) {
        if (error.message.includes('권한')) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (error.message.includes('찾을 수 없음')) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (error.message.includes('유효하지 않음')) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      
      return new Response(
        JSON.stringify({ error: '예약 수정 중 서버 오류가 발생했습니다.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  });
}

/**
 * 예약 삭제 API
 * DELETE /api/bookings/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(request, async (req, user) => {
    try {
      const resolvedParams = await params;
      console.log(`🔐 예약 삭제 API 호출: ${resolvedParams.id}`, user.email);

      // ID 검증
      if (!resolvedParams.id) {
        return new Response(
          JSON.stringify({ error: '예약 ID가 필요합니다.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 기존 예약 확인
      const existingBooking = await BookingService.getBookingById(resolvedParams.id);
      if (!existingBooking) {
        return new Response(
          JSON.stringify({ error: '삭제할 예약을 찾을 수 없습니다.' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 삭제 권한 확인 (완료된 예약은 삭제 불가 등)
      if (existingBooking.status === 'COMPLETED') {
        return new Response(
          JSON.stringify({ error: '완료된 예약은 삭제할 수 없습니다.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 예약 삭제 (실제로는 취소 상태로 변경)
      // TODO: BookingService에 status 업데이트 메서드 추가 필요
      // 현재는 단순히 internal note만 업데이트
      await BookingService.updateBooking(resolvedParams.id, {
        internalNotes: `예약이 ${new Date().toISOString()}에 취소되었습니다.`
      }, user.uid);

      console.log(`✅ 예약 삭제(취소) 완료: ${existingBooking.bookingNumber}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: '예약이 성공적으로 취소되었습니다.'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('❌ 예약 삭제 API 오류:', error);
      return new Response(
        JSON.stringify({ error: '예약 삭제 중 서버 오류가 발생했습니다.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  });
}