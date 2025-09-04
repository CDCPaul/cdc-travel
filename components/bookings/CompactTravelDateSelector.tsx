"use client";

import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, Trash2, ArrowRight } from 'lucide-react';

// 여행 타입
export type TravelType = 'ONE_WAY' | 'ROUND_TRIP' | 'MULTI_CITY';

// 구간 정보
export interface TravelSegment {
  id: string;
  origin: string;
  destination: string;
  departureDate: string;
}

// 여행 일정 데이터
export interface TravelDateData {
  type: TravelType;
  segments: TravelSegment[];
  returnDate?: string;
}

// 전역 인스턴스를 위한 클래스
class CompactTravelDateSelectorClass {
  private data: TravelDateData = {
    type: 'ROUND_TRIP',
    segments: [{
      id: '1',
      origin: '',
      destination: '',
      departureDate: ''
    }],
    returnDate: ''
  };

  private listeners: (() => void)[] = [];

  getData(): TravelDateData {
    return { ...this.data };
  }

  setData(newData: Partial<TravelDateData>): void {
    this.data = { ...this.data, ...newData };
    this.notifyListeners();
  }

  updateSegment(segmentId: string, updates: Partial<TravelSegment>): void {
    this.data.segments = this.data.segments.map(segment =>
      segment.id === segmentId ? { ...segment, ...updates } : segment
    );
    this.notifyListeners();
  }

  addSegment(): void {
    const newSegment: TravelSegment = {
      id: Date.now().toString(),
      origin: '',
      destination: '',
      departureDate: ''
    };
    this.data.segments.push(newSegment);
    this.notifyListeners();
  }

