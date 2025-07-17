const { getAdminStorage } = require('../lib/firebase-admin');
const { optimizeImageForUsage } = require('../lib/image-optimizer');

/**
 * 기존 Firebase Storage 이미지들을 Sharp로 최적화하는 스크립트
 * URL은 그대로 유지하면서 파일만 최적화된 WebP로 교체
 */

async function optimizeExistingImages() {
  const bucket = getAdminStorage().bucket();
  
  // 최적화할 폴더들
  const folders = ['products', 'spots', 'banners'];
  
  for (const folder of folders) {
    console.log(`\n📁 ${folder} 폴더 처리 중...`);
    
    try {
      // 폴더 내 모든 파일 목록 가져오기
      const [files] = await bucket.getFiles({ prefix: `${folder}/` });
      
      const imageFiles = files.filter(file => {
        const ext = file.name.toLowerCase().split('.').pop();
        return ['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext);
      });
      
      console.log(`발견된 이미지: ${imageFiles.length}개`);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const file of imageFiles) {
        try {
          console.log(`처리 중: ${file.name}`);
          
          // 1. 기존 파일 다운로드
          const [buffer] = await file.download();
          
          // 2. 파일 확장자 확인
          const ext = file.name.toLowerCase().split('.').pop();
          if (!['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext)) {
            console.log(`  ⏭️  이미지 파일이 아님: ${file.name}`);
            continue;
          }
          
          // 3. 용도별 최적화 설정 결정
          let usage = 'custom';
          if (folder === 'products') usage = 'product-detail';
          else if (folder === 'spots') usage = 'travel-info';
          else if (folder === 'banners') usage = 'main-banner';
          
          // 4. Sharp로 최적화
          const optimizedResult = await optimizeImageForUsage(buffer, usage);
          
          // 5. 파일명에서 확장자만 WebP로 변경
          const newFileName = file.name.replace(/\.[^/.]+$/, '.webp');
          
          // 6. 최적화된 파일 업로드 (기존 파일 덮어쓰기)
          await file.save(optimizedResult.buffer, {
            metadata: {
              contentType: 'image/webp',
              metadata: {
                originalName: file.name,
                uploadedAt: new Date().toISOString(),
                optimized: 'true',
                originalSize: buffer.length.toString(),
                optimizedSize: optimizedResult.buffer.length.toString(),
                compressionRatio: Math.round((1 - optimizedResult.buffer.length / buffer.length) * 100).toString() + '%'
              }
            }
          });
          
          console.log(`  ✅ 최적화 완료: ${file.name} → ${newFileName}`);
          console.log(`     압축률: ${Math.round((1 - optimizedResult.buffer.length / buffer.length) * 100)}%`);
          successCount++;
          
        } catch (error) {
          console.error(`  ❌ 오류: ${file.name}`, error.message);
          errorCount++;
        }
      }
      
      console.log(`\n📊 ${folder} 폴더 결과:`);
      console.log(`  ✅ 성공: ${successCount}개`);
      console.log(`  ❌ 실패: ${errorCount}개`);
      
    } catch (error) {
      console.error(`${folder} 폴더 처리 중 오류:`, error);
    }
  }
  
  console.log('\n🎉 모든 폴더 처리 완료!');
}

// 스크립트 실행
if (require.main === module) {
  optimizeExistingImages()
    .then(() => {
      console.log('✅ 이미지 최적화 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 중 오류:', error);
      process.exit(1);
    });
}

module.exports = { optimizeExistingImages }; 