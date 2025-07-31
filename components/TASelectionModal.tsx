"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Building, Phone, Mail, MapPin } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

interface TA {
  id: string;
  companyName: string;
  taCode: string;
  phone: string;
  address: string;
  email: string;
  logo?: string;
  overlayImage?: string;
  contactPersons?: Array<{
    name: string;
    position: string;
    phone: string;
    email: string;
  }>;
  createdAt: unknown;
}

interface TASelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (ta: TA) => void;
}

const MODAL_TEXTS = {
  ko: {
    title: "TA 선택",
    searchPlaceholder: "회사명, TA 코드, 전화번호, 이메일로 검색...",
    loading: "로딩 중...",
    error: "TA 목록을 불러오는데 실패했습니다.",
    retry: "다시 시도",
    noResults: "검색 결과가 없습니다.",
    noTAs: "등록된 TA가 없습니다.",
    totalTAs: "개의 TA",
    close: "닫기",
    contactPerson: "담당자:"
  },
  en: {
    title: "Select TA",
    searchPlaceholder: "Search by company name, TA code, phone, email...",
    loading: "Loading...",
    error: "Failed to load TA list.",
    retry: "Retry",
    noResults: "No search results.",
    noTAs: "No TAs registered.",
    totalTAs: " TAs",
    close: "Close",
    contactPerson: "Contact Person:"
  }
};

export default function TASelectionModal({ isOpen, onClose, onSelect }: TASelectionModalProps) {
  const { lang } = useLanguage();
  const texts = MODAL_TEXTS[lang];
  const [tas, setTas] = useState<TA[]>([]);
  const [filteredTAs, setFilteredTAs] = useState<TA[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const fetchTAs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ta');
      const data = await response.json();
      
      if (response.ok && data.success) {
        setTas(data.data || []);
        setFilteredTAs(data.data || []);
      } else {
        setError('TA 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('TA 목록 조회 실패:', error);
      setError('TA 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchTAs();
    } else {
      // 모달이 닫힐 때 상태 초기화
      setSearchTerm('');
      setFilteredTAs([]);
      setError(null);
    }
  }, [isOpen, fetchTAs]);

  useEffect(() => {
    // 이전 타이머 클리어
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // 새로운 타이머 설정 (300ms 디바운싱)
    const timeout = setTimeout(() => {
      if (searchTerm.trim() === '') {
        setFilteredTAs(tas);
      } else {
        const filtered = tas.filter(ta => {
          const searchLower = searchTerm.toLowerCase();
          return (
            (ta.companyName && ta.companyName.toLowerCase().includes(searchLower)) ||
            (ta.taCode && ta.taCode.toLowerCase().includes(searchLower)) ||
            (ta.phone && ta.phone.includes(searchTerm)) ||
            (ta.email && ta.email.toLowerCase().includes(searchLower))
          );
        });
        setFilteredTAs(filtered);
      }
    }, 300);

    setSearchTimeout(timeout);

    // 클린업
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [searchTerm, tas]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (ta: TA) => {
    onSelect(ta);
    onClose();
  };

  const formatDate = (date: unknown) => {
    if (!date) return '-';
    
    try {
      // Firestore Timestamp 객체인 경우 (toDate 메서드가 있는 경우)
      if (date && typeof date === 'object' && (date as { toDate?: () => Date }).toDate) {
        return (date as { toDate: () => Date }).toDate().toLocaleDateString('ko-KR');
      }
      
      // Firestore Timestamp 객체인 경우 (_seconds, _nanoseconds 형태)
      if (date && typeof date === 'object' && (date as { _seconds?: number })._seconds) {
        const parsedDate = new Date((date as { _seconds: number })._seconds * 1000);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toLocaleDateString('ko-KR');
        }
      }
      
      // 객체인 경우 (seconds, nanoseconds)
      if (date && typeof date === 'object' && (date as { seconds?: number }).seconds) {
        const parsedDate = new Date((date as { seconds: number }).seconds * 1000);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toLocaleDateString('ko-KR');
        }
      }
      
      // 문자열인 경우
      if (typeof date === 'string') {
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toLocaleDateString('ko-KR');
        }
      }
      
      // 숫자인 경우 (timestamp)
      if (typeof date === 'number') {
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toLocaleDateString('ko-KR');
        }
      }
      
      return '-';
    } catch (error) {
      console.error('날짜 포맷팅 오류:', error);
      return '-';
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* 배경 오버레이 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={onClose}
            />

            {/* 모달 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative flex flex-col bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full max-h-[90vh] mx-auto"
              style={{ marginTop: '5vh', marginBottom: '5vh' }}
            >
              {/* 헤더 */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {texts.title}
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* 검색 */}
              <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder={texts.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 내용 */}
              <div className="px-6 py-4 flex-1 overflow-y-auto min-h-0">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">{texts.loading}</span>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-red-600">{texts.error}</p>
                    <button
                      onClick={fetchTAs}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      {texts.retry}
                    </button>
                  </div>
                ) : filteredTAs.length === 0 ? (
                  <div className="text-center py-8">
                    <Building className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-gray-600">
                      {searchTerm ? texts.noResults : texts.noTAs}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTAs.map((ta) => (
                      <motion.div
                        key={ta.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.1 }}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleSelect(ta)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">
                                {ta.companyName}
                              </h4>
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                {ta.taCode}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                              <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4" />
                                <span>{ta.phone}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4" />
                                <span>{ta.email}</span>
                              </div>
                              {ta.address && (
                                <div className="flex items-center space-x-2 md:col-span-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{ta.address}</span>
                                </div>
                              )}
                            </div>
                            
                            {ta.contactPersons && ta.contactPersons.length > 0 && (
                              <div className="mt-2 text-xs text-gray-500">
                                <span>{texts.contactPerson} {ta.contactPersons.map(cp => cp.name).join(', ')}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right text-xs text-gray-500">
                            <div>등록일: {formatDate(ta.createdAt)}</div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* 푸터 */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    총 {filteredTAs.length}개의 TA
                  </div>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {texts.close}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
} 