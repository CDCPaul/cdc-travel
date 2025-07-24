import { NextRequest, NextResponse } from 'next/server';
import { verifyIdTokenFromCookies } from '@/lib/auth-server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Booking } from '@/types/booking';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log('GET /api/bookings/confirmed/[id] 호출됨:', resolvedParams.id);
    
    // 인증 확인
    const authResult = await verifyIdTokenFromCookies(request.cookies);
    if (!authResult) {
      console.error('인증 실패: 토큰이 없거나 유효하지 않음');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const bookingId = resolvedParams.id;
    
    // 예약 문서 가져오기
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingDoc = await getDoc(bookingRef);
    
    if (!bookingDoc.exists()) {
      console.error('예약을 찾을 수 없음:', bookingId);
      return NextResponse.json({ 
        success: false, 
        error: 'Booking not found' 
      }, { status: 404 });
    }
    
    const bookingData = bookingDoc.data();
    
    // 확정된 예약인지 확인
    if (bookingData.status !== 'confirmed') {
      console.error('확정되지 않은 예약:', bookingId, '상태:', bookingData.status);
      return NextResponse.json({ 
        success: false, 
        error: 'Booking is not confirmed' 
      }, { status: 400 });
    }
    
    // 날짜 필드들을 Date 객체로 변환
    const booking: Booking = {
      id: bookingDoc.id,
      ...bookingData,
      tourStartDate: convertTimestampToDate(bookingData.tourStartDate),
      tourEndDate: convertTimestampToDate(bookingData.tourEndDate),
      receivedAt: convertTimestampToDate(bookingData.receivedAt),
      paymentDate: convertTimestampToDate(bookingData.paymentDate),
      confirmedAt: convertTimestampToDate(bookingData.confirmedAt),
      createdAt: convertTimestampToDate(bookingData.createdAt),
      updatedAt: convertTimestampToDate(bookingData.updatedAt),
    } as Booking;
    
    console.log('확정 예약 정보 반환:', booking.id);
    
    return NextResponse.json({ 
      success: true, 
      booking 
    });
    
  } catch (error) {
    console.error('확정 예약 정보 가져오기 실패:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
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
    console.log('PUT /api/bookings/confirmed/[id] 호출됨:', resolvedParams.id);
    
    // 인증 확인
    const authResult = await verifyIdTokenFromCookies(request.cookies);
    if (!authResult) {
      console.error('인증 실패: 토큰이 없거나 유효하지 않음');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const bookingId = resolvedParams.id;
    const updateData = await request.json();
    
    // 예약 문서 가져오기
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingDoc = await getDoc(bookingRef);
    
    if (!bookingDoc.exists()) {
      console.error('예약을 찾을 수 없음:', bookingId);
      return NextResponse.json({ 
        success: false, 
        error: 'Booking not found' 
      }, { status: 404 });
    }
    
    const bookingData = bookingDoc.data();
    
    // 확정된 예약인지 확인
    if (bookingData.status !== 'confirmed') {
      console.error('확정되지 않은 예약:', bookingId, '상태:', bookingData.status);
      return NextResponse.json({ 
        success: false, 
        error: 'Booking is not confirmed' 
      }, { status: 400 });
    }
    
    // 업데이트할 데이터 준비
    const updateFields = {
      ...updateData,
      updatedAt: new Date()
    };
    
    // 예약 업데이트
    await updateDoc(bookingRef, updateFields);
    
    console.log('확정 예약 업데이트 완료:', bookingId);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Confirmed booking updated successfully' 
    });
    
  } catch (error) {
    console.error('확정 예약 업데이트 실패:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 