// 워크플로우 단계 및 상태 정의

/**
 * 예약 워크플로우 단계
 */
export enum WorkflowStep {
  // 1. 문의/등록 단계
  INQUIRY = 'INQUIRY',
  
  // 2. 견적 요청 단계
  QUOTE_REQUESTED = 'QUOTE_REQUESTED',
  
  // 3. 견적 수신 단계  
  QUOTE_RECEIVED = 'QUOTE_RECEIVED',
  
  // 4. 고객 안내 단계
  CUSTOMER_NOTIFIED = 'CUSTOMER_NOTIFIED',
  
  // 5. 확정 단계
  CONFIRMED = 'CONFIRMED',
  
  // 6. 예약금 인보이스 발송
  DEPOSIT_INVOICED = 'DEPOSIT_INVOICED',
  
  // 7. 예약금 수령
  DEPOSIT_RECEIVED = 'DEPOSIT_RECEIVED',
  
  // 8. 블록/예약 처리
  BLOCKED = 'BLOCKED',
  
  // 9. 잔금 인보이스 발송
  FINAL_PAYMENT_INVOICED = 'FINAL_PAYMENT_INVOICED',
  
  // 10. 잔금 수령
  FINAL_PAYMENT_RECEIVED = 'FINAL_PAYMENT_RECEIVED',
  
  // 11. 발권/최종 처리
  TICKETED = 'TICKETED',
  
  // 12. 완료
  COMPLETED = 'COMPLETED',
  
  // 특수 상태
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD'
}

/**
 * 워크플로우 단계 한국어 라벨
 */
export const WORKFLOW_STEP_LABELS: Record<WorkflowStep, string> = {
  [WorkflowStep.INQUIRY]: '문의/등록',
  [WorkflowStep.QUOTE_REQUESTED]: '견적 요청',
  [WorkflowStep.QUOTE_RECEIVED]: '견적 수신',
  [WorkflowStep.CUSTOMER_NOTIFIED]: '고객 안내',
  [WorkflowStep.CONFIRMED]: '확정',
  [WorkflowStep.DEPOSIT_INVOICED]: '예약금 인보이스 발송',
  [WorkflowStep.DEPOSIT_RECEIVED]: '예약금 수령',
  [WorkflowStep.BLOCKED]: '블록/예약 처리',
  [WorkflowStep.FINAL_PAYMENT_INVOICED]: '잔금 인보이스 발송',
  [WorkflowStep.FINAL_PAYMENT_RECEIVED]: '잔금 수령',
  [WorkflowStep.TICKETED]: '발권/최종 처리',
  [WorkflowStep.COMPLETED]: '완료',
  [WorkflowStep.CANCELLED]: '취소됨',
  [WorkflowStep.ON_HOLD]: '보류'
};

/**
 * 워크플로우 단계별 색상 (UI용)
 */
export const WORKFLOW_STEP_COLORS: Record<WorkflowStep, string> = {
  [WorkflowStep.INQUIRY]: 'bg-gray-100 text-gray-800',
  [WorkflowStep.QUOTE_REQUESTED]: 'bg-yellow-100 text-yellow-800',
  [WorkflowStep.QUOTE_RECEIVED]: 'bg-blue-100 text-blue-800',
  [WorkflowStep.CUSTOMER_NOTIFIED]: 'bg-purple-100 text-purple-800',
  [WorkflowStep.CONFIRMED]: 'bg-green-100 text-green-800',
  [WorkflowStep.DEPOSIT_INVOICED]: 'bg-orange-100 text-orange-800',
  [WorkflowStep.DEPOSIT_RECEIVED]: 'bg-emerald-100 text-emerald-800',
  [WorkflowStep.BLOCKED]: 'bg-indigo-100 text-indigo-800',
  [WorkflowStep.FINAL_PAYMENT_INVOICED]: 'bg-pink-100 text-pink-800',
  [WorkflowStep.FINAL_PAYMENT_RECEIVED]: 'bg-teal-100 text-teal-800',
  [WorkflowStep.TICKETED]: 'bg-cyan-100 text-cyan-800',
  [WorkflowStep.COMPLETED]: 'bg-green-200 text-green-900',
  [WorkflowStep.CANCELLED]: 'bg-red-100 text-red-800',
  [WorkflowStep.ON_HOLD]: 'bg-gray-200 text-gray-700'
};

/**
 * 워크플로우 진행도 (백분율)
 */
export const WORKFLOW_PROGRESS: Record<WorkflowStep, number> = {
  [WorkflowStep.INQUIRY]: 5,
  [WorkflowStep.QUOTE_REQUESTED]: 15,
  [WorkflowStep.QUOTE_RECEIVED]: 25,
  [WorkflowStep.CUSTOMER_NOTIFIED]: 35,
  [WorkflowStep.CONFIRMED]: 45,
  [WorkflowStep.DEPOSIT_INVOICED]: 55,
  [WorkflowStep.DEPOSIT_RECEIVED]: 65,
  [WorkflowStep.BLOCKED]: 75,
  [WorkflowStep.FINAL_PAYMENT_INVOICED]: 85,
  [WorkflowStep.FINAL_PAYMENT_RECEIVED]: 90,
  [WorkflowStep.TICKETED]: 95,
  [WorkflowStep.COMPLETED]: 100,
  [WorkflowStep.CANCELLED]: 0,
  [WorkflowStep.ON_HOLD]: 0
};

