// 팀별 권한 및 역할 정의

/**
 * 팀 구분
 */
export type Team = 'AIR' | 'CINT';

/**
 * 사용자 역할
 */
export type UserRole = 'ADMIN' | 'TEAM_LEADER' | 'TEAM_MEMBER';

/**
 * 팀별 권한 정의
 */
export interface TeamPermissions {
  // 예약 관리 권한
  canCreateBooking: boolean;
  canEditOwnBookings: boolean;
  canEditTeamBookings: boolean;
  canEditAllBookings: boolean;
  canDeleteBookings: boolean;
  
  // 협업 관련 권한
  canRequestCollaboration: boolean;
  canApproveCollaboration: boolean;
  canViewCrossTeamBookings: boolean;
  
  // 문서 관리 권한
  canGenerateQuotes: boolean;
  canGenerateInvoices: boolean;
  canSendNotifications: boolean;
  
  // 재정 관리 권한
  canViewFinancials: boolean;
  canEditPricing: boolean;
  canProcessPayments: boolean;
}

/**
 * 사용자 정보
 */
export interface TeamUser {
  id: string;
  email: string;
  name: string;
  team: Team;
  role: UserRole;
  permissions: TeamPermissions;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 팀별 기본 권한 설정
 */
export const DEFAULT_TEAM_PERMISSIONS: Record<Team, Record<UserRole, TeamPermissions>> = {
  AIR: {
    ADMIN: {
      canCreateBooking: true,
      canEditOwnBookings: true,
      canEditTeamBookings: true,
      canEditAllBookings: true,
      canDeleteBookings: true,
      canRequestCollaboration: true,
      canApproveCollaboration: true,
      canViewCrossTeamBookings: true,
      canGenerateQuotes: true,
      canGenerateInvoices: true,
      canSendNotifications: true,
      canViewFinancials: true,
      canEditPricing: true,
      canProcessPayments: true,
    },
    TEAM_LEADER: {
      canCreateBooking: true,
      canEditOwnBookings: true,
      canEditTeamBookings: true,
      canEditAllBookings: false,
      canDeleteBookings: true,
      canRequestCollaboration: true,
      canApproveCollaboration: true,
      canViewCrossTeamBookings: true,
      canGenerateQuotes: true,
      canGenerateInvoices: true,
      canSendNotifications: true,
      canViewFinancials: true,
      canEditPricing: true,
      canProcessPayments: false,
    },
    TEAM_MEMBER: {
      canCreateBooking: true,
      canEditOwnBookings: true,
      canEditTeamBookings: false,
      canEditAllBookings: false,
      canDeleteBookings: false,
      canRequestCollaboration: true,
      canApproveCollaboration: false,
      canViewCrossTeamBookings: false,
      canGenerateQuotes: true,
      canGenerateInvoices: false,
      canSendNotifications: false,
      canViewFinancials: false,
      canEditPricing: false,
      canProcessPayments: false,
    },
  },
  CINT: {
    ADMIN: {
      canCreateBooking: true,
      canEditOwnBookings: true,
      canEditTeamBookings: true,
      canEditAllBookings: true,
      canDeleteBookings: true,
      canRequestCollaboration: true,
      canApproveCollaboration: true,
      canViewCrossTeamBookings: true,
      canGenerateQuotes: true,
      canGenerateInvoices: true,
      canSendNotifications: true,
      canViewFinancials: true,
      canEditPricing: true,
      canProcessPayments: true,
    },
    TEAM_LEADER: {
      canCreateBooking: true,
      canEditOwnBookings: true,
      canEditTeamBookings: true,
      canEditAllBookings: false,
      canDeleteBookings: true,
      canRequestCollaboration: true,
      canApproveCollaboration: true,
      canViewCrossTeamBookings: true,
      canGenerateQuotes: true,
      canGenerateInvoices: true,
      canSendNotifications: true,
      canViewFinancials: true,
      canEditPricing: true,
      canProcessPayments: false,
    },
    TEAM_MEMBER: {
      canCreateBooking: true,
      canEditOwnBookings: true,
      canEditTeamBookings: false,
      canEditAllBookings: false,
      canDeleteBookings: false,
      canRequestCollaboration: true,
      canApproveCollaboration: false,
      canViewCrossTeamBookings: false,
      canGenerateQuotes: true,
      canGenerateInvoices: false,
      canSendNotifications: false,
      canViewFinancials: false,
      canEditPricing: false,
      canProcessPayments: false,
    },
  },
};

