"use client";
import AdminLayout from "../../components/AdminLayout";
import { useEffect, useState } from "react";
import { Ebook } from "@/lib/types";
import { db, storage } from "@/lib/firebase";
import { formatDate } from "@/lib/utils";
import { collection, getDocs, query, orderBy, updateDoc, deleteDoc, doc as firestoreDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { addDoc } from "firebase/firestore";
import { useDropzone } from "react-dropzone";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";
}

export default function AdminEbookManagementPage() {
  // eBook 목록 상태
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  // 등록 폼 상태 (다국어)
  const [titleKo, setTitleKo] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [descKo, setDescKo] = useState("");
  const [descEn, setDescEn] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

      // Firestore에서 eBook 목록 불러오기
  useEffect(() => {
    // Firestore에서 eBook 목록 불러오기
    async function fetchEbooks() {
      if (!db) {
        console.warn('Firebase 데이터베이스가 초기화되지 않았습니다.');
        return;
      }
      
      const q = query(collection(db, "ebooks"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const list: Ebook[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ebook));
      setEbooks(list);
    }
    fetchEbooks();
  }, []);

  // react-dropzone 설정
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles && acceptedFiles[0]) {
        setFile(acceptedFiles[0]);
      }
    },
  });

  // PDF → 썸네일 이미지 추출 함수
  async function extractPdfThumbnail(file: File): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const pdf = await pdfjsLib.getDocument(uint8Array).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: context!, viewport }).promise;
    // canvas → blob (jpeg)
    return await new Promise<Blob>((resolve) => canvas.toBlob(blob => resolve(blob!), "image/jpeg", 0.85));
  }

  // eBook 등록 핸들러
  const handleRegister = async () => {
    setError(null);
    if (!titleKo.trim() || !titleEn.trim() || !descKo.trim() || !descEn.trim() || !file) {
      setError("제목(한/영), 설명(한/영), PDF 파일을 모두 입력/선택해 주세요.");
      return;
    }
    setLoading(true);
    try {
      // 1. PDF 파일 Storage 업로드
      const fileExt = file.name.split('.').pop();
      const fileName = `ebook_${Date.now()}.${fileExt}`;
      const storageRef = ref(storage, `ebooks/${fileName}`);
      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);

      // 2. 썸네일 추출 및 업로드
      const thumbBlob = await extractPdfThumbnail(file);
      const thumbName = `ebook_${Date.now()}_thumb.jpg`;
      const thumbRef = ref(storage, `ebooks/${thumbName}`);
      await uploadBytes(thumbRef, thumbBlob);
      const thumbUrl = await getDownloadURL(thumbRef);

      // 3. Firestore에 eBook 문서 추가 (다국어)
      await addDoc(collection(db, "ebooks"), {
        title: { ko: titleKo, en: titleEn },
        description: { ko: descKo, en: descEn },
        fileUrl,
        thumbUrl,
        isPublic: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      // 4. 목록 갱신
      const q = query(collection(db, "ebooks"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const list: Ebook[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ebook));
      setEbooks(list);
      // 5. 폼 초기화
      setTitleKo(""); setTitleEn(""); setDescKo(""); setDescEn(""); setFile(null);
    } catch (err) {
      setError("eBook 등록 중 오류가 발생했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 공개여부 토글 핸들러
  const handleTogglePublic = async (ebook: Ebook) => {
    try {
      await updateDoc(firestoreDoc(db, "ebooks", ebook.id), { isPublic: !ebook.isPublic, updatedAt: Date.now() });
      // 목록 갱신
      const q = query(collection(db, "ebooks"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const list: Ebook[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ebook));
      setEbooks(list);
    } catch (err) {
      alert("공개여부 변경 중 오류가 발생했습니다.\nError occurred while toggling visibility.");
      console.error(err);
    }
  };

  // 삭제 핸들러
  const handleDelete = async (ebook: Ebook) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    setLoading(true);
    try {
      // Firestore 문서 삭제
      await deleteDoc(firestoreDoc(db, "ebooks", ebook.id));
      // Storage PDF/썸네일 삭제
      if (ebook.fileUrl) {
        const filePath = decodeURIComponent(ebook.fileUrl.split("/o/")[1]?.split("?")[0] || "");
        if (filePath) await deleteObject(ref(storage, filePath));
      }
      if (ebook.thumbUrl) {
        const thumbPath = decodeURIComponent(ebook.thumbUrl.split("/o/")[1]?.split("?")[0] || "");
        if (thumbPath) await deleteObject(ref(storage, thumbPath));
      }
      // 목록 갱신
      const q = query(collection(db, "ebooks"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const list: Ebook[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ebook));
      setEbooks(list);
    } catch (err) {
      alert("삭제 중 오류가 발생했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">eBook 관리 / eBook Management</h1>
        <p className="text-gray-700 mb-4">회사소개 eBook을 등록, 수정, 삭제, 공개여부를 설정할 수 있습니다.<br/>You can register, edit, delete, and set visibility for About Us eBooks.</p>

        {/* eBook 등록 폼 */}
        <div className="bg-white rounded shadow p-6 mb-8 max-w-xl">
          <h2 className="text-lg font-semibold mb-4">새 eBook 등록 / Register New eBook</h2>
          <div className="flex gap-4 mb-2">
            <div className="flex-1">
              <label className="block font-medium mb-1">제목 (한국어 / Korean)</label>
              <input type="text" className="w-full border rounded px-3 py-2" value={titleKo} onChange={e => setTitleKo(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="block font-medium mb-1">제목 (영어 / English)</label>
              <input type="text" className="w-full border rounded px-3 py-2" value={titleEn} onChange={e => setTitleEn(e.target.value)} />
            </div>
          </div>
          <div className="mb-2">
            <label className="block font-medium mb-1">설명 (한국어 / Korean)</label>
            <textarea className="w-full border rounded px-3 py-2" value={descKo} onChange={e => setDescKo(e.target.value)} />
          </div>
          <div className="mb-2">
            <label className="block font-medium mb-1">설명 (영어 / English)</label>
            <textarea className="w-full border rounded px-3 py-2" value={descEn} onChange={e => setDescEn(e.target.value)} />
          </div>
          <div className="mb-4">
            <label className="block font-medium mb-1">PDF 파일 업로드</label>
            <div {...getRootProps()} className={`border-2 border-dashed rounded px-4 py-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
              <input {...getInputProps()} />
              {isDragActive ? (
                <p className="text-blue-600">여기에 PDF 파일을 놓으세요!</p>
              ) : (
                <p className="text-gray-600">여기에 PDF 파일을 드래그하거나 클릭해서 업로드하세요</p>
              )}
              {file && <div className="text-sm text-gray-700 mt-2">선택된 파일: {file.name}</div>}
            </div>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded font-semibold" onClick={handleRegister} disabled={loading}>
            {loading ? "등록 중..." : "등록"}
          </button>
          {error && <div className="text-red-600 mt-2">{error}</div>}
        </div>

        {/* eBook 목록 테이블 */}
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-4">eBook 목록 / eBook List</h2>
          <table className="w-full text-left border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border text-left w-64">제목(한/영) <br/> Title(KR/EN)</th>
                <th className="p-2 border text-left w-64">설명(한/영) <br/> Description(KR/EN)</th>
                <th className="p-2 border text-center w-32">공개여부 <br/> Visibility</th>
                <th className="p-2 border text-center w-32">등록일 <br/> Created</th>
                <th className="p-2 border text-center w-32">관리 <br/> Actions</th>
              </tr>
            </thead>
            <tbody>
              {ebooks.length === 0 ? (
                <tr><td colSpan={5} className="text-center p-4 text-gray-400">등록된 eBook이 없습니다.</td></tr>
              ) : (
                ebooks.map(ebook => (
                  <tr key={ebook.id} className="align-top">
                    <td className="p-2 border text-left align-top w-64">
                      <div>{ebook.title.ko}</div>
                      <div className="text-xs text-gray-500">{ebook.title.en}</div>
                    </td>
                    <td className="p-2 border text-left align-top w-64">
                      <div>{ebook.description.ko}</div>
                      <div className="text-xs text-gray-500">{ebook.description.en}</div>
                    </td>
                    <td className="p-3 border">
                      <div className="flex w-full justify-center items-center gap-2">
                        <button
                          className={`px-3 py-0.5 rounded font-semibold text-xs ${ebook.isPublic ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                          disabled={ebook.isPublic || loading}
                          onClick={() => !ebook.isPublic && handleTogglePublic(ebook)}
                        >공개</button>
                        <button
                          className={`px-3 py-0.5 rounded font-semibold text-xs ${!ebook.isPublic ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                          disabled={!ebook.isPublic || loading}
                          onClick={() => ebook.isPublic && handleTogglePublic(ebook)}
                        >비공개</button>
                      </div>
                    </td>
                    <td className="p-3 border text-center align-top w-32">{formatDate(new Date(ebook.createdAt), 'YYYY-MM-DD')}</td>
                    <td className="p-3 border">
                      <div className="flex w-full justify-center items-center gap-2">
                        <button
                          className="px-3 py-0.5 rounded font-semibold text-xs bg-blue-600 text-white hover:bg-blue-700 transition"
                          disabled={loading}
                          title="수정"
                        >수정</button>
                        <button
                          className="px-3 py-0.5 rounded font-semibold text-xs bg-red-600 text-white hover:bg-red-700 transition"
                          onClick={() => handleDelete(ebook)}
                          disabled={loading}
                          title="삭제"
                        >삭제</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
} 