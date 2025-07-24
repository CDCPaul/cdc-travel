import { NextRequest, NextResponse } from 'next/server';
import { verifyIdTokenFromCookies } from '@/lib/auth-server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, addDoc } from 'firebase/firestore';
import { Booking, BookingStatus } from '@/types/booking';
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

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/bookings 호출됨');
    console.log('쿠키:', request.cookies.getAll());
    
    // 인증 확인
    const authResult = await verifyIdTokenFromCookies(request.cookies);
    if (!authResult) {
      console.error('인증 실패: 토큰이 없거나 유효하지 않음');
      return NextResponse.json({ error: 'Unauthorized - 토큰이 없거나 유효하지 않습니다.' }, { status: 401 });
    }
    
    console.log('인증 성공:', authResult.email);

    // URL 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const bookingType = searchParams.get('bookingType');
    const agentCode = searchParams.get('agentCode');
    const region = searchParams.get('region');
    const searchTerm = searchParams.get('search');

    // Firestore 쿼리 구성
    let q = query(collection(db, 'bookings'));

    // 필터 적용
    if (status) {
      q = query(q, where('status', '==', status));
    }
    if (bookingType) {
      q = query(q, where('bookingType', '==', bookingType));
    }
    if (agentCode) {
      q = query(q, where('agentCode', '==', agentCode));
    }
    if (region) {
      q = query(q, where('region', '==', region));
    }

    // 정렬 추가 (인덱스 사용)
    q = query(q, orderBy('createdAt', 'desc'));

    const querySnapshot = await getDocs(q);

    // 사용자 정보를 가져오기 위한 함수
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

    // 예약 데이터와 사용자 정보를 함께 처리
    const bookingsWithUserNames = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        // receivedBy가 유효한 값인지 확인
        let receivedByName = 'Unknown';
        if (data.receivedBy && typeof data.receivedBy === 'string' && data.receivedBy.trim() !== '') {
          receivedByName = await getUserName(data.receivedBy);
        }
        
        return {
          id: doc.id,
          ...data,
          receivedBy: receivedByName, // UID를 이름으로 변경
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
      })
    );

    const bookings = bookingsWithUserNames;

    // 검색어 필터링 (클라이언트 사이드)
    let filteredBookings = bookings;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredBookings = filteredBookings.filter(booking => 
        booking.bookingNumber.toLowerCase().includes(term) ||
        booking.agentCode.toLowerCase().includes(term) ||
        booking.agentName.toLowerCase().includes(term) ||
        booking.customers.some(customer => 
          customer.name.toLowerCase().includes(term)
        )
      );
    }

    // 통계 계산
    const stats = {
      total: bookings.length,
      new: bookings.filter(b => b.status === 'new').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      revenue: bookings.reduce((sum, b) => sum + b.sellingPrice, 0),
      pendingPayments: bookings.filter(b => b.paymentStatus === 'pending').length
    };

    return NextResponse.json({
      success: true,
      bookings: filteredBookings,
      stats
    });

  } catch (error) {
    console.error('예약 목록 조회 실패:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/bookings 호출됨');
    console.log('쿠키:', request.cookies.getAll());
    
    // 인증 확인
    const authResult = await verifyIdTokenFromCookies(request.cookies);
    if (!authResult) {
      console.error('인증 실패: 토큰이 없거나 유효하지 않음');
      return NextResponse.json({ error: 'Unauthorized - 토큰이 없거나 유효하지 않습니다.' }, { status: 401 });
    }
    
    console.log('인증 성공:', authResult.email);

    const body = await request.json();
    const {
      bookingType,
      tourStartDate,
      tourEndDate,
      country,
      region,
      agentCode,
      agentName,
      localLandName,
      localLandCode,
      hotelName,
      airline,
      airlineRoute1,
      airlineRoute2,
      roomType,
      roomCount,
      adults,
      children,
      infants,
      costPrice,
      markup,
      sellingPrice,
      customers,
      remarks
    } = body;

    // 예약번호 생성 (BK-YYYYMMDD-001 형식)
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // 오늘 날짜의 예약 개수 조회
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const todayBookingsQuery = query(
      collection(db, 'bookings'),
      where('createdAt', '>=', startOfDay),
      where('createdAt', '<', endOfDay)
    );
    
    const todayBookingsSnapshot = await getDocs(todayBookingsQuery);
    const todayCount = todayBookingsSnapshot.size + 1;
    
    const bookingNumber = `BK-${dateStr}-${todayCount.toString().padStart(3, '0')}`;

    // 새 예약 데이터
    const newBooking = {
      bookingNumber,
      status: 'new' as BookingStatus,
      bookingType,
      tourStartDate: new Date(tourStartDate),
      tourEndDate: new Date(tourEndDate),
      country,
      region,
      receivedBy: authResult.uid,
      receivedAt: new Date(),
      agentCode,
      agentName,
      localLandName,
      localLandCode,
      hotelName,
      airline,
      airlineRoute1,
      airlineRoute2,
      roomType,
      roomCount,
      adults,
      children,
      infants,
      totalPax: adults + children + infants,
      costPrice,
      markup,
      sellingPrice,
      totalPayment: 0,
      deposit: 0,
      balance: sellingPrice,
      paymentMethod: '',
      paymentStatus: 'pending' as BookingStatus,
      customers: customers.map((customer: { name: string; contact: string; passport?: string; specialRequests?: string }, index: number) => ({
        id: `customer-${index}`,
        ...customer
      })),
      remarks,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: authResult.uid,
      updatedBy: authResult.uid
    };

    // Firestore에 저장
    const docRef = await addDoc(collection(db, 'bookings'), newBooking);

    return NextResponse.json({
      success: true,
      bookingId: docRef.id,
      bookingNumber
    });

  } catch (error) {
    console.error('예약 생성 실패:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
} 