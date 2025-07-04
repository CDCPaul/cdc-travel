import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';

// 관리자 이메일 목록 (실제 운영 시에는 환경변수나 데이터베이스에서 관리)
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
  // 여기에 추가 관리자 이메일을 입력하세요
];

export const isAdmin = (user: User | null): boolean => {
  if (!user || !user.email) return false;
  return ADMIN_EMAILS.includes(user.email);
};

/**
 * 인증 상태를 확인하는 함수
 * @returns Promise<User | null> - 인증된 사용자 또는 null
 */
export const checkAuth = async (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

/**
 * 관리자 권한을 확인하는 함수
 * @returns Promise<{user: User | null, isAdmin: boolean}> - 사용자와 관리자 상태
 */
export const checkAdminAuth = async (): Promise<{user: User | null, isAdmin: boolean}> => {
  const user = await checkAuth();
  return {
    user,
    isAdmin: isAdmin(user)
  };
};

export const requireAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

export const requireAdmin = (callback: (user: User | null, isAdmin: boolean) => void) => {
  return onAuthStateChanged(auth, (user) => {
    const adminStatus = isAdmin(user);
    callback(user, adminStatus);
  });
}; 