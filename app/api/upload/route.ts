import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase-admin';
import { optimizeImageForUsage, ImageUsage } from '@/lib/image-optimizer';

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

    if (optimize && file.type.startsWith('image/')) {
      try {
        // 용도별 최적화 적용
        const optimizedResult = await optimizeImageForUsage(buffer, usage);
        optimizedBuffer = optimizedResult.buffer;

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
    const mainFileName = optimize && file.type.startsWith('image/') 
      ? `${baseFileName.replace(/\.[^/.]+$/, '')}.webp`
      : baseFileName;
    
    const mainFileUpload = bucket.file(mainFileName);
    await mainFileUpload.save(optimizedBuffer, {
      metadata: {
        contentType: optimize && file.type.startsWith('image/') ? 'image/webp' : file.type,
        metadata: {
          originalName: originalName,
          uploadedAt: new Date().toISOString(),
          optimized: optimize.toString(),
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
      optimized: optimize && file.type.startsWith('image/'),
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 