import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import sharp from 'sharp';

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

    const { id: posterId } = await params;

    // Firebase Admin Firestore 사용
    const db = getAdminDb();
    
    // 전단지 정보 가져오기
    const posterRef = db.collection('posters').doc(posterId);
    const posterDoc = await posterRef.get();

    if (!posterDoc.exists) {
      return NextResponse.json(
        { error: '전단지를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const posterData = posterDoc.data();
    
    // createdAt 처리
    let createdAt;
    if (posterData?.createdAt && typeof posterData.createdAt === 'object') {
      if (posterData.createdAt.toDate) {
        // Firestore Timestamp
        createdAt = posterData.createdAt.toDate();
      } else if (posterData.createdAt.seconds) {
        // Timestamp 객체
        createdAt = new Date(posterData.createdAt.seconds * 1000);
      } else {
        createdAt = posterData.createdAt;
      }
    } else {
      createdAt = posterData?.createdAt;
    }

    const poster = {
      id: posterDoc.id,
      ...posterData,
      createdAt
    };

    return NextResponse.json({
      success: true,
      data: poster
    });

  } catch (error) {
    console.error('전단지 조회 실패:', error);
    return NextResponse.json(
      { error: '전단지를 불러오는데 실패했습니다.' },
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

    const { id: posterId } = await params;
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const file = formData.get('file') as File | null;

    if (!name) {
      return NextResponse.json(
        { error: '전단지 이름은 필수입니다.' },
        { status: 400 }
      );
    }

    // Firebase Admin Firestore 사용
    const db = getAdminDb();
    
    // 기존 전단지 정보 가져오기
    const posterRef = db.collection('posters').doc(posterId);
    const posterDoc = await posterRef.get();

    if (!posterDoc.exists) {
      return NextResponse.json(
        { error: '전단지를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const existingData = posterDoc.data();
    let updateData: {
      name: string;
      updatedAt: Date;
      updatedBy: string;
      url?: string;
      size?: number;
      originalSize?: number;
      originalName?: string;
    } = {
      name,
      updatedAt: new Date(),
      updatedBy: decodedToken.email || decodedToken.uid || 'unknown'
    };

    // 새 이미지가 업로드된 경우
    if (file) {
      // 파일 타입 검증
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: '이미지 파일만 업로드 가능합니다.' },
          { status: 400 }
        );
      }

      // 파일 크기 검증 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: '파일 크기는 10MB 이하여야 합니다.' },
          { status: 400 }
        );
      }

      // Firebase Storage 사용
      const storage = getStorage(initializeFirebaseAdmin());
      const bucket = storage.bucket();

      // 파일을 WebP로 변환
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Sharp를 사용하여 WebP로 변환
      const webpBuffer = await sharp(buffer)
        .webp({ quality: 85 })
        .toBuffer();

      // 파일명 생성
      const timestamp = Date.now();
      const fileName = `posters/${timestamp}_${name.replace(/[^a-zA-Z0-9]/g, '_')}.webp`;
      const fileRef = bucket.file(fileName);

      // Firebase Storage에 업로드
      await fileRef.save(webpBuffer, {
        metadata: { 
          contentType: 'image/webp',
          metadata: {
            originalName: file.name,
            originalSize: file.size.toString()
          }
        }
      });

      // 공개 URL 생성
      await fileRef.makePublic();
      const url = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      // 기존 이미지 삭제 (새 이미지 업로드 성공 후)
      if (existingData?.url) {
        try {
          const urlParts = existingData.url.split('/');
          const oldFileName = urlParts.slice(-2).join('/');
          const oldFileRef = bucket.file(oldFileName);
          await oldFileRef.delete();
        } catch (error) {
          console.error('기존 이미지 삭제 실패:', error);
          // 기존 이미지 삭제 실패해도 계속 진행
        }
      }

      updateData = {
        ...updateData,
        url,
        size: webpBuffer.length,
        originalSize: file.size,
        originalName: file.name
      };
    }

    // Firestore 업데이트
    await posterRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: '전단지가 성공적으로 수정되었습니다.',
      data: {
        id: posterId,
        ...updateData
      }
    });

  } catch (error) {
    console.error('전단지 수정 실패:', error);
    return NextResponse.json(
      { error: '전단지 수정에 실패했습니다.' },
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
    const decodedToken = await auth.verifyIdToken(idToken);

    const { id: posterId } = await params;

    // Firebase Admin Firestore 사용
    const db = getAdminDb();
    
    // 전단지 정보 가져오기
    const posterRef = db.collection('posters').doc(posterId);
    const posterDoc = await posterRef.get();

    if (!posterDoc.exists) {
      return NextResponse.json(
        { error: '전단지를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const posterData = posterDoc.data();
    const imageUrl = posterData?.url;

    // Firebase Storage에서 이미지 삭제
    if (imageUrl) {
      try {
        const storage = getStorage(initializeFirebaseAdmin());
        const bucket = storage.bucket();
        
        // URL에서 파일 경로 추출
        const urlParts = imageUrl.split('/');
        const fileName = urlParts.slice(-2).join('/'); // posters/filename.webp
        
        const fileRef = bucket.file(fileName);
        await fileRef.delete();
      } catch (error) {
        console.error('Storage 파일 삭제 실패:', error);
        // Storage 삭제 실패해도 Firestore는 삭제 진행
      }
    }

    // 삭제 정보를 기록하고 Firestore에서 전단지 삭제
    await posterRef.set({
      deletedAt: new Date(),
      deletedBy: decodedToken.uid
    }, { merge: true });
    
    // 실제 문서 삭제
    await posterRef.delete();

    return NextResponse.json({
      success: true,
      message: '전단지가 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('전단지 삭제 실패:', error);
    return NextResponse.json(
      { error: '전단지 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
} 