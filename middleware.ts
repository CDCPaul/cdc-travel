import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /admin 경로 중 /admin-login 및 그 하위 경로(슬래시, 쿼리스트링 포함)는 예외로 처리
  if (
    pathname.startsWith('/admin') &&
    !/^\/admin-login(\/|$)/.test(pathname)
  ) {
    const idToken = request.cookies.get('idToken')?.value;
    if (!idToken) {
      return NextResponse.redirect(new URL('/admin-login', request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 