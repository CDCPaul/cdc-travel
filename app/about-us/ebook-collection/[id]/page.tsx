"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Ebook } from "@/lib/types";
import HTMLFlipBook from "react-pageflip";
import * as pdfjsLib from "pdfjs-dist";
import { useLanguage } from "@/components/LanguageContext";

// PDF.js 워커 설정 (클라이언트 사이드에서만)
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";
}

interface PageImage {
  src: string;
  pageNumber: number;
}

export default function EbookDetailPage() {
  const { id } = useParams();
  const { lang } = useLanguage();
  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageImages, setPageImages] = useState<PageImage[]>([]);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // 화면 크기 및 방향 변화 감지
  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }

    // 초기 크기 설정
    handleResize();

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // eBook 데이터 가져오기
  useEffect(() => {
    async function fetchEbook() {
      if (!id || typeof id !== "string") return;
      
      try {
        if (!db) {
          console.warn('Firebase 데이터베이스가 초기화되지 않았습니다.');
          return;
        }
        
        const snap = await getDoc(doc(db, "ebooks", id));
        if (snap.exists()) {
          setEbook({ id: snap.id, ...snap.data() } as Ebook);
        }
      } catch (error) {
        console.error("eBook 데이터 로딩 오류:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchEbook();
  }, [id]);

  // PDF를 이미지로 변환
  useEffect(() => {
    async function loadPdfImages() {
      if (!ebook?.fileUrl) return;
      
      setPdfLoading(true);
      setPdfError(null);
      
      try {
        const pdf = await pdfjsLib.getDocument(ebook.fileUrl).promise;
        const images: PageImage[] = [];
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          
          if (!context) {
            throw new Error("Canvas context를 가져올 수 없습니다");
          }
          
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          await page.render({ 
            canvasContext: context, 
            viewport 
          }).promise;
          
          images.push({
            src: canvas.toDataURL(),
            pageNumber: i
          });
        }
        
        setPageImages(images);
      } catch (err) {
        console.error("PDF 로딩 오류:", err);
        setPdfError("PDF 로딩 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        setPdfLoading(false);
      }
    }
    
    if (ebook?.fileUrl) {
      loadPdfImages();
    }
  }, [ebook]);

  const TOP_BAR_HEIGHT = windowSize.width < 768 ? 56 : 72;

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#e6c9a8]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7b4a1e] mx-auto mb-4"></div>
          <p className="text-[#7b4a1e]">eBook을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // eBook이 없는 경우
  if (!ebook) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#e6c9a8]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#7b4a1e] mb-2">eBook을 찾을 수 없습니다</h2>
          <p className="text-gray-600">요청하신 eBook이 존재하지 않거나 삭제되었을 수 있습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#e6c9a8] flex flex-col items-center justify-center relative p-2 md:p-4 pt-[56px] md:pt-[72px]`}>
      {/* 상단 바: 제목 + 닫기 버튼 */}
      <div className="w-full flex items-center justify-between absolute top-2 left-0 px-4 md:top-6 md:px-8 z-10" style={{height: TOP_BAR_HEIGHT}}>
        <h1 className="text-lg md:text-2xl font-bold text-[#7b4a1e] truncate max-w-[70vw] md:max-w-[80vw]">
          {ebook?.title?.[lang]}
        </h1>
        <button
          type="button"
          className="bg-[#7b4a1e] text-white px-3 py-1 md:px-4 md:py-2 rounded shadow-lg hover:bg-[#a97c50] transition-colors duration-200 text-sm md:text-base ml-2"
          onClick={() => window.close()}
          aria-label="창 닫기"
        >
          닫기 / Close
        </button>
      </div>

      <div className="w-full h-full flex flex-col items-center justify-center">
        {/* PDF eBook 뷰어 - 최대화 */}
        <div
          className="flex-1 w-full flex flex-col items-center justify-center mb-4 md:mb-8"
          style={{
            height: windowSize.height - TOP_BAR_HEIGHT,
            maxHeight: windowSize.height - TOP_BAR_HEIGHT,
          }}
        >
          {pdfLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7b4a1e] mx-auto mb-4"></div>
              <p className="text-gray-500 text-sm md:text-base">
                PDF 로딩 중...<br />
                Loading PDF...
              </p>
            </div>
          )}

          {pdfError && (
            <div className="text-red-600 py-8 text-center">
              <p className="font-semibold mb-2 text-sm md:text-base">오류 발생</p>
              <p className="text-sm md:text-base">{pdfError}</p>
            </div>
          )}

          {!pdfLoading && !pdfError && pageImages.length > 0 && (
            <div className="shadow-2xl rounded-lg overflow-hidden w-full h-full flex items-center justify-center">
              <div className="relative w-full h-full">
                <HTMLFlipBook
                  {...{
                    width: windowSize.width < 768 ? windowSize.width - 20 : Math.min(1200, windowSize.width - 40),
                    height: windowSize.height - TOP_BAR_HEIGHT,
                    size: "stretch",
                    minWidth: 300,
                    maxWidth: windowSize.width < 768 ? windowSize.width - 20 : Math.min(1400, windowSize.width - 40),
                    minHeight: 400,
                    maxHeight: windowSize.height - TOP_BAR_HEIGHT,
                    maxShadowOpacity: 0.5,
                    showCover: windowSize.width >= 768,
                    mobileScrollSupport: true,
                    flippingTime: 1000,
                    usePortrait: windowSize.width < 768,
                    startPage: 0,
                    autoSize: true,
                    className: "shadow-2xl rounded-lg h-full"
                  } as React.ComponentProps<typeof HTMLFlipBook>}
                >
                  {pageImages.map((page) => (
                    <div 
                      key={page.pageNumber} 
                      className="w-full h-full flex items-center justify-center bg-white"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={page.src} 
                        alt={`페이지 ${page.pageNumber}`}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </HTMLFlipBook>
                {/* 가운데 구분선 */}
                <div className="pointer-events-none absolute top-0 bottom-0 left-1/2 w-[2px] -translate-x-1/2 bg-[#d1bfa3] z-20" />
              </div>
            </div>
          )}
        </div>

        {/* 설명 - 하단에만 노출, 다국어 */}
        <div className="w-full max-w-4xl text-center pb-4 md:pb-8">
          <div className="text-gray-700 max-w-2xl mx-auto px-2">
            <p className="mb-1 md:mb-2 text-xs md:text-sm">{ebook?.description?.[lang]}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 