import { NextResponse } from 'next/server';

export async function POST() {
  // 쿠키 삭제 (expires를 과거로)
  const res = NextResponse.json({ success: true });
  
  // ID Token 쿠키 제거
  res.headers.append('Set-Cookie', 'idToken=; Path=/; HttpOnly; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  
  // Google Access Token 쿠키도 제거
  res.headers.append('Set-Cookie', 'googleAccessToken=; Path=/; HttpOnly; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  
  console.log('🚪 로그아웃: 모든 토큰 쿠키 제거됨');
  
  return res;
} 