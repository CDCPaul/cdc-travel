import { NextRequest, NextResponse } from 'next/server';
import { verifyIdTokenFromCookies } from '@/lib/auth-server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Booking } from '@/types/booking';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';

// Firestore Timestamp를 Date로 변환하는 안전한 함수
const convertTimestampToDate = (timestamp: FirebaseFirestore.Timestamp | Date | null | undefined): Date | null => {
  if (!timestamp) return null;
  
  // 이미 Date 객체인 경우
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  // Firestore Timestamp인 경우
  if (timestamp && typeof timestamp.toDate === 'function') {
    try {
      return timestamp.toDate();
    } catch (error) {
      console.error('Firestore Timestamp 변환 실패:', error);
      return null;
    }
  }
  
  // 문자열인 경우 Date로 파싱
  if (typeof timestamp === 'string') {
    try {
      const parsed = new Date(timestamp);
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch (error) {
      console.error('문자열 날짜 파싱 실패:', error);
      return null;
    }
  }
  
  // 숫자인 경우 (timestamp)
  if (typeof timestamp === 'number') {
    try {
      return new Date(timestamp);
    } catch (error) {
      console.error('숫자 timestamp 변환 실패:', error);
      return null;
    }
  }
  
  // 객체인 경우 (seconds, nanoseconds)
  if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
    try {
      return new Date(timestamp.seconds * 1000);
    } catch (error) {
      console.error('Timestamp 객체 변환 실패:', error);
      return null;
    }
  }
  
  return null;
};

// 사용자 정보를 가져오는 함수
const getUserName = async (uid: string) => {
  if (!uid || uid === 'Unknown') return 'Unknown';
  
  // UID가 이메일 형태인 경우 이메일에서 이름 추출
  if (uid.includes('@')) {
    return uid.split('@')[0];
  }
  
  try {
    const auth = getAuth(initializeFirebaseAdmin());
    const userRecord = await auth.getUser(uid);
    return userRecord.displayName || userRecord.email?.split('@')[0] || uid;
  } catch {
    // 사용자 정보를 찾을 수 없는 경우 UID를 그대로 반환하되, 
    // 너무 긴 UID인 경우 축약해서 반환
    if (uid.length > 20) {
      return `${uid.substring(0, 8)}...`;
    }
    return uid;
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log('GET /api/bookings/[id] 호출됨:', resolvedParams.id);
    console.log('요청 쿠키:', request.cookies.getAll());
    
    // 인증 확인
    const authResult = await verifyIdTokenFromCookies(request.cookies);
    if (!authResult) {
      console.error('인증 실패: 토큰이 없거나 유효하지 않음');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('인증 성공:', authResult.email);

    // Firestore에서 예약 데이터 조회
    const bookingDoc = await getDoc(doc(db, 'bookings', resolvedParams.id));
    
    if (!bookingDoc.exists()) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const data = bookingDoc.data();
    
    // 사용자 정보 조회
    const receivedByName = data.receivedBy ? await getUserName(data.receivedBy) : 'Unknown';
    const confirmedByName = data.confirmedBy ? await getUserName(data.confirmedBy) : null;
    const updatedByName = data.updatedBy ? await getUserName(data.updatedBy) : null;

    // 예약 데이터 구성
    const booking = {
      id: bookingDoc.id,
      ...data,
      receivedBy: receivedByName,
      confirmedBy: confirmedByName || undefined,
      updatedBy: updatedByName || data.updatedBy || data.receivedBy, // 기본값 제공
      tourStartDate: convertTimestampToDate(data.tourStartDate),
      tourEndDate: convertTimestampToDate(data.tourEndDate),
      receivedAt: convertTimestampToDate(data.receivedAt),
      confirmedAt: convertTimestampToDate(data.confirmedAt),
      paymentDate: convertTimestampToDate(data.paymentDate),
      deadline: convertTimestampToDate(data.deadline),
      actualDeadline: convertTimestampToDate(data.actualDeadline),
      createdAt: convertTimestampToDate(data.createdAt),
      updatedAt: convertTimestampToDate(data.updatedAt),
      customers: data.customers || []
    } as Booking;

    return NextResponse.json(booking);

  } catch (error) {
    console.error('예약 조회 실패:', error);
    console.error('에러 상세 정보:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log('PUT /api/bookings/[id] 호출됨:', resolvedParams.id);
    
    // 인증 확인
    const authResult = await verifyIdTokenFromCookies(request.cookies);
    if (!authResult) {
      console.error('인증 실패: 토큰이 없거나 유효하지 않음');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('인증 성공:', authResult.email);

    const body = await request.json();
    const updateData = {
      ...body,
      updatedAt: new Date(),
      updatedBy: authResult.uid
    };

    // Firestore에서 예약 업데이트
    await updateDoc(doc(db, 'bookings', resolvedParams.id), updateData);

    return NextResponse.json({ success: true });

  } catch {
    console.error('예약 수정 실패');
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log('DELETE /api/bookings/[id] 호출됨:', resolvedParams.id);
    
    // 인증 확인
    const authResult = await verifyIdTokenFromCookies(request.cookies);
    if (!authResult) {
      console.error('인증 실패: 토큰이 없거나 유효하지 않음');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('인증 성공:', authResult.email);

    // Firestore에서 예약 삭제
    await deleteDoc(doc(db, 'bookings', resolvedParams.id));

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('예약 삭제 실패:', error);
    return NextResponse.json(
      { error: 'Failed to delete booking' },
      { status: 500 }
    );
  }
} 