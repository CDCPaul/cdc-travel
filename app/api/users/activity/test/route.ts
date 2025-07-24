import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Firebase Admin SDK를 사용하여 토큰 검증
    const auth = getAuth(initializeFirebaseAdmin());
    const db = getAdminDb();
    
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
    
    // 관리자 권한 확인
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, userEmail } = body;

    // 테스트 활동 로그 생성
    const activityRef = db.collection('userActivities');
    
    const testActivities = [
      {
        userId: userId || decodedToken.uid,
        userEmail: userEmail || decodedToken.email,
        action: 'login',
        details: '사용자가 로그인했습니다.',
        timestamp: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        workspace: 'default'
      },
      {
        userId: userId || decodedToken.uid,
        userEmail: userEmail || decodedToken.email,
        action: 'create',
        details: '새로운 항목을 생성했습니다.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30분 전
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        workspace: 'default'
      },
      {
        userId: userId || decodedToken.uid,
        userEmail: userEmail || decodedToken.email,
        action: 'update',
        details: '기존 항목을 수정했습니다.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1시간 전
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        workspace: 'default'
      }
    ];

    for (const activity of testActivities) {
      await activityRef.add(activity);
    }

    // 사용자의 lastActivityAt 업데이트
    const userRef = db.collection('users').doc(userId || decodedToken.uid);
    await userRef.set({
      lastActivityAt: new Date(),
      updatedAt: new Date()
    }, { merge: true });

    return NextResponse.json({ 
      success: true, 
      message: '테스트 활동 로그가 생성되었습니다.',
      count: testActivities.length
    });

  } catch (error: unknown) {
    console.error('테스트 활동 로그 생성 실패:', error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: '토큰이 만료되었습니다. 다시 로그인해주세요.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: '테스트 활동 로그를 생성할 수 없습니다.' },
      { status: 500 }
    );
  }
} 