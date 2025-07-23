import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /admin 경로 중 /admin-login 및 그 하위 경로(슬래시, 쿼리스트링 포함)는 예외로 처리
  if (
    pathname.startsWith('/admin') &&
    !/^\/admin\/login(\/|$)/.test(pathname)
  ) {
    const idToken = request.cookies.get('idToken')?.value;
    if (!idToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // 활동 로그 기록 (비동기로 처리)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const idToken = request.cookies.get('idToken')?.value;
    if (idToken) {
      // 활동 로그를 비동기로 기록
      logActivity(request, idToken).catch(console.error);
    }
  }

  return NextResponse.next();
}

async function logActivity(request: NextRequest, idToken: string) {
  try {
    const { pathname } = request.nextUrl;
    
    // 액션 타입 결정
    let action = 'view';
    let details = `페이지 방문: ${pathname}`;
    
    if (pathname.includes('/new')) {
      action = 'create';
      details = `새 항목 생성 페이지 방문: ${pathname}`;
    } else if (pathname.includes('/edit')) {
      action = 'update';
      details = `편집 페이지 방문: ${pathname}`;
    } else if (pathname.includes('/users/')) {
      action = 'view';
      details = `사용자 관리: ${pathname}`;
    } else if (pathname.includes('/dashboard')) {
      action = 'view';
      details = `대시보드 방문`;
    }

    // 활동 로그 API 호출
    await fetch(`${request.nextUrl.origin}/api/users/activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        action,
        details,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      })
    });
  } catch (error) {
    console.error('활동 로그 기록 실패:', error);
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 