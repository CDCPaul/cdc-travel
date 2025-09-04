import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { ExchangeRateService } from '@/lib/exchange-rate';

export async function GET(request: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return requireAuth(request, async (req, _user) => {
    try {
      // URL 파라미터 확인
      const { searchParams } = new URL(req.url);
      const forceUpdate = searchParams.get('update') === 'true';

      let exchangeRate;
      
      if (forceUpdate) {
        // 강제 업데이트 (관리자용)
        exchangeRate = await ExchangeRateService.updateExchangeRate();
      } else {
        // 일반 조회 (캐시된 데이터 우선)
        exchangeRate = await ExchangeRateService.getTodayExchangeRate();
      }

      return new Response(
        JSON.stringify({ success: true, data: exchangeRate }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('환율 데이터 조회 실패:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch exchange rate' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  });
} 