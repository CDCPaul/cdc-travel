"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "@/lib/firebase";
import { Banner, BannerType } from "@/types/banner";

export default function AdminBannerEditPage() {
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [type, setType] = useState<BannerType>("image");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [titleKo, setTitleKo] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [link, setLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchBanner() {
      if (!id) return;
      setLoading(true);
      try {
        const docRef = doc(db, "settings/banners/items", id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as Banner;
          setBanner({ ...data, id });
          setType(data.type);
          setUrl(data.url);
          setTitleKo(data.title_ko);
          setTitleEn(data.title_en);
          setLink(data.link);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchBanner();
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (): Promise<string> => {
    if (!file) throw new Error("파일을 선택하세요.");
    const ext = file.name.split('.').pop();
    const storageRef = ref(storage, `banners/${Date.now()}.${ext}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      let fileUrl = url;
      if (file) {
        fileUrl = await handleUpload();
      }
      if (!fileUrl) throw new Error("파일을 업로드하거나 URL을 입력하세요.");
      if (!titleKo || !titleEn) throw new Error("제목을 입력하세요.");
      if (!link) throw new Error("링크를 입력하세요.");
      const docRef = doc(db, "settings/banners/items", id);
      await updateDoc(docRef, {
        type,
        url: fileUrl,
        link,
        title_ko: titleKo,
        title_en: titleEn,
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
              action: 'bannerEdit',
              details: `배너 "${titleKo}" 수정`,
              userId: user.uid,
              userEmail: user.email
            })
          });
        }
      } catch (error) {
        console.error('활동 기록 실패:', error);
      }
      
      // router.push("/admin/banners"); // Removed as per edit hint
    } catch (e) {
      if (e instanceof Error) setError(e.message);
      else setError("오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setDeleting(true);
    try {
      const docRef = doc(db, "settings/banners/items", id);
      await deleteDoc(docRef);
      
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
              details: `배너 "${titleKo}" 삭제`,
              userId: user.uid,
              userEmail: user.email
            })
          });
        }
      } catch (error) {
        console.error('활동 기록 실패:', error);
      }
      
      // router.push("/admin/banners"); // Removed as per edit hint
    } catch (e) {
      if (e instanceof Error) setError(e.message);
      else setError("삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">로딩 중...</div>;
  }
  if (!banner) {
    return <div className="text-center py-12 text-red-500">배너를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">배너 수정</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow rounded-lg p-6">
        <div>
          <label className="block font-medium mb-1">타입</label>
          <select value={type} onChange={e => setType(e.target.value as BannerType)} className="border rounded px-3 py-2">
            <option value="image">이미지</option>
            <option value="video">영상</option>
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">파일 업로드 (새 파일로 변경 시)</label>
          <input type="file" accept={type === "image" ? "image/*" : "video/*"} onChange={handleFileChange} />
        </div>
        <div>
          <label className="block font-medium mb-1">또는 파일 URL</label>
          <input type="url" value={url} onChange={e => setUrl(e.target.value)} className="border rounded px-3 py-2 w-full" placeholder="https://..." />
        </div>
        <div>
          <label className="block font-medium mb-1">제목(한국어)</label>
          <input type="text" value={titleKo} onChange={e => setTitleKo(e.target.value)} className="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label className="block font-medium mb-1">제목(영어)</label>
          <input type="text" value={titleEn} onChange={e => setTitleEn(e.target.value)} className="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label className="block font-medium mb-1">링크</label>
          <input type="text" value={link} onChange={e => setLink(e.target.value)} className="border rounded px-3 py-2 w-full" placeholder="/about-us" />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="flex gap-2 justify-end">
          {/* <button type="button" className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={() => router.push("/admin/banners")}>취소</button> */}
          <button type="submit" className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold" disabled={saving}>{saving ? "저장 중..." : "저장"}</button>
          <button type="button" className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-semibold" onClick={handleDelete} disabled={deleting}>{deleting ? "삭제 중..." : "삭제"}</button>
        </div>
      </form>
    </div>
  );
} 