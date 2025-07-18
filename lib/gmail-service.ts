import { auth } from './firebase';

export interface EmailData {
  to: string;
  subject: string;
  body: string;
  from?: string;
}

/**
 * Gmail API를 사용하여 이메일을 발송하는 함수
 * @param emailData - 이메일 데이터
 * @returns Promise<boolean> - 발송 성공 여부
 */
export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    // 현재 로그인한 사용자 확인
    if (!auth) {
      throw new Error('Firebase 인증이 초기화되지 않았습니다.');
    }
    const user = auth.currentUser;
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    // ID 토큰 가져오기
    const idToken = await user.getIdToken();

    // 서버 API 호출
    const response = await fetch('/api/send-gmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '이메일 발송에 실패했습니다.');
    }

    const result = await response.json();
    console.log('이메일 발송 성공:', result);
    return true;

  } catch (error) {
    console.error('이메일 발송 오류:', error);
    throw error;
  }
}

/**
 * 여러 수신자에게 이메일을 발송하는 함수
 * @param emailData - 이메일 데이터 (to 필드는 쉼표로 구분된 이메일 주소들)
 * @returns Promise<boolean> - 발송 성공 여부
 */
export async function sendBulkEmail(emailData: EmailData): Promise<boolean> {
  try {
    const recipients = emailData.to.split(',').map(email => email.trim());
    
    for (const recipient of recipients) {
      await sendEmail({
        ...emailData,
        to: recipient,
      });
    }

    return true;
  } catch (error) {
    console.error('대량 이메일 발송 오류:', error);
    throw error;
  }
} 