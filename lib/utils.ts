/**
 * 날짜 포맷팅 유틸리티 함수
 */

/**
 * 날짜를 지정된 형식으로 포맷팅합니다.
 * @param date - 포맷팅할 날짜 (Date 객체 또는 날짜 문자열)
 * @param format - 포맷 문자열 ('YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss', 'MM/DD/YYYY' 등)
 * @returns 포맷팅된 날짜 문자열
 */
export function formatDate(
  date: Date | string | number | { toDate: () => Date }, // Firebase Timestamp도 처리
  format: string = 'YYYY-MM-DD'
): string {
  // Firebase Timestamp, Date, string, number 모두 처리
  let dateObj: Date;
  
  if (typeof date === 'string' || typeof date === 'number') {
    dateObj = new Date(date);
  } else if (date && typeof date === 'object' && 'toDate' in date) {
    // Firebase Timestamp 객체 처리
    dateObj = date.toDate();
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    throw new Error('Invalid date type provided to formatDate');
  }

  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date provided to formatDate');
  }

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const seconds = String(dateObj.getSeconds()).padStart(2, '0');

  let result = format;
  
  result = result.replace('YYYY', String(year));
  result = result.replace('MM', month);
  result = result.replace('DD', day);
  result = result.replace('HH', hours);
  result = result.replace('mm', minutes);
  result = result.replace('ss', seconds);

  return result;
}

/**
 * 현재 날짜를 포맷팅합니다.
 * @param format - 포맷 문자열
 * @returns 포맷팅된 현재 날짜 문자열
 */
export function formatCurrentDate(
  format: string = 'YYYY-MM-DD'
): string {
  return formatDate(new Date(), format);
}

/**
 * 타임스탬프를 날짜로 변환하여 포맷팅합니다.
 * @param timestamp - Firestore 타임스탬프 또는 Unix 타임스탬프
 * @param format - 포맷 문자열
 * @returns 포맷팅된 날짜 문자열
 */
export function formatTimestamp(
  timestamp: number | { seconds: number; nanoseconds: number },
  format: string = 'YYYY-MM-DD'
): string {
  let date: Date;
  
  if (typeof timestamp === 'number') {
    // Unix 타임스탬프 (밀리초)
    date = new Date(timestamp);
  } else {
    // Firestore 타임스탬프
    if (!timestamp.seconds || isNaN(timestamp.seconds)) {
      return '-';
    }
    date = new Date(timestamp.seconds * 1000);
  }
  
  // 유효하지 않은 날짜인지 확인
  if (isNaN(date.getTime())) {
    return '-';
  }
  
  return formatDate(date, format);
}

/**
 * 상대적 시간을 표시합니다 (예: "3일 전", "2시간 전")
 * @param date - 기준 날짜
 * @returns 상대적 시간 문자열
 */
export function formatRelativeTime(
  date: Date | string | number
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return '방금 전';
  if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
  if (diffInHours < 24) return `${diffInHours}시간 전`;
  if (diffInDays < 7) return `${diffInDays}일 전`;
  return formatDate(dateObj, 'YYYY-MM-DD');
} 

import { ImageUsage } from '@/lib/image-optimizer';

/**
 * 서버 사이드를 통한 Firebase Storage 업로드
 * CORS 문제를 우회하기 위해 서버 API를 통해 업로드
 */
export async function uploadFileToServer(
  file: File,
  folder: string = 'uploads',
  optimize: boolean = true,
  usage?: ImageUsage
): Promise<{ 
  success: boolean; 
  url?: string; 
  fileName?: string; 
  error?: string;
  optimized?: boolean;
}> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    formData.append('optimize', optimize.toString());
    if (usage) {
      formData.append('usage', usage);
    }

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Upload failed');
    }

    return {
      success: true,
      url: result.url,
      fileName: result.fileName,
      optimized: result.optimized,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
} 

// 항공사명(ko, en) → 로고 파일명 매핑 (2자리 코드 기준)
export const airlineLogoMap: Record<string, string> = {
  '진에어': '/images/airline/LJ.png',
  'Jin Air': '/images/airline/LJ.png',
  '에어부산': '/images/airline/BX.png',
  'Air Busan': '/images/airline/BX.png',
  '제주항공': '/images/airline/7c.png',
  'Jeju Air': '/images/airline/7c.png',
  '대한항공': '/images/airline/KE.png',
  'Korean Air': '/images/airline/KE.png',
  '아시아나항공': '/images/airline/OZ.png',
  'Asiana Airlines': '/images/airline/OZ.png',
  '세부퍼시픽': '/images/airline/5J.png',
  'Cebu Pacific': '/images/airline/5J.png',
  '필리핀항공': '/images/airline/PR.png',
  'Philippine Airlines': '/images/airline/PR.png',
  '티웨이항공': '/images/airline/TW.png',
  'Tway Air': '/images/airline/TW.png',
  '에어서울': '/images/airline/RS.png',
  'Air Seoul': '/images/airline/RS.png',
}; 

/**
 * 필리핀 시간대 (Asia/Manila) 기준으로 현재 시간을 가져옵니다.
 */
export function getPhilippineTime(): Date {
  return new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Manila"}));
}

/**
 * 필리핀 시간 기준으로 오늘 날짜를 YYYY-MM-DD 형식으로 반환합니다.
 */
export function getPhilippineDate(): string {
  const phTime = getPhilippineTime();
  return phTime.toISOString().split('T')[0];
}

/**
 * 필리핀 시간 기준으로 현재 시간이 오전 9시인지 확인합니다.
 */
export function isPhilippineTime9AM(): boolean {
  const phTime = getPhilippineTime();
  return phTime.getHours() === 9 && phTime.getMinutes() < 5; // 5분 여유
}

/**
 * 필리핀 시간 기준으로 오늘 환율이 이미 업데이트되었는지 확인합니다.
 */
export function isTodayExchangeRateUpdated(): boolean {
  const phTime = getPhilippineTime();
  const today = phTime.toISOString().split('T')[0];
  
  // 로컬 스토리지에서 확인 (클라이언트 사이드에서만)
  if (typeof window !== 'undefined') {
    const lastUpdate = localStorage.getItem('lastExchangeRateUpdate');
    return lastUpdate === today;
  }
  
  return false;
}

/**
 * 환율 업데이트 완료를 기록합니다.
 */
export function markExchangeRateUpdated(): void {
  if (typeof window !== 'undefined') {
    const today = getPhilippineDate();
    localStorage.setItem('lastExchangeRateUpdate', today);
  }
} 