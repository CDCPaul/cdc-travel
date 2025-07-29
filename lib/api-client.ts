import { auth } from './firebase';
import { getIdToken } from 'firebase/auth';

interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * API 요청을 보내는 함수 (Firebase SDK 자동 토큰 갱신 사용)
 * @param url - API 엔드포인트
 * @param options - fetch 옵션
 * @returns Promise<ApiResponse<T>>
 */
export const apiRequest = async <T = unknown>(
  url: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    // 현재 사용자의 ID 토큰 가져오기 (Firebase SDK 자동 갱신 사용)
    let headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const user = auth.currentUser;
    if (user) {
      try {
        const idToken = await getIdToken(user, false); // 강제 갱신 비활성화
        headers = {
          ...headers,
          'Authorization': `Bearer ${idToken}`,
        };
      } catch (error) {
        console.error('토큰 가져오기 실패:', error);
      }
    }

    // API 요청
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // 401 에러인 경우 로그인 페이지로 리다이렉트
    if (response.status === 401) {
      console.log('토큰이 만료되었습니다. 로그인 페이지로 이동합니다.');
      window.location.href = '/admin/login';
      return { error: '인증이 만료되었습니다. 다시 로그인해주세요.' };
    }

    const data = await response.json();
    return data;
  } catch (error: unknown) {
    console.error('API 요청 실패:', error);
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