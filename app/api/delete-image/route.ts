import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';

function extractStoragePath(url: string): string | null {
  // Firebase Storage URL
  const fbBase = 'https://firebasestorage.googleapis.com/v0/b/';
  if (url.startsWith(fbBase)) {
    const pathMatch = url.match(/o\/(.*?)\?/);
    if (pathMatch && pathMatch[1]) {
      // 쿼리스트링 제거 및 이중 디코딩
      let path = pathMatch[1].split('?')[0];
      try {
        path = decodeURIComponent(path);
        path = decodeURIComponent(path); // 이중 디코딩
      } catch {}
      return path;
    }
  }
  // Google Cloud Storage 공개 URL
  const gcsBase = 'https://storage.googleapis.com/';
  if (url.startsWith(gcsBase)) {
    const withoutBase = url.replace(gcsBase, '');
    const firstSlash = withoutBase.indexOf('/');
    if (firstSlash !== -1) {
      let path = withoutBase.substring(firstSlash + 1).split('?')[0];
      try {
        path = decodeURIComponent(path);
        path = decodeURIComponent(path); // 이중 디코딩
      } catch {}
      return path;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ success: false, error: 'No url provided' }, { status: 400 });

    const filePath = extractStoragePath(url);
    console.log('서버에서 삭제 시도하는 filePath:', filePath); // 로그 추가
    if (!filePath) return NextResponse.json({ success: false, error: 'Invalid storage url' }, { status: 400 });

    // 함수 내부에서만 storage 초기화
    const storage = getStorage(initializeFirebaseAdmin());
    const bucket = storage.bucket();
    try {
      await bucket.file(filePath).delete();
      console.log('삭제 성공:', filePath);
    } catch (err: unknown) {
      // 타입가드: err가 Error & code/message 속성이 있는지 확인
      const code = typeof err === 'object' && err !== null && 'code' in err ? (err as { code?: number }).code : undefined;
      const message = typeof err === 'object' && err !== null && 'message' in err ? (err as { message?: string }).message : '';
      if (code === 404 || (typeof message === 'string' && message.includes('No such object'))) {
        console.log('이미 삭제된 파일(404):', filePath);
        return NextResponse.json({ success: true, info: 'Already deleted' });
      }
      console.log('삭제 실패:', filePath, err);
      throw err;
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message });
  }
} 