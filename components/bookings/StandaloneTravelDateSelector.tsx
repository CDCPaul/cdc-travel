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

// 🏝️ 완전 독립적인 전역 인스턴스
let globalTravelDateInstance: StandaloneTravelDateSelectorClass | null = null;

class StandaloneTravelDateSelectorClass {
  private data: TravelDates = {
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
  };
  
  private listeners: Array<(data: TravelDates) => void> = [];

  getData(): TravelDates {
    return this.data;
  }

  setData(newData: TravelDates): void {
    this.data = newData;
    this.notifyListeners();
  }

  addListener(callback: (data: TravelDates) => void): void {
    this.listeners.push(callback);
  }

  removeListener(callback: (data: TravelDates) => void): void {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.data));
    // 🚫 전역 이벤트 제거: BookingForm 리렌더링 방지
    // window.dispatchEvent(new CustomEvent('travelDateUpdate', { detail: this.data }));
  }

  updateSegment(segmentId: string, field: keyof Segment, value: string): void {
    const newData = { ...this.data };
    const segmentIndex = newData.segments.findIndex(s => s.id === segmentId);
    if (segmentIndex >= 0) {
      newData.segments[segmentIndex] = {
        ...newData.segments[segmentIndex],
        [field]: value
      };
      this.setData(newData);
    }
  }

  addSegment(): void {
    const newData = {
      ...this.data,
      segments: [...this.data.segments, {
        id: uuidv4(),
        origin: '',
        destination: '',
        departureDate: '',
        departureTime: ''
      }]
    };
    this.setData(newData);
  }

  removeSegment(segmentId: string): void {
    if (this.data.segments.length <= 1) return;
    const newData = {
      ...this.data,
      segments: this.data.segments.filter(s => s.id !== segmentId)
    };
    this.setData(newData);
  }

  setType(type: TravelDates['type']): void {
    const newData = { ...this.data, type };
    this.setData(newData);
  }

  setReturnInfo(field: 'returnDate' | 'returnTime', value: string): void {
    const newData = { ...this.data, [field]: value };
    this.setData(newData);
  }
}

export function getGlobalInstance(): StandaloneTravelDateSelectorClass {
  if (!globalTravelDateInstance) {
    globalTravelDateInstance = new StandaloneTravelDateSelectorClass();
  }
  return globalTravelDateInstance;
}

interface StandaloneTravelDateSelectorProps {
  className?: string;
}

export function StandaloneTravelDateSelector({ className = '' }: StandaloneTravelDateSelectorProps) {
  const instance = getGlobalInstance();
  const [internalValue, setInternalValue] = useState<TravelDates>(instance.getData());
  const containerRef = useRef<HTMLDivElement>(null);
  const focusedFieldRef = useRef<{ segmentId: string; field: string } | null>(null);
  const renderCountRef = useRef(0);
  
  renderCountRef.current++;
  console.log(`🏛️ StandaloneTravelDateSelector 렌더 #${renderCountRef.current}`, { 
    timestamp: Date.now(),
    segments: internalValue.segments.length,
    type: internalValue.type
  });

  // 🎯 전역 인스턴스와 동기화
  useEffect(() => {
    const handleUpdate = (data: TravelDates) => {
      console.log('🔄 StandaloneTravelDateSelector: 전역 데이터 동기화', data);
      setInternalValue(data);
    };

    instance.addListener(handleUpdate);
    return () => {
      instance.removeListener(handleUpdate);
    };
  }, [instance]);

  // 🎯 포커스 핸들러
  const createFocusHandler = useCallback((segmentId: string, field: keyof Segment) => ({
    onFocus: () => {
      console.log(`🎯 Standalone Input 포커스: ${field}`);
      focusedFieldRef.current = { segmentId, field };
    },
    onBlur: () => {
      console.log(`💨 Standalone Input 포커스 잃음: ${field}`);
      setTimeout(() => {
        if (!containerRef.current?.contains(document.activeElement)) {
          focusedFieldRef.current = null;
        }
      }, 10);
    }
  }), []);

  // ⌨️ 입력 핸들러
  const handleInputChange = useCallback((segmentId: string, field: keyof Segment, value: string) => {
    console.log(`⌨️ Standalone Input 변경: ${field} = "${value}"`);
    instance.updateSegment(segmentId, field, value);
  }, [instance]);

  const handleTypeChange = useCallback((type: TravelDates['type']) => {
    instance.setType(type);
  }, [instance]);

  const handleAddSegment = useCallback(() => {
    instance.addSegment();
  }, [instance]);

  const handleRemoveSegment = useCallback((segmentId: string) => {
    instance.removeSegment(segmentId);
  }, [instance]);

  const handleReturnChange = useCallback((field: 'returnDate' | 'returnTime', value: string) => {
    instance.setReturnInfo(field, value);
  }, [instance]);

  return (
    <div ref={containerRef} id="standalone-travel-selector" className={`space-y-6 ${className}`}>
      <div className="p-4 border border-purple-300 bg-purple-50 rounded-lg">
        <h3 className="text-sm font-semibold text-purple-800 mb-2">
          🏛️ 완전 독립적 TravelDateSelector
        </h3>
        <p className="text-xs text-purple-600">
          전역 인스턴스 - 어떤 리렌더링에도 영향받지 않음 (렌더 #{renderCountRef.current})
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
              onClick={handleAddSegment}
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
                  onClick={() => handleRemoveSegment(segment.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">출발지 *</label>
                <Input
                  type="text"
                  placeholder="예) 인천국제공항"
                  value={segment.origin}
                  onChange={(e) => handleInputChange(segment.id, 'origin', e.target.value)}
                  {...createFocusHandler(segment.id, 'origin')}
                  data-field={`origin-${segment.id}`}
                  data-standalone="true"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">도착지 *</label>
                <Input
                  type="text"
                  placeholder="예) 세부국제공항"
                  value={segment.destination}
                  onChange={(e) => handleInputChange(segment.id, 'destination', e.target.value)}
                  {...createFocusHandler(segment.id, 'destination')}
                  data-field={`destination-${segment.id}`}
                  data-standalone="true"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">출발일 *</label>
                <Input
                  type="date"
                  value={segment.departureDate}
                  onChange={(e) => handleInputChange(segment.id, 'departureDate', e.target.value)}
                  {...createFocusHandler(segment.id, 'departureDate')}
                  data-field={`departureDate-${segment.id}`}
                  data-standalone="true"
                />
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* 복귀 정보 (왕복일 경우만) - 출발정보와 함께 한 행에 표시 */}
      {internalValue.type === 'ROUND_TRIP' && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            복귀 정보
          </h4>
          <div className="p-4 border border-green-200 rounded-lg bg-green-50/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-green-700 font-medium mb-1">복귀일 *</label>
                <Input
                  type="date"
                  value={internalValue.returnDate || ''}
                  onChange={(e) => handleReturnChange('returnDate', e.target.value)}
                  className="border-green-300 focus:border-green-500 focus:ring-green-200"
                  data-standalone="true"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
