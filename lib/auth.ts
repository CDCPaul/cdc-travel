import { onAuthStateChanged, User, getIdToken, onIdTokenChanged } from 'firebase/auth';
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
 * API 호출 전 토큰을 강제로 갱신하는 함수
 * @returns Promise<string | null> - 갱신된 토큰 또는 null
 */
export const forceRefreshTokenForAPI = async (): Promise<string | null> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn('사용자가 로그인되어 있지 않습니다.');
      return null;
    }

    console.log('토큰 강제 갱신 시작...');
    
    // 강제로 새 토큰 가져오기
    const idToken = await getIdToken(user, true);
    
    // 갱신된 토큰을 즉시 쿠키에 저장
    setAuthCookie(idToken);
    
    // 갱신 성공 확인을 위해 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('API 호출을 위해 토큰을 강제 갱신했습니다.');
    return idToken;
  } catch (error) {
    console.error('API용 토큰 갱신 실패:', error);
    return null;
  }
};

/**
 * 토큰 자동 갱신을 설정하는 함수
 */
export const setupTokenRefresh = () => {
  console.log('🔐 토큰 자동 갱신 설정 시작...');
  
  // 토큰 만료 10분 전에 자동 갱신 (더 여유있게)
  const REFRESH_THRESHOLD = 10 * 60 * 1000; // 10분
  let isInitialSetup = true; // 초기 설정 플래그
  let lastRefreshTime = 0; // 마지막 갱신 시간
  
  const checkAndRefreshToken = async () => {
    const user = auth.currentUser;
    if (!user) {
      console.log('❌ 현재 로그인된 사용자가 없습니다.');
      return;
    }

    try {
      console.log('🔄 토큰 상태 확인 중...');
      
      // Firebase ID Token 만료 시간 확인
      const idTokenResult = await user.getIdTokenResult();
      const expirationTime = new Date(idTokenResult.expirationTime).getTime();
      const now = Date.now();
      const timeUntilExpiry = expirationTime - now;

      console.log(`⏰ ID Token 만료까지: ${Math.round(timeUntilExpiry / 1000 / 60)}분`);

      // 만료 10분 전이면 갱신 (단, 마지막 갱신 후 3분 이내면 건너뛰기)
      if (timeUntilExpiry < REFRESH_THRESHOLD && (now - lastRefreshTime) > 3 * 60 * 1000) {
        console.log('🔄 ID Token이 곧 만료됩니다. 갱신을 시도합니다...');
        
        // Firebase ID Token 강제 갱신
        const newIdToken = await getIdToken(user, true);
        
        // 갱신된 토큰을 즉시 쿠키에 저장
        setAuthCookie(newIdToken);
        lastRefreshTime = now;
        
        // 갱신 성공 확인을 위해 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('✅ Firebase ID Token이 자동으로 갱신되었습니다.');
        
        // Google Access Token도 함께 갱신 시도
        try {
          const { TokenManager } = await import('./token-manager');
          const newAccessToken = await TokenManager.refreshToken();
          if (newAccessToken) {
            console.log('✅ Google Access Token도 갱신되었습니다.');
            setGoogleAccessTokenCookie(newAccessToken); // 갱신된 토큰을 쿠키에 저장
          }
        } catch (error) {
          console.warn('⚠️ Google Access Token 갱신 실패:', error);
        }
      } else if (timeUntilExpiry < REFRESH_THRESHOLD) {
        console.log('⏸️ 토큰 갱신이 최근에 수행되어 건너뜁니다.');
      } else {
        console.log('✅ 토큰이 아직 유효합니다.');
      }
    } catch (error) {
      console.error('❌ 토큰 갱신 실패:', error);
      
      // 토큰 갱신 실패 시 fallback: 강제로 새 토큰 요청
      try {
        console.log('🔄 Fallback: 강제 토큰 갱신 시도...');
        const user = auth.currentUser;
        if (user) {
          const newIdToken = await getIdToken(user, true);
          setAuthCookie(newIdToken);
          lastRefreshTime = Date.now();
          
          // 갱신 성공 확인을 위해 잠시 대기
          await new Promise(resolve => setTimeout(resolve, 100));
          
          console.log('✅ Fallback 토큰 갱신 성공');
        }
      } catch (fallbackError) {
        console.error('❌ Fallback 토큰 갱신도 실패:', fallbackError);
      }
    }
  };

  // 초기 체크 (설정 직후에는 건너뛰기)
  console.log('🚀 초기 토큰 상태 확인...');
  setTimeout(() => {
    checkAndRefreshToken();
    isInitialSetup = false;
  }, 1000); // 1초 후에 첫 체크

  // 2분마다 토큰 상태 확인 (더 자주 체크)
  const intervalId = setInterval(() => {
    if (!isInitialSetup) {
      console.log('⏰ 정기 토큰 상태 확인...');
      checkAndRefreshToken();
    }
  }, 2 * 60 * 1000);

  // onIdTokenChanged 리스너 (토큰이 변경될 때)
  const unsubscribe = onIdTokenChanged(auth, async (user) => {
    if (user) {
      try {
        console.log('🔄 Firebase ID Token이 변경되었습니다.');
        const idToken = await getIdToken(user);
        setAuthCookie(idToken);
        console.log('✅ 토큰이 변경되어 쿠키를 업데이트했습니다.');
      } catch (error) {
        console.error('❌ 토큰 쿠키 업데이트 실패:', error);
      }
    } else {
      console.log('🚪 사용자가 로그아웃되었습니다. 쿠키를 제거합니다.');
      removeAuthCookie();
      removeGoogleAccessTokenCookie(); // 로그아웃 시 Google Access Token 쿠키도 제거
    }
  });

  console.log('✅ 토큰 자동 갱신 설정이 완료되었습니다.');

  // 클린업 함수 반환
  return () => {
    console.log('🧹 토큰 갱신 설정을 정리합니다.');
    clearInterval(intervalId);
    unsubscribe();
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

/**
 * 현재 인증 상태를 확인하고 토큰을 갱신하는 함수
 */
export const checkAndRefreshAuth = async (): Promise<{ user: User | null; token: string | null }> => {
  const user = auth.currentUser;
  
  if (!user) {
    console.log('사용자가 로그인되어 있지 않습니다.');
    return { user: null, token: null };
  }

  try {
    console.log('현재 사용자:', user.email);
    
    // 토큰 갱신 시도
    const token = await getIdToken(user, true);
    setAuthCookie(token);
    
    console.log('토큰 갱신 완료');
    return { user, token };
  } catch (error) {
    console.error('토큰 갱신 실패:', error);
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
    // 강제로 토큰 갱신
    const newIdToken = await getIdToken(user, true);
    setAuthCookie(newIdToken);
    console.log('✅ 테스트: Firebase ID Token 갱신 성공');

    // Google Access Token도 갱신 시도
    const { TokenManager } = await import('./token-manager');
    const newAccessToken = await TokenManager.refreshToken();
    if (newAccessToken) {
      setGoogleAccessTokenCookie(newAccessToken);
      console.log('✅ 테스트: Google Access Token 갱신 성공');
    }

    console.log('✅ 토큰 갱신 테스트 완료');
  } catch (error) {
    console.error('❌ 토큰 갱신 테스트 실패:', error);
  }
}; 