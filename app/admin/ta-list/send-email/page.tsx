"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../../../../components/LanguageContext";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "../../../../lib/firebase";
import Image from "next/image";

// 다국어 텍스트
const TEXT = {
  title: { ko: "이메일 보내기", en: "Send Email" },
  backToList: { ko: "목록으로 돌아가기", en: "Back to List" },
  send: { ko: "이메일 보내기", en: "Send Email" },
  cancel: { ko: "취소", en: "Cancel" },
  emailSubject: { ko: "이메일 제목", en: "Email Subject" },
  emailSubjectPlaceholder: { ko: "이메일 제목을 입력하세요", en: "Enter email subject" },
  emailContent: { ko: "이메일 내용", en: "Email Content" },
  emailContentPlaceholder: { ko: "이메일 내용을 입력하세요", en: "Enter email content" },
  attachment: { ko: "첨부 파일", en: "Attachment" },
  attachmentPlaceholder: { ko: "첨부할 파일을 선택하세요", en: "Select file to attach" },
  selectedAgents: { ko: "선택된 에이전트", en: "Selected Agents" },
  agentCount: { ko: "명의 에이전트에게 발송됩니다", en: "agents will receive this email" },
  required: { ko: "필수 입력 항목입니다", en: "This field is required" },
  sending: { ko: "이메일 발송 중...", en: "Sending email..." },
  sendSuccess: { ko: "이메일이 성공적으로 발송되었습니다", en: "Email sent successfully" },
  sendError: { ko: "이메일 발송에 실패했습니다", en: "Failed to send email" },
  loading: { ko: "로딩 중...", en: "Loading..." },
  error: { ko: "데이터를 불러오는데 실패했습니다", en: "Failed to load data" },
  sendingEmail: { ko: "이메일 발송 중...", en: "Sending email..." },
  sendTime: { ko: "발송 시간", en: "Send Time" },
  progress: { ko: "진행 상황", en: "Progress" },
  sendingTo: { ko: "발송 중", en: "Sending to" },
  completed: { ko: "완료", en: "Completed" },
  remaining: { ko: "남은 시간", en: "Remaining" },
  includeLogo: { ko: "TA 로고 삽입", en: "Include TA Logo" },
  includeLogoDesc: { ko: "선택된 각 TA의 로고를 첨부파일 상단에 합성하여 발송", en: "Composite TA logos on top of attachment for each selected agent" },
  originalFile: { ko: "원본 파일", en: "Original File" },
  originalFileDesc: { ko: "첨부파일을 그대로 발송", en: "Send attachment as is" },
  selectAttachment: { ko: "첨부파일 선택", en: "Select Attachment" },
  searchPlaceholder: { ko: "파일명으로 검색...", en: "Search by filename..." },
  posters: { ko: "전단지", en: "Posters" },
  itineraries: { ko: "IT", en: "IT" },
  letters: { ko: "레터", en: "Letters" },
  preview: { ko: "미리보기", en: "Preview" },
  noFiles: { ko: "파일이 없습니다", en: "No files found" },
  selectFile: { ko: "파일 선택", en: "Select File" },
  removeFile: { ko: "파일 제거", en: "Remove File" }
};

interface SelectedTA {
  id: string;
  companyName: string;
  taCode: string;
  email: string;
  logo: string;
  overlayImage?: string; // 전처리된 오버레이 이미지 URL
}

