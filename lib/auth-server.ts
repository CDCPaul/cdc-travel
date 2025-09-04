/**
 * 서버 사이드 Firebase 인증 헬퍼
 * Firebase Admin SDK를 사용한 표준 토큰 검증
 */

import { NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { app } from './firebase-admin';

// Firebase Admin Auth 인스턴스
const adminAuth = getAuth(app || undefined);

export interface AuthResult {
  success: boolean;
  user?: {
    uid: string;
    email: string;
    emailVerified: boolean;
  };
  error?: string;
}

/**
 * Request에서 Firebase ID 토큰을 추출
 */
function extractTokenFromRequest(request: NextRequest): string | null {
  // 1. Authorization 헤더에서 확인 (표준 방식)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '');
  }

  // 2. 쿠키에서 확인 (fallback)
  const cookieToken = request.cookies.get('idToken')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

/**
 * Firebase Admin SDK를 사용한 ID 토큰 검증
 * 표준 Firebase 방식 - 만료 시간 자동 확인
 */
export async function verifyFirebaseToken(request: NextRequest): Promise<AuthResult> {
  try {
    // 1. 토큰 추출
    const idToken = extractTokenFromRequest(request);
    
    if (!idToken) {
      return {
        success: false,
        error: 'No authentication token found'
      };
    }

    // 2. Firebase Admin SDK로 토큰 검증
    // 자동으로 만료 시간, 서명, 발행자 등 모든 것을 검증
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    return {
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        emailVerified: decodedToken.email_verified || false,
      }
    };

  } catch (error: unknown) {
    console.error('Firebase 토큰 검증 실패:', error);

    // Firebase 에러 코드에 따른 구체적인 메시지
    let errorMessage = 'Authentication failed';
    
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as { code: string };
      
      if (firebaseError.code === 'auth/id-token-expired') {
        errorMessage = 'Token has expired';
      } else if (firebaseError.code === 'auth/invalid-id-token') {
        errorMessage = 'Invalid token format';
      } else if (firebaseError.code === 'auth/user-disabled') {
        errorMessage = 'User account has been disabled';
      }
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * API 라우트에서 사용할 인증 미들웨어 (함수형)
 * 401 응답을 자동으로 처리
 */
export async function requireAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: NonNullable<AuthResult['user']>) => Promise<Response>
): Promise<Response>;

/**
 * API 라우트에서 사용할 인증 미들웨어 (HOF)
 * 401 응답을 자동으로 처리
 */
export function requireAuth<T extends Record<string, unknown>>(
  handler: (request: NextRequest, context: T & { user: NonNullable<AuthResult['user']> }) => Promise<Response>
): (request: NextRequest, context?: T) => Promise<Response>;

// 구현부
export function requireAuth<T extends Record<string, unknown>>(
  requestOrHandler: NextRequest | ((request: NextRequest, context: T & { user: NonNullable<AuthResult['user']> }) => Promise<Response>),
  handler?: (request: NextRequest, user: NonNullable<AuthResult['user']>) => Promise<Response>
): Promise<Response> | ((request: NextRequest, context?: T) => Promise<Response>) {
  // 첫 번째 매개변수가 함수인 경우 (HOF 방식)
  if (typeof requestOrHandler === 'function') {
    const wrappedHandler = requestOrHandler;
    return async (request: NextRequest, context: T = {} as T) => {
      const authResult = await verifyFirebaseToken(request);

      if (!authResult.success) {
        console.log('🔒 API 인증 실패:', authResult.error);
        
        return new Response(
          JSON.stringify({ 
            error: authResult.error,
            code: 'AUTHENTICATION_FAILED' 
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('✅ API 인증 성공:', authResult.user?.email);
      return await wrappedHandler(request, { ...context, user: authResult.user! });
    };
  }

  // 첫 번째 매개변수가 NextRequest인 경우 (기존 방식)
  const request = requestOrHandler;
  if (!handler) {
    throw new Error('Handler function is required');
  }

  return (async () => {
    const authResult = await verifyFirebaseToken(request);

    if (!authResult.success) {
      console.log('🔒 API 인증 실패:', authResult.error);
      
      return new Response(
        JSON.stringify({ 
          error: authResult.error,
          code: 'AUTHENTICATION_FAILED' 
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ API 인증 성공:', authResult.user?.email);
    return await handler(request, authResult.user!);
  })();
}

/**
 * 관리자 권한까지 확인하는 미들웨어
 */
export async function requireAdminAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: NonNullable<AuthResult['user']>) => Promise<Response>
): Promise<Response> {
  const authResult = await verifyFirebaseToken(request);

  if (!authResult.success) {
    return new Response(
      JSON.stringify({ 
        error: authResult.error,
        code: 'AUTHENTICATION_FAILED' 
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // 관리자 권한 확인 (기존 로직 재사용)
  const { isAdmin } = await import('./admin-config');
  if (!isAdmin(authResult.user?.email || '')) {
    return new Response(
      JSON.stringify({ 
        error: 'Admin access required',
        code: 'INSUFFICIENT_PERMISSIONS' 
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  console.log('✅ 관리자 인증 성공:', authResult.user?.email);
  return await handler(request, authResult.user!);
}

/**
 * 쿠키에서 ID 토큰을 검증 (하위호환성)
 */
export async function verifyIdTokenFromCookies(cookies: { get: (name: string) => { value?: string } | undefined }): Promise<{ uid: string; email: string; emailVerified: boolean }> {
  const token = cookies.get('firebase-token')?.value;
  if (!token) {
    throw new Error('인증 토큰이 없습니다.');
  }
  
  const decodedToken = await adminAuth.verifyIdToken(token);
  return {
    uid: decodedToken.uid,
    email: decodedToken.email || '',
    emailVerified: decodedToken.email_verified || false
  };
}