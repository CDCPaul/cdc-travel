"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import ImageUploader from '@/components/ui/ImageUploader';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ImageUsage } from '@/lib/image-optimizer';

export default function TestImageOptimizationPage() {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  
  const [selectedUsage, setSelectedUsage] = useState<ImageUsage>('product-card');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [hasLocalImages, setHasLocalImages] = useState(false);
  const imageUploaderRef = useRef<{ uploadToStorage: () => Promise<{ urls: string[] }>; getLocalImages: () => { file: File; preview: string; originalName: string }[]; clearAll: () => void }>(null);

  const handleImagesUploaded = (urls: string[]) => {
    setUploadedImages(urls);
  };

  const handleSave = async () => {
    if (!hasLocalImages) {
      setSaveMessage('저장할 이미지가 없습니다.');
      return;
    }

    setSaving(true);
    setSaveMessage('');

    try {
      // 먼저 이미지를 Storage에 업로드
      if (imageUploaderRef.current) {
        await imageUploaderRef.current.uploadToStorage();
      }

      // Firestore에 테스트 데이터 저장
      const testData = {
        title: '이미지 최적화 테스트',
        description: 'Sharp를 사용한 이미지 최적화 테스트 결과',
        imageUrls: uploadedImages,
        createdAt: new Date(),
        testType: 'image-optimization'
      };

      await addDoc(collection(db, 'test-uploads'), testData);
      
      setSaveMessage('성공적으로 저장되었습니다!');
      console.log('테스트 데이터가 Firestore에 저장되었습니다:', testData);
    } catch (error) {
      console.error('저장 중 오류:', error);
      setSaveMessage('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">이미지 최적화 테스트</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 이미지 업로드 섹션 */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">이미지 업로드</h2>
            
            {/* 저장 위치 정보 */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">저장 위치</h3>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Firebase Storage: <code className="bg-blue-100 px-1 rounded">test/</code> 폴더</li>
                <li>• Firestore: <code className="bg-blue-100 px-1 rounded">test-uploads</code> 컬렉션</li>
                <li>• 이미지 최적화: WebP, JPEG 썸네일, 웹 최적화 버전 생성</li>
              </ul>
            </div>
            


            {/* 용도별 최적화 설정 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">이미지 용도별 최적화</label>
              <select
                value={selectedUsage}
                onChange={(e) => setSelectedUsage(e.target.value as ImageUsage)}
                className="w-full p-2 border rounded"
              >
                <option value="hero-banner">메인 배너 (1200x800)</option>
                <option value="product-card">상품 카드 (600x400)</option>
                <option value="travel-info-main">여행정보 메인 (800x500)</option>
                <option value="travel-info-gallery">여행정보 갤러리 (600x400)</option>
                <option value="product-detail">상품 상세 (800x1132)</option>
                <option value="admin-thumbnail">관리자 썸네일 (300x200)</option>
                <option value="spot-image">관광지 이미지 (600x400)</option>
                <option value="custom">커스텀 설정</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                선택된 용도에 맞는 크기로 최적화됩니다
              </p>
            </div>
            
            <ImageUploader
              ref={imageUploaderRef}
              onImagesSelected={(files) => {
                console.log('테스트 이미지 선택됨:', files.length);
                setHasLocalImages(files.length > 0);
              }}
              onImagesUploaded={handleImagesUploaded}
              folder="test"
              multiple={true}
              maxFiles={5}
              showOptimizationInfo={true}
              usage={selectedUsage}
            />
            
            {/* 저장하기 버튼 */}
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={handleSave}
                disabled={saving || !hasLocalImages}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {saving ? '저장 중...' : '저장하기'}
              </button>
              {saveMessage && (
                <p className={`text-sm mt-2 ${saveMessage.includes('성공') ? 'text-green-600' : 'text-red-600'}`}>
                  {saveMessage}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 결과 표시 섹션 */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">업로드 결과</h2>
            
            {uploadedImages.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">최적화된 이미지 ({uploadedImages.length}개)</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {uploadedImages.map((url, index) => (
                      <div key={index} className="relative">
                        <Image 
                          src={url} 
                          alt={`Optimized ${index + 1}`}
                          width={200}
                          height={128}
                          className="w-full h-32 object-cover rounded"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          최적화된 이미지 {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">최적화 정보</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• WebP 포맷으로 변환, 품질 80%</li>
                    <li>• 용도별 크기로 자동 리사이징</li>
                    <li>• CSS로 반응형 크기 조절</li>
                    <li>• 단일 이미지 저장으로 효율성 증대</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">
                이미지를 업로드하면 최적화 결과가 여기에 표시됩니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 