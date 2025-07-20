"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../../../components/LanguageContext";
import Link from "next/link";
import { auth } from "../../../lib/firebase";

// 다국어 텍스트
const TEXT = {
  title: { ko: "IT 관리", en: "IT Management" },
  addNew: { ko: "새 IT 추가", en: "Add New IT" },
  backToAdmin: { ko: "관리자로 돌아가기", en: "Back to Admin" },
  noData: { ko: "등록된 IT가 없습니다.", en: "No itineraries available." },
  loading: { ko: "로딩중...", en: "Loading..." },
  error: { ko: "데이터를 불러오는데 실패했습니다.", en: "Failed to load data." },
  name: { ko: "이름", en: "Name" },
  size: { ko: "크기", en: "Size" },
  createdAt: { ko: "생성일", en: "Created At" },
  createdBy: { ko: "업로더", en: "Uploaded By" },
  updatedAt: { ko: "수정일", en: "Updated At" },
  updatedBy: { ko: "수정자", en: "Updated By" },
  actions: { ko: "작업", en: "Actions" },
  edit: { ko: "편집", en: "Edit" },
  delete: { ko: "삭제", en: "Delete" },
  download: { ko: "다운로드", en: "Download" },
  fileType: { ko: "PDF 파일", en: "PDF File" }
};

interface Itinerary {
  id: string;
  name: string;
  url: string;
  size: number;
  createdAt: { seconds: number; nanoseconds: number } | Date | string;
  createdBy?: string;
  updatedAt?: { seconds: number; nanoseconds: number } | Date | string;
  updatedBy?: string;
}

export default function ItinerariesPage() {
  const { lang } = useLanguage();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchItineraries();
  }, []);

  const fetchItineraries = async () => {
    try {
      setIsLoading(true);
      
      // Firebase ID 토큰 가져오기
      const user = auth.currentUser;
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }
      
      const idToken = await user.getIdToken();
      
      const response = await fetch('/api/itineraries', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load data.");
      }

      setItineraries(result.data || []);
    } catch (error) {
      console.error('IT 데이터 로드 실패:', error);
      setError(error instanceof Error ? error.message : "Failed to load data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      try {
        // Firebase ID 토큰 가져오기
        const user = auth.currentUser;
        if (!user) {
          throw new Error("로그인이 필요합니다.");
        }
        
        const idToken = await user.getIdToken();
        
        const response = await fetch(`/api/itineraries/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || '삭제에 실패했습니다.');
        }

        alert("IT가 성공적으로 삭제되었습니다.");
        fetchItineraries(); // 목록 새로고침
      } catch (error) {
        console.error("삭제 실패:", error);
        alert(error instanceof Error ? error.message : "삭제에 실패했습니다.");
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: { seconds: number; nanoseconds: number } | Date | string) => {
    let date: Date;
    
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      console.log('Invalid timestamp:', timestamp);
      return 'Invalid Date';
    }
    
    if (isNaN(date.getTime())) {
      console.log('Invalid date object:', date);
      return 'Invalid Date';
    }
    
    const dateStr = date.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const timeStr = date.toLocaleTimeString(lang === 'ko' ? 'ko-KR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return { date: dateStr, time: timeStr };
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-lg text-gray-600">{TEXT.loading[lang]}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-lg text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{TEXT.title[lang]}</h1>
        <div className="flex gap-4">
          <Link
            href="/admin"
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            {TEXT.backToAdmin[lang]}
          </Link>
          <Link
            href="/admin/itineraries/new"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {TEXT.addNew[lang]}
          </Link>
        </div>
      </div>

      {/* IT 목록 */}
      {itineraries.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 text-lg">{TEXT.noData[lang]}</p>
          <Link
            href="/admin/itineraries/new"
            className="inline-block mt-4 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {TEXT.addNew[lang]}
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {TEXT.fileType[lang]}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {TEXT.name[lang]}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {TEXT.size[lang]}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {TEXT.createdAt[lang]}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {TEXT.createdBy[lang]}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {TEXT.updatedAt[lang]}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {TEXT.updatedBy[lang]}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {TEXT.actions[lang]}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {itineraries.map((itinerary) => (
                  <tr key={itinerary.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                            <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {itinerary.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatFileSize(itinerary.size)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {(() => {
                          const formatted = formatDate(itinerary.createdAt);
                          if (typeof formatted === 'string') {
                            return formatted;
                          }
                          return (
                            <div>
                              <div>{formatted.date}</div>
                              <div className="text-xs text-gray-400">{formatted.time}</div>
                            </div>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {itinerary.createdBy || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {itinerary.updatedAt ? (() => {
                          const formatted = formatDate(itinerary.updatedAt);
                          if (typeof formatted === 'string') {
                            return formatted;
                          }
                          return (
                            <div>
                              <div>{formatted.date}</div>
                              <div className="text-xs text-gray-400">{formatted.time}</div>
                            </div>
                          );
                        })() : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {itinerary.updatedBy || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <a
                          href={itinerary.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-900"
                        >
                          {TEXT.download[lang]}
                        </a>
                        <Link
                          href={`/admin/itineraries/${itinerary.id}/edit`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {TEXT.edit[lang]}
                        </Link>
                        <button
                          onClick={() => handleDelete(itinerary.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          {TEXT.delete[lang]}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 