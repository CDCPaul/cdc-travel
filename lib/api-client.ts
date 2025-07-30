import { auth } from './firebase';
import { getIdToken } from 'firebase/auth';

interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * API 요청을 보내는 함수 (토큰 자동 갱신 포함)
 * @param url - API 엔드포인트
 * @param options - fetch 옵션
 * @returns Promise<ApiResponse<T>>
 */
export const apiRequest = async <T = unknown>(
  url: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    // 현재 사용자의 ID 토큰 가져오기 (자동 갱신 포함)
    let headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const user = auth.currentUser;
    if (user) {
      try {
        // 토큰을 가져올 때 강제 갱신을 시도 (만료된 경우 자동 갱신)
        const idToken = await getIdToken(user, true); // 강제 갱신 활성화로 다시 변경
        headers = {
          ...headers,
          'Authorization': `Bearer ${idToken}`,
        };
        console.log('🔐 API 요청: 토큰 포함됨', user.email);
      } catch (error) {
        console.error('❌ 토큰 가져오기 실패:', error);
        // 토큰 갱신 실패 시 재시도
        try {
          console.log('🔄 토큰 재시도 중...');
          const idToken = await getIdToken(user, false);
          headers = {
            ...headers,
            'Authorization': `Bearer ${idToken}`,
          };
          console.log('✅ 토큰 재시도 성공');
        } catch (retryError) {
          console.error('❌ 토큰 재시도도 실패:', retryError);
          return { error: '인증 토큰을 가져올 수 없습니다. 페이지를 새로고침해주세요.' };
        }
      }
    } else {
      console.log('⚠️ 로그인된 사용자가 없습니다.');
      return { error: '로그인이 필요합니다.' };
    }

    // API 요청
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // 401 에러인 경우 토큰 갱신 후 재시도
    if (response.status === 401) {
      console.log('❌ 토큰이 만료되었습니다. 재시도 중...');
      try {
        const user = auth.currentUser;
        if (user) {
          const newToken = await getIdToken(user, true);
          headers = {
            ...headers,
            'Authorization': `Bearer ${newToken}`,
          };
          
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });
          
          if (retryResponse.status === 401) {
            return { error: '인증이 만료되었습니다. 페이지를 새로고침해주세요.' };
          }
          
          const data = await retryResponse.json();
          return data;
        }
      } catch (retryError) {
        console.error('❌ 토큰 갱신 재시도 실패:', retryError);
      }
      return { error: '인증이 만료되었습니다. 페이지를 새로고침해주세요.' };
    }

    const data = await response.json();
    return data;
  } catch (error: unknown) {
    console.error('❌ API 요청 실패:', error);
    return { error: '네트워크 오류가 발생했습니다.' };
  }
};

/**
 * POST 요청을 보내는 함수
 * @param url - API 엔드포인트
 * @param body - 요청 본문
 * @returns Promise<ApiResponse<T>>
 */
export const apiPost = async <T = unknown>(
  url: string, 
  body: unknown
): Promise<ApiResponse<T>> => {
  return apiRequest<T>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

/**
 * GET 요청을 보내는 함수
 * @param url - API 엔드포인트
 * @returns Promise<ApiResponse<T>>
 */
export const apiGet = async <T = unknown>(url: string): Promise<ApiResponse<T>> => {
  return apiRequest<T>(url, {
    method: 'GET',
  });
};

/**
 * PUT 요청을 보내는 함수
 * @param url - API 엔드포인트
 * @param body - 요청 본문
 * @returns Promise<ApiResponse<T>>
 */
export const apiPut = async <T = unknown>(
  url: string, 
  body: unknown
): Promise<ApiResponse<T>> => {
  return apiRequest<T>(url, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
};

/**
 * DELETE 요청을 보내는 함수
 * @param url - API 엔드포인트
 * @returns Promise<ApiResponse<T>>
 */
export const apiDelete = async <T = unknown>(url: string): Promise<ApiResponse<T>> => {
  return apiRequest<T>(url, {
    method: 'DELETE',
  });
}; 