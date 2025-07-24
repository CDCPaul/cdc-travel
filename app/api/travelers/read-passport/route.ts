import { NextRequest, NextResponse } from 'next/server';
import { verifyIdTokenFromCookies } from '@/lib/auth-server';
import { detectPassportText } from '@/lib/vision-api';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    console.log('여권 판독 API 호출 시작');
    
    // 인증 확인
    const cookieStore = await cookies();
    console.log('쿠키 스토어 생성 완료');
    
    const user = await verifyIdTokenFromCookies(cookieStore);
    console.log('인증 확인 결과:', user ? '성공' : '실패');
    
    if (!user) {
      console.log('인증 실패 - 401 반환');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('인증 성공, 요청 데이터 파싱 시작');
    
    // 요청 데이터 파싱
    const { image } = await request.json();
    
    if (!image) {
      console.log('이미지 데이터 없음 - 400 반환');
      return NextResponse.json({ error: '이미지가 필요합니다.' }, { status: 400 });
    }

    console.log('이미지 데이터 확인 완료, Vision API 호출 시작');

    // Vision API를 사용하여 여권 판독
    const passportData = await detectPassportText(image);
    
    console.log('Vision API 호출 완료, 결과:', passportData);
    console.log('반환할 데이터 필드들:', {
      surname: passportData.surname,
      givenNames: passportData.givenNames,
      gender: passportData.gender,
      nationality: passportData.nationality,
      passportNumber: passportData.passportNumber,
      passportExpiry: passportData.passportExpiry
    });

    return NextResponse.json(passportData);

  } catch (error) {
    console.error('여권 판독 실패:', error);
    return NextResponse.json({ error: '여권 판독에 실패했습니다.' }, { status: 500 });
  }
} 