interface Attachment {
  id: string;
  type: 'poster' | 'itinerary' | 'letter';
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

export default function SendEmailPage() {
  const { lang } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTAs, setSelectedTAs] = useState<SelectedTA[]>([]);
  
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [selectedAttachments, setSelectedAttachments] = useState<Attachment[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [includeLogo, setIncludeLogo] = useState(true); // TA 로고 삽입 여부
  
  // 미리보기 관련 상태
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [isLoadingPreview, setIsLoadingPreview] = useState<Record<string, boolean>>({});
  
  // 첨부파일 선택 관련 상태
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<'all' | 'poster' | 'itinerary' | 'letter'>('all');
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
  
  // 파일 정리용 상태
  const [generatedSessionId, setGeneratedSessionId] = useState<string | null>(null);
  
  // 이메일 발송 진행 상황 상태
  const [sendDuration, setSendDuration] = useState<number | null>(null);
  const [sendProgress, setSendProgress] = useState<{
    current: number;
    total: number;
    currentTA: string;
    status: string;
  } | null>(null);

  // 파일 정리 함수
  const cleanupGeneratedFiles = useCallback(async () => {
    if (generatedSessionId) {
      try {
        console.log('생성된 파일들 정리 시작:', {
          sessionId: generatedSessionId
        });
        
        const response = await fetch('/api/cleanup-email-images', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: generatedSessionId
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('파일 정리 완료:', result.message);
        } else {
          console.error('파일 정리 실패:', response.status);
        }
      } catch (error) {
        console.error('파일 정리 중 오류:', error);
      }
    }
  }, [generatedSessionId]);

  // 브라우저 이벤트 리스너 및 페이지 언마운트 시 파일 정리
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isLoading && generatedSessionId) {
        e.preventDefault();
        e.returnValue = '';
        cleanupGeneratedFiles();
      }
    };

    const handlePopState = () => {
      if (isLoading && generatedSessionId) {
        cleanupGeneratedFiles();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      
      // 로딩 중이거나 세션이 있을 때만 파일 정리 (성공 후에는 정리하지 않음)
      if (isLoading && generatedSessionId) {
        cleanupGeneratedFiles();
      }
      
      // Blob URL 정리
      Object.values(previewUrls).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [isLoading, generatedSessionId, cleanupGeneratedFiles, previewUrls]);

  // 선택된 TA 데이터 불러오기
  useEffect(() => {
    const selectedIdsParam = searchParams.get('selected')?.split(',') || [];
    
    const fetchSelectedTAs = async () => {
      if (selectedIdsParam.length === 0) {
        setError("선택된 에이전트가 없습니다.");
        setIsLoadingData(false);
        return;
      }

      try {
        const response = await fetch('/api/ta');
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load data.");
        }

        const allTAs = result.data || [];
        const filteredTAs = allTAs.filter((ta: { id: string }) => selectedIdsParam.includes(ta.id));
        setSelectedTAs(filteredTAs);
      } catch (error) {
        console.error('TA 데이터 로드 실패:', error);
        setError(error instanceof Error ? error.message : "Failed to load data.");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchSelectedTAs();
  }, [searchParams]);

  // 첨부파일 목록 불러오기
  const fetchAttachments = useCallback(async () => {
    if (!showAttachmentModal) return;
    
    setIsLoadingAttachments(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }
      
      const idToken = await user.getIdToken();
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedType !== 'all') {
        const typeMap = {
          'poster': 'posters',
          'itinerary': 'itineraries', 
          'letter': 'letters'
        };
        params.append('type', typeMap[selectedType]);
      }
      
      const response = await fetch(`/api/attachments?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (!response.ok) {
        throw new Error('첨부파일 목록을 불러올 수 없습니다.');
      }

      const data = await response.json();
      setAttachments(data);
    } catch (error) {
      console.error('첨부파일 목록 로드 실패:', error);
    } finally {
      setIsLoadingAttachments(false);
    }
  }, [showAttachmentModal, searchTerm, selectedType]);

  // 첨부파일 선택 모달 열기
  const openAttachmentModal = () => {
    setShowAttachmentModal(true);
    setSearchTerm('');
    setSelectedType('all');
  };

  useEffect(() => {
    if (showAttachmentModal) {
      const timeoutId = setTimeout(() => {
        fetchAttachments();
      }, 300); // 300ms 디바운스

      return () => clearTimeout(timeoutId);
    }
  }, [showAttachmentModal, fetchAttachments]);

  // 첨부파일 선택
  const handleSelectAttachment = (attachment: Attachment) => {
    setSelectedAttachments(prev => {
      // 이미 선택된 파일인지 확인
      const isAlreadySelected = prev.some(selected => selected.id === attachment.id);
      if (isAlreadySelected) {
        return prev;
      }
      const newAttachments = [...prev, attachment];
      
      // 미리보기 생성
      setTimeout(() => {
        generatePreview(attachment);
      }, 100);
      
      return newAttachments;
    });
  };

  // 첨부파일 제거
  const handleRemoveAttachment = (attachmentId: string) => {
    setSelectedAttachments(prev => prev.filter(att => att.id !== attachmentId));
    // 미리보기 URL도 제거
    setPreviewUrls(prev => {
      const newUrls = { ...prev };
      delete newUrls[attachmentId];
      return newUrls;
    });
  };

  // 미리보기 생성 (전단지만)
  const generatePreview = async (attachment: Attachment) => {
    // PDF 파일은 미리보기 하지 않음
    if (attachment.type !== 'poster') {
      return;
    }
    
    if (previewUrls[attachment.id]) return; // 이미 미리보기가 있는 경우

    setIsLoadingPreview(prev => ({ ...prev, [attachment.id]: true }));
    
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }
      
      const idToken = await user.getIdToken();
      
      // 첫 번째 TA의 전처리된 오버레이 이미지 사용
      const firstTA = selectedTAs.length > 0 ? selectedTAs[0] : null;
      
      if (!firstTA) {
        console.warn('선택된 TA가 없습니다. 미리보기를 생성할 수 없습니다.');
        return;
      }
      
      const response = await fetch('/api/attachments/preview', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          attachmentUrl: attachment.fileUrl,
          attachmentType: attachment.type,
          taId: firstTA.id
        })
      });

      if (!response.ok) {
        throw new Error('미리보기를 생성할 수 없습니다.');
      }

      // Blob URL 생성
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      setPreviewUrls(prev => ({ ...prev, [attachment.id]: url }));
    } catch (error) {
      console.error('미리보기 생성 실패:', error);
    } finally {
      setIsLoadingPreview(prev => ({ ...prev, [attachment.id]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 검증
    const newErrors: Record<string, string> = {};
    if (!emailSubject.trim()) {
      newErrors.emailSubject = TEXT.required[lang];
    }
    if (!emailContent.trim()) {
      newErrors.emailContent = TEXT.required[lang];
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 발송 시작 시간 기록
    const startTime = Date.now();
    setSendDuration(null);
    setIsLoading(true);
    try {
      let imageUrls: string[] = [];

      // TA 로고 삽입이 선택된 경우에만 이미지 생성
      if (includeLogo && selectedAttachments.length > 0) {
        // 전단지 파일들만 필터링 (이미지 파일)
        const posterFiles = selectedAttachments.filter(att => att.type === 'poster');
        
        if (posterFiles.length > 0) {
          try {
            // 각 TA에 대해 전처리된 오버레이 이미지를 사용하여 이미지 생성
            const allImageUrls: string[] = [];
            
            for (let i = 0; i < selectedTAs.length; i++) {
              const ta = selectedTAs[i];
              
              // 진행 상황 업데이트
              setSendProgress({
                current: i + 1,
                total: selectedTAs.length,
                currentTA: ta.companyName,
                status: '이미지 생성 중...'
              });
              
              if (!ta.overlayImage) {
                console.warn(`TA ${ta.companyName}의 오버레이 이미지가 없습니다.`);
                continue;
              }
              
              // 각 TA별로 이미지 생성
              const imageResponse = await fetch('/api/generate-email-images', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  taId: ta.id,
                  imageUrls: posterFiles.map(file => file.fileUrl)
                })
              });

              if (!imageResponse.ok) {
                throw new Error(`TA ${ta.companyName}의 이미지 생성에 실패했습니다.`);
              }

              const imageResult = await imageResponse.json();
              allImageUrls.push(...imageResult.processedImages);
            }
            
            imageUrls = allImageUrls;
          } catch (error) {
            console.error('이미지 생성 실패:', error);
            throw error;
          }
        }
      }
      
      // 현재 로그인한 사용자의 ID 토큰 가져오기
      const user = auth.currentUser;
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }
      const idToken = await user.getIdToken();

      // 진행 상황 업데이트 - 이메일 발송 시작
      setSendProgress({
        current: 0,
        total: selectedTAs.length,
        currentTA: '',
        status: '이메일 발송 준비 중...'
      });

      // 이메일 발송 API 호출
      const formData = new FormData();
      formData.append('subject', emailSubject.trim());
      formData.append('content', emailContent.trim());
      formData.append('taIds', JSON.stringify(selectedTAs.map(ta => ta.id)));
      formData.append('imageUrls', JSON.stringify(imageUrls));
      formData.append('includeLogo', includeLogo.toString());
      formData.append('attachments', JSON.stringify(selectedAttachments.map(att => ({
        id: att.id,
        type: att.type,
        name: att.name,
        fileName: att.fileName,
        fileUrl: att.fileUrl
      }))));

      const emailResponse = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
        body: formData
      });

      const result = await emailResponse.json();

      if (!emailResponse.ok) {
        throw new Error(result.error || '이메일 발송에 실패했습니다.');
      }

      // 발송 완료 시간 계산
      const endTime = Date.now();
      const duration = endTime - startTime;
      setSendDuration(duration);
      
      // 진행 상황 초기화
      setSendProgress(null);
      
      // 성공 시 생성된 파일 정보 초기화 (파일 유지)
      setGeneratedSessionId(null);
      
      // 활동 기록
      try {
        const user = auth.currentUser;
        if (user) {
          const idToken = await user.getIdToken();
          await fetch('/api/users/activity', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              action: 'emailSend',
              details: `TA 이메일 발송 - ${selectedTAs.length}명에게 "${emailSubject}" 제목으로 발송, 첨부파일: ${selectedAttachments.map(att => att.name).join(', ')}, 발송시간: ${duration}ms`,
              userId: user.uid,
              userEmail: user.email
            })
          });
        }
      } catch (error) {
        console.error('활동 기록 실패:', error);
      }
      
      alert(`${TEXT.sendSuccess[lang]}\n발송 시간: ${duration}ms (${(duration / 1000).toFixed(2)}초)`);
      
      // 성공 후 페이지 이동 전에 잠시 대기 (파일 정리 방지)
      setTimeout(() => {
        router.push("/admin/ta-list");
      }, 1000);
    } catch (error) {
      console.error("이메일 발송 실패:", error);
      
      // 실패 시에도 시간 계산
      const endTime = Date.now();
      const duration = startTime ? endTime - startTime : 0;
      setSendDuration(duration);
      
      // 진행 상황 초기화
      setSendProgress(null);
      
      // 실패 시 생성된 파일들 정리
      await cleanupGeneratedFiles();
      
      alert(`${error instanceof Error ? error.message : TEXT.sendError[lang]}\n처리 시간: ${duration}ms (${(duration / 1000).toFixed(2)}초)`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
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
        <Link
          href="/admin/ta-list"
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          {TEXT.backToList[lang]}
        </Link>
      </div>

      {/* 선택된 에이전트 정보 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-medium text-blue-800 mb-2">
          {TEXT.selectedAgents[lang]}
        </h2>
        <p className="text-blue-600">
          {selectedTAs.length} {TEXT.agentCount[lang]}
        </p>
        <div className="mt-3 space-y-1">
          {selectedTAs.map((ta) => (
            <div key={ta.id} className="text-sm text-blue-700">
              • {ta.companyName} ({ta.taCode}) - {ta.email}
            </div>
          ))}
        </div>
      </div>

      {/* 이메일 폼 */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          {/* 이메일 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {TEXT.emailSubject[lang]} *
            </label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => {
                setEmailSubject(e.target.value);
                if (errors.emailSubject) {
                  setErrors(prev => ({ ...prev, emailSubject: "" }));
                }
              }}
              placeholder={TEXT.emailSubjectPlaceholder[lang]}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.emailSubject ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.emailSubject && (
              <p className="mt-1 text-sm text-red-600">{errors.emailSubject}</p>
            )}
          </div>

          {/* 이메일 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {TEXT.emailContent[lang]} *
            </label>
            <textarea
              value={emailContent}
              onChange={(e) => {
                setEmailContent(e.target.value);
                if (errors.emailContent) {
                  setErrors(prev => ({ ...prev, emailContent: "" }));
                }
              }}
              placeholder={TEXT.emailContentPlaceholder[lang]}
              rows={8}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.emailContent ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.emailContent && (
              <p className="mt-1 text-sm text-red-600">{errors.emailContent}</p>
            )}
          </div>

          {/* 첨부 파일 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {TEXT.attachment[lang]}
            </label>
            <button
              type="button"
              onClick={openAttachmentModal}
              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-gray-600">{TEXT.selectAttachment[lang]}</span>
              </div>
            </button>
            
            {selectedAttachments.length > 0 && (
              <div className="mt-4 space-y-4">
                {selectedAttachments.map((attachment) => (
                  <div key={attachment.id} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <svg className="h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <span className="text-sm font-medium text-green-800">
                            {attachment.name}
                          </span>
                          <p className="text-xs text-green-600">
                            {attachment.fileSize ? (attachment.fileSize / 1024 / 1024).toFixed(2) : '0.00'} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(attachment.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* 미리보기 영역 (전단지만) */}
                    {attachment.type === 'poster' && (
                      <div className="mt-3">
                        {isLoadingPreview[attachment.id] ? (
                          <div className="flex items-center justify-center h-32 bg-gray-100 rounded">
                            <div className="text-gray-500">미리보기 로딩 중...</div>
                          </div>
                        ) : previewUrls[attachment.id] ? (
                          <div className="border border-gray-200 rounded overflow-hidden">
                            <Image 
                              src={previewUrls[attachment.id]} 
                              alt={`${attachment.name} 미리보기`}
                              width={600}
                              height={400}
                              className="w-full max-w-[600px] h-auto"
                              style={{ maxHeight: '400px', objectFit: 'contain' }}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-32 bg-gray-100 rounded">
                            <div className="text-gray-500">미리보기를 불러올 수 없습니다</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TA 로고 삽입 옵션 - 첨부파일이 있을 때만 표시 */}
          {selectedAttachments.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                첨부파일 처리 방식
              </h3>
              <div className="space-y-3">
                <label className={`flex items-start space-x-3 ${selectedAttachments.some(att => att.type === 'poster') ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                  <input
                    type="radio"
                    name="attachmentType"
                    checked={includeLogo}
                    onChange={() => selectedAttachments.some(att => att.type === 'poster') && setIncludeLogo(true)}
                    disabled={!selectedAttachments.some(att => att.type === 'poster')}
                    className="mt-1 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700">
                      {TEXT.includeLogo[lang]}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {selectedAttachments.some(att => att.type === 'poster')
                        ? '전단지에만 TA 로고가 삽입됩니다. IT와 레터는 원본 그대로 발송됩니다.'
                        : '전단지만 TA 로고 삽입이 가능합니다.'
                      }
                    </div>
                  </div>
                </label>
                
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="attachmentType"
                    checked={!includeLogo}
                    onChange={() => setIncludeLogo(false)}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700">
                      {TEXT.originalFile[lang]}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {TEXT.originalFileDesc[lang]}
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* 안내 메시지 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            {selectedAttachments.length > 0 ? (
              includeLogo ? (
                <>
                  <p className="text-sm text-yellow-800">
                    • 전단지에만 선택된 각 에이전트의 로고와 회사 정보가 상단 250px 영역에 합성되어 자동으로 첨부됩니다.
                  </p>
                  <p className="text-sm text-yellow-800 mt-1">
                    • 회사 정보: 회사명, 전화번호, 이메일이 3줄로 표시됩니다.
                  </p>
                  <p className="text-sm text-yellow-800 mt-1">
                    • IT와 레터는 원본 그대로 발송됩니다.
                  </p>
                  <p className="text-sm text-yellow-800 mt-1">
                    • 로고는 세로 200px 크기로 자동 조정되며, 가로 비율은 유지됩니다.
                  </p>
                </>
              ) : (
                <p className="text-sm text-yellow-800">
                  • 모든 첨부파일이 원본 그대로 발송됩니다.
                </p>
              )
            ) : (
              <p className="text-sm text-yellow-800">
                • 첨부파일이 원본 그대로 발송됩니다.
              </p>
            )}
            <p className="text-sm text-yellow-800 mt-1">
              • 이메일은 로그인한 사용자의 계정으로 발송됩니다.
            </p>
          </div>
        </div>

        {/* 진행 상황 표시 */}
        {sendProgress && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-blue-800">
                {TEXT.progress[lang]}
              </div>
              <div className="text-sm text-blue-600">
                {sendProgress.current}/{sendProgress.total}
              </div>
            </div>
            
            {/* 진행 바 */}
            <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(sendProgress.current / sendProgress.total) * 100}%` }}
              ></div>
            </div>
            
            {/* 현재 상태 */}
            <div className="text-sm text-blue-700">
              {sendProgress.currentTA && (
                <div className="mb-1">
                  {TEXT.sendingTo[lang]}: <span className="font-medium">{sendProgress.currentTA}</span>
                </div>
              )}
              <div>{sendProgress.status}</div>
            </div>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={async () => {
              // 취소 시 생성된 파일들 정리
              await cleanupGeneratedFiles();
              window.location.href = "/admin/ta-list";
            }}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {TEXT.cancel[lang]}
          </button>
          <div className="flex items-center gap-4">
            {/* 발송 시간 표시 */}
            {sendDuration !== null && (
              <div className="text-sm text-gray-600">
                {TEXT.sendTime[lang]}: {sendDuration}ms ({(sendDuration / 1000).toFixed(2)}초)
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? TEXT.sendingEmail[lang] : TEXT.send[lang]}
            </button>
          </div>
        </div>
      </form>

      {/* 첨부파일 선택 모달 */}
      {showAttachmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* 모달 헤더 */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">{TEXT.selectAttachment[lang]}</h2>
              <button
                onClick={() => setShowAttachmentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 검색 및 필터 */}
            <div className="p-6 border-b bg-gray-50">
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder={TEXT.searchPlaceholder[lang]}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as 'all' | 'poster' | 'itinerary' | 'letter')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">전체</option>
                  <option value="poster">{TEXT.posters[lang]}</option>
                  <option value="itinerary">{TEXT.itineraries[lang]}</option>
                  <option value="letter">{TEXT.letters[lang]}</option>
                </select>
              </div>
              {isLoadingAttachments && (
                <div className="mt-2 text-sm text-gray-600">
                  검색 중...
                </div>
              )}
            </div>

            {/* 파일 목록 */}
            <div className="overflow-y-auto max-h-96">
              {isLoadingAttachments ? (
                <div className="p-6 text-center">
                  <div className="text-gray-500">로딩 중...</div>
                </div>
              ) : attachments.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="text-gray-500">{TEXT.noFiles[lang]}</div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {attachments.map((attachment) => {
                      const isSelected = selectedAttachments.some(selected => selected.id === attachment.id);
                      const typeLabels = {
                        poster: TEXT.posters[lang],
                        itinerary: TEXT.itineraries[lang],
                        letter: TEXT.letters[lang]
                      };
                      
                      return (
                        <div
                          key={attachment.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                          onClick={() => handleSelectAttachment(attachment)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  attachment.type === 'poster' ? 'bg-red-100 text-red-800' :
                                  attachment.type === 'itinerary' ? 'bg-blue-100 text-blue-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {typeLabels[attachment.type]}
                                </span>
                              </div>
                              <h3 className="font-medium text-gray-900 mb-1">{attachment.name}</h3>
                              <p className="text-sm text-gray-500 mb-2">{attachment.fileName}</p>
                              <p className="text-xs text-gray-400">
                                {attachment.fileSize ? (attachment.fileSize / 1024 / 1024).toFixed(2) : '0.00'} MB
                              </p>
                            </div>
                            <div className="ml-2">
                              {isSelected ? (
                                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 모달 푸터 */}
            <div className="flex justify-end gap-4 p-6 border-t">
              <button
                onClick={() => setShowAttachmentModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                닫기
              </button>
              <button
                onClick={() => setShowAttachmentModal(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                선택 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 