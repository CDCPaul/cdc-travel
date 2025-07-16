const fs = require('fs');
const path = require('path');

// PDF 파일 경로
const pdfPath = path.join(__dirname, '..', 'public', 'Cebu Direct Club Company Profile.pdf');

console.log('PDF 파일 분석 시작...');
console.log('파일 경로:', pdfPath);

// 파일 존재 확인
if (fs.existsSync(pdfPath)) {
  console.log('✅ PDF 파일이 존재합니다.');
  
  // 파일 정보
  const stats = fs.statSync(pdfPath);
  console.log('파일 크기:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
  console.log('생성일:', stats.birthtime);
  console.log('수정일:', stats.mtime);
  
  // 파일의 처음 몇 바이트를 읽어서 PDF 시그니처 확인
  const buffer = fs.readFileSync(pdfPath, { encoding: null });
  const header = buffer.slice(0, 10).toString('ascii');
  console.log('파일 헤더:', header);
  
  if (header.startsWith('%PDF')) {
    console.log('✅ 유효한 PDF 파일입니다.');
  } else {
    console.log('❌ PDF 파일이 아닙니다.');
  }
  
} else {
  console.log('❌ PDF 파일을 찾을 수 없습니다.');
}

console.log('\nPDF 내용을 수동으로 확인하시고, 다음 섹션들을 알려주세요:');
console.log('1. 회사 개요/소개');
console.log('2. 비전/미션');
console.log('3. 연혁');
console.log('4. 팀 소개');
console.log('5. 사업 영역');
console.log('6. 연락처 정보');
console.log('7. 기타 섹션들'); 