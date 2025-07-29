import { db } from './firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { Booking, BookingPart } from '@/types/booking';

/**
 * 부서별 컬렉션 이름 매핑
 */
export const DEPARTMENT_COLLECTIONS = {
  AIR: 'AIR',
  CINT: 'CINT'
} as const;

export type DepartmentType = keyof typeof DEPARTMENT_COLLECTIONS;

/**
 * 부킹 파트에 따른 부서 결정
 */
export function getDepartmentFromPart(part: BookingPart): DepartmentType {
  switch (part) {
    case 'AIR':
      return 'AIR';
    case 'CINT':
      return 'CINT';
    default:
      return 'AIR'; // 기본값을 AIR로 변경
  }
}

/**
 * 부서별 컬렉션 경로 생성
 */
export function getDepartmentCollectionPath(department: DepartmentType): string {
  return `bookings/${DEPARTMENT_COLLECTIONS[department]}`;
}

/**
 * 부서별 컬렉션 참조 가져오기
 */
export function getDepartmentCollection(department: DepartmentType) {
  return collection(db, 'bookings', DEPARTMENT_COLLECTIONS[department]);
}

/**
 * 부서별 부킹 추가
 */
export async function addBookingToDepartment(booking: Omit<Booking, 'id'>, department: DepartmentType) {
  const departmentCollection = getDepartmentCollection(department);
  return await addDoc(departmentCollection, booking);
}

/**
 * 부서별 부킹 업데이트
 */
export async function updateBookingInDepartment(bookingId: string, updates: Partial<Booking>, department: DepartmentType) {
  const docRef = doc(db, 'bookings', DEPARTMENT_COLLECTIONS[department], bookingId);
  return await updateDoc(docRef, updates);
}

/**
 * 부서별 부킹 삭제
 */
export async function deleteBookingFromDepartment(bookingId: string, department: DepartmentType) {
  const docRef = doc(db, 'bookings', DEPARTMENT_COLLECTIONS[department], bookingId);
  return await deleteDoc(docRef);
}

/**
 * 부서별 부킹 조회
 */
export async function getBookingFromDepartment(bookingId: string, department: DepartmentType) {
  const docRef = doc(db, 'bookings', DEPARTMENT_COLLECTIONS[department], bookingId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Booking;
  }
  return null;
}

/**
 * 모든 부서의 부킹 조회 (통합)
 */
export async function getAllBookingsFromAllDepartments() {
  const allBookings: Booking[] = [];
  
  for (const department of Object.keys(DEPARTMENT_COLLECTIONS) as DepartmentType[]) {
    try {
      const departmentCollection = getDepartmentCollection(department);
      const querySnapshot = await getDocs(query(departmentCollection, orderBy('createdAt', 'desc')));
      
      querySnapshot.forEach((doc) => {
        allBookings.push({ id: doc.id, ...doc.data() } as Booking);
      });
    } catch (error) {
      console.error(`부서 ${department} 부킹 조회 실패:`, error);
    }
  }
  
  // 생성일 기준 내림차순 정렬
  return allBookings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * 특정 부서의 부킹만 조회
 */
export async function getBookingsFromDepartment(department: DepartmentType) {
  const departmentCollection = getDepartmentCollection(department);
  const querySnapshot = await getDocs(query(departmentCollection, orderBy('createdAt', 'desc')));
  
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
}

/**
 * 부서별 부킹 개수 조회
 */
export async function getBookingCountByDepartment() {
  const counts: Record<DepartmentType, number> = {
    AIR: 0,
    CINT: 0
  };
  
  for (const department of Object.keys(DEPARTMENT_COLLECTIONS) as DepartmentType[]) {
    try {
      const departmentCollection = getDepartmentCollection(department);
      const querySnapshot = await getDocs(departmentCollection);
      counts[department] = querySnapshot.size;
    } catch (error) {
      console.error(`부서 ${department} 개수 조회 실패:`, error);
    }
  }
  
  return counts;
} 