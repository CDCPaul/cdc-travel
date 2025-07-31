'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { motion } from 'framer-motion';
import { apiRequest } from '@/lib/api-client';

const TRAVELER_TEXTS = {
  ko: {
    title: "여행객 관리",
    newTraveler: "새 여행객 등록",
    loading: "로딩 중...",
    noTravelers: "등록된 여행객이 없습니다.",
    search: "검색",
    searchPlaceholder: "이름, 이메일, 여권번호로 검색...",
    no: "번호",
    surname: "성",
    givenNames: "이름",
    fullName: "이름",
    email: "이메일",
    phone: "전화번호",
    nationality: "국적",
    passportNumber: "여권번호",
    passportExpiry: "여권만료일",
    gender: "성별",
    createdBy: "등록자",
    createdAt: "등록일",
    passportPhoto: "여권사진",
    hasPhoto: "있음",
    noPhoto: "없음",
    actions: "작업"
  },
  en: {
    title: "Traveler Management",
    newTraveler: "New Traveler",
    loading: "Loading...",
    noTravelers: "No travelers registered.",
    search: "Search",
    searchPlaceholder: "Search by name, email, passport number...",
    no: "No.",
    surname: "Surname",
    givenNames: "Given Names",
    fullName: "Name",
    email: "Email",
    phone: "Phone",
    nationality: "Nationality",
    passportNumber: "Passport Number",
    passportExpiry: "Passport Expiry",
    gender: "Gender",
    createdBy: "Created By",
    createdAt: "Created At",
    passportPhoto: "Passport Photo",
    hasPhoto: "Yes",
    noPhoto: "No",
    actions: "Actions"
  }
};

interface Traveler {
  id: string;
  surname: string;
  givenNames: string;
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  passportNumber: string;
  passportExpiry: string;
  gender: 'M' | 'F';
  passportPhotoURL?: string;
  createdBy?: {
    uid: string;
    email: string;
    displayName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function TravelerManagementPage() {
  const { lang } = useLanguage();
  const texts = TRAVELER_TEXTS[lang];
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [filteredTravelers, setFilteredTravelers] = useState<Traveler[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 검색 필터링 함수
  const filterTravelers = (travelers: Traveler[], searchTerm: string) => {
    if (!searchTerm.trim()) return travelers;
    
    const term = searchTerm.toLowerCase();
    return travelers.filter(traveler => 
      traveler.surname?.toLowerCase().includes(term) ||
      traveler.givenNames?.toLowerCase().includes(term) ||
      traveler.fullName?.toLowerCase().includes(term) ||
      traveler.email?.toLowerCase().includes(term) ||
      traveler.passportNumber?.toLowerCase().includes(term)
    );
  };

  // 검색어 변경 시 필터링
  useEffect(() => {
    setFilteredTravelers(filterTravelers(travelers, searchTerm));
  }, [travelers, searchTerm]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { setupTokenRefresh } = await import('@/lib/auth');
        setupTokenRefresh();
      } catch (error) {
        console.error('토큰 갱신 설정 실패:', error);
      }
    };

    const fetchTravelers = async () => {
      try {
        const response = await apiRequest<{ travelers: Traveler[] }>('/api/travelers');
        
        if (response.success && response.data?.travelers) {
          setTravelers(response.data.travelers);
        } else {
          console.error('여행객 목록 조회 실패:', response.error);
        }
      } catch (error) {
        console.error('여행객 목록 조회 중 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
    fetchTravelers();
  }, []);

  const formatDate = (timestamp: string | { seconds: number } | Date | null) => {
    if (!timestamp) return '-';
    
    try {
      const date = typeof timestamp === 'object' && 'seconds' in timestamp
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp);
      return date.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US');
    } catch {
      return '-';
    }
  };

  const getGenderText = (gender: 'M' | 'F') => {
    return gender === 'M' ? (lang === 'ko' ? '남성' : 'Male') : (lang === 'ko' ? '여성' : 'Female');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{texts.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg"
        >
          {/* 테이블 */}
          <div className="overflow-x-auto p-6">
            {/* 검색 섹션 */}
            <div className="mb-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1 max-w-md">
                  <label htmlFor="search" className="sr-only">
                    {texts.search}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      id="search"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder={texts.searchPlaceholder}
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {filteredTravelers.length} / {travelers.length} {lang === 'ko' ? '명' : 'travelers'}
                </div>
              </div>
            </div>

            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.no}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.surname}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.givenNames}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.email}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.phone}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.nationality}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.passportNumber}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.passportExpiry}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.gender}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.passportPhoto}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.createdBy}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.createdAt}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTravelers.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-12 text-center text-gray-500">
                      {texts.noTravelers}
                    </td>
                  </tr>
                ) : (
                  filteredTravelers.map((traveler, index) => (
                    <tr key={traveler.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {traveler.surname}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {traveler.givenNames}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{traveler.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{traveler.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{traveler.nationality}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{traveler.passportNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(traveler.passportExpiry)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{getGenderText(traveler.gender)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {traveler.passportPhotoURL ? texts.hasPhoto : texts.noPhoto}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {traveler.createdBy?.displayName || traveler.createdBy?.email || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(traveler.createdAt)}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 