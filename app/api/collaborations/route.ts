import { NextRequest, NextResponse } from 'next/server';
import { verifyIdTokenFromCookies } from '@/lib/auth-server';
import { CollaborationService } from '@/lib/collaboration-service';
import { Team } from '@/types/team';
import { CollaborationType, CollaborationStatus } from '@/types/booking';

/**
 * 협업 요청 목록 조회 API
 * GET /api/collaborations?team=AIR&status=PENDING&page=1&limit=20
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔐 협업 요청 목록 조회 API 호출 시작...');
    
    // 인증 확인
    const decodedToken = await verifyIdTokenFromCookies(request.cookies);
    if (!decodedToken) {
      console.log('❌ 인증 실패: 토큰이 없거나 유효하지 않음');
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    console.log('✅ 인증 성공:', decodedToken.email);

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const requestedToTeam = searchParams.get('requestedToTeam') as Team;
    const requestedByTeam = searchParams.get('requestedByTeam') as Team;
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20');

    // 필터 구성
    const filters: {
      requestedToTeam?: Team;
      requestedByTeam?: Team;
      status?: CollaborationStatus;
      type?: CollaborationType;
      limit?: number;
    } = { limit };

    if (requestedToTeam && ['AIR', 'CINT'].includes(requestedToTeam)) {
      filters.requestedToTeam = requestedToTeam;
    }
    
    if (requestedByTeam && ['AIR', 'CINT'].includes(requestedByTeam)) {
      filters.requestedByTeam = requestedByTeam;
    }
    
    if (status) {
      filters.status = status as CollaborationStatus;
    }
    
    if (type) {
      filters.type = type as CollaborationType;
    }

    // 협업 요청 목록 조회
    const requests = await CollaborationService.getCollaborationRequests(filters);

    console.log(`✅ 협업 요청 목록 조회 완료: ${requests.length}개`);

    return NextResponse.json({
      success: true,
      data: {
        requests,
        totalCount: requests.length,
        filters: {
          requestedToTeam,
          requestedByTeam,
          status,
          type,
          limit
        }
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
