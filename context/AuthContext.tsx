'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, onIdTokenChanged, getIdToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';

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
    
    // Firebase 인증 상태 변경 리스너
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      console.log('🔐 AuthContext: 인증 상태 변경됨', user?.email || '로그아웃');
      setUser(user);
      setLoading(false);
    });

    // Firebase ID 토큰 변경 리스너 (토큰 갱신 감지)
    const unsubscribeToken = onIdTokenChanged(auth, async (user) => {
      if (user) {
        try {
          const idToken = await getIdToken(user, true); // 강제 갱신 활성화
          console.log('🔄 AuthContext: 토큰 갱신됨', user.email);
          setToken(idToken);
        } catch (error) {
          console.error('❌ 토큰 갱신 실패:', error);
          // 토큰 갱신 실패 시에도 기존 토큰 유지
          try {
            const fallbackToken = await getIdToken(user, false);
            setToken(fallbackToken);
            console.log('✅ AuthContext: 폴백 토큰 사용');
          } catch (fallbackError) {
            console.error('❌ 폴백 토큰도 실패:', fallbackError);
            setToken(null);
          }
        }
      } else {
        setToken(null);
      }
    });

    // 주기적 토큰 갱신 (30분마다) - 더 자주 갱신
    const tokenRefreshInterval = setInterval(async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const newToken = await getIdToken(currentUser, true); // 강제 갱신 활성화
          console.log('⏰ AuthContext: 주기적 토큰 갱신 완료', currentUser.email);
          setToken(newToken);
        } catch (error) {
          console.error('❌ 주기적 토큰 갱신 실패:', error);
          // 갱신 실패 시에도 기존 토큰 유지
          try {
            const fallbackToken = await getIdToken(currentUser, false);
            setToken(fallbackToken);
            console.log('✅ AuthContext: 주기적 폴백 토큰 사용');
          } catch (fallbackError) {
            console.error('❌ 주기적 폴백 토큰도 실패:', fallbackError);
          }
        }
      }
    }, 30 * 60 * 1000); // 30분 (30분 * 60초 * 1000ms)

    // 컴포넌트 언마운트 시 리스너 정리
    return () => {
      unsubscribeAuth();
      unsubscribeToken();
      clearInterval(tokenRefreshInterval);
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