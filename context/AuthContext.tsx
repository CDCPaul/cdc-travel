'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, getIdToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { setupFetchInterceptor } from '@/lib/fetch-interceptor';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // 🚀 글로벌 fetch 인터셉터 활성화 (앱 시작 시 한 번만)
    setupFetchInterceptor();
    
    // 🔥 단순화: Firebase 표준 방식 - 인증 상태만 감지
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      console.log('🔐 AuthContext: 인증 상태 변경됨', user?.email || '로그아웃');
      setUser(user);
      setLoading(false);
      
      if (user) {
        try {
          // Firebase SDK가 자동으로 토큰 관리 - 필요시에만 가져옴
          const idToken = await getIdToken(user, false);
          setToken(idToken);
          console.log('✅ AuthContext: 사용자 로그인 완료', user.email);
        } catch (error) {
          console.error('❌ 초기 토큰 설정 실패:', error);
          setToken(null);
        }
      } else {
        setToken(null);
        console.log('🔓 AuthContext: 사용자 로그아웃');
      }
    });

    // 🔥 정리: 수동 갱신 로직 모두 제거 - Firebase SDK에 맡김
    // Firebase는 getIdToken() 호출 시 자동으로 만료 확인 후 갱신함

    // 컴포넌트 언마운트 시 리스너 정리
    return () => {
      unsubscribeAuth();
    };
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    token,
  };

  // 서버와 클라이언트 간 hydration mismatch 방지
  if (!mounted) {
    return (
      <div suppressHydrationWarning={true}>
        <AuthContext.Provider value={{ user: null, loading: true, isAuthenticated: false, token: null }}>
          {children}
        </AuthContext.Provider>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// 인증이 필요한 컴포넌트를 위한 훅
export function useRequireAuth() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return { user: null, loading: true };
  }
  
  return { user, loading: false };
} 