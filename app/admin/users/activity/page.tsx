'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { useLanguage } from '../../../../components/LanguageContext';
import { motion } from 'framer-motion';

interface UserActivity {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: Date | string | number;
  ipAddress?: string;
  userAgent?: string;
  workspace: string;
}

// 액션 카테고리 매핑 (사이드바 기준 페이지별)
const getActionCategory = (action: string, lang: 'ko' | 'en'): string => {
  const categories = {
    ko: {
      // 스팟 관리
      spotCreate: '스팟 관리',
      spotEdit: '스팟 관리',
      spotDelete: '스팟 관리',
      
      // TA 관리
      taCreate: 'TA 목록',
      taEdit: 'TA 목록',
      taDelete: 'TA 목록',
      emailSend: 'TA 목록', // TA 목록에서 이메일 발송
      
      // 상품 관리
      productCreate: '상품 관리',
      productEdit: '상품 관리',
      productDelete: '상품 관리',
      
      // 포함/불포함 사항
      includeItemCreate: '포함사항',
      includeItemEdit: '포함사항',
      includeItemDelete: '포함사항',
      notIncludeItemCreate: '불포함사항',
      notIncludeItemEdit: '불포함사항',
      notIncludeItemDelete: '불포함사항',
      
      // eBook 관리
      ebookCreate: 'About Us',
      ebookDelete: 'About Us',
      
      // 배너 관리
      bannerCreate: '배너 관리',
      bannerEdit: '배너 관리',
      bannerDelete: '배너 관리',
      bannerOrderChange: '배너 관리',
      
      // 사용자 관리
      login: '시스템',
      logout: '시스템',
      userAction: '사용자 관리',
      dataAction: '데이터 관리',
      systemAction: '시스템'
    },
    en: {
      // Spot Management
      spotCreate: 'Spot Management',
      spotEdit: 'Spot Management',
      spotDelete: 'Spot Management',
      
      // TA Management
      taCreate: 'TA List',
      taEdit: 'TA List',
      taDelete: 'TA List',
      emailSend: 'TA List', // Email sent from TA List
      
      // Product Management
      productCreate: 'Product Management',
      productEdit: 'Product Management',
      productDelete: 'Product Management',
      
      // Include/Not Include Items
      includeItemCreate: 'Include Items',
      includeItemEdit: 'Include Items',
      includeItemDelete: 'Include Items',
      notIncludeItemCreate: 'Not Include Items',
      notIncludeItemEdit: 'Not Include Items',
      notIncludeItemDelete: 'Not Include Items',
      
      // eBook Management
      ebookCreate: 'About Us',
      ebookDelete: 'About Us',
      
      // Banner Management
      bannerCreate: 'Banner Management',
      bannerEdit: 'Banner Management',
      bannerDelete: 'Banner Management',
      bannerOrderChange: 'Banner Management',
      
      // User Management
      login: 'System',
      logout: 'System',
      userAction: 'User Management',
      dataAction: 'Data Management',
      systemAction: 'System'
    }
  };
  
  return categories[lang][action as keyof typeof categories.ko] || (lang === 'ko' ? '기타' : 'Other');
};

