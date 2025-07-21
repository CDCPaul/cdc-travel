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
      if (!auth.currentUser) {
        throw new Error('사용자가 로그인되지 않았습니다.');
      }

      // 새로운 팝업으로 로그인하여 토큰 갱신
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (accessToken) {
        this.setTokenExpiry();
        return accessToken;
      }

      return null;
    } catch (error) {
      console.error('토큰 갱신 실패:', error);
      return null;
    }
  }

  /**
   * 유효한 토큰 가져오기 (자동 갱신 포함)
   */
  static async getValidToken(): Promise<string | null> {
    // 토큰이 곧 만료되면 갱신 시도
    if (this.isTokenExpiringSoon()) {
      const newToken = await this.refreshToken();
      if (newToken) {
        return newToken;
      }
    }

    // 쿠키에서 기존 토큰 확인
    const cookies = document.cookie.split(';');
    const googleTokenCookie = cookies.find(cookie => 
      cookie.trim().startsWith('googleAccessToken=')
    );

    if (googleTokenCookie) {
      const token = googleTokenCookie.split('=')[1];
      return decodeURIComponent(token);
    }

    return null;
  }

  /**
   * 토큰 정보 초기화
   */
  static clearTokenInfo(): void {
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
  }
} 