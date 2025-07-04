import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Admin 초기화
if (!getApps().length) {
  try {
    // 환경변수 디버깅 (민감한 정보는 마스킹)
    console.log('Firebase Admin SDK 초기화 중...');
    console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '설정됨' : '설정되지 않음');
    console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '설정됨' : '설정되지 않음');
    console.log('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '설정됨' : '설정되지 않음');
    
    // private key 길이 확인 (디버깅용)
    if (process.env.FIREBASE_PRIVATE_KEY) {
      console.log('Private key 길이:', process.env.FIREBASE_PRIVATE_KEY.length);
      console.log('Private key 시작:', process.env.FIREBASE_PRIVATE_KEY.substring(0, 50));
      console.log('Private key 끝:', process.env.FIREBASE_PRIVATE_KEY.substring(process.env.FIREBASE_PRIVATE_KEY.length - 50));
    }
    
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      throw new Error('Firebase Admin SDK 환경변수가 누락되었습니다.');
    }
    
    // private key 형식 정리 - 더 안전한 처리
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    if (!privateKey) {
      throw new Error('FIREBASE_PRIVATE_KEY 환경변수가 설정되지 않았습니다.');
    }
    
    console.log('원본 private key 길이:', privateKey.length);
    
    // private key가 JSON 문자열로 저장된 경우 파싱
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      try {
        privateKey = JSON.parse(privateKey);
        console.log('JSON 파싱 후 private key 길이:', privateKey.length);
      } catch (e) {
        console.error('Private key JSON 파싱 실패:', e);
        // JSON 파싱 실패 시 원본 사용
      }
    }
    
    // 개행 문자 처리 - 이중 이스케이프 처리
    privateKey = privateKey.replace(/\\\\n/g, '\n').replace(/\\n/g, '\n');
    console.log('개행 처리 후 private key 길이:', privateKey.length);
    
    // PEM 형식 확인
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      console.error('Private key가 올바른 PEM 형식이 아닙니다.');
      console.log('Private key 시작 부분:', privateKey.substring(0, 100));
      console.log('Private key 끝 부분:', privateKey.substring(privateKey.length - 100));
      
      // HTML이나 다른 형식이 섞여있는지 확인
      if (privateKey.includes('<!DOCTYPE') || privateKey.includes('<html')) {
        throw new Error('Private key에 HTML이 포함되어 있습니다. 올바른 Firebase 서비스 계정 키를 확인해주세요.');
      }
    }
    
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    
    console.log('Firebase Admin SDK 초기화 성공');
  } catch (error) {
    console.error('Firebase Admin SDK 초기화 실패:', error);
    throw error;
  }
}

const db = getFirestore();

// Analytics 데이터 타입 정의
interface AnalyticsData {
  totalUsers: number;
  totalSessions: number;
  totalPageViews: number;
  averageSessionDuration: number;
  conversionRate: number;
  topPages: Array<{ page: string; views: number }>;
  topTours: Array<{ tourId: string; tourTitle: string; views: number }>;
  topSpots: Array<{ spotId: string; spotName: string; views: number }>;
  recentEvents: Array<{ event: string; count: number; timestamp: string }>;
  timeTrends: Array<{ date: string; users: number; sessions: number }>;
  hourlyTraffic: Array<{ hour: number; users: number }>;
  trafficSources: Array<{ source: string; users: number; percentage: number }>;
  deviceStats: Array<{ device: string; users: number; percentage: number }>;
  locationStats: Array<{ country: string; users: number; percentage: number }>;
}

// IP 기반 지오로케이션 함수 (향후 사용 예정)
// async function getLocationFromIP(ip: string): Promise<{ country: string; city?: string }> {
//   try {
//     // 무료 IP 지오로케이션 API 사용
//     const response = await fetch(`http://ip-api.com/json/${ip}`);
//     const data = await response.json();
//     
//     if (data.status === 'success') {
//       return {
//         country: data.country,
//         city: data.city
//       };
//     }
//   } catch (error) {
//     console.warn('IP 지오로케이션 실패:', error);
//   }
//   
//   return { country: 'Unknown' };
// }

