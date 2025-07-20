import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, imageUrls, timestamp } = body;
    
    console.log('이미지 파일 정리 API 호출됨:', {
      sessionId,
      imageUrlsCount: imageUrls?.length,
      timestamp
    });

    if (!sessionId) {
      return NextResponse.json({ 
        success: false, 
        error: '세션 ID가 필요합니다.' 
      }, { status: 400 });
    }

    const storage = getStorage(initializeFirebaseAdmin());
    const bucket = storage.bucket();
    
    const deletedFiles: string[] = [];
    const failedFiles: string[] = [];

    // 세션 디렉토리 내의 모든 파일 삭제
    try {
      const sessionPrefix = `email-images/${sessionId}/`;
      const [files] = await bucket.getFiles({ prefix: sessionPrefix });
      
      console.log(`세션 ${sessionId}의 파일들 발견:`, files.length);
      
      for (const file of files) {
        try {
          await file.delete();
          deletedFiles.push(file.name);
          console.log('파일 삭제 완료:', file.name);
        } catch (error) {
          console.error('파일 삭제 실패:', file.name, error);
          failedFiles.push(file.name);
        }
      }
      
      // 세션 디렉토리 자체도 삭제 (Firebase Storage는 자동으로 처리)
      console.log(`세션 ${sessionId} 디렉토리 정리 완료`);
      
    } catch (error) {
      console.error('세션 디렉토리 정리 실패:', error);
      failedFiles.push(`session_${sessionId}`);
    }

    console.log('파일 정리 완료:', {
      deletedCount: deletedFiles.length,
      failedCount: failedFiles.length
    });

    return NextResponse.json({
      success: true,
      deletedFiles,
      failedFiles,
      message: `${deletedFiles.length}개 파일이 삭제되었습니다.${failedFiles.length > 0 ? ` (${failedFiles.length}개 실패)` : ''}`
    });

  } catch (error) {
    console.error('이미지 파일 정리 API 오류:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '파일 정리 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
} 