'use client';

import { useState, useEffect } from 'react';
import { getPhilippineTime, getPhilippineDate } from '@/lib/utils';

interface ExchangeRateStatus {
  lastUpdated: string;
  nextUpdate: string;
  isAutoUpdateEnabled: boolean;
}

export default function SettingsPage() {
  const [phTime, setPhTime] = useState<Date | null>(null);
  const [exchangeRateStatus, setExchangeRateStatus] = useState<ExchangeRateStatus | null>(null);
  const [loading, setLoading] = useState(false);

  // 필리핀 시간 업데이트
  useEffect(() => {
    const updateTime = () => {
      setPhTime(getPhilippineTime());
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // 환율 상태 확인
  const checkExchangeRateStatus = async () => {
    try {
      const response = await fetch('/api/exchange-rate');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setExchangeRateStatus({
            lastUpdated: data.data.lastUpdated,
            nextUpdate: '매일 오전 9시 (필리핀 시간)',
            isAutoUpdateEnabled: true
          });
        }
      }
    } catch (error) {
      console.error('환율 상태 확인 실패:', error);
    }
  };

  // 수동 환율 업데이트
  const updateExchangeRate = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/exchange-rate?update=true');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('환율 업데이트 완료!');
          checkExchangeRateStatus();
        }
      }
    } catch (error) {
      console.error('환율 업데이트 실패:', error);
      alert('환율 업데이트 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkExchangeRateStatus();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">시스템 설정</h1>
      
      {/* 필리핀 시간 표시 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">필리핀 시간</h2>
        <div className="text-2xl font-mono text-blue-600">
          {phTime ? phTime.toLocaleString('ko-KR', { 
            timeZone: 'Asia/Manila',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }) : '로딩 중...'}
        </div>
        <p className="text-sm text-gray-600 mt-2">
          오늘 날짜: {getPhilippineDate()}
        </p>
      </div>

      {/* 환율 자동 업데이트 상태 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">환율 자동 업데이트</h2>
        
        {exchangeRateStatus ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">마지막 업데이트:</span>
              <span className="font-medium">{exchangeRateStatus.lastUpdated}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">다음 업데이트:</span>
              <span className="font-medium">{exchangeRateStatus.nextUpdate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">자동 업데이트:</span>
              <span className={`font-medium ${exchangeRateStatus.isAutoUpdateEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {exchangeRateStatus.isAutoUpdateEnabled ? '활성화' : '비활성화'}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-gray-600">환율 상태 확인 중...</div>
        )}
        
        <div className="mt-4">
          <button
            onClick={updateExchangeRate}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
          >
            {loading ? '업데이트 중...' : '수동 환율 업데이트'}
          </button>
        </div>
      </div>

      {/* 시스템 정보 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">시스템 정보</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">환율 API:</span>
            <span className="font-medium">exchangerate.host</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">업데이트 주기:</span>
            <span className="font-medium">매일 오전 9시 (필리핀 시간)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">지원 통화:</span>
            <span className="font-medium">USD, KRW, PHP</span>
          </div>
        </div>
      </div>
    </div>
  );
} 