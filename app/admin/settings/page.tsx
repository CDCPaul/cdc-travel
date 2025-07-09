'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useLanguage } from '../../../components/LanguageContext';
import Link from 'next/link';

interface SiteSettings {
  siteName: { ko: string; en: string };
  siteDescription: { ko: string; en: string };
  address: string;
  contactEmail: string;
  contactPhone: string;
  socialMedia: {
    facebook?: string;
    kakao?: string;
    viber?: string;
    instagram?: string;
  };
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
    
    // 기본 정보
    basicInfo: "기본 정보",
    formSiteName: "사이트 이름",
    formSiteDescription: "사이트 설명",
    
    // 연락처 정보
    contactInfo: "연락처 정보",
    formContactEmail: "연락처 이메일",
    formContactPhone: "연락처 전화번호",
    
    // 소셜 미디어
    socialMedia: "소셜 미디어",
    formFacebook: "Facebook URL",
    formKakao: "KakaoTalk URL",
    formViber: "Viber URL",
    formInstagram: "Instagram URL",
    
    // 기본 설정
    defaultSettings: "기본 설정",
    formDefaultLanguage: "기본 언어",
    formTimezone: "시간대",
    
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
    
    // Basic Information
    basicInfo: "Basic Information",
    formSiteName: "Site Name",
    formSiteDescription: "Site Description",
    
    // Contact Information
    contactInfo: "Contact Information",
    formContactEmail: "Contact Email",
    formContactPhone: "Contact Phone",
    
    // Social Media
    socialMedia: "Social Media",
    formFacebook: "Facebook URL",
    formKakao: "KakaoTalk URL",
    formViber: "Viber URL",
    formInstagram: "Instagram URL",
    
    // Default Settings
    defaultSettings: "Default Settings",
    formDefaultLanguage: "Default Language",
    formTimezone: "Timezone",
    
    cancel: "Cancel"
  }
};

export default function AdminSettings() {
  const [saving, setSaving] = useState(false);
  const { lang } = useLanguage();
  const texts = SETTINGS_TEXTS[lang];

  const [formData, setFormData] = useState<SiteSettings>({
    siteName: { ko: '', en: '' },
    siteDescription: { ko: '', en: '' },
    address: '',
    contactEmail: '',
    contactPhone: '',
    socialMedia: {
      facebook: '',
      kakao: '',
      viber: '',
      instagram: ''
    }
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        // router.replace("/admin-login"); // Removed as per edit hint
      }
    });
    return () => unsubscribe();
  }, []); // Removed router from dependency array

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('siteName.')) {
      const lang = name.split('.')[1];
      setFormData(prev => ({ ...prev, siteName: { ...prev.siteName, [lang]: value } }));
    } else if (name.startsWith('siteDescription.')) {
      const lang = name.split('.')[1];
      setFormData(prev => ({ ...prev, siteDescription: { ...prev.siteDescription, [lang]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
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

  if (false) { // Removed loading check
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
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <section>
                <h2 className="text-xl font-bold mb-4">{texts.basicInfo}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-medium mb-1">{texts.formSiteName} (KO)</label>
                    <input type="text" name="siteName.ko" value={formData.siteName.ko} onChange={handleChange} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">{texts.formSiteName} (EN)</label>
                    <input type="text" name="siteName.en" value={formData.siteName.en} onChange={handleChange} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-medium mb-1">{texts.formSiteDescription} (KO)</label>
                    <textarea name="siteDescription.ko" value={formData.siteDescription.ko} onChange={handleChange} className="w-full border rounded px-3 py-2" rows={2} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-medium mb-1">{texts.formSiteDescription} (EN)</label>
                    <textarea name="siteDescription.en" value={formData.siteDescription.en} onChange={handleChange} className="w-full border rounded px-3 py-2" rows={2} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-medium mb-1">Address (EN)</label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full border rounded px-3 py-2" />
                  </div>
                </div>
              </section>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{texts.contactInfo}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      type="text"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{texts.socialMedia}</h3>
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
                      placeholder="https://facebook.com/your-page"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{texts.formKakao}</label>
                    <input
                      type="url"
                      value={formData.socialMedia.kakao || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        socialMedia: {...formData.socialMedia, kakao: e.target.value}
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="https://open.kakao.com/your-channel"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{texts.formViber}</label>
                    <input
                      type="url"
                      value={formData.socialMedia.viber || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        socialMedia: {...formData.socialMedia, viber: e.target.value}
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="https://viber.com/your-community"
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
                      placeholder="https://instagram.com/your-account"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  // onClick={() => router.push('/admin/dashboard')} // Removed as per edit hint
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  {texts.cancel}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? texts.saving : texts.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
} 