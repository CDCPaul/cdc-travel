/**
 * 글로벌 fetch 인터셉터
 * 모든 fetch 호출에 자동으로 Firebase ID 토큰을 첨부하고
 * 401 에러 시 자동 재시도를 처리합니다.
 */

import { auth } from './firebase';

// 원본 fetch 함수 저장
const originalFetch = globalThis.fetch;

// 커스텀 fetch 함수
const interceptedFetch: typeof fetch = async (input, init = {}) => {
  // URL 안전하게 추출
  let url: string | undefined;
  
  try {
    if (typeof input === 'string') {
      url = input;
    } else if (input && typeof input === 'object') {
      // Request 객체 또는 URL이 있는 객체인 경우
      url = (input as Request).url;
    }
  } catch (error) {
    console.warn('⚠️ Fetch Interceptor: URL 추출 실패', error);
  }

  // URL이 없거나 유효하지 않은 경우 원본 fetch 바로 호출
  if (!url || typeof url !== 'string') {
    return originalFetch(input, init);
  }

  // Next.js 내부 요청 무시
  if (url.includes('/_next/') || url.includes('/__next') || url.startsWith('blob:') || url.startsWith('data:')) {
    return originalFetch(input, init);
  }
  
  // API 요청인지 확인
  if (url.includes('/api/')) {
    const user = auth.currentUser;
    
    if (user) {
      try {
        // Firebase ID 토큰 자동 첨부
        const token = await user.getIdToken();
        
        const headers = new Headers(init.headers);
        headers.set('Authorization', `Bearer ${token}`);
        
        init = {
          ...init,
          headers,
        };
        
        console.log('🔐 Fetch Interceptor: 토큰 자동 첨부됨', url);
      } catch (error) {
        console.error('❌ Fetch Interceptor: 토큰 획득 실패', error);
      }
    }
  }

  // 원본 fetch 호출
  let response = await originalFetch(input, init);

  // 401 에러 시 자동 재시도 (API 요청인 경우만)
  if (response.status === 401 && url && url.includes('/api/') && auth.currentUser) {
    console.log('🔄 Fetch Interceptor: 401 에러, 토큰 갱신 후 재시도');
    
    try {
      // 토큰 강제 갱신
      const newToken = await auth.currentUser.getIdToken(true);
      
      const headers = new Headers(init.headers);
      headers.set('Authorization', `Bearer ${newToken}`);
      
      // 재시도
      response = await originalFetch(input, {
        ...init,
        headers,
      });
      
      console.log('✅ Fetch Interceptor: 재시도 성공');
    } catch (refreshError) {
      console.error('❌ Fetch Interceptor: 토큰 갱신 실패', refreshError);
      // 갱신 실패 시 로그인 페이지로 리다이렉트
      window.location.href = '/admin/login';
    }
  }

  return response;
};

/**
 * 글로벌 fetch 인터셉터 활성화
 * 앱 시작 시 한 번만 호출하면 됩니다.
 */
export function setupFetchInterceptor() {
  // 이미 인터셉터가 설정되어 있으면 중복 설정 방지
  if (globalThis.fetch !== originalFetch) {
    console.log('⚠️ Fetch Interceptor가 이미 활성화되어 있습니다.');
    return;
  }

  // 브라우저 환경에서만 활성화
  if (typeof window === 'undefined') {
    console.log('⚠️ 서버 환경에서는 Fetch Interceptor를 활성화하지 않습니다.');
    return;
  }
  
  try {
    globalThis.fetch = interceptedFetch;
    
    // 개발 환경에서만 로그 출력
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Fetch Interceptor 활성화됨');
    }
  } catch (error) {
    console.error('❌ Fetch Interceptor 활성화 실패:', error);
    // 실패 시 원본 fetch 유지
  }
}

/**
 * 원본 fetch로 복원 (필요시)
 */
export function restoreOriginalFetch() {
  globalThis.fetch = originalFetch;
}
