import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import sharp from 'sharp';
import { getStorage } from 'firebase-admin/storage';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taIds, attachmentBase64, attachmentType } = body;

    if (!taIds || !Array.isArray(taIds) || taIds.length === 0) {
      return NextResponse.json(
        { error: 'TA ID 목록이 필요합니다.' },
        { status: 400 }
      );
    }

    // Firebase Admin Firestore 사용
    const db = getAdminDb();
    
    // 선택된 TA들의 데이터 가져오기
    const tasRef = db.collection('tas');
    const querySnapshot = await tasRef.where('__name__', 'in', taIds).get();

    const tas = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as Array<{
      id: string;
      companyName: string;
      logo: string;
      [key: string]: unknown;
    }>;

    if (tas.length === 0) {
      return NextResponse.json(
        { error: '선택된 TA를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Firebase Admin Storage 초기화
    const storage = getStorage(initializeFirebaseAdmin());
    const bucket = storage.bucket();

    // 첨부파일 이미지 처리 (JPG 파일만 지원)
    let baseImage: sharp.Sharp;
    let imageWidth = 2480;
    let imageHeight = 3508;

    if (attachmentBase64 && attachmentType && attachmentType.startsWith('image/')) {
      try {
        // Base64 디코딩
        const attachmentBuffer = Buffer.from(attachmentBase64, 'base64');
        
        // 첨부파일을 기본 이미지로 사용
        baseImage = sharp(attachmentBuffer);
        
        // 이미지 크기 정보 가져오기
        const metadata = await baseImage.metadata();
        imageWidth = metadata.width || 2480;
        imageHeight = metadata.height || 3508;
        
        console.log(`첨부파일 이미지 크기: ${imageWidth}x${imageHeight}`);
      } catch (error) {
        console.error('첨부파일 처리 실패:', error);
        // 첨부파일 처리 실패 시 기본 흰색 배경 사용
        baseImage = sharp({
          create: {
            width: 2480,
            height: 3508,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          }
        });
      }
    } else {
      // 첨부파일이 없거나 이미지가 아닌 경우 기본 흰색 배경 사용
      baseImage = sharp({
        create: {
          width: 2480,
          height: 3508,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      });
    }

    const imageUrls: string[] = [];

    // 각 TA에 대해 로고가 합성된 이미지 생성
    for (const ta of tas) {
      try {
        let finalImage = baseImage;

        if (ta.logo) {
          try {
            // 로고 이미지 다운로드 및 처리
            const logoResponse = await fetch(ta.logo);
            if (!logoResponse.ok) {
              throw new Error(`로고 다운로드 실패: ${logoResponse.status}`);
            }
            
            const logoBuffer = await logoResponse.arrayBuffer();
            
            // 로고 크기 조정 (세로 250px, 가로는 비율에 맞게 자동 조정)
            const logoHeight = 250;
            
            const processedLogo = await sharp(Buffer.from(logoBuffer))
              .resize(null, logoHeight, { 
                fit: 'inside',
                withoutEnlargement: true 
              })
              .png()
              .toBuffer();

            // 로고 정보 가져오기 (실제 크기 확인)
            const logoInfo = await sharp(processedLogo).metadata();
            const actualLogoWidth = logoInfo.width || 0;
            const actualLogoHeight = logoInfo.height || logoHeight;

            // 로고를 상단 260px 영역 내에 왼쪽 정렬로 배치
            const logoAreaTop = 50; // 상단 여백
            const logoAreaHeight = 260 - logoAreaTop; // 로고 영역 높이 (210px)
            const logoY = logoAreaTop + (logoAreaHeight - actualLogoHeight) / 2; // 세로 중앙 정렬
            
            // 왼쪽 정렬 (왼쪽 여백 100px)
            const logoX = 100;

            console.log(`로고 배치 정보: ${ta.companyName}`);
            console.log(`- 로고 크기: ${actualLogoWidth}x${actualLogoHeight}`);
            console.log(`- 배치 위치: (${Math.round(logoX)}, ${Math.round(logoY)})`);
            console.log(`- 이미지 크기: ${imageWidth}x${imageHeight}`);

            // 합성된 이미지 생성
            finalImage = baseImage.composite([{
              input: processedLogo,
              top: Math.round(logoY),
              left: Math.round(logoX)
            }]);

            console.log(`로고 합성 완료: ${ta.companyName}`);

          } catch (logoError) {
            console.error(`로고 처리 실패 (TA: ${ta.companyName}):`, logoError);
            // 로고 처리 실패 시 기본 이미지 사용
            finalImage = baseImage;
          }
        }

        // 최종 이미지를 PNG로 변환
        const finalBuffer = await finalImage.png().toBuffer();

        // Firebase Storage에 직접 업로드
        const fileName = `email-images/${ta.id}_${Date.now()}.png`;
        const file = bucket.file(fileName);
        
        await file.save(finalBuffer, {
          metadata: {
            contentType: 'image/png',
          },
        });

        // 공개 URL 생성
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        imageUrls.push(publicUrl);
        console.log(`이미지 업로드 완료: ${ta.companyName} -> ${publicUrl}`);

      } catch (error) {
        console.error(`이미지 생성 실패 (TA: ${ta.companyName}):`, error);
        // 개별 TA 이미지 생성 실패 시 빈 문자열 추가
        imageUrls.push('');
      }
    }

    return NextResponse.json({
      success: true,
      imageUrls,
      message: `${tas.length}개의 이미지가 생성되었습니다.`
    });

  } catch (error) {
    console.error('이미지 생성 실패:', error);
    return NextResponse.json(
      { error: '이미지 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
} 