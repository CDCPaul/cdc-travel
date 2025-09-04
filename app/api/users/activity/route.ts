import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  return requireAuth(request, async (req, user) => {
    try {

      const body = await req.json();
      const { action, details, userId, userEmail } = body;

      if (!action || !details) {
        return new Response(
          JSON.stringify({ error: '액션과 상세 정보가 필요합니다.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Firestore에 활동 기록
      const db = getAdminDb();
      const activityRef = db.collection('userActivities');
      
      const activityData = {
        userId: userId || user.uid,
        userEmail: userEmail || user.email,
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

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

    } catch (error: unknown) {
      console.error('사용자 활동 기록 실패:', error);
      
      return new Response(
        JSON.stringify({ error: '활동을 기록할 수 없습니다.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  });
}

export async function GET(request: NextRequest) {
  return requireAuth(request, async (req, user) => {
    try {
      const db = getAdminDb();
    
      // 관리자 권한 확인
      const userDoc = await db.collection('users').doc(user.uid).get();
      const userData = userDoc.data();
    
      if (!userData || userData.role !== 'admin') {
        return new Response(
          JSON.stringify({ error: '관리자 권한이 필요합니다.' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const { searchParams } = new URL(request.url);
      const userId = searchParams.get('userId');
      const limit = parseInt(searchParams.get('limit') || '100');

      // Firestore에서 활동 기록 가져오기 (조회 활동 제외)
      const activityRef = db.collection('userActivities');
      
      try {
        // 단순한 쿼리로 시작 (인덱스 문제 방지)
        let snapshot;
        
        if (userId) {
          // 특정 사용자의 활동만 가져오기
          snapshot = await activityRef
            .where('userId', '==', userId)
            .limit(limit)
            .get();
        } else {
          // 모든 활동 가져오기
          snapshot = await activityRef
            .limit(limit)
            .get();
        }
        
        console.log(`Query executed successfully. Found ${snapshot.docs.length} documents.`);
        
        // 클라이언트에서 정렬 (인덱스 문제 방지)
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
        }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // 최신순 정렬

        console.log(`Found ${activities.length} activities for user ${userId}`);
        console.log('Activities:', activities);

        return new Response(
          JSON.stringify({ success: true, data: activities }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
        
      } catch (queryError) {
        console.error('Firestore query error:', queryError);
        
        // 쿼리 실패 시 빈 배열 반환
        return new Response(
          JSON.stringify({ success: true, data: [] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

    } catch (error) {
      console.error('사용자 활동 조회 실패:', error);
      return new Response(
        JSON.stringify({ error: '활동을 조회할 수 없습니다.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  });
} 