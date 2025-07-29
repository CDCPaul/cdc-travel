'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

// 782-792행 테스트 데이터
const testData = [
  {
    CODE: 'TMT',
    AGT: 'DESIREE',
    AGT_H: 'JESSIE',
    CDC_S: 'LYAN',
    CDC_MH: 'PAUL',
    CDC_SH: 'AIR_0616_3',
    BK_CODE: 'INT',
    I_D: 'RT',
    R_O: 'CEB-PUS',
    ROUTE: '10/16',
    DEP: '10/19',
    RET: 'LJ 062',
    FLT_D: 'LJ 061',
    FLT_R: '30',
    PAX: 30,
    ADT: 30,
    CHD: 0,
    INF: 0,
    NAME: 'NTBA',
    BK_REMARKS: '7/3 DEPOSIT $1200 Reservation PAID 7/4 DEPOSIT $12007/8 DEPOSIT $1007/11 DEPOSIT_$500',
    ISSUE_BY: 'JIN AIR',
    CLASS: 'B6K3XJ',
    PNR: '7/31',
    TL: 'DESIREE',
    FOREX: '',
    ADT_P_P: '',
    CHD_P_P: '',
    INF_P_P: '',
    PHP_KRW: '',
    RATE: '',
    USD: '',
    DUE: '',
    PAID: '',
    PAID_DATE: '',
    BY: '',
    PAYMENT_REMARKS: '',
    EMAIL: '',
    FARE: '',
    TAX: '',
    PH_TAX: '',
    AIR_NETT: '',
    AIR_NETT_2: '',
    RATE_2: '',
    ISSUE_D: '',
    COM: '',
    기타지출: '',
    수익: ''
  },
  {
    CODE: 'DTTS',
    AGT: 'JOCELYN DEBALUCOS',
    AGT_H: 'APRIL',
    CDC_S: 'PAUL',
    CDC_MH: 'GLORIA',
    CDC_SH: 'AIR_0626_2',
    BK_CODE: 'INT',
    I_D: 'RT',
    R_O: 'CEB-PUS',
    ROUTE: '10/30',
    DEP: '11/2',
    RET: '7C 2162',
    FLT_D: 'LJ 061',
    FLT_R: '28>30',
    PAX: 30,
    ADT: 30,
    CHD: 0,
    INF: 0,
    NAME: 'NTBA',
    BK_REMARKS: '7/29 RESERVATION PAID',
    ISSUE_BY: 'JEJU AIR',
    CLASS: 'LOIDA',
    PNR: 'JOCELYN DEBALUCOS',
    TL: '',
    FOREX: '',
    ADT_P_P: '',
    CHD_P_P: '',
    INF_P_P: '',
    PHP_KRW: '',
    RATE: '',
    USD: '',
    DUE: '',
    PAID: '',
    PAID_DATE: '',
    BY: '',
    PAYMENT_REMARKS: '',
    EMAIL: '',
    FARE: '',
    TAX: '',
    PH_TAX: '',
    AIR_NETT: '',
    AIR_NETT_2: '',
    RATE_2: '',
    ISSUE_D: '',
    COM: '',
    기타지출: '',
    수익: ''
  },
  {
    CODE: 'CDC_PKG',
    AGT: 'APRIL',
    AGT_H: 'LYAN',
    CDC_S: 'PAUL',
    CDC_MH: 'GLORIA',
    CDC_SH: 'AIR_0516_3',
    BK_CODE: 'INT',
    I_D: 'RT',
    R_O: 'CEB-ICN',
    ROUTE: '10/31',
    DEP: '11/3',
    RET: '7C 2114',
    FLT_D: '7C 2113',
    FLT_R: '45',
    PAX: 45,
    ADT: 45,
    CHD: 0,
    INF: 0,
    NAME: 'NTBA',
    BK_REMARKS: 'APRIL',
    ISSUE_BY: 'JESSIE',
    CLASS: 'LYAN',
    PNR: 'PAUL',
    TL: '',
    FOREX: '',
    ADT_P_P: '',
    CHD_P_P: '',
    INF_P_P: '',
    PHP_KRW: '',
    RATE: '',
    USD: '',
    DUE: '',
    PAID: '',
    PAID_DATE: '',
    BY: '',
    PAYMENT_REMARKS: '',
    EMAIL: '',
    FARE: '',
    TAX: '',
    PH_TAX: '',
    AIR_NETT: '',
    AIR_NETT_2: '',
    RATE_2: '',
    ISSUE_D: '',
    COM: '',
    기타지출: '',
    수익: ''
  },
  {
    CODE: 'CDC_PKG',
    AGT: 'APRIL',
    AGT_H: 'APRIL',
    CDC_S: 'PAUL',
    CDC_MH: 'GLORIA',
    CDC_SH: 'AIR_0502_2',
    BK_CODE: 'INT',
    I_D: 'RT',
    R_O: 'CEB-ICN',
    ROUTE: '10/31',
    DEP: '11/3',
    RET: '7C 2114',
    FLT_D: '7C 2113',
    FLT_R: '25',
    PAX: 25,
    ADT: 25,
    CHD: 0,
    INF: 0,
    NAME: 'NTBA',
    BK_REMARKS: 'APRIL',
    ISSUE_BY: 'JESSIE',
    CLASS: 'LYAN',
    PNR: 'PAUL',
    TL: '',
    FOREX: '',
    ADT_P_P: '',
    CHD_P_P: '',
    INF_P_P: '',
    PHP_KRW: '',
    RATE: '',
    USD: '',
    DUE: '',
    PAID: '',
    PAID_DATE: '',
    BY: '',
    PAYMENT_REMARKS: '',
    EMAIL: '',
    FARE: '',
    TAX: '',
    PH_TAX: '',
    AIR_NETT: '',
    AIR_NETT_2: '',
    RATE_2: '',
    ISSUE_D: '',
    COM: '',
    기타지출: '',
    수익: ''
  }
];

export default function MigrateSpreadsheetPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    data: {
      totalProcessed: number;
      successCount: number;
      errorCount: number;
      errors: string[];
    };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMigration = async () => {
    if (!user) {
      setError('로그인이 필요합니다.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/migrate-bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spreadsheetData: testData
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        console.log('✅ 마이그레이션 성공:', data);
      } else {
        setError(data.error || '마이그레이션 실패');
        console.error('❌ 마이그레이션 실패:', data);
      }
    } catch (error) {
      setError('네트워크 오류가 발생했습니다.');
      console.error('❌ 마이그레이션 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h1>
          <p className="text-gray-600">마이그레이션을 위해 관리자로 로그인해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            스프레드시트 마이그레이션 테스트
          </h1>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">테스트 데이터 (782-792행)</h2>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                총 {testData.length}개 행의 데이터를 마이그레이션합니다.
              </p>
              <ul className="text-sm text-gray-700 space-y-1">
                {testData.map((row, index) => (
                  <li key={index}>
                    <strong>{row.CDC_SH}</strong> - {row.NAME} ({row.PAX}명)
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleMigration}
              disabled={loading}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? '마이그레이션 중...' : '마이그레이션 시작'}
            </button>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-red-800 font-semibold mb-2">오류 발생</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-green-800 font-semibold mb-2">마이그레이션 완료</h3>
              <div className="text-green-700 space-y-2">
                <p><strong>메시지:</strong> {result.message}</p>
                <p><strong>처리된 예약:</strong> {result.data.totalProcessed}개</p>
                <p><strong>성공:</strong> {result.data.successCount}개</p>
                <p><strong>실패:</strong> {result.data.errorCount}개</p>
                {result.data.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="font-semibold">오류 상세:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {result.data.errors.map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 