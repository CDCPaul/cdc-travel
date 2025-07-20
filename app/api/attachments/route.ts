import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';

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
    
    // 검색 파라미터 가져오기
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || ''; // posters, itineraries, letters

    type AttachmentItem = {
      id: string;
      type: 'poster' | 'itinerary' | 'letter';
      name: string;
      fileName: string;
      fileSize: number;
      fileUrl: string;
      createdAt: { seconds: number; nanoseconds: number } | null;
      createdBy: string;
      updatedAt?: { seconds: number; nanoseconds: number } | null;
      updatedBy?: string;
    };

    const allAttachments: AttachmentItem[] = [];

    // 전단지 목록
    if (!type || type === 'posters') {
      const postersSnapshot = await db.collection('posters')
        .orderBy('createdAt', 'desc')
        .get();

      const posters = postersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'poster' as const,
          name: data.name || '',
          fileName: data.fileName || '',
          fileSize: data.fileSize || 0,
          fileUrl: data.url || '',
          createdAt: data.createdAt,
          createdBy: data.createdBy || '',
          updatedAt: data.updatedAt,
          updatedBy: data.updatedBy || ''
        };
      });

      // 검색 필터링
      const filteredPosters = search 
        ? posters.filter(poster => 
            (poster.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
            (poster.fileName?.toLowerCase() || '').includes(search.toLowerCase())
          )
        : posters;

      allAttachments.push(...filteredPosters);
    }

    // IT 목록
    if (!type || type === 'itineraries') {
      const itinerariesSnapshot = await db.collection('itineraries')
        .orderBy('createdAt', 'desc')
        .get();

      const itineraries = itinerariesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'itinerary' as const,
          name: data.name || '',
          fileName: data.fileName || '',
          fileSize: data.fileSize || 0,
          fileUrl: data.url || '',
          createdAt: data.createdAt,
          createdBy: data.createdBy || '',
          updatedAt: data.updatedAt,
          updatedBy: data.updatedBy || ''
        };
      });

      // 검색 필터링
      const filteredItineraries = search 
        ? itineraries.filter(itinerary => 
            (itinerary.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
            (itinerary.fileName?.toLowerCase() || '').includes(search.toLowerCase())
          )
        : itineraries;

      allAttachments.push(...filteredItineraries);
    }

    // 레터 목록
    if (!type || type === 'letters') {
      const lettersSnapshot = await db.collection('letters')
        .orderBy('createdAt', 'desc')
        .get();

      const letters = lettersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'letter' as const,
          name: data.name || '',
          fileName: data.fileName || '',
          fileSize: data.fileSize || 0,
          fileUrl: data.url || '',
          createdAt: data.createdAt,
          createdBy: data.createdBy || '',
          updatedAt: data.updatedAt,
          updatedBy: data.updatedBy || ''
        };
      });

      // 검색 필터링
      const filteredLetters = search 
        ? letters.filter(letter => 
            (letter.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
            (letter.fileName?.toLowerCase() || '').includes(search.toLowerCase())
          )
        : letters;

      allAttachments.push(...filteredLetters);
    }

    // 날짜순으로 정렬
    allAttachments.sort((a: AttachmentItem, b: AttachmentItem) => {
      const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(0);
      const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json(allAttachments);

  } catch (error) {
    console.error('첨부파일 목록 조회 실패:', error);
    console.error('에러 상세:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: '첨부파일 목록 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
} 