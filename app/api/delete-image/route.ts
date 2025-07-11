import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Firebase Storage URL과 Google Cloud Storage 공개 URL 모두 지원
    const getStoragePathFromUrl = (url: string): string | null => {
      try {
        // Firebase Storage URL
        const fbBase = "https://firebasestorage.googleapis.com/v0/b/";
        if (url.startsWith(fbBase)) {
          const pathMatch = url.match(/o\/(.*?)\?/);
          if (pathMatch && pathMatch[1]) {
            return decodeURIComponent(pathMatch[1]);
          }
        }
        // Google Cloud Storage 공개 URL
        const gcsBase = "https://storage.googleapis.com/";
        if (url.startsWith(gcsBase)) {
          // https://storage.googleapis.com/[bucket]/[path]
          const withoutBase = url.replace(gcsBase, "");
          const firstSlash = withoutBase.indexOf("/");
          if (firstSlash !== -1) {
            return withoutBase.substring(firstSlash + 1);
          }
        }
        return null;
      } catch (error) {
        console.error("Error parsing storage URL:", error);
        return null;
      }
    };

    const path = getStoragePathFromUrl(url);
    if (!path) {
      return NextResponse.json({ error: 'Invalid storage URL' }, { status: 400 });
    }

    if (!adminStorage) {
      return NextResponse.json({ error: 'adminStorage is not initialized' }, { status: 500 });
    }
    const bucket = adminStorage.bucket();
    await bucket.file(path).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
} 