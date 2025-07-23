'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useLanguage } from '../../../../components/LanguageContext';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
  disabled: boolean;
  createdAt: Date;
  lastSignInAt?: Date;
  lastActivityAt?: Date;
  role: 'admin' | 'user';
  workspace: string;
}

interface ActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}

interface UserStats {
  spots: { created: number; deleted: number };
  products: { created: number; deleted: number };
  ta: { created: number; deleted: number };
  emails: { sent: number };
  banners: { created: number; deleted: number };
  itineraries: { created: number; deleted: number };
  letters: { created: number; deleted: number };
  posters: { created: number; deleted: number };
  totalStats: {
    totalCreated: number;
    totalDeleted: number;
    totalEmails: number;
    totalActions: number;
  };
}

const USER_DETAIL_TEXTS = {
  ko: {
    title: "사용자 상세 정보",
    backToUsers: "← 사용자 목록으로 돌아가기",
    loading: "로딩 중...",
    error: "데이터를 불러오는데 실패했습니다.",
    noUser: "사용자를 찾을 수 없습니다.",
    
    // 사용자 정보
    userInfo: "사용자 정보",
    email: "이메일",
    name: "이름",
    role: "역할",
    status: "상태",
    createdAt: "가입일",
    lastSignIn: "마지막 로그인",
    lastActivity: "마지막 활동",
    
    // 활동 로그
    activityLog: "활동 로그",
    noActivity: "활동 기록이 없습니다.",
    action: "액션",
    details: "상세 정보",
    timestamp: "시간",
    ipAddress: "IP 주소",
    
    // 작업 통계
    workStats: "작업 통계",
    totalCreated: "총 생성",
    totalDeleted: "총 삭제",
    totalEmails: "총 이메일",
    totalActions: "총 작업",
    spots: "스팟",
    products: "상품",
    ta: "TA",
    emails: "이메일",
    banners: "배너",
    itineraries: "여행 일정",
    letters: "편지",
    posters: "포스터",
    created: "생성",
    deleted: "삭제",
    sent: "전송",
    
    // 상태
    active: "활성",
    disabled: "비활성",
    verified: "인증됨",
    unverified: "미인증",
    
    // 역할
    admin: "관리자",
    userRole: "사용자",
    
    // 액션 타입
    login: "로그인",
    logout: "로그아웃",
    create: "생성",
    update: "수정",
    delete: "삭제",
    emailSend: "이메일 전송",
    view: "조회",
    
    // 액션 버튼
    disableUser: "사용자 비활성화",
    enableUser: "사용자 활성화",
    changeRole: "역할 변경",
    
    // 메시지
    disableConfirm: "이 사용자를 비활성화하시겠습니까?",
    enableConfirm: "이 사용자를 활성화하시겠습니까?",
    roleChangeConfirm: "사용자 역할을 변경하시겠습니까?",
    operationSuccess: "작업이 성공적으로 완료되었습니다.",
    operationError: "작업 중 오류가 발생했습니다."
  },
  en: {
    title: "User Details",
    backToUsers: "← Back to User List",
    loading: "Loading...",
    error: "Failed to load data.",
    noUser: "User not found.",
    
    // User info
    userInfo: "User Information",
    email: "Email",
    name: "Name",
    role: "Role",
    status: "Status",
    createdAt: "Created At",
    lastSignIn: "Last Sign In",
    lastActivity: "Last Activity",
    
    // Activity log
    activityLog: "Activity Log",
    noActivity: "No activity records found.",
    action: "Action",
    details: "Details",
    timestamp: "Timestamp",
    ipAddress: "IP Address",
    
    // Work statistics
    workStats: "Work Statistics",
    totalCreated: "Total Created",
    totalDeleted: "Total Deleted",
    totalEmails: "Total Emails",
    totalActions: "Total Actions",
    spots: "Spots",
    products: "Products",
    ta: "TA",
    emails: "Emails",
    banners: "Banners",
    itineraries: "Itineraries",
    letters: "Letters",
    posters: "Posters",
    created: "Created",
    deleted: "Deleted",
    sent: "Sent",
    
    // Status
    active: "Active",
    disabled: "Disabled",
    verified: "Verified",
    unverified: "Unverified",
    
    // Role
    admin: "Admin",
    userRole: "User",
    
    // Action types
    login: "Login",
    logout: "Logout",
    create: "Create",
    update: "Update",
    delete: "Delete",
    emailSend: "Send Email",
    view: "View",
    
    // Action buttons
    disableUser: "Disable User",
    enableUser: "Enable User",
    changeRole: "Change Role",
    
    // Messages
    disableConfirm: "Are you sure you want to disable this user?",
    enableConfirm: "Are you sure you want to enable this user?",
    roleChangeConfirm: "Are you sure you want to change the user role?",
    operationSuccess: "Operation completed successfully.",
    operationError: "An error occurred during the operation."
  }
};

