'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useLanguage } from '../../../components/LanguageContext';
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



const USER_TEXTS = {
  ko: {
    title: "사용자 관리",
    backToDashboard: "← 대시보드로 돌아가기",
    loading: "로딩 중...",
    error: "데이터를 불러오는데 실패했습니다.",
    noUsers: "사용자가 없습니다.",
    
    // 테이블 헤더
    email: "이메일",
    name: "이름",
    role: "역할",
    status: "상태",
    lastSignIn: "마지막 로그인",
    lastActivity: "마지막 활동",
    actions: "작업",
    
    // 상태
    active: "활성",
    disabled: "비활성",
    verified: "인증됨",
    unverified: "미인증",
    
    // 역할
    admin: "관리자",
    user: "사용자",
    
    // 액션
    viewActivity: "활동 보기",
    disableUser: "사용자 비활성화",
    enableUser: "사용자 활성화",
    changeRole: "역할 변경",
    
    // 메시지
    disableConfirm: "이 사용자를 비활성화하시겠습니까?",
    enableConfirm: "이 사용자를 활성화하시겠습니까?",
    roleChangeConfirm: "사용자 역할을 변경하시겠습니까?",
    operationSuccess: "작업이 성공적으로 완료되었습니다.",
    operationError: "작업 중 오류가 발생했습니다.",
    
    // 필터
    filterAll: "전체",
    filterActive: "활성 사용자",
    filterDisabled: "비활성 사용자",
    filterAdmins: "관리자",
    filterUsers: "일반 사용자",
    searchPlaceholder: "이메일로 검색...",
    
    // 통계
    totalUsers: "전체 사용자",
    activeUsers: "활성 사용자",
    disabledUsers: "비활성 사용자",
    admins: "관리자",
    regularUsers: "일반 사용자"
  },
  en: {
    title: "User Management",
    backToDashboard: "← Back to Dashboard",
    loading: "Loading...",
    error: "Failed to load data.",
    noUsers: "No users found.",
    
    // Table headers
    email: "Email",
    name: "Name",
    role: "Role",
    status: "Status",
    lastSignIn: "Last Sign In",
    lastActivity: "Last Activity",
    actions: "Actions",
    
    // Status
    active: "Active",
    disabled: "Disabled",
    verified: "Verified",
    unverified: "Unverified",
    
    // Roles
    admin: "Admin",
    user: "User",
    
    // Actions
    viewActivity: "View Activity",
    disableUser: "Disable User",
    enableUser: "Enable User",
    changeRole: "Change Role",
    
    // Messages
    disableConfirm: "Are you sure you want to disable this user?",
    enableConfirm: "Are you sure you want to enable this user?",
    roleChangeConfirm: "Are you sure you want to change this user's role?",
    operationSuccess: "Operation completed successfully.",
    operationError: "An error occurred during the operation.",
    
    // Filters
    filterAll: "All",
    filterActive: "Active Users",
    filterDisabled: "Disabled Users",
    filterAdmins: "Admins",
    filterUsers: "Regular Users",
    searchPlaceholder: "Search by email...",
    
    // Statistics
    totalUsers: "Total Users",
    activeUsers: "Active Users",
    disabledUsers: "Disabled Users",
    admins: "Admins",
    regularUsers: "Regular Users"
  }
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const { lang } = useLanguage();
  const texts = USER_TEXTS[lang];

  // 사용자 목록 불러오기
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // Firestore에서 사용자 정보 가져오기
        const usersQuery = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc')
        );
        const usersSnapshot = await getDocs(usersQuery);
        
        const usersData: User[] = usersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            email: data.email || '',
            displayName: data.displayName || '',
            photoURL: data.photoURL || '',
            emailVerified: data.emailVerified || false,
            disabled: data.disabled || false,
            createdAt: data.createdAt?.toDate() || new Date(),
            lastSignInAt: data.lastSignInAt?.toDate(),
            lastActivityAt: data.lastActivityAt?.toDate(),
            role: data.role || 'user',
            workspace: data.workspace || 'default'
          };
        });

        setUsers(usersData);
      } catch (err) {
        console.error('사용자 목록 불러오기 실패:', err);
        setError(texts.error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [texts.error]);

  // 필터링 및 검색
  useEffect(() => {
    let filtered = users;

    // 검색 필터
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? !user.disabled : user.disabled
      );
    }

    // 역할 필터
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, statusFilter, roleFilter]);

  // 사용자 상태 변경
  const toggleUserStatus = async (userId: string, disabled: boolean) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        disabled: disabled,
        updatedAt: new Date()
      });

      // 로컬 상태 업데이트
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, disabled } : user
      ));

      alert(texts.operationSuccess);
    } catch (err) {
      console.error('사용자 상태 변경 실패:', err);
      alert(texts.operationError);
    }
  };

  // 사용자 역할 변경
  const changeUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date()
      });

      // 로컬 상태 업데이트
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));

      alert(texts.operationSuccess);
    } catch (err) {
      console.error('사용자 역할 변경 실패:', err);
      alert(texts.operationError);
    }
  };

  // 통계 계산
  const stats = {
    total: users.length,
    active: users.filter(u => !u.disabled).length,
    disabled: users.filter(u => u.disabled).length,
    admins: users.filter(u => u.role === 'admin').length,
    regularUsers: users.filter(u => u.role === 'user').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">{texts.loading}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-700">
                {texts.backToDashboard}
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">{texts.title}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow p-4"
          >
            <div className="text-sm font-medium text-gray-500">{texts.totalUsers}</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow p-4"
          >
            <div className="text-sm font-medium text-gray-500">{texts.activeUsers}</div>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow p-4"
          >
            <div className="text-sm font-medium text-gray-500">{texts.disabledUsers}</div>
            <div className="text-2xl font-bold text-red-600">{stats.disabled}</div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow p-4"
          >
            <div className="text-sm font-medium text-gray-500">{texts.admins}</div>
            <div className="text-2xl font-bold text-blue-600">{stats.admins}</div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow p-4"
          >
            <div className="text-sm font-medium text-gray-500">{texts.regularUsers}</div>
            <div className="text-2xl font-bold text-gray-600">{stats.regularUsers}</div>
          </motion.div>
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder={texts.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'disabled')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{texts.filterAll}</option>
              <option value="active">{texts.filterActive}</option>
              <option value="disabled">{texts.filterDisabled}</option>
            </select>
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'user')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{texts.filterAll}</option>
              <option value="admin">{texts.filterAdmins}</option>
              <option value="user">{texts.filterUsers}</option>
            </select>
          </div>
        </div>

        {/* 사용자 목록 */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.email}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.name}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.role}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.status}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.lastSignIn}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.lastActivity}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.photoURL && (
                          <Image 
                            className="h-8 w-8 rounded-full mr-3" 
                            src={user.photoURL} 
                            alt={`${user.displayName || user.email} 프로필`}
                            width={32}
                            height={32}
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.displayName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'admin' ? texts.admin : texts.user}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.disabled 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.disabled ? texts.disabled : texts.active}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastSignInAt 
                        ? new Date(user.lastSignInAt).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US')
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastActivityAt 
                        ? new Date(user.lastActivityAt).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US')
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          href={`/admin/users/activity/${user.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {texts.viewActivity}
                        </Link>
                        
                        {user.disabled ? (
                          <button
                            onClick={() => {
                              if (confirm(texts.enableConfirm)) {
                                toggleUserStatus(user.id, false);
                              }
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            {texts.enableUser}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (confirm(texts.disableConfirm)) {
                                toggleUserStatus(user.id, true);
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            {texts.disableUser}
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            const newRole = user.role === 'admin' ? 'user' : 'admin';
                            if (confirm(texts.roleChangeConfirm)) {
                              changeUserRole(user.id, newRole);
                            }
                          }}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          {texts.changeRole}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {texts.noUsers}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 