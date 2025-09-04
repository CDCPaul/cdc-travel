import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { detectPassportText } from '@/lib/vision-api';

export async function POST(request: NextRequest) {
  return requireAuth(request, async (req, user) => {
    try {
      console.log('여권 판독 API 호출 시작', user.email);
    
      // 요청 데이터 파싱
      const { image } = await req.json();
    
      if (!image) {
        console.log('이미지 데이터 없음 - 400 반환');
        return new Response(
          JSON.stringify({ error: '이미지가 필요합니다.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      console.log('이미지 데이터 확인 완료, Vision API 호출 시작');

      // Vision API를 사용하여 여권 판독
      const passportData = await detectPassportText(image);
      
      console.log('Vision API 호출 완료, 결과:', passportData);

      return new Response(
        JSON.stringify(passportData),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('여권 판독 실패:', error);
      return new Response(
        JSON.stringify({ error: '여권 판독에 실패했습니다.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  });
} 