export default function UserDetailPage() {
  const { id } = useParams();
  const { lang } = useLanguage();
  const texts = USER_DETAIL_TEXTS[lang as keyof typeof USER_DETAIL_TEXTS];
  
  const [user, setUser] = useState<User | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // 사용자 정보 가져오기
        const userResponse = await fetch(`/api/users/list`);
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const userResult = await userResponse.json();
        const foundUser = userResult.data.find((u: User) => u.id === id);
        
        if (!foundUser) {
          setError(texts.noUser);
          return;
        }
        
        setUser(foundUser);
        
        // 활동 로그 가져오기
        const activityResponse = await fetch(`/api/users/activity?userId=${id}`);
        if (activityResponse.ok) {
          const activityResult = await activityResponse.json();
          setActivities(activityResult.data || []);
        }
        
        // 사용자 통계 가져오기
        const statsResponse = await fetch(`/api/users/${id}/stats`);
        if (statsResponse.ok) {
          const statsResult = await statsResponse.json();
          setStats(statsResult.data);
        }
        
      } catch (err) {
        console.error('사용자 데이터 불러오기 실패:', err);
        setError(texts.error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserData();
    }
  }, [id, texts.error, texts.noUser]);

  const toggleUserStatus = async (disabled: boolean) => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disabled })
      });

      if (response.ok) {
        setUser(prev => prev ? { ...prev, disabled } : null);
        alert(texts.operationSuccess);
      } else {
        throw new Error('Failed to update user status');
      }
    } catch (err) {
      console.error('사용자 상태 변경 실패:', err);
      alert(texts.operationError);
    }
  };

  const changeUserRole = async (newRole: 'admin' | 'user') => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        setUser(prev => prev ? { ...prev, role: newRole } : null);
        alert(texts.operationSuccess);
      } else {
        throw new Error('Failed to update user role');
      }
    } catch (err) {
      console.error('사용자 역할 변경 실패:', err);
      alert(texts.operationError);
    }
  };

  const getActionText = (action: string) => {
    const actionMap: Record<string, string> = {
      'login': texts.login,
      'logout': texts.logout,
      'create': texts.create,
      'update': texts.update,
      'delete': texts.delete,
      'email': texts.emailSend,
      'view': texts.view
    };
    return actionMap[action] || action;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-lg text-gray-600">{texts.loading}</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/admin/users" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            {texts.backToUsers}
          </Link>
          <div className="text-center">
            <div className="text-lg text-red-600">{error || texts.noUser}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/admin/users" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            {texts.backToUsers}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{texts.title}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 사용자 정보 */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{texts.userInfo}</h2>
              
              {/* 프로필 이미지 */}
              <div className="flex items-center mb-6">
                {user.photoURL ? (
                  <Image 
                    className="h-16 w-16 rounded-full mr-4" 
                    src={user.photoURL} 
                    alt={`${user.displayName || user.email} 프로필`}
                    width={64}
                    height={64}
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full mr-4 bg-gray-300 flex items-center justify-center">
                    <span className="text-xl text-gray-600 font-medium">
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{user.displayName || user.email}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>

              {/* 사용자 정보 테이블 */}
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">{texts.role}</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'admin' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role === 'admin' ? texts.admin : texts.userRole}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">{texts.status}</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.disabled 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.disabled ? texts.disabled : texts.active}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">{texts.createdAt}</span>
                  <span className="text-sm text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US')}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">{texts.lastSignIn}</span>
                  <span className="text-sm text-gray-900">
                    {user.lastSignInAt 
                      ? new Date(user.lastSignInAt).toLocaleString(lang === 'ko' ? 'ko-KR' : 'en-US', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '-'
                    }
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">{texts.lastActivity}</span>
                  <span className="text-sm text-gray-900">
                    {user.lastActivityAt 
                      ? new Date(user.lastActivityAt).toLocaleString(lang === 'ko' ? 'ko-KR' : 'en-US', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '-'
                    }
                  </span>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="mt-6 space-y-3">
                {user.disabled ? (
                  <button
                    onClick={() => {
                      if (confirm(texts.enableConfirm)) {
                        toggleUserStatus(false);
                      }
                    }}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    {texts.enableUser}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (confirm(texts.disableConfirm)) {
                        toggleUserStatus(true);
                      }
                    }}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                  >
                    {texts.disableUser}
                  </button>
                )}
                
                <button
                  onClick={() => {
                    const newRole = user.role === 'admin' ? 'user' : 'admin';
                    if (confirm(texts.roleChangeConfirm)) {
                      changeUserRole(newRole);
                    }
                  }}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  {texts.changeRole}
                </button>
              </div>
            </motion.div>
          </div>

          {/* 작업 통계 */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{texts.workStats}</h2>
              
              {stats ? (
                <div className="space-y-6">
                  {/* 총 통계 */}
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">{stats.totalStats.totalActions}</div>
                        <div className="text-sm opacity-90">{texts.totalActions}</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{stats.totalStats.totalCreated}</div>
                        <div className="text-sm opacity-90">{texts.totalCreated}</div>
                      </div>
                    </div>
                  </div>

                  {/* 상세 통계 */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{texts.spots}</span>
                        <span className="font-medium">{stats.spots.created}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{texts.products}</span>
                        <span className="font-medium">{stats.products.created}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{texts.ta}</span>
                        <span className="font-medium">{stats.ta.created}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{texts.emails}</span>
                        <span className="font-medium">{stats.emails.sent}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{texts.banners}</span>
                        <span className="font-medium">{stats.banners.created}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{texts.itineraries}</span>
                        <span className="font-medium">{stats.itineraries.created}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{texts.letters}</span>
                        <span className="font-medium">{stats.letters.created}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{texts.posters}</span>
                        <span className="font-medium">{stats.posters.created}</span>
                      </div>
                    </div>
                  </div>

                  {/* 삭제 통계 */}
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">{texts.totalDeleted}</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{texts.spots}</span>
                        <span className="font-medium text-red-600">{stats.spots.deleted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{texts.products}</span>
                        <span className="font-medium text-red-600">{stats.products.deleted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{texts.ta}</span>
                        <span className="font-medium text-red-600">{stats.ta.deleted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{texts.banners}</span>
                        <span className="font-medium text-red-600">{stats.banners.deleted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{texts.itineraries}</span>
                        <span className="font-medium text-red-600">{stats.itineraries.deleted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{texts.letters}</span>
                        <span className="font-medium text-red-600">{stats.letters.deleted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{texts.posters}</span>
                        <span className="font-medium text-red-600">{stats.posters.deleted}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  {texts.loading}
                </div>
              )}
            </motion.div>
          </div>

          {/* 활동 로그 */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-lg shadow"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">{texts.activityLog}</h2>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {activities.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    {texts.noActivity}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {activities.map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="p-6 hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                activity.action === 'login' ? 'bg-green-100 text-green-800' :
                                activity.action === 'logout' ? 'bg-yellow-100 text-yellow-800' :
                                activity.action === 'create' ? 'bg-blue-100 text-blue-800' :
                                activity.action === 'update' ? 'bg-purple-100 text-purple-800' :
                                activity.action === 'delete' ? 'bg-red-100 text-red-800' :
                                activity.action === 'email' ? 'bg-indigo-100 text-indigo-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {getActionText(activity.action)}
                              </span>
                              <span className="text-sm text-gray-500">
                                {new Date(activity.timestamp).toLocaleString(lang === 'ko' ? 'ko-KR' : 'en-US', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-gray-900">{activity.details}</p>
                            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                              <span>{texts.ipAddress}: {activity.ipAddress}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
} 