// 액션 텍스트를 다국어로 변환
const getActionText = (action: string, lang: 'ko' | 'en'): string => {
  const actionTexts = {
    ko: {
      login: '로그인',
      logout: '로그아웃',
      spotCreate: '스팟 생성',
      spotEdit: '스팟 수정',
      spotDelete: '스팟 삭제',
      taCreate: 'TA 등록',
      taEdit: 'TA 수정',
      taDelete: 'TA 삭제',
      productCreate: '상품 등록',
      productEdit: '상품 수정',
      productDelete: '상품 삭제',
      includeItemCreate: '포함사항 등록',
      includeItemEdit: '포함사항 수정',
      includeItemDelete: '포함사항 삭제',
      notIncludeItemCreate: '불포함사항 등록',
      notIncludeItemEdit: '불포함사항 수정',
      notIncludeItemDelete: '불포함사항 삭제',
      ebookCreate: 'eBook 등록',
      ebookDelete: 'eBook 삭제',
      bannerCreate: '배너 등록',
      bannerEdit: '배너 수정',
      bannerDelete: '배너 삭제',
      bannerOrderChange: '배너 순서변경',
      emailSend: '이메일 발송',
      userAction: '사용자 관리',
      dataAction: '데이터 관리',
      systemAction: '시스템 액션'
    },
    en: {
      login: 'Login',
      logout: 'Logout',
      spotCreate: 'Spot Creation',
      spotEdit: 'Spot Edit',
      spotDelete: 'Spot Delete',
      taCreate: 'TA Create',
      taEdit: 'TA Edit',
      taDelete: 'TA Delete',
      productCreate: 'Product Create',
      productEdit: 'Product Edit',
      productDelete: 'Product Delete',
      includeItemCreate: 'Include Item Create',
      includeItemEdit: 'Include Item Edit',
      includeItemDelete: 'Include Item Delete',
      notIncludeItemCreate: 'Not Include Item Create',
      notIncludeItemEdit: 'Not Include Item Edit',
      notIncludeItemDelete: 'Not Include Item Delete',
      ebookCreate: 'eBook Create',
      ebookDelete: 'eBook Delete',
      bannerCreate: 'Banner Create',
      bannerEdit: 'Banner Edit',
      bannerDelete: 'Banner Delete',
      bannerOrderChange: 'Banner Order Change',
      emailSend: 'Email Send',
      userAction: 'User Management',
      dataAction: 'Data Management',
      systemAction: 'System Action'
    }
  };
  
  return actionTexts[lang][action as keyof typeof actionTexts.ko] || action;
};

// 상세 정보를 다국어로 변환
const translateDetails = (details: string, lang: 'ko' | 'en'): string => {
  if (lang === 'ko') {
    return details; // 한국어는 그대로 반환
  }
  
  // 영어로 변환할 패턴들
  const translations: Record<string, string> = {
    // TA 관련
    'TA 이메일 발송': 'TA Email Sent',
    'TA 등록': 'TA Registration',
    'TA 수정': 'TA Modification',
    'TA 삭제': 'TA Deletion',
    
    // 스팟 관련
    '스팟 생성': 'Spot Creation',
    '스팟 수정': 'Spot Modification',
    '스팟 삭제': 'Spot Deletion',
    
    // 상품 관련
    '상품 등록': 'Product Registration',
    '상품 수정': 'Product Modification',
    '상품 삭제': 'Product Deletion',
    
    // 포함사항 관련
    '포함사항 등록': 'Include Item Registration',
    '포함사항 수정': 'Include Item Modification',
    '포함사항 삭제': 'Include Item Deletion',
    
    // 불포함사항 관련
    '불포함사항 등록': 'Not Include Item Registration',
    '불포함사항 수정': 'Not Include Item Modification',
    '불포함사항 삭제': 'Not Include Item Deletion',
    
    // eBook 관련
    'eBook 등록': 'eBook Registration',
    'eBook 삭제': 'eBook Deletion',
    
    // 배너 관련
    '배너 등록': 'Banner Registration',
    '배너 수정': 'Banner Modification',
    '배너 삭제': 'Banner Deletion',
    '배너 순서변경': 'Banner Order Change',
    
    // 이메일 관련
    '이메일 발송': 'Email Sent',
    '제목으로 발송': 'sent with subject',
    '첨부파일': 'attachment',
    '명에게': 'to',
    
    // 기타
    '삭제': 'deleted',
    '등록': 'registered',
    '수정': 'modified',
    '생성': 'created',
    '변경': 'changed'
  };
  
  let translatedDetails = details;
  
  // 패턴 매칭하여 변환
  Object.entries(translations).forEach(([korean, english]) => {
    translatedDetails = translatedDetails.replace(new RegExp(korean, 'g'), english);
  });
  
  return translatedDetails;
};

