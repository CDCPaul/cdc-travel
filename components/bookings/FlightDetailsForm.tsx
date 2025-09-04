"use client";

import React, { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Plane } from 'lucide-react';
import { ProjectType } from '@/types/booking';

interface FlightDetailsFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  projectType: ProjectType;
  travelData?: {
    segments: Array<{ origin: string; destination: string; departureDate: string; }>;
    type: 'ONE_WAY' | 'ROUND_TRIP' | 'MULTI_CITY';
    returnDate?: string;
  };
  className?: string;
}

export function FlightDetailsForm({ form, projectType, travelData, className = '' }: FlightDetailsFormProps) {
  const { register, watch, setValue, formState: { errors } } = form;
  
  // AIR_ONLY가 아니면 항공편 정보는 선택사항
  const isFlightRequired = projectType === 'AIR_ONLY';
  
  const flightType = watch('flightDetails.flightType') || 'ROUND_TRIP';
  const departureFlights = (watch('flightDetails.departureFlights') || [{}]) as Array<Record<string, unknown>>;
  const returnFlights = (watch('flightDetails.returnFlights') || [{}]) as Array<Record<string, unknown>>;

  // 이전 탭 데이터 자동 채우기
  useEffect(() => {
    if (travelData) {
      // 경로 자동 설정
      if (travelData.segments.length > 0) {
        const route = `${travelData.segments[0].origin}-${travelData.segments[0].destination}`;
        setValue('flightDetails.route', route);
      }
      
      // 출발일 자동 설정
      if (travelData.segments[0]?.departureDate) {
        setValue('flightDetails.departureDate', travelData.segments[0].departureDate);
      }
      
      // 항공편 타입 자동 설정
      setValue('flightDetails.flightType', travelData.type === 'ONE_WAY' ? 'ONE_WAY' : 'ROUND_TRIP');
      
      // 복귀일 자동 설정 (왕복인 경우)
      if (travelData.type === 'ROUND_TRIP' && travelData.returnDate) {
        setValue('flightDetails.returnDate', travelData.returnDate);
      }
    }
  }, [travelData, setValue]);

  // 출발편 추가
  const addDepartureFlight = () => {
    const currentFlights = (watch('flightDetails.departureFlights') || []) as Array<Record<string, unknown>>;
    setValue('flightDetails.departureFlights', [
      ...currentFlights,
      {
        airline: '',
        flightNumber: '',
        departureTime: '',
        arrivalTime: '',
      }
    ]);
  };

  // 출발편 제거
  const removeDepartureFlight = (index: number) => {
    const currentFlights = (watch('flightDetails.departureFlights') || []) as Array<Record<string, unknown>>;
    if (currentFlights.length > 1) {
      setValue('flightDetails.departureFlights', currentFlights.filter((_: unknown, i: number) => i !== index));
    }
  };

  // 복귀편 추가
  const addReturnFlight = () => {
    const currentFlights = (watch('flightDetails.returnFlights') || []) as Array<Record<string, unknown>>;
    setValue('flightDetails.returnFlights', [
      ...currentFlights,
      {
        airline: '',
        flightNumber: '',
        departureTime: '',
        arrivalTime: '',
      }
    ]);
  };

  // 복귀편 제거
  const removeReturnFlight = (index: number) => {
    const currentFlights = (watch('flightDetails.returnFlights') || []) as Array<Record<string, unknown>>;
    if (currentFlights.length > 1) {
      setValue('flightDetails.returnFlights', currentFlights.filter((_: unknown, i: number) => i !== index));
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 기본 항공편 정보 */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 flex items-center">
          <Plane className="h-4 w-4 mr-2" />
          기본 항공편 정보 {isFlightRequired && <span className="text-red-500 ml-1">*</span>}
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              경로 {isFlightRequired && <span className="text-red-500">*</span>}
            </label>
            <Input
              type="text"
              placeholder="예) CEB-ICN"
              {...register('flightDetails.route', { 
                required: isFlightRequired ? '경로를 입력해주세요' : false 
              })}
            />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(errors as any)?.flightDetails?.route && (
              <p className="text-xs text-red-600 mt-1">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(errors as any).flightDetails.route.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">
              출발일 {isFlightRequired && <span className="text-red-500">*</span>}
            </label>
            <Input
              type="date"
              {...register('flightDetails.departureDate', { 
                required: isFlightRequired ? '출발일을 선택해주세요' : false 
              })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">항공편 타입</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              {...register('flightDetails.flightType')}
              onChange={(e) => {
                setValue('flightDetails.flightType', e.target.value);
                if (e.target.value === 'ONE_WAY') {
                  setValue('flightDetails.returnDate', '');
                }
              }}
            >
              <option value="ONE_WAY">편도</option>
              <option value="ROUND_TRIP">왕복</option>
            </select>
          </div>

          {flightType === 'ROUND_TRIP' && (
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                복귀일 {isFlightRequired && <span className="text-red-500">*</span>}
              </label>
              <Input
                type="date"
                {...register('flightDetails.returnDate', { 
                  required: isFlightRequired && flightType === 'ROUND_TRIP' ? '복귀일을 선택해주세요' : false 
                })}
              />
            </div>
          )}
        </div>
      </div>

      {/* 세부 출발편 정보 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">출발편 상세</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addDepartureFlight}
            className="flex items-center text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            편 추가
          </Button>
        </div>

        {departureFlights.map((_: unknown, index: number) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">출발편 #{index + 1}</span>
              {departureFlights.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDepartureFlight(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">항공사</label>
                <Input
                  type="text"
                  placeholder="예) 세부퍼시픽"
                  {...register(`flightDetails.departureFlights.${index}.airline`)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">편명</label>
                <Input
                  type="text"
                  placeholder="예) 5J815"
                  {...register(`flightDetails.departureFlights.${index}.flightNumber`)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">출발시간</label>
                <Input
                  type="time"
                  {...register(`flightDetails.departureFlights.${index}.departureTime`)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">도착시간</label>
                <Input
                  type="time"
                  {...register(`flightDetails.departureFlights.${index}.arrivalTime`)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 세부 복귀편 정보 (왕복인 경우만) */}
      {flightType === 'ROUND_TRIP' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">복귀편 상세</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addReturnFlight}
              className="flex items-center text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              편 추가
            </Button>
          </div>

          {returnFlights.map((_: unknown, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">복귀편 #{index + 1}</span>
                {returnFlights.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeReturnFlight(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">항공사</label>
                  <Input
                    type="text"
                    placeholder="예) 세부퍼시픽"
                    {...register(`flightDetails.returnFlights.${index}.airline`)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">편명</label>
                  <Input
                    type="text"
                    placeholder="예) 5J816"
                    {...register(`flightDetails.returnFlights.${index}.flightNumber`)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">출발시간</label>
                  <Input
                    type="time"
                    {...register(`flightDetails.returnFlights.${index}.departureTime`)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">도착시간</label>
                  <Input
                    type="time"
                    {...register(`flightDetails.returnFlights.${index}.arrivalTime`)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 개발 모드 디버깅 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 rounded-lg p-4 text-xs">
          <div className="mb-2">
            <strong>항공편 정보 상태:</strong>
          </div>
          <div>항공편 타입: {String(flightType)}</div>
          <div>출발편: {departureFlights?.length || 0}개</div>
          <div>복귀편: {returnFlights?.length || 0}개</div>
          <div>필수 여부: {isFlightRequired ? '필수' : '선택'}</div>
        </div>
      )}
    </div>
  );
}