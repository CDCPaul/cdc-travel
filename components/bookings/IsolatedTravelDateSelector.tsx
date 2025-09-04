"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export interface Segment {
  id: string;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime?: string;
}

export interface TravelDates {
  type: 'ONE_WAY' | 'ROUND_TRIP' | 'MULTI_CITY';
  segments: Segment[];
  returnDate?: string;
  returnTime?: string;
}

interface IsolatedTravelDateSelectorProps {
  // 완전 독립적이므로 props 없음
  className?: string;
}

function IsolatedTravelDateSelectorComponent({ className = '' }: IsolatedTravelDateSelectorProps) {
  console.log('🔥 IsolatedTravelDateSelector 렌더됨!', { timestamp: Date.now() });

  // 🏝️ 완전 독립적인 내부 상태
  const [internalValue, setInternalValue] = useState<TravelDates>({
    type: 'ONE_WAY',
    segments: [{ 
      id: uuidv4(), 
      origin: '', 
      destination: '', 
      departureDate: '',
      departureTime: '' 
    }],
    returnDate: '',
    returnTime: ''
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const focusedFieldRef = useRef<{ segmentId: string; field: string } | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // 🎯 초기화 (한 번만)
  useEffect(() => {
    if (!isInitializedRef.current) {
      console.log('🏁 IsolatedTravelDateSelector 초기화');
      isInitializedRef.current = true;
    }
  }, []); // 의도적으로 빈 의존성 배열

  // 🌐 전역 이벤트 발생 (부모에게 데이터 전달)
  const notifyParent = useCallback((data: TravelDates) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('travelDateUpdate', { detail: data }));
    }, 100); // 100ms debounce
  }, []);

  // 📝 구간 업데이트
  const updateSegment = useCallback((segmentId: string, field: keyof Segment, value: string) => {
    console.log(`⌨️ Isolated Input 변경: ${field} = "${value}"`);
    
    setInternalValue(prev => {
      const newValue = { ...prev };
      const segmentIndex = newValue.segments.findIndex(s => s.id === segmentId);
      
      if (segmentIndex >= 0) {
        newValue.segments[segmentIndex] = {
          ...newValue.segments[segmentIndex],
          [field]: value
        };
      }
      
      notifyParent(newValue);
      return newValue;
    });
  }, [notifyParent]);

  // ➕ 구간 추가
  const addSegment = useCallback(() => {
    setInternalValue(prev => {
      const newValue = {
        ...prev,
        segments: [...prev.segments, {
          id: uuidv4(),
          origin: '',
          destination: '',
          departureDate: '',
          departureTime: ''
        }]
      };
      notifyParent(newValue);
      return newValue;
    });
  }, [notifyParent]);

  // 🗑️ 구간 삭제
  const removeSegment = useCallback((segmentId: string) => {
    if (internalValue.segments.length <= 1) return;
    
    setInternalValue(prev => {
      const newValue = {
        ...prev,
        segments: prev.segments.filter(s => s.id !== segmentId)
      };
      notifyParent(newValue);
      return newValue;
    });
  }, [internalValue.segments.length, notifyParent]);

  // 🔄 여행 타입 변경
  const handleTypeChange = useCallback((type: TravelDates['type']) => {
    setInternalValue(prev => {
      const newValue = { ...prev, type };
      notifyParent(newValue);
      return newValue;
    });
  }, [notifyParent]);

  // 🎯 포커스 핸들러
  const createFocusHandler = useCallback((segmentId: string, field: keyof Segment) => ({
    onFocus: () => {
      console.log(`🎯 Isolated Input 포커스: ${field}`);
      focusedFieldRef.current = { segmentId, field };
    },
    onBlur: () => {
      console.log(`💨 Isolated Input 포커스 잃음: ${field}`);
      setTimeout(() => {
        if (!containerRef.current?.contains(document.activeElement)) {
          focusedFieldRef.current = null;
        }
      }, 10);
    }
  }), []);

  // 🔄 복귀일정 업데이트
  const updateReturnInfo = useCallback((field: 'returnDate' | 'returnTime', value: string) => {
    setInternalValue(prev => {
      const newValue = { ...prev, [field]: value };
      notifyParent(newValue);
      return newValue;
    });
  }, [notifyParent]);

  return (
    <div ref={containerRef} className={`space-y-6 ${className}`}>
      <div className="p-4 border border-green-300 bg-green-50 rounded-lg">
        <h3 className="text-sm font-semibold text-green-800 mb-2">
          🏝️ 완전 독립 TravelDateSelector
        </h3>
        <p className="text-xs text-green-600">
          이 컴포넌트는 부모의 리렌더링에 영향받지 않습니다
        </p>
      </div>

      {/* 여행 타입 선택 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          여행 형태 *
        </label>
        <div className="flex gap-2">
          {([
            { key: 'ONE_WAY', label: '편도' },
            { key: 'ROUND_TRIP', label: '왕복' },
            { key: 'MULTI_CITY', label: '다구간' }
          ] as const).map(({ key, label }) => (
            <Button
              key={key}
              type="button"
              variant={internalValue.type === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTypeChange(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* 구간 정보 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">
            출발 정보
          </h4>
          {internalValue.type === 'MULTI_CITY' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSegment}
            >
              <Plus className="h-4 w-4 mr-1" />
              구간 추가
            </Button>
          )}
        </div>

        {internalValue.segments.map((segment, index) => (
          <div key={segment.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {internalValue.type === 'MULTI_CITY' ? `구간 ${index + 1}` : '출발 구간'}
              </span>
              {internalValue.type === 'MULTI_CITY' && internalValue.segments.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSegment(segment.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">출발지 *</label>
                <Input
                  type="text"
                  placeholder="예) 인천국제공항"
                  value={segment.origin}
                  onChange={(e) => updateSegment(segment.id, 'origin', e.target.value)}
                  {...createFocusHandler(segment.id, 'origin')}
                  data-field={`origin-${segment.id}`}
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">도착지 *</label>
                <Input
                  type="text"
                  placeholder="예) 세부국제공항"
                  value={segment.destination}
                  onChange={(e) => updateSegment(segment.id, 'destination', e.target.value)}
                  {...createFocusHandler(segment.id, 'destination')}
                  data-field={`destination-${segment.id}`}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">출발일 *</label>
                <Input
                  type="date"
                  value={segment.departureDate}
                  onChange={(e) => updateSegment(segment.id, 'departureDate', e.target.value)}
                  {...createFocusHandler(segment.id, 'departureDate')}
                  data-field={`departureDate-${segment.id}`}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">출발시간</label>
                <Input
                  type="time"
                  value={segment.departureTime || ''}
                  onChange={(e) => updateSegment(segment.id, 'departureTime', e.target.value)}
                  {...createFocusHandler(segment.id, 'departureTime')}
                  data-field={`departureTime-${segment.id}`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 복귀 정보 (왕복일 경우만) */}
      {internalValue.type === 'ROUND_TRIP' && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">복귀 정보</h4>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">복귀일 *</label>
                <Input
                  type="date"
                  value={internalValue.returnDate || ''}
                  onChange={(e) => updateReturnInfo('returnDate', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">복귀시간</label>
                <Input
                  type="time"
                  value={internalValue.returnTime || ''}
                  onChange={(e) => updateReturnInfo('returnTime', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 🔥 최강 안정화: React.memo로 모든 리렌더링 차단
const MemoizedComponent = React.memo(IsolatedTravelDateSelectorComponent, (prevProps, nextProps) => {
  console.log('🔍 React.memo 비교 호출됨!', { prevProps, nextProps });
  console.log('🚫 모든 변경 무시하여 리렌더 차단');
  return true; // 항상 같다고 판단하여 절대 리렌더 안함
});

export const IsolatedTravelDateSelector = MemoizedComponent;