"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../../../../components/LanguageContext";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "../../../../lib/firebase";

// 다국어 텍스트
const TEXT = {
  title: { ko: "TA 상세 정보", en: "TA Details" },
  backToList: { ko: "목록으로 돌아가기", en: "Back to List" },
  edit: { ko: "편집", en: "Edit" },
  delete: { ko: "삭제", en: "Delete" },
  sendEmail: { ko: "이메일 보내기", en: "Send Email" },
  companyInfo: { ko: "회사 정보", en: "Company Information" },
  contactInfo: { ko: "연락처 정보", en: "Contact Information" },
  contactPersons: { ko: "담당자", en: "Contact Persons" },
  emailHistory: { ko: "이메일 발송 기록", en: "Email History" },
  noEmailHistory: { ko: "발송된 이메일이 없습니다.", en: "No email history found." },
  loading: { ko: "로딩 중...", en: "Loading..." },
  error: { ko: "데이터를 불러오는데 실패했습니다.", en: "Failed to load data." },
  companyName: { ko: "회사명", en: "Company Name" },
  taCode: { ko: "TA 코드", en: "TA Code" },
  phone: { ko: "전화번호", en: "Phone" },
  address: { ko: "주소", en: "Address" },
  email: { ko: "이메일", en: "Email" },
  createdAt: { ko: "등록일", en: "Created Date" },
  updatedAt: { ko: "수정일", en: "Updated Date" },
  name: { ko: "이름", en: "Name" },
  sentBy: { ko: "발송자", en: "Sent By" },
  sentAt: { ko: "발송일", en: "Sent At" },
  subject: { ko: "제목", en: "Subject" },
  attachments: { ko: "첨부파일", en: "Attachments" },
  noData: { ko: "데이터가 없습니다.", en: "No data available." }
};

interface TA {
  id: string;
  companyName: string;
  taCode: string;
  phone: string;
  address: string;
  email: string;
  logo: string;
  overlayImage?: string;
  contactPersons: Array<{ name: string; phone: string; email: string }>;
  createdAt: { seconds: number; nanoseconds: number } | null;
  updatedAt: { seconds: number; nanoseconds: number } | null;
}

interface EmailHistory {
  id: string;
  subject: string;
  content: string;
  sentBy: string;
  sentByEmail: string;
  sentAt: { seconds: number; nanoseconds: number };
  attachments: Array<{ name: string; type: string }>;
  includeLogo: boolean;
}

