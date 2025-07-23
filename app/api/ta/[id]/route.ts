import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import sharp from 'sharp';

// HTML 엔티티 이스케이프 함수
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

// TA 정보와 로고를 합성한 오버레이 이미지 생성 함수
async function createTAOverlayImage(ta: {
  companyName: string;
  phone: string;
  email: string;
  logo?: string;
}): Promise<Buffer> {
  const width = 2480;
  const height = 250;
  
  console.log('TA 오버레이 이미지 생성 시작:', ta.companyName);
  
  // 기본 흰색 배경 생성
  const baseImage = sharp({
    create: {
      width: width,
      height: height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  });
  
  const composites: sharp.OverlayOptions[] = [];
  
  // 로고 처리 (왼쪽 정렬)
  if (ta.logo && ta.logo.startsWith('https://')) {
    try {
      console.log('로고 다운로드 중:', ta.logo);
      
      // 로고 다운로드 및 리사이즈
      const logoResponse = await fetch(ta.logo);
      const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());
      
      const resizedLogo = await sharp(logoBuffer)
        .resize(null, 250, { 
          fit: 'inside',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toBuffer();
      
      // 로고를 왼쪽에 배치 (여백 50px)
      composites.push({
        input: resizedLogo,
        top: 0, // 상단 정렬 (250px 높이에 맞춤)
        left: 50
      });
      
      console.log('로고 처리 완료');
    } catch (error) {
      console.error('로고 처리 실패:', error);
    }
  }
  
  // TA 정보 텍스트 생성 (오른쪽 정렬)
  const textSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
      </defs>
      
      <!-- 회사명 (오른쪽 정렬) -->
      <text x="${width - 100}" y="100" font-family="Arial, sans-serif" font-size="120" font-weight="bold" 
            fill="#333333" filter="url(#shadow)" text-anchor="end">
        ${escapeHtml(ta.companyName)}
      </text>
      
      <!-- 전화번호 (오른쪽 정렬) -->
      <text x="${width - 100}" y="160" font-family="Arial, sans-serif" font-size="40" 
            fill="#666666" filter="url(#shadow)" text-anchor="end">
        📞 ${escapeHtml(ta.phone)}
      </text>
      
      <!-- 이메일 (오른쪽 정렬) -->
      <text x="${width - 100}" y="220" font-family="Arial, sans-serif" font-size="40" 
            fill="#666666" filter="url(#shadow)" text-anchor="end">
        ✉️ ${escapeHtml(ta.email)}
      </text>
    </svg>
  `;
  
  const textBuffer = Buffer.from(textSvg);
  const textImage = await sharp(textBuffer)
    .png()
    .toBuffer();
  
  composites.push({
    input: textImage,
    top: 0,
    left: 0
  });
  
  console.log('TA 정보 텍스트 생성 완료');
  
  // 모든 요소를 합성
  const finalImage = await baseImage
    .composite(composites)
    .png()
    .toBuffer();
  
  console.log('TA 오버레이 이미지 생성 완료, 크기:', finalImage.length);
  return finalImage;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Firebase Admin SDK를 사용하여 토큰 검증
    const { getAuth } = await import('firebase-admin/auth');
    const { initializeFirebaseAdmin } = await import('@/lib/firebase-admin');
    
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
    const decodedToken = await auth.verifyIdToken(idToken);

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

    // 기존 오버레이 이미지 삭제 (새로 생성할 예정)
    const existingData = taDoc.data();
    if (existingData?.overlayImage && existingData.overlayImage.startsWith('https://storage.googleapis.com/')) {
      try {
        const storage = getStorage();
        const bucket = storage.bucket();
        
        const overlayUrl = new URL(existingData.overlayImage);
        const pathParts = overlayUrl.pathname.split('/');
        const fileName = pathParts.slice(2).join('/');
        
        console.log(`기존 오버레이 이미지 삭제 시도: ${fileName}`);
        
        const file = bucket.file(fileName);
        await file.delete();
        console.log(`기존 오버레이 이미지 삭제 완료: ${fileName}`);
      } catch (storageError) {
        console.error('기존 오버레이 이미지 삭제 실패:', storageError);
      }
    }

    // TA 오버레이 이미지 생성 및 저장
    let overlayImageUrl = "";
    if (logo) {
      try {
        console.log('TA 오버레이 이미지 생성 시작:', companyName);
        
        const overlayBuffer = await createTAOverlayImage({
          companyName,
          phone,
          email,
          logo
        });
        
        // Firebase Storage에 오버레이 이미지 저장
        const storage = getStorage();
        const bucket = storage.bucket();
        
        const overlayFileName = `ta-overlays/${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
        const overlayFile = bucket.file(overlayFileName);
        
        await overlayFile.save(overlayBuffer, {
          metadata: {
            contentType: 'image/png',
            cacheControl: 'public, max-age=31536000'
          }
        });
        
        // 공개 URL 생성
        await overlayFile.makePublic();
        overlayImageUrl = `https://storage.googleapis.com/${bucket.name}/${overlayFileName}`;
        
        console.log('TA 오버레이 이미지 저장 완료:', overlayImageUrl);
      } catch (overlayError) {
        console.error('TA 오버레이 이미지 생성 실패:', overlayError);
        // 오버레이 생성 실패해도 TA 수정은 계속 진행
      }
    }

    const updateData = {
      companyName,
      taCode,
      phone,
      address,
      email,
      logo: logo || "",
      overlayImage: overlayImageUrl, // 새로 추가된 필드
      contactPersons: contactPersons || [],
      updatedAt: new Date(),
      updatedBy: decodedToken.uid
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
    // Firebase Admin SDK를 사용하여 토큰 검증
    const { getAuth } = await import('firebase-admin/auth');
    const { initializeFirebaseAdmin } = await import('@/lib/firebase-admin');
    
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
    const decodedToken = await auth.verifyIdToken(idToken);

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
    
    // 로고 파일과 오버레이 이미지가 있으면 Firebase Storage에서 삭제
    if (taData) {
      const storage = getStorage();
      const bucket = storage.bucket();
      
      // 로고 파일 삭제
      if (taData.logo && taData.logo.startsWith('https://storage.googleapis.com/')) {
        try {
          const logoUrl = new URL(taData.logo);
          const pathParts = logoUrl.pathname.split('/');
          const fileName = pathParts.slice(2).join('/');
          
          console.log(`로고 파일 삭제 시도: ${fileName}`);
          
          const file = bucket.file(fileName);
          await file.delete();
          console.log(`로고 파일 삭제 완료: ${fileName}`);
        } catch (storageError) {
          console.error('로고 파일 삭제 실패:', storageError);
        }
      }
      
      // 오버레이 이미지 삭제
      if (taData.overlayImage && taData.overlayImage.startsWith('https://storage.googleapis.com/')) {
        try {
          const overlayUrl = new URL(taData.overlayImage);
          const pathParts = overlayUrl.pathname.split('/');
          const fileName = pathParts.slice(2).join('/');
          
          console.log(`오버레이 이미지 삭제 시도: ${fileName}`);
          
          const file = bucket.file(fileName);
          await file.delete();
          console.log(`오버레이 이미지 삭제 완료: ${fileName}`);
        } catch (storageError) {
          console.error('오버레이 이미지 삭제 실패:', storageError);
        }
      }
    }

    // 삭제 정보를 기록하고 Firestore에서 TA 문서 삭제
    await taRef.set({
      deletedAt: new Date(),
      deletedBy: decodedToken.uid
    }, { merge: true });
    
    // 실제 문서 삭제
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