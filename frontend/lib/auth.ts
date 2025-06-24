import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';

// 관리자 이메일 목록 (실제 운영 시에는 환경변수나 데이터베이스에서 관리)
const ADMIN_EMAILS = [
  'dev@cebudirectclub.com',
  // 여기에 추가 관리자 이메일을 입력하세요
];

export const isAdmin = (user: User | null): boolean => {
  if (!user || !user.email) return false;
  return ADMIN_EMAILS.includes(user.email);
};

export const requireAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

export const requireAdmin = (callback: (user: User | null, isAdmin: boolean) => void) => {
  return onAuthStateChanged(auth, (user) => {
    const adminStatus = isAdmin(user);
    callback(user, adminStatus);
  });
}; 