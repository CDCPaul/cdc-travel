"use client";

import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { BannerType } from "@/types/banner";

export default function AdminBannerNewPage() {
  const [type, setType] = useState<BannerType>("image");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [titleKo, setTitleKo] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [link, setLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (): Promise<string> => {
    if (!file) throw new Error("파일을 선택하세요.");
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'banners');
    formData.append('optimize', 'true');
    formData.append('usage', 'banner');

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '업로드 실패');
    }

    const result = await response.json();
    return result.url;
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
      const bannersCol = collection(db, "settings/banners/items");
      const user = auth.currentUser;
      const docData = {
        type,
        url: fileUrl,
        link,
        title_ko: titleKo,
        title_en: titleEn,
        order: 999, // 임시, 목록에서 정렬 시 재조정
        active: true,
        createdAt: Date.now(),
        createdBy: user?.uid || '',
      };
      await addDoc(bannersCol, docData);
      
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
              action: 'bannerCreate',
              details: `배너 "${titleKo}" 등록`,
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

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">새 배너 등록</h1>
      
      {/* 레이아웃 안내 */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">📐 배너 레이아웃 안내</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• <strong>전체 크기:</strong> 1920px × 800px</p>
          <p>• <strong>왼쪽 영역:</strong> 720px (텍스트 + 배경)</p>
          <p>• <strong>오른쪽 영역:</strong> 1200px (이미지/영상)</p>
          <p>• <strong>권장 이미지 크기:</strong> 1200px × 800px</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow rounded-lg p-6">
        <div>
          <label className="block font-medium mb-1">타입</label>
          <select value={type} onChange={e => setType(e.target.value as BannerType)} className="border rounded px-3 py-2">
            <option value="image">이미지</option>
            <option value="video">영상</option>
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">파일 업로드</label>
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
        </div>
      </form>
    </div>
  );
} 