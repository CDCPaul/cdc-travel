import { NextRequest, NextResponse } from 'next/server';
import { verifyIdTokenFromCookies } from '@/lib/auth-server';
import { SpreadsheetMigrationService } from '@/lib/spreadsheet-migration';

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const authResult = await verifyIdTokenFromCookies(request.cookies);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { spreadsheetData } = body;

    if (!spreadsheetData || !Array.isArray(spreadsheetData)) {
      return NextResponse.json({ 
        error: 'Invalid spreadsheet data format' 
      }, { status: 400 });
    }

    console.log('🔄 스프레드시트 마이그레이션 시작...');
    console.log(`📊 총 ${spreadsheetData.length}개 행 처리`);

    // 스프레드시트 데이터를 부킹 데이터로 변환
    const processedBookings = SpreadsheetMigrationService.processSpreadsheetData(spreadsheetData);
    
    console.log(`✅ 변환 완료: ${processedBookings.length}개 예약`);

    // Firestore에 저장
    const result = await SpreadsheetMigrationService.saveBookingsToFirestore(processedBookings);

    return NextResponse.json({
      success: true,
      message: `마이그레이션 완료: ${result.success}개 성공, ${result.errors.length}개 실패`,
      data: {
        totalProcessed: processedBookings.length,
        successCount: result.success,
        errorCount: result.errors.length,
        errors: result.errors
      }
    });

  } catch (error) {
    console.error('마이그레이션 실패:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 