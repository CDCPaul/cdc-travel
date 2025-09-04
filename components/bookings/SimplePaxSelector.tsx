"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Users, User, Baby } from 'lucide-react';

// 간단한 승객 인원수 타입
export interface SimplePaxInfo {
  adults: number;
  children: number;
  infants: number;
  total: number;
  notes?: string; // 특별 요청사항이나 메모
}

interface SimplePaxSelectorProps {
  value: SimplePaxInfo;
  onChange: (paxInfo: SimplePaxInfo) => void;
  className?: string;
}

export function SimplePaxSelector({ value, onChange, className = '' }: SimplePaxSelectorProps) {
  
  const updatePax = (field: keyof SimplePaxInfo, newValue: number | string) => {
    const updated = { ...value, [field]: newValue };
    
    // 숫자 필드일 경우 총 인원수 자동 계산
    if (field === 'adults' || field === 'children' || field === 'infants') {
      updated.total = updated.adults + updated.children + updated.infants;
    }
    
    onChange(updated);
  };

  const handleNumberInput = (field: keyof SimplePaxInfo, inputValue: string) => {
    const numValue = Math.max(0, parseInt(inputValue) || 0);
    updatePax(field, numValue);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 안내 메시지 */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-2">승객 인원수 입력</h4>
        <p className="text-sm text-blue-700">
          처음 예약 시에는 대략적인 인원수만 입력하시면 됩니다. 
          상세한 승객 정보는 예약금 확인 후 별도로 입력할 수 있습니다.
        </p>
      </div>

      {/* 인원수 입력 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 성인 */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-600" />
            <label className="text-sm font-medium text-gray-700">
              성인 *
            </label>
          </div>
          <div className="relative">
            <Input
              type="number"
              min="1"
              max="99"
              value={value.adults}
              onChange={(e) => handleNumberInput('adults', e.target.value)}
              className="text-center text-2xl font-bold h-16 border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              required
            />
            <div className="absolute -bottom-1 -right-1">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => handleNumberInput('adults', (value.adults + 1).toString())}
                  className="bg-blue-500 hover:bg-blue-600 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => handleNumberInput('adults', Math.max(1, value.adults - 1).toString())}
                  className="bg-gray-500 hover:bg-gray-600 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center mt-1"
                  disabled={value.adults <= 1}
                >
                  -
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center">만 12세 이상</p>
        </div>

        {/* 아동 */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-green-600" />
            <label className="text-sm font-medium text-gray-700">
              아동
            </label>
          </div>
          <div className="relative">
            <Input
              type="number"
              min="0"
              max="99"
              value={value.children}
              onChange={(e) => handleNumberInput('children', e.target.value)}
              className="text-center text-2xl font-bold h-16 border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200"
            />
            <div className="absolute -bottom-1 -right-1">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => handleNumberInput('children', (value.children + 1).toString())}
                  className="bg-green-500 hover:bg-green-600 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => handleNumberInput('children', Math.max(0, value.children - 1).toString())}
                  className="bg-gray-500 hover:bg-gray-600 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center mt-1"
                  disabled={value.children <= 0}
                >
                  -
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center">만 2세 ~ 11세</p>
        </div>

        {/* 유아 */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Baby className="h-5 w-5 text-pink-600" />
            <label className="text-sm font-medium text-gray-700">
              유아
            </label>
          </div>
          <div className="relative">
            <Input
              type="number"
              min="0"
              max="99"
              value={value.infants}
              onChange={(e) => handleNumberInput('infants', e.target.value)}
              className="text-center text-2xl font-bold h-16 border-2 border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
            />
            <div className="absolute -bottom-1 -right-1">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => handleNumberInput('infants', (value.infants + 1).toString())}
                  className="bg-pink-500 hover:bg-pink-600 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => handleNumberInput('infants', Math.max(0, value.infants - 1).toString())}
                  className="bg-gray-500 hover:bg-gray-600 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center mt-1"
                  disabled={value.infants <= 0}
                >
                  -
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center">만 24개월 미만</p>
        </div>
      </div>

      {/* 총 인원수 표시 */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">총 승객 수:</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {value.total}명
          </div>
        </div>
        
        {value.total > 0 && (
          <div className="mt-2 text-sm text-gray-600 text-center">
            성인 {value.adults}명
            {value.children > 0 && `, 아동 ${value.children}명`}
            {value.infants > 0 && `, 유아 ${value.infants}명`}
          </div>
        )}
      </div>

      {/* 특별 요청사항 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          승객 관련 메모 (선택사항)
        </label>
        <textarea
          placeholder="예) 휠체어 이용 고객 1명, 채식주의자 2명, 임산부 등 특별한 요청사항이 있으시면 입력해주세요"
          value={value.notes || ''}
          onChange={(e) => updatePax('notes', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          rows={3}
        />
        <p className="text-xs text-gray-500">
          특별한 요청사항이나 주의사항이 있으시면 미리 메모해두시면 도움이 됩니다.
        </p>
      </div>

      {/* 안내사항 */}
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h5 className="text-sm font-medium text-yellow-800 mb-1">참고사항</h5>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• 정확한 승객 명단은 예약금 입금 후 수집합니다.</li>
          <li>• 여권 정보는 발권 전까지 확보하시면 됩니다.</li>
          <li>• 인원수 변경 시 요금이 달라질 수 있습니다.</li>
        </ul>
      </div>

      {/* 개발용 정보 표시 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 rounded-lg p-4 text-xs">
          <div className="mb-2">
            <strong>승객 정보 상태:</strong>
          </div>
          <div>총 인원: {value.total}명 (성인: {value.adults}, 아동: {value.children}, 유아: {value.infants})</div>
          <div>메모: {value.notes ? `"${value.notes}"` : '없음'}</div>
        </div>
      )}
    </div>
  );
}
