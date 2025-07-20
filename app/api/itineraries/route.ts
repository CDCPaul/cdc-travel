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
    
    // IT 목록 가져오기
    const itinerariesRef = db.collection('itineraries');
    const querySnapshot = await itinerariesRef.orderBy('createdAt', 'desc').get();

    const itineraries = querySnapshot.docs.map((doc) => {
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
      data: itineraries
    });

  } catch (error) {
    console.error('IT 목록 조회 실패:', error);
    return NextResponse.json(
      { error: 'IT 목록을 불러오는데 실패했습니다.' },
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

    // 파일 타입 검증 (PDF만 허용)
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

    // Firebase Storage 사용
    const storage = getStorage(initializeFirebaseAdmin());
    const bucket = storage.bucket();

    // 파일을 Buffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 파일명 생성
    const timestamp = Date.now();
    const fileName = `itineraries/${timestamp}_${name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    const fileRef = bucket.file(fileName);

    // Firebase Storage에 업로드
    await fileRef.save(buffer, {
      metadata: { 
        contentType: 'application/pdf',
        metadata: {
          originalName: file.name,
          originalSize: file.size.toString()
        }
      }
    });

    // 공개 URL 생성
    await fileRef.makePublic();
    const url = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Firestore에 IT 정보 저장
    const db = getAdminDb();
    const itineraryData = {
      name,
      url,
      size: buffer.length,
      originalSize: file.size,
      originalName: file.name,
      createdAt: new Date(),
      createdBy: decodedToken.email
    };

    const docRef = await db.collection('itineraries').add(itineraryData);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: 'IT가 성공적으로 저장되었습니다.',
      data: {
        id: docRef.id,
        ...itineraryData
      }
    });

  } catch (error) {
    console.error('IT 저장 실패:', error);
    return NextResponse.json(
      { error: 'IT 저장에 실패했습니다.' },
      { status: 500 }
    );
  }
} 