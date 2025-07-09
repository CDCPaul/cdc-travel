import { NextResponse } from 'next/server';

export async function POST() {
  // 쿠키 삭제 (expires를 과거로)
  const res = NextResponse.json({ success: true });
  res.headers.append('Set-Cookie', 'idToken=; Path=/; HttpOnly; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  return res;
} 