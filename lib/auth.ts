import { onAuthStateChanged, User, getIdToken } from 'firebase/auth';
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
  
  // 개발 환경에서는 secure를 제거하고, samesite를 lax로 설정
  const isDev = process.env.NODE_ENV === 'development';
  const secureFlag = isDev ? '' : '; secure';
  const sameSiteFlag = isDev ? '; samesite=lax' : '; samesite=strict';
  
  document.cookie = `idToken=${idToken}; expires=${expires.toUTCString()}; path=/${secureFlag}${sameSiteFlag}`;
  console.log('쿠키 설정됨:', `idToken=${idToken.substring(0, 20)}...`);
};

/**
 * Google Access Token을 쿠키에 저장하는 함수
 * @param accessToken - Google Access Token
 */
export const setGoogleAccessTokenCookie = (accessToken: string) => {
  // 1시간간 유효한 쿠키 설정 (Google Access Token은 1시간 후 만료)
  const expires = new Date();
  expires.setHours(expires.getHours() + 1);
  
  // 개발 환경에서는 secure를 제거하고, samesite를 lax로 설정
  const isDev = process.env.NODE_ENV === 'development';
  const secureFlag = isDev ? '' : '; secure';
  const sameSiteFlag = isDev ? '; samesite=lax' : '; samesite=strict';
  
  document.cookie = `googleAccessToken=${accessToken}; expires=${expires.toUTCString()}; path=/${secureFlag}${sameSiteFlag}`;
  console.log('🍪 Google Access Token 쿠키 설정됨:', `googleAccessToken=${accessToken.substring(0, 20)}...`);
};

/**
 * 토큰을 갱신하고 쿠키에 저장하는 함수
 * @param forceRefresh - 강제로 새 토큰을 가져올지 여부
 * @returns Promise<string | null> - 갱신된 토큰 또는 null
 */
export const refreshToken = async (forceRefresh: boolean = false): Promise<string | null> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn('사용자가 로그인되어 있지 않습니다.');
      return null;
    }

    const idToken = await getIdToken(user, forceRefresh);
    setAuthCookie(idToken);
    return idToken;
  } catch (error) {
    console.error('토큰 갱신 실패:', error);
    return null;
  }
};

/**
 * 토큰 자동 갱신을 설정하는 함수 (간소화됨)
 * Firebase SDK는 내부적으로 토큰을 자동으로 갱신하므로 별도 설정이 불필요
 */
export const setupTokenRefresh = () => {
  console.log('🔐 토큰 자동 갱신은 Firebase SDK가 처리하므로 별도 설정이 불필요합니다.');
  
  // 정리 함수 반환 (아무것도 하지 않음)
  return () => {
    console.log('🧹 토큰 갱신 설정 정리 (불필요)');
  };
};

/**
 * 쿠키에서 ID 토큰을 제거하는 함수
 */
export const removeAuthCookie = () => {
  document.cookie = 'idToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
};

/**
 * Google Access Token 쿠키를 제거하는 함수
 */
export const removeGoogleAccessTokenCookie = () => {
  document.cookie = 'googleAccessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  console.log('🍪 Google Access Token 쿠키 제거됨');
};

/**
 * 인증 상태를 확인하는 함수 (개선됨)
 * @returns Promise<User | null> - 인증된 사용자 또는 null
 */
export const checkAuth = async (): Promise<User | null> => {
  // 1. 먼저 현재 사용자 확인 (즉시 반환)
  const currentUser = auth.currentUser;
  if (currentUser) {
    console.log('✅ checkAuth: 현재 사용자 확인됨', currentUser.email);
    return currentUser;
  }

  // 2. 현재 사용자가 없으면 인증 상태 변경 대기
  console.log('⏳ checkAuth: 인증 상태 변경 대기 중...');
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      console.log('✅ checkAuth: 인증 상태 확인 완료', user?.email || '로그아웃');
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

/**
 * 현재 인증 상태를 확인하고 토큰을 갱신하는 함수 (간소화됨)
 */
export const checkAndRefreshAuth = async (): Promise<{ user: User | null; token: string | null }> => {
  const user = auth.currentUser;
  
  if (!user) {
    console.log('사용자가 로그인되어 있지 않습니다.');
    return { user: null, token: null };
  }

  try {
    console.log('현재 사용자:', user.email);
    
    // Firebase SDK가 자동으로 토큰을 갱신하므로 강제 갱신은 필요시에만
    const token = await getIdToken(user, false); // 강제 갱신 비활성화
    setAuthCookie(token);
    
    console.log('토큰 확인 완료');
    return { user, token };
  } catch (error) {
    console.error('토큰 확인 실패:', error);
    return { user, token: null };
  }
}; 

/**
 * 개발 환경에서 토큰 갱신을 테스트하는 함수
 */
export const testTokenRefresh = async () => {
  if (process.env.NODE_ENV !== 'development') {
    console.log('❌ 이 함수는 개발 환경에서만 사용할 수 있습니다.');
    return;
  }

  console.log('🧪 토큰 갱신 테스트 시작...');
  const user = auth.currentUser;
  
  if (!user) {
    console.log('❌ 로그인된 사용자가 없습니다.');
    return;
  }

  try {
    // Firebase SDK의 자동 토큰 갱신 사용
    const newIdToken = await getIdToken(user, false);
    setAuthCookie(newIdToken);
    console.log('✅ 테스트: Firebase ID Token 확인 완료');

    console.log('✅ 토큰 갱신 테스트 완료');
  } catch (error) {
    console.error('❌ 토큰 갱신 테스트 실패:', error);
  }
}; 