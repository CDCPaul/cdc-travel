import { auth } from './firebase';
import { getIdToken } from 'firebase/auth';

/**
 * API 호출 시 Firebase SDK의 자동 토큰 갱신을 사용하는 fetch 함수
 * @param url - API URL
 * @param options - fetch 옵션
 * @returns Promise<Response>
 */
export const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  // 현재 사용자의 ID 토큰 가져오기 (Firebase SDK 자동 갱신 사용)
  let currentIdToken: string | null = null;
  const user = auth.currentUser;
  if (user) {
    try {
      currentIdToken = await getIdToken(user, false); // 강제 갱신 비활성화
    } catch (error) {
      console.error('현재 토큰 가져오기 실패:', error);
    }
  }

  // 헤더 설정
  let headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Authorization 헤더 추가
  if (currentIdToken) {
    headers = {
      ...headers,
      'Authorization': `Bearer ${currentIdToken}`,
    };
  }

  // API 요청
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // 쿠키 포함
  });

  // 401 에러가 발생하면 로그인 페이지로 리다이렉트
  if (response.status === 401) {
    console.log('토큰이 만료되었습니다. 로그인 페이지로 이동합니다.');
    window.location.href = '/admin/login';
    throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
  }

  return response;
};

/**
 * API 호출 시 토큰 갱신을 포함한 JSON fetch 함수
 * @param url - API URL
 * @param options - fetch 옵션
 * @returns Promise<T>
 */
export const apiFetchJson = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const response = await apiFetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
  }

  return response.json();
}; 