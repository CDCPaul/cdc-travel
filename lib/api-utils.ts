import { forceRefreshTokenForAPI } from './auth';
import { auth } from './firebase';
import { getIdToken } from 'firebase/auth';

/**
 * API 호출 시 토큰 갱신을 포함한 fetch 함수
 * @param url - API URL
 * @param options - fetch 옵션
 * @returns Promise<Response>
 */
export const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  // 현재 사용자의 ID 토큰 가져오기
  let currentIdToken: string | null = null;
  const user = auth.currentUser;
  if (user) {
    try {
      currentIdToken = await getIdToken(user);
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

  // 첫 번째 시도
  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // 쿠키 포함
  });

  // 401 에러가 발생하면 토큰 갱신 후 재시도
  if (response.status === 401) {
    console.log('401 에러 발생. 토큰 갱신을 시도합니다...');
    
    // 토큰 강제 갱신
    const newToken = await forceRefreshTokenForAPI();
    
    if (newToken) {
      console.log('토큰 갱신 성공. API 재시도...');
      
      // 갱신된 토큰으로 헤더 업데이트
      const updatedHeaders = {
        ...headers,
        'Authorization': `Bearer ${newToken}`,
      };
      
      // 갱신 성공 확인을 위해 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // 갱신된 토큰으로 재시도
      response = await fetch(url, {
        ...options,
        headers: updatedHeaders,
        credentials: 'include',
      });
      
      // 재시도 후에도 401이면 로그인 페이지로 리다이렉트
      if (response.status === 401) {
        console.error('토큰 갱신 후에도 401 오류가 발생했습니다. 로그인 페이지로 이동합니다.');
        window.location.href = '/admin/login';
        throw new Error('인증 실패');
      }
    } else {
      console.error('토큰 갱신 실패. 로그인 페이지로 리다이렉트가 필요합니다.');
      // 토큰 갱신 실패 시 로그인 페이지로 리다이렉트
      window.location.href = '/admin/login';
      throw new Error('인증 실패');
    }
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