const ACTIVITY_TEXTS = {
  ko: {
    title: "사용자 활동 기록",
    backToUsers: "← 사용자 목록으로 돌아가기",
    loading: "로딩 중...",
    error: "데이터를 불러오는데 실패했습니다.",
    noActivities: "활동 기록이 없습니다. (조회 활동은 제외됩니다)",
    
    // 테이블 헤더
    user: "사용자",
    action: "액션",
    details: "상세 정보",
    timestamp: "시간",
    ipAddress: "IP 주소",
    
    // 액션 타입
    login: "로그인",
    logout: "로그아웃",
    spotCreate: "스팟 생성",
    spotEdit: "스팟 수정",
    spotDelete: "스팟 삭제",
    taCreate: "TA 등록",
    taEdit: "TA 수정",
    taDelete: "TA 삭제",
    productCreate: "상품 등록",
    productEdit: "상품 수정",
    productDelete: "상품 삭제",
    includeItemCreate: "포함사항 등록",
    includeItemEdit: "포함사항 수정",
    includeItemDelete: "포함사항 삭제",
    notIncludeItemCreate: "불포함사항 등록",
    notIncludeItemEdit: "불포함사항 수정",
    notIncludeItemDelete: "불포함사항 삭제",
    ebookCreate: "eBook 등록",
    ebookDelete: "eBook 삭제",
    bannerCreate: "배너 등록",
    bannerEdit: "배너 수정",
    bannerDelete: "배너 삭제",
    bannerOrderChange: "배너 순서변경",
    emailSend: "이메일 발송",
    userAction: "사용자 관리",
    dataAction: "데이터 관리",
    systemAction: "시스템 액션",
    
    // 필터
    filterAll: "전체",
    filterLogin: "로그인",
    filterLogout: "로그아웃",
    filterSpotCreate: "스팟 생성",
    filterSpotEdit: "스팟 수정",
    filterSpotDelete: "스팟 삭제",
    filterTaCreate: "TA 등록",
    filterTaEdit: "TA 수정",
    filterTaDelete: "TA 삭제",
    filterProductCreate: "상품 등록",
    filterProductEdit: "상품 수정",
    filterProductDelete: "상품 삭제",
    filterIncludeItemCreate: "포함사항 등록",
    filterIncludeItemEdit: "포함사항 수정",
    filterIncludeItemDelete: "포함사항 삭제",
    filterNotIncludeItemCreate: "불포함사항 등록",
    filterNotIncludeItemEdit: "불포함사항 수정",
    filterNotIncludeItemDelete: "불포함사항 삭제",
    filterEbookCreate: "eBook 등록",
    filterEbookDelete: "eBook 삭제",
    filterBannerCreate: "배너 등록",
    filterBannerEdit: "배너 수정",
    filterBannerDelete: "배너 삭제",
    filterBannerOrderChange: "배너 순서변경",
    filterEmailSend: "이메일 발송",
    filterUserAction: "사용자 관리",
    filterDataAction: "데이터 관리",
    filterSystemAction: "시스템 액션",
    searchPlaceholder: "사용자 이메일로 검색...",
    
    // 시간 표시
    justNow: "방금 전",
    minutesAgo: "분 전",
    hoursAgo: "시간 전",
    daysAgo: "일 전",
    weeksAgo: "주 전",
    monthsAgo: "개월 전",
    yearsAgo: "년 전"
  },
  en: {
    title: "User Activity Log",
    backToUsers: "← Back to User List",
    loading: "Loading...",
    error: "Failed to load data.",
    noActivities: "No activity records found. (Page views are excluded)",
    
    // Table headers
    user: "User",
    action: "Action",
    details: "Details",
    timestamp: "Time",
    ipAddress: "IP Address",
    
    // Action types
    login: "Login",
    logout: "Logout",
    spotCreate: "Spot Creation",
    spotEdit: "Spot Edit",
    spotDelete: "Spot Delete",
    taCreate: "TA Create",
    taEdit: "TA Edit",
    taDelete: "TA Delete",
    productCreate: "Product Create",
    productEdit: "Product Edit",
    productDelete: "Product Delete",
    includeItemCreate: "Include Item Create",
    includeItemEdit: "Include Item Edit",
    includeItemDelete: "Include Item Delete",
    notIncludeItemCreate: "Not Include Item Create",
    notIncludeItemEdit: "Not Include Item Edit",
    notIncludeItemDelete: "Not Include Item Delete",
    ebookCreate: "eBook Create",
    ebookDelete: "eBook Delete",
    bannerCreate: "Banner Create",
    bannerEdit: "Banner Edit",
    bannerDelete: "Banner Delete",
    bannerOrderChange: "Banner Order Change",
    emailSend: "Email Send",
    userAction: "User Management",
    dataAction: "Data Management",
    systemAction: "System Action",
    
    // Filters
    filterAll: "All",
    filterLogin: "Login",
    filterLogout: "Logout",
    filterSpotCreate: "Spot Creation",
    filterSpotEdit: "Spot Edit",
    filterSpotDelete: "Spot Delete",
    filterTaCreate: "TA Create",
    filterTaEdit: "TA Edit",
    filterTaDelete: "TA Delete",
    filterProductCreate: "Product Create",
    filterProductEdit: "Product Edit",
    filterProductDelete: "Product Delete",
    filterIncludeItemCreate: "Include Item Create",
    filterIncludeItemEdit: "Include Item Edit",
    filterIncludeItemDelete: "Include Item Delete",
    filterNotIncludeItemCreate: "Not Include Item Create",
    filterNotIncludeItemEdit: "Not Include Item Edit",
    filterNotIncludeItemDelete: "Not Include Item Delete",
    filterEbookCreate: "eBook Create",
    filterEbookDelete: "eBook Delete",
    filterBannerCreate: "Banner Create",
    filterBannerEdit: "Banner Edit",
    filterBannerDelete: "Banner Delete",
    filterBannerOrderChange: "Banner Order Change",
    filterEmailSend: "Email Send",
    filterUserAction: "User Management",
    filterDataAction: "Data Management",
    filterSystemAction: "System Action",
    searchPlaceholder: "Search by user email...",
    
    // Time display
    justNow: "Just now",
    minutesAgo: "minutes ago",
    hoursAgo: "hours ago",
    daysAgo: "days ago",
    weeksAgo: "weeks ago",
    monthsAgo: "months ago",
    yearsAgo: "years ago"
  }
};

