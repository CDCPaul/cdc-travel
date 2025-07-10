import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Firebase Admin SDK를 사용하여 토큰 검증
    const auth = getAuth(initializeFirebaseAdmin());
    const decodedToken = await auth.verifyIdToken(idToken);

    return NextResponse.json({
      success: true,
      decodedToken: {
        email: decodedToken.email,
        uid: decodedToken.uid,
        email_verified: decodedToken.email_verified,
        auth_time: decodedToken.auth_time,
        iat: decodedToken.iat,
        exp: decodedToken.exp,
      },
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
} 