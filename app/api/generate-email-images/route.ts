import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taId, imageUrls } = body;

    if (!taId || !imageUrls || !Array.isArray(imageUrls)) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    console.log('이메일 이미지 생성 시작:', { taId, imageCount: imageUrls.length });

    // Firebase Admin 초기화
    const db = getAdminDb();
    const storage = getStorage(initializeFirebaseAdmin());
    const bucket = storage.bucket();

    // TA 정보 가져오기
    const taRef = db.collection('tas').doc(taId);
    const taDoc = await taRef.get();

    if (!taDoc.exists) {
      return NextResponse.json(
        { error: 'TA를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const taData = taDoc.data();
    console.log('TA 정보:', taData);

    // 미리 생성된 오버레이 이미지 URL 확인
    if (!taData?.overlayImage) {
      return NextResponse.json(
        { error: 'TA 오버레이 이미지가 없습니다. TA를 다시 수정해주세요.' },
        { status: 400 }
      );
    }

    const overlayImageUrl = taData.overlayImage;
    console.log('사용할 오버레이 이미지:', overlayImageUrl);

    // 오버레이 이미지 다운로드
    const overlayResponse = await fetch(overlayImageUrl);
    const overlayBuffer = Buffer.from(await overlayResponse.arrayBuffer());
    console.log('오버레이 이미지 다운로드 완료, 크기:', overlayBuffer.length);

    // 각 이미지에 오버레이 적용
    const processedImages: string[] = [];

    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      console.log(`이미지 ${i + 1}/${imageUrls.length} 처리 중:`, imageUrl);

      try {
        // 원본 이미지 다운로드
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

        // 원본 이미지 정보 가져오기
        const imageInfo = await sharp(imageBuffer).metadata();
        console.log('원본 이미지 정보:', imageInfo);

        if (!imageInfo.width || !imageInfo.height) {
          console.error('이미지 정보를 가져올 수 없습니다.');
          continue;
        }

        // 오버레이 이미지를 원본 이미지 크기에 맞게 리사이즈
        const resizedOverlay = await sharp(overlayBuffer)
          .resize(imageInfo.width, 250, { 
            fit: 'fill',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .png()
          .toBuffer();

        console.log('오버레이 리사이즈 완료');

        // 원본 이미지에 오버레이 합성 (상단에 배치)
        const finalImage = await sharp(imageBuffer)
          .composite([{
            input: resizedOverlay,
            top: 0,
            left: 0
          }])
          .png()
          .toBuffer();

        console.log('이미지 합성 완료, 크기:', finalImage.length);

        // Firebase Storage에 저장
        const fileName = `email-images/${taData.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}_${i}.png`;
        const file = bucket.file(fileName);

        await file.save(finalImage, {
          metadata: {
            contentType: 'image/png',
            cacheControl: 'public, max-age=31536000'
          }
        });

        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        processedImages.push(publicUrl);

        console.log(`이미지 ${i + 1} 저장 완료:`, publicUrl);

      } catch (error) {
        console.error(`이미지 ${i + 1} 처리 실패:`, error);
        // 개별 이미지 실패해도 계속 진행
      }
    }

    console.log('모든 이미지 처리 완료. 총 처리된 이미지:', processedImages.length);

    return NextResponse.json({
      success: true,
      processedImages,
      message: `${processedImages.length}개의 이미지가 성공적으로 처리되었습니다.`
    });

  } catch (error) {
    console.error('이메일 이미지 생성 실패:', error);
    return NextResponse.json(
      { error: '이메일 이미지 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}