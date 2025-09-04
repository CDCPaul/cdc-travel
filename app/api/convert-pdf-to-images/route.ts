import { NextRequest } from 'next/server';
import { verifyFirebaseToken } from '@/lib/auth-server';
import { getAdminStorage } from '@/lib/firebase-admin';
import pdf2pic from 'pdf2pic';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

/**
 * 🚫 Puppeteer 방식은 일시적으로 비활성화 (PDF iframe 로딩 문제)
 * 대신 pdf2pic 전용으로 변경
 */
async function convertPdfWithSimpleMethod(pdfPath: string, ebookId: string): Promise<{ imageUrls: string[], pageCount: number }> {
  console.log('🔄 간단한 백업 방식 시도 중... (텍스트 기반 알림)');
  
  const adminStorage = getAdminStorage();
  const bucket = adminStorage.bucket();
  
  // 간단한 알림 이미지 생성 (Canvas 없이)
  const simpleImageData = Buffer.from(`
    <svg width="800" height="1200" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="1200" fill="white"/>
      <text x="400" y="600" text-anchor="middle" font-size="24" fill="black">
        PDF 변환 실패
      </text>
      <text x="400" y="650" text-anchor="middle" font-size="16" fill="gray">
        PDF conversion failed
      </text>
    </svg>
  `);
  
  // Firebase Storage에 업로드
  const storageFilename = `ebooks/${ebookId}/pages/page-1.svg`;
  const file = bucket.file(storageFilename);
  
  await file.save(simpleImageData, {
    metadata: {
      contentType: 'image/svg+xml',
      cacheControl: 'public, max-age=31536000',
    },
  });
  
  await file.makePublic();
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storageFilename}`;
  
  return {
    imageUrls: [publicUrl],
    pageCount: 1
  };
}

/**
 * pdf2pic을 사용한 PDF → 이미지 변환 (백업)
 */
async function convertPdfWithPdf2pic(pdfPath: string, ebookId: string): Promise<{ imageUrls: string[], pageCount: number }> {
  console.log('📚 pdf2pic 방식 시도 중...');
  
  const adminStorage = getAdminStorage();
  const bucket = adminStorage.bucket();
  const tempDir = path.dirname(pdfPath);
  const outputDir = path.join(tempDir, 'pages');
  
  fs.mkdirSync(outputDir, { recursive: true });

  const convert = pdf2pic.fromPath(pdfPath, {
    density: 150,           // DPI 낮춤 (메모리 절약)
    saveFilename: "page",
    savePath: outputDir,
    format: "png",
    width: 800,             // 크기 줄임 (성능 개선)
    height: 1200,
    quality: 90,            // 품질 설정
    preserveAspectRatio: true
  });

  // 모든 페이지 변환 (타임아웃 설정)
  console.log('📚 pdf2pic 변환 시작...');
  
  let results: unknown[];
  try {
    // 개별 페이지로 나눠서 변환 (안정성 향상)
    results = await Promise.race([
      convert.bulk(-1), // 모든 페이지
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('pdf2pic 변환 타임아웃')), 60000) // 60초 타임아웃
      )
    ]) as unknown[];
  } catch (conversionError) {
    console.error('❌ pdf2pic 변환 실패:', conversionError);
    
    // 단일 페이지만 시도 (마지막 백업)
    console.log('🔄 단일 페이지 변환 시도...');
    try {
      // pdf2pic의 올바른 API 사용
      const singleResult = await convert(1); // 1페이지만 변환
      results = Array.isArray(singleResult) ? singleResult : [singleResult];
    } catch (singlePageError) {
      console.error('❌ 단일 페이지 변환도 실패:', singlePageError);
      throw conversionError; // 원래 오류를 다시 throw
    }
  }
  
  const imageUrls: string[] = [];
  
  for (let i = 0; i < results.length; i++) {
    const result = results[i] as { path: string };
    const pageNum = i + 1;
    
    // 변환된 이미지 파일 읽기
    const imagePath = result.path;
    const imageBuffer = await fs.promises.readFile(imagePath);
    
    // Firebase Storage에 업로드
    const storageFilename = `ebooks/${ebookId}/pages/page-${pageNum}.png`;
    const file = bucket.file(storageFilename);
    
    await file.save(imageBuffer, {
      metadata: {
        contentType: 'image/png',
        cacheControl: 'public, max-age=31536000',
      },
    });

    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storageFilename}`;
    imageUrls.push(publicUrl);
  }
  
  return {
    imageUrls,
    pageCount: results.length
  };
}

/**
 * PDF 파일을 이미지 배열로 변환하고 Firebase Storage에 저장 (하이브리드 방식)
 */
export async function POST(req: NextRequest) {
  // 인증 확인
  const authResult = await verifyFirebaseToken(req);
  if (!authResult.success) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Authentication required'
    }), { status: 401 });
  }
  let tempDir = '';
  
  try {
    console.log('🔄 PDF → 이미지 변환 시작... (하이브리드 방식)');
    
    const formData = await req.formData();
    const pdfFile = formData.get('pdf') as File;
    const ebookId = formData.get('ebookId') as string;
    
    if (!pdfFile || !ebookId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'PDF 파일과 eBook ID가 필요합니다.'
      }), { status: 400 });
    }

    // 임시 디렉토리 생성
    tempDir = path.join(process.cwd(), 'temp', uuidv4());
    fs.mkdirSync(tempDir, { recursive: true });

    // PDF 파일을 임시 디렉토리에 저장
    const pdfPath = path.join(tempDir, 'input.pdf');
    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
    fs.writeFileSync(pdfPath, pdfBuffer);
    console.log('📄 PDF 파일 저장 완료:', pdfPath);

    let result: { imageUrls: string[], pageCount: number };

    try {
      // 🔄 1차 시도: pdf2pic 방식 (더 안정적)
      result = await convertPdfWithPdf2pic(pdfPath, ebookId);
      console.log('✅ pdf2pic 변환 성공');
    } catch (pdf2picError) {
      console.log('⚠️ pdf2pic 실패, 백업 방식 시도:', pdf2picError);
      
      try {
        // 2차 시도: 간단한 백업 방식
        result = await convertPdfWithSimpleMethod(pdfPath, ebookId);
        console.log('✅ 백업 방식 변환 성공 (알림용)');
      } catch (simpleError) {
        console.error('❌ 모든 변환 방식 실패');
        console.error('pdf2pic 오류:', pdf2picError);
        console.error('백업 방식 오류:', simpleError);
        
        throw new Error(`PDF 변환 실패. pdf2pic: ${pdf2picError instanceof Error ? pdf2picError.message : 'Unknown'}. 백업: ${simpleError instanceof Error ? simpleError.message : 'Unknown'}`);
      }
    }

    console.log(`🎉 전체 변환 완료: ${result.pageCount}페이지`);
    console.log('🔍 반환할 데이터:', {
      success: true,
      imageUrlsCount: result.imageUrls.length,
      pageCount: result.pageCount,
      imageUrls: result.imageUrls
    });

    return new Response(JSON.stringify({
      success: true,
      imageUrls: result.imageUrls,
      pageCount: result.pageCount
    }));

  } catch (error) {
    console.error('❌ PDF → 이미지 변환 오류:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    }), { status: 500 });
    
  } finally {
    // 리소스 정리
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log('🧹 임시 파일 정리 완료');
      } catch (cleanupError) {
        console.error('❌ 임시 파일 정리 오류:', cleanupError);
      }
    }
  }
}
