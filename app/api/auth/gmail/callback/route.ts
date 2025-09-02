import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { GmailTokenManager } from '@/lib/gmail-token-manager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // userId가 들어있음
    const error = searchParams.get('error');

    if (error) {
      console.error('Gmail OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/admin/ta-list/send-email?error=gmail_oauth_error`
      );
    }

    if (!code || !state) {
      console.error('Gmail OAuth: No authorization code or state received');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/admin/ta-list/send-email?error=gmail_no_code`
      );
    }

    const userId = state;

    // Gmail OAuth2 클라이언트 설정
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/gmail/callback`
    );

    console.log(`🔄 Gmail 토큰 교환 시작: ${userId}`);

    // Authorization code를 access token과 refresh token으로 교환
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token) {
      console.error('Gmail OAuth: No access token received');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/admin/ta-list/send-email?error=gmail_no_access_token`
      );
    }

    if (!tokens.refresh_token) {
      console.error('Gmail OAuth: No refresh token received');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/admin/ta-list/send-email?error=gmail_no_refresh_token`
      );
    }

    // Gmail 토큰을 Firestore에 저장
    await GmailTokenManager.saveGmailTokens(
      userId,
      tokens.access_token,
      tokens.refresh_token,
      tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600
    );

    console.log(`✅ Gmail 토큰 저장 완료: ${userId}`);

    // 성공 페이지로 리다이렉트
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/admin/ta-list/send-email?gmail_auth=success`
    );

  } catch (error) {
    console.error('Gmail OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/admin/ta-list/send-email?error=gmail_callback_error`
    );
  }
}


