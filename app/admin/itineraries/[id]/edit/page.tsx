"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../../../../../components/LanguageContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "../../../../../lib/firebase";
import { use } from "react";

// 다국어 텍스트
const TEXT = {
  title: { ko: "IT 수정", en: "Edit IT" },
  backToList: { ko: "목록으로 돌아가기", en: "Back to List" },
  save: { ko: "저장", en: "Save" },
  cancel: { ko: "취소", en: "Cancel" },
  itName: { ko: "IT 이름", en: "IT Name" },
  itNamePlaceholder: { ko: "IT 이름을 입력하세요", en: "Enter IT name" },
  currentFile: { ko: "현재 파일", en: "Current File" },
  replaceFile: { ko: "파일 교체", en: "Replace File" },
  replaceFilePlaceholder: { ko: "새 PDF 파일을 선택하세요", en: "Select new PDF file" },
  required: { ko: "필수 입력 항목입니다", en: "This field is required" },
  loading: { ko: "로딩 중...", en: "Loading..." },
  saving: { ko: "저장 중...", en: "Saving..." },
  saveSuccess: { ko: "IT가 성공적으로 수정되었습니다", en: "IT updated successfully" },
  saveError: { ko: "IT 수정에 실패했습니다", en: "Failed to update IT" },
  loadError: { ko: "IT 정보를 불러오는데 실패했습니다", en: "Failed to load IT information" },
  fileTypeError: { ko: "PDF 파일만 업로드 가능합니다", en: "Only PDF files are allowed" },
  fileSizeError: { ko: "파일 크기는 50MB 이하여야 합니다", en: "File size must be less than 50MB" },
  download: { ko: "다운로드", en: "Download" }
};

interface Itinerary {
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

export default function EditItineraryPage({ params }: { params: Promise<{ id: string }> }) {
  const { lang } = useLanguage();
  const router = useRouter();
  const { id } = use(params);
  
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [itName, setItName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState(false);

  // IT 정보 불러오기
  useEffect(() => {
    const fetchItinerary = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          throw new Error("로그인이 필요합니다.");
        }
        
        const idToken = await user.getIdToken();
        
        const response = await fetch(`/api/itineraries/${id}`, {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });

        if (!response.ok) {
          throw new Error('IT 정보를 불러올 수 없습니다.');
        }

        const data = await response.json();
        setItinerary(data);
        setItName(data.name);
      } catch (error) {
        console.error("IT 정보 불러오기 실패:", error);
        alert(TEXT.loadError[lang]);
        router.push('/admin/itineraries');
      } finally {
        setIsLoading(false);
      }
    };

    fetchItinerary();
  }, [id, lang, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileValidation(files[0]);
    }
  };

  const handleFileValidation = (file: File) => {
    const newErrors: Record<string, string> = {};

    // 파일 타입 검증 (PDF만 허용)
    if (file.type !== 'application/pdf') {
      newErrors.file = TEXT.fileTypeError[lang];
      setErrors(newErrors);
      return;
    }

    // 파일 크기 검증 (50MB)
    if (file.size > 50 * 1024 * 1024) {
      newErrors.file = TEXT.fileSizeError[lang];
      setErrors(newErrors);
      return;
    }

    setSelectedFile(file);
    setErrors(prev => ({ ...prev, file: "" }));
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
      handleFileValidation(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 검증
    const newErrors: Record<string, string> = {};
    if (!itName.trim()) {
      newErrors.itName = TEXT.required[lang];
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    try {
      // Firebase ID 토큰 가져오기
      const user = auth.currentUser;
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }
      
      const idToken = await user.getIdToken();
      
      const formData = new FormData();
      formData.append('name', itName.trim());
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const response = await fetch(`/api/itineraries/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${idToken}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'IT 수정에 실패했습니다.');
      }

      alert(TEXT.saveSuccess[lang]);
      router.push('/admin/itineraries');
    } catch (error) {
      console.error("IT 수정 실패:", error);
      alert(error instanceof Error ? error.message : TEXT.saveError[lang]);
    } finally {
      setIsSaving(false);
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

  if (!itinerary) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600">IT를 찾을 수 없습니다.</p>
          <Link href="/admin/itineraries" className="text-blue-600 hover:underline">
            목록으로 돌아가기
          </Link>
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
          href="/admin/itineraries"
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          {TEXT.backToList[lang]}
        </Link>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="space-y-6">
          {/* IT 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {TEXT.itName[lang]} *
            </label>
            <input
              type="text"
              value={itName}
              onChange={(e) => {
                setItName(e.target.value);
                if (errors.itName) {
                  setErrors(prev => ({ ...prev, itName: "" }));
                }
              }}
              placeholder={TEXT.itNamePlaceholder[lang]}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.itName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.itName && (
              <p className="mt-1 text-sm text-red-600">{errors.itName}</p>
            )}
          </div>

          {/* 현재 파일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {TEXT.currentFile[lang]}
            </label>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {itinerary.fileName}
                    </span>
                    <p className="text-xs text-gray-500">
                      {(itinerary.fileSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <a
                  href={itinerary.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {TEXT.download[lang]}
                </a>
              </div>
            </div>
          </div>

          {/* 파일 교체 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {TEXT.replaceFile[lang]}
            </label>
            <div
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer
                ${isDragOver 
                  ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }
                ${errors.file ? 'border-red-500' : ''}
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,application/pdf"
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
                      : '새 PDF 파일을 드래그하거나 클릭하여 업로드'
                    }
                  </div>
                  <div className="text-sm text-gray-500">
                    PDF 파일만 (최대 50MB)
                  </div>
                </div>
              </div>
            </div>
            
            {selectedFile && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <svg className="h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <span className="text-sm font-medium text-green-800">
                      {selectedFile.name}
                    </span>
                    <p className="text-xs text-green-600">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {errors.file && (
              <p className="mt-1 text-sm text-red-600">{errors.file}</p>
            )}
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-4 mt-6">
          <Link
            href="/admin/itineraries"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            {TEXT.cancel[lang]}
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? TEXT.saving[lang] : TEXT.save[lang]}
          </button>
        </div>
      </form>
    </div>
  );
} 