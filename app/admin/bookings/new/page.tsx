'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/LanguageContext';
import { BookingFormData, BookingType } from '@/types/booking';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-utils';

const BOOKING_FORM_TEXTS = {
  ko: {
    title: "새 예약 입력",
    subtitle: "새로운 예약을 등록합니다",
    back: "목록으로",
    save: "저장",
    cancel: "취소",
    basicInfo: "기본 정보",
    tourInfo: "투어 정보",
    passengerInfo: "인원 정보",
    pricingInfo: "가격 정보",

    remarks: "비고",
    bookingType: "투어 타입",
    tourStartDate: "투어 시작일",
    tourEndDate: "투어 종료일",
    country: "국가",
    region: "지역",
    agentCode: "에이전트 코드",
    agentName: "에이전트명",
    localLandName: "현지 랜드사명",
    localLandCode: "현지 랜드사 코드",
    hotelName: "호텔명",
    airline: "항공사",
    airlineRoute1: "출발항공루트",
    airlineRoute2: "리턴항공루트",
    roomType: "룸 타입",
    roomCount: "룸 수",
    airlineIncluded: "항공포함",
    adults: "성인",
    children: "소아",
    infants: "유아",
    costPrice: "원가",
    markup: "마크업",
    sellingPrice: "판매가",

    totalPax: "총 인원",
    autoCalculate: "자동 계산",
    required: "필수 입력 항목입니다",
    invalidNumber: "올바른 숫자를 입력하세요",
    saveSuccess: "예약이 성공적으로 저장되었습니다",
    saveError: "예약 저장에 실패했습니다",
    selectCountry: "국가를 선택하세요",
    selectRegion: "지역을 선택하세요",
    selectLocalLand: "현지 랜드사를 선택하세요",
    optional: "선택사항",
    laterInput: "추후 입력 가능"
  },
  en: {
    title: "New Booking",
    subtitle: "Register a new booking",
    back: "Back to List",
    save: "Save",
    cancel: "Cancel",
    basicInfo: "Basic Information",
    tourInfo: "Tour Information",
    passengerInfo: "Passenger Information",
    pricingInfo: "Pricing Information",

    remarks: "Remarks",
    bookingType: "Tour Type",
    tourStartDate: "Tour Start Date",
    tourEndDate: "Tour End Date",
    country: "Country",
    region: "Region",
    agentCode: "Agent Code",
    agentName: "Agent Name",
    localLandName: "Local Land Name",
    localLandCode: "Local Land Code",
    hotelName: "Hotel Name",
    airline: "Airline",
    airlineRoute1: "Departure Route",
    airlineRoute2: "Return Route",
    roomType: "Room Type",
    roomCount: "Room Count",
    airlineIncluded: "Airline Included",
    adults: "Adults",
    children: "Children",
    infants: "Infants",
    costPrice: "Cost Price",
    markup: "Markup",
    sellingPrice: "Selling Price",

    totalPax: "Total Pax",
    autoCalculate: "Auto Calculate",
    required: "This field is required",
    invalidNumber: "Please enter a valid number",
    saveSuccess: "Booking saved successfully",
    saveError: "Failed to save booking",
    selectCountry: "Select Country",
    selectRegion: "Select Region",
    selectLocalLand: "Select Local Land",
    optional: "Optional",
    laterInput: "Can be input later"
  }
};

