"use client";

import { createContext, useContext, useState, Dispatch, SetStateAction, useEffect } from 'react';
import { logLanguageChange } from '@/lib/analytics';

interface LanguageContextType {
  lang: 'ko' | 'en';
  setLang: Dispatch<SetStateAction<'ko' | 'en'>>;
}

export const LanguageContext = createContext<LanguageContextType>({ lang: 'en', setLang: () => {} });

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<'ko' | 'en'>('en');
  const [mounted, setMounted] = useState(false);

  // 클라이언트에서만 브라우저 언어 감지 및 sessionStorage 값으로 덮어쓰기
  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('lang');
      if (stored && (stored === 'ko' || stored === 'en')) {
        setLangState(stored);
      } else {
        // 브라우저 언어 감지
        const browserLang = navigator.language.toLowerCase();
        if (browserLang.startsWith('ko')) {
          setLangState('ko');
          sessionStorage.setItem('lang', 'ko');
        } else {
          setLangState('en');
          sessionStorage.setItem('lang', 'en');
        }
      }
    }
  }, []);

  const setLang: typeof setLangState = (value) => {
    setLangState(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      
      // 언어 변경 이벤트 추적
      if (prev !== next) {
        logLanguageChange(prev, next);
      }
      
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('lang', next);
      }
      return next;
    });
  };

  // 서버와 클라이언트 간 hydration mismatch 방지
  if (!mounted) {
    return (
      <div suppressHydrationWarning={true}>
        <LanguageContext.Provider value={{ lang: 'en', setLang }}>
          {children}
        </LanguageContext.Provider>
      </div>
    );
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
} 