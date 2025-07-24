"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, writeBatch, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage, auth } from "@/lib/firebase";
import { Banner } from "@/types/banner";
import Link from "next/link";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { getAuth } from "firebase/auth";
import { useLanguage } from "../../../components/LanguageContext";

// 다국어 텍스트
const TEXT = {
  title: { ko: "배너 관리", en: "Banner Management" },
  addNew: { ko: "새 배너 추가", en: "Add New Banner" },
  backToAdmin: { ko: "관리자로 돌아가기", en: "Back to Admin" },
  noData: { ko: "등록된 배너가 없습니다.", en: "No banners found." },
  loading: { ko: "로딩 중...", en: "Loading..." },
  error: { ko: "데이터를 불러오는데 실패했습니다.", en: "Failed to load data." },
  deleteConfirm: { ko: "정말로 이 배너를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 관련된 모든 파일이 삭제됩니다.", en: "Are you sure you want to delete this banner?\n\nThis action cannot be undone and all related files will be deleted." },
  deleteSuccess: { ko: "배너가 성공적으로 삭제되었습니다.", en: "Banner deleted successfully." },
  deleteError: { ko: "배너 삭제에 실패했습니다.", en: "Failed to delete banner." },
  saveOrder: { ko: "순서 저장", en: "Save Order" },
  savingOrder: { ko: "저장 중...", en: "Saving..." },
  orderSaved: { ko: "순서가 저장되었습니다.", en: "Order saved successfully." },
  orderSaveError: { ko: "순서 저장에 실패했습니다.", en: "Failed to save order." },
  edit: { ko: "편집", en: "Edit" },
  delete: { ko: "삭제", en: "Delete" },
  deleting: { ko: "삭제 중...", en: "Deleting..." }
};

export default function AdminBannerListPage() {
  const { lang } = useLanguage();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderChanged, setOrderChanged] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [deletingBanner, setDeletingBanner] = useState<string | null>(null);

  useEffect(() => {
    const user = getAuth().currentUser;
    if (user) {
      console.log("현재 로그인한 UID:", user.uid);
      console.log("현재 로그인한 이메일:", user.email);
    } else {
      console.log("로그인된 사용자가 없습니다.");
    }
  }, []);

  useEffect(() => {
    async function fetchBanners() {
      try {
        const q = query(collection(db, "settings/banners/items"), orderBy("order"));
        const snap = await getDocs(q);
        const data: Banner[] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner));
        setBanners(data);
      } catch {
        setBanners([]);
      } finally {
        setLoading(false);
      }
    }
    fetchBanners();
  }, []);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(banners);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setBanners(reordered);
    setOrderChanged(true);
  };

  const handleSaveOrder = async () => {
    setSavingOrder(true);
    try {
      const batch = writeBatch(db);
      banners.forEach((banner, idx) => {
        const docRef = doc(db, "settings/banners/items", banner.id);
        batch.update(docRef, { order: idx + 1 });
      });
      await batch.commit();
      
      // 활동 기록
      try {
        const user = auth.currentUser;
        if (user) {
          const idToken = await user.getIdToken();
          await fetch('/api/users/activity', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              action: 'bannerOrderChange',
              details: `배너 순서 변경 - ${banners.length}개 배너`,
              userId: user.uid,
              userEmail: user.email
            })
          });
        }
      } catch (error) {
        console.error('활동 기록 실패:', error);
      }
      
      setOrderChanged(false);
    } finally {
      setSavingOrder(false);
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    if (!confirm(TEXT.deleteConfirm[lang])) {
      return;
    }

    setDeletingBanner(bannerId);
    try {
      // 배너 정보 가져오기
      const banner = banners.find(b => b.id === bannerId);
      if (!banner) {
        throw new Error('배너를 찾을 수 없습니다.');
      }

      // 삭제 정보를 기록하고 Firestore 문서 삭제
      const docRef = doc(db, "settings/banners/items", bannerId);
      const user = auth.currentUser;
      await updateDoc(docRef, {
        deletedAt: new Date(),
        deletedBy: user?.uid || ''
      });
      await deleteDoc(docRef);
      
      // Firebase Storage 파일 삭제 (URL이 Firebase Storage URL인 경우에만)
      if (banner.url && banner.url.includes('firebasestorage.googleapis.com')) {
        try {
          // URL에서 파일 경로 추출
          const urlParts = banner.url.split('/');
          const filePath = urlParts.slice(urlParts.indexOf('o') + 1).join('/');
          const decodedPath = decodeURIComponent(filePath);
          
          const storageRef = ref(storage, decodedPath);
          await deleteObject(storageRef);
          // Storage file deleted successfully
        } catch (storageError) {
          console.warn('Storage 파일 삭제 실패 (무시됨):', storageError);
          // Storage 파일 삭제 실패는 무시하고 계속 진행
        }
      }
      
      // 활동 기록
      try {
        const user = auth.currentUser;
        if (user) {
          const idToken = await user.getIdToken();
          await fetch('/api/users/activity', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              action: 'bannerDelete',
              details: `배너 "${banner?.title_ko || '제목 없음'}" 삭제`,
              userId: user.uid,
              userEmail: user.email
            })
          });
        }
      } catch (error) {
        console.error('활동 기록 실패:', error);
      }
      
      // 로컬 상태에서도 제거
      setBanners(prev => prev.filter(banner => banner.id !== bannerId));
      
      alert(TEXT.deleteSuccess[lang]);
    } catch (error) {
      console.error('배너 삭제 실패:', error);
      alert(TEXT.deleteError[lang]);
    } finally {
      setDeletingBanner(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {orderChanged && (
        <div className="mb-4 flex justify-end">
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-semibold" onClick={handleSaveOrder} disabled={savingOrder}>
            {savingOrder ? TEXT.savingOrder[lang] : TEXT.saveOrder[lang]}
          </button>
        </div>
      )}
      {loading ? (
        <div className="text-center py-12 text-gray-500">{TEXT.loading[lang]}</div>
      ) : banners.length === 0 ? (
        <div className="text-center py-12 text-gray-400">{TEXT.noData[lang]}</div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="banner-list">
            {(provided) => (
              <ul className="space-y-4" ref={provided.innerRef} {...provided.droppableProps}>
                {banners.map((banner, idx) => (
                  <Draggable key={banner.id} draggableId={banner.id} index={idx}>
                    {(provided, snapshot) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`bg-white shadow rounded-lg p-4 flex items-center justify-between transition-all ${snapshot.isDragging ? "ring-2 ring-blue-400" : ""}`}
                      >
                        <div>
                          <div className="font-semibold text-lg">{banner.title_ko} / {banner.title_en}</div>
                          <div className="text-sm text-gray-500">{banner.type.toUpperCase()} | 순서: {idx + 1} | 링크: {banner.link}</div>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/admin/banners/${banner.id}/edit`}><button className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700">{TEXT.edit[lang]}</button></Link>
                          <button 
                            className="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white disabled:opacity-50" 
                            onClick={() => handleDeleteBanner(banner.id)}
                            disabled={deletingBanner === banner.id}
                          >
                            {deletingBanner === banner.id ? TEXT.deleting[lang] : TEXT.delete[lang]}
                          </button>
                        </div>
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
} 