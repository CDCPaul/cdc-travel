/**
 * Gmail API 전용 토큰 관리자
 * Firebase 인증과 별도로 Gmail API용 OAuth 토큰을 관리
 */
import { google } from 'googleapis';
import { getAdminDb } from './firebase-admin';

interface GmailTokenData {
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
  userId: string;
  scope: string[];
}

export class GmailTokenManager {
  private static oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/gmail/callback`
  );

  /**
   * Gmail OAuth URL 생성 (서버사이드에서만 실행)
   */
  static generateAuthUrl(userId: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline', // ← 중요: refresh token을 받기 위함
      prompt: 'consent', // ← 중요: 매번 동의 화면으로 refresh token 받기
      scope: [
        'https://www.googleapis.com/auth/gmail.compose',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      state: userId // 사용자 ID를 state로 전달
    });
  }

  /**
   * Gmail 토큰을 Firestore에 저장
   */
  static async saveGmailTokens(
    userId: string, 
    accessToken: string, 
    refreshToken: string,
    expiresIn: number = 3600
  ): Promise<void> {
    const db = getAdminDb();
    const expiryDate = Date.now() + (expiresIn * 1000);

    await db.collection('gmail_tokens').doc(userId).set({
      accessToken,
      refreshToken,
      expiryDate,
      userId,
      scope: [
        'https://www.googleapis.com/auth/gmail.compose',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify'
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`✅ Gmail 토큰 저장 완료: ${userId}`);
  }

  /**
   * 저장된 Gmail 토큰 가져오기
   */
  static async getGmailTokens(userId: string): Promise<GmailTokenData | null> {
    const db = getAdminDb();
    const doc = await db.collection('gmail_tokens').doc(userId).get();
    
    if (!doc.exists) {
      return null;
    }

    return doc.data() as GmailTokenData;
  }

  /**
   * Gmail Access Token 갱신
   */
  static async refreshGmailToken(userId: string): Promise<string | null> {
    try {
      const tokens = await this.getGmailTokens(userId);
      if (!tokens || !tokens.refreshToken) {
        console.warn(`❌ ${userId}의 Gmail refresh token이 없습니다.`);
        return null;
      }

      this.oauth2Client.setCredentials({
        refresh_token: tokens.refreshToken
      });

      console.log(`🔄 Gmail 토큰 갱신 시도: ${userId}`);
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      if (credentials.access_token) {
        // 새로운 토큰 저장 (기존 refresh token 유지)
        await this.saveGmailTokens(
          userId, 
          credentials.access_token, 
          tokens.refreshToken,
          credentials.expiry_date ? Math.floor((credentials.expiry_date - Date.now()) / 1000) : 3600
        );
        
        console.log(`✅ Gmail 토큰 갱신 성공: ${userId}`);
        return credentials.access_token;
      }

      return null;
    } catch (error) {
      console.error(`❌ Gmail 토큰 갱신 실패 (${userId}):`, error);
      return null;
    }
  }

  /**
   * 유효한 Gmail Access Token 가져오기 (자동 갱신 포함)
   */
  static async getValidGmailToken(userId: string): Promise<{ 
    token: string | null; 
    needsReauth: boolean 
  }> {
    const tokens = await this.getGmailTokens(userId);
    
    if (!tokens) {
      console.warn(`❌ ${userId}의 Gmail 토큰이 존재하지 않습니다.`);
      return { token: null, needsReauth: true };
    }

    // 토큰이 만료되었는지 확인 (5분 여유)
    const isExpired = Date.now() > (tokens.expiryDate - 5 * 60 * 1000);
    
    if (isExpired) {
      console.log(`⏰ Gmail 토큰이 만료됨. 갱신 시도: ${userId}`);
      // 토큰 갱신 시도
      const newAccessToken = await this.refreshGmailToken(userId);
      
      if (!newAccessToken) {
        console.error(`❌ Gmail 토큰 갱신 실패. 재인증 필요: ${userId}`);
        return { token: null, needsReauth: true };
      }
      
      return { token: newAccessToken, needsReauth: false };
    }

    console.log(`✅ 유효한 Gmail 토큰 확인: ${userId}`);
    return { token: tokens.accessToken, needsReauth: false };
  }

  /**
   * Gmail 토큰 삭제
   */
  static async deleteGmailTokens(userId: string): Promise<void> {
    const db = getAdminDb();
    await db.collection('gmail_tokens').doc(userId).delete();
    console.log(`🗑️ Gmail 토큰 삭제 완료: ${userId}`);
  }

  /**
   * 사용자가 Gmail 권한을 승인했는지 확인
   */
  static async hasGmailPermission(userId: string): Promise<boolean> {
    const tokens = await this.getGmailTokens(userId);
    return tokens !== null && tokens.refreshToken !== null;
  }
}


