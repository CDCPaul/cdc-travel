import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { OAuthService } from '@/lib/oauth-service';

export async function POST(req: NextRequest) {
  try {
    const { idToken, googleAccessToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ success: false, error: 'No idToken provided' }, { status: 400 });
    }

    // Firebase Admin SDK를 사용하여 토큰 검증
    const auth = getAuth(initializeFirebaseAdmin());
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // 개발환경에서는 secure 옵션 없이, 운영환경에서는 secure 옵션 추가
    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions = [
      `Path=/`,
      `HttpOnly`,
      `SameSite=Strict`,
      isProd ? `Secure` : ''
    ].filter(Boolean).join('; ');

    const res = NextResponse.json({ success: true });
    res.headers.append('Set-Cookie', `idToken=${idToken}; ${cookieOptions}`);
    
    // Google Access Token을 쿠키에 저장
    if (googleAccessToken) {
      res.headers.append('Set-Cookie', `googleAccessToken=${googleAccessToken}; ${cookieOptions}`);
      
      // OAuth 토큰을 Firestore에 저장 (이메일 발송용)
      try {
        await OAuthService.saveTokens(userId, googleAccessToken, ''); // refresh token은 빈 문자열로 저장
        console.log('OAuth 토큰이 Firestore에 저장되었습니다.');
      } catch (error) {
        console.error('OAuth 토큰 저장 실패:', error);
        // 토큰 저장 실패해도 로그인은 성공으로 처리
      }
    }
    
    return res;
  } catch (error) {
    console.error('로그인 처리 실패:', error);
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 });
  }
} 