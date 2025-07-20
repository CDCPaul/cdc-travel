import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';

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

    // Firebase Admin Firestore 사용
    const db = getAdminDb();
    
    // 레터 목록 가져오기
    const lettersSnapshot = await db.collection('letters')
      .orderBy('createdAt', 'desc')
      .get();

    const letters = lettersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileUrl: data.url,
        createdAt: data.createdAt,
        createdBy: data.createdBy,
        updatedAt: data.updatedAt,
        updatedBy: data.updatedBy
      };
    });

    return NextResponse.json(letters);

  } catch (error) {
    console.error('레터 목록 조회 실패:', error);
    return NextResponse.json(
      { error: '레터 목록 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

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

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const file = formData.get('file') as File | null;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: '레터 이름은 필수입니다.' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: 'PDF 파일은 필수입니다.' },
        { status: 400 }
      );
    }

    // 파일 타입 검증
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'PDF 파일만 업로드 가능합니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 검증 (50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: '파일 크기는 50MB 이하여야 합니다.' },
        { status: 400 }
      );
    }

    // Firebase Admin Firestore 사용
    const db = getAdminDb();
    
    // 새 레터 문서 생성
    const letterRef = db.collection('letters').doc();
    const letterId = letterRef.id;

    // Firebase Storage에 파일 업로드
    const storage = getStorage(initializeFirebaseAdmin());
    const bucket = storage.bucket();
    
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

    // Firestore에 레터 정보 저장
    await letterRef.set({
      name: name.trim(),
      fileName: file.name,
      fileSize: file.size,
      url: publicUrl,
      createdAt: new Date(),
      createdBy: decodedToken.uid
    });

    return NextResponse.json({
      success: true,
      message: '레터가 성공적으로 생성되었습니다.',
      id: letterId
    });

  } catch (error) {
    console.error('레터 생성 실패:', error);
    return NextResponse.json(
      { error: '레터 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
} 