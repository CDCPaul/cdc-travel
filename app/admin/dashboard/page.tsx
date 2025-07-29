'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '../../../components/LanguageContext';
import { logPageView } from '@/lib/analytics';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { testTokenRefresh } from '@/lib/auth';

// 통계 데이터 타입 정의
interface AnalyticsData {
  totalUsers: number;
  totalPageViews: number;
  totalSessions: number;
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

const DASHBOARD_TEXTS = {
  ko: {
    title: "통계 대시보드",
    subtitle: "CDC Travel 웹사이트 분석",
    totalUsers: "총 사용자",
    totalPageViews: "총 페이지 조회",
    totalSessions: "총 세션",
    averageSessionDuration: "평균 세션 시간",
    conversionRate: "전환율",
    topPages: "인기 페이지",
    topTours: "인기 상품",
    topSpots: "인기 스팟",
    recentEvents: "인기 이벤트",
    timeTrends: "시간별 트렌드",
    hourlyTraffic: "시간대별 접속자",
    trafficSources: "유입 경로",
    deviceStats: "디바이스별 통계",
    locationStats: "지역별 통계",
    loading: "데이터를 불러오는 중...",
    noData: "데이터가 없습니다",
    refresh: "새로고침",
    lastUpdated: "마지막 업데이트",
    minutes: "분",
    percentage: "%",
    today: "오늘",
    yesterday: "어제",
    thisWeek: "이번 주",
    thisMonth: "이번 달",
    lastMonth: "지난 달",
    custom: "커스텀",
    error: "데이터를 불러오는데 실패했습니다",
    retry: "다시 시도"
  },
  en: {
    title: "Analytics Dashboard",
    subtitle: "CDC Travel Website Analytics",
    totalUsers: "Total Users",
    totalPageViews: "Total Page Views",
    totalSessions: "Total Sessions",
    averageSessionDuration: "Avg Session Duration",
    conversionRate: "Conversion Rate",
    topPages: "Top Pages",
    topTours: "Top Tours",
    topSpots: "Top Spots",
    recentEvents: "Recent Events",
    timeTrends: "Time Trends",
    hourlyTraffic: "Hourly Traffic",
    trafficSources: "Traffic Sources",
    deviceStats: "Device Statistics",
    locationStats: "Location Statistics",
    loading: "Loading data...",
    noData: "No data available",
    refresh: "Refresh",
    lastUpdated: "Last Updated",
    minutes: "min",
    percentage: "%",
    today: "Today",
    yesterday: "Yesterday",
    thisWeek: "This Week",
    thisMonth: "This Month",
    lastMonth: "Last Month",
    custom: "Custom",
    error: "Failed to load data",
    retry: "Retry"
  }
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const timeRange = '30d'; // 고정값으로 설정
  const { lang } = useLanguage();
  const texts = DASHBOARD_TEXTS[lang];
  const [isTestLoading, setIsTestLoading] = useState(false);
  const { user } = useAuth();

  // Analytics API에서 데이터 가져오기
  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/analytics?timeRange=${timeRange}`);
      const result = await response.json();
      
      if (result.success) {
        setAnalyticsData(result.data);
      } else {
        setError(result.error || texts.error);
      }
    } catch (err) {
      console.error('Failed to fetch analytics data:', err);
      setError(texts.error);
    } finally {
      setLoading(false);
    }
  }, [timeRange, texts.error]);

  useEffect(() => {
    // AuthContext에서 user 정보 사용 - 중복된 onAuthStateChanged 제거
    if (user) {
      logPageView('Admin Dashboard', '/admin/dashboard', { language: lang });
      fetchAnalyticsData();
    }
  }, [user, lang, fetchAnalyticsData]);

  const handleTestTokenRefresh = async () => {
    setIsTestLoading(true);
    try {
      await testTokenRefresh();
    } catch (error) {
      console.error('토큰 갱신 테스트 실패:', error);
    } finally {
      setIsTestLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon }: { title: string; value: string | number; subtitle?: string; icon: string }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">{icon}</span>
          </div>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  const TopList = ({ title, data, type }: { title: string; data: Array<{ [key: string]: string | number }>; type: 'pages' | 'tours' | 'spots' | 'events' }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {data.length > 0 ? (
          data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                <span className="text-sm text-gray-900">
                  {type === 'pages' ? item.page as string : 
                   type === 'tours' ? item.tourTitle as string :
                   type === 'spots' ? item.spotName as string :
                   item.event as string}
                </span>
              </div>
              <span className="text-sm font-semibold text-blue-600">
                {type === 'events' ? item.count as number : item.views as number}
              </span>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm">{texts.noData}</p>
        )}
      </div>
    </div>
  );

  const HourlyTrafficChart = ({ data }: { data: Array<{ hour: number; users: number }> }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{texts.hourlyTraffic}</h3>
      <div className="h-64">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="hour" 
                tickFormatter={(value) => `${value}:00`}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [value, '사용자']}
                labelFormatter={(label) => `${label}:00`}
              />
              <Area type="monotone" dataKey="users" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            {texts.noData}
          </div>
        )}
      </div>
    </div>
  );

  const TrafficSourcesChart = ({ data }: { data: Array<{ source: string; users: number; percentage: number }> }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{texts.trafficSources}</h3>
      <div className="h-64">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ source, percentage }) => `${source} ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="users"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            {texts.noData}
          </div>
        )}
      </div>
    </div>
  );

  const DeviceStatsChart = ({ data }: { data: Array<{ device: string; users: number; percentage: number }> }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{texts.deviceStats}</h3>
      <div className="h-64">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="device" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="users" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            {texts.noData}
          </div>
        )}
      </div>
    </div>
  );

  const LocationStatsChart = ({ data }: { data: Array<{ country: string; users: number; percentage: number }> }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{texts.locationStats}</h3>
      <div className="h-64">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="country" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="users" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            {texts.noData}
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{texts.loading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchAnalyticsData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            {texts.retry}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {analyticsData ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <StatCard
                title={texts.totalUsers}
                value={analyticsData.totalUsers.toLocaleString()}
                icon="👥"
              />
              <StatCard
                title={texts.totalPageViews}
                value={analyticsData.totalPageViews.toLocaleString()}
                icon="👁️"
              />
              <StatCard
                title={texts.totalSessions}
                value={analyticsData.totalSessions.toLocaleString()}
                icon="🔄"
              />
              <StatCard
                title={texts.averageSessionDuration}
                value={`${Math.round(analyticsData.averageSessionDuration / 60)} ${texts.minutes}`}
                icon="⏱️"
              />
              <StatCard
                title={texts.conversionRate}
                value={`${analyticsData.conversionRate}${texts.percentage}`}
                icon="💰"
              />
            </div>

            {/* Top Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <TopList
                title={texts.topPages}
                data={analyticsData.topPages}
                type="pages"
              />
              <TopList
                title={texts.topTours}
                data={analyticsData.topTours}
                type="tours"
              />
              <TopList
                title={texts.topSpots}
                data={analyticsData.topSpots}
                type="spots"
              />
              <TopList
                title={texts.recentEvents}
                data={analyticsData.recentEvents}
                type="events"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <HourlyTrafficChart data={analyticsData.hourlyTraffic} />
              <TrafficSourcesChart data={analyticsData.trafficSources} />
              <DeviceStatsChart data={analyticsData.deviceStats} />
              <LocationStatsChart data={analyticsData.locationStats} />
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">{texts.noData}</p>
          </div>
        )}

        {/* Last Updated */}
        <div className="mt-8 text-center text-sm text-gray-500">
          {texts.lastUpdated}: {new Date().toLocaleString()}
        </div>

        {/* 개발 환경에서만 토큰 테스트 버튼 표시 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 text-center text-sm text-gray-500">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">🔧 개발 도구</h3>
            <p className="text-yellow-700 mb-3">토큰 갱신 시스템을 테스트할 수 있습니다.</p>
            <button
              onClick={handleTestTokenRefresh}
              disabled={isTestLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isTestLoading ? '테스트 중...' : '토큰 갱신 테스트'}
            </button>
            <p className="text-sm text-yellow-600 mt-2">
              브라우저 콘솔에서 결과를 확인하세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 