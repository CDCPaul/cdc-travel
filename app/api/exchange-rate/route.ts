import { NextRequest, NextResponse } from 'next/server';
import { verifyIdTokenFromCookies } from '@/lib/auth-server';
import { ExchangeRateService } from '@/lib/exchange-rate';

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const authResult = await verifyIdTokenFromCookies(request.cookies);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // URL 파라미터 확인
    const { searchParams } = new URL(request.url);
    const forceUpdate = searchParams.get('update') === 'true';

    let exchangeRate;
    
    if (forceUpdate) {
      // 강제 업데이트
      exchangeRate = await ExchangeRateService.updateExchangeRate();
    } else {
      // 일반 조회 (캐시된 데이터 우선)
      exchangeRate = await ExchangeRateService.getTodayExchangeRate();
    }

    return NextResponse.json({
      success: true,
      data: exchangeRate
    });

  } catch (error) {
    console.error('환율 데이터 조회 실패:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange rate' },
      { status: 500 }
    );
  }
} 