  removeSegment(segmentId: string): void {
    if (this.data.segments.length > 1) {
      this.data.segments = this.data.segments.filter(s => s.id !== segmentId);
      this.notifyListeners();
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  addListener(listener: () => void): void {
    this.listeners.push(listener);
  }

  removeListener(listener: () => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }
}

// 전역 인스턴스
let globalCompactInstance: CompactTravelDateSelectorClass | null = null;

export function getCompactGlobalInstance(): CompactTravelDateSelectorClass {
  if (!globalCompactInstance) {
    globalCompactInstance = new CompactTravelDateSelectorClass();
  }
  return globalCompactInstance;
}

interface CompactTravelDateSelectorProps {
  className?: string;
}

export function CompactTravelDateSelector({ className = '' }: CompactTravelDateSelectorProps) {
  const instance = getCompactGlobalInstance();
  const [, forceUpdate] = useState({});

  // 강제 리렌더링 함수
  const triggerRerender = useCallback(() => {
    forceUpdate({});
  }, []);

  // 컴포넌트 마운트/언마운트 시 리스너 등록/해제
  React.useEffect(() => {
    instance.addListener(triggerRerender);
    return () => {
      instance.removeListener(triggerRerender);
    };
  }, [instance, triggerRerender]);

  const data = instance.getData();

  const handleTypeChange = (type: TravelType) => {
    instance.setData({ 
      type,
      returnDate: type === 'ROUND_TRIP' ? data.returnDate || '' : undefined
    });
  };

  const handleSegmentChange = (segmentId: string, field: keyof TravelSegment, value: string) => {
    instance.updateSegment(segmentId, { [field]: value });
  };

  const handleReturnDateChange = (date: string) => {
    instance.setData({ returnDate: date });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* 여행 타입 선택 */}
      <div className="flex items-center space-x-1 p-1 bg-gray-100 rounded-xl w-fit">
        {[
          { type: 'ONE_WAY' as TravelType, label: '편도' },
          { type: 'ROUND_TRIP' as TravelType, label: '왕복' },
          { type: 'MULTI_CITY' as TravelType, label: '다구간' }
        ].map(({ type, label }) => (
          <button
            key={type}
            type="button"
            onClick={() => handleTypeChange(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              data.type === type
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 메인 여행 정보 - 한 행 레이아웃 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
        
        {/* 출발 구간들 */}
        {data.segments.map((segment, index) => (
          <div key={segment.id} className="mb-4 last:mb-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-semibold text-blue-800">
                  {data.type === 'MULTI_CITY' ? `구간 ${index + 1}` : '출발 구간'}
                </span>
              </div>
              {data.type === 'MULTI_CITY' && data.segments.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => instance.removeSegment(segment.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* 한 행 레이아웃 - 출발지, 화살표, 도착지, 날짜 */}
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-blue-700 mb-2">출발지</label>
                <Input
                  type="text"
                  placeholder="예) 인천국제공항"
                  value={segment.origin}
                  onChange={(e) => handleSegmentChange(segment.id, 'origin', e.target.value)}
                  className="border-blue-300 focus:border-blue-500 focus:ring-blue-200 bg-white"
                />
              </div>

              <div className="flex items-center justify-center pt-6">
                <ArrowRight className="h-5 w-5 text-blue-500" />
              </div>

              <div className="flex-1">
                <label className="block text-xs font-medium text-blue-700 mb-2">도착지</label>
                <Input
                  type="text"
                  placeholder="예) 세부국제공항"
                  value={segment.destination}
                  onChange={(e) => handleSegmentChange(segment.id, 'destination', e.target.value)}
                  className="border-blue-300 focus:border-blue-500 focus:ring-blue-200 bg-white"
                />
              </div>

              <div className="w-40">
                <label className="block text-xs font-medium text-blue-700 mb-2">출발일</label>
                <Input
                  type="date"
                  value={segment.departureDate}
                  onChange={(e) => handleSegmentChange(segment.id, 'departureDate', e.target.value)}
                  className="border-blue-300 focus:border-blue-500 focus:ring-blue-200 bg-white"
                />
              </div>
            </div>
          </div>
        ))}

        {/* 왕복일 경우 복귀 정보를 바로 아래에 */}
        {data.type === 'ROUND_TRIP' && (
          <div className="mt-6 pt-6 border-t border-blue-200">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-semibold text-green-800">복귀 구간</span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-green-700 mb-2">출발지</label>
                <div className="h-10 bg-green-100 rounded-md flex items-center px-3 text-sm text-green-700">
                  {data.segments[0]?.destination || '도착지 입력 필요'}
                </div>
              </div>

              <div className="flex items-center justify-center pt-6">
                <ArrowRight className="h-5 w-5 text-green-500" />
              </div>

              <div className="flex-1">
                <label className="block text-xs font-medium text-green-700 mb-2">도착지</label>
                <div className="h-10 bg-green-100 rounded-md flex items-center px-3 text-sm text-green-700">
                  {data.segments[0]?.origin || '출발지 입력 필요'}
                </div>
              </div>

              <div className="w-40">
                <label className="block text-xs font-medium text-green-700 mb-2">복귀일</label>
                <Input
                  type="date"
                  value={data.returnDate || ''}
                  onChange={(e) => handleReturnDateChange(e.target.value)}
                  className="border-green-300 focus:border-green-500 focus:ring-green-200 bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* 다구간 추가 버튼 */}
        {data.type === 'MULTI_CITY' && (
          <div className="mt-6 pt-4 border-t border-blue-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => instance.addSegment()}
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              구간 추가
            </Button>
          </div>
        )}
      </div>

      {/* 요약 정보 */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <Calendar className="h-5 w-5 text-gray-500" />
          <div>
            <div className="text-sm font-medium text-gray-800">
              {data.type === 'ONE_WAY' && '편도 여행'}
              {data.type === 'ROUND_TRIP' && '왕복 여행'}
              {data.type === 'MULTI_CITY' && `다구간 여행 (${data.segments.length}개 구간)`}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {data.segments[0]?.origin && data.segments[0]?.destination && (
                <>
                  {data.segments[0].origin} → {data.segments[0].destination}
                  {data.type === 'ROUND_TRIP' && ` → ${data.segments[0].origin}`}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
