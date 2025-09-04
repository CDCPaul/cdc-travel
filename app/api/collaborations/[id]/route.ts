import { NextRequest, NextResponse } from 'next/server';
import { verifyIdTokenFromCookies } from '@/lib/auth-server';
import { CollaborationService } from '@/lib/collaboration-service';
import { CollaborationStatus, Priority } from '@/types/booking';

/**
 * 개별 협업 요청 조회 API
 * GET /api/collaborations/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔐 개별 협업 요청 조회 API 호출 시작...');
    
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
      return NextResponse.json({ error: '협업 요청 ID가 필요합니다.' }, { status: 400 });
    }

    // 협업 요청 조회
    const request_data = await CollaborationService.getCollaborationRequestById(id);
    
    if (!request_data) {
      return NextResponse.json({ error: '협업 요청을 찾을 수 없습니다.' }, { status: 404 });
    }

    console.log(`✅ 협업 요청 조회 완료: ${request_data.title} (${id})`);

    return NextResponse.json({
      success: true,
      data: request_data
    });

  } catch (error) {
    console.error('❌ 개별 협업 요청 조회 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 협업 요청 수정 API
 * PUT /api/collaborations/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔐 협업 요청 수정 API 호출 시작...');
    
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
      return NextResponse.json({ error: '협업 요청 ID가 필요합니다.' }, { status: 400 });
    }

    // 기존 협업 요청 확인
    const existingRequest = await CollaborationService.getCollaborationRequestById(id);
    if (!existingRequest) {
      return NextResponse.json({ error: '협업 요청을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 요청 바디 파싱
    const body = await request.json();
    const { status, response, notes, assignedTo, priority, dueDate } = body;

    // 수정 가능한 필드들만 업데이트
    const updateData: {
      status?: CollaborationStatus;
      response?: string;
      notes?: string;
      assignedTo?: string;
      priority?: Priority;
      dueDate?: Date;
    } = {};

    if (status) {
      // 상태 검증
      const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ 
          error: '유효한 상태를 입력해주세요.',
          validStatuses 
        }, { status: 400 });
      }
      updateData.status = status;
    }

    if (response !== undefined) {
      updateData.response = response;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (assignedTo !== undefined) {
      updateData.assignedTo = assignedTo;
    }

    if (priority) {
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
      if (!validPriorities.includes(priority)) {
        return NextResponse.json({ 
          error: '유효한 우선순위를 입력해주세요.',
          validPriorities 
        }, { status: 400 });
      }
      updateData.priority = priority;
    }

    if (dueDate) {
      updateData.dueDate = new Date(dueDate);
    }

    // 빈 업데이트인지 확인
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '수정할 내용이 없습니다.' }, { status: 400 });
    }

    // 협업 요청 수정
    const success = await CollaborationService.updateCollaborationRequest(id, updateData);
    
    if (!success) {
      return NextResponse.json({ error: '협업 요청 수정에 실패했습니다.' }, { status: 500 });
    }

    // 수정된 협업 요청 정보 조회
    const updatedRequest = await CollaborationService.getCollaborationRequestById(id);

    console.log(`✅ 협업 요청 수정 완료: ${existingRequest.title} (${id})`);

    return NextResponse.json({
      success: true,
      data: updatedRequest,
      message: '협업 요청이 성공적으로 수정되었습니다.'
    });

  } catch (error) {
    console.error('❌ 협업 요청 수정 API 오류:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('권한')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message.includes('유효하지 않은')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    
    return NextResponse.json(
      { error: '협업 요청 수정 중 서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 협업 요청 삭제 API
 * DELETE /api/collaborations/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔐 협업 요청 삭제 API 호출 시작...');
    
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
      return NextResponse.json({ error: '협업 요청 ID가 필요합니다.' }, { status: 400 });
    }

    // 기존 협업 요청 확인
    const existingRequest = await CollaborationService.getCollaborationRequestById(id);
    if (!existingRequest) {
      return NextResponse.json({ error: '협업 요청을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 이미 완료된 협업 요청은 삭제할 수 없음
    if (existingRequest.status === 'COMPLETED') {
      return NextResponse.json({ error: '완료된 협업 요청은 삭제할 수 없습니다.' }, { status: 400 });
    }

    // 협업 요청 삭제
    const success = await CollaborationService.deleteCollaborationRequest(id);
    
    if (!success) {
      return NextResponse.json({ error: '협업 요청 삭제에 실패했습니다.' }, { status: 500 });
    }

    console.log(`✅ 협업 요청 삭제 완료: ${existingRequest.title} (${id})`);

    return NextResponse.json({
      success: true,
      message: '협업 요청이 성공적으로 삭제되었습니다.',
      data: {
        requestId: id,
        title: existingRequest.title
      }
    });

  } catch (error) {
    console.error('❌ 협업 요청 삭제 API 오류:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('권한')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    return NextResponse.json(
      { error: '협업 요청 삭제 중 서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
