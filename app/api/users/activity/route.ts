import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
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
    const decodedToken = await auth.verifyIdToken(idToken);

    const body = await request.json();
    const { action, details, userId, userEmail } = body;

    if (!action || !details) {
      return NextResponse.json(
        { error: '액션과 상세 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    // Firestore에 활동 기록
    const db = getAdminDb();
    const activityRef = db.collection('userActivities');
    
    const activityData = {
      userId: userId || decodedToken.uid,
      userEmail: userEmail || decodedToken.email,
      action,
      details,
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      workspace: 'default' // 워크스페이스 정보
    };

    await activityRef.add(activityData);

    // 사용자의 lastActivityAt 업데이트
    const userRef = db.collection('users').doc(activityData.userId);
    await userRef.set({
      lastActivityAt: new Date(),
      updatedAt: new Date()
    }, { merge: true });

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error('사용자 활동 기록 실패:', error);
    
    // 토큰 만료 에러인 경우 특별 처리
    if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: '토큰이 만료되었습니다. 다시 로그인해주세요.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: '활동을 기록할 수 없습니다.' },
      { status: 500 }
    );
  }
}

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
    try {
      await auth.verifyIdToken(idToken);
    } catch (tokenError: unknown) {
      if (tokenError && typeof tokenError === 'object' && 'code' in tokenError && tokenError.code === 'auth/id-token-expired') {
        return NextResponse.json(
          { error: '토큰이 만료되었습니다. 다시 로그인해주세요.' },
          { status: 401 }
        );
      }
      throw tokenError;
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Firestore에서 활동 기록 가져오기 (조회 활동 제외)
    const db = getAdminDb();
    const activityRef = db.collection('userActivities');
    
    let query = activityRef
      .orderBy('timestamp', 'desc')
      .limit(limit);
    
    if (userId) {
      query = query.where('userId', '==', userId);
    }

    const snapshot = await query.get();
    
    const activities = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        userEmail: data.userEmail,
        action: data.action,
        details: data.details,
        timestamp: data.timestamp.toDate(),
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        workspace: data.workspace
      };
    });

    return NextResponse.json(activities);

  } catch (error) {
    console.error('사용자 활동 조회 실패:', error);
    return NextResponse.json(
      { error: '활동을 조회할 수 없습니다.' },
      { status: 500 }
    );
  }
} 