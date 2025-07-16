"use client";

import React, { useState, useRef } from 'react';
import Image from 'next/image';

import { ImageUsage } from '@/lib/image-optimizer';

interface ImageUploaderProps {
  onImagesSelected: (files: File[]) => void;
  onImagesUploaded?: (urls: string[]) => void;
  folder?: string;
  multiple?: boolean;
  maxFiles?: number;
  className?: string;
  disabled?: boolean;
  showOptimizationInfo?: boolean;
  // 로컬 미리보기 모드 (저장 시 업로드)
  localPreviewMode?: boolean;
  // 용도별 최적화 설정
  usage?: ImageUsage;
}

interface UploadedImage {
  url: string;
  originalName: string;
  optimized: boolean;
}

interface LocalImage {
  file: File;
  preview: string;
  originalName: string;
}

const ImageUploader = React.forwardRef<{
  uploadToStorage: () => Promise<{
    urls: string[];
  }>;
  getLocalImages: () => LocalImage[];
  clearAll: () => void;
}, ImageUploaderProps>(({
  onImagesSelected,
  onImagesUploaded,
  folder = 'uploads',
  multiple = false,
  maxFiles = 10,
  className = '',
  disabled = false,
  showOptimizationInfo = true,
  usage = 'custom'
}, ref) => {
  const [localImages, setLocalImages] = useState<LocalImage[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 로컬 미리보기 생성
  const createLocalPreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (files: FileList) => {
    if (disabled) return;

    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    if (multiple && localImages.length + imageFiles.length > maxFiles) {
      setError(`최대 ${maxFiles}개의 이미지만 업로드 가능합니다.`);
      return;
    }

    setError(null);

    try {
      // 로컬 미리보기 생성
      const previewPromises = imageFiles.map(async (file) => {
        const preview = await createLocalPreview(file);
        return {
          file,
          preview,
          originalName: file.name
        };
      });

      const newLocalImages = await Promise.all(previewPromises);
      
      if (multiple) {
        setLocalImages(prev => [...prev, ...newLocalImages]);
      } else {
        setLocalImages(newLocalImages);
      }

      // 부모 컴포넌트에 파일 목록 전달
      const allFiles = multiple 
        ? [...localImages.map(img => img.file), ...imageFiles]
        : imageFiles;
      
      onImagesSelected(allFiles);

    } catch (err) {
      setError(err instanceof Error ? err.message : '파일 처리 중 오류가 발생했습니다.');
    }
  };

  // 실제 스토리지 업로드 (저장 시 호출)
  const uploadToStorage = async (): Promise<{
    urls: string[];
  }> => {
    if (localImages.length === 0) {
      return { urls: [] };
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const { uploadFileToServer } = await import('@/lib/utils');
      
      const uploadPromises = localImages.map(async (localImage, index) => {
        const result = await uploadFileToServer(localImage.file, folder, true, usage);
        
        if (!result.success) {
          throw new Error(result.error || '업로드 실패');
        }

        setUploadProgress(((index + 1) / localImages.length) * 100);

        return {
          url: result.url!,
          originalName: localImage.originalName,
          optimized: result.optimized || false
        };
      });

      const uploadedResults = await Promise.all(uploadPromises);
      setUploadedImages(uploadedResults);

      // 부모 컴포넌트에 결과 전달
      const urls = uploadedResults.map(img => img.url);

      if (onImagesUploaded) {
        onImagesUploaded(urls);
      }

      return { urls };

    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다.');
      throw err;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
    
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  const removeImage = (index: number) => {
    setLocalImages(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setLocalImages([]);
    setUploadedImages([]);
  };

  // 외부에서 호출할 수 있는 업로드 함수
  React.useImperativeHandle(ref, () => ({
    uploadToStorage,
    getLocalImages: () => localImages,
    clearAll
  }));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 드래그 앤 드롭 영역 */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${disabled 
            ? 'border-gray-200 bg-gray-50 text-gray-400' 
            : 'border-gray-300 hover:border-gray-400 cursor-pointer'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
        
        {isUploading ? (
          <div className="space-y-2">
            <div className="text-blue-600 font-medium">업로드 중...</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="text-sm text-gray-500">{Math.round(uploadProgress)}%</div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-gray-600">
              {multiple ? '이미지들을 드래그하거나 클릭하여 선택하세요' : '이미지를 드래그하거나 클릭하여 선택하세요'}
            </div>
            <div className="text-sm text-gray-400">
              {multiple ? `최대 ${maxFiles}개까지 업로드 가능` : 'JPG, PNG, WebP 지원'}
            </div>
            {showOptimizationInfo && (
              <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                ✓ 로컬 미리보기 모드 (저장 시 최적화 업로드)
              </div>
            )}
          </div>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="text-red-500 text-sm bg-red-50 p-3 rounded">
          {error}
        </div>
      )}

      {/* 로컬 이미지 미리보기 */}
      {localImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-700">
              선택된 이미지 ({localImages.length}개)
            </h3>
            {multiple && (
              <button
                type="button"
                onClick={clearAll}
                className="text-sm text-red-600 hover:text-red-800"
              >
                모두 삭제
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {localImages.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square relative overflow-hidden rounded-lg border">
                  <Image
                    src={image.preview}
                    alt={image.originalName}
                    fill
                    className="object-cover"
                  />
                </div>
                
                {/* 로컬 미리보기 표시 */}
                <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded">
                  미리보기
                </div>
                
                {/* 삭제 버튼 */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
                
                {/* 파일명 */}
                <div className="mt-1 text-xs text-gray-500 truncate">
                  {image.originalName}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 업로드된 이미지 표시 (저장 후) */}
      {uploadedImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-700">
              업로드된 이미지 ({uploadedImages.length}개)
            </h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedImages.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square relative overflow-hidden rounded-lg border">
                                  <Image
                  src={image.url}
                  alt={image.originalName}
                  fill
                  className="object-cover"
                />
                </div>
                
                {/* 최적화 정보 */}
                {showOptimizationInfo && image.optimized && (
                  <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
                    최적화됨
                  </div>
                )}
                
                {/* 파일명 */}
                <div className="mt-1 text-xs text-gray-500 truncate">
                  {image.originalName}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

ImageUploader.displayName = 'ImageUploader';

export default ImageUploader; 