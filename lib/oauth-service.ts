import { google } from 'googleapis';
import { getAdminDb } from './firebase-admin';

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
  userId: string;
}

export class OAuthService {
  private static oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  /**
   * 토큰을 Firestore에 저장
   */
  static async saveTokens(userId: string, accessToken: string, refreshToken: string): Promise<void> {
    const db = getAdminDb();
    const expiryDate = Date.now() + (3600 * 1000); // 1시간 후

    await db.collection('oauth_tokens').doc(userId).set({
      accessToken,
      refreshToken,
      expiryDate,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * 저장된 토큰 가져오기
   */
  static async getTokens(userId: string): Promise<TokenData | null> {
    const db = getAdminDb();
    const doc = await db.collection('oauth_tokens').doc(userId).get();
    
    if (!doc.exists) {
      return null;
    }

    return doc.data() as TokenData;
  }

  /**
   * 토큰 갱신
   */
  static async refreshAccessToken(userId: string): Promise<string | null> {
    try {
      const tokens = await this.getTokens(userId);
      if (!tokens || !tokens.refreshToken) {
        return null;
      }

      this.oauth2Client.setCredentials({
        refresh_token: tokens.refreshToken
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      if (credentials.access_token) {
        // 새로운 토큰 저장
        await this.saveTokens(
          userId, 
          credentials.access_token, 
          tokens.refreshToken
        );
        
        return credentials.access_token;
      }

      return null;
    } catch (error) {
      console.error('토큰 갱신 실패:', error);
      return null;
    }
  }

  /**
   * 유효한 Access Token 가져오기 (자동 갱신 포함)
   */
  static async getValidAccessToken(userId: string): Promise<string | null> {
    const tokens = await this.getTokens(userId);
    
    if (!tokens) {
      return null;
    }

    // 토큰이 만료되었는지 확인 (5분 여유)
    const isExpired = Date.now() > (tokens.expiryDate - 5 * 60 * 1000);
    
    if (isExpired) {
      // 토큰 갱신 시도
      const newAccessToken = await this.refreshAccessToken(userId);
      return newAccessToken;
    }

    return tokens.accessToken;
  }

  /**
   * 토큰 삭제
   */
  static async deleteTokens(userId: string): Promise<void> {
    const db = getAdminDb();
    await db.collection('oauth_tokens').doc(userId).delete();
  }
} 