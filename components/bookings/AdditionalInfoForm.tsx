"use client";

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Calendar, CreditCard, FileText, Tag } from 'lucide-react';

interface AdditionalInfoFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  className?: string;
}

export function AdditionalInfoForm({ form, className = '' }: AdditionalInfoFormProps) {
  const { register, watch, setValue } = form;
  
  const priority = watch('priority') || 'MEDIUM';
  const tags = watch('tags') || [];

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tagString = e.target.value;
    const tagArray = tagString.split(',').map(tag => tag.trim()).filter(tag => tag);
    setValue('tags', tagArray);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 우선순위 및 태그 */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 flex items-center">
          <Tag className="h-4 w-4 mr-2" />
          분류 및 우선순위
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">우선순위</label>
            <select 
              {...register('priority')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="LOW">낮음</option>
              <option value="MEDIUM">보통</option>
              <option value="HIGH">높음</option>
              <option value="URGENT">긴급</option>
            </select>
            
            <div className="mt-1 text-xs">
              {priority === 'LOW' && <span className="text-gray-600">⚪ 낮은 우선순위</span>}
              {priority === 'MEDIUM' && <span className="text-blue-600">🔵 보통 우선순위</span>}
              {priority === 'HIGH' && <span className="text-orange-600">🟠 높은 우선순위</span>}
              {priority === 'URGENT' && <span className="text-red-600">🔴 긴급 처리</span>}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">태그 (쉼표로 구분)</label>
            <Input
              type="text"
              placeholder="예) VIP고객, 단체, 리피터"
              defaultValue={Array.isArray(tags) ? tags.join(', ') : ''}
              onChange={handleTagsChange}
            />
            <div className="mt-1 text-xs text-gray-500">
              {Array.isArray(tags) && tags.length > 0 ? `${tags.length}개 태그: ${tags.join(', ')}` : '태그 없음'}
            </div>
          </div>
        </div>
      </div>

      {/* 중요 일정/데드라인 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700 flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            중요 일정 및 데드라인 (선택사항)
          </h4>
          <div className="text-xs text-gray-500">
            처음 예약 시에는 빈 값으로 저장 후 나중에 수정 가능
          </div>
        </div>

        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            💡 <strong>안내:</strong> 그룹 발권의 경우 항공사 확정 후 입력하시면 됩니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">확정 마감일</label>
            <Input
              type="date"
              {...register('deadlines.confirmation')}
            />
            <p className="text-xs text-gray-500 mt-1">고객 확정 답변 마감일</p>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">예약금 마감일</label>
            <Input
              type="date"
              {...register('deadlines.deposit')}
            />
            <p className="text-xs text-gray-500 mt-1">예약금 입금 마감일</p>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">잔금 마감일</label>
            <Input
              type="date"
              {...register('deadlines.finalPayment')}
            />
            <p className="text-xs text-gray-500 mt-1">잔금 입금 마감일</p>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">출발일</label>
            <Input
              type="date"
              {...register('deadlines.departure')}
            />
            <p className="text-xs text-gray-500 mt-1">실제 출발 예정일</p>
          </div>
        </div>
      </div>

      {/* 결제 정보 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700 flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            결제 정보 (선택사항)
          </h4>
          <div className="text-xs text-gray-500">
            항공사 요금 확정 후 입력
          </div>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>안내:</strong> 그룹 발권의 경우 항공사에서 운임을 받아본 후 요금을 책정합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">총 금액</label>
            <Input
              type="number"
              min="0"
              step="1000"
              placeholder="0"
              {...register('paymentInfo.totalAmount', { 
                valueAsNumber: true,
                min: { value: 0, message: '0 이상이어야 합니다.' }
              })}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">통화</label>
            <select 
              {...register('paymentInfo.currency')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="KRW">KRW (원)</option>
              <option value="USD">USD (달러)</option>
              <option value="PHP">PHP (페소)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">예약금</label>
            <Input
              type="number"
              min="0"
              step="1000"
              placeholder="0"
              {...register('paymentInfo.depositAmount', { 
                valueAsNumber: true,
                min: { value: 0, message: '0 이상이어야 합니다.' }
              })}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs text-gray-600 mb-1">결제 방법</label>
            <select 
              {...register('paymentInfo.paymentMethod')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">선택하세요</option>
              <option value="KRW_ACCOUNT">원화계좌</option>
              <option value="PHP_ACCOUNT">페소계좌</option>
              <option value="USD_ACCOUNT">달러계좌</option>
              <option value="GCASH">Gcash</option>
              <option value="CASH">현금</option>
              <option value="CREDIT_CARD">신용카드</option>
              <option value="OTHER">기타</option>
            </select>
          </div>

          <div className="flex items-center space-x-4 pt-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('paymentInfo.depositReceived')}
                className="rounded"
              />
              <span className="text-sm text-gray-700">예약금 수령</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('paymentInfo.finalPaymentReceived')}
                className="rounded"
              />
              <span className="text-sm text-gray-700">잔금 수령</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">결제 관련 메모</label>
          <textarea
            {...register('paymentInfo.paymentNotes')}
            placeholder="결제와 관련된 특이사항이나 메모를 입력하세요..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            rows={2}
          />
        </div>
      </div>

      {/* 메모 및 참고사항 */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          메모 및 참고사항
        </h4>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">고객용 메모</label>
            <textarea
              {...register('notes')}
              placeholder="고객과 공유 가능한 메모사항을 입력하세요..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">고객이 볼 수 있는 공개 메모</p>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">내부 전용 메모</label>
            <textarea
              {...register('internalNotes')}
              placeholder="내부 팀원들만 볼 수 있는 메모사항을 입력하세요..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">내부 전용, 고객에게 노출되지 않음</p>
          </div>
        </div>
      </div>

      {/* 결제 상태 요약 */}
      {(watch('paymentInfo.totalAmount') > 0 || watch('paymentInfo.depositAmount') > 0) && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h5 className="text-sm font-medium text-green-800 mb-2 flex items-center">
            <CreditCard className="h-4 w-4 mr-1" />
            결제 정보 요약
          </h5>
          <div className="text-xs text-green-700 space-y-1">
            <div>총 금액: {Number(watch('paymentInfo.totalAmount') || 0).toLocaleString()} {watch('paymentInfo.currency') || 'KRW'}</div>
            {watch('paymentInfo.depositAmount') > 0 && (
              <div>예약금: {Number(watch('paymentInfo.depositAmount') || 0).toLocaleString()} {watch('paymentInfo.currency') || 'KRW'}</div>
            )}
            {watch('paymentInfo.totalAmount') > 0 && watch('paymentInfo.depositAmount') > 0 && (
              <div>잔금: {(Number(watch('paymentInfo.totalAmount') || 0) - Number(watch('paymentInfo.depositAmount') || 0)).toLocaleString()} {watch('paymentInfo.currency') || 'KRW'}</div>
            )}
            <div>결제 상태: 
              {watch('paymentInfo.depositReceived') && watch('paymentInfo.finalPaymentReceived') && ' ✅ 완납'}
              {watch('paymentInfo.depositReceived') && !watch('paymentInfo.finalPaymentReceived') && ' 🟡 예약금만 수령'}
              {!watch('paymentInfo.depositReceived') && !watch('paymentInfo.finalPaymentReceived') && ' ⏳ 미수령'}
            </div>
          </div>
        </div>
      )}

      {/* 개발용 정보 표시 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 rounded-lg p-4 text-xs">
          <div className="mb-2">
            <strong>추가 정보 상태:</strong>
          </div>
          <div>우선순위: {String(priority || 'MEDIUM')}</div>
          <div>태그: {Array.isArray(tags) ? tags.length : 0}개</div>
          <div>데드라인 설정: {
            [watch('deadlines.confirmation'), watch('deadlines.deposit'), watch('deadlines.finalPayment')]
              .filter(Boolean).length
          }/3개</div>
          <div>결제 정보: {watch('paymentInfo.totalAmount') > 0 ? '설정됨' : '미설정'}</div>
        </div>
      )}
    </div>
  );
}
