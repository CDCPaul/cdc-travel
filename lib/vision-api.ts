import { GoogleAuth } from 'google-auth-library';

interface PassportData {
  surname?: string;
  givenNames?: string;
  nationality?: string;
  passportNumber?: string;
  passportExpiry?: string;
  gender?: string;
}

export async function detectPassportText(base64Image: string): Promise<PassportData> {
  try {
    let serviceAccount: Record<string, unknown>;

    // 환경에 따라 다른 방식으로 서비스 계정 키 로드
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // 로컬 환경: 파일 경로 사용
      const fs = await import('fs');
      const path = await import('path');
      const keyPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      const keyFile = fs.readFileSync(keyPath, 'utf8');
      serviceAccount = JSON.parse(keyFile);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      // Vercel 환경: 환경 변수 사용
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } else {
      throw new Error('No service account credentials found');
    }
    
    // GoogleAuth 설정
    const auth = new GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/cloud-vision']
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    if (!accessToken.token) {
      throw new Error('Failed to get access token');
    }

    // Vision API 호출
    const visionApiUrl = 'https://vision.googleapis.com/v1/images:annotate';
    const response = await fetch(visionApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: base64Image
            },
            features: [
              {
                type: 'DOCUMENT_TEXT_DETECTION',
                maxResults: 1
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vision API Error:', response.status, errorText);
      throw new Error(`Vision API request failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    
    // 간단한 로그만 출력 (전체 응답 대신)
    console.log('Vision API 호출 성공');
    
    if (!result.responses || !result.responses[0] || !result.responses[0].fullTextAnnotation) {
      throw new Error('No text detected in the image');
    }

    const text = result.responses[0].fullTextAnnotation.text;
    console.log('Detected Text:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));

    // 여권 정보 파싱
    return parsePassportText(text);
  } catch (error) {
    console.error('Error in detectPassportText:', error);
    throw error;
  }
}

function parsePassportText(text: string): PassportData {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  console.log('Parsing lines:', lines);

  const result: PassportData = {};

  // MRZ 정보 찾기 (44자 길이의 라인들)
  const mrzLines = lines.filter(line => line.length >= 44);
  console.log('MRZ 라인들:', mrzLines);

  if (mrzLines.length >= 2) {
    const mrzLine1 = mrzLines[mrzLines.length - 2]; // 첫 번째 MRZ 라인
    const mrzLine2 = mrzLines[mrzLines.length - 1]; // 두 번째 MRZ 라인
    
    console.log('MRZ Line 1:', mrzLine1);
    console.log('MRZ Line 2:', mrzLine2);
    
    // MRZ에서 정보 추출
    parseMRZData(mrzLine1, mrzLine2, result);
  }

  // 기존 OCR 파싱 로직 (MRZ에서 찾지 못한 경우 대비)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 성 추출 (Surname) - 다양한 패턴 인식
    if (!result.surname && (
      line.includes('/Surname') || 
      line.includes('성/ Surname') || 
      line.includes('Sumame') ||  // OCR 오류 대응
      line.includes('Surname')
    )) {
      // 다음 줄에서 성 찾기
      if (i + 1 < lines.length) {
        const surnameLine = lines[i + 1];
        if (surnameLine.match(/^[A-Z]+$/)) {
          result.surname = surnameLine.trim();
        }
      }
      continue;
    }

    // 이름 추출 (Given names) - 다양한 패턴 인식
    if (!result.givenNames && (
      line.includes('이름/Given names') || 
      line.includes('of Given names') ||  // OCR 오류 대응
      line.includes('Given names')
    )) {
      // 다음 줄에서 이름 찾기
      if (i + 1 < lines.length) {
        const givenNamesLine = lines[i + 1];
        if (givenNamesLine.match(/^[A-Z]+$/)) {
          result.givenNames = givenNamesLine.trim();
        }
      }
      continue;
    }

    // 여권 번호 추출 - 다양한 패턴 인식
    if (!result.passportNumber && (
      line.includes('여권번호/ Passport No.') || 
      line.includes('Passport No.') ||
      line.includes('Prope')  // OCR 오류 대응
    )) {
      // 다음 줄에서 여권번호 찾기
      if (i + 1 < lines.length) {
        const passportLine = lines[i + 1];
        if (passportLine.match(/^[A-Z0-9]+$/)) {
          result.passportNumber = passportLine.trim();
        }
      }
      continue;
    }

    // 국적 추출
    if (!result.nationality && line.match(/KOR|Korea|Republic of Korea/i)) {
      result.nationality = 'KOR';
      continue;
    }

    // 성별 추출 - 다양한 패턴 인식
    if (!result.gender && (
      line.includes('성별/ Sex') || 
      line.includes('성별/Sex') || 
      line.includes('/Sex') ||  // OCR 오류 대응
      line.includes('Sex')
    )) {
      // "성별/ Sex" 라벨 다음에 "생년월일/ Date of birth" 라벨이 있고, 그 다음 줄에서 성별 찾기
      if (i + 3 < lines.length) {
        const birthLabelLine = lines[i + 1];
        const genderLine = lines[i + 3];
        
        if ((birthLabelLine.includes('생년월일/ Date of birth') || 
             birthLabelLine.includes('생년클얼/ Date of b')) &&  // OCR 오류 대응
            genderLine.match(/^[MF]$/)) {
          result.gender = genderLine.trim();
        }
      }
      continue;
    }

    // 만료일 추출 - 다양한 패턴 인식
    if (!result.passportExpiry && (
      line.includes('기간만료일/ Date of expiry') || 
      line.includes('Date of expiry')
    )) {
      // 다음 줄에서 만료일 찾기
      if (i + 1 < lines.length) {
        const expiryLine = lines[i + 1];
        // "08 12/DEC 2028" 또는 "04 FEB 2030" 형식을 "YYYY-MM-DD" 형식으로 변환
        const match = expiryLine.match(/(\d{2})\s+(\d{1,2})\/([A-Z]{3})\s+(\d{4})/);
        if (match) {
          const day = match[1];
          const month = match[2];
          const year = match[4];
          result.passportExpiry = `${year}-${month.padStart(2, '0')}-${day}`;
        } else {
          // "04 FEB 2030" 형식 처리
          const dateMatch = expiryLine.match(/(\d{2})\s+([A-Z]{3})\s+(\d{4})/);
          if (dateMatch) {
            const day = dateMatch[1];
            const month = dateMatch[2];
            const year = dateMatch[3];
            const monthMap: { [key: string]: string } = {
              'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
              'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
              'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
            };
            const monthNum = monthMap[month] || '01';
            result.passportExpiry = `${year}-${monthNum}-${day}`;
          }
        }
      }
      continue;
    }
  }

  console.log('Parsed passport data:', result);
  
  // 각 필드별로 상세 로그 출력
  console.log('파싱 결과 상세:', {
    surname: result.surname,
    givenNames: result.givenNames,
    gender: result.gender,
    nationality: result.nationality,
    passportNumber: result.passportNumber,
    passportExpiry: result.passportExpiry
  });
  
  return result;
}

// MRZ 데이터 파싱 함수
function parseMRZData(mrzLine1: string, mrzLine2: string, result: PassportData) {
  console.log('MRZ 파싱 시작:', { mrzLine1, mrzLine2 });
  
  // 여권번호: 2번째 줄 1~9자
  if (mrzLine2.length >= 9) {
    const passportNumber = mrzLine2.substring(0, 9);
    if (passportNumber.match(/^[A-Z0-9]+$/)) {
      result.passportNumber = passportNumber;
      console.log('MRZ에서 여권번호 추출:', passportNumber);
    }
  }
  
  // 국적: 2번째 줄 11~13자
  if (mrzLine2.length >= 13) {
    const nationality = mrzLine2.substring(10, 13);
    if (nationality === 'KOR') {
      result.nationality = nationality;
      console.log('MRZ에서 국적 추출:', nationality);
    }
  }
  
  // 생년월일: 2번째 줄 14~19자 (YYMMDD)
  if (mrzLine2.length >= 19) {
    const birthDate = mrzLine2.substring(13, 19);
    if (birthDate.match(/^\d{6}$/)) {
      const year = birthDate.substring(0, 2);
      const month = birthDate.substring(2, 4);
      const day = birthDate.substring(4, 6);
      const fullYear = parseInt(year) > 50 ? `19${year}` : `20${year}`;
      console.log('MRZ에서 생년월일 추출:', `${fullYear}-${month}-${day}`);
    }
  }
  
  // 성별: 2번째 줄 21자
  if (mrzLine2.length >= 21) {
    const gender = mrzLine2.charAt(20);
    if (gender === 'M' || gender === 'F') {
      result.gender = gender;
      console.log('MRZ에서 성별 추출:', gender);
    }
  }
  
  // 만료일: 2번째 줄 22~27자 (YYMMDD)
  if (mrzLine2.length >= 27) {
    const expiryDate = mrzLine2.substring(21, 27);
    if (expiryDate.match(/^\d{6}$/)) {
      const year = expiryDate.substring(0, 2);
      const month = expiryDate.substring(2, 4);
      const day = expiryDate.substring(4, 6);
      const fullYear = `20${year}`; // 만료일은 보통 2000년대 이후
      result.passportExpiry = `${fullYear}-${month}-${day}`;
      console.log('MRZ에서 만료일 추출:', result.passportExpiry);
    }
  }
  
  // 이름: 1번째 줄에서 << 기준 분리 (한국 여권 구조에 맞게 수정)
  console.log('MRZ Line 1 파싱:', mrzLine1);
  
  // PMKORAN<<JUYOUN<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
  // PMKOR: 여권 타입 + 국적
  // AN: 성 (<< 전까지)
  // JUYOUN: 이름 (<< 바로 다음부터 <<<<<<<<<<<<< 전까지)
  
  // PMKOR 다음부터 첫 번째 << 전까지가 성
  if (mrzLine1.startsWith('PMKOR')) {
    const afterPMKOR = mrzLine1.substring(5); // PMKOR 제거
    console.log('PMKOR 제거 후:', afterPMKOR);
    
    const firstDoubleArrow = afterPMKOR.indexOf('<<');
    if (firstDoubleArrow !== -1) {
      const surname = afterPMKOR.substring(0, firstDoubleArrow);
      console.log('성 추출:', surname);
      
      if (surname && surname.length > 0) {
        result.surname = surname;
      }
      
      // << 바로 다음부터 <<<<<<<<<<<<< 전까지가 이름
      const afterFirstArrow = afterPMKOR.substring(firstDoubleArrow + 2);
      console.log('첫 번째 << 이후:', afterFirstArrow);
      
      // 연속된 << 찾기
      const consecutiveArrows = afterFirstArrow.indexOf('<<<<<<<<<<<<<');
      if (consecutiveArrows !== -1) {
        const givenNames = afterFirstArrow.substring(0, consecutiveArrows);
        console.log('이름 추출:', givenNames);
        
        if (givenNames && givenNames.length > 0) {
          result.givenNames = givenNames;
        }
      } else {
        // 연속된 <<가 없으면 전체를 이름으로
        result.givenNames = afterFirstArrow;
        console.log('이름 추출 (전체):', afterFirstArrow);
      }
    }
  }
} 