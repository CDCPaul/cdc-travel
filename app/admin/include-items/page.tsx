"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";

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
    setNewKo("");
    setNewEn("");
    fetchItems();
  };

  // 삭제
  const handleDelete = async (id: string) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    await deleteDoc(doc(db, "includeItems", id));
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
      <h1 className="text-2xl font-bold mb-6">포함사항 관리</h1>
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
        <ul className="divide-y divide-gray-200">
          {items.map(item => (
            <li key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2">
              {editingId === item.id ? (
                <>
                  <input
                    type="text"
                    value={editKo}
                    onChange={e => setEditKo(e.target.value)}
                    className="flex-1 border rounded px-2 py-1"
                  />
                  <input
                    type="text"
                    value={editEn}
                    onChange={e => setEditEn(e.target.value)}
                    className="flex-1 border rounded px-2 py-1"
                  />
                  <button
                    onClick={() => handleEditSave(item.id!)}
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 font-semibold"
                  >저장</button>
                  <button
                    onClick={cancelEdit}
                    className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400 font-semibold"
                  >취소</button>
                </>
              ) : (
                <>
                  <span className="flex-1">{item.ko}</span>
                  <span className="flex-1 text-gray-500">{item.en}</span>
                  <button
                    onClick={() => startEdit(item)}
                    className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500 font-semibold"
                  >편집</button>
                  <button
                    onClick={() => handleDelete(item.id!)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 font-semibold"
                  >삭제</button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 