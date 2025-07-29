import { NextRequest, NextResponse } from 'next/server';
import { verifyIdTokenFromCookies } from '@/lib/auth-server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Booking, BookingStatus, PaymentStatus } from '@/types/booking';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { getAllBookingsFromAllDepartments, addBookingToDepartment, getDepartmentFromPart, DEPARTMENT_COLLECTIONS } from '@/lib/booking-utils';



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

    // 모든 부서의 부킹 조회
    const allBookings = await getAllBookingsFromAllDepartments();
    
    // 필터 적용 (클라이언트 사이드)
    let filteredBookings = allBookings;
    
    if (status) {
      filteredBookings = filteredBookings.filter(booking => booking.status === status);
    }
    if (bookingType) {
      filteredBookings = filteredBookings.filter(booking => booking.bookingType === bookingType);
    }
    if (agentCode) {
      filteredBookings = filteredBookings.filter(booking => booking.agentCode === agentCode);
    }
    if (region) {
      filteredBookings = filteredBookings.filter(booking => booking.region === region);
    }

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
      allBookings.map(async (booking) => {
        // receivedBy가 유효한 값인지 확인
        let receivedByName = 'Unknown';
        if (booking.receivedBy && typeof booking.receivedBy === 'string' && booking.receivedBy.trim() !== '') {
          receivedByName = await getUserName(booking.receivedBy);
        }
        
        return {
          ...booking,
          receivedBy: receivedByName, // UID를 이름으로 변경
        } as Booking;
      })
    );

    // 검색어 필터링 (클라이언트 사이드)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredBookings = filteredBookings.filter(booking => 
        booking.bookingNumber.toLowerCase().includes(term) ||
        booking.agentCode.toLowerCase().includes(term) ||
        booking.agentName.toLowerCase().includes(term) ||
        booking.customers.some(customer => 
          customer.firstName?.toLowerCase().includes(term) ||
          customer.lastName?.toLowerCase().includes(term) ||
          customer.passportNumber?.toLowerCase().includes(term)
        )
      );
    }

    // 통계 계산
    const stats = {
      total: bookingsWithUserNames.length,
      new: bookingsWithUserNames.filter((b: Booking) => b.status === 'new').length,
      confirmed: bookingsWithUserNames.filter((b: Booking) => b.status === 'confirmed').length,
      completed: bookingsWithUserNames.filter((b: Booking) => b.status === 'completed').length,
      cancelled: bookingsWithUserNames.filter((b: Booking) => b.status === 'cancelled').length,
      revenue: bookingsWithUserNames.reduce((sum: number, b: Booking) => sum + b.sellingPrice, 0),
      pendingPayments: bookingsWithUserNames.filter((b: Booking) => b.paymentStatus === 'pending').length
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
      part, // 파트 정보 추가
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

    // 파트별 예약번호 생성 (AIR-YYYYMMDD-001 또는 CINT-YYYYMMDD-001 형식)
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // 부서 결정
    const department = getDepartmentFromPart(part);
    
    // 해당 부서의 오늘 날짜 예약 개수 조회
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const todayBookingsQuery = query(
      collection(db, 'bookings', DEPARTMENT_COLLECTIONS[department]),
      where('createdAt', '>=', startOfDay),
      where('createdAt', '<', endOfDay)
    );
    
    const todayBookingsSnapshot = await getDocs(todayBookingsQuery);
    const todayCount = todayBookingsSnapshot.size + 1;
    
    // 부서별 예약번호 생성
    const bookingNumber = `${part}-${dateStr}-${todayCount.toString().padStart(3, '0')}`;

    // 새 예약 데이터
    const newBooking = {
      part, // 파트 정보 추가
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
      airIncluded: false, // 기본값 추가
      airlineIncluded: false, // 기본값 추가
      adults,
      children,
      infants,
      totalPax: adults + children + infants,
      foc: 0, // 기본값 추가
      costPrice,
      markup,
      sellingPrice,
      totalPayment: 0,
      deposit: 0,
      balance: sellingPrice,
      paymentMethod: '',
      paymentStatus: 'pending' as PaymentStatus,
      customers: customers.map((customer: { firstName: string; lastName: string; gender: string; nationality: string; passportNumber: string; passportExpiry: string }, index: number) => ({
        id: `customer-${index}`,
        ...customer
      })),
      remarks,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: authResult.uid,
      updatedBy: authResult.uid
    };

    // 부서별 컬렉션에 저장
    const docRef = await addBookingToDepartment(newBooking, department);

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