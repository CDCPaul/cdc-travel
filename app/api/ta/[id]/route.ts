import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Firebase Admin Firestore 사용
    const db = getAdminDb();
    
    // TA 데이터 가져오기
    const taRef = db.collection('tas').doc(id);
    const taDoc = await taRef.get();

    if (!taDoc.exists) {
      return NextResponse.json(
        { error: 'TA를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const taData = {
      id: taDoc.id,
      ...taDoc.data()
    };

    return NextResponse.json({
      success: true,
      data: taData
    });

  } catch (error) {
    console.error('TA 조회 실패:', error);
    return NextResponse.json(
      { error: 'TA 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { companyName, taCode, phone, address, email, logo, contactPersons } = body;

    // 필수 필드 검증
    if (!companyName || !taCode || !phone || !address || !email) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // Firebase Admin Firestore 사용
    const db = getAdminDb();
    
    // TA 데이터 업데이트
    const taRef = db.collection('tas').doc(id);
    const taDoc = await taRef.get();

    if (!taDoc.exists) {
      return NextResponse.json(
        { error: 'TA를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const updateData = {
      companyName,
      taCode,
      phone,
      address,
      email,
      logo: logo || "",
      contactPersons: contactPersons || [],
      updatedAt: new Date()
    };

    await taRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: 'TA가 성공적으로 수정되었습니다.'
    });

  } catch (error) {
    console.error('TA 수정 실패:', error);
    return NextResponse.json(
      { error: 'TA 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Firebase Admin Firestore 사용
    const db = getAdminDb();
    
    // TA 데이터 가져오기 (로고 파일 삭제를 위해)
    const taRef = db.collection('tas').doc(id);
    const taDoc = await taRef.get();

    if (!taDoc.exists) {
      return NextResponse.json(
        { error: 'TA를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const taData = taDoc.data();
    
    // 로고 파일이 있으면 Firebase Storage에서 삭제
    if (taData && taData.logo && taData.logo.startsWith('https://storage.googleapis.com/')) {
      try {
        const storage = getStorage(initializeFirebaseAdmin());
        const bucket = storage.bucket();
        
        // URL에서 파일 경로 추출 (쿼리 파라미터 제거)
        const logoUrl = new URL(taData.logo);
        const pathParts = logoUrl.pathname.split('/');
        const fileName = pathParts.slice(2).join('/'); // /bucket-name/file-path 부분에서 bucket-name 제거
        
        console.log(`로고 파일 삭제 시도: ${fileName}`);
        
        const file = bucket.file(fileName);
        await file.delete();
        console.log(`로고 파일 삭제 완료: ${fileName}`);
      } catch (storageError) {
        console.error('로고 파일 삭제 실패:', storageError);
        // 스토리지 삭제 실패해도 Firestore 삭제는 계속 진행
      }
    }

    // Firestore에서 TA 문서 삭제
    await taRef.delete();

    return NextResponse.json({
      success: true,
      message: 'TA가 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('TA 삭제 실패:', error);
    return NextResponse.json(
      { error: 'TA 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
} 