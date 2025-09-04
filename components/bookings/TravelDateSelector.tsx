"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, Plus, X, ArrowRight, RotateCcw, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// 여행 타입 정의
type TravelType = 'ONE_WAY' | 'ROUND_TRIP' | 'MULTI_CITY';

// 구간 정보
interface Segment {
  id: string;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime?: string;
}

// 여행 일정 데이터
interface TravelDates {
  type: TravelType;
  segments: Segment[];
  returnDate?: string;
  returnTime?: string;
}

interface TravelDateSelectorProps {
  value: TravelDates;
  onChange: (dates: TravelDates) => void;
  className?: string;
}

function TravelDateSelectorComponent({ value, onChange, className = '' }: TravelDateSelectorProps) {
  console.log('🚀 TravelDateSelector 렌더됨!', { 
    valueSegments: value.segments.length, 
    valueType: value.type,
    timestamp: Date.now() 
  });
  
  // 내부 상태 (빠른 업데이트용) - 초기값만 설정하고 이후엔 독립적으로 관리
  const [internalValue, setInternalValue] = useState<TravelDates>(value);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const onChangeRef = useRef(onChange);
  const isInitializedRef = useRef(false);
  
  // 🔥 포커스 추적 및 복구용 ref들
  const focusedFieldRef = useRef<{ segmentId: string; field: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 최신 onChange 함수를 항상 참조하도록 업데이트
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // 🔥 핵심 수정: 초기화 시에만 value prop을 사용하고, 이후엔 외부 변경 완전 무시
  useEffect(() => {
    if (!isInitializedRef.current) {
      console.log('🏁 TravelDateSelector 초기화', value);
      setInternalValue(value);
      isInitializedRef.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 🚨 의존성 배열을 완전히 비워서 초기화 이후 외부 변경 무시



  // 컴포넌트 언마운트 시 timer 정리
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // 새 구간 추가 (즉시 onChange 호출)
  const addSegment = () => {
    const newSegment: Segment = {
      id: `segment-${Date.now()}`,
      origin: '',
      destination: '',
      departureDate: '',
      departureTime: ''
    };
    
    const newValue = {
      ...internalValue,
      segments: [...internalValue.segments, newSegment]
    };
    
    setInternalValue(newValue);
    onChangeRef.current(newValue); // 즉시 호출
  };

  // 구간 제거 (즉시 onChange 호출)
  const removeSegment = (segmentId: string) => {
    if (internalValue.segments.length <= 1) return; // 최소 1개 구간은 유지
    
    const newValue = {
      ...internalValue,
      segments: internalValue.segments.filter(s => s.id !== segmentId)
    };
    
    setInternalValue(newValue);
    onChangeRef.current(newValue); // 즉시 호출
  };

  // 구간 정보 업데이트 (debounced) - useCallback으로 메모이제이션
  const updateSegment = useCallback((segmentId: string, field: keyof Segment, fieldValue: string) => {
    setInternalValue(prevValue => {
      const newValue = {
        ...prevValue,
        segments: prevValue.segments.map(segment =>
          segment.id === segmentId
            ? { ...segment, [field]: fieldValue }
            : segment
        )
      };
      
      // debounced onChange 호출
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      
      debounceTimer.current = setTimeout(() => {
        onChangeRef.current(newValue);
      }, 300);
      
      return newValue;
    });
  }, []);

  // 여행 타입 변경 (즉시 onChange 호출)
  const handleTypeChange = (newType: TravelType) => {
    let newSegments = internalValue.segments;
    
    // 편도로 변경 시 첫 번째 구간만 유지
    if (newType === 'ONE_WAY') {
      newSegments = internalValue.segments.slice(0, 1);
    }
    // 왕복으로 변경 시 구간이 없으면 기본 구간 추가
    else if (newType === 'ROUND_TRIP' && newSegments.length === 0) {
      newSegments = [{
        id: `segment-${Date.now()}`,
        origin: '',
        destination: '',
        departureDate: '',
        departureTime: ''
      }];
    }
    // 다구간으로 변경 시 최소 2개 구간 보장
    else if (newType === 'MULTI_CITY' && newSegments.length < 2) {
      while (newSegments.length < 2) {
        newSegments.push({
          id: `segment-${Date.now()}-${newSegments.length}`,
          origin: '',
          destination: '',
          departureDate: '',
          departureTime: ''
        });
      }
    }
    
    const newValue = {
      ...internalValue,
      type: newType,
      segments: newSegments,
      returnDate: newType === 'ROUND_TRIP' ? internalValue.returnDate : undefined,
      returnTime: newType === 'ROUND_TRIP' ? internalValue.returnTime : undefined
    };
    
    setInternalValue(newValue);
    onChangeRef.current(newValue); // 즉시 호출
  };

  // 복귀일 업데이트 (debounced) - useCallback으로 메모이제이션
  const updateReturnInfo = useCallback((field: 'returnDate' | 'returnTime', fieldValue: string) => {
    setInternalValue(prevValue => {
      const newValue = {
        ...prevValue,
        [field]: fieldValue
      };
      
      // debounced onChange 호출
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      
      debounceTimer.current = setTimeout(() => {
        onChangeRef.current(newValue);
      }, 300);
      
      return newValue;
    });
  }, []);

  // 🔥 각 입력 필드에 대한 안정적인 onChange 핸들러 생성 (메모이제이션)
  const createSegmentHandler = useCallback((segmentId: string, field: keyof Segment) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log(`⌨️ Input 변경: ${field} = "${e.target.value}"`);
      updateSegment(segmentId, field, e.target.value);
    };
  }, [updateSegment]);

  // 🔍 포커스/블러 추적 및 복구 핸들러
  const createFocusHandler = useCallback((segmentId: string, field: keyof Segment) => {
    return {
      onFocus: () => {
        console.log(`🎯 Input 포커스: ${field}`);
        focusedFieldRef.current = { segmentId, field };
      },
      onBlur: () => {
        console.log(`💨 Input 포커스 잃음: ${field}`);
        // 약간의 지연 후에 포커스가 완전히 사라졌는지 확인
        setTimeout(() => {
          if (!containerRef.current?.contains(document.activeElement)) {
            focusedFieldRef.current = null;
          }
        }, 10);
      }
    };
  }, []);

  const createReturnHandler = useCallback((field: 'returnDate' | 'returnTime') => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log(`⌨️ Return Input 변경: ${field} = "${e.target.value}"`);
      updateReturnInfo(field, e.target.value);
    };
  }, [updateReturnInfo]);

  // 🔍 복귀일정 포커스/블러 추적 핸들러
  const createReturnFocusHandler = useCallback((field: 'returnDate' | 'returnTime') => {
    return {
      onFocus: () => {
        console.log(`🎯 Return Input 포커스: ${field}`);
        focusedFieldRef.current = { segmentId: 'return', field };
      },
      onBlur: () => {
        console.log(`💨 Return Input 포커스 잃음: ${field}`);
        setTimeout(() => {
          if (!containerRef.current?.contains(document.activeElement)) {
            focusedFieldRef.current = null;
          }
        }, 10);
      }
    };
  }, []);

  // 🔥 강력한 포커스 복구 로직 (여러 시도)
  useEffect(() => {
    if (focusedFieldRef.current && containerRef.current) {
      const { segmentId, field } = focusedFieldRef.current;
      console.log(`🔄 포커스 복구 시도: ${field} (${segmentId})`);
      
      let attempts = 0;
      const maxAttempts = 5;
      
      const tryFocus = () => {
        attempts++;
        console.log(`🎯 포커스 복구 시도 ${attempts}/${maxAttempts}: ${field}`);
        
        // 여러 가지 selector 시도
        const selectors = [
          `input[data-field="${field}-${segmentId}"]`,
          `input[key="${field}-${segmentId}"]`,
          `input[placeholder*="${field === 'origin' ? '인천' : field === 'destination' ? '세부' : ''}"]`,
          'input[type="text"]',
          'input[type="date"]',
          'input[type="time"]'
        ];
        
        let targetInput: HTMLInputElement | null = null;
        for (const selector of selectors) {
          targetInput = containerRef.current?.querySelector(selector) as HTMLInputElement;
          if (targetInput && !targetInput.disabled && targetInput.style.display !== 'none') {
            break;
          }
        }
        
        if (targetInput) {
          targetInput.focus();
          // 커서를 끝으로 이동
          if (targetInput.value) {
            targetInput.selectionStart = targetInput.value.length;
            targetInput.selectionEnd = targetInput.value.length;
          }
          console.log(`✅ 포커스 복구 완료: ${field} (시도 ${attempts})`);
          return true;
        } else if (attempts < maxAttempts) {
          setTimeout(tryFocus, 10 * attempts); // 점진적 지연 증가
          return false;
        } else {
          console.log(`❌ 포커스 복구 최종 실패: ${field} (${attempts}회 시도)`);
          return false;
        }
      };
      
      // 즉시 시도
      setTimeout(tryFocus, 10);
    }
  });

  // 🌐 전역 이벤트를 통한 부모 컴포넌트와 통신
  useEffect(() => {
    const handleDataSync = () => {
      window.dispatchEvent(new CustomEvent('travelDateUpdate', { 
        detail: internalValue 
      }));
    };

    // 내부 상태가 변경될 때마다 전역 이벤트 발생
    handleDataSync();
  }, [internalValue]);

  return (
    <div ref={containerRef} className={`space-y-6 ${className}`}>
      {/* 여행 타입 선택 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          여행 형태 *
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={internalValue.type === 'ONE_WAY' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTypeChange('ONE_WAY')}
            className="flex items-center"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            편도
          </Button>
          
          <Button
            type="button"
            variant={internalValue.type === 'ROUND_TRIP' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTypeChange('ROUND_TRIP')}
            className="flex items-center"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            왕복
          </Button>
          
          <Button
            type="button"
            variant={internalValue.type === 'MULTI_CITY' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTypeChange('MULTI_CITY')}
            className="flex items-center"
          >
            <Route className="w-4 h-4 mr-2" />
            다구간
          </Button>
        </div>
      </div>

      {/* 구간 정보 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            {internalValue.type === 'ONE_WAY' && '출발 정보'}
            {internalValue.type === 'ROUND_TRIP' && '출발 정보'}
            {internalValue.type === 'MULTI_CITY' && '구간 정보'}
          </label>
          
          {internalValue.type === 'MULTI_CITY' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSegment}
              className="flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              구간 추가
            </Button>
          )}
        </div>

        {internalValue.segments.map((segment, index) => (
          <div key={segment.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                {internalValue.type === 'MULTI_CITY' ? `구간 ${index + 1}` : '출발'}
              </span>
              
              {internalValue.type === 'MULTI_CITY' && internalValue.segments.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSegment(segment.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  출발지 *
                </label>
                <Input
                  key={`origin-${segment.id}`}
                  data-field={`origin-${segment.id}`}
                  type="text"
                  placeholder="예: 인천(ICN)"
                  value={segment.origin}
                  onChange={createSegmentHandler(segment.id, 'origin')}
                  {...createFocusHandler(segment.id, 'origin')}
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  도착지 *
                </label>
                <Input
                  key={`destination-${segment.id}`}
                  type="text"
                  placeholder="예: 세부(CEB)"
                  value={segment.destination}
                  onChange={createSegmentHandler(segment.id, 'destination')}
                  {...createFocusHandler(segment.id, 'destination')}
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  출발일 *
                </label>
                <Input
                  key={`departureDate-${segment.id}`}
                  type="date"
                  value={segment.departureDate}
                  onChange={createSegmentHandler(segment.id, 'departureDate')}
                  {...createFocusHandler(segment.id, 'departureDate')}
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  출발시간
                </label>
                <Input
                  key={`departureTime-${segment.id}`}
                  type="time"
                  value={segment.departureTime || ''}
                  onChange={createSegmentHandler(segment.id, 'departureTime')}
                  {...createFocusHandler(segment.id, 'departureTime')}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 왕복 복귀 정보 */}
      {internalValue.type === 'ROUND_TRIP' && (
        <div className="p-4 border border-gray-200 rounded-lg bg-blue-50">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700">
              복귀 정보
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                복귀일 *
              </label>
              <Input
                key="returnDate-input"
                type="date"
                value={internalValue.returnDate || ''}
                onChange={createReturnHandler('returnDate')}
                {...createReturnFocusHandler('returnDate')}
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                복귀시간
              </label>
              <Input
                key="returnTime-input"
                type="time"
                value={internalValue.returnTime || ''}
                onChange={createReturnHandler('returnTime')}
                {...createReturnFocusHandler('returnTime')}
              />
            </div>
          </div>
        </div>
      )}

      {/* 요약 정보 */}
      {internalValue.segments.length > 0 && internalValue.segments[0].origin && internalValue.segments[0].destination && (
        <div className="p-3 bg-gray-100 rounded-lg text-sm text-gray-600">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            <span>
              {internalValue.type === 'ONE_WAY' && '편도: '}
              {internalValue.type === 'ROUND_TRIP' && '왕복: '}
              {internalValue.type === 'MULTI_CITY' && '다구간: '}
              
              {internalValue.segments.map((segment, index) => (
                <span key={segment.id}>
                  {index > 0 && ' → '}
                  {segment.origin} → {segment.destination}
                  {segment.departureDate && ` (${segment.departureDate})`}
                </span>
              ))}
              
              {internalValue.type === 'ROUND_TRIP' && internalValue.returnDate && (
                <span> | 복귀: {internalValue.returnDate}</span>
              )}
            </span>
          </div>
        </div>
      )}


    </div>
  );
}

// 🔥 최강 안정화: 모든 prop 변경 무시하여 리렌더 완전 차단
export const TravelDateSelector = React.memo(TravelDateSelectorComponent, (prevProps, nextProps) => {
  console.log('🔍 React.memo 호출됨!', { 
    prevProps: {
      valueType: prevProps.value.type,
      className: prevProps.className 
    },
    nextProps: {
      valueType: nextProps.value.type, 
      className: nextProps.className
    }
  });
  console.log('🚫 TravelDateSelector 모든 prop 변경 무시하여 리렌더 차단');
  return true; // 항상 같다고 판단하여 절대 리렌더 안함
});
