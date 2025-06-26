'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { useLanguage } from '../../../components/LanguageContext';
import Link from 'next/link';
import Image from "next/image";

interface Content {
  id: string;
  title: string;
  content: string;
  category: string;
  author: string;
  imageUrl: string;
  tags: string[];
  isPublished: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

const CONTENT_TEXTS = {
  ko: {
    loading: "로딩 중...",
    backToDashboard: "← 대시보드로 돌아가기",
    title: "콘텐츠 관리",
    addNewContent: "새 글 작성",
    editContent: "글 수정",
    addNewContentForm: "새 글 작성",
    formTitle: "제목",
    formContent: "내용",
    formCategory: "카테고리",
    formAuthor: "작성자",
    formImageUpload: "썸네일 이미지 업로드",
    formImageUrl: "이미지 URL",
    formTags: "태그",
    formIsPublished: "발행",
    tagsPlaceholder: "태그를 입력하세요 (쉼표로 구분)",
    delete: "삭제",
    addTag: "태그 추가",
    save: "저장",
    edit: "수정",
    cancel: "취소",
    imageUploading: "이미지 업로드 중...",
    imageUploadError: "이미지 업로드에 실패했습니다.",
    preview: "미리보기",
    confirmDelete: "정말로 이 글을 삭제하시겠습니까?",
    editButton: "수정",
    deleteButton: "삭제",
    publishButton: "발행",
    unpublishButton: "발행 취소",
    categoryOptions: {
      news: "뉴스",
      guide: "가이드",
      review: "후기",
      tips: "팁",
      story: "스토리"
    },
    published: "발행됨",
    draft: "임시저장"
  },
  en: {
    loading: "Loading...",
    backToDashboard: "← Back to Dashboard",
    title: "Content Management",
    addNewContent: "Write New Article",
    editContent: "Edit Article",
    addNewContentForm: "Write New Article",
    formTitle: "Title",
    formContent: "Content",
    formCategory: "Category",
    formAuthor: "Author",
    formImageUpload: "Thumbnail Image Upload",
    formImageUrl: "Image URL",
    formTags: "Tags",
    formIsPublished: "Publish",
    tagsPlaceholder: "Enter tags (separated by commas)",
    delete: "Delete",
    addTag: "Add Tag",
    save: "Save",
    edit: "Edit",
    cancel: "Cancel",
    imageUploading: "Uploading image...",
    imageUploadError: "Image upload failed.",
    preview: "Preview",
    confirmDelete: "Are you sure you want to delete this article?",
    editButton: "Edit",
    deleteButton: "Delete",
    publishButton: "Publish",
    unpublishButton: "Unpublish",
    categoryOptions: {
      news: "News",
      guide: "Guide",
      review: "Review",
      tips: "Tips",
      story: "Story"
    },
    published: "Published",
    draft: "Draft"
  }
};

export default function AdminContent() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const router = useRouter();
  const { lang } = useLanguage();
  const texts = CONTENT_TEXTS[lang];

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    author: '',
    imageUrl: '',
    tags: [''],
    isPublished: false
  });

  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchContents();
      } else {
        router.push('/admin/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchContents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'content'));
      const contentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Content[];
      setContents(contentsData.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      }));
    } catch (error) {
      console.error('Error fetching contents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    const storageRef = ref(storage, `content/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const contentData = {
        ...formData,
        createdAt: editingContent ? editingContent.createdAt : new Date(),
        updatedAt: new Date()
      };

      if (editingContent) {
        await updateDoc(doc(db, 'content', editingContent.id), contentData);
      } else {
        await addDoc(collection(db, 'content'), contentData);
      }

      setFormData({
        title: '',
        content: '',
        category: '',
        author: '',
        imageUrl: '',
        tags: [''],
        isPublished: false
      });
      setShowAddForm(false);
      setEditingContent(null);
      fetchContents();
    } catch (error) {
      console.error('Error saving content:', error);
    }
  };

  const handleDelete = async (contentId: string) => {
    if (confirm(texts.confirmDelete)) {
      try {
        await deleteDoc(doc(db, 'content', contentId));
        fetchContents();
      } catch (error) {
        console.error('Error deleting content:', error);
      }
    }
  };

  const handleEdit = (content: Content) => {
    setEditingContent(content);
    setFormData({
      title: content.title,
      content: content.content,
      category: content.category,
      author: content.author,
      imageUrl: content.imageUrl,
      tags: content.tags,
      isPublished: content.isPublished
    });
    setShowAddForm(true);
  };

  const togglePublish = async (content: Content) => {
    try {
      await updateDoc(doc(db, 'content', content.id), {
        isPublished: !content.isPublished,
        updatedAt: new Date()
      });
      fetchContents();
    } catch (error) {
      console.error('Error toggling publish status:', error);
    }
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
    return <div className="min-h-screen flex items-center justify-center">{texts.loading}</div>;
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
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              {texts.addNewContent}
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
                {editingContent ? texts.editContent : texts.addNewContentForm}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{texts.formTitle}</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{texts.formCategory}</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    >
                      <option value="">{lang === 'ko' ? '카테고리 선택' : 'Select Category'}</option>
                      {Object.entries(texts.categoryOptions).map(([key, value]) => (
                        <option key={key} value={key}>{value}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{texts.formAuthor}</label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) => setFormData({...formData, author: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPublished"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({...formData, isPublished: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-900">
                      {texts.formIsPublished}
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{texts.formImageUpload}</label>
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
                          setImageUploadError(texts.imageUploadError);
                        } finally {
                          setImageUploading(false);
                        }
                      }}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                    {imageUploading && <div className="text-blue-600 text-sm mt-1">{texts.imageUploading}</div>}
                    {imageUploadError && <div className="text-red-600 text-sm mt-1">{imageUploadError}</div>}
                    {formData.imageUrl && formData.imageUrl !== "" && (
                      <Image
                        src={formData.imageUrl}
                        alt={texts.preview}
                        width={400}
                        height={250}
                        className="mt-2 h-24 rounded-md border"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{texts.formImageUrl}</label>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">{texts.formContent}</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    rows={10}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">{texts.formTags}</label>
                  {formData.tags.map((tag, index) => (
                    <div key={index} className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={tag}
                        onChange={(e) => updateArrayItem('tags', index, e.target.value)}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                        placeholder={texts.tagsPlaceholder}
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayItem('tags', index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-md"
                      >
                        {texts.delete}
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayItem('tags', '')}
                    className="mt-2 px-3 py-1 bg-green-500 text-white rounded-md text-sm"
                  >
                    {texts.addTag}
                  </button>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    {editingContent ? texts.edit : texts.save}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingContent(null);
                      setFormData({
                        title: '',
                        content: '',
                        category: '',
                        author: '',
                        imageUrl: '',
                        tags: [''],
                        isPublished: false
                      });
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
                  >
                    {texts.cancel}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Content List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {contents.map((content) => (
                <li key={content.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {content.imageUrl && (
                        <Image
                          src={content.imageUrl}
                          alt={typeof content.title === 'object' ? ((content.title as Record<string, string>)?.[lang] || (content.title as Record<string, string>)?.ko || '') : (content.title || '')}
                          width={100}
                          height={100}
                          className="w-16 h-16 object-cover rounded-md mr-4"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-medium text-gray-900">{typeof content.title === 'object' ? ((content.title as Record<string, string>)?.[lang] || (content.title as Record<string, string>)?.ko || '') : (content.title || '')}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            content.isPublished 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {content.isPublished ? texts.published : texts.draft}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {texts.categoryOptions[content.category as keyof typeof texts.categoryOptions] || content.category} • {content.author}
                        </p>
                        <p className="text-sm text-gray-600 truncate">{typeof content.content === 'object' ? ((content.content as Record<string, string>)?.[lang] || (content.content as Record<string, string>)?.ko || '') : (content.content || '')}</p>
                        {content.tags && content.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {content.tags.map((tag: string, index: number) => (
                              <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {content.createdAt && new Date(content.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => togglePublish(content)}
                        className={`px-3 py-1 rounded-md text-sm ${
                          content.isPublished
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        {content.isPublished ? texts.unpublishButton : texts.publishButton}
                      </button>
                      <button
                        onClick={() => handleEdit(content)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
                      >
                        {texts.editButton}
                      </button>
                      <button
                        onClick={() => handleDelete(content.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm"
                      >
                        {texts.deleteButton}
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