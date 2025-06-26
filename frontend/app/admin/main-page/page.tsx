'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { useLanguage } from '../../../components/LanguageContext';
import Link from 'next/link';
import Image from "next/image";

interface MainPageSettings {
  bannerVideo?: string;
  bannerImage?: string;
  mainTitle?: string;
  mainSubtitle?: string;
}

const MAIN_PAGE_TEXTS = {
  ko: {
    loading: "로딩 중...",
    backToDashboard: "← 대시보드로 돌아가기",
    title: "메인페이지 관리",
    save: "저장",
    saving: "저장 중...",
    saveSuccess: "저장되었습니다!",
    saveError: "저장에 실패했습니다.",
    bannerVideo: "배너 비디오",
    bannerImage: "배너 이미지",
    mainTitle: "메인 제목",
    mainSubtitle: "메인 부제목",
    uploadVideo: "비디오 업로드",
    uploadImage: "이미지 업로드",
    videoUrl: "비디오 URL",
    imageUrl: "이미지 URL",
    uploading: "업로드 중...",
    uploadError: "업로드에 실패했습니다.",
    preview: "미리보기",
    remove: "제거",
    currentVideo: "현재 비디오",
    currentImage: "현재 이미지",
    noVideo: "비디오 없음",
    noImage: "이미지 없음",
    dragDropVideo: "비디오 파일을 여기에 드래그하거나 클릭하여 선택하세요",
    dragDropImage: "이미지 파일을 여기에 드래그하거나 클릭하여 선택하세요",
    dragOver: "파일을 여기에 놓으세요",
    invalidFileType: "지원하지 않는 파일 형식입니다.",
    fileTooLarge: "파일이 너무 큽니다."
  },
  en: {
    loading: "Loading...",
    backToDashboard: "← Back to Dashboard",
    title: "Main Page Management",
    save: "Save",
    saving: "Saving...",
    saveSuccess: "Saved successfully!",
    saveError: "Failed to save.",
    bannerVideo: "Banner Video",
    bannerImage: "Banner Image",
    mainTitle: "Main Title",
    mainSubtitle: "Main Subtitle",
    uploadVideo: "Upload Video",
    uploadImage: "Upload Image",
    videoUrl: "Video URL",
    imageUrl: "Image URL",
    uploading: "Uploading...",
    uploadError: "Upload failed.",
    preview: "Preview",
    remove: "Remove",
    currentVideo: "Current Video",
    currentImage: "Current Image",
    noVideo: "No Video",
    noImage: "No Image",
    dragDropVideo: "Drag and drop video file here or click to select",
    dragDropImage: "Drag and drop image file here or click to select",
    dragOver: "Drop file here",
    invalidFileType: "Unsupported file type.",
    fileTooLarge: "File is too large."
  }
};

