import { db } from "./firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";

// Product 타입 정의 (실제 데이터베이스 구조에 맞춤)
export interface Product {
  id?: string;
  title?: string | { ko: string; en: string };
  subtitle?: string | { ko: string; en: string };
  description?: string | { ko: string; en: string };
  price?: string | { ko: string; en: string };
  originalPrice?: string | { ko: string; en: string };
  duration?: string | { ko: string; en: string };
  imageUrl?: string;
  imageUrls?: string[];
  category?: string | { ko: string; en: string };
  region?: string | { ko: string; en: string };
  discount?: number;
  highlights?: Array<string | { ko: string; en: string }>;
  schedule?: Array<{
    day: number;
    spots: Array<{
      spotId: string;
      spotName: { ko: string; en: string };
      spotImage?: string;
    }>;
  }>;
  includedItems?: string[];
  notIncludedItems?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// 상품 리스트 불러오기
export async function fetchProducts() {
  const querySnapshot = await getDocs(collection(db, "products"));
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      // 이미지 URL 처리: imageUrls 배열이 있으면 첫 번째 이미지 사용, 없으면 imageUrl 사용
      imageUrl: data.imageUrls && data.imageUrls.length > 0 
        ? data.imageUrls[0] 
        : data.imageUrl || null
    };
  });
}

// 상품 추가하기 (예시)
export async function addProduct(product: Product) {
  const docRef = await addDoc(collection(db, "products"), product);
  return docRef.id;
} 