import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import sharp from 'sharp';

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
    
    // 전단지 목록 가져오기
    const postersRef = db.collection('posters');
    const querySnapshot = await postersRef.orderBy('createdAt', 'desc').get();

    const posters = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      
      let createdAt;
      if (data.createdAt && typeof data.createdAt === 'object') {
        if (data.createdAt.toDate) {
          // Firestore Timestamp
          createdAt = data.createdAt.toDate();
        } else if (data.createdAt.seconds) {
          // Timestamp 객체
          createdAt = new Date(data.createdAt.seconds * 1000);
        } else {
          createdAt = data.createdAt;
        }
      } else {
        createdAt = data.createdAt;
      }
      
      // updatedAt 처리
      let updatedAt;
      console.log('Firestore updatedAt 데이터:', data.updatedAt);
      console.log('updatedAt 타입:', typeof data.updatedAt);
      
      if (data.updatedAt && typeof data.updatedAt === 'object') {
        if (data.updatedAt.toDate) {
          // Firestore Timestamp
          updatedAt = data.updatedAt.toDate();
        } else if (data.updatedAt.seconds) {
          // Timestamp 객체
          updatedAt = new Date(data.updatedAt.seconds * 1000);
        } else {
          updatedAt = data.updatedAt;
        }
      } else {
        updatedAt = data.updatedAt;
      }
      
      console.log('처리된 updatedAt:', updatedAt);
      
      return {
        id: doc.id,
        ...data,
        createdAt,
        updatedAt
      };
    }) as Array<{
      id: string;
      name: string;
      url: string;
      size: number;
      createdAt: Date | { seconds: number; nanoseconds: number };
      createdBy?: string;
      updatedAt?: Date | { seconds: number; nanoseconds: number };
      updatedBy?: string;
      [key: string]: unknown;
    }>;

    return NextResponse.json({
      success: true,
      data: posters
    });

  } catch (error) {
    console.error('전단지 목록 조회 실패:', error);
    return NextResponse.json(
      { error: '전단지 목록을 불러오는데 실패했습니다.' },
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
    const file = formData.get('file') as File;

    if (!name || !file) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

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

    // Firestore에 전단지 정보 저장
    const db = getAdminDb();
    const posterData = {
      name,
      url,
      size: webpBuffer.length,
      originalSize: file.size,
      originalName: file.name,
      createdAt: new Date(),
      createdBy: decodedToken.email
    };

    const docRef = await db.collection('posters').add(posterData);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: '전단지가 성공적으로 저장되었습니다.',
      data: {
        id: docRef.id,
        ...posterData
      }
    });

  } catch (error) {
    console.error('전단지 저장 실패:', error);
    return NextResponse.json(
      { error: '전단지 저장에 실패했습니다.' },
      { status: 500 }
    );
  }
} 