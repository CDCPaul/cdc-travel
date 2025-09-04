"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TeamBadge } from './StatusBadge';
import { ProjectType } from '@/types/booking';
import { 
  Plane, 
  Package, 
  Users, 
  CheckCircle, 
  Info,
  ArrowRight
} from 'lucide-react';

interface ProjectTypeSelectorProps {
  value?: ProjectType;
  onChange: (type: ProjectType) => void;
  disabled?: boolean;
  className?: string;
}

interface ProjectTypeOption {
  type: ProjectType;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  team: 'AIR' | 'CINT';
  features: string[];
  examples: string[];
}

const projectTypeOptions: ProjectTypeOption[] = [
  {
    type: 'AIR_ONLY',
    title: 'AIR 단독 예약',
    subtitle: '항공권만 발권하는 예약',
    description: 'AIR팀에서 처리하는 개인 또는 그룹 항공권 발권 전용 예약입니다.',
    icon: <Plane className="h-8 w-8" />,
    team: 'AIR',
    features: [
      '항공권 발권 전용',
      '개인/그룹 선택 가능',
      '항공사 견적 비교',
      '블럭 예약 지원',
      '특별 요청 처리'
    ],
    examples: [
      '개인 여행 항공권',
      '그룹 단체 항공권',
      '출장용 항공권',
      '귀국편 예약'
    ]
  },
  {
    type: 'CINT_PACKAGE',
    title: 'CINT 패키지 상품',
    subtitle: '미리 제작된 패키지 상품',
    description: 'CINT팀에서 사전에 기획하고 제작한 패키지 상품에 대한 예약입니다.',
    icon: <Package className="h-8 w-8" />,
    team: 'CINT',
    features: [
      '사전 제작 패키지',
      '현지 파트너 협업',
      '일정 관리',
      '항공+랜드 통합',
      '마케팅 자료 포함'
    ],
    examples: [
      '3박 4일 세부 패키지',
      '5박 6일 보라카이 투어',
      '7일 필리핀 일주',
      '허니문 특별 패키지'
    ]
  },
  {
    type: 'CINT_INCENTIVE_GROUP',
    title: 'CINT 인센티브 그룹',
    subtitle: '맞춤형 그룹 견적 요청',
    description: 'CINT팀에서 고객 요구사항에 맞춰 맞춤형 견적을 제공하는 그룹 인센티브 예약입니다.',
    icon: <Users className="h-8 w-8" />,
    team: 'CINT',
    features: [
      '맞춤형 견적 제공',
      '그룹 인센티브 전문',
      '유연한 일정 구성',
      'AIR팀 협업 가능',
      '예산 범위 설정'
    ],
    examples: [
      '회사 워크샵 여행',
      '학교 수학여행',
      '동호회 단체 여행',
      '인센티브 포상 여행'
    ]
  }
];

export function ProjectTypeSelector({ 
  value, 
  onChange, 
  disabled = false, 
  className = '' 
}: ProjectTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<ProjectType | undefined>(value);

  const handleTypeSelect = (type: ProjectType) => {
    setSelectedType(type);
    onChange(type);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">프로젝트 타입 선택</h2>
        <p className="text-gray-600">
          예약하고자 하는 프로젝트의 타입을 선택해주세요. 
          선택한 타입에 따라 필요한 정보가 달라집니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {projectTypeOptions.map((option) => {
          const isSelected = selectedType === option.type;
          
          return (
            <div
              key={option.type}
              className={`relative border rounded-xl p-6 cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-lg' 
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !disabled && handleTypeSelect(option.type)}
            >
              {/* 선택 상태 표시 */}
              {isSelected && (
                <div className="absolute -top-3 -right-3">
                  <div className="bg-blue-500 text-white rounded-full p-2">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                </div>
              )}

              {/* 헤더 */}
              <div className="flex items-start space-x-4 mb-4">
                <div className={`p-3 rounded-lg ${
                  isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {option.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {option.title}
                    </h3>
                    <TeamBadge team={option.team} />
                  </div>
                  <p className="text-sm text-gray-600">{option.subtitle}</p>
                </div>
              </div>

              {/* 설명 */}
              <div className="mb-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {option.description}
                </p>
              </div>

              {/* 주요 기능 */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <Info className="h-4 w-4 mr-1" />
                  주요 기능
                </h4>
                <ul className="space-y-1">
                  {option.features.slice(0, 3).map((feature, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center">
                      <ArrowRight className="h-3 w-3 mr-2 text-gray-400" />
                      {feature}
                    </li>
                  ))}
                  {option.features.length > 3 && (
                    <li className="text-xs text-gray-500 italic">
                      그 외 {option.features.length - 3}개 기능...
                    </li>
                  )}
                </ul>
              </div>

              {/* 예시 */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">예시</h4>
                <div className="flex flex-wrap gap-1">
                  {option.examples.slice(0, 2).map((example, index) => (
                    <span 
                      key={index} 
                      className={`inline-block px-2 py-1 rounded text-xs ${
                        isSelected 
                          ? 'bg-blue-200 text-blue-800' 
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {example}
                    </span>
                  ))}
                  {option.examples.length > 2 && (
                    <span className="inline-block px-2 py-1 rounded text-xs text-gray-500">
                      +{option.examples.length - 2}
                    </span>
                  )}
                </div>
              </div>

              {/* 선택 버튼 */}
              <div className="mt-6">
                <Button
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  className="w-full"
                  disabled={disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!disabled) {
                      handleTypeSelect(option.type);
                    }
                  }}
                >
                  {isSelected ? '선택됨' : '이 타입 선택'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 선택된 타입 정보 */}
      {selectedType && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">
              선택된 프로젝트: {projectTypeOptions.find(opt => opt.type === selectedType)?.title}
            </h3>
          </div>
          <p className="text-sm text-blue-800">
            계속 진행하면 {projectTypeOptions.find(opt => opt.type === selectedType)?.team} 팀 담당 예약으로 
            필요한 정보를 입력하실 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}