export default function NewBookingPage() {
  const { lang } = useLanguage();
  const texts = BOOKING_FORM_TEXTS[lang];
  const router = useRouter();
  
  const [formData, setFormData] = useState<BookingFormData>({
    bookingType: 'FIT',
    tourStartDate: '',
    tourEndDate: '',
    country: '',
    region: '',
    agentCode: '',
    agentName: '',
    localLandName: '',
    localLandCode: '',
    hotelName: '',
    airline: '',
    airlineRoute1: '',
    airlineRoute2: '',
    roomType: '',
    roomCount: 1,
    adults: 1,
    children: 0,
    infants: 0,
    costPrice: 0,
    markup: 0,
    sellingPrice: 0,
    customers: [{ name: '', contact: '', passport: '', specialRequests: '' }],
    remarks: '',
    airlineIncluded: false
  });

  const [agents, setAgents] = useState<Array<{id: string, companyName: string, taCode: string}>>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);

  // 국가 및 지역 데이터
  const COUNTRIES = [
    { code: 'KR', name: { ko: '한국', en: 'Korea' }, flag: '/images/KR.webp', enabled: true },
    { code: 'PH', name: { ko: '필리핀', en: 'Philippines' }, flag: '/images/PH.webp', enabled: true },
    { code: 'JP', name: { ko: '일본', en: 'Japan' }, flag: '/images/JP.webp', enabled: true },
    { code: 'VN', name: { ko: '베트남', en: 'Vietnam' }, flag: '/images/VN.webp', enabled: true },
    { code: 'TW', name: { ko: '대만', en: 'Taiwan' }, flag: '/images/TW.webp', enabled: true },
  ];

  const REGIONS: Record<string, { code: string; name: { ko: string; en: string }; enabled: boolean }[]> = {
    KR: [
      { code: 'seoul', name: { ko: '서울', en: 'Seoul' }, enabled: true },
      { code: 'busan', name: { ko: '부산', en: 'Busan' }, enabled: true },
      { code: 'jeju', name: { ko: '제주', en: 'Jeju' }, enabled: true },
      { code: 'gyeongju', name: { ko: '경주', en: 'Gyeongju' }, enabled: true },
      { code: 'jeonnam', name: { ko: '전남', en: 'Jeonnam' }, enabled: true },
      { code: 'gyeonggi', name: { ko: '경기도', en: 'Gyeonggi' }, enabled: true },
      { code: 'gangwon', name: { ko: '강원도', en: 'Gangwon' }, enabled: true },
      { code: 'incheon', name: { ko: '인천', en: 'Incheon' }, enabled: true },
      { code: 'daegu', name: { ko: '대구', en: 'Daegu' }, enabled: true },
      { code: 'gwangju', name: { ko: '광주', en: 'Gwangju' }, enabled: true },
    ],
    PH: [
      { code: 'manila', name: { ko: '마닐라', en: 'Manila' }, enabled: true },
      { code: 'cebu', name: { ko: '세부', en: 'Cebu' }, enabled: true },
      { code: 'bohol', name: { ko: '보홀', en: 'Bohol' }, enabled: true },
      { code: 'palawan', name: { ko: '팔라완', en: 'Palawan' }, enabled: true },
      { code: 'davao', name: { ko: '다바오', en: 'Davao' }, enabled: true },
      { code: 'baguio', name: { ko: '바기오', en: 'Baguio' }, enabled: true },
      { code: 'puerto-princesa', name: { ko: '푸에르토프린세사', en: 'Puerto Princesa' }, enabled: true },
      { code: 'el-nido', name: { ko: '엘니도', en: 'El Nido' }, enabled: true },
      { code: 'boracay', name: { ko: '보라카이', en: 'Boracay' }, enabled: true },
      { code: 'siargao', name: { ko: '시아르가오', en: 'Siargao' }, enabled: true },
    ],
    JP: [
      { code: 'tokyo', name: { ko: '도쿄', en: 'Tokyo' }, enabled: true },
      { code: 'osaka', name: { ko: '오사카', en: 'Osaka' }, enabled: true },
      { code: 'kyoto', name: { ko: '교토', en: 'Kyoto' }, enabled: true },
      { code: 'yokohama', name: { ko: '요코하마', en: 'Yokohama' }, enabled: true },
      { code: 'nagoya', name: { ko: '나고야', en: 'Nagoya' }, enabled: true },
      { code: 'sapporo', name: { ko: '삿포로', en: 'Sapporo' }, enabled: true },
      { code: 'fukuoka', name: { ko: '후쿠오카', en: 'Fukuoka' }, enabled: true },
      { code: 'kobe', name: { ko: '고베', en: 'Kobe' }, enabled: true },
      { code: 'kawasaki', name: { ko: '가와사키', en: 'Kawasaki' }, enabled: true },
      { code: 'hiroshima', name: { ko: '히로시마', en: 'Hiroshima' }, enabled: true },
    ],
    VN: [
      { code: 'hanoi', name: { ko: '하노이', en: 'Hanoi' }, enabled: true },
      { code: 'ho-chi-minh', name: { ko: '호치민', en: 'Ho Chi Minh' }, enabled: true },
      { code: 'da-nang', name: { ko: '다낭', en: 'Da Nang' }, enabled: true },
      { code: 'ha-long', name: { ko: '하롱', en: 'Ha Long' }, enabled: true },
      { code: 'hue', name: { ko: '후에', en: 'Hue' }, enabled: true },
      { code: 'nha-trang', name: { ko: '나트랑', en: 'Nha Trang' }, enabled: true },
      { code: 'phu-quoc', name: { ko: '푸꾸옥', en: 'Phu Quoc' }, enabled: true },
      { code: 'sapa', name: { ko: '사파', en: 'Sapa' }, enabled: true },
      { code: 'mai-chau', name: { ko: '마이쩌우', en: 'Mai Chau' }, enabled: true },
      { code: 'cat-ba', name: { ko: '깟바', en: 'Cat Ba' }, enabled: true },
    ],
    TW: [
      { code: 'taipei', name: { ko: '타이페이', en: 'Taipei' }, enabled: true },
      { code: 'kaohsiung', name: { ko: '가오슝', en: 'Kaohsiung' }, enabled: true },
      { code: 'taichung', name: { ko: '타이중', en: 'Taichung' }, enabled: true },
      { code: 'tainan', name: { ko: '타이난', en: 'Tainan' }, enabled: true },
      { code: 'hsinchu', name: { ko: '신주', en: 'Hsinchu' }, enabled: true },
      { code: 'keelung', name: { ko: '지룽', en: 'Keelung' }, enabled: true },
      { code: 'chiayi', name: { ko: '자이', en: 'Chiayi' }, enabled: true },
      { code: 'pingtung', name: { ko: '핑둥', en: 'Pingtung' }, enabled: true },
      { code: 'yilan', name: { ko: '이란', en: 'Yilan' }, enabled: true },
      { code: 'hualien', name: { ko: '화롄', en: 'Hualien' }, enabled: true },
    ],
  };

  // 현지 랜드사 데이터
  const LOCAL_LANDS = [
    { code: 'SW', name: { ko: 'Sewoon Travel', en: 'Sewoon Travel' }, enabled: true },
  ];

  // 공항 코드 데이터
  const AIRPORTS = {
    KR: [
      { code: 'ICN', name: { ko: '인천공항', en: 'Incheon Airport' }, city: 'seoul' },
      { code: 'GMP', name: { ko: '김포공항', en: 'Gimpo Airport' }, city: 'seoul' },
      { code: 'CJU', name: { ko: '제주공항', en: 'Jeju Airport' }, city: 'jeju' },
      { code: 'PUS', name: { ko: '부산공항', en: 'Busan Airport' }, city: 'busan' },
    ],
    PH: [
      { code: 'MNL', name: { ko: '마닐라공항', en: 'Manila Airport' }, city: 'manila' },
      { code: 'CEB', name: { ko: '세부공항', en: 'Cebu Airport' }, city: 'cebu' },
      { code: 'TAG', name: { ko: '타그빌라란공항', en: 'Tagbilaran Airport' }, city: 'bohol' },
      { code: 'PPS', name: { ko: '푸에르토프린세사공항', en: 'Puerto Princesa Airport' }, city: 'puerto-princesa' },
      { code: 'DVO', name: { ko: '다바오공항', en: 'Davao Airport' }, city: 'davao' },
      { code: 'BAG', name: { ko: '바기오공항', en: 'Baguio Airport' }, city: 'baguio' },
      { code: 'LGP', name: { ko: '레가스피공항', en: 'Legazpi Airport' }, city: 'legazpi' },
      { code: 'CRK', name: { ko: '클락공항', en: 'Clark Airport' }, city: 'clark' },
    ],
    JP: [
      { code: 'NRT', name: { ko: '나리타공항', en: 'Narita Airport' }, city: 'tokyo' },
      { code: 'HND', name: { ko: '하네다공항', en: 'Haneda Airport' }, city: 'tokyo' },
      { code: 'KIX', name: { ko: '간사이공항', en: 'Kansai Airport' }, city: 'osaka' },
      { code: 'ITM', name: { ko: '이타미공항', en: 'Itami Airport' }, city: 'osaka' },
      { code: 'CTS', name: { ko: '치토세공항', en: 'Chitose Airport' }, city: 'sapporo' },
      { code: 'FUK', name: { ko: '후쿠오카공항', en: 'Fukuoka Airport' }, city: 'fukuoka' },
      { code: 'NGO', name: { ko: '주부공항', en: 'Chubu Airport' }, city: 'nagoya' },
      { code: 'HIJ', name: { ko: '히로시마공항', en: 'Hiroshima Airport' }, city: 'hiroshima' },
    ],
    VN: [
      { code: 'HAN', name: { ko: '하노이공항', en: 'Hanoi Airport' }, city: 'hanoi' },
      { code: 'SGN', name: { ko: '호치민공항', en: 'Ho Chi Minh Airport' }, city: 'ho-chi-minh' },
      { code: 'DAD', name: { ko: '다낭공항', en: 'Da Nang Airport' }, city: 'da-nang' },
      { code: 'CXR', name: { ko: '나트랑공항', en: 'Nha Trang Airport' }, city: 'nha-trang' },
      { code: 'PQC', name: { ko: '푸꾸옥공항', en: 'Phu Quoc Airport' }, city: 'phu-quoc' },
      { code: 'DLI', name: { ko: '달랏공항', en: 'Dalat Airport' }, city: 'dalat' },
    ],
    TW: [
      { code: 'TPE', name: { ko: '타이페이공항', en: 'Taipei Airport' }, city: 'taipei' },
      { code: 'KHH', name: { ko: '가오슝공항', en: 'Kaohsiung Airport' }, city: 'kaohsiung' },
      { code: 'RMQ', name: { ko: '타이중공항', en: 'Taichung Airport' }, city: 'taichung' },
      { code: 'TNN', name: { ko: '타이난공항', en: 'Tainan Airport' }, city: 'tainan' },
      { code: 'HUN', name: { ko: '화롄공항', en: 'Hualien Airport' }, city: 'hualien' },
    ],
  };

  // 출발 공항 (필리핀)
  const DEPARTURE_AIRPORTS = [
    { code: 'CEB', name: { ko: '세부공항', en: 'Cebu Airport' } },
    { code: 'MNL', name: { ko: '마닐라공항', en: 'Manila Airport' } },
    { code: 'TAG', name: { ko: '타그빌라란공항', en: 'Tagbilaran Airport' } },
  ];

  // 항공사 목록
  const AIRLINES = [
    { code: 'LJ', name: { ko: '진에어', en: 'Jin Air' } },
    { code: 'BX', name: { ko: '에어부산', en: 'Air Busan' } },
    { code: '7C', name: { ko: '제주항공', en: 'Jeju Air' } },
    { code: 'KE', name: { ko: '대한항공', en: 'Korean Air' } },
    { code: 'OZ', name: { ko: '아시아나항공', en: 'Asiana Airlines' } },
    { code: '5J', name: { ko: '세부퍼시픽', en: 'Cebu Pacific' } },
    { code: 'PR', name: { ko: '필리핀항공', en: 'Philippine Airlines' } },
    { code: 'TW', name: { ko: '티웨이항공', en: 'Tway Air' } },
    { code: 'RS', name: { ko: '에어서울', en: 'Air Seoul' } },
  ];

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const setupAuth = async () => {
      const { setupTokenRefresh, checkAuth } = await import('@/lib/auth');
      
      // 토큰 자동 갱신 설정
      setupTokenRefresh();
      
      // 인증 상태 확인
      const user = await checkAuth();
      if (!user) {
        alert('로그인이 필요합니다.');
        router.push('/admin/login');
        return;
      }
    };
    
    setupAuth();
    fetchAgents();
  }, [router]);

  const fetchAgents = async () => {
    setLoadingAgents(true);
    try {
      const response = await fetch('/api/ta');
      const data = await response.json();
      if (data.success) {
        setAgents(data.data);
      }
    } catch (error) {
      console.error('에이전트 목록 로딩 실패:', error);
    } finally {
      setLoadingAgents(false);
    }
  };

  const calculateTotalPax = () => {
    return formData.adults + formData.children + formData.infants;
  };

  const calculateSellingPrice = () => {
    return formData.costPrice + formData.markup;
  };

  const updateFormData = (field: keyof BookingFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 자동 계산
    if (field === 'costPrice' || field === 'markup') {
      const newCostPrice = (formData.costPrice || 0) + (formData.markup || 0);
      const newMarkup = (formData.costPrice || 0) + (formData.markup || 0);
      setFormData(prev => ({ 
        ...prev, 
        [field]: value,
        sellingPrice: newCostPrice + newMarkup 
      }));
    }
    
    // 에러 제거
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };



  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.tourStartDate) newErrors.tourStartDate = texts.required;
    if (!formData.tourEndDate) newErrors.tourEndDate = texts.required;
    if (!formData.country) newErrors.country = texts.required;
    if (!formData.region) newErrors.region = texts.required;
    if (!formData.agentCode) newErrors.agentCode = texts.required;
    if (!formData.agentName) newErrors.agentName = texts.required;
    if (!formData.localLandName) newErrors.localLandName = texts.required;
    // 투어정보는 선택사항이므로 유효성 검사에서 제외
    // if (!formData.hotelName) newErrors.hotelName = texts.required;
    // if (!formData.airline) newErrors.airline = texts.required;
    // if (!formData.airlineRoute1) newErrors.airlineRoute1 = texts.required;
    // if (!formData.roomType) newErrors.roomType = texts.required;
    
    if (formData.adults < 1) newErrors.adults = texts.required;
    if (formData.costPrice < 0) newErrors.costPrice = texts.invalidNumber;
    if (formData.markup < 0) newErrors.markup = texts.invalidNumber;
    

    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      // API 호출로 예약 저장 (토큰 갱신 포함)
      const response = await apiFetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      // 성공 메시지 (예약번호 표시)
      alert(`${texts.saveSuccess}\n예약번호: ${result.bookingNumber}`);
      router.push('/admin/bookings');
      
    } catch (error) {
      console.error('예약 저장 실패:', error);
      alert(texts.saveError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form id="new-booking-form" onSubmit={handleSubmit} className="space-y-8">
          {/* 기본 정보 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{texts.basicInfo}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.bookingType}
                </label>
                <select
                  value={formData.bookingType}
                  onChange={(e) => updateFormData('bookingType', e.target.value as BookingType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="FIT">FIT</option>
                  <option value="PKG">PKG</option>
                  <option value="GROUP">GROUP</option>
                  <option value="REVISION">REVISION</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.tourStartDate}
                </label>
                <input
                  type="date"
                  value={formData.tourStartDate}
                  onChange={(e) => updateFormData('tourStartDate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.tourStartDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.tourStartDate && <p className="text-red-500 text-sm mt-1">{errors.tourStartDate}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.tourEndDate}
                </label>
                <input
                  type="date"
                  value={formData.tourEndDate}
                  onChange={(e) => updateFormData('tourEndDate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.tourEndDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.tourEndDate && <p className="text-red-500 text-sm mt-1">{errors.tourEndDate}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.country}
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => {
                    updateFormData('country', e.target.value);
                    updateFormData('region', ''); // 국가 변경 시 지역 초기화
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.country ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">{texts.selectCountry}</option>
                  {COUNTRIES.filter(country => country.enabled).map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name[lang]}
                    </option>
                  ))}
                </select>
                {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.region}
                </label>
                <select
                  value={formData.region}
                  onChange={(e) => updateFormData('region', e.target.value)}
                  disabled={!formData.country}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.region ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">{formData.country ? texts.selectRegion : texts.selectCountry}</option>
                  {formData.country && REGIONS[formData.country]?.filter(region => region.enabled).map((region) => (
                    <option key={region.code} value={region.code}>
                      {region.name[lang]}
                    </option>
                  ))}
                </select>
                {errors.region && <p className="text-red-500 text-sm mt-1">{errors.region}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.agentName}
                </label>
                <select
                  value={formData.agentName}
                  onChange={(e) => {
                    const selectedAgent = agents.find(agent => agent.companyName === e.target.value);
                    updateFormData('agentName', e.target.value);
                    if (selectedAgent) {
                      updateFormData('agentCode', selectedAgent.taCode);
                    }
                  }}
                  disabled={loadingAgents}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.agentName ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">{loadingAgents ? '로딩 중...' : '에이전트를 선택하세요'}</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.companyName}>
                      {agent.companyName} ({agent.taCode})
                    </option>
                  ))}
                </select>
                {errors.agentName && <p className="text-red-500 text-sm mt-1">{errors.agentName}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.agentCode}
                </label>
                <input
                  type="text"
                  value={formData.agentCode}
                  onChange={(e) => updateFormData('agentCode', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.agentCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  readOnly
                />
                {errors.agentCode && <p className="text-red-500 text-sm mt-1">{errors.agentCode}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.localLandName}
                </label>
                <select
                  value={formData.localLandName}
                  onChange={(e) => {
                    const selectedLand = LOCAL_LANDS.find(land => land.name[lang] === e.target.value);
                    updateFormData('localLandName', e.target.value);
                    if (selectedLand) {
                      updateFormData('localLandCode', selectedLand.code);
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.localLandName ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">{texts.selectLocalLand}</option>
                  {LOCAL_LANDS.filter(land => land.enabled).map((land) => (
                    <option key={land.code} value={land.name[lang]}>
                      {land.name[lang]} ({land.code})
                    </option>
                  ))}
                </select>
                {errors.localLandName && <p className="text-red-500 text-sm mt-1">{errors.localLandName}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.localLandCode}
                </label>
                <input
                  type="text"
                  value={formData.localLandCode}
                  onChange={(e) => updateFormData('localLandCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  readOnly
                />
              </div>
            </div>
          </motion.div>

          {/* 투어 정보 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{texts.tourInfo}</h2>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.airlineIncluded}
                    onChange={(e) => updateFormData('airlineIncluded', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">{texts.airlineIncluded}</span>
                </label>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {texts.optional}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.hotelName}
                </label>
                <input
                  type="text"
                  value={formData.hotelName}
                  onChange={(e) => updateFormData('hotelName', e.target.value)}
                  placeholder={lang === 'ko' ? "호텔명 (선택사항)" : "Hotel Name (Optional)"}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.hotelName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.hotelName && <p className="text-red-500 text-sm mt-1">{errors.hotelName}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.roomType}
                </label>
                <input
                  type="text"
                  value={formData.roomType}
                  onChange={(e) => updateFormData('roomType', e.target.value)}
                  placeholder={lang === 'ko' ? "룸 타입 (선택사항)" : "Room Type (Optional)"}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.roomType ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.roomType && <p className="text-red-500 text-sm mt-1">{errors.roomType}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.roomCount}
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.roomCount}
                  onChange={(e) => updateFormData('roomCount', parseInt(e.target.value))}
                  placeholder={lang === 'ko' ? "룸 수 (선택사항)" : "Room Count (Optional)"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.airline}
                </label>
                <select
                  value={formData.airline}
                  onChange={(e) => updateFormData('airline', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.airline ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">{lang === 'ko' ? "항공사 선택 (선택사항)" : "Select Airline (Optional)"}</option>
                  {AIRLINES.map((airline) => (
                    <option key={airline.code} value={airline.name[lang]}>
                      {airline.name[lang]} ({airline.code})
                    </option>
                  ))}
                </select>
                {errors.airline && <p className="text-red-500 text-sm mt-1">{errors.airline}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.airlineRoute1}
                </label>
                <select
                  value={formData.airlineRoute1}
                  onChange={(e) => updateFormData('airlineRoute1', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.airlineRoute1 ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">{lang === 'ko' ? "출발 루트 선택 (선택사항)" : "Select Departure Route (Optional)"}</option>
                  {DEPARTURE_AIRPORTS.map((departure) => 
                    AIRPORTS[formData.country as keyof typeof AIRPORTS]?.map((arrival) => (
                      <option key={`${departure.code}-${arrival.code}`} value={`${departure.code}-${arrival.code}`}>
                        {departure.code}-{arrival.code} ({departure.name[lang]} → {arrival.name[lang]})
                      </option>
                    ))
                  ).flat()}
                </select>
                {errors.airlineRoute1 && <p className="text-red-500 text-sm mt-1">{errors.airlineRoute1}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.airlineRoute2}
                </label>
                <select
                  value={formData.airlineRoute2}
                  onChange={(e) => updateFormData('airlineRoute2', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.airlineRoute2 ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">{lang === 'ko' ? "리턴 루트 선택 (선택사항)" : "Select Return Route (Optional)"}</option>
                  {AIRPORTS[formData.country as keyof typeof AIRPORTS]?.map((departure) => 
                    DEPARTURE_AIRPORTS.map((arrival) => (
                      <option key={`${departure.code}-${arrival.code}`} value={`${departure.code}-${arrival.code}`}>
                        {departure.code}-{arrival.code} ({departure.name[lang]} → {arrival.name[lang]})
                      </option>
                    ))
                  ).flat()}
                </select>
                {errors.airlineRoute2 && <p className="text-red-500 text-sm mt-1">{errors.airlineRoute2}</p>}
              </div>
            </div>
          </motion.div>

          {/* 인원 정보 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{texts.passengerInfo}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.adults}
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.adults}
                  onChange={(e) => updateFormData('adults', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.adults ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.adults && <p className="text-red-500 text-sm mt-1">{errors.adults}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.children}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.children}
                  onChange={(e) => updateFormData('children', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.infants}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.infants}
                  onChange={(e) => updateFormData('infants', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.totalPax}
                </label>
                <input
                  type="number"
                  value={calculateTotalPax()}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
            </div>
          </motion.div>

          {/* 가격 정보 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{texts.pricingInfo}</h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {texts.laterInput}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {texts.costPrice}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => updateFormData('costPrice', parseFloat(e.target.value))}
                    placeholder={lang === 'ko' ? "원가 (추후 입력 가능)" : "Cost Price (Can be input later)"}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.costPrice ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.costPrice && <p className="text-red-500 text-sm mt-1">{errors.costPrice}</p>}
                </div>
              
                              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {texts.markup}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.markup}
                    onChange={(e) => updateFormData('markup', parseFloat(e.target.value))}
                    placeholder={lang === 'ko' ? "마크업 (추후 입력 가능)" : "Markup (Can be input later)"}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.markup ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.markup && <p className="text-red-500 text-sm mt-1">{errors.markup}</p>}
                </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.sellingPrice} ({texts.autoCalculate})
                </label>
                <input
                  type="number"
                  value={calculateSellingPrice()}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
            </div>
          </motion.div>



          {/* 비고 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{texts.remarks}</h2>
            <textarea
              value={formData.remarks}
              onChange={(e) => updateFormData('remarks', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </motion.div>

          {/* 액션 버튼 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex justify-end space-x-4"
          >
            <Link
              href="/admin/bookings"
              className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              {texts.cancel}
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '저장 중...' : texts.save}
            </button>
          </motion.div>
        </form>
      </main>
    </div>
  );
} 