// 시간대 기반 지역 추정 함수
function getCountryFromTimezone(timezone: string): string {
  if (timezone.includes('Asia/Manila')) {
    return 'Philippines';
  } else if (timezone.includes('Asia/Seoul')) {
    return 'South Korea';
  } else if (timezone.includes('Asia/Tokyo')) {
    return 'Japan';
  } else if (timezone.includes('Asia/Shanghai') || timezone.includes('Asia/Beijing')) {
    return 'China';
  } else if (timezone.includes('America/New_York') || timezone.includes('America/Los_Angeles')) {
    return 'United States';
  } else if (timezone.includes('Europe/London') || timezone.includes('Europe/Paris')) {
    return 'Europe';
  } else if (timezone.includes('Asia/Singapore')) {
    return 'Singapore';
  } else if (timezone.includes('Asia/Bangkok')) {
    return 'Thailand';
  } else if (timezone.includes('Asia/Jakarta')) {
    return 'Indonesia';
  } else if (timezone.includes('Asia/Kuala_Lumpur')) {
    return 'Malaysia';
  } else if (timezone.includes('Asia/Ho_Chi_Minh')) {
    return 'Vietnam';
  } else if (timezone.includes('Asia/Taipei')) {
    return 'Taiwan';
  } else if (timezone.includes('Asia/Hong_Kong')) {
    return 'Hong Kong';
  } else if (timezone.includes('Asia/Kolkata') || timezone.includes('Asia/Mumbai')) {
    return 'India';
  } else if (timezone.includes('Australia/Sydney') || timezone.includes('Australia/Melbourne')) {
    return 'Australia';
  } else if (timezone.includes('Pacific/Auckland')) {
    return 'New Zealand';
  } else if (timezone.includes('Canada/')) {
    return 'Canada';
  } else if (timezone.includes('America/Mexico')) {
    return 'Mexico';
  } else if (timezone.includes('America/Brazil')) {
    return 'Brazil';
  } else if (timezone.includes('Europe/')) {
    return 'Europe';
  } else if (timezone.includes('Africa/')) {
    return 'Africa';
  } else if (timezone.includes('Asia/')) {
    return 'Asia';
  } else if (timezone.includes('America/')) {
    return 'Americas';
  } else if (timezone.includes('Pacific/')) {
    return 'Oceania';
  } else {
    return 'Others';
  }
}

