import { NextRequest, NextResponse } from 'next/server';
import { verifyIdTokenFromCookies } from '@/lib/auth-server';
import { FlightService } from '@/lib/flight-service';
import { DEPARTURE_AIRPORTS } from '@/types/flight';

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const decodedToken = await verifyIdTokenFromCookies(request.cookies);
    if (!decodedToken) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { departureIata, startDate, endDate } = body;

    // 입력 검증
    if (!departureIata || !startDate || !endDate) {
      return NextResponse.json(
        { error: '출발 공항, 시작 날짜, 종료 날짜가 필요합니다.' },
        { status: 400 }
      );
    }

    // 출발 공항 유효성 검사
    if (!Object.keys(DEPARTURE_AIRPORTS).includes(departureIata)) {
      return NextResponse.json(
        { error: '유효하지 않은 출발 공항입니다.' },
        { status: 400 }
      );
    }

    // 날짜 형식 검증
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: '유효하지 않은 날짜 형식입니다.' },
        { status: 400 }
      );
    }

    if (start >= end) {
      return NextResponse.json(
        { error: '시작 날짜는 종료 날짜보다 이전이어야 합니다.' },
        { status: 400 }
      );
    }

    // 수집 요청 생성
    const departureAirport = DEPARTURE_AIRPORTS[departureIata as keyof typeof DEPARTURE_AIRPORTS];
    const requestId = await FlightService.createCollectionRequest(
      departureAirport,
      departureIata,
      startDate,
      endDate
    );

    console.log(`🔄 항공편 수집 요청 생성: ${requestId}`);

    // 백그라운드에서 수집 시작 (비동기)
    FlightService.collectAndSaveFlights(departureIata, start, end, requestId)
      .then((collectedCount) => {
        console.log(`✅ 항공편 수집 완료: ${collectedCount}개`);
      })
      .catch((error) => {
        console.error('❌ 항공편 수집 실패:', error);
      });

    return NextResponse.json({
      success: true,
      requestId,
      message: '항공편 수집이 시작되었습니다.',
    });

  } catch (error) {
    console.error('❌ 항공편 수집 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔐 flights/collect GET 요청 시작...');
    
    // 인증 확인
    const decodedToken = await verifyIdTokenFromCookies(request.cookies);
    if (!decodedToken) {
      console.log('❌ 인증 실패: 토큰이 없거나 유효하지 않음');
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    console.log('✅ 인증 성공:', decodedToken.email);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // 수집 요청 목록 조회
    const requests = await FlightService.getCollectionRequests(limit);

    console.log(`✅ 수집 요청 조회 완료: ${requests.length}개`);

    return NextResponse.json({
      success: true,
      requests,
      count: requests.length,
    });

  } catch (error) {
    console.error('❌ flights/collect GET 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 