import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { disabled, role } = body;

    // Firebase Admin 초기화
    const auth = getAuth(initializeFirebaseAdmin());
    const db = getAdminDb();

    // 사용자 정보 업데이트
    const userRef = db.collection('users').doc(id);
    
    const updateData: Record<string, unknown> = {
      updatedAt: new Date()
    };

    if (disabled !== undefined) {
      updateData.disabled = disabled;
    }

    if (role !== undefined) {
      updateData.role = role;
    }

    await userRef.set(updateData, { merge: true });

    // Firebase Auth에서도 사용자 상태 업데이트 (disabled만)
    if (disabled !== undefined) {
      await auth.updateUser(id, {
        disabled: disabled
      });
    }

    return NextResponse.json({
      success: true,
      message: '사용자 정보가 업데이트되었습니다.'
    });

  } catch (error) {
    console.error('사용자 정보 업데이트 실패:', error);
    return NextResponse.json(
      { error: '사용자 정보를 업데이트할 수 없습니다.' },
      { status: 500 }
    );
  }
} 