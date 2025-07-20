import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileNames, thumbnailFileNames } = body;

    if (!fileNames || !Array.isArray(fileNames)) {
      return NextResponse.json(
        { error: '삭제할 파일 목록이 필요합니다.' },
        { status: 400 }
      );
    }

    // Firebase Admin Storage 초기화
    const storage = getStorage(initializeFirebaseAdmin());
    const bucket = storage.bucket();

    const deletedFiles: string[] = [];
    const failedFiles: string[] = [];

    // 원본 이미지 삭제
    for (const fileName of fileNames) {
      try {
        const file = bucket.file(fileName);
        await file.delete();
        deletedFiles.push(fileName);
        console.log(`원본 이미지 삭제 완료: ${fileName}`);
      } catch (error) {
        console.error(`원본 이미지 삭제 실패: ${fileName}`, error);
        failedFiles.push(fileName);
      }
    }

    // 썸네일 이미지 삭제
    if (thumbnailFileNames && Array.isArray(thumbnailFileNames)) {
      for (const thumbnailFileName of thumbnailFileNames) {
        try {
          const thumbnailFile = bucket.file(thumbnailFileName);
          await thumbnailFile.delete();
          deletedFiles.push(thumbnailFileName);
          console.log(`썸네일 이미지 삭제 완료: ${thumbnailFileName}`);
        } catch (error) {
          console.error(`썸네일 이미지 삭제 실패: ${thumbnailFileName}`, error);
          failedFiles.push(thumbnailFileName);
        }
      }
    }

    return NextResponse.json({
      success: true,
      deletedFiles,
      failedFiles,
      message: `${deletedFiles.length}개의 파일이 삭제되었습니다.${failedFiles.length > 0 ? ` (${failedFiles.length}개 실패)` : ''}`
    });

  } catch (error) {
    console.error('이미지 정리 실패:', error);
    return NextResponse.json(
      { error: '이미지 정리에 실패했습니다.' },
      { status: 500 }
    );
  }
} 