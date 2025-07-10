/**
 * 서버 사이드에서 토큰 검증을 위한 유틸리티 함수들
 * 실제 토큰 검증은 API 라우트를 통해 수행됩니다.
 */

import { getFirestore } from 'firebase-admin/firestore';
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
    const response = await fetch('/api/auth/verify-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.decodedToken;
  } catch (error) {
    console.error('Token verification failed:', error);
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
    return null;
  }

  return await verifyIdToken(idToken);
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