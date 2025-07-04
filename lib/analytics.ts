import { getAnalytics, logEvent as firebaseLogEvent, Analytics } from 'firebase/analytics';
import { db } from './firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { app } from './firebase';

let analytics: Analytics | null = null;

// Analytics 초기화
export const initAnalytics = (): Analytics | null => {
  if (typeof window !== 'undefined' && !analytics) {
    try {
      analytics = getAnalytics(app);
    } catch (error) {
      console.warn('Analytics initialization failed:', error);
    }
  }
  return analytics;
};

// 이벤트 타입 정의
export interface AnalyticsEvent {
  event_name: string;
  user_id?: string;
  session_id?: string;
  timestamp: Date;
  [key: string]: string | number | boolean | Date | undefined;
}

// 세션 ID 생성 및 관리
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

// 사용자 ID 생성 및 관리
function getUserId(): string {
  if (typeof window === 'undefined') return '';
  let userId = localStorage.getItem('analytics_user_id');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem('analytics_user_id', userId);
  }
  return userId;
}

// Firestore에 이벤트 저장
async function saveEventToFirestore(event: AnalyticsEvent): Promise<void> {
  try {
    await addDoc(collection(db, 'analytics_events'), {
      ...event,
      timestamp: Timestamp.fromDate(event.timestamp),
    });
  } catch (error) {
    // Firestore 저장 실패 시 콘솔 경고
    // eslint-disable-next-line no-console
    console.warn('Failed to save analytics event to Firestore:', error);
  }
}

// 이벤트 로깅 함수 (Analytics + Firestore)
export const logEvent = async (
  eventName: string,
  eventParameters?: Record<string, string | number | boolean>
): Promise<void> => {
  try {
    const analyticsInstance = analytics || initAnalytics();
    if (analyticsInstance) {
      firebaseLogEvent(analyticsInstance, eventName, eventParameters);
    }
    
    // 추가 정보 수집
    const additionalInfo: Record<string, string | number | boolean> = {};
    
    // User Agent 정보
    if (typeof window !== 'undefined') {
      additionalInfo.user_agent = navigator.userAgent;
      additionalInfo.screen_width = window.screen.width;
      additionalInfo.screen_height = window.screen.height;
      additionalInfo.viewport_width = window.innerWidth;
      additionalInfo.viewport_height = window.innerHeight;
    }
    
    // Referrer 정보
    if (typeof document !== 'undefined') {
      additionalInfo.referrer = document.referrer || 'Direct';
    }
    
    // 언어 정보
    if (typeof navigator !== 'undefined') {
      additionalInfo.language = navigator.language;
    }
    
    // 시간대 정보 (지역 추정용)
    if (typeof Intl !== 'undefined') {
      additionalInfo.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    
    // Firestore에도 저장
    const event: AnalyticsEvent = {
      event_name: eventName,
      user_id: getUserId(),
      session_id: getSessionId(),
      timestamp: new Date(),
      ...additionalInfo,
      ...eventParameters,
    };
    await saveEventToFirestore(event);
  } catch (error) {
    console.warn('Failed to log analytics event:', error);
  }
};

// 페이지 뷰 추적
export const logPageView = async (
  pageTitle: string,
  pageLocation: string,
  additionalParams?: Record<string, string | number | boolean>
): Promise<void> => {
  await logEvent('page_view', {
    page_title: pageTitle,
    page_location: pageLocation,
    ...additionalParams,
  });
};

// 투어 관련 이벤트
export const logTourView = async (
  tourId: string,
  tourTitle: string,
  location: string
): Promise<void> => {
  await logEvent('tour_view', {
    tour_id: tourId,
    tour_title: tourTitle,
    location,
  });
};

export const logTourClick = async (
  tourId: string,
  tourTitle: string,
  location: string
): Promise<void> => {
  await logEvent('tour_click', {
    tour_id: tourId,
    tour_title: tourTitle,
    location,
  });
};

// 연락처 관련 이벤트
export const logContactClick = async (
  contactType: string,
  location: string
): Promise<void> => {
  await logEvent('contact_click', {
    contact_type: contactType,
    location,
  });
};

// 배너 관련 이벤트
export const logBannerClick = async (
  bannerId: string,
  bannerTitle: string,
  location: string
): Promise<void> => {
  await logEvent('banner_click', {
    banner_id: bannerId,
    banner_title: bannerTitle,
    location,
  });
};

// 검색 관련 이벤트
export const logSearch = async (
  searchTerm: string,
  resultsCount: number
): Promise<void> => {
  await logEvent('search', {
    search_term: searchTerm,
    results_count: resultsCount,
  });
};

// 언어 변경 이벤트
export const logLanguageChange = async (
  fromLanguage: string,
  toLanguage: string
): Promise<void> => {
  await logEvent('language_change', {
    from_language: fromLanguage,
    to_language: toLanguage,
  });
};

// 스팟 관련 이벤트
export const logSpotClick = async (
  spotId: string,
  spotName: string,
  spotType: string,
  tourId?: string,
  tourTitle?: string
): Promise<void> => {
  const eventParams: Record<string, string | number | boolean> = {
    spot_id: spotId,
    spot_name: spotName,
    spot_type: spotType,
  };
  
  if (tourId) eventParams.tour_id = tourId;
  if (tourTitle) eventParams.tour_title = tourTitle;
  
  await logEvent('spot_click', eventParams);
};

// 스케줄 탭 클릭 이벤트
export const logScheduleTabClick = async (
  tourId: string,
  tourTitle: string,
  dayNumber: number
): Promise<void> => {
  await logEvent('schedule_tab_click', {
    tour_id: tourId,
    tour_title: tourTitle,
    day_number: dayNumber,
  });
};

// 전체 투어 보기 클릭 이벤트
export const logViewAllToursClick = async (
  location: string
): Promise<void> => {
  await logEvent('view_all_tours_click', {
    location,
  });
};

// 검색 이벤트
export const logSearchEvent = async (
  searchTerm: string,
  resultsCount: number,
  location: string
): Promise<void> => {
  await logEvent('search', {
    search_term: searchTerm,
    results_count: resultsCount,
    location,
  });
};

// 스크롤 이벤트 (페이지 하단 도달)
export const logScrollToBottom = async (
  pageLocation: string,
  pageTitle: string
): Promise<void> => {
  await logEvent('scroll_to_bottom', {
    page_location: pageLocation,
    page_title: pageTitle,
  });
};

// 시간 체류 이벤트 (페이지에서 30초 이상 체류)
export const logTimeOnPage = async (
  pageLocation: string,
  pageTitle: string,
  timeSpent: number
): Promise<void> => {
  await logEvent('time_on_page', {
    page_location: pageLocation,
    page_title: pageTitle,
    time_spent_seconds: timeSpent,
  });
}; 