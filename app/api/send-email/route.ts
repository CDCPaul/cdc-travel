import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { OAuthService } from '@/lib/oauth-service';
import { google } from 'googleapis';

export async function POST(request: NextRequest) {
  try {
    const { taIds, subject, content, attachments } = await request.json();

    if (!taIds || !Array.isArray(taIds) || taIds.length === 0) {
      return NextResponse.json(
        { error: '선택된 TA가 없습니다.' },
        { status: 400 }
      );
    }

    if (!subject || !content) {
      return NextResponse.json(
        { error: '제목과 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    // Firebase Admin SDK를 사용하여 토큰 검증
    const auth = getAuth(initializeFirebaseAdmin());
    
    // Authorization 헤더에서 ID 토큰 추출
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증 토큰이 필요합니다.' },
        { status: 401 }
      );
    }

    const idToken = authHeader.substring(7);
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // OAuthService를 사용하여 유효한 access token 가져오기 (자동 갱신 포함)
    const accessToken = await OAuthService.getValidAccessToken(userId);
    
    if (!accessToken) {
      console.log('유효한 Google Access Token을 찾을 수 없습니다.');
      return NextResponse.json(
        { error: 'Google Access Token이 필요합니다. 다시 로그인해주세요.', requiresReauth: true },
        { status: 401 }
      );
    }

    console.log('✅ 유효한 Google Access Token 획득 완료');

    // Firebase Admin Firestore 사용
    const db = getAdminDb();
    
    // 선택된 TA들의 이메일 주소 가져오기
    const tasRef = db.collection('tas');
    const querySnapshot = await tasRef.where('__name__', 'in', taIds).get();
    
    const emailAddresses: string[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email) {
        emailAddresses.push(data.email);
      }
    });

    if (emailAddresses.length === 0) {
      return NextResponse.json(
        { error: '유효한 이메일 주소를 찾을 수 없습니다.' },
        { status: 400 }
      );
    }

    // OAuth2 클라이언트 설정 및 Gmail API 사용
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    // 저장된 access token으로 인증 설정
    oauth2Client.setCredentials({
      access_token: accessToken
    });
    
    // Gmail API를 사용하여 이메일 발송
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // 이메일 메시지 구성
    const emailContent = `
      To: ${emailAddresses.join(', ')}
      Subject: ${subject}
      Content-Type: text/html; charset=utf-8
      
      ${content}
    `;

    const encodedMessage = Buffer.from(emailContent).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

    const message = {
      raw: encodedMessage
    };

    // Gmail API로 이메일 발송
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: message
    });

    console.log('✅ 이메일 발송 완료:', response.data.id);

    // 발송 기록을 Firestore에 저장
    const emailRecord = {
      messageId: response.data.id,
      taIds: taIds,
      subject: subject,
      content: content,
      attachments: attachments || [],
      sentAt: new Date(),
      sentBy: decodedToken.email,
      status: 'sent'
    };

    await db.collection('email_history').add(emailRecord);

    return NextResponse.json({
      success: true,
      messageId: response.data.id,
      sentCount: emailAddresses.length
    });

  } catch (error) {
    console.error('이메일 발송 실패:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('invalid_grant') || error.message.includes('token_expired')) {
        return NextResponse.json(
          { error: '토큰이 만료되었습니다. 다시 로그인해주세요.', requiresReauth: true },
          { status: 401 }
        );
      }
    }
    
    return NextResponse.json(
      { error: '이메일 발송에 실패했습니다.' },
      { status: 500 }
    );
  }
} 