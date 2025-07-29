"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function AuthComplete() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const completeAuth = async () => {
      try {
        const token = searchParams.get('token');
        const remember = searchParams.get('remember') === 'true';

        if (!token) {
          setError('인증 토큰이 없습니다.');
          setLoading(false);
          return;
        }

        // Custom token으로 Firebase 로그인
        const userCredential = await signInWithCustomToken(auth, token);
        const user = userCredential.user;

        console.log('✅ Firebase 로그인 완료:', user.email);

        // Remember me 설정
        if (remember) {
          localStorage.setItem('admin_remember_me', 'true');
        } else {
          localStorage.setItem('admin_remember_me', 'false');
        }

        // 대시보드로 리다이렉트
        router.push('/admin/dashboard');

      } catch (error) {
        console.error('인증 완료 실패:', error);
        setError('인증에 실패했습니다. 다시 로그인해주세요.');
        setLoading(false);
      }
    };

    completeAuth();
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              로그인 완료 중...
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              잠시만 기다려주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              로그인 실패
            </h2>
            <p className="mt-2 text-center text-sm text-red-600">
              {error}
            </p>
            <button
              onClick={() => router.push('/admin/login')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              다시 로그인
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
} 