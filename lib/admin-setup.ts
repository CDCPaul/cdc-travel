import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * 관리자 사용자 정보를 Firestore에 저장하는 함수
 * @param uid - 사용자 UID
 * @param email - 사용자 이메일
 * @param name - 사용자 이름 (선택사항)
 * @returns Promise<void>
 */
export async function createAdminUser(uid: string, email: string, name?: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    
    // 기존 사용자 정보 확인
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      console.log(`User ${uid} already exists in Firestore`);
      return;
    }
    
    // 새로운 관리자 사용자 생성
    await setDoc(userRef, {
      uid,
      email,
      name: name || email.split('@')[0], // 이메일에서 이름 추출
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log(`Admin user ${email} (${uid}) created successfully`);
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}

/**
 * 기존 이메일 기반 관리자 목록을 UID 기반으로 마이그레이션하는 함수
 * @param adminEmails - 관리자 이메일 목록
 * @param adminUids - 해당하는 UID 목록 (순서대로 매칭)
 */
export async function migrateAdminUsers(adminEmails: string[], adminUids: string[]): Promise<void> {
  if (adminEmails.length !== adminUids.length) {
    throw new Error('Email and UID arrays must have the same length');
  }
  
  for (let i = 0; i < adminEmails.length; i++) {
    const email = adminEmails[i];
    const uid = adminUids[i];
    
    try {
      await createAdminUser(uid, email);
    } catch (error) {
      console.error(`Failed to migrate admin user ${email}:`, error);
    }
  }
  
  console.log('Admin user migration completed');
}

/**
 * 관리자 권한을 확인하는 함수
 * @param uid - 사용자 UID
 * @returns Promise<boolean> - 관리자 여부
 */
export async function verifyAdminRole(uid: string): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData.role === 'admin';
    }
    
    return false;
  } catch (error) {
    console.error('Error verifying admin role:', error);
    return false;
  }
} 