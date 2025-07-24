import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const auth = getAdminAuth();
    const db = getAdminDb();
    
    // 인증 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await auth.verifyIdToken(token);
    
    // 관리자 권한 확인
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    // 사용자 목록 가져오기
    const usersSnapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
    
    // Firebase Auth에서 사용자 정보도 가져오기
    const authUsers = await auth.listUsers();
    const authUsersMap = new Map();
    authUsers.users.forEach(user => {
      authUsersMap.set(user.uid, user);
    });
    
    const users = usersSnapshot.docs.map((doc: FirebaseFirestore.DocumentSnapshot) => {
      const data = doc.data();
      const authUser = authUsersMap.get(doc.id);
      
      return {
        id: doc.id,
        email: authUser?.email || data?.email || '',
        displayName: authUser?.displayName || data?.displayName || '',
        photoURL: authUser?.photoURL || data?.photoURL || '',
        emailVerified: authUser?.emailVerified || data?.emailVerified || false,
        disabled: data?.disabled || false,
        createdAt: data?.createdAt?.toDate?.() || data?.createdAt || new Date(),
        lastSignInAt: authUser?.metadata?.lastSignInTime ? new Date(authUser.metadata.lastSignInTime) : null,
        lastActivityAt: data?.lastActivityAt?.toDate?.() || data?.lastActivityAt || null,
        role: data?.role || 'user',
        workspace: data?.workspace || 'default'
      };
    });

    return NextResponse.json({ 
      success: true, 
      data: users,
      total: users.length
    });

  } catch (error: unknown) {
    console.error('사용자 목록 조회 실패:', error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: '토큰이 만료되었습니다. 다시 로그인해주세요.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: '사용자 목록을 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
} 