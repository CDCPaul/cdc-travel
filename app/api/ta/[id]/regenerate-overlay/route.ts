import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
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

// TA 정보와 로고를 합성한 오버레이 이미지 생성 함수
async function createTAOverlayImage(ta: {
  companyName: string;
  phone: string;
  email: string;
  logo?: string;
}): Promise<Buffer> {
  const width = 2480;
  const height = 250;
  
  console.log('TA 오버레이 이미지 재생성 시작:', ta.companyName);
  
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
  
  // 텍스트 이미지 생성 (Sharp의 텍스트 렌더링 사용)
  const textImage = await sharp({
    create: {
      width: width,
      height: height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    }
  })
  .composite([
    {
      input: Buffer.from(`<svg width="${width}" height="${height}">
        <text x="${width - 100}" y="100" font-family="Arial, Helvetica, sans-serif" font-size="90" font-weight="bold" 
              fill="#333333" text-anchor="end">${escapeHtml(ta.companyName)}</text>
        <text x="${width - 100}" y="160" font-family="Arial, Helvetica, sans-serif" font-size="40" 
              fill="#666666" text-anchor="end">📞 ${escapeHtml(ta.phone)}</text>
        <text x="${width - 100}" y="220" font-family="Arial, Helvetica, sans-serif" font-size="40" 
              fill="#666666" text-anchor="end">✉️ ${escapeHtml(ta.email)}</text>
      </svg>`),
      top: 0,
      left: 0
    }
  ])
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
  
  console.log('TA 오버레이 이미지 재생성 완료, 크기:', finalImage.length);
  return finalImage;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Firebase Admin SDK를 사용하여 토큰 검증
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
    const { companyName, phone, email, logo } = body;

    // 필수 필드 검증
    if (!companyName || !phone || !email) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

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

    // TA 오버레이 이미지 생성 및 저장
    let overlayImageUrl = "";
    try {
      console.log('TA 오버레이 이미지 재생성 시작:', companyName);
      
      const overlayBuffer = await createTAOverlayImage({
        companyName,
        phone,
        email,
        logo
      });
      
      // Firebase Storage에 오버레이 이미지 저장
      const { getStorage } = await import('firebase-admin/storage');
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
      
      console.log('TA 오버레이 이미지 재생성 완료:', overlayImageUrl);
    } catch (overlayError) {
      console.error('TA 오버레이 이미지 재생성 실패:', overlayError);
      return NextResponse.json(
        { error: '오버레이 이미지 재생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // Firestore에서 오버레이 이미지 URL 업데이트
    await taRef.update({
      overlayImage: overlayImageUrl,
      updatedAt: new Date(),
      updatedBy: decodedToken.uid
    });

    return NextResponse.json({
      success: true,
      message: '오버레이 이미지가 성공적으로 재생성되었습니다.',
      overlayImageUrl
    });

  } catch (error) {
    console.error('오버레이 재생성 실패:', error);
    return NextResponse.json(
      { error: '오버레이 재생성에 실패했습니다.' },
      { status: 500 }
    );
  }
} 