"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../../../components/LanguageContext";
import Link from "next/link";
import { auth } from "../../../lib/firebase";

// 다국어 텍스트
const TEXT = {
  title: { ko: "레터 관리", en: "Letter Management" },
  addNew: { ko: "새 레터 추가", en: "Add New Letter" },
  name: { ko: "이름", en: "Name" },
  fileName: { ko: "파일명", en: "File Name" },
  fileSize: { ko: "파일 크기", en: "File Size" },
  createdAt: { ko: "생성일", en: "Created At" },
  createdBy: { ko: "생성자", en: "Created By" },
  updatedAt: { ko: "수정일", en: "Updated At" },
  updatedBy: { ko: "수정자", en: "Updated By" },
  actions: { ko: "작업", en: "Actions" },
  download: { ko: "다운로드", en: "Download" },
  edit: { ko: "편집", en: "Edit" },
  delete: { ko: "삭제", en: "Delete" },
  deleteConfirm: { ko: "정말로 이 레터를 삭제하시겠습니까?", en: "Are you sure you want to delete this letter?" },
  deleteSuccess: { ko: "레터가 성공적으로 삭제되었습니다", en: "Letter deleted successfully" },
  deleteError: { ko: "레터 삭제에 실패했습니다", en: "Failed to delete letter" },
  loading: { ko: "로딩 중...", en: "Loading..." },
  noLetters: { ko: "등록된 레터가 없습니다", en: "No letters found" },
  loadError: { ko: "레터 목록을 불러오는데 실패했습니다", en: "Failed to load letters" }
};

interface Letter {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  createdBy: string;
  updatedAt?: {
    seconds: number;
    nanoseconds: number;
  };
  updatedBy?: string;
}

export default function LettersPage() {
  const { lang } = useLanguage();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 날짜 포맷팅 함수
  const formatDate = (timestamp: { seconds: number; nanoseconds: number } | Date | string) => {
    let date: Date;
    
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp.seconds * 1000);
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

  // 레터 목록 불러오기
  useEffect(() => {
    const fetchLetters = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          throw new Error("로그인이 필요합니다.");
        }
        
        const idToken = await user.getIdToken();
        
        const response = await fetch('/api/letters', {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });

        if (!response.ok) {
          throw new Error('레터 목록을 불러올 수 없습니다.');
        }

        const data = await response.json();
        setLetters(data);
      } catch (error) {
        console.error("레터 목록 불러오기 실패:", error);
        alert(TEXT.loadError[lang]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLetters();
  }, [lang]);

  // 레터 삭제
  const handleDelete = async (id: string) => {
    if (!confirm(TEXT.deleteConfirm[lang])) {
      return;
    }

    setDeletingId(id);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }
      
      const idToken = await user.getIdToken();
      
      const response = await fetch(`/api/letters/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (!response.ok) {
        throw new Error('레터 삭제에 실패했습니다.');
      }

      // 목록에서 삭제된 레터 제거
      setLetters(prev => prev.filter(letter => letter.id !== id));
      alert(TEXT.deleteSuccess[lang]);
    } catch (error) {
      console.error("레터 삭제 실패:", error);
      alert(error instanceof Error ? error.message : TEXT.deleteError[lang]);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">{TEXT.loading[lang]}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 레터 목록 */}
      {letters.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">{TEXT.noLetters[lang]}</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {TEXT.name[lang]}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {TEXT.fileName[lang]}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {TEXT.fileSize[lang]}
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
                {letters.map((letter) => {
                  const createdDate = formatDate(new Date(letter.createdAt.seconds * 1000));
                  const updatedDate = letter.updatedAt ? formatDate(new Date(letter.updatedAt.seconds * 1000)) : null;
                  
                  return (
                    <tr key={letter.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {letter.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {letter.fileName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(letter.fileSize / 1024 / 1024).toFixed(2)} MB
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div>{createdDate.date}</div>
                          <div className="text-xs text-gray-400">{createdDate.time}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {letter.createdBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {updatedDate ? (
                          <div>
                            <div>{updatedDate.date}</div>
                            <div className="text-xs text-gray-400">{updatedDate.time}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {letter.updatedBy || <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <a
                            href={letter.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {TEXT.download[lang]}
                          </a>
                          <Link
                            href={`/admin/letters/${letter.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            {TEXT.edit[lang]}
                          </Link>
                          <button
                            onClick={() => handleDelete(letter.id)}
                            disabled={deletingId === letter.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deletingId === letter.id ? '삭제 중...' : TEXT.delete[lang]}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 