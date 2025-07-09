'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useLanguage } from '../../../components/LanguageContext';
import Link from 'next/link';
import Image from "next/image";
import { CalendarIcon, MapPinIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

interface Product {
  id: string;
  title?: { ko: string; en: string };
  description?: { ko: string; en: string };
  price?: {
    KRW?: string;
    PHP?: string;
    USD?: string;
  };
  duration?: {
    startDate?: string;
    endDate?: string;
  };
  country?: { en: string; ko: string };
  region?: { ko: string; en: string };
  imageUrls?: string[];
  schedule?: Array<{
    day: number;
    spots: Array<{
      spotId: string;
      spotName: { ko: string; en: string };
      spotImage?: string;
    }>;
  }>;
  highlights?: Array<{
    spotId: string;
    spotName: { ko: string; en: string };
  }>;
  includedItems?: string[];
  notIncludedItems?: string[];
  createdAt?: Date | string;
}

const PRODUCTS_TEXTS = {
  ko: {
    loading: "로딩 중...",
    backToDashboard: "← 대시보드로 돌아가기",
    title: "상품 관리",
    addNewProduct: "새 상품 추가",
    editButton: "수정",
    deleteButton: "삭제",
    confirmDelete: "정말로 이 상품을 삭제하시겠습니까?",
    deleted: "삭제되었습니다.",
    deleteFailed: "삭제에 실패했습니다.",
    noData: "등록된 상품이 없습니다."
  },
  en: {
    loading: "Loading...",
    backToDashboard: "← Back to Dashboard",
    title: "Product Management",
    addNewProduct: "Add New Product",
    editButton: "Edit",
    deleteButton: "Delete",
    confirmDelete: "Are you sure you want to delete this product?",
    deleted: "Deleted.",
    deleteFailed: "Failed to delete.",
    noData: "No products found."
  }
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { lang } = useLanguage();
  const texts = PRODUCTS_TEXTS[lang];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleDelete = async (productId: string) => {
    if (window.confirm(texts.confirmDelete)) {
      try {
        await deleteDoc(doc(db, 'products', productId));
        alert(texts.deleted);
        const fetchProducts = async () => {
          try {
            const querySnapshot = await getDocs(collection(db, 'products'));
            const productsData = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Product[];
            setProducts(productsData);
          } catch (error) {
            console.error('Error fetching products:', error);
          } finally {
            setLoading(false);
          }
        };
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert(texts.deleteFailed);
      }
    }
  };

  if (loading) {
    return <div className="p-6">{texts.loading}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
        {texts.backToDashboard}
      </Link>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{texts.title}</h1>
        <Link
          href="/admin/products/new"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 shadow"
        >
          {texts.addNewProduct}
        </Link>
      </div>
      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">{texts.noData}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
              {product.imageUrls && product.imageUrls.length > 0 && (
                <div className="relative h-48">
                  <Image
                    src={product.imageUrls[0]}
                    alt={product.title?.[lang] || 'Product'}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-semibold mb-1 line-clamp-1">{product.title?.[lang] || '제목 없음'}</h3>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description?.[lang] || '설명 없음'}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <MapPinIcon className="w-4 h-4" />
                  <span>
                    {product.country?.ko || '국가 미지정'} - {product.region?.ko || '지역 미지정'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <CalendarIcon className="w-4 h-4" />
                  <span>
                    {product.duration?.startDate || '시작일 미지정'} ~ {product.duration?.endDate || '종료일 미지정'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <CurrencyDollarIcon className="w-4 h-4" />
                  <span>
                    {product.price?.KRW && `₩${product.price.KRW}`}
                    {product.price?.PHP && ` ₱${product.price.PHP}`}
                    {product.price?.USD && ` $${product.price.USD}`}
                    {!product.price?.KRW && !product.price?.PHP && !product.price?.USD && '가격 미지정'}
                  </span>
                </div>
                <div className="flex gap-2 mt-auto">
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 text-center shadow"
                  >
                    {texts.editButton}
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="flex-1 px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 shadow"
                  >
                    {texts.deleteButton}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 