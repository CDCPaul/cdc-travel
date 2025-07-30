import { NextRequest, NextResponse } from 'next/server';
import { ExchangeRateService } from '@/lib/exchange-rate';
import { getPhilippineDate, isPhilippineTime9AM } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    // 요청 헤더에서 cron job 시크릿 확인
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;
    
    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const phDate = getPhilippineDate();
    console.log(`🔄 자동 환율 업데이트 시작: ${phDate}`);

    // 필리핀 시간 오전 9시인지 확인 (선택적)
    if (!isPhilippineTime9AM()) {
      console.log('⏰ 아직 오전 9시가 아닙니다. 스킵합니다.');
      return NextResponse.json({ 
        success: true, 
        message: 'Not 9 AM yet, skipping update',
        date: phDate 
      });
    }

    // 환율 데이터 업데이트
    const exchangeRate = await ExchangeRateService.updateExchangeRate();
    
    console.log('✅ 자동 환율 업데이트 완료:', exchangeRate.lastUpdated);
    
    return NextResponse.json({
      success: true,
      message: 'Exchange rate updated successfully',
      data: exchangeRate,
      date: phDate
    });

  } catch (error) {
    console.error('❌ 자동 환율 업데이트 실패:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update exchange rate',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET 요청도 지원 (수동 테스트용)
export async function GET() {
  try {
    const phDate = getPhilippineDate();
    console.log(`🔄 수동 환율 업데이트 시작: ${phDate}`);

    const exchangeRate = await ExchangeRateService.updateExchangeRate();
    
    console.log('✅ 수동 환율 업데이트 완료:', exchangeRate.lastUpdated);
    
    return NextResponse.json({
      success: true,
      message: 'Exchange rate updated successfully',
      data: exchangeRate,
      date: phDate
    });

  } catch (error) {
    console.error('❌ 수동 환율 업데이트 실패:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update exchange rate',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 