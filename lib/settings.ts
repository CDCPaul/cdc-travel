import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

interface SiteSettings {
  // 기본 정보
  siteName: string | { ko: string; en: string };
  siteDescription: string | { ko: string; en: string };
  
  // 연락처 정보
  contactEmail: string;
  contactPhone: string;
  
  // 소셜 미디어 링크
  socialMedia: {
    facebook?: string;
    kakao?: string;
    viber?: string;
    instagram?: string;
  };
  
  // 기본 설정
  defaultLanguage: 'ko' | 'en';
  timezone: string;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'site');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as SiteSettings;
          setSettings(data);
        } else {
          // 기본값 설정
          setSettings({
            siteName: 'CDC Travel',
            siteDescription: '당신의 완벽한 여행을 위한 최고의 선택',
            contactEmail: 'info@cdc-travel.com',
            contactPhone: '+82-XXX-XXXX-XXXX',
            socialMedia: {
              facebook: '',
              kakao: '',
              viber: '',
              instagram: ''
            },
            defaultLanguage: 'ko',
            timezone: 'Asia/Seoul'
          });
        }
      } catch (err) {
        console.error('Error fetching site settings:', err);
        setError('설정을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading, error };
} 