import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, orderBy, query } from 'firebase/firestore';

export async function GET() {
  try {
    // TA 목록 가져오기
    const tasRef = collection(db, 'tas');
    const q = query(tasRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const tas = querySnapshot.docs.map(doc => ({
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

    // TA 데이터 생성
    const taData = {
      companyName,
      taCode,
      phone,
      address,
      email,
      logo: logo || "",
      contactPersons: contactPersons || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Firestore에 저장
    const docRef = await addDoc(collection(db, 'tas'), taData);

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