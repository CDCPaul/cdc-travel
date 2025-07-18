import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase-admin';
import { optimizeImageForUsage, ImageUsage } from '@/lib/image-optimizer';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';
    const optimize = formData.get('optimize') === 'true';
    const usage = formData.get('usage') as ImageUsage || 'custom';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // 파일 버퍼 생성
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes) as Buffer;

    // 이미지 파일인 경우 최적화 적용
    let optimizedBuffer = buffer;
    let isOptimized = false;

    if (optimize && file.type.startsWith('image/')) {
      try {
        // 로고 이미지인 경우 특별 처리 (TA 폴더)
        if (folder === 'TA') {
          // 로고는 투명 배경을 흰색으로 변경하면서 최적화
          const image = sharp(buffer);
          
          // 메타데이터 확인
          const metadata = await image.metadata();
          
          // 투명 배경이 있는 PNG인 경우 흰색 배경으로 변경
          if (metadata.hasAlpha && file.type === 'image/png') {
            optimizedBuffer = await image
              .flatten({ background: { r: 255, g: 255, b: 255, alpha: 1 } }) // 투명 배경을 흰색으로 변경
              .png({ quality: 90, compressionLevel: 9 })
              .toBuffer();
            isOptimized = true;
          } else {
            // 일반 이미지 최적화
            const optimizedResult = await optimizeImageForUsage(buffer, usage);
            optimizedBuffer = optimizedResult.buffer;
            isOptimized = true;
          }
        } else {
          // 일반 이미지 최적화
          const optimizedResult = await optimizeImageForUsage(buffer, usage);
          optimizedBuffer = optimizedResult.buffer;
          isOptimized = true;
        }

      } catch (optimizeError) {
        console.error('Image optimization failed:', optimizeError);
        // 최적화 실패 시 원본 사용
        optimizedBuffer = buffer;
      }
    }

    // 파일명 생성 (중복 방지)
    const timestamp = Date.now();
    const originalName = file.name;
    const baseFileName = `${folder}/${timestamp}_${originalName}`;

    // Firebase Storage에 업로드
    const bucket = getAdminStorage().bucket();
    
    // 메인 이미지 업로드
    let mainFileName = baseFileName;
    let contentType = file.type;
    
    // 로고 이미지인 경우 PNG 형식 유지
    if (folder === 'TA' && file.type === 'image/png') {
      mainFileName = baseFileName.replace(/\.[^/.]+$/, '') + '.png';
      contentType = 'image/png';
    } else if (optimize && file.type.startsWith('image/')) {
      mainFileName = baseFileName.replace(/\.[^/.]+$/, '') + '.webp';
      contentType = 'image/webp';
    }
    
    const mainFileUpload = bucket.file(mainFileName);
    await mainFileUpload.save(optimizedBuffer, {
      metadata: {
        contentType: contentType,
        metadata: {
          originalName: originalName,
          uploadedAt: new Date().toISOString(),
          optimized: isOptimized.toString(),
        }
      }
    });

    // 메인 이미지 URL 생성 (영구)
    const [mainUrl] = await mainFileUpload.getSignedUrl({
      action: 'read',
      expires: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000), // 7년
    });

    return NextResponse.json({
      success: true,
      url: mainUrl,
      fileName: mainFileName,
      originalName: originalName,
      optimized: isOptimized,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 