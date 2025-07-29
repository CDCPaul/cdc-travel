'use client';

export class TokenManager {
  /**
   * 클라이언트 사이드 토큰 관리가 더 이상 필요하지 않습니다.
   * 서버 사이드에서만 토큰을 관리합니다.
   */
  
  /**
   * 토큰 만료 시간 저장 (더 이상 사용되지 않음)
   */
  static setTokenExpiry(): void {
    console.log('ℹ️ 클라이언트 사이드 토큰 관리가 비활성화되었습니다.');
  }

  /**
   * 토큰 만료 확인 (더 이상 사용되지 않음)
   */
  static isTokenExpiringSoon(): boolean {
    console.log('ℹ️ 클라이언트 사이드 토큰 관리가 비활성화되었습니다.');
    return false;
  }

  /**
   * 토큰 갱신 시도 (더 이상 사용되지 않음)
   */
  static async refreshToken(): Promise<string | null> {
    console.log('ℹ️ 클라이언트 사이드 토큰 갱신이 비활성화되었습니다. 서버에서 자동으로 처리됩니다.');
    return null;
  }

  /**
   * 유효한 토큰 가져오기 (더 이상 사용되지 않음)
   */
  static async getValidToken(): Promise<string | null> {
    console.log('ℹ️ 클라이언트 사이드 토큰 관리가 비활성화되었습니다. 서버에서 자동으로 처리됩니다.');
    return null;
  }
} 