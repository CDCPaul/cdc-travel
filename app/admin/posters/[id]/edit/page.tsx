"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useLanguage } from "../../../../../components/LanguageContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "../../../../../lib/firebase";
import Image from "next/image";

// 다국어 텍스트
const TEXT = {
  title: { ko: "전단지 편집", en: "Edit Poster" },
  backToList: { ko: "목록으로 돌아가기", en: "Back to List" },
  save: { ko: "저장", en: "Save" },
  cancel: { ko: "취소", en: "Cancel" },
  posterName: { ko: "전단지 이름", en: "Poster Name" },
  posterNamePlaceholder: { ko: "전단지 이름을 입력하세요", en: "Enter poster name" },
  uploadImage: { ko: "이미지 업로드", en: "Upload Image" },
  uploadImagePlaceholder: { ko: "이미지 파일을 선택하세요", en: "Select image file" },
  required: { ko: "필수 입력 항목입니다", en: "This field is required" },
  saving: { ko: "저장 중...", en: "Saving..." },
  saveSuccess: { ko: "전단지가 성공적으로 수정되었습니다", en: "Poster updated successfully" },
  saveError: { ko: "전단지 수정에 실패했습니다", en: "Failed to update poster" },
  fileTypeError: { ko: "이미지 파일만 업로드 가능합니다", en: "Only image files are allowed" },
  fileSizeError: { ko: "파일 크기는 10MB 이하여야 합니다", en: "File size must be less than 10MB" },
  preview: { ko: "미리보기", en: "Preview" },
  loading: { ko: "로딩중...", en: "Loading..." },
  error: { ko: "전단지를 불러오는데 실패했습니다", en: "Failed to load poster" },
  currentImage: { ko: "현재 이미지", en: "Current Image" },
  newImage: { ko: "새 이미지", en: "New Image" },
  keepCurrentImage: { ko: "현재 이미지 유지", en: "Keep Current Image" }
};

interface Poster {
  id: string;
  name: string;
  url: string;
  size: number;
  createdAt: Date | { seconds: number; nanoseconds: number } | string;
  createdBy?: string;
}

export default function EditPosterPage({ params }: { params: Promise<{ id: string }> }) {
  const { lang } = useLanguage();
  const router = useRouter();
  const { id: posterId } = use(params);
  
  const [poster, setPoster] = useState<Poster | null>(null);
  const [posterName, setPosterName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState(false);

  // 전단지 데이터 불러오기
  const fetchPoster = useCallback(async () => {
    try {
      setIsLoadingData(true);
      
      // Firebase ID 토큰 가져오기
      const user = auth.currentUser;
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }
      
      const idToken = await user.getIdToken();
      
      const response = await fetch(`/api/posters/${posterId}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load data.");
      }

      setPoster(result.data);
      setPosterName(result.data.name);
    } catch (error) {
      console.error('전단지 데이터 로드 실패:', error);
      alert(error instanceof Error ? error.message : TEXT.error[lang]);
      router.push('/admin/posters');
    } finally {
      setIsLoadingData(false);
    }
  }, [posterId, router, lang]);

  useEffect(() => {
    fetchPoster();
  }, [fetchPoster]);

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

      const response = await fetch(`/api/posters/${posterId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${idToken}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '전단지 수정에 실패했습니다.');
      }

      alert(TEXT.saveSuccess[lang]);
      router.push('/admin/posters');
    } catch (error) {
      console.error("전단지 수정 실패:", error);
      alert(error instanceof Error ? error.message : TEXT.saveError[lang]);
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

  if (!poster) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-lg text-red-600">{TEXT.error[lang]}</p>
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

          {/* 현재 이미지 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {TEXT.currentImage[lang]}
            </label>
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="flex justify-center">
                <div className="relative" style={{ width: '400px', height: '565px' }}>
                  <Image
                    src={poster.url}
                    alt="현재 전단지"
                    fill
                    className="object-contain"
                    sizes="400px"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 새 이미지 업로드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {TEXT.newImage[lang]}
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
                    JPG, PNG, GIF (최대 10MB) - 선택사항
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

          {/* 새 이미지 미리보기 */}
          {previewUrl && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {TEXT.preview[lang]} ({TEXT.newImage[lang]})
              </label>
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <div className="flex justify-center">
                  <div className="relative" style={{ width: '800px', height: '1131px' }}>
                    <Image
                      src={previewUrl}
                      alt="새 전단지 미리보기"
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