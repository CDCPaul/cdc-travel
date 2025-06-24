'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import Link from 'next/link';

interface MainPageData {
  bannerVideo?: string;
  bannerImage?: string;
  mainTitle?: string;
  mainSubtitle?: string;
  aboutTitle?: string;
  aboutContent?: string;
}

export default function AdminMainPage() {
  const [mainPageData, setMainPageData] = useState<MainPageData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Form states
  const [formData, setFormData] = useState({
    bannerVideo: '',
    bannerImage: '',
    mainTitle: '',
    mainSubtitle: '',
    aboutTitle: '',
    aboutContent: ''
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        fetchMainPageData();
      } else {
        router.push('/admin/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchMainPageData = async () => {
    try {
      const docRef = doc(db, 'settings', 'mainPage');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as MainPageData;
        setMainPageData(data);
        setFormData({
          bannerVideo: data.bannerVideo || '',
          bannerImage: data.bannerImage || '',
          mainTitle: data.mainTitle || '',
          mainSubtitle: data.mainSubtitle || '',
          aboutTitle: data.aboutTitle || '',
          aboutContent: data.aboutContent || ''
        });
      }
    } catch (error) {
      console.error('Error fetching main page data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'video' | 'image') => {
    const storageRef = ref(storage, `main-page/${type}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await handleFileUpload(file, 'video');
        setFormData({ ...formData, bannerVideo: url });
      } catch (error) {
        console.error('Error uploading video:', error);
        alert('비디오 업로드에 실패했습니다.');
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await handleFileUpload(file, 'image');
        setFormData({ ...formData, bannerImage: url });
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('이미지 업로드에 실패했습니다.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const docRef = doc(db, 'settings', 'mainPage');
    try {
      await updateDoc(docRef, {
        ...formData,
        updatedAt: new Date()
      });
      setMainPageData(formData);
      alert('메인 페이지가 성공적으로 업데이트되었습니다.');
    } catch (error: any) {
      // 문서가 없으면 setDoc으로 생성
      if (error.code === 'not-found' || error.message.includes('No document to update')) {
        await setDoc(docRef, {
          ...formData,
          updatedAt: new Date()
        });
        setMainPageData(formData);
        alert('메인 페이지가 새로 생성되었습니다.');
      } else {
        console.error('Error updating main page:', error);
        alert('업데이트에 실패했습니다.');
      }
    } finally {
      setSaving(false);
    }
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
              <h1 className="text-3xl font-bold text-gray-900">메인 페이지 관리</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">메인 페이지 설정</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Banner Video */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  배너 비디오
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {formData.bannerVideo && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">현재 비디오 URL:</p>
                      <p className="text-sm text-blue-600 break-all">{formData.bannerVideo}</p>
                      <video 
                        src={formData.bannerVideo} 
                        controls 
                        className="mt-2 max-w-md rounded-md"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Banner Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  배너 이미지 (비디오 대신 사용)
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {formData.bannerImage && formData.bannerImage !== "" && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">현재 이미지 URL:</p>
                      <p className="text-sm text-blue-600 break-all">{formData.bannerImage}</p>
                      <img 
                        src={formData.bannerImage} 
                        alt="Banner" 
                        className="mt-2 max-w-md rounded-md"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Main Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  메인 제목
                </label>
                <input
                  type="text"
                  value={formData.mainTitle}
                  onChange={(e) => setFormData({...formData, mainTitle: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="메인 페이지 제목을 입력하세요"
                />
              </div>

              {/* Main Subtitle */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  메인 부제목
                </label>
                <input
                  type="text"
                  value={formData.mainSubtitle}
                  onChange={(e) => setFormData({...formData, mainSubtitle: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="메인 페이지 부제목을 입력하세요"
                />
              </div>

              {/* About Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  About Us 제목
                </label>
                <input
                  type="text"
                  value={formData.aboutTitle}
                  onChange={(e) => setFormData({...formData, aboutTitle: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="About Us 섹션 제목을 입력하세요"
                />
              </div>

              {/* About Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  About Us 내용
                </label>
                <textarea
                  value={formData.aboutContent}
                  onChange={(e) => setFormData({...formData, aboutContent: e.target.value})}
                  rows={6}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="About Us 섹션 내용을 입력하세요"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-md"
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
                <Link
                  href="/"
                  target="_blank"
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md"
                >
                  사이트 미리보기
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
} 