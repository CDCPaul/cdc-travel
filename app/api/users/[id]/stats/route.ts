import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getAdminDb();

    // 각 컬렉션에서 해당 사용자가 생성/삭제한 항목 수 계산
    const stats = {
      spots: {
        created: 0,
        deleted: 0
      },
      products: {
        created: 0,
        deleted: 0
      },
      ta: {
        created: 0,
        deleted: 0
      },
      emails: {
        sent: 0
      },
      banners: {
        created: 0,
        deleted: 0
      },
      itineraries: {
        created: 0,
        deleted: 0
      },
      letters: {
        created: 0,
        deleted: 0
      },
      posters: {
        created: 0,
        deleted: 0
      }
    };

    // 스팟 통계 (현재 spots 컬렉션이 없으므로 0으로 설정)
    stats.spots.created = 0;
    stats.spots.deleted = 0;

    // 상품 통계 (현재 products 컬렉션이 없으므로 0으로 설정)
    stats.products.created = 0;
    stats.products.deleted = 0;

    // TA 통계
    try {
      const taSnapshot = await db.collection('tas')
        .where('createdBy', '==', id)
        .get();
      stats.ta.created = taSnapshot.size;

      const deletedTaSnapshot = await db.collection('tas')
        .where('deletedBy', '==', id)
        .get();
      stats.ta.deleted = deletedTaSnapshot.size;
    } catch (error) {
      console.error('TA 통계 조회 실패:', error);
    }

    // 이메일 통계
    try {
      const emailsSnapshot = await db.collection('email_history')
        .where('sentBy', '==', id)
        .get();
      stats.emails.sent = emailsSnapshot.size;
    } catch (error) {
      console.error('이메일 통계 조회 실패:', error);
    }

    // 배너 통계
    try {
      const bannersSnapshot = await db.collection('settings/banners/items')
        .where('createdBy', '==', id)
        .get();
      stats.banners.created = bannersSnapshot.size;

      const deletedBannersSnapshot = await db.collection('settings/banners/items')
        .where('deletedBy', '==', id)
        .get();
      stats.banners.deleted = deletedBannersSnapshot.size;
    } catch (error) {
      console.error('배너 통계 조회 실패:', error);
    }

    // 여행 일정 통계
    try {
      const itinerariesSnapshot = await db.collection('itineraries')
        .where('createdBy', '==', id)
        .get();
      stats.itineraries.created = itinerariesSnapshot.size;

      const deletedItinerariesSnapshot = await db.collection('itineraries')
        .where('deletedBy', '==', id)
        .get();
      stats.itineraries.deleted = deletedItinerariesSnapshot.size;
    } catch (error) {
      console.error('여행 일정 통계 조회 실패:', error);
    }

    // 편지 통계
    try {
      const lettersSnapshot = await db.collection('letters')
        .where('createdBy', '==', id)
        .get();
      stats.letters.created = lettersSnapshot.size;

      const deletedLettersSnapshot = await db.collection('letters')
        .where('deletedBy', '==', id)
        .get();
      stats.letters.deleted = deletedLettersSnapshot.size;
    } catch (error) {
      console.error('편지 통계 조회 실패:', error);
    }

    // 포스터 통계
    try {
      const postersSnapshot = await db.collection('posters')
        .where('createdBy', '==', id)
        .get();
      stats.posters.created = postersSnapshot.size;

      const deletedPostersSnapshot = await db.collection('posters')
        .where('deletedBy', '==', id)
        .get();
      stats.posters.deleted = deletedPostersSnapshot.size;
    } catch (error) {
      console.error('포스터 통계 조회 실패:', error);
    }

    // 총 통계 계산
    const totalStats = {
      totalCreated: stats.spots.created + stats.products.created + stats.ta.created + 
                   stats.banners.created + stats.itineraries.created + stats.letters.created + 
                   stats.posters.created,
      totalDeleted: stats.spots.deleted + stats.products.deleted + stats.ta.deleted + 
                   stats.banners.deleted + stats.itineraries.deleted + stats.letters.deleted + 
                   stats.posters.deleted,
      totalEmails: stats.emails.sent,
      totalActions: stats.spots.created + stats.products.created + stats.ta.created + 
                   stats.banners.created + stats.itineraries.created + stats.letters.created + 
                   stats.posters.created + stats.spots.deleted + stats.products.deleted + 
                   stats.ta.deleted + stats.banners.deleted + stats.itineraries.deleted + 
                   stats.letters.deleted + stats.posters.deleted + stats.emails.sent
    };

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        totalStats
      }
    });

  } catch (error) {
    console.error('사용자 통계 조회 실패:', error);
    return NextResponse.json(
      { error: '사용자 통계를 불러올 수 없습니다.' },
      { status: 500 }
    );
  }
} 