"use client";

import { useState, useEffect } from 'react';
import { signInWithPopup, setPersistence, browserLocalPersistence, browserSessionPersistence, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '../../../lib/firebase';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedRememberMe = localStorage.getItem('admin_remember_me') === 'true';
    setRememberMe(savedRememberMe);
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      // 자동 로그인 설정
      if (rememberMe) {
        await setPersistence(auth, browserLocalPersistence);
      } else {
        await setPersistence(auth, browserSessionPersistence);
      }

      // Google 로그인 팝업
      const result = await signInWithPopup(auth, googleProvider);
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
      
      // 서버에 로그인 정보 전송
      const idToken = await user.getIdToken();
      console.log('Google Access Token:', accessToken);
      
      const loginResponse = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          idToken,
          googleAccessToken: accessToken 
        }),
      });

      if (!loginResponse.ok) {
        throw new Error('로그인 정보 저장에 실패했습니다.');
      }

      console.log('로그인 정보가 서버에 저장되었습니다.');

      localStorage.setItem('admin_remember_me', rememberMe.toString());
      router.push('/admin/dashboard');
      
    } catch (error: unknown) {
      console.error('Google login error:', error);
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
    } finally {
      setLoading(false);
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