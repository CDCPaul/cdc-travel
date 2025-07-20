import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { getAdminDb } from '@/lib/firebase-admin';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
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
    await auth.verifyIdToken(idToken);

    const body = await request.json();
    const { attachmentUrl, attachmentType, taId } = body;

    if (!attachmentUrl) {
      return NextResponse.json(
        { error: '첨부파일 URL이 필요합니다.' },
        { status: 400 }
      );
    }

    // 첨부파일 다운로드
    const attachmentResponse = await fetch(attachmentUrl);
    if (!attachmentResponse.ok) {
      return NextResponse.json(
        { error: '첨부파일을 다운로드할 수 없습니다.' },
        { status: 400 }
      );
    }

    const attachmentBuffer = Buffer.from(await attachmentResponse.arrayBuffer());

    // 전단지(이미지)만 미리보기 처리
    if (attachmentType === 'poster') {
      // 원본 이미지 크기 확인
      const image = sharp(attachmentBuffer);
      
      // 미리보기 크기 계산 (620:877 비율 기준)
      const previewWidth = 600;
      const previewHeight = Math.round((previewWidth * 877) / 620); // 약 848px
      
      // TA 정보 가져오기 (taId가 있는 경우)
      let overlayImageUrl = null;
      if (taId) {
        try {
          const db = getAdminDb();
          const taDoc = await db.collection('tas').doc(taId).get();
          if (taDoc.exists) {
            const taData = taDoc.data();
            overlayImageUrl = taData?.overlayImage;
          }
        } catch (error) {
          console.error('TA 정보 가져오기 실패:', error);
        }
      }
      
      // 원본 이미지를 미리보기 크기로 리사이즈
      const resizedImage = await image.resize(previewWidth, previewHeight, { fit: 'inside' });
      let finalImage = resizedImage;
      
      // 전처리된 오버레이 이미지가 있는 경우 처리
      if (overlayImageUrl) {
        try {
          console.log('전처리된 오버레이 이미지 사용:', overlayImageUrl);
          
          // 오버레이 이미지 다운로드
          const overlayResponse = await fetch(overlayImageUrl);
          if (overlayResponse.ok) {
            const overlayBuffer = Buffer.from(await overlayResponse.arrayBuffer());
            
            // 오버레이 이미지를 미리보기 크기에 맞게 리사이즈 (세로 63px)
            const resizedOverlay = await sharp(overlayBuffer)
              .resize(previewWidth, 63, { 
                fit: 'fill',
                background: { r: 255, g: 255, b: 255, alpha: 1 }
              })
              .png()
              .toBuffer();
            
            // 오버레이를 이미지 상단에 합성
            finalImage = resizedImage.composite([{
              input: resizedOverlay,
              top: 0,
              left: 0
            }]);
            
            console.log('오버레이 이미지 합성 완료');
          }
        } catch (error) {
          console.error('오버레이 이미지 처리 실패:', error);
        }
      }

      const previewBuffer = await finalImage
        .webp({ quality: 85 })
        .toBuffer();

      return new NextResponse(previewBuffer, {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    } else {
      // IT와 레터는 미리보기 없음
      return NextResponse.json(
        { error: 'PDF 파일은 미리보기를 지원하지 않습니다.' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('미리보기 생성 실패:', error);
    return NextResponse.json(
      { error: '미리보기를 생성할 수 없습니다.' },
      { status: 500 }
    );
  }
} 