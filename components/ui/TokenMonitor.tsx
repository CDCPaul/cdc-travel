'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';

interface TokenStatus {
  isLoggedIn: boolean;
  idTokenExpiry: string | null;
  timeUntilExpiry: number | null;
  lastRefresh: string | null;
}

export default function TokenMonitor() {
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>({
    isLoggedIn: false,
    idTokenExpiry: null,
    timeUntilExpiry: null,
    lastRefresh: null,
  });

  const checkTokenStatus = async () => {
    const user = auth.currentUser;
    
    if (!user) {
      setTokenStatus({
        isLoggedIn: false,
        idTokenExpiry: null,
        timeUntilExpiry: null,
        lastRefresh: null,
      });
      return;
    }

    try {
      const idTokenResult = await user.getIdTokenResult();
      const expirationTime = new Date(idTokenResult.expirationTime);
      const now = new Date();
      const timeUntilExpiry = expirationTime.getTime() - now.getTime();

      setTokenStatus({
        isLoggedIn: true,
        idTokenExpiry: expirationTime.toLocaleString(),
        timeUntilExpiry: Math.round(timeUntilExpiry / 1000 / 60), // 분 단위
        lastRefresh: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      console.error('토큰 상태 확인 실패:', error);
    }
  };

  useEffect(() => {
    // 초기 체크
    checkTokenStatus();

    // 30초마다 상태 업데이트
    const interval = setInterval(checkTokenStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null; // 개발 환경에서만 표시
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <h4 className="font-semibold text-sm mb-2">🔐 토큰 상태 모니터</h4>
      
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span>로그인 상태:</span>
          <span className={tokenStatus.isLoggedIn ? 'text-green-600' : 'text-red-600'}>
            {tokenStatus.isLoggedIn ? '✅ 로그인됨' : '❌ 로그아웃됨'}
          </span>
        </div>
        
        {tokenStatus.isLoggedIn && (
          <>
            <div className="flex justify-between">
              <span>만료 시간:</span>
              <span className="text-gray-600">{tokenStatus.idTokenExpiry}</span>
            </div>
            
            <div className="flex justify-between">
              <span>남은 시간:</span>
              <span className={tokenStatus.timeUntilExpiry && tokenStatus.timeUntilExpiry < 15 ? 'text-red-600' : 'text-green-600'}>
                {tokenStatus.timeUntilExpiry}분
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>마지막 확인:</span>
              <span className="text-gray-600">{tokenStatus.lastRefresh}</span>
            </div>
          </>
        )}
      </div>
      
      <button
        onClick={checkTokenStatus}
        className="mt-2 w-full px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
      >
        새로고침
      </button>
    </div>
  );
} 