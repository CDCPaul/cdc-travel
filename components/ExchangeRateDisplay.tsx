'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ExchangeRateDisplay as ExchangeRateDisplayType } from '@/types/exchange-rate';

interface ExchangeRateDisplayProps {
  className?: string;
}

export default function ExchangeRateDisplay({ className = '' }: ExchangeRateDisplayProps) {
  const [exchangeRate, setExchangeRate] = useState<ExchangeRateDisplayType | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // 환율 데이터 가져오기
  const fetchExchangeRate = async (forceUpdate = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = forceUpdate 
        ? '/api/exchange-rate?update=true'
        : '/api/exchange-rate';
        
      const response = await fetch(url, {
        // 캐시 설정: 강제 업데이트가 아닌 경우 브라우저 캐시 사용
        cache: forceUpdate ? 'no-cache' : 'default'
      });
      
      if (!response.ok) {
        throw new Error('환율 데이터를 가져올 수 없습니다.');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setExchangeRate(result.data);
        console.log('✅ 환율 데이터 업데이트 완료:', result.data.lastUpdated);
      } else {
        throw new Error(result.error || '환율 데이터 조회 실패');
      }
    } catch (error) {
      console.error('환율 데이터 가져오기 실패:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    fetchExchangeRate();
  }, []);

  // 자동 스크롤 (5초마다)
  useEffect(() => {
    if (!exchangeRate) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % 3);
    }, 5000);

    return () => clearInterval(interval);
  }, [exchangeRate]);

  // 날짜는 이미 MM/DD HH:MM 형식으로 오므로 그대로 사용
  const formatDate = (dateString: string) => {
    return dateString || '로딩 중...';
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 text-sm text-gray-600 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span>환율 로딩중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 text-sm text-red-600 ${className}`}>
        <span>환율 오류</span>
      </div>
    );
  }

  if (!exchangeRate) {
    return (
      <div className={`flex items-center space-x-2 text-sm text-gray-600 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span>환율 로딩중...</span>
      </div>
    );
  }

  const rates = [
    {
      label: 'USD/KRW',
      value: exchangeRate?.USD_KRW || 0,
      format: (val: number) => `₩${val.toFixed(0)}`
    },
    {
      label: 'USD/PHP',
      value: exchangeRate?.USD_PHP || 0,
      format: (val: number) => `₱${val.toFixed(2)}`
    },
    {
      label: 'KRW/PHP',
      value: exchangeRate?.KRW_PHP || 0,
      format: (val: number) => `₱${val.toFixed(2)}`
    }
  ];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* 환율 표시 */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex items-center space-x-1 text-xs"
          >
            <span className="font-medium">
              {rates[currentIndex].label}
            </span>
            <span className="font-semibold">
              {rates[currentIndex].format(rates[currentIndex].value)}
            </span>
          </motion.div>
        </AnimatePresence>
        
        {/* 인디케이터 */}
        <div className="flex justify-center space-x-0.5 mt-0.5">
          {rates.map((_, index) => (
            <div
              key={index}
              className={`w-0.5 h-0.5 rounded-full transition-colors ${
                index === currentIndex ? 'bg-current' : 'bg-current/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 날짜 표시 */}
      <div className="text-xs opacity-70">
        {exchangeRate?.lastUpdated ? formatDate(exchangeRate.lastUpdated) : '로딩 중...'}
      </div>
    </div>
  );
} 