"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../../../../components/LanguageContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "../../../../lib/firebase";
import Image from "next/image";

// 다국어 텍스트
const TEXT = {
  title: { ko: "새 전단지 추가", en: "Add New Poster" },
  backToList: { ko: "목록으로 돌아가기", en: "Back to List" },
  save: { ko: "저장", en: "Save" },
  cancel: { ko: "취소", en: "Cancel" },
  posterName: { ko: "전단지 이름", en: "Poster Name" },
  posterNamePlaceholder: { ko: "전단지 이름을 입력하세요", en: "Enter poster name" },
  uploadImage: { ko: "이미지 업로드", en: "Upload Image" },
  uploadImagePlaceholder: { ko: "이미지 파일을 선택하세요", en: "Select image file" },
  required: { ko: "필수 입력 항목입니다", en: "This field is required" },
  saving: { ko: "저장 중...", en: "Saving..." },
  saveSuccess: { ko: "전단지가 성공적으로 저장되었습니다", en: "Poster saved successfully" },
  saveError: { ko: "전단지 저장에 실패했습니다", en: "Failed to save poster" },
  fileTypeError: { ko: "이미지 파일만 업로드 가능합니다", en: "Only image files are allowed" },
  fileSizeError: { ko: "파일 크기는 10MB 이하여야 합니다", en: "File size must be less than 10MB" },
  preview: { ko: "미리보기", en: "Preview" }
};

export default function NewPosterPage() {
  const { lang } = useLanguage();
  const router = useRouter();
  
  const [posterName, setPosterName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileValidation(files[0]);
    }
  };

  const handleFileValidation = (file: File) => {
    const newErrors: Record<string, string> = {};

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      newErrors.file = TEXT.fileTypeError[lang];
      setErrors(newErrors);
      return;
    }

    // 파일 크기 검증 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      newErrors.file = TEXT.fileSizeError[lang];
      setErrors(newErrors);
      return;
    }

    setSelectedFile(file);
    setErrors(prev => ({ ...prev, file: "" }));
    
    // 미리보기 URL 생성
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
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

  // 컴포넌트 언마운트 시 미리보기 URL 정리
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 검증
    const newErrors: Record<string, string> = {};
    if (!posterName.trim()) {
      newErrors.posterName = TEXT.required[lang];
    }
    if (!selectedFile) {
      newErrors.file = TEXT.required[lang];
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      // Firebase ID 토큰 가져오기
      const user = auth.currentUser;
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }
      
      const idToken = await user.getIdToken();
      
      const formData = new FormData();
      formData.append('name', posterName.trim());
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const response = await fetch('/api/posters', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '전단지 저장에 실패했습니다.');
      }

      alert(TEXT.saveSuccess[lang]);
      router.push('/admin/posters');
    } catch (error) {
      console.error("전단지 저장 실패:", error);
      alert(error instanceof Error ? error.message : TEXT.saveError[lang]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{TEXT.title[lang]}</h1>
        <Link
          href="/admin/posters"
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          {TEXT.backToList[lang]}
        </Link>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="space-y-6">
          {/* 전단지 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {TEXT.posterName[lang]} *
            </label>
            <input
              type="text"
              value={posterName}
              onChange={(e) => {
                setPosterName(e.target.value);
                if (errors.posterName) {
                  setErrors(prev => ({ ...prev, posterName: "" }));
                }
              }}
              placeholder={TEXT.posterNamePlaceholder[lang]}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.posterName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.posterName && (
              <p className="mt-1 text-sm text-red-600">{errors.posterName}</p>
            )}
          </div>

          {/* 이미지 업로드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {TEXT.uploadImage[lang]} *
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
                accept="image/*"
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
                    JPG, PNG, GIF (최대 10MB)
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

           {/* 미리보기 섹션 */}
           {previewUrl && (
             <div className="mt-6">
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 {TEXT.preview[lang]}
               </label>
               <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                 <div className="flex justify-center">
                   <div className="relative" style={{ width: '800px', height: '1131px' }}>
                     <Image
                       src={previewUrl}
                       alt="전단지 미리보기"
                       fill
                       className="object-contain"
                       sizes="800px"
                     />
                   </div>
                 </div>
                 <div className="mt-2 text-center text-sm text-gray-500">
                   A4 비율 (800 x 1131px)
                 </div>
               </div>
             </div>
           )}
         </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-4 mt-6">
          <Link
            href="/admin/posters"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            {TEXT.cancel[lang]}
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? TEXT.saving[lang] : TEXT.save[lang]}
          </button>
        </div>
      </form>
    </div>
  );
} 