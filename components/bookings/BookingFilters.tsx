"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TeamBadge, StatusBadge, PriorityBadge } from './StatusBadge';
import { WorkflowStep } from '@/types/workflow';
import { ProjectType, BookingStatus, Priority } from '@/types/booking';
import { Team } from '@/types/team';
import { Filter, Search, X, ChevronDown, Users, Clock, AlertTriangle } from 'lucide-react';

export interface BookingFilterState {
  team?: Team;
  projectType?: ProjectType;
  status?: BookingStatus;
  currentStep?: WorkflowStep;
  priority?: Priority;
  assignedTo?: string;
  tags?: string[];
  searchText?: string;
  dateRange?: {
    field: 'createdAt' | 'departureDate' | 'confirmationDeadline';
    start: Date;
    end: Date;
  };
}

interface BookingFiltersProps {
  filters: BookingFilterState;
  onFiltersChange: (filters: BookingFilterState) => void;
  onReset: () => void;
  className?: string;
  availableTeams?: Team[];
  currentUser?: {
    team?: Team;
    canViewAllTeams?: boolean;
  };
}

const Input = ({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
);

const Select = ({ children, placeholder }: {
  value?: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel] = useState<string>(placeholder || '선택');

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="w-full justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="py-1">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

const SelectItem = ({ value, onSelect, children }: {
  value: string;
  onSelect: (value: string, label: string) => void;
  children: React.ReactNode;
}) => {
  const handleClick = () => {
    onSelect(value, typeof children === 'string' ? children : value);
  };
  
  return (
    <button
      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

export function BookingFilters({ 
  filters, 
  onFiltersChange, 
  onReset, 
  className = '',
  availableTeams = ['AIR', 'CINT'],
  currentUser 
}: BookingFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localSearchText, setLocalSearchText] = useState(filters.searchText || '');

  const updateFilter = <K extends keyof BookingFilterState>(key: K, value: BookingFilterState[K]) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && 
    !(Array.isArray(value) && value.length === 0)
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter('searchText', localSearchText.trim() || undefined);
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 mb-6 ${className}`}>
      {/* 기본 필터 행 */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {/* 검색 */}
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px] max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="부킹번호, 고객명으로 검색..."
              value={localSearchText}
              onChange={(e) => setLocalSearchText(e.target.value)}
              className="pl-10"
            />
            {localSearchText && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearchText('');
                  updateFilter('searchText', undefined);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>

        {/* 팀 선택 */}
        {(currentUser?.canViewAllTeams || availableTeams.length > 1) && (
          <div className="min-w-[120px]">
            <Select
              value={filters.team}
              onValueChange={(value) => updateFilter('team', value as Team)}
              placeholder="모든 팀"
            >
              <SelectItem value="" onSelect={() => updateFilter('team', undefined)}>
                모든 팀
              </SelectItem>
              {availableTeams.map((team) => (
                <SelectItem key={team} value={team} onSelect={(v) => updateFilter('team', v as Team)}>
                  <TeamBadge team={team} />
                </SelectItem>
              ))}
            </Select>
          </div>
        )}

        {/* 현재 단계 */}
        <div className="min-w-[140px]">
          <Select
            value={filters.currentStep}
            onValueChange={(value) => updateFilter('currentStep', value as WorkflowStep)}
            placeholder="모든 단계"
                      >
              <SelectItem value="" onSelect={() => updateFilter('currentStep', undefined)}>
                모든 단계
              </SelectItem>
            {Object.values(WorkflowStep).map((step) => (
              <SelectItem key={step} value={step} onSelect={(v) => updateFilter('currentStep', v as WorkflowStep)}>
                <StatusBadge status={step} />
              </SelectItem>
            ))}
          </Select>
        </div>

        {/* 확장 토글 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2"
        >
          <Filter className="h-4 w-4" />
          <span>필터</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </Button>

        {/* 초기화 버튼 */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-1" />
            초기화
          </Button>
        )}
      </div>

      {/* 확장 필터 */}
      {isExpanded && (
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            
            {/* 프로젝트 타입 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                프로젝트 타입
              </label>
              <Select
                value={filters.projectType}
                onValueChange={(value) => updateFilter('projectType', value as ProjectType)}
                placeholder="모든 타입"
              >
                <SelectItem value="" onSelect={() => updateFilter('projectType', undefined)}>
                  모든 타입
                </SelectItem>
                <SelectItem value="AIR_ONLY" onSelect={(v) => updateFilter('projectType', v as ProjectType)}>
                  AIR 단독
                </SelectItem>
                <SelectItem value="CINT_PACKAGE" onSelect={(v) => updateFilter('projectType', v as ProjectType)}>
                  CINT 패키지
                </SelectItem>
                <SelectItem value="CINT_INCENTIVE_GROUP" onSelect={(v) => updateFilter('projectType', v as ProjectType)}>
                  CINT 인센티브 그룹
                </SelectItem>
              </Select>
            </div>

            {/* 우선순위 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                우선순위
              </label>
              <Select
                value={filters.priority}
                onValueChange={(value) => updateFilter('priority', value as Priority)}
                placeholder="모든 우선순위"
              >
                <SelectItem value="" onSelect={() => updateFilter('priority', undefined)}>
                  모든 우선순위
                </SelectItem>
                {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as Priority[]).map((priority) => (
                  <SelectItem key={priority} value={priority} onSelect={(v) => updateFilter('priority', v as Priority)}>
                    <PriorityBadge priority={priority} />
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* 예약 상태 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                예약 상태
              </label>
              <Select
                value={filters.status}
                onValueChange={(value) => updateFilter('status', value as BookingStatus)}
                placeholder="모든 상태"
              >
                <SelectItem value="" onSelect={() => updateFilter('status', undefined)}>
                  모든 상태
                </SelectItem>
                {(['ACTIVE', 'CANCELLED', 'COMPLETED', 'ON_HOLD'] as BookingStatus[]).map((status) => (
                  <SelectItem key={status} value={status} onSelect={(v) => updateFilter('status', v as BookingStatus)}>
                    {/* BookingStatusBadge 임포트 추가 필요 */}
                    {status === 'ACTIVE' ? '활성' : 
                     status === 'CANCELLED' ? '취소됨' : 
                     status === 'COMPLETED' ? '완료' : '보류'}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* 담당자 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                담당자
              </label>
              <Input
                type="text"
                placeholder="담당자 이름"
                value={filters.assignedTo || ''}
                onChange={(e) => updateFilter('assignedTo', e.target.value.trim() || undefined)}
              />
            </div>

          </div>
        </div>
      )}

      {/* 활성 필터 표시 */}
      {hasActiveFilters && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">활성 필터:</span>
            
            {filters.team && (
              <div className="flex items-center space-x-1 bg-blue-50 border border-blue-200 rounded-md px-2 py-1">
                <TeamBadge team={filters.team} className="text-xs" />
                <button
                  onClick={() => updateFilter('team', undefined)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            
            {filters.currentStep && (
              <div className="flex items-center space-x-1 bg-gray-50 border border-gray-200 rounded-md px-2 py-1">
                <StatusBadge status={filters.currentStep} className="text-xs" />
                <button
                  onClick={() => updateFilter('currentStep', undefined)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {filters.priority && (
              <div className="flex items-center space-x-1 bg-orange-50 border border-orange-200 rounded-md px-2 py-1">
                <PriorityBadge priority={filters.priority} className="text-xs" />
                <button
                  onClick={() => updateFilter('priority', undefined)}
                  className="text-orange-600 hover:text-orange-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {filters.searchText && (
              <div className="flex items-center space-x-1 bg-green-50 border border-green-200 rounded-md px-2 py-1">
                <span className="text-xs text-green-800">&quot;{filters.searchText}&quot;</span>
                <button
                  onClick={() => {
                    updateFilter('searchText', undefined);
                    setLocalSearchText('');
                  }}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
