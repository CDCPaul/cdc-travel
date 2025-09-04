"use client";

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Settings, DollarSign } from 'lucide-react';

interface CustomRequirementsFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  className?: string;
}

export function CustomRequirementsForm({ form, className = '' }: CustomRequirementsFormProps) {
  const { register, watch, setValue } = form;
  
  const specialRequests = (watch('customRequirements.specialRequests') || ['']) as string[];
  const budgetRange = watch('customRequirements.budgetRange') as { min?: number; max?: number; currency?: string } | undefined;

  const addSpecialRequest = () => {
    const current = (watch('customRequirements.specialRequests') || []) as string[];
    setValue('customRequirements.specialRequests', [...current, ''] as never);
  };

  const removeSpecialRequest = (index: number) => {
    const current = (watch('customRequirements.specialRequests') || []) as string[];
    if (current.length > 1) {
      setValue('customRequirements.specialRequests', current.filter((_, i) => i !== index) as never);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 포함 서비스 선택 */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 flex items-center">
          <Settings className="h-4 w-4 mr-2" />
          포함 서비스 선택
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register('customRequirements.includeFlights')}
              className="rounded"
            />
            <span className="text-sm text-gray-700">항공편 포함</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register('customRequirements.includeAccommodation')}
              className="rounded"
            />
            <span className="text-sm text-gray-700">숙박 포함</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register('customRequirements.includeMeals')}
              className="rounded"
            />
            <span className="text-sm text-gray-700">식사 포함</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register('customRequirements.includeTransportation')}
              className="rounded"
            />
            <span className="text-sm text-gray-700">교통편 포함</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register('customRequirements.includeGuide')}
              className="rounded"
            />
            <span className="text-sm text-gray-700">가이드 서비스</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register('customRequirements.includeShopping')}
              className="rounded"
            />
            <span className="text-sm text-gray-700">쇼핑 투어</span>
          </label>
        </div>
      </div>

      {/* 예산 범위 */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 flex items-center">
          <DollarSign className="h-4 w-4 mr-2" />
          예산 범위 (선택사항)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">최소 예산</label>
            <Input
              type="number"
              min="0"
              step="10000"
              placeholder="0"
              {...register('customRequirements.budgetRange.min', { 
                valueAsNumber: true,
                min: { value: 0, message: '0 이상이어야 합니다.' }
              })}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">최대 예산</label>
            <Input
              type="number"
              min="0"
              step="10000"
              placeholder="0"
              {...register('customRequirements.budgetRange.max', { 
                valueAsNumber: true,
                min: { value: 0, message: '0 이상이어야 합니다.' }
              })}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">통화</label>
            <select 
              {...register('customRequirements.budgetRange.currency')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="KRW">KRW (원)</option>
              <option value="USD">USD (달러)</option>
              <option value="PHP">PHP (페소)</option>
            </select>
          </div>
        </div>

        {budgetRange?.min && budgetRange?.max && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              예산 범위: {budgetRange.min?.toLocaleString()} ~ {budgetRange.max?.toLocaleString()} {budgetRange.currency}
            </p>
          </div>
        )}
      </div>

      {/* 특별 요청사항 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">특별 요청사항</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSpecialRequest}
          >
            <Plus className="h-4 w-4 mr-1" />
            요청 추가
          </Button>
        </div>

        {specialRequests.map((_, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Input
              type="text"
              placeholder="예) 채식주의자용 식사 준비, 휠체어 이용 고객 배려"
              {...register(`customRequirements.specialRequests.${index}`)}
              className="flex-1"
            />
            {specialRequests.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSpecialRequest(index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* 추가 설명 */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700">추가 설명</h4>
        
        <div>
          <label className="block text-xs text-gray-600 mb-1">
            상세 요구사항 및 참고사항
          </label>
          <textarea
            {...register('customRequirements.additionalNotes')}
            placeholder="고객의 구체적인 요구사항이나 참고할 사항들을 자세히 입력해주세요..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            rows={4}
          />
        </div>
      </div>

      {/* 맞춤 서비스 요약 */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h5 className="text-sm font-medium text-gray-700 mb-2">선택된 서비스 요약</h5>
        <div className="text-xs text-gray-600 space-y-1">
          {watch('customRequirements.includeFlights') && <div>✅ 항공편 포함</div>}
          {watch('customRequirements.includeAccommodation') && <div>✅ 숙박 포함</div>}
          {watch('customRequirements.includeMeals') && <div>✅ 식사 포함</div>}
          {watch('customRequirements.includeTransportation') && <div>✅ 교통편 포함</div>}
          {watch('customRequirements.includeGuide') && <div>✅ 가이드 서비스</div>}
          {watch('customRequirements.includeShopping') && <div>✅ 쇼핑 투어</div>}
          {!Object.values(watch('customRequirements') || {}).some(Boolean) && (
            <div className="text-gray-400">선택된 서비스가 없습니다</div>
          )}
        </div>
      </div>

      {/* 개발용 정보 표시 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 rounded-lg p-4 text-xs">
          <div className="mb-2">
            <strong>맞춤 요구사항 상태:</strong>
          </div>
          <div>포함 서비스 수: {
            Object.entries(watch('customRequirements') || {})
              .filter(([key, value]) => key.startsWith('include') && value)
              .length
          }</div>
          <div>특별 요청: {specialRequests?.filter(Boolean).length || 0}개</div>
          <div>예산 설정: {budgetRange?.min && budgetRange?.max ? '설정됨' : '미설정'}</div>
        </div>
      )}
    </div>
  );
}
