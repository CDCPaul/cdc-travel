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

  // 왼쪽 영역 컨트롤을 위한 새로운 상태들
  const [leftBackgroundColor, setLeftBackgroundColor] = useState("from-[#2C6E6F] via-[#3A8A8B] to-[#4A9D9E]");
  const [leftTitleKo, setLeftTitleKo] = useState("새로운 여행의 시작");
  const [leftTitleEn, setLeftTitleEn] = useState("Start Your New Journey");
  const [leftSubtitleKo, setLeftSubtitleKo] = useState("CDC Travel과 함께 특별한 순간을 만들어보세요");
  const [leftSubtitleEn, setLeftSubtitleEn] = useState("Create special moments with CDC Travel");
  const [leftTextColor, setLeftTextColor] = useState("text-white");

  // 미리 정의된 색상 옵션들
  const colorOptions = [
    { value: "from-[#2C6E6F] via-[#3A8A8B] to-[#4A9D9E]", label: "기본 청록색" },
    { value: "from-[#1E4A4B] via-[#2A6A6B] to-[#3A7D7E]", label: "어두운 청록색" },
    { value: "from-[#3A8A8B] via-[#4A9D9E] to-[#5AB0B1]", label: "밝은 청록색" },
    { value: "from-[#2A6A6B] via-[#3A7D7E] to-[#4A9091]", label: "중간 청록색" },
    { value: "from-[#4A9D9E] via-[#5AB0B1] to-[#6AC3C4]", label: "매우 밝은 청록색" },
    { value: "from-[#1A3A3A] via-[#2C6E6F] to-[#3A8A8B]", label: "다크 그린" },
    { value: "from-[#2C6E6F] via-[#4A9D9E] to-[#5AB0B1]", label: "그라데이션 그린" },
  ];

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
          
          // 왼쪽 영역 데이터 설정
          setLeftBackgroundColor(data.leftBackgroundColor || "from-[#2C6E6F] via-[#3A8A8B] to-[#4A9D9E]");
          setLeftTitleKo(data.leftTitle_ko || "새로운 여행의 시작");
          setLeftTitleEn(data.leftTitle_en || "Start Your New Journey");
          setLeftSubtitleKo(data.leftSubtitle_ko || "CDC Travel과 함께 특별한 순간을 만들어보세요");
          setLeftSubtitleEn(data.leftSubtitle_en || "Create special moments with CDC Travel");
          setLeftTextColor(data.leftTextColor || "text-white");
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
        
        // 왼쪽 영역 컨트롤 데이터
        leftBackgroundColor,
        leftTitle_ko: leftTitleKo,
        leftTitle_en: leftTitleEn,
        leftSubtitle_ko: leftSubtitleKo,
        leftSubtitle_en: leftSubtitleEn,
        leftTextColor,
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
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">배너 수정</h1>
      
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
        {/* 기본 정보 */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">기본 정보</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">타입</label>
              <select value={type} onChange={e => setType(e.target.value as BannerType)} className="border rounded px-3 py-2 w-full">
                <option value="image">이미지</option>
                <option value="video">영상</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">링크</label>
              <input type="text" value={link} onChange={e => setLink(e.target.value)} className="border rounded px-3 py-2 w-full" placeholder="/about-us" />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block font-medium mb-1">파일 업로드 (새 파일로 변경 시)</label>
            <input type="file" accept={type === "image" ? "image/*" : "video/*"} onChange={handleFileChange} />
          </div>
          
          <div className="mt-4">
            <label className="block font-medium mb-1">또는 파일 URL</label>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)} className="border rounded px-3 py-2 w-full" placeholder="https://..." />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block font-medium mb-1">제목(한국어)</label>
              <input type="text" value={titleKo} onChange={e => setTitleKo(e.target.value)} className="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block font-medium mb-1">제목(영어)</label>
              <input type="text" value={titleEn} onChange={e => setTitleEn(e.target.value)} className="border rounded px-3 py-2 w-full" />
            </div>
          </div>
        </div>

        {/* 왼쪽 영역 설정 */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">왼쪽 영역 설정</h3>
          
          <div className="mb-4">
            <label className="block font-medium mb-1">배경 색상</label>
            <select 
              value={leftBackgroundColor} 
              onChange={e => setLeftBackgroundColor(e.target.value)} 
              className="border rounded px-3 py-2 w-full"
            >
              {colorOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="mt-2 p-2 border rounded">
              <div className={`w-full h-8 bg-gradient-to-r ${leftBackgroundColor} rounded`}></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">왼쪽 제목(한국어)</label>
              <input type="text" value={leftTitleKo} onChange={e => setLeftTitleKo(e.target.value)} className="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block font-medium mb-1">왼쪽 제목(영어)</label>
              <input type="text" value={leftTitleEn} onChange={e => setLeftTitleEn(e.target.value)} className="border rounded px-3 py-2 w-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block font-medium mb-1">왼쪽 부제목(한국어)</label>
              <input type="text" value={leftSubtitleKo} onChange={e => setLeftSubtitleKo(e.target.value)} className="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block font-medium mb-1">왼쪽 부제목(영어)</label>
              <input type="text" value={leftSubtitleEn} onChange={e => setLeftSubtitleEn(e.target.value)} className="border rounded px-3 py-2 w-full" />
            </div>
          </div>

          <div className="mt-4">
            <label className="block font-medium mb-1">텍스트 색상</label>
            <select value={leftTextColor} onChange={e => setLeftTextColor(e.target.value)} className="border rounded px-3 py-2 w-full">
              <option value="text-white">흰색</option>
              <option value="text-black">검정색</option>
              <option value="text-gray-100">연한 회색</option>
              <option value="text-gray-200">회색</option>
            </select>
          </div>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="flex gap-2 justify-end">
          <button type="submit" className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold" disabled={saving}>{saving ? "저장 중..." : "저장"}</button>
          <button type="button" className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-semibold" onClick={handleDelete} disabled={deleting}>{deleting ? "삭제 중..." : "삭제"}</button>
        </div>
      </form>
    </div>
  );
} 