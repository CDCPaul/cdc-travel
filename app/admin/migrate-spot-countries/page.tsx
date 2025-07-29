"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from "next/navigation";

// 국가 옵션 (스팟 등록페이지와 동일)
const COUNTRY_OPTIONS = [
  { ko: '대한민국', en: 'Korea', code: 'KR' },
  { ko: '필리핀', en: 'Philippines', code: 'PH' },
  { ko: '일본', en: 'Japan', code: 'JP' },
  { ko: '베트남', en: 'Vietnam', code: 'VN' },
  { ko: '대만', en: 'Taiwan', code: 'TW' },
];

export default function MigrateSpotCountriesPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [migrationResults, setMigrationResults] = useState<Array<{
    id: string;
    name: string;
    oldCountry: { ko: string; en: string };
    newCountry: { ko: string; en: string };
    success: boolean;
    error?: string;
  }>>([]);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // AuthContext에서 user 정보 사용 - 중복된 onAuthStateChanged 제거
    if (!user) {
      router.push('/admin/login');
    }
  }, [user, router]);

  const migrateSpotCountries = async () => {
    setIsLoading(true);
    setMigrationResults([]);

    try {
      const spotsSnapshot = await getDocs(collection(db, "spots"));
      const results = [];

      for (const spotDoc of spotsSnapshot.docs) {
        const data = spotDoc.data();
        const spotId = spotDoc.id;
        
        try {
          // 기존 국가 데이터 확인
          const oldCountry = data.country || { ko: '', en: '' };
          
          // code로 저장된 경우 en으로 변경
          let newCountry = oldCountry;
          if (oldCountry.en && oldCountry.en.length === 2) {
            // code 형태인 경우 (KR, PH, JP, VN, TW)
            const countryOption = COUNTRY_OPTIONS.find(opt => opt.code === oldCountry.en);
            if (countryOption) {
              newCountry = { ko: countryOption.ko, en: countryOption.en };
            }
          }

          // 변경이 필요한 경우에만 업데이트
          if (JSON.stringify(oldCountry) !== JSON.stringify(newCountry)) {
            await updateDoc(doc(db, "spots", spotId), {
              country: newCountry
            });
            
            results.push({
              id: spotId,
              name: data.name?.ko || data.name?.en || 'Unknown',
              oldCountry,
              newCountry,
              success: true
            });
          } else {
            results.push({
              id: spotId,
              name: data.name?.ko || data.name?.en || 'Unknown',
              oldCountry,
              newCountry,
              success: true
            });
          }
        } catch (error) {
          results.push({
            id: spotId,
            name: data.name?.ko || data.name?.en || 'Unknown',
            oldCountry: data.country || { ko: '', en: '' },
            newCountry: { ko: '', en: '' },
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      setMigrationResults(results);
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const successCount = migrationResults.filter(r => r.success).length;
  const failureCount = migrationResults.length - successCount;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">스팟 국가 데이터 마이그레이션</h1>
      
      <div className="mb-6">
        <button
          onClick={migrateSpotCountries}
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? '마이그레이션 중...' : '마이그레이션 시작'}
        </button>
      </div>

      {migrationResults.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">마이그레이션 결과</h2>
          <div className="text-sm text-gray-600 mb-4">
            성공: {successCount}개, 실패: {failureCount}개
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {migrationResults.map((result) => (
              <div
                key={result.id}
                className={`p-3 rounded border ${
                  result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="font-medium">{result.name}</div>
                <div className="text-sm text-gray-600">
                  <div>ID: {result.id}</div>
                  <div>기존: {JSON.stringify(result.oldCountry)}</div>
                  <div>변경: {JSON.stringify(result.newCountry)}</div>
                  {result.error && (
                    <div className="text-red-600">오류: {result.error}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={() => router.push('/admin/spots')}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          스팟 목록으로 돌아가기
        </button>
      </div>
    </div>
  );
} 