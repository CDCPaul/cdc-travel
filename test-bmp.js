const sharp = require('sharp');

async function testBMPProcessing() {
  try {
    console.log('Sharp 버전:', sharp.versions);
    console.log('지원하는 포맷:', sharp.format);
    
    // 테스트용 더미 BMP 데이터 (실제로는 파일에서 읽어야 함)
    const testBuffer = Buffer.from([0x42, 0x4D, 0x1E, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1A, 0x00, 0x00, 0x00, 0x0C, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x01, 0x00, 0x18, 0x00, 0x00, 0x00, 0x04, 0x00]);
    
    console.log('BMP 메타데이터 테스트...');
    const metadata = await sharp(testBuffer).metadata();
    console.log('메타데이터:', metadata);
    
  } catch (error) {
    console.error('BMP 처리 테스트 오류:', error);
  }
}

testBMPProcessing(); 