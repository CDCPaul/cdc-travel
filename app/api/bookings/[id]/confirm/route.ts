import { NextRequest, NextResponse } from 'next/server';
import { verifyIdTokenFromCookies } from '@/lib/auth-server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 인증 확인
    const decodedToken = await verifyIdTokenFromCookies(request.cookies);
    if (!decodedToken) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const bookingId = id;

    // 예약 문서 가져오기
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingDoc = await getDoc(bookingRef);

    if (!bookingDoc.exists()) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    const bookingData = bookingDoc.data();

    // 이미 확정된 예약인지 확인
    if (bookingData.status === 'confirmed') {
      return NextResponse.json({ success: false, error: 'Booking is already confirmed' }, { status: 400 });
    }

    // 예약 상태를 확정으로 변경
    await updateDoc(bookingRef, {
      status: 'confirmed',
      confirmedAt: new Date(),
      confirmedBy: decodedToken.email,
      updatedAt: new Date()
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Booking confirmed successfully' 
    });

  } catch (error) {
    console.error('Error confirming booking:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 