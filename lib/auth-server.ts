/**
 * 서버 사이드에서 토큰 검증을 위한 유틸리티 함수들
 * 실제 토큰 검증은 API 라우트를 통해 수행됩니다.
 */

import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from './firebase-admin';

export interface DecodedToken {
  email: string | null;
  uid: string;
  email_verified: boolean;
  auth_time: number;
  iat: number;
  exp: number;
}

/**
 * API를 통해 토큰을 검증하는 함수
 * @param idToken - Firebase ID 토큰
 * @returns 검증된 토큰 정보 또는 null
 */
export async function verifyIdToken(idToken: string): Promise<DecodedToken | null> {
  try {
    // 서버 사이드에서는 Firebase Admin SDK를 직접 사용
    const auth = getAuth(initializeFirebaseAdmin());
    const decodedToken = await auth.verifyIdToken(idToken);
    
    return {
      email: decodedToken.email || null,
      uid: decodedToken.uid,
      email_verified: decodedToken.email_verified || false,
      auth_time: decodedToken.auth_time,
      iat: decodedToken.iat,
      exp: decodedToken.exp
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    
    // 토큰 만료 오류를 특별히 처리
    if (error instanceof Error) {
      if (error.message.includes('auth/id-token-expired')) {
        console.error('토큰이 만료되었습니다. 클라이언트에서 토큰 갱신이 필요합니다.');
      } else if (error.message.includes('auth/id-token-revoked')) {
        console.error('토큰이 취소되었습니다. 사용자가 다시 로그인해야 합니다.');
      } else {
        console.error('토큰 검증 실패:', error.message);
      }
    }
    
    return null;
  }
}

/**
 * 쿠키에서 ID 토큰을 가져와서 검증하는 함수
 * @param cookies - 요청의 쿠키 객체
 * @returns 검증된 토큰 정보 또는 null
 */
export async function verifyIdTokenFromCookies(cookies: { get: (name: string) => { value: string } | undefined }): Promise<DecodedToken | null> {
  const idToken = cookies.get('idToken')?.value;
  
  if (!idToken) {
    console.error('쿠키에서 idToken을 찾을 수 없습니다.');
    console.log('사용 가능한 쿠키:', Object.keys(cookies));
    return null;
  }

  console.log('토큰 검증 시도:', idToken.substring(0, 20) + '...');
  console.log('토큰 길이:', idToken.length);
  
  try {
    const result = await verifyIdToken(idToken);
    if (result) {
      console.log('토큰 검증 성공:', result.email);
      console.log('토큰 만료 시간:', new Date(result.exp * 1000).toLocaleString());
      console.log('현재 시간:', new Date().toLocaleString());
      console.log('토큰 만료까지 남은 시간:', Math.round((result.exp * 1000 - Date.now()) / 1000 / 60), '분');
    } else {
      console.log('토큰 검증 실패');
    }
    return result;
  } catch (error) {
    console.error('토큰 검증 중 오류 발생:', error);
    return null;
  }
}

/**
 * Firestore에서 이메일로 관리자 권한을 확인
 * @param email 사용자 이메일
 * @returns Promise<boolean> (role === 'admin'이면 true)
 */
export async function isAdminByEmail(email: string): Promise<boolean> {
  if (!email) return false;
  const db = getFirestore(initializeFirebaseAdmin());
  const userDoc = await db.collection('users').doc(email).get();
  if (!userDoc.exists) return false;
  const data = userDoc.data();
  return data?.role === 'admin';
} 