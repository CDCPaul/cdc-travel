import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    
    // Firebase Admin Firestore 사용
    const db = getAdminDb();
    
    // TA 데이터 가져오기
    const taRef = db.collection('tas').doc(id);
    const taDoc = await taRef.get();

    if (!taDoc.exists) {
      return NextResponse.json(
        { error: 'TA를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const taData = taDoc.data();
    
    // 기존 로고 URL이 있는 경우 Firebase Storage에서 삭제
    if (taData?.logo) {
      try {
        const { getStorage } = await import('firebase-admin/storage');
        const storage = getStorage();
        const bucket = storage.bucket();
        
        // URL에서 파일 경로 추출
        const logoUrl = taData.logo;
        if (logoUrl.startsWith('https://storage.googleapis.com/')) {
          const filePath = logoUrl.replace('https://storage.googleapis.com/', '').split('/').slice(1).join('/');
          const file = bucket.file(filePath);
          
          // 파일 존재 여부 확인 후 삭제
          const [exists] = await file.exists();
          if (exists) {
            await file.delete();
            console.log('로고 파일 삭제 완료:', filePath);
          }
        }
      } catch (error) {
        console.error('로고 파일 삭제 실패:', error);
        // 파일 삭제 실패해도 계속 진행
      }
    }

    // Firestore에서 로고 필드 업데이트
    await taRef.update({
      logo: "",
      updatedAt: new Date(),
      updatedBy: decodedToken.uid
    });

    return NextResponse.json({
      success: true,
      message: '로고가 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('로고 삭제 실패:', error);
    return NextResponse.json(
      { error: '로고 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
} 