"use client";

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Package, Users, Star } from 'lucide-react';

interface PackageInfoFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  className?: string;
}

export function PackageInfoForm({ form, className = '' }: PackageInfoFormProps) {
  const { register, watch, formState: { errors } } = form;
  
  const packageType = watch('packageInfo.packageType') || 'STANDARD';
  const isPublished = watch('packageInfo.isPublished') || false;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 패키지 기본 정보 */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 flex items-center">
          <Package className="h-4 w-4 mr-2" />
          패키지 기본 정보
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">패키지 ID *</label>
            <Input
              type="text"
              placeholder="예) PKG-CEB-001"
              {...register('packageInfo.packageId')}
              required
            />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(errors as any)?.packageInfo?.packageId && (
              <p className="text-xs text-red-600 mt-1">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(errors as any).packageInfo.packageId.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">패키지명 *</label>
            <Input
              type="text"
              placeholder="예) 세부 3박4일 패키지"
              {...register('packageInfo.packageName')}
              required
            />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(errors as any)?.packageInfo?.packageName && (
              <p className="text-xs text-red-600 mt-1">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(errors as any).packageInfo.packageName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">패키지 타입</label>
            <select 
              {...register('packageInfo.packageType')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="STANDARD">스탠다드</option>
              <option value="PREMIUM">프리미엄</option>
              <option value="CUSTOM">맞춤형</option>
            </select>
          </div>

          <div className="flex items-center space-x-4 pt-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('packageInfo.isPublished')}
                className="rounded"
              />
              <span className="text-sm text-gray-700">출시된 상품</span>
            </label>
            {isPublished && (
              <div className="flex items-center text-green-600">
                <Star className="h-4 w-4 mr-1" />
                <span className="text-xs">마케팅 가능</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 인원 제한 */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 flex items-center">
          <Users className="h-4 w-4 mr-2" />
          인원 제한
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">최소 인원 *</label>
            <Input
              type="number"
              min="1"
              placeholder="1"
              {...register('packageInfo.minimumPax', { 
                valueAsNumber: true,
                min: { value: 1, message: '최소 1명 이상이어야 합니다.' }
              })}
              required
            />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(errors as any)?.packageInfo?.minimumPax && (
              <p className="text-xs text-red-600 mt-1">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(errors as any).packageInfo.minimumPax.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">최대 인원 *</label>
            <Input
              type="number"
              min="1"
              placeholder="50"
              {...register('packageInfo.maximumPax', { 
                valueAsNumber: true,
                min: { value: 1, message: '최소 1명 이상이어야 합니다.' }
              })}
              required
            />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(errors as any)?.packageInfo?.maximumPax && (
              <p className="text-xs text-red-600 mt-1">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(errors as any).packageInfo.maximumPax.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 마케팅 자료 */}
      {isPublished && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">마케팅 자료</h4>
          
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              마케팅 자료 URL (선택사항)
            </label>
            <div className="space-y-2">
              <Input
                type="url"
                placeholder="https://example.com/brochure.pdf"
                {...register('packageInfo.marketingMaterials.0')}
              />
              <Input
                type="url"
                placeholder="https://example.com/images.zip"
                {...register('packageInfo.marketingMaterials.1')}
              />
              <Input
                type="url"
                placeholder="https://example.com/video.mp4"
                {...register('packageInfo.marketingMaterials.2')}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              브로셔, 이미지, 영상 등의 마케팅 자료 URL을 입력하세요
            </p>
          </div>
        </div>
      )}

      {/* 패키지 설명 */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700">패키지 설명</h4>
        
        <div>
          <label className="block text-xs text-gray-600 mb-1">패키지 상세 설명</label>
          <textarea
            {...register('packageInfo.description')}
            placeholder="패키지의 상세한 설명을 입력해주세요..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            rows={4}
          />
        </div>
      </div>

      {/* 개발용 정보 표시 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 rounded-lg p-4 text-xs">
          <div className="mb-2">
            <strong>패키지 정보 상태:</strong>
          </div>
          <div>패키지 타입: {packageType}</div>
          <div>출시 여부: {isPublished ? '출시됨' : '미출시'}</div>
          <div>최소/최대 인원: {watch('packageInfo.minimumPax') || 0} ~ {watch('packageInfo.maximumPax') || 0}</div>
        </div>
      )}
    </div>
  );
}
