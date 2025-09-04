"use client";

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, MapPin } from 'lucide-react';

interface LandInfoFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  className?: string;
}

export function LandInfoForm({ form, className = '' }: LandInfoFormProps) {
  const { register, watch, setValue, formState: { errors } } = form;
  
  const itinerary = (watch('landInfo.itinerary') || [{ day: 1, title: '', description: '', meals: [], accommodation: '' }]) as Array<Record<string, unknown>>;
  const inclusions = (watch('landInfo.inclusions') || ['']) as string[];
  const exclusions = (watch('landInfo.exclusions') || ['']) as string[];

  const addItineraryDay = () => {
    const currentItinerary = (watch('landInfo.itinerary') || []) as Array<Record<string, unknown>>;
    const newDay = currentItinerary.length + 1;
    setValue('landInfo.itinerary', [
      ...currentItinerary,
      {
        day: newDay,
        title: '',
        description: '',
        meals: [],
        accommodation: ''
      }
    ]);
  };

  const removeItineraryDay = (index: number) => {
    const currentItinerary = (watch('landInfo.itinerary') || []) as Array<Record<string, unknown>>;
    if (currentItinerary.length > 1) {
      const updatedItinerary = currentItinerary
        .filter((_: unknown, i: number) => i !== index)
        .map((item: unknown, i: number) => ({ ...(item as Record<string, unknown>), day: i + 1 })); // 일차 재정렬
      setValue('landInfo.itinerary', updatedItinerary);
    }
  };

  const addInclusion = () => {
    const currentInclusions = (watch('landInfo.inclusions') || []) as string[];
    setValue('landInfo.inclusions', [...currentInclusions, '']);
  };

  const removeInclusion = (index: number) => {
    const currentInclusions = (watch('landInfo.inclusions') || []) as string[];
    if (currentInclusions.length > 1) {
      setValue('landInfo.inclusions', currentInclusions.filter((_: unknown, i: number) => i !== index));
    }
  };

  const addExclusion = () => {
    const currentExclusions = (watch('landInfo.exclusions') || []) as string[];
    setValue('landInfo.exclusions', [...currentExclusions, '']);
  };

  const removeExclusion = (index: number) => {
    const currentExclusions = (watch('landInfo.exclusions') || []) as string[];
    if (currentExclusions.length > 1) {
      setValue('landInfo.exclusions', currentExclusions.filter((_: unknown, i: number) => i !== index));
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 목적지 정보 */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 flex items-center">
          <MapPin className="h-4 w-4 mr-2" />
          목적지 정보
        </h4>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">주요 목적지 <span className="text-red-500">*</span></label>
            <Input
              type="text"
              placeholder="예) 세부, 보홀, 보라카이"
              {...register('landInfo.destination', { required: '목적지를 입력해주세요' })}
            />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(errors as any)?.landInfo?.destination && (
              <p className="text-xs text-red-600 mt-1">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(errors as any).landInfo.destination.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">현지 파트너 <span className="text-red-500">*</span></label>
            <Input
              type="text"
              placeholder="예) ABC Travel Agency"
              {...register('landInfo.partner', { required: '현지 파트너를 입력해주세요' })}
            />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(errors as any)?.landInfo?.partner && (
              <p className="text-xs text-red-600 mt-1">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(errors as any).landInfo.partner.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">파트너 연락처</label>
            <Input
              type="text"
              placeholder="예) +63 32 123-4567"
              {...register('landInfo.partnerContact')}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">파트너 이메일</label>
            <Input
              type="email"
              placeholder="예) partner@abctravel.com"
              {...register('landInfo.partnerEmail')}
            />
          </div>
        </div>
      </div>

      {/* 일정 정보 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">여행 일정</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItineraryDay}
            className="flex items-center text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            일차 추가
          </Button>
        </div>

        {itinerary.map((_: unknown, index: number) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">{index + 1}일차</span>
              {itinerary.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItineraryDay(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">일정 제목</label>
              <Input
                type="text"
                placeholder="예) 세부 시티투어"
                {...register(`landInfo.itinerary.${index}.title`)}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">상세 내용</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-y min-h-[80px]"
                placeholder="세부 일정을 입력해주세요"
                {...register(`landInfo.itinerary.${index}.description`)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">식사</label>
                <Input
                  type="text"
                  placeholder="예) 조식, 중식, 석식 (쉼표로 구분)"
                  {...register(`landInfo.itinerary.${index}.mealsInput`)}
                  onChange={(e) => {
                    const mealsArray = e.target.value.split(',').map(meal => meal.trim()).filter(Boolean);
                    setValue(`landInfo.itinerary.${index}.meals`, mealsArray);
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">숙박</label>
                <Input
                  type="text"
                  placeholder="예) 마르코폴로 호텔"
                  {...register(`landInfo.itinerary.${index}.accommodation`)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 포함사항 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">포함사항</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addInclusion}
            className="flex items-center text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            항목 추가
          </Button>
        </div>

        {inclusions.map((_: unknown, index: number) => (
          <div key={index} className="flex items-center space-x-2">
            <Input
              type="text"
              placeholder="포함사항을 입력해주세요"
              {...register(`landInfo.inclusions.${index}`)}
            />
            {inclusions.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeInclusion(index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* 불포함사항 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">불포함사항</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addExclusion}
            className="flex items-center text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            항목 추가
          </Button>
        </div>

        {exclusions.map((_: unknown, index: number) => (
          <div key={index} className="flex items-center space-x-2">
            <Input
              type="text"
              placeholder="불포함사항을 입력해주세요"
              {...register(`landInfo.exclusions.${index}`)}
            />
            {exclusions.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeExclusion(index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* 개발 모드 디버깅 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 rounded-lg p-4 text-xs">
          <div className="mb-2">
            <strong>랜드 정보 상태:</strong>
          </div>
          <div>일정 수: {itinerary?.length || 0}일</div>
          <div>포함사항: {inclusions?.filter(Boolean).length || 0}개</div>
          <div>불포함사항: {exclusions?.filter(Boolean).length || 0}개</div>
        </div>
      )}
    </div>
  );
}