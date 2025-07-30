import { NextRequest, NextResponse } from 'next/server';
import { verifyIdTokenFromCookies } from '@/lib/auth-server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const user = await verifyIdTokenFromCookies(request.cookies);
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const db = getAdminDb();
    
    console.log('🔍 DB 구조 상세 확인 중...');
    
    const routes: Array<{ route: string; departureIata: string; arrivalIata: string }> = [];
    const routeSet = new Set<string>();

    // 1. flight_schedules 컬렉션 자체 확인
    try {
      const flightSchedulesSnapshot = await db.collection('flight_schedules').get();
      console.log(`📊 flight_schedules 컬렉션: ${flightSchedulesSnapshot.size}개 문서`);
      
      if (flightSchedulesSnapshot.size > 0) {
        console.log('📄 문서 ID들:', flightSchedulesSnapshot.docs.map(doc => doc.id));
        
        // 각 문서의 서브컬렉션 확인
        for (const doc of flightSchedulesSnapshot.docs) {
          console.log(`🔍 ${doc.id} 문서의 서브컬렉션 확인 중...`);
          const subCollections = await doc.ref.listCollections();
          console.log(`  📁 ${doc.id}의 서브컬렉션들:`, subCollections.map(col => col.id));
          
          // routes 서브컬렉션이 있는지 확인
          const routesSubcollection = subCollections.find(col => col.id === 'routes');
          if (routesSubcollection) {
            console.log(`  ✅ ${doc.id}에서 routes 서브컬렉션 발견!`);
            
            // routes 서브컬렉션의 문서들 확인
            const routesSnapshot = await routesSubcollection.get();
            console.log(`  📄 routes 서브컬렉션: ${routesSnapshot.size}개 문서`);
            
            routesSnapshot.forEach(routeDoc => {
              const routeId = routeDoc.id;
              console.log(`    🛣️ 루트 발견: ${routeId}`);
              
              if (!routeSet.has(routeId)) {
                routeSet.add(routeId);
                const [departureIata, arrivalIata] = routeId.split('-');
                
                if (departureIata && arrivalIata) {
                  routes.push({
                    route: routeId,
                    departureIata,
                    arrivalIata
                  });
                }
              }
            });
          }
        }
      }
    } catch (error) {
      console.log('❌ flight_schedules 컬렉션 접근 실패:', error);
    }

    // 2. 직접 routes 컬렉션 확인 (최상위 레벨)
    try {
      const routesSnapshot = await db.collection('routes').get();
      console.log(`📊 최상위 routes 컬렉션: ${routesSnapshot.size}개 문서`);
      
      if (routesSnapshot.size > 0) {
        console.log('📄 routes 문서 ID들:', routesSnapshot.docs.map(doc => doc.id));
        
        routesSnapshot.forEach(routeDoc => {
          const routeId = routeDoc.id;
          console.log(`🛣️ 최상위 루트 발견: ${routeId}`);
          
          if (!routeSet.has(routeId)) {
            routeSet.add(routeId);
            const [departureIata, arrivalIata] = routeId.split('-');
            
            if (departureIata && arrivalIata) {
              routes.push({
                route: routeId,
                departureIata,
                arrivalIata
              });
            }
          }
        });
      }
    } catch (error) {
      console.log('❌ 최상위 routes 컬렉션 접근 실패:', error);
    }

    // 3. flight_schedules/routes 문서 확인 (exists 체크 제거)
    try {
      const routesDoc = db.collection('flight_schedules').doc('routes');
      
      // exists 체크를 제거하고 직접 서브컬렉션 확인
      console.log('🔍 flight_schedules/routes 문서의 서브컬렉션 확인 중...');
      const subCollections = await routesDoc.listCollections();
      console.log(`📁 routes 문서의 서브컬렉션들:`, subCollections.map(col => col.id));
      
      if (subCollections.length > 0) {
        console.log('✅ routes 문서에서 서브컬렉션 발견!');
        
        subCollections.forEach(collection => {
          const routeId = collection.id;
          console.log(`🛣️ 루트 발견: ${routeId}`);
          
          if (!routeSet.has(routeId)) {
            routeSet.add(routeId);
            const [departureIata, arrivalIata] = routeId.split('-');
            
            if (departureIata && arrivalIata) {
              routes.push({
                route: routeId,
                departureIata,
                arrivalIata
              });
            }
          }
        });
      } else {
        console.log('❌ routes 문서에 서브컬렉션이 없음');
      }
    } catch (error) {
      console.log('❌ flight_schedules/routes 문서 접근 실패:', error);
    }

    // 출발 공항 기준으로 정렬
    routes.sort((a, b) => {
      if (a.departureIata !== b.departureIata) {
        return a.departureIata.localeCompare(b.departureIata);
      }
      return a.arrivalIata.localeCompare(b.arrivalIata);
    });

    console.log(`✅ 루트 목록 조회 완료: ${routes.length}개 루트`);
    console.log('📋 발견된 루트들:', routes.map(r => `${r.departureIata}→${r.arrivalIata}`));

    return NextResponse.json({
      success: true,
      routes
    });

  } catch (error) {
    console.error('❌ 루트 목록 조회 실패:', error);
    return NextResponse.json(
      { error: '루트 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 