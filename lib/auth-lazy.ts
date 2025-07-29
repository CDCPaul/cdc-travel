/**
 * Firebase 인증 관련 함수들을 lazy import로 처리하는 모듈
 * 성능 최적화를 위해 필요할 때만 로드
 */

// Google 로그인 함수 (lazy import)
export const signInWithGoogle = async () => {
  const { signInWithPopup, setPersistence, browserLocalPersistence, browserSessionPersistence } = await import('firebase/auth');
  const { auth, googleProvider } = await import('./firebase');
  
  return {
    signInWithPopup,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    auth,
    googleProvider
  };
};

// 토큰 관련 함수들 (lazy import)
export const getTokenUtils = async () => {
  const { getIdToken, getIdTokenResult } = await import('firebase/auth');
  const { auth } = await import('./firebase');
  
  return {
    getIdToken,
    getIdTokenResult,
    auth
  };
};

// 로그아웃 함수 (lazy import)
export const getSignOutUtils = async () => {
  const { signOut } = await import('firebase/auth');
  const { auth } = await import('./firebase');
  
  return {
    signOut,
    auth
  };
}; 