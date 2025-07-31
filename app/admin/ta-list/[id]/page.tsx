"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../../../../components/LanguageContext";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "../../../../lib/firebase";
import { formatTimestamp } from "../../../../lib/utils";

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
  noData: { ko: "데이터가 없습니다.", en: "No data available." },
  deliveryStatus: { ko: "발송상태", en: "Delivery Status" },
  readStatus: { ko: "읽음상태", en: "Read Status" },
  checkDelivery: { ko: "수신확인", en: "Check Delivery" },
  checking: { ko: "확인 중...", en: "Checking..." },
  recipient: { ko: "수신자", en: "Recipient" },
  sentTo: { ko: "발송 대상", en: "Sent To" },
  logoIncluded: { ko: "로고 포함", en: "Logo Included" },
  count: { ko: "개", en: "" }
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
  sentAt: { seconds?: number; nanoseconds?: number; _seconds?: number; _nanoseconds?: number };
  attachments: Array<{ name: string; type: string }>;
  includeLogo: boolean;
  messageId?: string;
  taEmail: string; // 수신자 이메일
  deliveryStatus?: 'sent' | 'delivered' | 'failed' | 'unknown';
  readStatus?: 'read' | 'unread' | 'unknown';
}

interface EmailGroup {
  key: string;
  subject: string;
  content: string;
  sentBy: string;
  sentByEmail: string;
  sentAt: { seconds?: number; nanoseconds?: number; _seconds?: number; _nanoseconds?: number };
  attachments: Array<{ name: string; type: string }>;
  includeLogo: boolean;
  recipients: Array<{
    id: string;
    email: string;
    messageId?: string;
    deliveryStatus?: 'sent' | 'delivered' | 'failed' | 'unknown';
    readStatus?: 'read' | 'unread' | 'unknown';
  }>;
}

