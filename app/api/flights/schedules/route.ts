import { NextRequest, NextResponse } from 'next/server';
import { verifyIdTokenFromCookies } from '@/lib/auth-server';
import { FlightService } from '@/lib/flight-service';
import { NewFlightService } from '@/lib/new-flight-service';
import { FlightSchedule } from '@/types/flight';

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const decodedToken = await verifyIdTokenFromCookies(request.cookies);
    if (!decodedToken) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const departureIata = searchParams.get('departureIata');
    const route = searchParams.get('route');

    let flights: FlightSchedule[] = [];

    if (route && year && month) {
      // 새로운 구조: 루트별 조회 (최적화된 버전)
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      
      if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return NextResponse.json(
          { error: '유효하지 않은 년도 또는 월입니다.' },
          { status: 400 }
        );
      }

      // 최적화된 월별 조회 사용
      flights = await NewFlightService.getFlightsByRouteAndMonth(route, yearNum, monthNum);

    } else if (date) {
      // 특정 날짜의 항공편 조회 (기존 방식)
      flights = await FlightService.getFlightsByDate(date, departureIata || undefined);
    } else if (year && month) {
      // 특정 월의 항공편 조회 (기존 방식)
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      
      if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return NextResponse.json(
          { error: '유효하지 않은 년도 또는 월입니다.' },
          { status: 400 }
        );
      }
      
      flights = await FlightService.getFlightsByMonth(yearNum, monthNum, departureIata || undefined);
    } else {
      return NextResponse.json(
        { error: '날짜 또는 년도/월 파라미터가 필요합니다.' },
        { status: 400 }
      );
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