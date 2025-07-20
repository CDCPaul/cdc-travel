import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getApps, initializeApp } from 'firebase-admin/app';

// Firebase Admin 초기화
if (!getApps().length) {
  initializeApp();
}

export async function GET(request: NextRequest) {
  try {
    // Authorization 헤더에서 토큰 가져오기
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증 토큰이 필요합니다.' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // Firebase Admin으로 토큰 검증 및 사용자 정보 가져오기
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    // const uid = decodedToken.uid; // 현재 사용하지 않음
    
    // 기본 사용자 정보 (Firebase Auth에서 가져온 정보)
    let userEmail = decodedToken.email ?? 'admin@cebudirectclub.com';
    let userName = decodedToken.name ?? 'CDC Travel Team';

    // Gmail API를 사용하여 사용자 정보 가져오기 (선택적)
    const { google } = await import('googleapis');
    
    // Google OAuth2 클라이언트 설정
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Google 액세스 토큰이 있으면 Gmail API로 추가 정보 가져오기
    const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
    
    if (accessToken) {
      try {
        oauth2Client.setCredentials({
          access_token: accessToken
        });

        // Gmail API 클라이언트 생성
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        // 사용자 프로필 정보 가져오기
        const profileResponse = await gmail.users.getProfile({
          userId: 'me'
        });

        // Gmail API에서 가져온 정보로 업데이트
        userEmail = profileResponse.data.emailAddress ?? userEmail;
        userName = profileResponse.data.messagesTotal ? '사용자' : 'CDC Travel';
        
        // Gmail 서명 가져오기 (settings.basic 스코프 필요)
        try {
          const signatureResponse = await gmail.users.settings.sendAs.list({
            userId: 'me'
          });
          
          if (signatureResponse.data.sendAs && signatureResponse.data.sendAs.length > 0) {
            const primarySendAs = signatureResponse.data.sendAs.find((sendAs: { isPrimary?: boolean | null }) => sendAs.isPrimary === true) || signatureResponse.data.sendAs[0];
            
            if (primarySendAs && primarySendAs.signature) {
              // 실제 Gmail 서명 반환
              return NextResponse.json({
                success: true,
                signature: primarySendAs.signature,
                userEmail: userEmail,
                userName: userName
              });
            }
          }
        } catch (signatureError) {
          console.error('Gmail 서명 가져오기 실패:', signatureError);
          // 서명 가져오기 실패 시 기본 서명 사용
        }
      } catch (error) {
        console.error('Gmail API 호출 실패:', error);
        // API 실패 시 Firebase Auth 정보 사용
      }
    }

    // 기본 서명 생성 (실제로는 Gmail 설정에서 가져와야 함)
    const signature = `
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">
          Best regards,<br>
          <strong>${userName}</strong><br>
          CDC Travel Team<br>
          Email: ${userEmail}<br>
          Website: <a href="https://cebudirectclub.com" style="color: #3b82f6;">cebudirectclub.com</a>
        </p>
      </div>
    `;

    return NextResponse.json({
      success: true,
      signature: signature,
      userEmail: userEmail,
      userName: userName
    });

  } catch (error) {
    console.error('Google 서명 가져오기 실패:', error);
    return NextResponse.json({ 
      error: '서명을 가져오는데 실패했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 