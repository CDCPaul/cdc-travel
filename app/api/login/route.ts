import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { idToken, googleAccessToken } = await req.json();
  if (!idToken) {
    return NextResponse.json({ success: false, error: 'No idToken provided' }, { status: 400 });
  }

  // 개발환경에서는 secure 옵션 없이, 운영환경에서는 secure 옵션 추가
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = [
    `Path=/`,
    `HttpOnly`,
    `SameSite=Strict`,
    isProd ? `Secure` : ''
  ].filter(Boolean).join('; ');

  const res = NextResponse.json({ success: true });
  res.headers.append('Set-Cookie', `idToken=${idToken}; ${cookieOptions}`);
  
  // Google Access Token도 쿠키에 저장
  if (googleAccessToken) {
    res.headers.append('Set-Cookie', `googleAccessToken=${googleAccessToken}; ${cookieOptions}`);
  }
  
  return res;
} 