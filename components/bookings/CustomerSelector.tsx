"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Building2, User, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// TA 담당자 타입 정의
interface ContactPerson {
  name: string;
  phone: string;
  email: string;
}

// TA 타입 정의
interface TA {
  id: string;
  companyName: string;
  taCode: string;
  phone: string;
  email: string;
  address: string;
  contactPersons: ContactPerson[];
}

// 고객 정보 타입
export interface CustomerInfo {
  type: 'TA' | 'DIRECT';
  taId?: string;
  taCode?: string; // TA 코드 추가
  name: string;
  email: string;
  phone: string;
  address?: string;
  assignedManager?: string; // 선택된 담당자 이름
}

interface CustomerSelectorProps {
  value: CustomerInfo;
  onChange: (customer: CustomerInfo) => void;
  className?: string;
}

export function CustomerSelector({ value, onChange, className = '' }: CustomerSelectorProps) {
  const [mode, setMode] = useState<'SELECT' | 'INPUT'>(value.type === 'TA' ? 'SELECT' : 'INPUT');
  const [tas, setTas] = useState<TA[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedTA, setSelectedTA] = useState<TA | null>(null);
  const [selectedManager, setSelectedManager] = useState<string>('');

  // mode와 value.type 동기화 (mode를 의존성에서 제거해 무한루프 방지)
  useEffect(() => {
    const newMode = value.type === 'TA' ? 'SELECT' : 'INPUT';
    setMode(newMode);
  }, [value.type]);

  // TA 목록 로드
  const loadTAs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ta', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        setTas(result.data || []);
      } else {
        console.error('TA 목록 로드 실패:', response.status);
      }
    } catch (error) {
      console.error('TA 목록 로드 에러:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTAs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 컴포넌트 마운트 시에만 한 번 로드

  // value.taId가 있을 때 해당 TA를 찾아서 selectedTA 설정
  useEffect(() => {
    if (value.taId && value.type === 'TA' && tas.length > 0) {
      const foundTA = tas.find(ta => ta.id === value.taId);
      if (foundTA) {
        setSelectedTA(foundTA);
      }
    } else if (value.type === 'DIRECT') {
      setSelectedTA(null);
    }
  }, [value.taId, value.type, tas]);



  // 검색된 TA 목록
  const filteredTAs = tas.filter(ta => 
    ta.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ta.taCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ta.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // TA 선택 핸들러
  const handleTASelect = (ta: TA) => {
    setSelectedTA(ta);
    setShowDropdown(false);
    setSearchTerm('');
    
    // 담당자가 1명만 있으면 자동 선택, 여러 명이면 선택 초기화
    let assignedManager = '';
    if (ta.contactPersons && ta.contactPersons.length === 1) {
      assignedManager = ta.contactPersons[0].name;
      setSelectedManager(assignedManager);
    } else {
      setSelectedManager('');
    }
    
    const newCustomerInfo = {
      type: 'TA' as const,
      taId: ta.id,
      taCode: ta.taCode, // TA 코드 포함
      name: ta.companyName,
      email: ta.email,
      phone: ta.phone,
      address: ta.address,
      assignedManager: assignedManager || undefined
    };
    
    onChange(newCustomerInfo);
  };

  // 담당자 선택 핸들러
  const handleManagerSelect = (managerName: string) => {
    setSelectedManager(managerName);
    
    const newCustomerInfo = {
      ...value,
      assignedManager: managerName
    };
    
    onChange(newCustomerInfo);
  };

  // 직접 입력 핸들러
  const handleDirectInputChange = (field: keyof CustomerInfo, fieldValue: string) => {
    onChange({
      ...value,
      type: 'DIRECT',
      [field]: fieldValue
    });
  };

  // 모드 변경 핸들러
  const handleModeChange = (newMode: 'SELECT' | 'INPUT') => {
    setMode(newMode);
    setSelectedTA(null);
    setSelectedManager('');
    setShowDropdown(false);
    setSearchTerm('');
    
    if (newMode === 'SELECT') {
      // TA 선택 모드로 변경 시 초기화
      onChange({
        type: 'TA',
        name: '',
        email: '',
        phone: '',
        address: '',
        taCode: undefined,
        taId: undefined,
        assignedManager: undefined
      });
    } else {
      // 직접 입력 모드로 변경 시 초기화 (TA 관련 필드 제거)
      onChange({
        type: 'DIRECT',
        name: '',
        email: '',
        phone: '',
        address: '',
        taCode: undefined,
        taId: undefined,
        assignedManager: 'Individual' // 개인고객은 Individual로 설정
      });
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 모드 선택 버튼 */}
      <div className="flex space-x-2 mb-4">
        <Button
          type="button"
          variant={mode === 'SELECT' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleModeChange('SELECT')}
          className="flex items-center"
        >
          <Building2 className="w-4 h-4 mr-2" />
          등록된 TA 선택
        </Button>
        
        <Button
          type="button"
          variant={mode === 'INPUT' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleModeChange('INPUT')}
          className="flex items-center"
        >
          <User className="w-4 h-4 mr-2" />
          직접 입력
        </Button>
      </div>

      {mode === 'SELECT' ? (
        <div className="space-y-4">
          {/* TA 검색 */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="TA명, 코드, 이메일로 검색..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="pl-10"
              />
              {showDropdown && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowDropdown(false)}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* TA 드롭다운 */}
            {showDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center text-gray-500">로딩 중...</div>
                ) : filteredTAs.length > 0 ? (
                  filteredTAs.map((ta) => (
                    <button
                      key={ta.id}
                      type="button"
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0 focus:bg-gray-50 focus:outline-none"
                      onClick={() => handleTASelect(ta)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{ta.companyName}</div>
                          <div className="text-sm text-gray-500">
                            {ta.taCode} • {ta.email}
                          </div>
                          <div className="text-sm text-gray-400">{ta.phone}</div>
                        </div>
                        {selectedTA?.id === ta.id && (
                          <Check className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    검색 결과가 없습니다.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 선택된 TA 정보 표시 */}
          {selectedTA && mode === 'SELECT' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <Check className="w-5 h-5 text-green-600 mr-2" />
                    <h4 className="font-medium text-blue-900">선택된 TA</h4>
                  </div>
                  <h5 className="font-semibold text-blue-900 text-lg">{selectedTA.companyName}</h5>
                  <p className="text-sm text-blue-700 mt-1">
                    📋 코드: {selectedTA.taCode}
                  </p>
                  <p className="text-sm text-blue-700">
                    📧 이메일: {selectedTA.email}
                  </p>
                  <p className="text-sm text-blue-700">
                    📞 전화: {selectedTA.phone}
                  </p>
                  <p className="text-sm text-blue-700">
                    📍 주소: {selectedTA.address}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTA(null);
                    setSelectedManager('');
                    onChange({
                      type: 'TA',
                      name: '',
                      email: '',
                      phone: '',
                      address: '',
                      taCode: undefined,
                      taId: undefined,
                      assignedManager: undefined
                    });
                  }}
                  className="text-blue-600 hover:text-blue-800 ml-4"
                  title="선택 해제"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* TA 담당자 선택 (여러 명일 때만 표시) */}
          {selectedTA && selectedTA.contactPersons && selectedTA.contactPersons.length > 1 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                담당자 선택 *
              </label>
              <select
                value={selectedManager}
                onChange={(e) => handleManagerSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">담당자를 선택하세요</option>
                {selectedTA.contactPersons.map((person, index) => (
                  <option key={index} value={person.name}>
                    {person.name} ({person.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* TA 담당자 정보 표시 (1명이거나 선택완료된 경우) */}
          {selectedTA && selectedManager && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <User className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">담당자: {selectedManager}</span>
              </div>
            </div>
          )}

          {/* 디버깅 정보 (개발 시에만 표시) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
              <div>Mode: {mode}</div>
              <div>Value.type: {value.type}</div>
              <div>SelectedTA: {selectedTA ? selectedTA.companyName : 'null'}</div>
              <div>Value.taId: {value.taId || 'null'}</div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 직접 입력 폼 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              고객명 *
            </label>
            <Input
              type="text"
              placeholder="고객명을 입력하세요"
              value={value.name || ''}
              onChange={(e) => handleDirectInputChange('name', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일 *
            </label>
            <Input
              type="email"
              placeholder="example@email.com"
              value={value.email || ''}
              onChange={(e) => handleDirectInputChange('email', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              전화번호 *
            </label>
            <Input
              type="tel"
              placeholder="010-1234-5678"
              value={value.phone || ''}
              onChange={(e) => handleDirectInputChange('phone', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              주소
            </label>
            <Input
              type="text"
              placeholder="주소를 입력하세요 (선택)"
              value={value.address || ''}
              onChange={(e) => handleDirectInputChange('address', e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
