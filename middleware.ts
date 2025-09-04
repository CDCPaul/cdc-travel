import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 🔥 단순화: Firebase 표준 방식으로 변경
  // /admin 경로에서 기본적인 인증 체크만 수행
  if (
    pathname.startsWith('/admin') &&
    !/^\/admin\/login(\/|$)/.test(pathname)
  ) {
    // 1. Authorization 헤더 또는 쿠키에서 토큰 확인
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('idToken')?.value;
    const idToken = authHeader?.replace('Bearer ', '') || cookieToken;
    
    if (!idToken) {
      console.log('❌ 미들웨어: 토큰이 없습니다. 로그인 페이지로 리다이렉트');
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // 2. 기본적인 JWT 형식 검증만 수행
    try {
      if (!idToken.includes('.') || idToken.split('.').length !== 3) {
        console.log('❌ 미들웨어: 잘못된 토큰 형식. 로그인 페이지로 리다이렉트');
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }

      console.log('✅ 미들웨어: 기본 토큰 검증 통과');
      
      // 🔥 변경: 토큰 만료 확인은 Firebase Admin SDK에 위임
      // API 라우트에서 실제 검증을 수행하므로 여기서는 기본 검증만
      
    } catch (error) {
      console.log('❌ 미들웨어: 토큰 형식 검증 실패. 로그인 페이지로 리다이렉트', error);
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