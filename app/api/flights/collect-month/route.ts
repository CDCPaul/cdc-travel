import { NextRequest, NextResponse } from 'next/server';
import { verifyIdTokenFromCookies } from '@/lib/auth-server';
import { NewFlightService } from '@/lib/new-flight-service';

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const user = await verifyIdTokenFromCookies(request.cookies);
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { departureIata, month } = body;

    if (!departureIata || !month) {
      return NextResponse.json({ error: '기준 공항 코드와 월을 입력해주세요.' }, { status: 400 });
    }

    // 월 형식 검증 (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: '월 형식이 올바르지 않습니다. (YYYY-MM)' }, { status: 400 });
    }

    console.log(`🔄 1개월 데이터 수집 시작: ${departureIata}, ${month}`);

    // 해당 월의 모든 날짜 생성
    const [year, monthNum] = month.split('-').map(Number);
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    
    let totalSaved = 0;
    let totalDays = 0;
    let totalApiCalls = 0;

    // 각 날짜별로 처리
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      console.log(`📅 ${date} 처리 중... (${day}/${daysInMonth})`);

      try {
        // 00-12 시간대 처리
        const morningResult = await NewFlightService.callApiAndSaveFlights({
          departureIata,
          date,
          timeSlot: '00-12'
        });
        totalSaved += morningResult;
        totalApiCalls++;

        // API 호출 간격 조절 (Rate Limit 방지) - 첫 번째 호출 후 대기
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기

        // 12-00 시간대 처리
        const afternoonResult = await NewFlightService.callApiAndSaveFlights({
          departureIata,
          date,
          timeSlot: '12-00'
        });
        totalSaved += afternoonResult;
        totalApiCalls++;

        totalDays++;
        console.log(`✅ ${date} 완료: ${morningResult + afternoonResult}개 저장됨`);

        // 다음 날짜 처리 전 추가 대기 (Rate Limit 방지)
        if (day < daysInMonth) {
          await new Promise(resolve => setTimeout(resolve, 3000)); // 3초 대기
        }

      } catch (error) {
        console.error(`❌ ${date} 처리 실패:`, error);
        // 개별 날짜 실패해도 계속 진행
        // 실패 후에도 대기 (Rate Limit 방지)
        if (day < daysInMonth) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
        }
      }
    }

    console.log(`✅ 1개월 데이터 수집 완료: ${totalSaved}개 저장됨 (${totalDays}일, ${totalApiCalls}회 API 호출)`);

    return NextResponse.json({
      success: true,
      totalSaved,
      totalDays,
      totalApiCalls,
      message: `1개월 데이터 수집 완료: ${totalSaved}개 저장됨 (${totalDays}일 처리)`
    });

  } catch (error) {
    console.error('❌ 1개월 데이터 수집 실패:', error);
    return NextResponse.json(
      { error: '1개월 데이터 수집 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 