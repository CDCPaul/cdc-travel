"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageContext";
import { collection, addDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { BannerType } from "@/types/banner";

const BANNER_NEW_TEXTS = {
  ko: {
    title: "새 배너 등록",
    layoutGuide: "📐 배너 레이아웃 안내",
    totalSize: "전체 크기",
    leftArea: "왼쪽 영역",
    rightArea: "오른쪽 영역",
    recommendedImageSize: "권장 이미지 크기",
    basicInfo: "기본 정보",
    type: "타입",
    image: "이미지",
    video: "영상",
    link: "링크",
    fileUpload: "파일 업로드",
    orFileUrl: "또는 파일 URL",
    titleKo: "제목(한국어)",
    titleEn: "제목(영어)",
    leftAreaSettings: "왼쪽 영역 설정",
    backgroundColor: "배경 색상",
    leftTitleKo: "왼쪽 제목(한국어)",
    leftTitleEn: "왼쪽 제목(영어)",
    leftSubtitleKo: "왼쪽 부제목(한국어)",
    leftSubtitleEn: "왼쪽 부제목(영어)",
    textColor: "텍스트 색상",
    white: "흰색",
    black: "검정색",
    lightGray: "연한 회색",
    gray: "회색",
    save: "저장",
    saving: "저장 중...",
    error: "오류가 발생했습니다.",
    colorOptions: [
      { value: "from-[#2C6E6F] via-[#3A8A8B] to-[#4A9D9E]", label: "기본 청록색" },
      { value: "from-[#1E4A4B] via-[#2A6A6B] to-[#3A7D7E]", label: "어두운 청록색" },
      { value: "from-[#3A8A8B] via-[#4A9D9E] to-[#5AB0B1]", label: "밝은 청록색" },
      { value: "from-[#2A6A6B] via-[#3A7D7E] to-[#4A9091]", label: "중간 청록색" },
      { value: "from-[#4A9D9E] via-[#5AB0B1] to-[#6AC3C4]", label: "매우 밝은 청록색" },
      { value: "from-[#1A3A3A] via-[#2C6E6F] to-[#3A8A8B]", label: "다크 그린" },
      { value: "from-[#2C6E6F] via-[#4A9D9E] to-[#5AB0B1]", label: "그라데이션 그린" },
    ]
  },
  en: {
    title: "New Banner Registration",
    layoutGuide: "📐 Banner Layout Guide",
    totalSize: "Total Size",
    leftArea: "Left Area",
    rightArea: "Right Area",
    recommendedImageSize: "Recommended Image Size",
    basicInfo: "Basic Information",
    type: "Type",
    image: "Image",
    video: "Video",
    link: "Link",
    fileUpload: "File Upload",
    orFileUrl: "Or File URL",
    titleKo: "Title (Korean)",
    titleEn: "Title (English)",
    leftAreaSettings: "Left Area Settings",
    backgroundColor: "Background Color",
    leftTitleKo: "Left Title (Korean)",
    leftTitleEn: "Left Title (English)",
    leftSubtitleKo: "Left Subtitle (Korean)",
    leftSubtitleEn: "Left Subtitle (English)",
    textColor: "Text Color",
    white: "White",
    black: "Black",
    lightGray: "Light Gray",
    gray: "Gray",
    save: "Save",
    saving: "Saving...",
    error: "An error occurred.",
    colorOptions: [
      { value: "from-[#2C6E6F] via-[#3A8A8B] to-[#4A9D9E]", label: "Default Teal" },
      { value: "from-[#1E4A4B] via-[#2A6A6B] to-[#3A7D7E]", label: "Dark Teal" },
      { value: "from-[#3A8A8B] via-[#4A9D9E] to-[#5AB0B1]", label: "Bright Teal" },
      { value: "from-[#2A6A6B] via-[#3A7D7E] to-[#4A9091]", label: "Medium Teal" },
      { value: "from-[#4A9D9E] via-[#5AB0B1] to-[#6AC3C4]", label: "Very Bright Teal" },
      { value: "from-[#1A3A3A] via-[#2C6E6F] to-[#3A8A8B]", label: "Dark Green" },
      { value: "from-[#2C6E6F] via-[#4A9D9E] to-[#5AB0B1]", label: "Gradient Green" },
    ]
  }
};

export default function AdminBannerNewPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const texts = BANNER_NEW_TEXTS[lang as keyof typeof BANNER_NEW_TEXTS];
  const [type, setType] = useState<BannerType>("image");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [titleKo, setTitleKo] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [link, setLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 왼쪽 영역 컨트롤을 위한 새로운 상태들
  const [leftBackgroundColor, setLeftBackgroundColor] = useState("from-[#2C6E6F] via-[#3A8A8B] to-[#4A9D9E]");
  const [leftTitleKo, setLeftTitleKo] = useState("새로운 여행의 시작");
  const [leftTitleEn, setLeftTitleEn] = useState("Start Your New Journey");
  const [leftSubtitleKo, setLeftSubtitleKo] = useState("CDC Travel과 함께 특별한 순간을 만들어보세요");
  const [leftSubtitleEn, setLeftSubtitleEn] = useState("Create special moments with CDC Travel");
  const [leftTextColor, setLeftTextColor] = useState("text-white");

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
        
        // 왼쪽 영역 컨트롤 데이터
        leftBackgroundColor,
        leftTitle_ko: leftTitleKo,
        leftTitle_en: leftTitleEn,
        leftSubtitle_ko: leftSubtitleKo,
        leftSubtitle_en: leftSubtitleEn,
        leftTextColor,
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
      
      router.push("/admin/banners");
    } catch (e) {
      if (e instanceof Error) setError(e.message);
      else setError(texts.error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">{texts.title}</h1>
      
      {/* 레이아웃 안내 */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">{texts.layoutGuide}</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• <strong>{texts.totalSize}:</strong> 1920px × 800px</p>
          <p>• <strong>{texts.leftArea}:</strong> 720px (텍스트 + 배경)</p>
          <p>• <strong>{texts.rightArea}:</strong> 1200px (이미지/영상)</p>
          <p>• <strong>{texts.recommendedImageSize}:</strong> 1200px × 800px</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow rounded-lg p-6">
        {/* 기본 정보 */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">{texts.basicInfo}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">{texts.type}</label>
              <select value={type} onChange={e => setType(e.target.value as BannerType)} className="border rounded px-3 py-2 w-full">
                <option value="image">{texts.image}</option>
                <option value="video">{texts.video}</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">{texts.link}</label>
              <input type="text" value={link} onChange={e => setLink(e.target.value)} className="border rounded px-3 py-2 w-full" placeholder="/about-us" />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block font-medium mb-1">{texts.fileUpload}</label>
            <input type="file" accept={type === "image" ? "image/*" : "video/*"} onChange={handleFileChange} />
          </div>
          
          <div className="mt-4">
            <label className="block font-medium mb-1">{texts.orFileUrl}</label>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)} className="border rounded px-3 py-2 w-full" placeholder="https://..." />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block font-medium mb-1">{texts.titleKo}</label>
              <input type="text" value={titleKo} onChange={e => setTitleKo(e.target.value)} className="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block font-medium mb-1">{texts.titleEn}</label>
              <input type="text" value={titleEn} onChange={e => setTitleEn(e.target.value)} className="border rounded px-3 py-2 w-full" />
            </div>
          </div>
        </div>

        {/* 왼쪽 영역 설정 */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">{texts.leftAreaSettings}</h3>
          
          <div className="mb-4">
            <label className="block font-medium mb-1">{texts.backgroundColor}</label>
            <select 
              value={leftBackgroundColor} 
              onChange={e => setLeftBackgroundColor(e.target.value)} 
              className="border rounded px-3 py-2 w-full"
            >
              {texts.colorOptions.map((option) => (
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
              <label className="block font-medium mb-1">{texts.leftTitleKo}</label>
              <input type="text" value={leftTitleKo} onChange={e => setLeftTitleKo(e.target.value)} className="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block font-medium mb-1">{texts.leftTitleEn}</label>
              <input type="text" value={leftTitleEn} onChange={e => setLeftTitleEn(e.target.value)} className="border rounded px-3 py-2 w-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block font-medium mb-1">{texts.leftSubtitleKo}</label>
              <input type="text" value={leftSubtitleKo} onChange={e => setLeftSubtitleKo(e.target.value)} className="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block font-medium mb-1">{texts.leftSubtitleEn}</label>
              <input type="text" value={leftSubtitleEn} onChange={e => setLeftSubtitleEn(e.target.value)} className="border rounded px-3 py-2 w-full" />
            </div>
          </div>

          <div className="mt-4">
            <label className="block font-medium mb-1">{texts.textColor}</label>
            <select value={leftTextColor} onChange={e => setLeftTextColor(e.target.value)} className="border rounded px-3 py-2 w-full">
              <option value="text-white">{texts.white}</option>
              <option value="text-black">{texts.black}</option>
              <option value="text-gray-100">{texts.lightGray}</option>
              <option value="text-gray-200">{texts.gray}</option>
            </select>
          </div>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="flex gap-2 justify-end">
          <button type="submit" className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold" disabled={saving}>{saving ? texts.saving : texts.save}</button>
        </div>
      </form>
    </div>
  );
} 