export default function TADetailPage() {
  const { lang } = useLanguage();
  const params = useParams();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ta, setTa] = useState<TA | null>(null);
  const [emailHistory, setEmailHistory] = useState<EmailHistory[]>([]);
  const [isLoadingEmailHistory, setIsLoadingEmailHistory] = useState(true);

  // TA 데이터 가져오기
  useEffect(() => {
    const fetchTA = async () => {
      try {
        const taId = params.id as string;
        const response = await fetch(`/api/ta/${taId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load data.");
        }

        setTa(result.data);
      } catch (error) {
        console.error('TA 데이터 로드 실패:', error);
        setError(error instanceof Error ? error.message : "Failed to load data.");
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchTA();
    }
  }, [params.id]);

  // 이메일 발송 기록 가져오기
  useEffect(() => {
    const fetchEmailHistory = async () => {
      if (!ta) return;

      try {
        const user = auth.currentUser;
        if (!user) {
          console.warn("로그인된 사용자가 없습니다.");
          setEmailHistory([]);
          return;
        }

        const idToken = await user.getIdToken();
        const response = await fetch(`/api/email-history?taId=${ta.id}`, {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('이메일 기록 API 오류:', response.status, errorData);
          setEmailHistory([]);
          return;
        }

        const data = await response.json();
        console.log('이메일 기록 데이터:', data);
        
        if (data.success) {
          // 클라이언트에서 날짜순 정렬
          const sortedHistory = (data.history || []).sort((a: EmailHistory, b: EmailHistory) => {
            if (!a.sentAt || !b.sentAt) return 0;
            const dateA = new Date(a.sentAt.seconds * 1000);
            const dateB = new Date(b.sentAt.seconds * 1000);
            return dateB.getTime() - dateA.getTime(); // 최신순
          });
          setEmailHistory(sortedHistory);
        } else {
          console.warn('이메일 기록 API 응답 오류:', data);
          setEmailHistory([]);
        }
      } catch (error) {
        console.error('이메일 기록 로드 실패:', error);
        setEmailHistory([]);
      } finally {
        setIsLoadingEmailHistory(false);
      }
    };

    fetchEmailHistory();
  }, [ta]);

  const handleDelete = async () => {
    if (!ta) return;
    
    if (confirm("정말 삭제하시겠습니까?")) {
      try {
        const response = await fetch(`/api/ta/${ta.id}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || '삭제에 실패했습니다.');
        }

        alert("TA가 성공적으로 삭제되었습니다.");
        router.push("/admin/ta-list");
      } catch (error) {
        console.error("삭제 실패:", error);
        alert(error instanceof Error ? error.message : "삭제에 실패했습니다.");
      }
    }
  };

  const formatDate = (timestamp: { seconds: number; nanoseconds: number } | null) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (error || !ta) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-lg text-red-600">{error || TEXT.error[lang]}</p>
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
            href="/admin/ta-list"
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            {TEXT.backToList[lang]}
          </Link>
          <Link
            href={`/admin/ta-list/${ta.id}/edit`}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {TEXT.edit[lang]}
          </Link>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            {TEXT.delete[lang]}
          </button>
          <Link
            href={`/admin/ta-list/send-email?selected=${ta.id}`}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            {TEXT.sendEmail[lang]}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TA 정보 */}
        <div className="space-y-6">
          {/* 로고 및 기본 정보 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative w-20 h-20">
                {ta.logo ? (
                  <Image
                    src={ta.logo}
                    alt={`${ta.companyName} 로고`}
                    width={80}
                    height={80}
                    className="object-contain rounded"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-gray-500 text-sm">No Logo</span>
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{ta.companyName}</h2>
                <p className="text-gray-600">{ta.taCode}</p>
              </div>
            </div>
          </div>

          {/* 회사 정보 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">{TEXT.companyInfo[lang]}</h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">{TEXT.companyName[lang]}:</span>
                <span className="ml-2 text-gray-900">{ta.companyName}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">{TEXT.taCode[lang]}:</span>
                <span className="ml-2 text-gray-900">{ta.taCode}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">{TEXT.phone[lang]}:</span>
                <span className="ml-2 text-gray-900">{ta.phone}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">{TEXT.email[lang]}:</span>
                <span className="ml-2 text-gray-900">{ta.email}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">{TEXT.address[lang]}:</span>
                <span className="ml-2 text-gray-900">{ta.address}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">{TEXT.createdAt[lang]}:</span>
                <span className="ml-2 text-gray-900">{formatDate(ta.createdAt)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">{TEXT.updatedAt[lang]}:</span>
                <span className="ml-2 text-gray-900">{formatDate(ta.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* 담당자 정보 */}
          {ta.contactPersons.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">{TEXT.contactPersons[lang]}</h3>
              <div className="space-y-3">
                {ta.contactPersons.map((person, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <div className="font-medium text-gray-900">{person.name}</div>
                    <div className="text-sm text-gray-600">{person.phone}</div>
                    <div className="text-sm text-gray-600">{person.email}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 이메일 발송 기록 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">{TEXT.emailHistory[lang]}</h3>
          
          {isLoadingEmailHistory ? (
            <div className="text-center py-8">
              <p className="text-gray-600">{TEXT.loading[lang]}</p>
            </div>
          ) : emailHistory.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">{TEXT.noEmailHistory[lang]}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {emailHistory.map((email) => (
                <div key={email.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{email.subject}</h4>
                    <span className="text-sm text-gray-500">
                      {formatDate(email.sentAt)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {email.content.length > 100 
                      ? `${email.content.substring(0, 100)}...` 
                      : email.content
                    }
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{TEXT.sentBy[lang]}: {email.sentBy} ({email.sentByEmail})</span>
                    <span>
                      {email.attachments.length > 0 && (
                        <span className="mr-2">
                          📎 {email.attachments.length}개
                        </span>
                      )}
                      {email.includeLogo && <span>🎨 로고 포함</span>}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 