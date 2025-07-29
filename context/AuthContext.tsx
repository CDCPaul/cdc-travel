'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Firebase 인증 상태 변경 리스너 (한 번만 설정)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔐 AuthContext: 인증 상태 변경됨', user?.email || '로그아웃');
      setUser(user);
      setLoading(false);
    });

    // 컴포넌트 언마운트 시 리스너 정리
    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
  };

  // 서버와 클라이언트 간 hydration mismatch 방지
  if (!mounted) {
    return (
      <div suppressHydrationWarning={true}>
        <AuthContext.Provider value={{ user: null, loading: true, isAuthenticated: false }}>
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