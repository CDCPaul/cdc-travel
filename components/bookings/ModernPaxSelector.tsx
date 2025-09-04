"use client";

import React from 'react';
import { Users, User, Baby, Plus, Minus } from 'lucide-react';

// 간단한 승객 인원수 타입
export interface SimplePaxInfo {
  adults: number;
  children: number;
  infants: number;
  total: number;
  notes?: string;
}

interface ModernPaxSelectorProps {
  value: SimplePaxInfo;
  onChange: (paxInfo: SimplePaxInfo) => void;
  className?: string;
}

export function ModernPaxSelector({ value, onChange, className = '' }: ModernPaxSelectorProps) {
  
  const updatePax = (field: keyof SimplePaxInfo, newValue: number | string) => {
    const updated = { ...value, [field]: newValue };
    
    // 숫자 필드일 경우 총 인원수 자동 계산
    if (field === 'adults' || field === 'children' || field === 'infants') {
      updated.total = updated.adults + updated.children + updated.infants;
    }
    
    onChange(updated);
  };

  const increaseCount = (field: keyof SimplePaxInfo) => {
    const current = value[field] as number;
    updatePax(field, current + 1);
  };

  const decreaseCount = (field: keyof SimplePaxInfo, min = 0) => {
    const current = value[field] as number;
    if (current > min) {
      updatePax(field, current - 1);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 안내 메시지 */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">승객 인원수 입력</h4>
            <p className="text-sm text-blue-700">
              처음 예약 시에는 대략적인 인원수만 입력하시면 됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* 인원수 선택기들 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 성인 */}
        <div className="group">
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 transition-all duration-200 hover:border-blue-300 hover:shadow-lg group-hover:bg-blue-50/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors duration-200">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h5 className="text-lg font-bold text-gray-900">성인</h5>
                  <p className="text-sm text-gray-500">만 12세 이상</p>
                </div>
              </div>
              
              {/* 카운터 */}
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => decreaseCount('adults', 1)}
                  disabled={value.adults <= 1}
                  className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                >
                  <Minus className="h-4 w-4 text-gray-600 group-hover/btn:text-blue-600" />
                </button>
                
                <div className="w-16 h-12 bg-gray-50 rounded-xl flex items-center justify-center border-2 border-gray-200 group-hover:border-blue-300 group-hover:bg-blue-50 transition-all duration-200">
                  <span className="text-2xl font-bold text-blue-600">{value.adults}</span>
                </div>
                
                <button
                  type="button"
                  onClick={() => increaseCount('adults')}
                  className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group/btn"
                >
                  <Plus className="h-4 w-4 text-gray-600 group-hover/btn:text-blue-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 아동 */}
        <div className="group">
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 transition-all duration-200 hover:border-green-300 hover:shadow-lg group-hover:bg-green-50/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors duration-200">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h5 className="text-lg font-bold text-gray-900">아동</h5>
                  <p className="text-sm text-gray-500">만 2세 ~ 11세</p>
                </div>
              </div>
              
              {/* 카운터 */}
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => decreaseCount('children', 0)}
                  disabled={value.children <= 0}
                  className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-green-300 hover:bg-green-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                >
                  <Minus className="h-4 w-4 text-gray-600 group-hover/btn:text-green-600" />
                </button>
                
                <div className="w-16 h-12 bg-gray-50 rounded-xl flex items-center justify-center border-2 border-gray-200 group-hover:border-green-300 group-hover:bg-green-50 transition-all duration-200">
                  <span className="text-2xl font-bold text-green-600">{value.children}</span>
                </div>
                
                <button
                  type="button"
                  onClick={() => increaseCount('children')}
                  className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-green-300 hover:bg-green-50 transition-all duration-200 group/btn"
                >
                  <Plus className="h-4 w-4 text-gray-600 group-hover/btn:text-green-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 유아 */}
        <div className="group">
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 transition-all duration-200 hover:border-pink-300 hover:shadow-lg group-hover:bg-pink-50/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-pink-100 rounded-xl group-hover:bg-pink-200 transition-colors duration-200">
                  <Baby className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <h5 className="text-lg font-bold text-gray-900">유아</h5>
                  <p className="text-sm text-gray-500">만 24개월 미만</p>
                </div>
              </div>
              
              {/* 카운터 */}
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => decreaseCount('infants', 0)}
                  disabled={value.infants <= 0}
                  className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-pink-300 hover:bg-pink-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                >
                  <Minus className="h-4 w-4 text-gray-600 group-hover/btn:text-pink-600" />
                </button>
                
                <div className="w-16 h-12 bg-gray-50 rounded-xl flex items-center justify-center border-2 border-gray-200 group-hover:border-pink-300 group-hover:bg-pink-50 transition-all duration-200">
                  <span className="text-2xl font-bold text-pink-600">{value.infants}</span>
                </div>
                
                <button
                  type="button"
                  onClick={() => increaseCount('infants')}
                  className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-pink-300 hover:bg-pink-50 transition-all duration-200 group/btn"
                >
                  <Plus className="h-4 w-4 text-gray-600 group-hover/btn:text-pink-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 총 인원수 표시 */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-center space-x-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Users className="h-6 w-6" />
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">{value.total}명</div>
            <div className="text-indigo-100 text-sm">
              성인 {value.adults}명
              {value.children > 0 && ` · 아동 ${value.children}명`}
              {value.infants > 0 && ` · 유아 ${value.infants}명`}
            </div>
          </div>
        </div>
      </div>

      {/* 메모 입력 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          승객 관련 메모 (선택사항)
        </label>
        <textarea
          placeholder="예) 휠체어 이용 고객 1명, 채식주의자 2명, 임산부 등 특별한 요청사항..."
          value={value.notes || ''}
          onChange={(e) => updatePax('notes', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all duration-200"
          rows={3}
        />
      </div>

      {/* 안내사항 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h5 className="text-sm font-semibold text-amber-800 mb-2">📋 참고사항</h5>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• 정확한 승객 명단은 예약금 입금 후 수집합니다</li>
          <li>• 여권 정보는 발권 전까지 확보하시면 됩니다</li>
          <li>• 인원수 변경 시 요금이 달라질 수 있습니다</li>
        </ul>
      </div>
    </div>
  );
}
