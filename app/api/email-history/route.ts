import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
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

    // URL 파라미터에서 TA ID 추출
    const { searchParams } = new URL(request.url);
    const taId = searchParams.get('taId');
    
    console.log('이메일 기록 조회 요청:', { taId });

    if (!taId) {
      return NextResponse.json(
        { error: 'TA ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // Firebase Admin Firestore 사용
    const db = getAdminDb();
    
    console.log('Firestore 쿼리 시작:', { taId });
    
    try {
      // 이메일 발송 기록 가져오기 (최근 50개)
      const emailHistoryRef = db.collection('email_history')
        .where('taId', '==', taId)
        .limit(50);
      
      const querySnapshot = await emailHistoryRef.get();
      
      console.log('쿼리 결과:', { 
        totalDocs: querySnapshot.docs.length,
        empty: querySnapshot.empty 
      });

      const history = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          subject: data.subject || '',
          content: data.content || '',
          sentBy: data.sentBy || '',
          sentByEmail: data.sentByEmail || '',
          sentAt: data.sentAt,
          attachments: data.attachments || [],
          includeLogo: data.includeLogo || false,
          messageId: data.messageId || null,
          taEmail: data.taEmail || '', // 수신자 이메일
          deliveryStatus: data.deliveryStatus || null,
          readStatus: data.readStatus || null
        };
      });

      console.log('처리된 기록 수:', history.length);

      return NextResponse.json({
        success: true,
        history: history
      });
    } catch (firestoreError) {
      console.error('Firestore 쿼리 실패:', firestoreError);
      return NextResponse.json({
        success: true,
        history: [],
        message: '이메일 기록을 불러올 수 없습니다. (Firestore 오류)'
      });
    }

  } catch (error) {
    console.error('이메일 기록 조회 실패:', error);
    return NextResponse.json(
      { 
        error: '이메일 기록을 불러올 수 없습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
} 