// Firebase Analytics 이벤트 데이터 조회
async function fetchFirebaseAnalyticsData(timeRange: string): Promise<AnalyticsData> {
  try {
    console.log('Firestore 연결 테스트 중...');
    
    // Firestore 연결 테스트 (임시로 비활성화)
    try {
      const testRef = db.collection('test');
      await testRef.limit(1).get();
      console.log('Firestore 연결 성공');
    } catch (firestoreError) {
      console.log('Firestore 연결 실패, 빈 데이터 반환:', firestoreError instanceof Error ? firestoreError.message : 'Unknown error');
      return generateEmptyAnalyticsData();
    }
    
    const now = new Date();
    let startDate: Date;
    
    // 기간 설정
    switch (timeRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Firestore에서 이벤트 데이터 조회
    const eventsRef = db.collection('analytics_events');
    const snapshot = await eventsRef
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', now)
      .get();

    const events = snapshot.docs.map(doc => doc.data());
    console.log(`Firestore에서 ${events.length}개의 이벤트를 조회했습니다.`);
    
    // 기본 통계 계산
    const totalUsers = new Set(events.map(e => e.user_id)).size;
    const totalSessions = new Set(events.map(e => e.session_id)).size;
    const totalPageViews = events.filter(e => e.event_name === 'page_view').length;
    
    // 평균 세션 시간 계산
    const sessionDurations = new Map<string, number[]>();
    events.forEach(event => {
      const sessionId = event.session_id;
      if (sessionId) {
        if (!sessionDurations.has(sessionId)) {
          sessionDurations.set(sessionId, []);
        }
        sessionDurations.get(sessionId)!.push(event.timestamp.toDate().getTime());
      }
    });
    
    let averageSessionDuration = 0;
    if (sessionDurations.size > 0) {
      const durations = Array.from(sessionDurations.values()).map(timestamps => {
        if (timestamps.length > 1) {
          return Math.max(...timestamps) - Math.min(...timestamps);
        }
        return 0;
      }).filter(duration => duration > 0);
      
      averageSessionDuration = durations.length > 0 
        ? Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length / 1000)
        : 0;
    }
    
    // 페이지별 조회수
    const pageViews = new Map<string, number>();
    events.filter(e => e.event_name === 'page_view').forEach(event => {
      const page = event.page_location || event.page_title || 'Unknown';
      pageViews.set(page, (pageViews.get(page) || 0) + 1);
    });

    const topPages = Array.from(pageViews.entries())
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // 투어별 클릭 수
    const tourClicks = new Map<string, number>();
    events.filter(e => e.event_name === 'tour_click').forEach(event => {
      const tourId = event.tour_id || 'Unknown';
      const tourTitle = event.tour_title || 'Unknown Tour';
      const key = `${tourId}|${tourTitle}`;
      tourClicks.set(key, (tourClicks.get(key) || 0) + 1);
    });

    const topTours = Array.from(tourClicks.entries())
      .map(([key, views]) => {
        const [tourId, tourTitle] = key.split('|');
        return { tourId, tourTitle, views };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // 스팟별 클릭 수
    const spotClicks = new Map<string, number>();
    events.filter(e => e.event_name === 'spot_click').forEach(event => {
      const spotId = event.spot_id || 'Unknown';
      const spotName = event.spot_name || 'Unknown Spot';
      const key = `${spotId}|${spotName}`;
      spotClicks.set(key, (spotClicks.get(key) || 0) + 1);
    });

    const topSpots = Array.from(spotClicks.entries())
      .map(([key, views]) => {
        const [spotId, spotName] = key.split('|');
        return { spotId, spotName, views };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // 최근 이벤트
    const eventCounts = new Map<string, number>();
    events.forEach(event => {
      const eventName = event.event_name || 'unknown';
      eventCounts.set(eventName, (eventCounts.get(eventName) || 0) + 1);
    });

    const recentEvents = Array.from(eventCounts.entries())
      .map(([event, count]) => ({
        event: getEventDisplayName(event),
        count,
        timestamp: new Date().toISOString()
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 시간대별 접속자 (24시간)
    const hourlyTrafficMap = new Map<number, Set<string>>();
    events.forEach(event => {
      const hour = event.timestamp.toDate().getHours();
      const userId = event.user_id;
      if (userId) {
        if (!hourlyTrafficMap.has(hour)) {
          hourlyTrafficMap.set(hour, new Set());
        }
        hourlyTrafficMap.get(hour)!.add(userId);
      }
    });
    
    const hourlyTraffic = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      users: hourlyTrafficMap.get(hour)?.size || 0
    }));

    // 실제 데이터 기반 통계 계산
    // 유입경로 분석 (referrer 정보 기반)
    const trafficSourcesMap = new Map<string, Set<string>>();
    events.forEach(event => {
      const referrer = event.referrer || 'Direct';
      const userId = event.user_id;
      if (userId) {
        if (!trafficSourcesMap.has(referrer)) {
          trafficSourcesMap.set(referrer, new Set());
        }
        trafficSourcesMap.get(referrer)!.add(userId);
      }
    });

    const totalTrafficUsers = Array.from(trafficSourcesMap.values())
      .reduce((sum, users) => sum + users.size, 0);

    const trafficSources = Array.from(trafficSourcesMap.entries())
      .map(([source, users]) => ({
        source: source === 'Direct' ? 'Direct' : 
                source.includes('google') ? 'Organic Search' :
                source.includes('facebook') || source.includes('instagram') ? 'Social' :
                source.includes('naver') || source.includes('daum') ? 'Referral' :
                source.includes('mail') ? 'Email' : 'Referral',
        users: users.size,
        percentage: totalTrafficUsers > 0 ? Math.round((users.size / totalTrafficUsers) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.users - a.users)
      .slice(0, 6);

    // 디바이스별 통계 (user agent 정보 기반)
    const deviceStatsMap = new Map<string, Set<string>>();
    events.forEach(event => {
      const userAgent = event.user_agent || '';
      const userId = event.user_id;
      if (userId) {
        let device = 'Desktop';
        if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
          device = 'Mobile';
        } else if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
          device = 'Tablet';
        }
        
        if (!deviceStatsMap.has(device)) {
          deviceStatsMap.set(device, new Set());
        }
        deviceStatsMap.get(device)!.add(userId);
      }
    });

    const totalDeviceUsers = Array.from(deviceStatsMap.values())
      .reduce((sum, users) => sum + users.size, 0);

    const deviceStats = Array.from(deviceStatsMap.entries())
      .map(([device, users]) => ({
        device,
        users: users.size,
        percentage: totalDeviceUsers > 0 ? Math.round((users.size / totalDeviceUsers) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.users - a.users);

    // 지역별 통계 (시간대 기반 추정)
    const locationStatsMap = new Map<string, Set<string>>();
    events.forEach(event => {
      const timezone = event.timezone || '';
      const userId = event.user_id;
      if (userId) {
        // 시간대를 기반으로 지역 추정
        const country = getCountryFromTimezone(timezone);
        
        if (!locationStatsMap.has(country)) {
          locationStatsMap.set(country, new Set());
        }
        locationStatsMap.get(country)!.add(userId);
      }
    });

    const totalLocationUsers = Array.from(locationStatsMap.values())
      .reduce((sum, users) => sum + users.size, 0);

    const locationStats = Array.from(locationStatsMap.entries())
      .map(([country, users]) => ({
        country,
        users: users.size,
        percentage: totalLocationUsers > 0 ? Math.round((users.size / totalLocationUsers) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.users - a.users)
      .slice(0, 6);

    // 전환율 계산 (연락처 클릭 / 총 세션)
    const contactClicks = events.filter(e => e.event_name === 'contact_click').length;
    const conversionRate = totalSessions > 0 ? (contactClicks / totalSessions) * 100 : 0;

    // 시간별 트렌드 (최근 7일)
    const timeTrendsMap = new Map<string, { users: Set<string>; sessions: Set<string> }>();
    events.forEach(event => {
      const date = event.timestamp.toDate().toISOString().split('T')[0];
      const userId = event.user_id;
      const sessionId = event.session_id;
      
      if (!timeTrendsMap.has(date)) {
        timeTrendsMap.set(date, { users: new Set(), sessions: new Set() });
      }
      
      if (userId) {
        timeTrendsMap.get(date)!.users.add(userId);
      }
      if (sessionId) {
        timeTrendsMap.get(date)!.sessions.add(sessionId);
      }
    });
    
    const timeTrends = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = timeTrendsMap.get(dateStr);
      
      return {
        date: dateStr,
        users: dayData?.users.size || 0,
        sessions: dayData?.sessions.size || 0,
      };
    }).reverse();

    return {
      totalUsers,
      totalSessions,
      totalPageViews,
      averageSessionDuration,
      conversionRate: Math.round(conversionRate * 100) / 100,
      topPages,
      topTours,
      topSpots,
      recentEvents,
      timeTrends,
      hourlyTraffic,
      trafficSources,
      deviceStats,
      locationStats,
    };
  } catch (error) {
    console.error('Failed to fetch Firebase Analytics data:', error);
    console.log('빈 데이터를 반환합니다.');
    // 실패 시 빈 데이터 반환
    return generateEmptyAnalyticsData();
  }
}

// 이벤트 이름을 표시용으로 변환
function getEventDisplayName(eventName: string): string {
  const eventMap: Record<string, string> = {
    'page_view': '페이지 뷰',
    'tour_click': '투어 클릭',
    'contact_click': '연락처 클릭',
    'banner_click': '배너 클릭',
    'language_change': '언어 변경',
    'spot_click': '스팟 클릭',
    'schedule_tab_click': '스케줄 탭 클릭',
    'view_all_tours_click': '전체 투어 보기',
    'scroll_to_bottom': '페이지 하단 스크롤',
    'time_on_page': '페이지 체류 시간',
    'search': '검색',
  };
  return eventMap[eventName] || eventName;
}

// 실제 데이터가 없을 때 반환할 빈 데이터
function generateEmptyAnalyticsData(): AnalyticsData {
  return {
    totalUsers: 0,
    totalSessions: 0,
    totalPageViews: 0,
    averageSessionDuration: 0,
    conversionRate: 0,
    topPages: [],
    topTours: [],
    topSpots: [],
    recentEvents: [],
    timeTrends: [],
    hourlyTraffic: Array.from({ length: 24 }, (_, hour) => ({ hour, users: 0 })),
    trafficSources: [],
    deviceStats: [],
    locationStats: [],
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';
    
    // 환경변수 확인
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      console.warn('Firebase Admin SDK 환경변수가 설정되지 않았습니다. 빈 데이터를 반환합니다.');
      const emptyData = generateEmptyAnalyticsData();
      return NextResponse.json({
        success: true,
        data: emptyData,
        timestamp: new Date().toISOString(),
        dataSource: 'empty_data',
        timeRange,
        message: 'Firebase Admin SDK 환경변수가 설정되지 않아 빈 데이터를 반환합니다.',
      });
    }
    
    // Firebase Analytics 데이터 조회
    const analyticsData = await fetchFirebaseAnalyticsData(timeRange);

    return NextResponse.json({
      success: true,
      data: analyticsData,
      timestamp: new Date().toISOString(),
      dataSource: 'firebase_analytics',
      timeRange,
    });
  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics data',
      },
      { status: 500 }
    );
  }
} 