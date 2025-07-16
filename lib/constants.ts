/**
 * Firebase Storage URL 만료일 설정
 * 
 * Firebase Storage의 Signed URL은 최대 7년(2555일)까지 설정 가능합니다.
 * 보안상 권장사항:
 * - 일반 이미지: 1년
 * - 중요 이미지: 6개월
 * - 임시 이미지: 1개월
 */

// URL 만료일 설정 (일 단위)
export const URL_EXPIRY_DAYS = {
  // 일반 이미지 (1년)
  DEFAULT: 365,
  
  // 중요 이미지 (6개월)
  IMPORTANT: 180,
  
  // 임시 이미지 (1개월)
  TEMPORARY: 30,
  
  // 테스트용 (1주일)
  TEST: 7,
  
  // 영구 (최대 7년)
  PERMANENT: 2555
};

// 만료일을 Date 객체로 변환하는 함수
export function getExpiryDate(days: number = URL_EXPIRY_DAYS.DEFAULT): Date {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  return expiryDate;
}

// 만료일을 Firebase 형식으로 변환하는 함수
export function getFirebaseExpiryDate(days: number = URL_EXPIRY_DAYS.DEFAULT): string {
  const expiryDate = getExpiryDate(days);
  return expiryDate.toISOString();
} 