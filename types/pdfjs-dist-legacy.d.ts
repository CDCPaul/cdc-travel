// types/pdfjs-dist.d.ts

declare module 'pdfjs-dist/legacy/build/pdf' {
    // 워커 설정 객체
    export const GlobalWorkerOptions: {
      workerSrc: string;
    };
  
    // 뷰포트 타입
    export interface PDFPageViewport {
      width: number;
      height: number;
      scale: number;
      transform: number[];
    }
  
    // 페이지 렌더링 옵션
    export interface PDFRenderParams {
      canvasContext: CanvasRenderingContext2D;
      viewport: PDFPageViewport;
    }
  
    // 렌더 태스크 타입
    export interface PDFRenderTask {
      promise: Promise<void>;
      cancel(): void;
    }
  
    // 페이지 객체 (기본 기능만)
    export interface PDFPageProxy {
      pageNumber: number;
      getViewport(params: { scale: number }): PDFPageViewport;
      render(params: PDFRenderParams): PDFRenderTask;
      getTextContent(): Promise<unknown>;
    }
  
    // 문서 객체 (기본 기능만)
    export interface PDFDocumentProxy {
      numPages: number;
      getPage(pageNumber: number): Promise<PDFPageProxy>;
      destroy(): void;
    }
  
    // getDocument() 반환 객체
    export function getDocument(src: string | Uint8Array): {
      promise: Promise<PDFDocumentProxy>;
    };
  }
  