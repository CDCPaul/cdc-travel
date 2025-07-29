import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { OAuthService } from '@/lib/oauth-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/login?error=oauth_error`);
    }

    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/login?error=no_code`);
    }

    // Google OAuth2 클라이언트 설정
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    );

    // Authorization code를 access token과 refresh token으로 교환
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token) {
      console.error('No access token received');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/login?error=no_access_token`);
    }

    // Google 사용자 정보 가져오기
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    if (!userInfo.data.email) {
      console.error('No email in user info');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/login?error=no_email`);
    }

    // 도메인 검증 (@cebudirectclub.com)
    if (!userInfo.data.email.endsWith('@cebudirectclub.com')) {
      console.error('Invalid domain:', userInfo.data.email);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/login?error=invalid_domain`);
    }

    // Firebase Admin SDK로 사용자 검증 및 ID 토큰 생성
    const auth = getAuth(initializeFirebaseAdmin());
    
    // 기존 사용자 확인 또는 생성
    let uid: string;
    try {
      const userRecord = await auth.getUserByEmail(userInfo.data.email);
      uid = userRecord.uid;
    } catch {
      // 사용자가 존재하지 않으면 생성
      const userRecord = await auth.createUser({
        email: userInfo.data.email,
        displayName: userInfo.data.name || userInfo.data.email,
        emailVerified: true
      });
      uid = userRecord.uid;
    }

    // Custom ID 토큰 생성 (Firebase Admin SDK)
    const customToken = await auth.createCustomToken(uid);

    // Refresh token과 access token을 서버에 저장
    if (tokens.refresh_token) {
      await OAuthService.saveTokens(
        uid,
        tokens.access_token,
        tokens.refresh_token
      );
      console.log('✅ Refresh token과 access token이 저장되었습니다.');
    } else {
      console.warn('⚠️ Refresh token이 제공되지 않았습니다. access_type=offline과 prompt=consent를 확인하세요.');
    }

    // 클라이언트로 리다이렉트 (custom token 포함)
    const redirectUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/admin/auth/complete`);
    redirectUrl.searchParams.set('token', customToken);
    redirectUrl.searchParams.set('email', userInfo.data.email);
    redirectUrl.searchParams.set('name', userInfo.data.name || '');
    redirectUrl.searchParams.set('remember', state === 'remember' ? 'true' : 'false');

    return NextResponse.redirect(redirectUrl.toString());

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/login?error=callback_error`);
  }
} 