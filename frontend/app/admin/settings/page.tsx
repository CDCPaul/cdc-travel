'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useLanguage } from '../../../components/LanguageContext';
import Link from 'next/link';

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  businessHours: string;
  timezone: string;
  currency: string;
  language: string;
}

const SETTINGS_TEXTS = {
  ko: {
    loading: "로딩 중...",
    backToDashboard: "← 대시보드로 돌아가기",
    title: "사이트 설정",
    save: "저장",
    saving: "저장 중...",
    saveSuccess: "설정이 성공적으로 저장되었습니다.",
    saveError: "설정 저장에 실패했습니다.",
    formSiteName: "사이트 이름",
    formSiteDescription: "사이트 설명",
    formContactEmail: "연락처 이메일",
    formContactPhone: "연락처 전화번호",
    formAddress: "주소",
    formBusinessHours: "영업시간",
    formTimezone: "시간대",
    formCurrency: "통화",
    formLanguage: "기본 언어",
    formSocialMedia: "소셜 미디어",
    formFacebook: "Facebook URL",
    formInstagram: "Instagram URL",
    formTwitter: "Twitter URL",
    formYoutube: "YouTube URL",
    cancel: "취소"
  },
  en: {
    loading: "Loading...",
    backToDashboard: "← Back to Dashboard",
    title: "Site Settings",
    save: "Save",
    saving: "Saving...",
    saveSuccess: "Settings saved successfully.",
    saveError: "Failed to save settings.",
    formSiteName: "Site Name",
    formSiteDescription: "Site Description",
    formContactEmail: "Contact Email",
    formContactPhone: "Contact Phone",
    formAddress: "Address",
    formBusinessHours: "Business Hours",
    formTimezone: "Timezone",
    formCurrency: "Currency",
    formLanguage: "Default Language",
    formSocialMedia: "Social Media",
    formFacebook: "Facebook URL",
    formInstagram: "Instagram URL",
    formTwitter: "Twitter URL",
    formYoutube: "YouTube URL",
    cancel: "Cancel"
  }
};

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { lang } = useLanguage();
  const texts = SETTINGS_TEXTS[lang];

  const [formData, setFormData] = useState<SiteSettings>({
    siteName: '',
    siteDescription: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    socialMedia: {},
    businessHours: '',
    timezone: '',
    currency: '',
    language: ''
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchSettings();
      } else {
        router.push('/admin/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'site');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as SiteSettings;
        setFormData(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const docRef = doc(db, 'settings', 'site');
    try {
      await updateDoc(docRef, {
        ...formData,
        updatedAt: new Date()
      });
      alert(texts.saveSuccess);
    } catch {
      // updateDoc 실패 시 setDoc을 항상 시도
      try {
        await setDoc(docRef, {
          ...formData,
          updatedAt: new Date()
        });
        alert(texts.saveSuccess);
      } catch (e) {
        console.error('Error updating settings:', e);
        alert(texts.saveError);
      }
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
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">{texts.title}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{texts.formSiteName}</label>
                    <input
                      type="text"
                      value={formData.siteName}
                      onChange={(e) => setFormData({...formData, siteName: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{texts.formContactEmail}</label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{texts.formContactPhone}</label>
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{texts.formCurrency}</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({...formData, currency: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">통화 선택</option>
                      <option value="KRW">KRW (원)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="JPY">JPY (¥)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{texts.formLanguage}</label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({...formData, language: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">언어 선택</option>
                      <option value="ko">한국어</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{texts.formTimezone}</label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">시간대 선택</option>
                      <option value="Asia/Seoul">Asia/Seoul (KST)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">{texts.formSiteDescription}</label>
                  <textarea
                    value={formData.siteDescription}
                    onChange={(e) => setFormData({...formData, siteDescription: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">{texts.formAddress}</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    rows={2}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">{texts.formBusinessHours}</label>
                  <input
                    type="text"
                    value={formData.businessHours}
                    onChange={(e) => setFormData({...formData, businessHours: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="예: 월-금 09:00-18:00, 토 09:00-13:00"
                  />
                </div>
              </div>

              {/* Social Media */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{texts.formSocialMedia}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{texts.formFacebook}</label>
                    <input
                      type="url"
                      value={formData.socialMedia.facebook || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        socialMedia: {...formData.socialMedia, facebook: e.target.value}
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{texts.formInstagram}</label>
                    <input
                      type="url"
                      value={formData.socialMedia.instagram || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        socialMedia: {...formData.socialMedia, instagram: e.target.value}
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{texts.formTwitter}</label>
                    <input
                      type="url"
                      value={formData.socialMedia.twitter || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        socialMedia: {...formData.socialMedia, twitter: e.target.value}
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{texts.formYoutube}</label>
                    <input
                      type="url"
                      value={formData.socialMedia.youtube || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        socialMedia: {...formData.socialMedia, youtube: e.target.value}
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-md"
                >
                  {saving ? texts.saving : texts.save}
                </button>
                <Link
                  href="/admin/dashboard"
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md"
                >
                  {texts.cancel}
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
} 