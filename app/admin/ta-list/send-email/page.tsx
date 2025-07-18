"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../../../../components/LanguageContext";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

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
  includeLogo: { ko: "TA 로고 삽입", en: "Include TA Logo" },
  includeLogoDesc: { ko: "선택된 각 TA의 로고를 첨부파일 상단에 합성하여 발송", en: "Composite TA logos on top of attachment for each selected agent" },
  originalFile: { ko: "원본 파일", en: "Original File" },
  originalFileDesc: { ko: "첨부파일을 그대로 발송", en: "Send attachment as is" }
};

interface SelectedTA {
  id: string;
  companyName: string;
  taCode: string;
  email: string;
  logo: string;
}

export default function SendEmailPage() {
  const { lang } = useLanguage();
  const searchParams = useSearchParams();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTAs, setSelectedTAs] = useState<SelectedTA[]>([]);
  
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const [includeLogo, setIncludeLogo] = useState(true); // TA 로고 삽입 여부

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFileValidation(files);
  };

  const handleFileValidation = (files: File[]) => {
    if (files.length === 0) return;
    
    const validFiles: File[] = [];
    
    for (const file of files) {
      // 파일 크기 제한 (10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert(`파일 "${file.name}"의 크기는 10MB를 초과할 수 없습니다.`);
        continue;
      }
      
      // 허용된 파일 타입 확인 (JPG, PDF만 허용)
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        alert(`파일 "${file.name}"은 지원되지 않는 형식입니다. JPG와 PDF 파일만 업로드 가능합니다.`);
        continue;
      }
      
      validFiles.push(file);
    }
    
    if (validFiles.length > 0) {
      setAttachments(prev => [...prev, ...validFiles]);
      
      // JPG 파일이 하나라도 있으면 TA 로고 삽입 옵션을 활성화
      const hasImageFile = validFiles.some(file => file.type.startsWith('image/'));
      if (hasImageFile) {
        setIncludeLogo(true);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileValidation(files);
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

    setIsLoading(true);
    try {
      let imageUrls: string[] = [];

      // TA 로고 삽입이 선택된 경우에만 이미지 생성
      if (includeLogo && attachments.length > 0) {
        // JPG 파일들만 필터링
        const imageFiles = attachments.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length > 0) {
          // 첫 번째 JPG 파일을 기준으로 이미지 생성
          const firstImageFile = imageFiles[0];
          
          try {
            const arrayBuffer = await firstImageFile.arrayBuffer();
            const attachmentBase64 = Buffer.from(arrayBuffer).toString('base64');
            const attachmentType = firstImageFile.type;
            console.log('첨부파일 Base64 인코딩 완료');
            
            // 이미지 합성 API 호출
            const imageResponse = await fetch('/api/generate-email-images', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                taIds: selectedTAs.map(ta => ta.id),
                attachmentBase64,
                attachmentType
              })
            });

            if (!imageResponse.ok) {
              throw new Error('이미지 생성에 실패했습니다.');
            }

            const imageResult = await imageResponse.json();
            imageUrls = imageResult.imageUrls;
          } catch (error) {
            console.error('첨부파일 인코딩 실패:', error);
          }
        }
      }
      
      // 현재 로그인한 사용자의 ID 토큰 가져오기
      const { auth } = await import('@/lib/firebase');
      const user = auth.currentUser;
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }
      const idToken = await user.getIdToken();

      // 이메일 발송 API 호출
      const formData = new FormData();
      formData.append('subject', emailSubject.trim());
      formData.append('content', emailContent.trim());
      formData.append('taIds', JSON.stringify(selectedTAs.map(ta => ta.id)));
      formData.append('imageUrls', JSON.stringify(imageUrls));
      formData.append('includeLogo', includeLogo.toString());
      
      // 모든 첨부파일 추가
      attachments.forEach((attachment, index) => {
        formData.append(`attachment_${index}`, attachment);
      });
      formData.append('attachmentCount', attachments.length.toString());

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

      alert(TEXT.sendSuccess[lang]);
      window.location.href = "/admin/ta-list";
    } catch (error) {
      console.error("이메일 발송 실패:", error);
      alert(error instanceof Error ? error.message : TEXT.sendError[lang]);
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

          {/* 첨부 파일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {TEXT.attachment[lang]}
            </label>
            <div
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer
                ${isDragOver 
                  ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg"
                multiple
                className="hidden"
                id="file-upload"
              />
              
              <div className="space-y-4">
                {/* 드래그 아이콘 */}
                <div className="flex justify-center">
                  <div className={`
                    p-4 rounded-full transition-colors
                    ${isDragOver 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-400'
                    }
                  `}>
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className={`text-lg font-medium transition-colors ${
                    isDragOver ? 'text-blue-600' : 'text-gray-700'
                  }`}>
                    {isDragOver 
                      ? '여기에 파일을 놓으세요' 
                      : '파일을 드래그하거나 클릭하여 업로드'
                    }
                  </div>
                  <div className="text-sm text-gray-500">
                    JPG, PDF (최대 10MB)
                  </div>
                </div>
              </div>
            </div>
            
            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <svg className="h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <span className="text-sm font-medium text-green-800">
                            {attachment.name}
                          </span>
                          <p className="text-xs text-green-600">
                            {(attachment.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAttachments(prev => prev.filter((_, i) => i !== index));
                          // 모든 JPG 파일이 제거되면 TA 로고 삽입 옵션 비활성화
                          const remainingFiles = attachments.filter((_, i) => i !== index);
                          const hasImageFile = remainingFiles.some(file => file.type.startsWith('image/'));
                          if (!hasImageFile) {
                            setIncludeLogo(false);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TA 로고 삽입 옵션 - 첨부파일이 있을 때만 표시 */}
          {attachments.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                첨부파일 처리 방식
              </h3>
              <div className="space-y-3">
                <label className={`flex items-start space-x-3 ${attachments.some(file => file.type.startsWith('image/')) ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                  <input
                    type="radio"
                    name="attachmentType"
                    checked={includeLogo}
                    onChange={() => attachments.some(file => file.type.startsWith('image/')) && setIncludeLogo(true)}
                    disabled={!attachments.some(file => file.type.startsWith('image/'))}
                    className="mt-1 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700">
                      {TEXT.includeLogo[lang]}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {attachments.some(file => file.type.startsWith('image/'))
                        ? 'JPG 파일에만 TA 로고가 삽입됩니다. PDF 파일은 원본 그대로 발송됩니다.'
                        : 'JPG 파일만 TA 로고 삽입이 가능합니다.'
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
            {attachments.length > 0 ? (
              includeLogo ? (
                <>
                  <p className="text-sm text-yellow-800">
                    • JPG 파일에만 선택된 각 에이전트의 로고가 상단 260px 영역에 왼쪽 정렬로 합성되어 자동으로 첨부됩니다.
                  </p>
                  <p className="text-sm text-yellow-800 mt-1">
                    • PDF 파일은 원본 그대로 발송됩니다.
                  </p>
                  <p className="text-sm text-yellow-800 mt-1">
                    • 로고는 세로 250px 크기로 자동 조정되며, 가로 비율은 유지됩니다.
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

        {/* 버튼 */}
        <div className="flex justify-end gap-4 mt-6">
          <Link
            href="/admin/ta-list"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            {TEXT.cancel[lang]}
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? TEXT.sending[lang] : TEXT.send[lang]}
          </button>
        </div>
      </form>
    </div>
  );
} 