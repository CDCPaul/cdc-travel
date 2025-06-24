import { db } from "./firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";

// 상품 리스트 불러오기
export async function fetchProducts() {
  const querySnapshot = await getDocs(collection(db, "products"));
  return querySnapshot.docs.map(doc => {
    const data = doc.data() as { imageUrl?: string };
    return {
      id: doc.id,
      ...data,
      image: data.imageUrl // image 필드로도 접근 가능하게 매핑
    };
  });
}

// 상품 추가하기 (예시)
export async function addProduct(product: Record<string, any>) {
  const docRef = await addDoc(collection(db, "products"), product);
  return docRef.id;
} 