/**
 * Firebase ID 토큰을 사용한 API 클라이언트
 * 표준 Firebase 방식: 자동 토큰 첨부 + 401 에러시 재시도
 */

import { auth } from './firebase';

interface ApiConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
}

interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  headers: Headers;
}

class ApiClient {
  private baseURL = '';

  constructor() {
    // Next.js 환경에서 기본 URL 설정
    if (typeof window !== 'undefined') {
      this.baseURL = window.location.origin;
    }
  }

  /**
   * Firebase ID 토큰을 자동으로 첨부하는 API 요청
   */
  async request<T = unknown>(url: string, config: ApiConfig = {}): Promise<ApiResponse<T>> {
    const { method = 'GET', headers = {}, body } = config;

    // 1. Firebase에서 토큰 가져오기 (자동 갱신됨)
    let idToken: string | null = null;
    const user = auth.currentUser;
    
    if (user) {
      try {
        // Firebase SDK가 자동으로 만료 확인 후 갱신
        idToken = await user.getIdToken();
      } catch (error) {
        console.warn('토큰 가져오기 실패:', error);
      }
    }

    // 2. 요청 헤더 설정
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (idToken) {
      requestHeaders.Authorization = `Bearer ${idToken}`;
    }

    // 3. 요청 실행
    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && method !== 'GET') {
      requestConfig.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${this.baseURL}${url}`, requestConfig);

      // 4. 401 에러시 토큰 재발급 후 재시도
      if (response.status === 401 && user && idToken) {
        console.log('🔄 401 에러 감지, 토큰 재발급 후 재시도...');
        
        try {
          // 강제로 새 토큰 발급
          const newToken = await user.getIdToken(true);
          requestHeaders.Authorization = `Bearer ${newToken}`;
          
          // 동일한 요청 재시도
          const retryResponse = await fetch(`${this.baseURL}${url}`, {
            ...requestConfig,
            headers: requestHeaders,
          });

          if (!retryResponse.ok) {
            throw new Error(`API 요청 실패: ${retryResponse.status}`);
          }

          const data = await retryResponse.json();
          console.log('✅ 토큰 재발급 후 재시도 성공');
          
          return {
            data,
            status: retryResponse.status,
            headers: retryResponse.headers,
          };
        } catch (retryError) {
          console.error('❌ 토큰 재발급 재시도 실패:', retryError);
          throw new Error('인증이 만료되었습니다. 다시 로그인해 주세요.');
        }
      }

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        data,
        status: response.status,
        headers: response.headers,
      };

    } catch (error) {
      console.error('API 요청 오류:', error);
      throw error;
    }
  }

  // 편의 메소드들
  async get<T = unknown>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'GET', headers });
  }

  async post<T = unknown>(url: string, body?: unknown, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'POST', body, headers });
  }

  async put<T = unknown>(url: string, body?: unknown, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'PUT', body, headers });
  }

  async delete<T = unknown>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'DELETE', headers });
  }
}

// 싱글톤 인스턴스 export
export const apiClient = new ApiClient();

// 기본 export도 제공
export default apiClient;
