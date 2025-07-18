import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    // Firebase Admin Firestore 사용
    const db = getAdminDb();
    
    // TA 목록 가져오기
    const tasRef = db.collection('tas');
    const querySnapshot = await tasRef.orderBy('createdAt', 'desc').get();

    const tas = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      data: tas
    });

  } catch (error) {
    console.error('TA 목록 조회 실패:', error);
    return NextResponse.json(
      { error: 'TA 목록 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, taCode, phone, address, email, logo, contactPersons } = body;

    // 필수 필드 검증
    if (!companyName || !taCode || !phone || !address || !email) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400}
      );
    }

    // Firebase Admin Firestore 사용
    const db = getAdminDb();
    
    // TA 데이터 생성
    const taData = {
      companyName,
      taCode,
      phone,
      address,
      email,
      logo: logo || "",
      contactPersons: contactPersons || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Firestore에 저장
    const docRef = await db.collection('tas').add(taData);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: 'TA가 성공적으로 등록되었습니다.'
    });

  } catch (error) {
    console.error('TA 저장 실패:', error);
    return NextResponse.json(
      { error: 'TA 저장에 실패했습니다.' },
      { status: 500 }
    );
  }
} 