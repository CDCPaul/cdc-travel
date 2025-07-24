"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../../../components/LanguageContext";
import Link from "next/link";
import { auth } from "../../../lib/firebase";

// 다국어 텍스트
const TEXT = {
  title: { ko: "전단지 관리", en: "Poster Management" },
  addNew: { ko: "새 전단지 추가", en: "Add New Poster" },
  backToAdmin: { ko: "관리자로 돌아가기", en: "Back to Admin" },
  noData: { ko: "등록된 전단지가 없습니다.", en: "No posters available." },
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
  fileType: { ko: "PDF 파일", en: "PDF File" },
  deleteConfirm: { ko: "정말 삭제하시겠습니까?", en: "Are you sure you want to delete this poster?" },
  deleteSuccess: { ko: "전단지가 성공적으로 삭제되었습니다.", en: "Poster deleted successfully." },
  deleteError: { ko: "전단지 삭제에 실패했습니다.", en: "Failed to delete poster." },
  loginRequired: { ko: "로그인이 필요합니다.", en: "Login required." }
};

interface Poster {
  id: string;
  name: string;
  url: string;
  size: number;
  createdAt: { seconds: number; nanoseconds: number } | Date | string;
  createdBy?: string;
  updatedAt?: { seconds: number; nanoseconds: number } | Date | string;
  updatedBy?: string;
}

export default function PostersPage() {
  const { lang } = useLanguage();
  const [posters, setPosters] = useState<Poster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosters = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Firebase ID 토큰 가져오기
      const user = auth.currentUser;
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }
      
      const idToken = await user.getIdToken();
      
      const response = await fetch('/api/posters', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || TEXT.error[lang]);
      }

      console.log('전단지 데이터:', result.data);
      console.log('첫 번째 전단지 updatedAt:', result.data?.[0]?.updatedAt);
      setPosters(result.data || []);
    } catch (error) {
      console.error('전단지 데이터 로드 실패:', error);
      setError(error instanceof Error ? error.message : "Failed to load data.");
    } finally {
      setIsLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    fetchPosters();
  }, [fetchPosters]);

  const handleDelete = async (id: string) => {
    if (confirm(TEXT.deleteConfirm[lang])) {
      try {
        // Firebase ID 토큰 가져오기
        const user = auth.currentUser;
        if (!user) {
          throw new Error(TEXT.loginRequired[lang]);
        }
        
        const idToken = await user.getIdToken();
        
        const response = await fetch(`/api/posters/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || TEXT.deleteError[lang]);
        }

        alert(TEXT.deleteSuccess[lang]);
        fetchPosters(); // 목록 새로고침
      } catch (error) {
        console.error("삭제 실패:", error);
        alert(error instanceof Error ? error.message : TEXT.deleteError[lang]);
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
    
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-600">{TEXT.loading[lang]}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Content */}
        {posters.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">{TEXT.noData[lang]}</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {posters.map((poster) => (
                <li key={poster.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {poster.name}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{TEXT.size[lang]}: {formatFileSize(poster.size)}</span>
                            <span>{TEXT.createdAt[lang]}: {formatDate(poster.createdAt)}</span>
                            {poster.createdBy && (
                              <span>{TEXT.createdBy[lang]}: {poster.createdBy}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a
                        href={poster.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        {TEXT.download[lang]}
                      </a>
                      <Link
                        href={`/admin/posters/${poster.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        {TEXT.edit[lang]}
                      </Link>
                      <button
                        onClick={() => handleDelete(poster.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        {TEXT.delete[lang]}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 