import { NextResponse } from 'next/server';
import { verifyIdTokenFromCookies } from '@/lib/auth-server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs } from 'firebase/firestore';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    console.log('여행객 등록 API 호출 시작');
    
    const cookieStore = await cookies();
    const token = cookieStore.get('idToken')?.value;

    if (!token) {
      console.log('인증 토큰 없음');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 사용자 인증 확인
    const user = await verifyIdTokenFromCookies(cookieStore);
    if (!user) {
      console.log('사용자 인증 실패');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('사용자 인증 성공:', user.email);

    const body = await request.json();
    const {
      surname,
      givenNames,
      gender,
      nationality,
      passportNumber,
      passportExpiry,
      email,
      phone,
      passportPhotoUrl
    } = body;

    console.log('받은 데이터:', {
      surname,
      givenNames,
      gender,
      nationality,
      passportNumber,
      passportExpiry,
      email,
      phone,
      hasPhotoUrl: !!passportPhotoUrl
    });

    if (!passportPhotoUrl) {
      console.log('여권사진 URL 없음');
      return NextResponse.json({ error: 'Passport photo URL is required' }, { status: 400 });
    }

    // Firestore에 여행객 정보 저장
    const travelerData = {
      surname,
      givenNames,
      fullName: `${surname} ${givenNames}`.trim(),
      gender,
      nationality,
      passportNumber,
      passportExpiry,
      email,
      phone,
      passportPhotoURL: passportPhotoUrl,
      // 등록자 정보 추가
      createdBy: {
        uid: user.uid,
        email: user.email,
        displayName: user.email
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    console.log('Firestore 저장 시작:', travelerData);

    const docRef = await addDoc(collection(db, 'travelers'), travelerData);

    console.log('Firestore 저장 완료, 문서 ID:', docRef.id);

    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      message: 'Traveler registered successfully' 
    });

  } catch (error) {
    console.error('Error registering traveler:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    // 인증 확인
    const cookieStore = await cookies();
    const user = await verifyIdTokenFromCookies(cookieStore);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Firestore에서 여행객 목록 조회
    const travelersRef = collection(db, 'travelers');
    const q = query(travelersRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const travelers = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ 
      success: true,
      data: { travelers }
    });

  } catch (error) {
    console.error('여행객 목록 조회 실패:', error);
    return NextResponse.json({ error: '여행객 목록 조회에 실패했습니다.' }, { status: 500 });
  }
} 