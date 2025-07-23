import { auth } from './firebase';
import { getIdToken } from 'firebase/auth';

/**
 * 인증 토큰을 포함한 API 요청을 보내는 함수
 * @param url - API 엔드포인트
 * @param options - fetch 옵션
 * @returns Promise<Response>
 */
export const authenticatedRequest = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('사용자가 로그인되어 있지 않습니다.');
    }

    // 토큰 가져오기 (강제 갱신 포함)
    const idToken = await getIdToken(user, true);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
        ...options.headers,
      },
    });

    // 401 에러인 경우 토큰을 다시 갱신하고 재시도
    if (response.status === 401) {
      console.log('토큰이 만료되었습니다. 토큰을 갱신합니다...');
      const newToken = await getIdToken(user, true);
      
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${newToken}`,
          ...options.headers,
        },
      });

      if (retryResponse.status === 401) {
        // 여전히 401이면 로그인 페이지로 리다이렉트
        window.location.href = '/admin/login';
        throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
      }

      return retryResponse;
    }

    return response;
  } catch (error) {
    console.error('인증된 API 요청 실패:', error);
    throw error;
  }
};

/**
 * 인증된 POST 요청
 * @param url - API 엔드포인트
 * @param body - 요청 본문
 * @returns Promise<Response>
 */
export const authenticatedPost = async (
  url: string, 
  body: unknown
): Promise<Response> => {
  return authenticatedRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

/**
 * 인증된 GET 요청
 * @param url - API 엔드포인트
 * @returns Promise<Response>
 */
export const authenticatedGet = async (url: string): Promise<Response> => {
  return authenticatedRequest(url, {
    method: 'GET',
  });
};

/**
 * 사용자 활동을 기록하는 함수
 * @param action - 활동 유형
 * @param details - 활동 상세 정보
 * @param userId - 사용자 ID (선택사항)
 * @param userEmail - 사용자 이메일 (선택사항)
 */
export const logUserActivity = async (
  action: string,
  details: string,
  userId?: string,
  userEmail?: string
) => {
  try {
    const response = await authenticatedPost('/api/users/activity', {
      action,
      details,
      userId,
      userEmail,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('활동 기록 실패:', errorData.error);
    }
  } catch (error) {
    console.error('활동 기록 중 오류 발생:', error);
  }
}; 