export default function AdminMainPage() {
  const [mainPageSettings, setMainPageSettings] = useState<MainPageSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [dragOverVideo, setDragOverVideo] = useState(false);
  const [dragOverImage, setDragOverImage] = useState(false);
  const router = useRouter();
  const { lang } = useLanguage();
  const texts = MAIN_PAGE_TEXTS[lang];
  
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchMainPageSettings();
      } else {
        router.push('/admin/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchMainPageSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'mainPage');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setMainPageSettings(docSnap.data() as MainPageSettings);
      }
    } catch (error) {
      console.error('Error fetching main page settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = async (file: File) => {
    const storageRef = ref(storage, `main-page/banner-video/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleImageUpload = async (file: File) => {
    const storageRef = ref(storage, `main-page/banner-image/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const validateFile = (file: File, type: 'video' | 'image') => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    if (file.size > maxSize) {
      throw new Error(texts.fileTooLarge);
    }
    
    if (type === 'video') {
      if (!file.type.startsWith('video/')) {
        throw new Error(texts.invalidFileType);
      }
    } else {
      if (!file.type.startsWith('image/')) {
        throw new Error(texts.invalidFileType);
      }
    }
  };

  const handleVideoFile = async (file: File) => {
    try {
      validateFile(file, 'video');
      setUploadingVideo(true);
      setUploadError('');
      const url = await handleVideoUpload(file);
      setMainPageSettings({
        ...mainPageSettings,
        bannerVideo: url
      });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : texts.uploadError);
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleImageFile = async (file: File) => {
    try {
      validateFile(file, 'image');
      setUploadingImage(true);
      setUploadError('');
      const url = await handleImageUpload(file);
      setMainPageSettings({
        ...mainPageSettings,
        bannerImage: url
      });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : texts.uploadError);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      await setDoc(doc(db, 'settings', 'mainPage'), mainPageSettings);
      setSaveMessage(texts.saveSuccess);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving main page settings:', error);
      setSaveMessage(texts.saveError);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">{texts.loading}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-700">
                {texts.backToDashboard}
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">{texts.title}</h1>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md"
            >
              {saving ? texts.saving : texts.save}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        {saveMessage && (
          <div className={`mb-4 p-4 rounded-md ${
            saveMessage === texts.saveSuccess 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {saveMessage}
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6">
              
              {/* Main Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {texts.mainTitle}
                </label>
                <input
                  type="text"
                  value={mainPageSettings.mainTitle || ''}
                  onChange={(e) => setMainPageSettings({
                    ...mainPageSettings,
                    mainTitle: e.target.value
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="메인 페이지 제목을 입력하세요"
                />
              </div>

              {/* Main Subtitle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {texts.mainSubtitle}
                </label>
                <input
                  type="text"
                  value={mainPageSettings.mainSubtitle || ''}
                  onChange={(e) => setMainPageSettings({
                    ...mainPageSettings,
                    mainSubtitle: e.target.value
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="메인 페이지 부제목을 입력하세요"
                />
              </div>

              {/* Banner Video Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">{texts.bannerVideo}</h3>
                
                <div className="space-y-4">
                  {/* Current Video */}
                  {mainPageSettings.bannerVideo && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {texts.currentVideo}
                      </label>
                      <div className="relative">
                        <video
                          src={mainPageSettings.bannerVideo}
                          controls
                          className="w-full max-w-md h-48 object-cover rounded-md border"
                        />
                        <button
                          onClick={() => setMainPageSettings({
                            ...mainPageSettings,
                            bannerVideo: ""
                          })}
                          className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-sm hover:bg-red-700"
                        >
                          {texts.remove}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Video Upload with Drag & Drop */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {texts.uploadVideo}
                    </label>
                    <div
                      className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        dragOverVideo 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverVideo(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setDragOverVideo(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverVideo(false);
                        const files = Array.from(e.dataTransfer.files);
                        if (files.length > 0) {
                          handleVideoFile(files[0]);
                        }
                      }}
                      onClick={() => videoInputRef.current?.click()}
                    >
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleVideoFile(file);
                          }
                        }}
                        className="hidden"
                      />
                      <div className="space-y-2">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="text-sm text-gray-600">
                          {dragOverVideo ? texts.dragOver : texts.dragDropVideo}
                        </div>
                      </div>
                    </div>
                    {uploadingVideo && <div className="text-blue-600 text-sm mt-1">{texts.uploading}</div>}
                    {uploadError && <div className="text-red-600 text-sm mt-1">{uploadError}</div>}
                  </div>

                  {/* Video URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {texts.videoUrl}
                    </label>
                    <input
                      type="url"
                      value={mainPageSettings.bannerVideo || ''}
                      onChange={(e) => setMainPageSettings({
                        ...mainPageSettings,
                        bannerVideo: e.target.value
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="비디오 URL을 입력하세요"
                    />
                  </div>
                </div>
              </div>

              {/* Banner Image Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">{texts.bannerImage}</h3>
                
                <div className="space-y-4">
                  {/* Current Image */}
                  {mainPageSettings.bannerImage && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {texts.currentImage}
                      </label>
                      <div className="relative">
                        <Image
                          src={mainPageSettings.bannerImage}
                          alt={texts.preview}
                          width={400}
                          height={250}
                          className="w-full max-w-md h-48 object-cover rounded-md border"
                        />
                        <button
                          onClick={() => setMainPageSettings({
                            ...mainPageSettings,
                            bannerImage: ""
                          })}
                          className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-sm hover:bg-red-700"
                        >
                          {texts.remove}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Image Upload with Drag & Drop */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {texts.uploadImage}
                    </label>
                    <div
                      className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        dragOverImage 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverImage(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setDragOverImage(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverImage(false);
                        const files = Array.from(e.dataTransfer.files);
                        if (files.length > 0) {
                          handleImageFile(files[0]);
                        }
                      }}
                      onClick={() => imageInputRef.current?.click()}
                    >
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageFile(file);
                          }
                        }}
                        className="hidden"
                      />
                      <div className="space-y-2">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="text-sm text-gray-600">
                          {dragOverImage ? texts.dragOver : texts.dragDropImage}
                        </div>
                      </div>
                    </div>
                    {uploadingImage && <div className="text-blue-600 text-sm mt-1">{texts.uploading}</div>}
                    {uploadError && <div className="text-red-600 text-sm mt-1">{uploadError}</div>}
                  </div>

                  {/* Image URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {texts.imageUrl}
                    </label>
                    <input
                      type="url"
                      value={mainPageSettings.bannerImage || ''}
                      onChange={(e) => setMainPageSettings({
                        ...mainPageSettings,
                        bannerImage: e.target.value
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="이미지 URL을 입력하세요"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 