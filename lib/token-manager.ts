'use client';

import { auth, googleProvider } from './firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export class TokenManager {
  private static readonly TOKEN_EXPIRY_KEY = 'google_token_expiry';
  private static readonly TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5분

  /**
   * 토큰 만료 시간 저장
   */
  static setTokenExpiry(): void {
    const expiryTime = Date.now() + (3600 * 1000); // 1시간 후
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
  }

  /**
   * 토큰이 곧 만료되는지 확인
   */
  static isTokenExpiringSoon(): boolean {
    const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiryTime) return true;

    const expiry = parseInt(expiryTime);
    const now = Date.now();
    
    return (expiry - now) < this.TOKEN_REFRESH_THRESHOLD;
  }

  /**
   * 토큰이 만료되었는지 확인
   */
  static isTokenExpired(): boolean {
    const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiryTime) return true;

    const expiry = parseInt(expiryTime);
    return Date.now() > expiry;
  }

  /**
   * 토큰 갱신 시도
   */
  static async refreshToken(): Promise<string | null> {
    try {
      console.log('🔄 Google Access Token 갱신 시도...');
      
      if (!auth.currentUser) {
        console.log('❌ 사용자가 로그인되지 않았습니다.');
        throw new Error('사용자가 로그인되지 않았습니다.');
      }

      console.log('✅ 현재 사용자 확인됨:', auth.currentUser.email);

      // 새로운 팝업으로 로그인하여 토큰 갱신
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (accessToken) {
        console.log('✅ Google Access Token 갱신 성공');
        this.setTokenExpiry();
        
        // 갱신된 토큰을 쿠키에도 저장
        const { setGoogleAccessTokenCookie } = await import('./auth');
        setGoogleAccessTokenCookie(accessToken);
        
        return accessToken;
      } else {
        console.log('❌ Google Access Token을 가져올 수 없습니다.');
        return null;
      }
    } catch (error) {
      console.error('❌ Google Access Token 갱신 실패:', error);
      return null;
    }
  }

  /**
   * 유효한 토큰 가져오기 (자동 갱신 포함)
   */
  static async getValidToken(): Promise<string | null> {
    console.log('🔍 유효한 Google Access Token 확인 중...');
    
    // 토큰이 곧 만료되면 갱신 시도
    if (this.isTokenExpiringSoon()) {
      console.log('⚠️ 토큰이 곧 만료됩니다. 갱신을 시도합니다...');
      const newToken = await this.refreshToken();
      if (newToken) {
        console.log('✅ 토큰 갱신 완료');
        return newToken;
      } else {
        console.log('❌ 토큰 갱신 실패');
      }
    }

    // 쿠키에서 기존 토큰 확인
    const cookies = document.cookie.split(';');
    const googleTokenCookie = cookies.find(cookie => 
      cookie.trim().startsWith('googleAccessToken=')
    );

    if (googleTokenCookie) {
      const token = googleTokenCookie.split('=')[1];
      console.log('✅ 쿠키에서 Google Access Token 발견');
      return decodeURIComponent(token);
    }

    console.log('❌ 유효한 Google Access Token을 찾을 수 없습니다.');
    return null;
  }

  /**
   * 토큰 정보 초기화
   */
  static clearTokenInfo(): void {
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
  }
} 