// 시간 차이를 사람이 읽기 쉬운 형태로 변환
function getTimeAgo(date: Date | string | number, lang: 'ko' | 'en'): string {
  // date를 Date 객체로 변환
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return lang === 'ko' ? '방금 전' : 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return lang === 'ko' ? `${diffInMinutes}분 전` : `${diffInMinutes} minutes ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return lang === 'ko' ? `${diffInHours}시간 전` : `${diffInHours} hours ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return lang === 'ko' ? `${diffInDays}일 전` : `${diffInDays} days ago`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return lang === 'ko' ? `${diffInWeeks}주 전` : `${diffInWeeks} weeks ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return lang === 'ko' ? `${diffInMonths}개월 전` : `${diffInMonths} months ago`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return lang === 'ko' ? `${diffInYears}년 전` : `${diffInYears} years ago`;
}

export default function UserActivityPage() {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const { lang } = useLanguage();
  const texts = ACTIVITY_TEXTS[lang as keyof typeof ACTIVITY_TEXTS];

  // 활동 기록 불러오기
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        
        const user = auth.currentUser;
        if (!user) {
          throw new Error('로그인이 필요합니다.');
        }
        
        const idToken = await user.getIdToken();
        
        const response = await fetch('/api/users/activity', {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });

        if (!response.ok) {
          throw new Error('활동 기록을 불러올 수 없습니다.');
        }

        const data = await response.json();
        
        // API 응답 구조 확인 및 안전한 데이터 처리
        if (!data || typeof data !== 'object') {
          console.error('Invalid API response:', data);
          setActivities([]);
          return;
        }
        
        // data.data가 배열인지 확인
        const activitiesData = data.data;
        if (!Array.isArray(activitiesData)) {
          console.error('API response data is not an array:', activitiesData);
          setActivities([]);
          return;
        }
        
        // timestamp를 Date 객체로 변환
        const processedData = activitiesData.map((activity: UserActivity) => ({
          ...activity,
          timestamp: activity.timestamp ? new Date(activity.timestamp) : new Date()
        }));
        setActivities(processedData);
      } catch (err) {
        console.error('활동 기록 불러오기 실패:', err);
        setError(texts.error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [texts.error]);

  // 필터링 및 검색
  useEffect(() => {
    let filtered = activities;

    // 조회 활동 제외
    filtered = filtered.filter(activity => activity.action !== 'pageView');

    // 검색 필터
    if (searchTerm) {
      filtered = filtered.filter(activity => 
        activity.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.details.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 액션 필터
    if (actionFilter !== 'all') {
      filtered = filtered.filter(activity => 
        activity.action.toLowerCase().includes(actionFilter.toLowerCase())
      );
    }

    setFilteredActivities(filtered);
  }, [activities, searchTerm, actionFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">{texts.loading}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* 필터 및 검색 */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder={texts.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{texts.filterAll}</option>
              <option value="login">{texts.filterLogin}</option>
              <option value="logout">{texts.filterLogout}</option>
              <option value="spotCreate">{texts.filterSpotCreate}</option>
              <option value="spotEdit">{texts.filterSpotEdit}</option>
              <option value="spotDelete">{texts.filterSpotDelete}</option>
              <option value="taCreate">{texts.filterTaCreate}</option>
              <option value="taEdit">{texts.filterTaEdit}</option>
              <option value="taDelete">{texts.filterTaDelete}</option>
              <option value="productCreate">{texts.filterProductCreate}</option>
              <option value="productEdit">{texts.filterProductEdit}</option>
              <option value="productDelete">{texts.filterProductDelete}</option>
              <option value="includeItemCreate">{texts.filterIncludeItemCreate}</option>
              <option value="includeItemEdit">{texts.filterIncludeItemEdit}</option>
              <option value="includeItemDelete">{texts.filterIncludeItemDelete}</option>
              <option value="notIncludeItemCreate">{texts.filterNotIncludeItemCreate}</option>
              <option value="notIncludeItemEdit">{texts.filterNotIncludeItemEdit}</option>
              <option value="notIncludeItemDelete">{texts.filterNotIncludeItemDelete}</option>
              <option value="ebookCreate">{texts.filterEbookCreate}</option>
              <option value="ebookDelete">{texts.filterEbookDelete}</option>
              <option value="bannerCreate">{texts.filterBannerCreate}</option>
              <option value="bannerEdit">{texts.filterBannerEdit}</option>
              <option value="bannerDelete">{texts.filterBannerDelete}</option>
              <option value="bannerOrderChange">{texts.filterBannerOrderChange}</option>
              <option value="emailSend">{texts.filterEmailSend}</option>
              <option value="userAction">{texts.filterUserAction}</option>
              <option value="dataAction">{texts.filterDataAction}</option>
              <option value="systemAction">{texts.filterSystemAction}</option>
            </select>
          </div>
        </div>

        {/* 활동 목록 */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {lang === 'ko' ? '카테고리' : 'Category'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.user}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.action}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.details}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.timestamp}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredActivities.map((activity, index) => (
                  <motion.tr
                    key={activity.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {getActionCategory(activity.action, lang)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {activity.userEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        activity.action.includes('login') 
                          ? 'bg-green-100 text-green-800' :
                        activity.action.includes('logout')
                          ? 'bg-red-100 text-red-800' :
                        activity.action.includes('spotCreate')
                          ? 'bg-blue-100 text-blue-800' :
                        activity.action.includes('spotEdit')
                          ? 'bg-indigo-100 text-indigo-800' :
                        activity.action.includes('spotDelete')
                          ? 'bg-red-100 text-red-800' :
                        activity.action.includes('taCreate')
                          ? 'bg-emerald-100 text-emerald-800' :
                        activity.action.includes('taEdit')
                          ? 'bg-teal-100 text-teal-800' :
                        activity.action.includes('taDelete')
                          ? 'bg-red-100 text-red-800' :
                        activity.action.includes('productCreate')
                          ? 'bg-cyan-100 text-cyan-800' :
                        activity.action.includes('productEdit')
                          ? 'bg-sky-100 text-sky-800' :
                        activity.action.includes('productDelete')
                          ? 'bg-red-100 text-red-800' :
                        activity.action.includes('includeItem')
                          ? 'bg-lime-100 text-lime-800' :
                        activity.action.includes('notIncludeItem')
                          ? 'bg-amber-100 text-amber-800' :
                        activity.action.includes('ebook')
                          ? 'bg-violet-100 text-violet-800' :
                        activity.action.includes('bannerCreate')
                          ? 'bg-pink-100 text-pink-800' :
                        activity.action.includes('bannerEdit')
                          ? 'bg-rose-100 text-rose-800' :
                        activity.action.includes('bannerDelete')
                          ? 'bg-red-100 text-red-800' :
                        activity.action.includes('bannerOrderChange')
                          ? 'bg-fuchsia-100 text-fuchsia-800' :
                        activity.action.includes('emailSend')
                          ? 'bg-purple-100 text-purple-800' :
                        activity.action.includes('user')
                          ? 'bg-orange-100 text-orange-800' :
                        activity.action.includes('data')
                          ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>
                        {getActionText(activity.action, lang)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-md truncate">
                        {translateDetails(activity.details, lang)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getTimeAgo(activity.timestamp, lang)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredActivities.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {texts.noActivities}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 