import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';

export async function GET(
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
    await auth.verifyIdToken(idToken);

    const { id: letterId } = await params;

    // Firebase Admin Firestore 사용
    const db = getAdminDb();
    
    // 레터 정보 가져오기
    const letterRef = db.collection('letters').doc(letterId);
    const letterDoc = await letterRef.get();

    if (!letterDoc.exists) {
      return NextResponse.json(
        { error: '레터를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const letterData = letterDoc.data();
    
    return NextResponse.json({
      success: true,
      data: {
        id: letterId,
        name: letterData?.name,
        fileName: letterData?.fileName,
        fileSize: letterData?.fileSize,
        fileUrl: letterData?.url,
        createdAt: letterData?.createdAt,
        createdBy: letterData?.createdBy,
        updatedAt: letterData?.updatedAt,
        updatedBy: letterData?.updatedBy
      }
    });

  } catch (error) {
    console.error('레터 조회 실패:', error);
    return NextResponse.json(
      { error: '레터 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const { id: letterId } = await params;

    // Firebase Admin Firestore 사용
    const db = getAdminDb();
    
    // 레터 정보 가져오기
    const letterRef = db.collection('letters').doc(letterId);
    const letterDoc = await letterRef.get();

    if (!letterDoc.exists) {
      return NextResponse.json(
        { error: '레터를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const file = formData.get('file') as File | null;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: '레터 이름은 필수입니다.' },
        { status: 400 }
      );
    }

    const updateData: {
      name: string;
      updatedAt: Date;
      updatedBy: string;
      fileName?: string;
      fileSize?: number;
      url?: string;
    } = {
      name: name.trim(),
      updatedAt: new Date(),
      updatedBy: decodedToken.uid
    };

    // 새 파일이 업로드된 경우
    if (file) {
      const storage = getStorage(initializeFirebaseAdmin());
      const bucket = storage.bucket();
      
      // 기존 파일 삭제
      const existingData = letterDoc.data();
      if (existingData?.url) {
        try {
          const urlParts = existingData.url.split('/');
          const fileName = urlParts.slice(-2).join('/');
          const fileRef = bucket.file(fileName);
          await fileRef.delete();
        } catch (error) {
          console.error('기존 파일 삭제 실패:', error);
        }
      }

      // 새 파일 업로드
      const fileName = `letters/${letterId}/${file.name}`;
      const fileRef = bucket.file(fileName);
      
      const buffer = Buffer.from(await file.arrayBuffer());
      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type,
        }
      });

      // 공개 URL 생성
      await fileRef.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      updateData.fileName = file.name;
      updateData.fileSize = file.size;
      updateData.url = publicUrl;
    }

    // Firestore 업데이트
    await letterRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: '레터가 성공적으로 수정되었습니다.'
    });

  } catch (error) {
    console.error('레터 수정 실패:', error);
    return NextResponse.json(
      { error: '레터 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

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
    await auth.verifyIdToken(idToken);

    const { id: letterId } = await params;

    // Firebase Admin Firestore 사용
    const db = getAdminDb();
    
    // 레터 정보 가져오기
    const letterRef = db.collection('letters').doc(letterId);
    const letterDoc = await letterRef.get();

    if (!letterDoc.exists) {
      return NextResponse.json(
        { error: '레터를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const letterData = letterDoc.data();
    const fileUrl = letterData?.url;

    // Firebase Storage에서 파일 삭제
    if (fileUrl) {
      try {
        const storage = getStorage(initializeFirebaseAdmin());
        const bucket = storage.bucket();
        
        // URL에서 파일 경로 추출
        const urlParts = fileUrl.split('/');
        const fileName = urlParts.slice(-2).join('/'); // letters/filename.pdf
        
        const fileRef = bucket.file(fileName);
        await fileRef.delete();
      } catch (error) {
        console.error('Storage 파일 삭제 실패:', error);
        // Storage 삭제 실패해도 Firestore는 삭제 진행
      }
    }

    // Firestore에서 레터 삭제
    await letterRef.delete();

    return NextResponse.json({
      success: true,
      message: '레터가 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('레터 삭제 실패:', error);
    return NextResponse.json(
      { error: '레터 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
} 