import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // 파일 버퍼 생성
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 파일명 생성 (중복 방지)
    const timestamp = Date.now();
    const originalName = file.name;
    const fileName = `${folder}/${timestamp}_${originalName}`;

    // Firebase Storage에 업로드
    const bucket = getAdminStorage().bucket();
    const fileUpload = bucket.file(fileName);

    await fileUpload.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          originalName: originalName,
          uploadedAt: new Date().toISOString(),
        }
      }
    });

    // 공개 URL 생성
    const [url] = await fileUpload.getSignedUrl({
      action: 'read',
      expires: '03-01-2500', // 매우 긴 만료일
    });

    return NextResponse.json({
      success: true,
      url: url,
      fileName: fileName,
      originalName: originalName,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 