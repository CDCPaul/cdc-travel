import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { getStorage } from 'firebase-admin/storage';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    console.log('이미지 생성 API 호출됨');
    const body = await request.json();
    const { taIds, attachmentBase64, attachmentType } = body;
    
    console.log('받은 데이터:', {
      taIds: taIds,
      hasAttachmentBase64: !!attachmentBase64,
      attachmentType: attachmentType
    });

    if (!taIds || !Array.isArray(taIds) || taIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'TA ID가 필요합니다.' 
      }, { status: 400 });
    }

    if (!attachmentBase64 || !attachmentType) {
      return NextResponse.json({ 
        success: false, 
        error: '첨부파일이 필요합니다.' 
      }, { status: 400 });
    }

    // TA 정보 가져오기
    const tasRef = collection(db, 'tas');
    const tasQuery = query(tasRef, where('__name__', 'in', taIds));
    const tasSnapshot = await getDocs(tasQuery);
    const tas = tasSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Array<{
      id: string;
      companyName: string;
      logo: string;
      [key: string]: unknown;
    }>;

    if (tas.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'TA 정보를 찾을 수 없습니다.' 
      }, { status: 404 });
    }

    console.log('TA 개수:', tas.length);
    console.log('TA 목록:', tas.map(t => ({ id: t.id, name: t.companyName, hasLogo: !!t.logo })));

    const storage = getStorage(initializeFirebaseAdmin());
    const bucket = storage.bucket();
    const results: Array<{
      taId: string;
      taName: string;
      imageUrl: string;
      thumbnailUrl: string;
      fileName: string;
      thumbnailFileName: string;
      error?: string;
    }> = [];

    // 1단계: 원본 이미지를 WebP로 변환하여 스토리지에 저장
    console.log('1단계: 원본 이미지 처리 시작');
    const attachmentBuffer = Buffer.from(attachmentBase64, 'base64');
    const originalImage = sharp(attachmentBuffer);
    const webpBuffer = await originalImage.webp({ quality: 85 }).toBuffer();
    
    const timestamp = Date.now();
    const sessionId = `session_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    const originalFileName = `email-images/${sessionId}/original.webp`;
    const originalFile = bucket.file(originalFileName);
    
    console.log('원본 WebP 파일 저장:', originalFileName);
    await originalFile.save(webpBuffer, {
      metadata: { contentType: 'image/webp' }
    });
    await originalFile.makePublic();
    const originalUrl = `https://storage.googleapis.com/${bucket.name}/${originalFileName}`;

    // 2단계: 각 TA에 대해 로고 오버레이 처리
    for (const ta of tas) {
      console.log(`TA ${ta.companyName} 처리 시작`);
      try {
        let finalImage = originalImage.clone();

        if (ta.logo) {
          console.log(`TA ${ta.companyName} 로고 처리 시작: ${ta.logo}`);
          try {
            // 로고 이미지 다운로드 및 처리
            const logoResponse = await fetch(ta.logo);
            console.log(`로고 다운로드 응답: ${logoResponse.status} ${logoResponse.statusText}`);
            if (!logoResponse.ok) {
              throw new Error(`로고 다운로드 실패: ${logoResponse.status}`);
            }

            const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());
            const logoImage = sharp(logoBuffer);
            
            // 로고 크기 조정 (예: 200x200)
            const resizedLogo = await logoImage.resize(200, 200, { fit: 'inside' }).png().toBuffer();
            
            // 로고를 이미지 우상단에 합성
            finalImage = finalImage.composite([{
              input: resizedLogo,
              top: 50,
              left: 50
            }]);
            
            console.log(`TA ${ta.companyName} 로고 오버레이 완료`);
          } catch (error) {
            console.error(`TA ${ta.companyName} 로고 처리 실패:`, error);
            // 로고 처리 실패 시 원본 이미지 사용
          }
        }

        // 3단계: 최종 이미지를 WebP로 변환
        console.log(`TA ${ta.companyName} 최종 이미지 생성 시작`);
        const finalBuffer = await finalImage.webp({ 
          quality: 85,
          effort: 6
        }).toBuffer();

        console.log(`TA ${ta.companyName} WebP 변환 완료, 버퍼 크기: ${finalBuffer.length}`);

        // 4단계: 최종 이미지 저장
        const finalFileName = `email-images/${sessionId}/${ta.id}.webp`;
        const finalFile = bucket.file(finalFileName);
        
        console.log(`TA ${ta.companyName} 최종 이미지 저장: ${finalFileName}`);
        await finalFile.save(finalBuffer, {
          metadata: { contentType: 'image/webp' }
        });
        await finalFile.makePublic();
        const finalUrl = `https://storage.googleapis.com/${bucket.name}/${finalFileName}`;

                 // 5단계: 썸네일 생성 (미리보기용)
         // 저장된 최종 이미지를 불러와서 썸네일 생성
         console.log(`TA ${ta.companyName} 썸네일 생성 시작: ${finalUrl}`);
         
         // 저장된 최종 이미지 다운로드
         const finalImageResponse = await fetch(finalUrl);
         if (!finalImageResponse.ok) {
           throw new Error(`최종 이미지 다운로드 실패: ${finalImageResponse.status}`);
         }
         
         const finalImageBuffer = Buffer.from(await finalImageResponse.arrayBuffer());
         const thumbnailBuffer = await sharp(finalImageBuffer)
           .resize(400, 300, { fit: 'inside' })
           .webp({ quality: 70 })
           .toBuffer();
         const thumbnailFileName = `email-images/${sessionId}/thumb_${ta.id}.webp`;
         const thumbnailFile = bucket.file(thumbnailFileName);
        
        console.log(`TA ${ta.companyName} 썸네일 생성: ${thumbnailFileName}`);
        await thumbnailFile.save(thumbnailBuffer, {
          metadata: { contentType: 'image/webp' }
        });
        await thumbnailFile.makePublic();
        const thumbnailUrl = `https://storage.googleapis.com/${bucket.name}/${thumbnailFileName}`;

        results.push({
          taId: ta.id,
          taName: ta.companyName,
          imageUrl: finalUrl, // 발송용 원본
          thumbnailUrl: thumbnailUrl, // 미리보기용 썸네일
          fileName: finalFileName,
          thumbnailFileName: thumbnailFileName
        });

        console.log(`TA ${ta.companyName} 처리 완료`);
      } catch (error) {
        console.error(`TA ${ta.companyName} 처리 실패:`, error);
        results.push({
          taId: ta.id,
          taName: ta.companyName,
          imageUrl: originalUrl, // 실패 시 원본 사용
          thumbnailUrl: originalUrl,
          fileName: originalFileName,
          thumbnailFileName: originalFileName,
          error: error instanceof Error ? error.message : '처리 실패'
        });
      }
    }

    // 6단계: 원본 파일 삭제 (로고 오버레이된 파일만 남김)
    console.log('원본 파일 삭제:', originalFileName);
    await originalFile.delete().catch(error => {
      console.error('원본 파일 삭제 실패:', error);
    });

    console.log('모든 처리 완료, 결과:', results.length);

    return NextResponse.json({
      success: true,
      results: results,
      timestamp: timestamp, // 타임스탬프 반환 (파일 정리용)
      sessionId: sessionId // 세션 ID 반환 (파일 정리용)
    });

  } catch (error) {
    console.error('이미지 생성 API 오류:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '이미지 처리 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
} 