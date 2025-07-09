import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// 관리자 UID 목록 (실제 운영 시에는 환경변수나 데이터베이스에서 관리)
export const ADMIN_UIDS = [
  // Firebase Console에서 확인한 관리자 UID들을 여기에 추가
  // 예: 'user1234567890abcdef'
];

/**
 * Firestore에서 관리자 권한을 확인하는 함수
 * @param uid - 사용자 UID
 * @returns Promise<boolean> - 관리자 여부
 */
export async function checkAdminRole(uid: string | null): Promise<boolean> {
  if (!uid) return false;
  
  try {
    const userDoc = doc(db, 'users', uid);
    const userSnap = await getDoc(userDoc);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData.role === 'admin';
    }
    
    return false;
  } catch (error) {
    console.error('Error checking admin role:', error);
    return false;
  }
}

/**
 * 이메일 기반 관리자 권한 확인 (기존 호환성을 위해 유지)
 * @param email - 사용자 이메일
 * @returns 관리자 여부
 */
export function isAdmin(email: string | null): boolean {
  if (!email) return false;
  
  // 기존 이메일 목록 (점진적 마이그레이션을 위해 유지)
  const ADMIN_EMAILS = [
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
  
  return ADMIN_EMAILS.includes(email);
} 