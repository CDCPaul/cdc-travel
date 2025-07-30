import { NextRequest, NextResponse } from 'next/server';
import { verifyIdTokenFromCookies } from '@/lib/auth-server';
import { NewFlightService } from '@/lib/new-flight-service';
import { NewFlightApiRequest } from '@/types/flight';

// Rate Limiting을 위한 간단한 메모리 캐시
const requestCache = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60000; // 1분
const MAX_REQUESTS_PER_WINDOW = 10; // 1분당 최대 10개 요청

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const decodedToken = await verifyIdTokenFromCookies(request.cookies);
    if (!decodedToken) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    // Rate Limiting 체크
    const clientId = decodedToken.uid;
    const userRequests = requestCache.get(clientId) || 0;
    
    if (userRequests >= MAX_REQUESTS_PER_WINDOW) {
      return NextResponse.json(
        { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      );
    }

    // 요청 카운트 증가
    requestCache.set(clientId, userRequests + 1);
    
    // 1분 후 카운트 리셋
    setTimeout(() => {
      requestCache.delete(clientId);
    }, RATE_LIMIT_WINDOW);

    const body = await request.json();
    const requestData: NewFlightApiRequest = body;

    // 입력 검증
    if (!requestData.departureIata || !requestData.date || !requestData.timeSlot) {
      return NextResponse.json(
        { error: '출발공항 코드, 날짜, 시간대가 필요합니다.' },
        { status: 400 }
      );
    }

    // 출발공항 코드 형식 검증 (3자리)
    const iataRegex = /^[A-Z]{3}$/;
    if (!iataRegex.test(requestData.departureIata)) {
      return NextResponse.json(
        { error: '출발공항 코드는 3자리 대문자여야 합니다 (예: ICN).' },
        { status: 400 }
      );
    }

    // 날짜 형식 검증
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(requestData.date)) {
      return NextResponse.json(
        { error: '날짜는 YYYY-MM-DD 형식이어야 합니다.' },
        { status: 400 }
      );
    }

    // 시간대 형식 검증
    if (!['00-12', '12-00'].includes(requestData.timeSlot)) {
      return NextResponse.json(
        { error: '시간대는 00-12 또는 12-00이어야 합니다.' },
        { status: 400 }
      );
    }

    console.log(`🔄 새로운 항공 API 호출 시작: ${requestData.departureIata}, ${requestData.date}, ${requestData.timeSlot}`);

    // API 호출 및 저장
    const savedCount = await NewFlightService.callApiAndSaveFlights(requestData);

    return NextResponse.json({
      success: true,
      savedCount,
      message: `${savedCount}개의 항공편이 저장되었습니다.`,
    });

  } catch (error) {
    console.error('❌ 새로운 항공편 수집 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const decodedToken = await verifyIdTokenFromCookies(request.cookies);
    if (!decodedToken) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const route = searchParams.get('route');
    const date = searchParams.get('date');
    const airline = searchParams.get('airline');

    if (!route || !date) {
      return NextResponse.json(
        { error: '경로와 날짜가 필요합니다.' },
        { status: 400 }
      );
    }

    let flights;
    
    if (airline) {
      // 항공사별 조회
      flights = await NewFlightService.getFlightsByAirline(airline, date);
    } else {
      // 경로별 조회
      flights = await NewFlightService.getFlightsByRouteAndDate(route, date);
    }

    return NextResponse.json({
      success: true,
      flights,
      count: flights.length,
    });

  } catch (error) {
    console.error('❌ 항공편 조회 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 