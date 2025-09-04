"use client";
import { useState, useEffect } from 'react';
import { Ebook } from '@/lib/types';
import { useDropzone } from 'react-dropzone';
import { addDoc } from "firebase/firestore";
import { db, storage, auth } from '@/lib/firebase';
import { formatDate } from '@/lib/utils';
import Image from 'next/image';
import { collection, getDocs, query, orderBy, updateDoc, deleteDoc, doc as firestoreDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
// PDF.js는 동적으로 클라이언트에서만 로딩

// 🔥 새로운 방식: PDF.js + Canvas로 클라이언트에서 직접 변환
async function convertPdfToImages(pdfFile: File, ebookId: string): Promise<{ pageImageUrls: string[], pageCount: number }> {
  console.log('📚 클라이언트에서 PDF → 이미지 변환 시작...');
  
  try {
    // PDF.js 동적 로딩
    const pdfjsLib = await import('pdfjs-dist/webpack.mjs');
    console.log('✅ PDF.js (Webpack 버전) 사용 준비 완료');

    // PDF 문서 로드
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfDocument = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const pageCount = pdfDocument.numPages;
    console.log(`📄 PDF 문서 로드 완료: ${pageCount}페이지`);

    const pageImageUrls: string[] = [];

    // 각 페이지를 Canvas로 렌더링 후 Firebase Storage에 업로드
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      console.log(`🖼️ ${pageNum}/${pageCount} 페이지 변환 중...`);
      
      const page = await pdfDocument.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); // 고해상도

      // Canvas 생성
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // PDF 페이지를 Canvas에 렌더링
      await page.render({
        canvasContext: ctx,
        viewport: viewport
      }).promise;

      // Canvas를 Blob으로 변환
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png', 0.9);
      });

      // Firebase Storage에 업로드
      const fileName = `ebooks/${ebookId}/pages/page-${pageNum}.png`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      pageImageUrls.push(downloadURL);
      console.log(`✅ ${pageNum}페이지 업로드 완료: ${downloadURL}`);
    }

    console.log(`🎉 전체 변환 완료: ${pageCount}페이지`);
    return { pageImageUrls, pageCount };

  } catch (error) {
    console.error('❌ 클라이언트 PDF 변환 실패:', error);
    throw error;
  }
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

  // PDF → 썸네일 이미지 추출 함수 (클라이언트 사이드에서만)
  async function extractPdfThumbnail(file: File): Promise<Blob> {
    if (typeof window === "undefined") {
      throw new Error("PDF 처리는 클라이언트 사이드에서만 가능합니다.");
    }

    // 클라이언트에서만 PDF.js 동적 로딩 (Webpack 최적화 버전)
    const pdfjsLib = await import("pdfjs-dist/webpack.mjs");
    
    // Webpack 버전은 워커 설정이 자동으로 처리됨
    console.log('✅ PDF.js (Webpack 버전) 사용 준비 완료');

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
    
    // 인증 상태 확인
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError("로그인이 필요합니다. 다시 로그인해주세요.");
      return;
    }
    
    console.log('🔐 현재 사용자:', currentUser.email);
    console.log('🔐 UID:', currentUser.uid);
    
    if (!titleKo.trim() || !titleEn.trim() || !descKo.trim() || !descEn.trim() || !file) {
      setError("제목(한/영), 설명(한/영), PDF 파일을 모두 입력/선택해 주세요.");
      return;
    }
    
    setLoading(true);
    try {
      console.log('✅ PDF.js 사용 준비 완료');
      
      // ID 토큰 갱신 (Storage 권한 문제 해결용)
      await currentUser.getIdToken(true);
      console.log('🔐 새 ID 토큰 획득 완료');
      
      // eBook ID 생성 (체계적인 파일 관리용)
      const ebookId = `ebook_${Date.now()}`;
      
      // 1. PDF 파일 Storage 업로드
      const fileExt = file.name.split('.').pop();
      const fileName = `${ebookId}/${ebookId}.${fileExt}`;
      const storageRef = ref(storage, `ebooks/${fileName}`);
      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);
      console.log('✅ PDF 업로드 완료:', fileUrl);

      // 2. 썸네일 추출 및 업로드
      const thumbBlob = await extractPdfThumbnail(file);
      const thumbName = `${ebookId}/${ebookId}_thumb.jpg`;
      const thumbRef = ref(storage, `ebooks/${thumbName}`);
      await uploadBytes(thumbRef, thumbBlob);
      const thumbUrl = await getDownloadURL(thumbRef);
      console.log('✅ 썸네일 업로드 완료:', thumbUrl);

      // 🚀 3. PDF → 이미지 변환 (클라이언트에서 직접 처리)
      console.log('🔄 PDF → 이미지 변환 시작... (새로운 클라이언트 방식)');
      const { pageImageUrls, pageCount: convertedPageCount } = await convertPdfToImages(file, ebookId);
      console.log(`✅ ${convertedPageCount}개 페이지 클라이언트 변환 완료`);
      console.log('📸 생성된 이미지 URLs:', pageImageUrls);

      // 4. Firestore에 eBook 문서 추가 (다국어 + 이미지 URLs)
      const ebookData = {
        title: { ko: titleKo, en: titleEn },
        description: { ko: descKo, en: descEn },
        fileUrl,
        thumbUrl: thumbUrl,
        pageImageUrls: pageImageUrls, // 🚀 플리핑북용 이미지 배열
        pageCount: convertedPageCount,
        ebookId: ebookId, // 파일 관리용 ID
        isPublic: true, // 🚀 자동 공개로 설정
        createdAt: new Date(),
        createdBy: auth.currentUser?.uid || "unknown"
      };
      
      console.log('💾 Firestore에 저장할 데이터:', ebookData);
      await addDoc(collection(db, "ebooks"), ebookData);

      // 4. 폼 초기화
      setTitleKo("");
      setTitleEn("");
      setDescKo("");
      setDescEn("");
      setFile(null);
      
      // 5. 목록 새로고침
      const q = query(collection(db, "ebooks"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const list: Ebook[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ebook));
      setEbooks(list);
      
      alert("eBook이 성공적으로 등록되었습니다.");
    } catch (error) {
      console.error("eBook 등록 실패:", error);
      setError("eBook 등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 공개/비공개 토글 핸들러
  const handleTogglePublic = async (ebook: Ebook) => {
    try {
      const docRef = firestoreDoc(db, "ebooks", ebook.id);
      await updateDoc(docRef, {
        isPublic: !ebook.isPublic,
        updatedAt: new Date(),
        updatedBy: auth.currentUser?.uid || "unknown"
      });
      
      // 목록 업데이트
      setEbooks(ebooks.map(e => 
        e.id === ebook.id ? { ...e, isPublic: !e.isPublic } : e
      ));
    } catch (error) {
      console.error("상태 변경 실패:", error);
      alert("상태 변경 중 오류가 발생했습니다.");
    }
  };

  // 삭제 핸들러
  const handleDelete = async (ebook: Ebook) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    
    try {
      // 1. Firestore 문서 삭제
      const docRef = firestoreDoc(db, "ebooks", ebook.id);
      await deleteDoc(docRef);
      
      // 2. Storage 파일 삭제
      if (ebook.fileUrl) {
        const fileRef = ref(storage, ebook.fileUrl);
        await deleteObject(fileRef);
      }
      
      // 3. 썸네일 삭제
      if (ebook.thumbUrl) {
        const thumbRef = ref(storage, ebook.thumbUrl);
        await deleteObject(thumbRef);
      }
      
      // 4. 목록에서 제거
      setEbooks(ebooks.filter(e => e.id !== ebook.id));
      alert("eBook이 삭제되었습니다.");
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="p-8">
      {/* 등록 폼 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">새 eBook 등록</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목 (한국어)</label>
            <input
              type="text"
              value={titleKo}
              onChange={(e) => setTitleKo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="한국어 제목을 입력하세요"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목 (영어)</label>
            <input
              type="text"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="영어 제목을 입력하세요"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">설명 (한국어)</label>
            <textarea
              value={descKo}
              onChange={(e) => setDescKo(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="한국어 설명을 입력하세요"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">설명 (영어)</label>
            <textarea
              value={descEn}
              onChange={(e) => setDescEn(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="영어 설명을 입력하세요"
            />
          </div>
        </div>
        
        {/* 파일 업로드 영역 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">PDF 파일</label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div>
                <p className="text-green-600 font-medium">✓ {file.name}</p>
                <p className="text-sm text-gray-500">클릭하여 다른 파일 선택</p>
              </div>
            ) : (
              <div>
                <p className="text-gray-600">PDF 파일을 드래그하거나 클릭하여 선택하세요</p>
                <p className="text-sm text-gray-500">PDF 파일만 업로드 가능합니다</p>
              </div>
            )}
          </div>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <button
          onClick={handleRegister}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "등록 중..." : "eBook 등록"}
        </button>
      </div>
      
      {/* eBook 목록 */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">등록된 eBook 목록</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">썸네일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등록일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ebooks.map((ebook) => (
                <tr key={ebook.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {ebook.thumbUrl ? (
                      <Image
                        src={ebook.thumbUrl}
                        alt="썸네일"
                        width={64}
                        height={80}
                        className="w-16 h-20 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-20 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No Image</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{ebook.title?.ko}</div>
                      <div className="text-sm text-gray-500">{ebook.title?.en}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {ebook.description?.ko}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      ebook.isPublic 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {ebook.isPublic ? '공개' : '비공개'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ebook.createdAt ? formatDate(ebook.createdAt, 'YYYY-MM-DD HH:mm:ss') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleTogglePublic(ebook)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {ebook.isPublic ? '비공개' : '공개'}
                      </button>
                      <button
                        onClick={() => handleDelete(ebook)}
                        className="text-red-600 hover:text-red-900"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {ebooks.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            등록된 eBook이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
} 