export default function TADetailPage() {
  const { lang } = useLanguage();
  const params = useParams();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ta, setTa] = useState<TA | null>(null);
  const [emailHistory, setEmailHistory] = useState<EmailGroup[]>([]);
  const [isLoadingEmailHistory, setIsLoadingEmailHistory] = useState(true);
  const [checkingDelivery, setCheckingDelivery] = useState<string | null>(null);

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
        console.log('이메일 기록 sentAt 예시:', data.history?.[0]?.sentAt);
        console.log('이메일 기록 전체 구조:', JSON.stringify(data.history?.[0], null, 2));
        
        if (data.success) {
          // 클라이언트에서 날짜순 정렬
          const sortedHistory = (data.history || []).sort((a: EmailHistory, b: EmailHistory) => {
            if (!a.sentAt || !b.sentAt) return 0;
            const secondsA = a.sentAt.seconds || a.sentAt._seconds;
            const secondsB = b.sentAt.seconds || b.sentAt._seconds;
            if (!secondsA || !secondsB) return 0;
            const dateA = new Date(secondsA * 1000);
            const dateB = new Date(secondsB * 1000);
            return dateB.getTime() - dateA.getTime(); // 최신순
          });
          
          // 같은 제목의 이메일들을 그룹화
          const groupedHistory = sortedHistory.reduce((groups: EmailGroup[], email: EmailHistory) => {
            const key = `${email.subject}_${email.sentAt.seconds || email.sentAt._seconds}`;
            if (!groups.find(group => group.key === key)) {
              groups.push({
                key,
                subject: email.subject,
                content: email.content,
                sentBy: email.sentBy,
                sentByEmail: email.sentByEmail,
                sentAt: email.sentAt,
                attachments: email.attachments,
                includeLogo: email.includeLogo,
                recipients: []
              });
            }
            
            const group = groups.find(g => g.key === key);
            if (group) {
              group.recipients.push({
                id: email.id,
                email: email.taEmail,
                messageId: email.messageId,
                deliveryStatus: email.deliveryStatus,
                readStatus: email.readStatus
              });
            }
            
            return groups;
          }, []);
          
          setEmailHistory(groupedHistory);
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

  // 안전한 날짜 포맷팅 함수
  const safeFormatDate = (timestamp: { seconds?: number; nanoseconds?: number; _seconds?: number; _nanoseconds?: number } | null) => {
    console.log('safeFormatDate 호출됨:', timestamp);
    if (!timestamp) {
      console.log('timestamp가 null임:', timestamp);
      return '-';
    }
    
    // Firestore 직렬화된 형태와 일반 형태 모두 처리
    const seconds = timestamp.seconds || timestamp._seconds;
    const nanoseconds = timestamp.nanoseconds || timestamp._nanoseconds;
    
    if (!seconds) {
      console.log('seconds가 없음:', timestamp);
      return '-';
    }
    
    try {
      const result = formatTimestamp({ seconds, nanoseconds: nanoseconds || 0 }, 'YYYY-MM-DD HH:mm');
      console.log('포맷팅 결과:', result);
      return result;
    } catch (error) {
      console.error('날짜 포맷팅 오류:', error, timestamp);
      return '-';
    }
  };

  const handleDelete = async () => {
    if (!ta) return;
    
    if (confirm("정말 삭제하시겠습니까?")) {
      try {
        const user = auth.currentUser;
        if (!user) {
          alert('로그인이 필요합니다.');
          return;
        }

        const idToken = await user.getIdToken();
        const response = await fetch(`/api/ta/${ta.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          }
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

  // 수신확인 확인 함수
  const checkDeliveryStatus = async (emailId: string, messageId: string) => {
    if (!messageId) return;
    
    setCheckingDelivery(emailId);
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('로그인이 필요합니다.');
        return;
      }

      const idToken = await user.getIdToken();
      const response = await fetch('/api/check-delivery-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ messageId })
      });

      if (!response.ok) {
        throw new Error('수신확인 확인에 실패했습니다.');
      }

      const result = await response.json();
      
      // 이메일 기록 업데이트
      setEmailHistory(prev => prev.map(group => ({
        ...group,
        recipients: group.recipients.map(recipient => 
          recipient.id === emailId 
            ? { 
                ...recipient, 
                deliveryStatus: result.deliveryStatus,
                readStatus: result.readStatus 
              }
            : recipient
        )
      })));

      // Firestore에 수신확인 결과 저장
      try {
        const user = auth.currentUser;
        if (user) {
          const idToken = await user.getIdToken();
          await fetch('/api/update-delivery-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              emailHistoryId: emailId,
              deliveryStatus: result.deliveryStatus,
              readStatus: result.readStatus
            })
          });
        }
      } catch (error) {
        console.error('수신확인 결과 저장 실패:', error);
      }

      alert(`${lang === 'ko' ? '수신확인 결과' : 'Delivery Status'}:\n${TEXT.deliveryStatus[lang]}: ${result.deliveryStatus}\n${TEXT.readStatus[lang]}: ${result.readStatus}`);
    } catch (error) {
      console.error('수신확인 확인 실패:', error);
      alert(error instanceof Error ? error.message : '수신확인 확인에 실패했습니다.');
    } finally {
      setCheckingDelivery(null);
    }
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
                <span className="ml-2 text-gray-900">{safeFormatDate(ta.createdAt)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">{TEXT.updatedAt[lang]}:</span>
                <span className="ml-2 text-gray-900">{safeFormatDate(ta.updatedAt)}</span>
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
              {emailHistory.map((group) => (
                <div key={group.key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{group.subject}</h4>
                    <span className="text-sm text-gray-500">
                      {safeFormatDate(group.sentAt)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    {group.content.length > 100 
                      ? `${group.content.substring(0, 100).replace(/<[^>]*>/g, '')}...` 
                      : group.content.replace(/<[^>]*>/g, '')
                    }
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                    <span>{TEXT.sentBy[lang]}: {group.sentBy} ({group.sentByEmail})</span>
                    <span>
                      {group.attachments.length > 0 && (
                        <span className="mr-2">
                          📎 {group.attachments.length}{TEXT.count[lang]}
                        </span>
                      )}
                      {group.includeLogo && <span>🎨 {TEXT.logoIncluded[lang]}</span>}
                    </span>
                  </div>
                  
                  {/* 수신자 목록 */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-700">{TEXT.sentTo[lang]}:</div>
                                         {group.recipients.map((recipient: { id: string; email: string; messageId?: string; deliveryStatus?: 'sent' | 'delivered' | 'failed' | 'unknown'; readStatus?: 'read' | 'unread' | 'unknown' }) => (
                      <div key={recipient.id} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
                        <span className="text-gray-600">{recipient.email}</span>
                        <div className="flex items-center space-x-2">
                          {recipient.deliveryStatus && (
                            <span className={`px-2 py-1 rounded ${
                              recipient.deliveryStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                              recipient.deliveryStatus === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {TEXT.deliveryStatus[lang]}: {recipient.deliveryStatus}
                            </span>
                          )}
                          {recipient.readStatus && (
                            <span className={`px-2 py-1 rounded ${
                              recipient.readStatus === 'read' ? 'bg-blue-100 text-blue-800' :
                              recipient.readStatus === 'unread' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {TEXT.readStatus[lang]}: {recipient.readStatus}
                            </span>
                          )}
                          {recipient.messageId && (
                            <button
                              onClick={() => checkDeliveryStatus(recipient.id, recipient.messageId!)}
                              disabled={checkingDelivery === recipient.id}
                              className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                            >
                              {checkingDelivery === recipient.id ? TEXT.checking[lang] : TEXT.checkDelivery[lang]}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
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