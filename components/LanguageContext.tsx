"use client";

import { createContext, useContext, useState, Dispatch, SetStateAction, useEffect } from 'react';

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

  // 클라이언트에서만 sessionStorage 값으로 덮어쓰기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('lang');
      if (stored && (stored === 'ko' || stored === 'en')) {
        setLangState(stored);
      }
    }
  }, []);

  const setLang: typeof setLangState = (value) => {
    setLangState(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('lang', next);
      }
      return next;
    });
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
} 