/**
 * 워크플로우 단계별 다음 가능한 단계들
 */
export const WORKFLOW_TRANSITIONS: Record<WorkflowStep, WorkflowStep[]> = {
  [WorkflowStep.INQUIRY]: [
    WorkflowStep.QUOTE_REQUESTED,
    WorkflowStep.CANCELLED,
    WorkflowStep.ON_HOLD
  ],
  [WorkflowStep.QUOTE_REQUESTED]: [
    WorkflowStep.QUOTE_RECEIVED,
    WorkflowStep.CANCELLED,
    WorkflowStep.ON_HOLD
  ],
  [WorkflowStep.QUOTE_RECEIVED]: [
    WorkflowStep.CUSTOMER_NOTIFIED,
    WorkflowStep.CANCELLED,
    WorkflowStep.ON_HOLD
  ],
  [WorkflowStep.CUSTOMER_NOTIFIED]: [
    WorkflowStep.CONFIRMED,
    WorkflowStep.CANCELLED,
    WorkflowStep.ON_HOLD
  ],
  [WorkflowStep.CONFIRMED]: [
    WorkflowStep.DEPOSIT_INVOICED,
    WorkflowStep.FINAL_PAYMENT_INVOICED, // 전액 결제인 경우
    WorkflowStep.CANCELLED
  ],
  [WorkflowStep.DEPOSIT_INVOICED]: [
    WorkflowStep.DEPOSIT_RECEIVED,
    WorkflowStep.CANCELLED
  ],
  [WorkflowStep.DEPOSIT_RECEIVED]: [
    WorkflowStep.BLOCKED,
    WorkflowStep.CANCELLED
  ],
  [WorkflowStep.BLOCKED]: [
    WorkflowStep.FINAL_PAYMENT_INVOICED,
    WorkflowStep.TICKETED, // 전액 결제된 경우
    WorkflowStep.CANCELLED
  ],
  [WorkflowStep.FINAL_PAYMENT_INVOICED]: [
    WorkflowStep.FINAL_PAYMENT_RECEIVED,
    WorkflowStep.CANCELLED
  ],
  [WorkflowStep.FINAL_PAYMENT_RECEIVED]: [
    WorkflowStep.TICKETED
  ],
  [WorkflowStep.TICKETED]: [
    WorkflowStep.COMPLETED
  ],
  [WorkflowStep.COMPLETED]: [],
  [WorkflowStep.CANCELLED]: [],
  [WorkflowStep.ON_HOLD]: [
    WorkflowStep.QUOTE_REQUESTED,
    WorkflowStep.CANCELLED
  ]
};

/**
 * 워크플로우 히스토리 항목
 */
export interface WorkflowHistory {
  id: string;
  bookingId: string;
  fromStep: WorkflowStep | null;
  toStep: WorkflowStep;
  changedBy: string; // 사용자 UID
  changedByName: string; // 사용자 이름  
  changedAt: Date;
  notes?: string;
  automaticChange: boolean; // 자동 변경 여부
}

/**
 * 워크플로우 알림 설정
 */
export interface WorkflowNotification {
  step: WorkflowStep;
  notifyTeams: ('AIR' | 'CINT')[];
  notifyRoles: ('ADMIN' | 'TEAM_LEADER' | 'TEAM_MEMBER')[];
  emailTemplate: string;
  delayMinutes?: number; // 지연 발송 (분)
}

/**
 * 기본 알림 설정
 */
export const DEFAULT_WORKFLOW_NOTIFICATIONS: WorkflowNotification[] = [
  {
    step: WorkflowStep.QUOTE_RECEIVED,
    notifyTeams: ['AIR', 'CINT'],
    notifyRoles: ['ADMIN', 'TEAM_LEADER'],
    emailTemplate: 'quote_received'
  },
  {
    step: WorkflowStep.CONFIRMED,
    notifyTeams: ['AIR', 'CINT'],
    notifyRoles: ['ADMIN', 'TEAM_LEADER', 'TEAM_MEMBER'],
    emailTemplate: 'booking_confirmed'
  },
  {
    step: WorkflowStep.DEPOSIT_RECEIVED,
    notifyTeams: ['AIR', 'CINT'],
    notifyRoles: ['ADMIN', 'TEAM_LEADER'],
    emailTemplate: 'deposit_received'
  },
  {
    step: WorkflowStep.FINAL_PAYMENT_RECEIVED,
    notifyTeams: ['AIR', 'CINT'],
    notifyRoles: ['ADMIN', 'TEAM_LEADER'],
    emailTemplate: 'final_payment_received'
  },
  {
    step: WorkflowStep.COMPLETED,
    notifyTeams: ['AIR', 'CINT'],
    notifyRoles: ['ADMIN', 'TEAM_LEADER', 'TEAM_MEMBER'],
    emailTemplate: 'booking_completed'
  }
];

