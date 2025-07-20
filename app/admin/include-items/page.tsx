"use client";
import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { useLanguage } from '../../../components/LanguageContext';

interface IncludeItem {
  id?: string;
  ko: string;
  en: string;
}

export default function AdminIncludeItemsPage() {
  const [items, setItems] = useState<IncludeItem[]>([]);
  const [newKo, setNewKo] = useState("");
  const [newEn, setNewEn] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editKo, setEditKo] = useState("");
  const [editEn, setEditEn] = useState("");
  const [loading, setLoading] = useState(false);
  const { lang } = useLanguage();

  // TEXT 객체 추가
  const TEXT = {
    title: { ko: "포함사항 관리", en: "Included Items Management" },
    // ... 필요시 추가 ...
  };

  // 목록 불러오기
  const fetchItems = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, "includeItems"));
    const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as IncludeItem));
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // 추가
  const handleAdd = async () => {
    if (!newKo.trim() || !newEn.trim()) return;
    await addDoc(collection(db, "includeItems"), {
      ko: newKo.trim(),
      en: newEn.trim(),
      createdAt: Timestamp.now(),
    });
    
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
            action: 'includeItemCreate',
            details: `포함사항 "${newKo.trim()}" 등록`,
            userId: user.uid,
            userEmail: user.email
          })
        });
      }
    } catch (error) {
      console.error('활동 기록 실패:', error);
    }
    
    setNewKo("");
    setNewEn("");
    fetchItems();
  };

  // 삭제
  const handleDelete = async (id: string) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    
    // 삭제할 항목 정보 가져오기
    const itemToDelete = items.find(item => item.id === id);
    
    await deleteDoc(doc(db, "includeItems", id));
    
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
            action: 'includeItemDelete',
            details: `포함사항 "${itemToDelete?.ko || '제목 없음'}" 삭제`,
            userId: user.uid,
            userEmail: user.email
          })
        });
      }
    } catch (error) {
      console.error('활동 기록 실패:', error);
    }
    
    fetchItems();
  };

  // 편집 시작
  const startEdit = (item: IncludeItem) => {
    setEditingId(item.id!);
    setEditKo(item.ko);
    setEditEn(item.en);
  };

  // 편집 저장
  const handleEditSave = async (id: string) => {
    if (!editKo.trim() || !editEn.trim()) return;
    await updateDoc(doc(db, "includeItems", id), {
      ko: editKo.trim(),
      en: editEn.trim(),
      updatedAt: Timestamp.now(),
    });
    
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
            action: 'includeItemEdit',
            details: `포함사항 "${editKo.trim()}" 수정`,
            userId: user.uid,
            userEmail: user.email
          })
        });
      }
    } catch (error) {
      console.error('활동 기록 실패:', error);
    }
    
    setEditingId(null);
    setEditKo("");
    setEditEn("");
    fetchItems();
  };

  // 편집 취소
  const cancelEdit = () => {
    setEditingId(null);
    setEditKo("");
    setEditEn("");
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* 제목 부분 수정 */}
      <h1 className="text-2xl font-bold mb-6">{TEXT.title[lang as 'ko' | 'en']}</h1>
      {/* 추가 폼 */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <input
          type="text"
          placeholder="포함사항 (한국어)"
          value={newKo}
          onChange={e => setNewKo(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
        />
        <input
          type="text"
          placeholder="Include item (English)"
          value={newEn}
          onChange={e => setNewEn(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold"
        >
          등록
        </button>
      </div>
      {/* 목록 */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">로딩 중...</div>
      ) : (
        <table className="w-full border border-gray-300 rounded mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">항목</th>
              <th className="border border-gray-300 px-4 py-2">액션</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                {editingId === item.id ? (
                  <>
                    <td className="border border-gray-300 px-4 py-2">
                      <input
                        type="text"
                        value={editKo}
                        onChange={e => setEditKo(e.target.value)}
                        className="flex-1 border rounded px-2 py-1"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <input
                        type="text"
                        value={editEn}
                        onChange={e => setEditEn(e.target.value)}
                        className="flex-1 border rounded px-2 py-1"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <button
                        onClick={() => handleEditSave(item.id!)}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 font-semibold"
                      >저장</button>
                      <button
                        onClick={cancelEdit}
                        className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400 font-semibold"
                      >취소</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="border border-gray-300 px-4 py-2">
                      <span className="flex-1">{item.ko}</span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span className="flex-1 text-gray-500">{item.en}</span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <button
                        onClick={() => startEdit(item)}
                        className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500 font-semibold"
                      >편집</button>
                      <button
                        onClick={() => handleDelete(item.id!)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 font-semibold"
                      >삭제</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 