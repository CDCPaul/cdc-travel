'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import Link from 'next/link';
import Image from "next/image";

interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  duration: string;
  imageUrl: string;
  schedule: string[];
  highlights: string[];
  included: string[];
  notIncluded: string[];
  createdAt?: Date | string;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const router = useRouter();

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    duration: '',
    imageUrl: '',
    schedule: [''],
    highlights: [''],
    included: [''],
    notIncluded: ['']
  });

  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchProducts();
      } else {
        router.push('/admin/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

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

  const handleImageUpload = async (file: File) => {
    const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const productData = {
        ...formData,
        createdAt: new Date()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), productData);
      }

      setFormData({
        title: '',
        description: '',
        price: '',
        duration: '',
        imageUrl: '',
        schedule: [''],
        highlights: [''],
        included: [''],
        notIncluded: ['']
      });
      setShowAddForm(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleDelete = async (productId: string) => {
    if (confirm('정말로 이 상품을 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, 'products', productId));
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price,
      duration: product.duration,
      imageUrl: product.imageUrl,
      schedule: product.schedule,
      highlights: product.highlights,
      included: product.included,
      notIncluded: product.notIncluded
    });
    setShowAddForm(true);
  };

  const addArrayItem = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field] as string[], value]
    }));
  };

  const removeArrayItem = (field: keyof typeof formData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const updateArrayItem = (field: keyof typeof formData, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).map((item, i) => i === index ? value : item)
    }));
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-700">
                ← 대시보드로 돌아가기
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">상품 관리</h1>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              새 상품 추가
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingProduct ? '상품 수정' : '새 상품 추가'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">제목</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">가격</label>
                    <input
                      type="text"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">기간</label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">상품 이미지 업로드</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setImageUploading(true);
                        setImageUploadError('');
                        try {
                          const url = await handleImageUpload(file);
                          setFormData((prev) => ({ ...prev, imageUrl: url }));
                        } catch {
                          setImageUploadError('이미지 업로드에 실패했습니다.');
                        } finally {
                          setImageUploading(false);
                        }
                      }}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                    {imageUploading && <div className="text-blue-600 text-sm mt-1">이미지 업로드 중...</div>}
                    {imageUploadError && <div className="text-red-600 text-sm mt-1">{imageUploadError}</div>}
                    {formData.imageUrl && formData.imageUrl !== "" && (
                      <Image
                        src={formData.imageUrl}
                        alt="미리보기"
                        width={400}
                        height={250}
                        className="mt-2 h-24 rounded-md border"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">이미지 URL</label>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">설명</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={4}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>

                {/* Schedule */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">일정</label>
                  {formData.schedule.map((item, index) => (
                    <div key={index} className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateArrayItem('schedule', index, e.target.value)}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                        placeholder="일정을 입력하세요"
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayItem('schedule', index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-md"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayItem('schedule', '')}
                    className="mt-2 px-3 py-1 bg-green-500 text-white rounded-md text-sm"
                  >
                    일정 추가
                  </button>
                </div>

                {/* Highlights */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">하이라이트</label>
                  {formData.highlights.map((item, index) => (
                    <div key={index} className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateArrayItem('highlights', index, e.target.value)}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                        placeholder="하이라이트를 입력하세요"
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayItem('highlights', index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-md"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayItem('highlights', '')}
                    className="mt-2 px-3 py-1 bg-green-500 text-white rounded-md text-sm"
                  >
                    하이라이트 추가
                  </button>
                </div>

                {/* Included */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">포함 사항</label>
                  {formData.included.map((item, index) => (
                    <div key={index} className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateArrayItem('included', index, e.target.value)}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                        placeholder="포함 사항을 입력하세요"
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayItem('included', index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-md"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayItem('included', '')}
                    className="mt-2 px-3 py-1 bg-green-500 text-white rounded-md text-sm"
                  >
                    포함 사항 추가
                  </button>
                </div>

                {/* Not Included */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">불포함 사항</label>
                  {formData.notIncluded.map((item, index) => (
                    <div key={index} className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateArrayItem('notIncluded', index, e.target.value)}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                        placeholder="불포함 사항을 입력하세요"
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayItem('notIncluded', index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-md"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayItem('notIncluded', '')}
                    className="mt-2 px-3 py-1 bg-green-500 text-white rounded-md text-sm"
                  >
                    불포함 사항 추가
                  </button>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    {editingProduct ? '수정' : '추가'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingProduct(null);
                      setFormData({
                        title: '',
                        description: '',
                        price: '',
                        duration: '',
                        imageUrl: '',
                        schedule: [''],
                        highlights: [''],
                        included: [''],
                        notIncluded: ['']
                      });
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Products List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {products.map((product) => (
                <li key={product.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Image
                        src={product.imageUrl}
                        alt={product.title}
                        width={400}
                        height={250}
                        className="w-full h-48 object-cover rounded-t-xl"
                      />
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">{product.title}</h3>
                        <p className="text-sm text-gray-500">{product.price} • {product.duration}</p>
                        <p className="text-sm text-gray-600 truncate">{product.description}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
} 