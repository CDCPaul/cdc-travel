// 관리자 이메일 목록 (실제 운영 시에는 환경변수나 데이터베이스에서 관리)
export const ADMIN_EMAILS = [
  'dev@cebudirectclub.com',
  'diana@cebudirectclub.com',
  'airtel@cebudirectclub.com',
  'cebu@cebudirectclub.com',
  'ahn@cebudirectclub.com',
  'nadia@cebudirectclub.com',
  'bohol@cebudirectclub.com',
  'bohol2@cebudirectclub.com',
  'visa@cebudirectclub.com',
  'zeus@cebudirectclub.com',
  'jessiebel@cebudirectclub.com',
  'outbound@cebudirectclub.com',
  'tour@cebudirectclub.com',
  'visa2@cebudirectclub.com',
  'ticket@cebudirectclub.com',
  'air@cebudirectclub.com',
  'ojt@cebudirectclub.com',
];

/**
 * 관리자 권한을 확인하는 함수
 * @param email - 사용자 이메일
 * @returns 관리자 여부
 */
export function isAdmin(email: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
} 