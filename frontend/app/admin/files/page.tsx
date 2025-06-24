'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { auth, storage } from '@/lib/firebase';
import Link from 'next/link';
import Image from "next/image";

interface FileItem {
  name: string;
  url: string;
  path: string;
  size?: number;
  type?: string;
}

export default function AdminFiles() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const categories = [
    { id: 'products', name: '상품 이미지' },
    { id: 'main-page', name: '메인 페이지' },
    { id: 'travel-info', name: '여행 정보' },
    { id: 'content', name: '콘텐츠' }
  ];

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const listRef = ref(storage, 'products');
      const res = await listAll(listRef);
      const filePromises = res.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        return {
          name: itemRef.name,
          url,
          path: itemRef.fullPath
        };
      });
      const fileList = await Promise.all(filePromises);
      setFiles(fileList);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchFiles();
      } else {
        router.push('/admin/login');
      }
    });
    return () => unsubscribe();
  }, [router, fetchFiles]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
      });

      await Promise.all(uploadPromises);
      fetchFiles();
      alert('파일이 성공적으로 업로드되었습니다.');
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('파일 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (filePath: string, fileName: string) => {
    if (confirm(`정말로 "${fileName}" 파일을 삭제하시겠습니까?`)) {
      try {
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);
        fetchFiles();
        alert('파일이 삭제되었습니다.');
      } catch (error) {
        console.error('Error deleting file:', error);
        alert('파일 삭제에 실패했습니다.');
      }
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('URL이 클립보드에 복사되었습니다.');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-700">
                ← 대시보드로 돌아가기
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">파일 관리</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Category Selection */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">카테고리 선택</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => fetchFiles()}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    category.id === 'products'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">파일 업로드</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {categories.find(c => c.id === 'products')?.name} 업로드
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                />
                {uploading && (
                  <p className="mt-2 text-sm text-blue-600">업로드 중...</p>
                )}
              </div>
            </div>
          </div>

          {/* Files List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">
                {categories.find(c => c.id === 'products')?.name} 목록
              </h2>
            </div>
            
            {files.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                업로드된 파일이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {files.map((file) => (
                  <div key={file.path} className="border border-gray-200 rounded-lg p-4">
                    <div className="aspect-w-16 aspect-h-9 mb-4">
                      {file.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) && file.url && file.url !== "" ? (
                        <Image
                          src={file.url}
                          alt={file.name}
                          width={400}
                          height={200}
                          className="w-full h-48 object-cover rounded-md"
                        />
                      ) : file.url.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video
                          src={file.url}
                          controls
                          className="w-full h-48 object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-100 rounded-md flex items-center justify-center">
                          <span className="text-gray-500">미리보기 불가</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm text-gray-900 truncate">
                        {file.name}
                      </h3>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => copyToClipboard(file.url)}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-xs"
                        >
                          URL 복사
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file.path, file.name)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 