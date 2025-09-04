"use client";

import { useState, useEffect } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  setPersistence, 
  browserLocalPersistence, 
  browserSessionPersistence
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth, googleProvider } from '@/lib/firebase';
import { setGoogleAccessTokenCookie } from '@/lib/auth';

export default function AdminLogin() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedRememberMe = localStorage.getItem('admin_remember_me') === 'true';
    setRememberMe(savedRememberMe);
    
    // Firebase 연결 사전 확인
    if (auth && googleProvider) {
      console.log('✅ Firebase 인증 모듈이 준비되었습니다');
    } else {
      console.warn('⚠️ Firebase 인증 모듈 로딩 중...');
    }
    
    // 리다이렉트 로그인 결과 확인
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('✅ 리다이렉트 로그인 성공:', result.user.email);
          
          // 도메인 검증
          if (!result.user.email?.endsWith('@cebudirectclub.com')) {
            await auth.signOut();
            setError('@cebudirectclub.com 도메인의 계정만 로그인할 수 있습니다.');
            return;
          }
          
          // 토큰 처리 및 리다이렉트
          const credential = GoogleAuthProvider.credentialFromResult(result);
          const accessToken = credential?.accessToken;
          
          if (accessToken) {
            // Firebase ID Token 획득 및 쿠키 저장 (동기적 처리)
            const idToken = await result.user.getIdToken();
            const { setAuthCookie } = await import('@/lib/auth');
            
            setGoogleAccessTokenCookie(accessToken);
            setAuthCookie(idToken);
            console.log("리다이렉트 로그인: 토큰들이 쿠키에 저장되었습니다");
            
            localStorage.setItem('admin_remember_me', savedRememberMe.toString());
            
            // 백그라운드에서 서버 저장
            fetch('/api/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken, googleAccessToken: accessToken }),
            }).then(response => {
              if (response.ok) {
                console.log('✅ 리다이렉트 로그인: 서버 저장 완료');
              }
            }).catch(console.warn);
            
            router.replace('/admin/dashboard');
          }
        }
      } catch (error) {
        console.error('리다이렉트 결과 확인 실패:', error);
      }
    };
    
    checkRedirectResult();
  }, [router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Firebase 인증이 초기화되었는지 확인
      if (!auth || !googleProvider) {
        setError('Firebase 인증이 초기화되지 않았습니다.');
        return;
      }
      
      // 자동 로그인 설정
      if (rememberMe) {
        await setPersistence(auth, browserLocalPersistence);
      } else {
        await setPersistence(auth, browserSessionPersistence);
      }

      // Google 로그인 팝업 (에러 처리 개선)
      let result;
      try {
        result = await signInWithPopup(auth, googleProvider);
      } catch (popupError: unknown) {
        // 팝업이 실패한 경우 리다이렉트 방식으로 폴백
        console.warn('팝업 로그인 실패, 리다이렉트 방식으로 전환:', popupError);
        
        // Firebase Auth 에러 체크
        const isAuthError = popupError && typeof popupError === 'object' && 'code' in popupError && 'message' in popupError;
        const errorCode = isAuthError ? (popupError as {code: string}).code : '';
        const errorMessage = isAuthError ? (popupError as {message: string}).message : '';
        
        if (errorCode === 'auth/popup-blocked' || 
            errorCode === 'auth/popup-closed-by-user' ||
            errorMessage.includes('Cross-Origin-Opener-Policy')) {
          
          console.log('🔄 리다이렉트 방식으로 로그인을 시도합니다...');
          await signInWithRedirect(auth, googleProvider);
          return; // 리다이렉트 후에는 페이지가 새로고침되므로 여기서 종료
        }
        
        // 다른 에러는 재시도
        throw popupError;
      }
      const user = result.user;
      
      // 도메인 검증 (@cebudirectclub.com)
      if (!user.email?.endsWith('@cebudirectclub.com')) {
        await auth.signOut();
        setError('@cebudirectclub.com 도메인의 계정만 로그인할 수 있습니다.');
        return;
      }

      console.log("로그인된 이메일:", user.email);
      
      // Google access token 가져오기
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      
      if (!accessToken) {
        setError('Gmail API 권한을 가져올 수 없습니다. 다시 로그인해주세요.');
        return;
      }
      
      console.log("Google access token 획득 성공");
      
      // Google Access Token을 쿠키에 저장 (즉시 사용 가능)
      setGoogleAccessTokenCookie(accessToken);
      
      console.log("Google access token이 클라이언트에 저장되었습니다");
      
      // Firebase ID Token을 쿠키에 저장 (미들웨어에서 필요)
      const idToken = await user.getIdToken();
      const { setAuthCookie } = await import('@/lib/auth');
      setAuthCookie(idToken);
      
      console.log("Firebase ID Token이 쿠키에 저장되었습니다");
      
      // localStorage 설정
      localStorage.setItem('admin_remember_me', rememberMe.toString());
      
      // 백그라운드에서 서버에 로그인 정보 저장 (이미 획득한 idToken 사용)
      fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          idToken,
          googleAccessToken: accessToken 
        }),
      }).then(response => {
        if (response.ok) {
          console.log('✅ 백그라운드: 로그인 정보가 서버에 저장되었습니다.');
        } else {
          console.warn('⚠️ 백그라운드: 로그인 정보 저장 실패 (사용자 경험에는 영향 없음)');
        }
      }).catch(error => {
        console.warn('⚠️ 백그라운드: 로그인 정보 저장 실패:', error);
      });
      
      // 로그인 성공 후 즉시 대시보드로 이동
      console.log('🚀 대시보드로 리다이렉트 중...');
      router.replace('/admin/dashboard');
      console.log('✅ 로그인 성공! 대시보드로 이동합니다.');
      
    } catch (error: unknown) {
      console.error('Google login error:', error);
      
      // 에러 발생 시에만 로딩 해제
      setLoading(false);
      
      if (error instanceof Error) {
        if (error.message.includes('popup-closed')) {
          setError('로그인 팝업이 닫혔습니다. 다시 시도해주세요.');
        } else if (error.message.includes('account-exists-with-different-credential')) {
          setError('이미 다른 방법으로 가입된 계정입니다.');
        } else {
          setError('Google 로그인에 실패했습니다. 다시 시도해주세요.');
        }
      } else {
        setError('로그인에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            CDC Travel 관리자
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Google 계정으로 로그인하세요
          </p>
          <p className="mt-1 text-center text-xs text-gray-500">
            @cebudirectclub.com 도메인 계정만 가능합니다
          </p>
        </div>
        
        <div className="space-y-4">
          {/* 자동 로그인 설정 */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-600">자동 로그인</label>
            <button
              type="button"
              onClick={() => setRememberMe(!rememberMe)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${rememberMe ? 'bg-indigo-600' : 'bg-gray-200'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${rememberMe ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          {/* Google 로그인 버튼 */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? '로그인 중...' : 'Google로 로그인'}
          </button>
        </div>
      </div>
    </div>
  );
} 