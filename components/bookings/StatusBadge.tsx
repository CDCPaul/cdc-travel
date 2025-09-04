"use client";

import { WorkflowStep, WORKFLOW_STEP_LABELS, WORKFLOW_STEP_COLORS, WORKFLOW_PROGRESS } from '@/types/workflow';
import { BookingStatus } from '@/types/booking';

interface StatusBadgeProps {
  status: WorkflowStep;
  showProgress?: boolean;
  className?: string;
}

export function StatusBadge({ status, showProgress = false, className = '' }: StatusBadgeProps) {
  const label = WORKFLOW_STEP_LABELS[status];
  const colorClass = WORKFLOW_STEP_COLORS[status];
  const progress = WORKFLOW_PROGRESS[status];

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {label}
      </span>
      {showProgress && (
        <div className="flex items-center space-x-1">
          <div className="w-16 bg-gray-200 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                status === WorkflowStep.COMPLETED ? 'bg-green-600' :
                status === WorkflowStep.CANCELLED ? 'bg-red-500' :
                status === WorkflowStep.ON_HOLD ? 'bg-gray-500' :
                'bg-blue-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 min-w-[2rem]">{progress}%</span>
        </div>
      )}
    </div>
  );
}

interface BookingStatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

export function BookingStatusBadge({ status, className = '' }: BookingStatusBadgeProps) {
  const getStatusConfig = (status: BookingStatus) => {
    switch (status) {
      case 'ACTIVE':
        return {
          label: '활성',
          color: 'bg-green-100 text-green-800'
        };
      case 'CANCELLED':
        return {
          label: '취소됨',
          color: 'bg-red-100 text-red-800'
        };
      case 'COMPLETED':
        return {
          label: '완료',
          color: 'bg-gray-100 text-gray-800'
        };
      case 'ON_HOLD':
        return {
          label: '보류',
          color: 'bg-yellow-100 text-yellow-800'
        };
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} ${className}`}>
      {config.label}
    </span>
  );
}

interface TeamBadgeProps {
  team: 'AIR' | 'CINT';
  className?: string;
}

export function TeamBadge({ team, className = '' }: TeamBadgeProps) {
  const config = {
    AIR: {
      label: 'AIR 팀',
      color: 'bg-blue-100 text-blue-800'
    },
    CINT: {
      label: 'CINT 팀', 
      color: 'bg-purple-100 text-purple-800'
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config[team].color} ${className}`}>
      {config[team].label}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  className?: string;
}

export function PriorityBadge({ priority, className = '' }: PriorityBadgeProps) {
  const config = {
    LOW: {
      label: '낮음',
      color: 'bg-gray-100 text-gray-600'
    },
    MEDIUM: {
      label: '보통',
      color: 'bg-blue-100 text-blue-700'
    },
    HIGH: {
      label: '높음',
      color: 'bg-orange-100 text-orange-700'
    },
    URGENT: {
      label: '긴급',
      color: 'bg-red-100 text-red-700'
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config[priority].color} ${className}`}>
      {config[priority].label}
    </span>
  );
}
