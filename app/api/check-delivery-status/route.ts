import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { OAuthService } from '@/lib/oauth-service';

export async function POST(request: NextRequest) {
  try {
    const { messageId } = await request.json();

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID가 필요합니다.' },
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

    // Gmail API를 통해 메시지 정보 가져오기
    const messageResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    );

    if (!messageResponse.ok) {
      console.error('Gmail API 메시지 조회 실패:', messageResponse.status, messageResponse.statusText);
      return NextResponse.json(
        { error: '메시지 정보를 가져올 수 없습니다.' },
        { status: 500 }
      );
    }

    const messageData = await messageResponse.json();
    
    // 발송 상태 확인 (Gmail에서는 기본적으로 발송된 메시지는 delivered로 간주)
    let deliveryStatus: 'sent' | 'delivered' | 'failed' | 'unknown' = 'unknown';
    let readStatus: 'read' | 'unread' | 'unknown' = 'unknown';

    // 메시지 라벨 확인
    if (messageData.labelIds) {
      const labels = messageData.labelIds;
      
      // 발송 상태 확인
      if (labels.includes('SENT')) {
        deliveryStatus = 'delivered'; // Gmail에서 SENT 라벨이 있으면 발송됨
      }
      
      // 읽음 상태 확인 (Gmail에서는 읽음 상태를 직접 제공하지 않음)
      // 대신 UNREAD 라벨이 없으면 읽은 것으로 간주
      if (!labels.includes('UNREAD')) {
        readStatus = 'read';
      } else {
        readStatus = 'unread';
      }
    }

    // 추가적으로 메시지 헤더에서 정보 확인
    if (messageData.payload && messageData.payload.headers) {
      const headers = messageData.payload.headers;
      
      // X-Gmail-Labels 헤더 확인
      const gmailLabels = headers.find((h: { name: string; value: string }) => h.name === 'X-Gmail-Labels');
      if (gmailLabels) {
        const labels = gmailLabels.value.split(' ');
        if (labels.includes('SENT')) {
          deliveryStatus = 'delivered';
        }
        if (!labels.includes('UNREAD')) {
          readStatus = 'read';
        }
      }
    }

    return NextResponse.json({
      success: true,
      messageId,
      deliveryStatus,
      readStatus,
      messageData: {
        id: messageData.id,
        threadId: messageData.threadId,
        labelIds: messageData.labelIds,
        snippet: messageData.snippet
      }
    });

  } catch (error) {
    console.error('수신확인 확인 실패:', error);
    return NextResponse.json(
      { error: '수신확인 확인에 실패했습니다.' },
      { status: 500 }
    );
  }
} 