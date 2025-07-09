import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import { isAdmin as checkIsAdmin, checkAdminRole } from './admin-config';

export const isAdmin = (user: User | null): boolean => {
  if (!user || !user.email) return false;
  return checkIsAdmin(user.email);
};

/**
 * UID 기반 관리자 권한 확인 함수
 * @param user - Firebase User 객체
 * @returns Promise<boolean> - 관리자 여부
 */
export const isAdminByUid = async (user: User | null): Promise<boolean> => {
  if (!user || !user.uid) return false;
  return await checkAdminRole(user.uid);
};

/**
 * ID 토큰을 쿠키에 저장하는 함수
 * @param idToken - Firebase ID 토큰
 */
export const setAuthCookie = (idToken: string) => {
  // 7일간 유효한 쿠키 설정
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  
  document.cookie = `idToken=${idToken}; expires=${expires.toUTCString()}; path=/; secure; samesite=strict`;
};

/**
 * 쿠키에서 ID 토큰을 제거하는 함수
 */
export const removeAuthCookie = () => {
  document.cookie = 'idToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
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
 * 관리자 권한을 확인하는 함수 (UID 기반)
 * @returns Promise<{user: User | null, isAdmin: boolean}> - 사용자와 관리자 상태
 */
export const checkAdminAuth = async (): Promise<{user: User | null, isAdmin: boolean}> => {
  const user = await checkAuth();
  const isAdmin = user ? await isAdminByUid(user) : false;
  return {
    user,
    isAdmin
  };
};

export const requireAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

export const requireAdmin = (callback: (user: User | null, isAdmin: boolean) => void) => {
  return onAuthStateChanged(auth, async (user) => {
    const adminStatus = user ? await isAdminByUid(user) : false;
    callback(user, adminStatus);
  });
}; 