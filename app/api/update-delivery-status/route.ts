import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { emailHistoryId, deliveryStatus, readStatus } = await request.json();

    if (!emailHistoryId) {
      return NextResponse.json(
        { error: '이메일 기록 ID가 필요합니다.' },
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
    await auth.verifyIdToken(idToken);

    // Firebase Admin Firestore 사용
    const db = getAdminDb();
    
    // 이메일 기록 업데이트
    const emailHistoryRef = db.collection('email_history').doc(emailHistoryId);
    const updateData: {
      updatedAt: Date;
      deliveryStatus?: 'sent' | 'delivered' | 'failed' | 'unknown';
      readStatus?: 'read' | 'unread' | 'unknown';
    } = {
      updatedAt: new Date()
    };

    if (deliveryStatus) {
      updateData.deliveryStatus = deliveryStatus;
    }

    if (readStatus) {
      updateData.readStatus = readStatus;
    }

    await emailHistoryRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: '수신확인 상태가 업데이트되었습니다.'
    });

  } catch (error) {
    console.error('수신확인 상태 업데이트 실패:', error);
    return NextResponse.json(
      { error: '수신확인 상태 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
} 