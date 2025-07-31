'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/LanguageContext';
import { motion } from 'framer-motion';
import Link from 'next/link';
import CustomerSelectionModal from '@/components/CustomerSelectionModal';
import TASelectionModal from '@/components/TASelectionModal';
import FlightSelectionModal from '@/components/FlightSelectionModal';

const BOOKING_FORM_TEXTS = {
  ko: {
    title: "새 예약 입력",
    subtitle: "새로운 예약을 등록합니다",
    back: "목록으로",
    save: "저장",
    cancel: "취소",
    partSelection: "파트 선택",
    air: "AIR",
    cint: "CINT",
    basicInfo: "기본 정보",
    tourInfo: "투어 정보",
    passengerInfo: "인원 정보",
    pricingInfo: "가격 정보",
    customerInfo: "고객 정보",
    remarks: "비고",
    paymentInfo: "결제 정보",
    costInfo: "원가 정보",
    agentName: "에이전트명",
    agentCode: "에이전트 코드",
    tourStartDate: "투어 시작일",
    tourEndDate: "투어 종료일",
    country: "국가",
    region: "지역",
    localLandName: "현지 랜드사명",
    localLandCode: "현지 랜드사 코드",
    airline: "항공사",
    departureRoute: "출발항공 루트",
    returnRoute: "리턴항공 루트",
    flightType: "편도/왕복/다구간",
    hotelName: "호텔명",
    roomType: "룸 타입",
    roomCount: "룸 수",
    airlineIncluded: "항공포함",
    adults: "성인",
    children: "소아",
    infants: "유아",
    foc: "FOC",
    totalPax: "총 인원",
    costPrice: "원가",
    markup: "마크업",
    sellingPrice: "판매가",
    firstName: "성",
    lastName: "이름",
    gender: "성별",
    nationality: "국적",
    passportNumber: "여권번호",
    passportExpiry: "여권만료일",
    addCustomer: "고객 추가",
    removeCustomer: "고객 삭제",
    searchCustomer: "DB에서 고객 검색",
    paymentCurrency: "결제통화",
    depositRequired: "예약금여부",
    totalAmount: "총 금액",
    perPersonAmount: "1인당 결제금액",
    totalPaymentAmount: "총결제금액",
    exchangeRate: "적용환율",
    totalDollarAmount: "총 달러금액",
    paymentDeadline: "결제시한",
    paymentCompleted: "결제완료여부",
    paymentDate: "결제완료일",
    paymentBank: "결제은행",
    perPersonCost: "1인당 원가",
    totalCost: "총 원가",
    totalDollarCost: "총 달러원가",
    ticketingDate: "발권일",
    landCostPaymentDate: "랜드원가 결제일",
    income: "인컴",
    otherExpenses: "기타지출",
    finalProfit: "최종수익",
    required: "필수 입력 항목입니다",
    autoCalculate: "자동 계산",
    laterInput: "추후 입력 가능",
    optional: "선택사항",
    notEditable: "추후 수정 불가",
    editable: "추후 수정 가능",
    // 새로운 항공 관련 텍스트
    airlineSelection: "항공사",
    flightTypeSelection: "여정 유형",
    oneway: "편도",
    roundtrip: "왕복",
    multicity: "다구간",
    flightInfo: "여정 정보",
    departure: "출발지",
    arrival: "도착지",
    outbound: "가는 편",
    inbound: "오는 편",
    flightSegments: "여정 구간",
    addSegment: "구간 추가",
    removeSegment: "삭제",
    segment: "구간",
    selectAirport: "공항 선택",
    flightDates: "항공편 날짜",
    departureDate: "출발일",
    // 섹션 제목 추가
    hotelInfo: "호텔 정보",
    airlineInfo: "항공 정보",
    taSelection: "TA 선택",
    customerSelection: "고객 선택",
    enterCustomerInfo: "고객 정보를 입력하거나 DB에서 선택하세요"
  },
  en: {
    title: "New Booking",
    subtitle: "Register a new booking",
    back: "Back to List",
    save: "Save",
    cancel: "Cancel",
    partSelection: "Part Selection",
    air: "AIR",
    cint: "CINT",
    basicInfo: "Basic Information",
    tourInfo: "Tour Information",
    passengerInfo: "Passenger Information",
    pricingInfo: "Pricing Information",
    customerInfo: "Customer Information",
    remarks: "Remarks",
    paymentInfo: "Payment Information",
    costInfo: "Cost Information",
    agentName: "Agent Name",
    agentCode: "Agent Code",
    tourStartDate: "Tour Start Date",
    tourEndDate: "Tour End Date",
    country: "Country",
    region: "Region",
    localLandName: "Local Land Company",
    localLandCode: "Local Land Code",
    airline: "Airline",
    departureRoute: "Departure Route",
    returnRoute: "Return Route",
    flightType: "One-way/Round-trip/Multi-city",
    hotelName: "Hotel Name",
    roomType: "Room Type",
    roomCount: "Number of Rooms",
    airlineIncluded: "Airline Included",
    adults: "Adults",
    children: "Children",
    infants: "Infants",
    foc: "FOC",
    totalPax: "Total Passengers",
    costPrice: "Cost Price",
    markup: "Markup",
    sellingPrice: "Selling Price",
    firstName: "First Name",
    lastName: "Last Name",
    gender: "Gender",
    nationality: "Nationality",
    passportNumber: "Passport Number",
    passportExpiry: "Passport Expiry",
    addCustomer: "Add Customer",
    removeCustomer: "Remove Customer",
    searchCustomer: "Search Customer from DB",
    paymentCurrency: "Payment Currency",
    depositRequired: "Deposit Required",
    totalAmount: "Total Amount",
    perPersonAmount: "Amount per Person",
    totalPaymentAmount: "Total Payment Amount",
    exchangeRate: "Exchange Rate",
    totalDollarAmount: "Total Dollar Amount",
    paymentDeadline: "Payment Deadline",
    paymentCompleted: "Payment Completed",
    paymentDate: "Payment Date",
    paymentBank: "Payment Bank",
    perPersonCost: "Cost per Person",
    totalCost: "Total Cost",
    totalDollarCost: "Total Dollar Cost",
    ticketingDate: "Ticketing Date",
    landCostPaymentDate: "Land Cost Payment Date",
    income: "Income",
    otherExpenses: "Other Expenses",
    finalProfit: "Final Profit",
    required: "Required field",
    autoCalculate: "Auto Calculate",
    laterInput: "Can be input later",
    optional: "Optional",
    notEditable: "Cannot be edited later",
    editable: "Can be edited later",
    // 새로운 항공 관련 텍스트
    airlineSelection: "Airline",
    flightTypeSelection: "Flight Type",
    oneway: "One-way",
    roundtrip: "Round-trip",
    multicity: "Multi-city",
    flightInfo: "Flight Information",
    departure: "Departure",
    arrival: "Arrival",
    outbound: "Outbound",
    inbound: "Inbound",
    flightSegments: "Flight Segments",
    addSegment: "Add Segment",
    removeSegment: "Remove",
    segment: "Segment",
    selectAirport: "Select Airport",
    flightDates: "Flight Dates",
    departureDate: "Departure Date",
    // 섹션 제목 추가
    hotelInfo: "Hotel Information",
    airlineInfo: "Airline Information",
    taSelection: "Select TA",
    customerSelection: "Select Customer",
    enterCustomerInfo: "Enter customer information or select from DB"
  }
};

interface Customer {
  firstName: string;
  lastName: string;
  gender: string;
  nationality: string;
  passportNumber: string;
  passportExpiry: string;
}

interface FlightSegment {
  departure: string;
  arrival: string;
  date: string;
  selectedFlights: Array<{
    id: string;
    flightNumber: string;
    airline: string;
    departureTime: string;
    arrivalTime: string;
    departure: string;
    arrival: string;
    date: string;
    webPrice?: number;
  }>;
}

interface FormData {
  part?: 'AIR' | 'CINT';
  agentName?: string;
  agentCode?: string;
  tourStartDate?: string;
  tourEndDate?: string;
  // AIR 전용 필드
  flightType?: 'oneway' | 'roundtrip' | 'multicity';
  flightSegments?: FlightSegment[];
  // CINT 전용 필드
  country?: string;
  region?: string;
  localLandName?: string;
  localLandCode?: string;
  hotelName?: string;
  roomType?: string;
  roomCount?: number;
  airIncluded?: boolean;
  // 공통 필드
  adults?: number;
  children?: number;
  infants?: number;
  foc?: number;
  costPrice?: number;
  markup?: number;
  customers?: Customer[];
  remarks?: string;
}

interface Traveler {
  id: string;
  surname: string;
  givenNames: string;
  fullName: string;
  gender: string;
  nationality: string;
  passportNumber: string;
  passportExpiry: string;
  email: string;
  phone: string;
  passportPhotoURL: string;
  createdAt: unknown;
}

interface TA {
  id: string;
  companyName: string;
  taCode: string;
  phone: string;
  address: string;
  email: string;
  logo?: string;
  overlayImage?: string;
  contactPersons?: Array<{
    name: string;
    position: string;
    phone: string;
    email: string;
  }>;
  createdAt: unknown;
}

export default function NewBookingPage() {
  const { lang } = useLanguage();
  const texts = BOOKING_FORM_TEXTS[lang];
  const router = useRouter();
  
  const [selectedPart, setSelectedPart] = useState<'AIR' | 'CINT' | null>(null);
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showTASelectionModal, setShowTASelectionModal] = useState(false);
  const [showFlightSelectionModal, setShowFlightSelectionModal] = useState(false);
  const [currentFlightSegment, setCurrentFlightSegment] = useState<{ index: number; route: string; date: string } | null>(null);

  useEffect(() => {
    const setupAuth = async () => {
      const { setupTokenRefresh, checkAuth } = await import('@/lib/auth');
      setupTokenRefresh();
      const user = await checkAuth();
      if (!user) {
        alert('로그인이 필요합니다.');
        router.push('/admin/login');
        return;
      }
    };
    
    setupAuth();
  }, [router]);

  const handlePartSelection = (part: 'AIR' | 'CINT') => {
    setSelectedPart(part);
    
    // 파트에 따른 초기 데이터 설정
    const initialData: FormData = {
      part,
      agentName: '',
      agentCode: '',
      tourStartDate: '',
      tourEndDate: '',
      // AIR 전용 필드
      flightType: undefined,
      flightSegments: [],
      // CINT 전용 필드
      country: '',
      region: '',
      localLandName: '',
      localLandCode: '',
      hotelName: '',
      roomType: '',
      roomCount: 1,
      airIncluded: false,
      // 공통 필드
      adults: 0,
      children: 0,
      infants: 0,
      foc: 0,
      costPrice: 0,
      markup: 0,
      customers: [{ firstName: '', lastName: '', gender: '', nationality: '', passportNumber: '', passportExpiry: '' }],
      remarks: ''
    };
    
    setFormData(initialData);
  };

  const updateFormData = (field: string, value: string | number | boolean) => {
    setFormData((prev: FormData) => {
      const newData = { ...prev, [field]: value };
      
      // 여정 유형이 선택되면 초기 구간 생성
      if (field === 'flightType' && value) {
        const flightType = value as 'oneway' | 'roundtrip' | 'multicity';
        const initialSegments: FlightSegment[] = [];
        
        if (flightType === 'oneway') {
          initialSegments.push({
            departure: '',
            arrival: '',
            date: '',
            selectedFlights: []
          });
        } else if (flightType === 'roundtrip') {
          initialSegments.push(
            {
              departure: '',
              arrival: '',
              date: '',
              selectedFlights: []
            },
            {
              departure: '',
              arrival: '',
              date: '',
              selectedFlights: []
            }
          );
        } else if (flightType === 'multicity') {
          initialSegments.push({
            departure: '',
            arrival: '',
            date: '',
            selectedFlights: []
          });
        }
        
        newData.flightSegments = initialSegments;
      }
      
      return newData;
    });
    
    if (errors[field]) {
      setErrors((prev: Record<string, string>) => ({ ...prev, [field]: '' }));
    }
  };

  const calculateTotalPax = () => {
    const { adults = 0, children = 0, infants = 0, foc = 0 } = formData;
    return `${adults}+${children}+${infants}+${foc}FOC`;
  };

  const calculateSellingPrice = () => {
    const costPrice = formData.costPrice || 0;
    const markup = formData.markup || 0;
    return costPrice + markup;
  };

  const removeCustomer = (index: number) => {
    setFormData((prev: FormData) => ({
      ...prev,
      customers: prev.customers?.filter((_: Customer, i: number) => i !== index)
    }));
  };

  const updateCustomer = (index: number, field: string, value: string) => {
    setFormData((prev: FormData) => ({
      ...prev,
      customers: prev.customers?.map((customer: Customer, i: number) => 
        i === index ? { ...customer, [field]: value } : customer
      )
    }));
  };

  const handleCustomerSelect = (traveler: Traveler) => {
    // Traveler 데이터를 Customer 형식으로 변환
    const customer = {
      firstName: traveler.givenNames || '',
      lastName: traveler.surname || '',
      gender: traveler.gender || '',
      nationality: traveler.nationality || '',
      passportNumber: traveler.passportNumber || '',
      passportExpiry: traveler.passportExpiry || ''
    };

    setFormData((prev: FormData) => {
      const currentCustomers = prev.customers || [];
      
      // 빈 슬롯 찾기 (firstName이 비어있는 첫 번째 고객)
      let targetIndex = -1;
      for (let i = 0; i < currentCustomers.length; i++) {
        if (!currentCustomers[i].firstName && !currentCustomers[i].lastName) {
          targetIndex = i;
          break;
        }
      }
      
      // 빈 슬롯이 없으면 새로 추가
      if (targetIndex === -1) {
        return {
          ...prev,
          customers: [...currentCustomers, customer]
        };
      }
      
      // 빈 슬롯에 고객 정보 채우기
      const updatedCustomers = [...currentCustomers];
      updatedCustomers[targetIndex] = customer;
      
      return {
        ...prev,
        customers: updatedCustomers
      };
    });
  };

  const handleTASelect = (ta: TA) => {
    setFormData((prev: FormData) => ({
      ...prev,
      agentName: ta.companyName,
      agentCode: ta.taCode
    }));
  };

  const addFlightSegment = () => {
    const newSegment: FlightSegment = {
      departure: '',
      arrival: '',
      date: '',
      selectedFlights: []
    };
    
    setFormData((prev: FormData) => ({
      ...prev,
      flightSegments: [...(prev.flightSegments || []), newSegment]
    }));
  };

  const removeFlightSegment = (index: number) => {
    setFormData((prev: FormData) => {
      const currentSegments = prev.flightSegments || [];
      if (currentSegments.length > 1) {
        return {
          ...prev,
          flightSegments: currentSegments.filter((_, i) => i !== index)
        };
      }
      return prev;
    });
  };

  const updateFlightSegment = (index: number, field: 'departure' | 'arrival' | 'date', value: string) => {
    setFormData((prev: FormData) => ({
      ...prev,
      flightSegments: prev.flightSegments?.map((segment, i) => 
        i === index ? { ...segment, [field]: value } : segment
      ) || []
    }));
  };

  // 항공편 선택 모달 열기
  const openFlightSelection = (index: number) => {
    const segment = formData.flightSegments?.[index];
    if (!segment || !segment.departure || !segment.arrival || !segment.date) {
      alert('출발지, 도착지, 날짜를 모두 입력해주세요.');
      return;
    }
    
    const route = `${segment.departure}-${segment.arrival}`;
    setCurrentFlightSegment({ index, route, date: segment.date });
    setShowFlightSelectionModal(true);
  };

  // 항공편 선택 완료
  const handleFlightSelection = (selectedFlights: Array<{
    id: string;
    flightNumber: string;
    airline: string;
    departureTime: string;
    arrivalTime: string;
    departure: string;
    arrival: string;
    date: string;
    webPrice?: number;
  }>) => {
    if (!currentFlightSegment) return;
    
    setFormData((prev: FormData) => ({
      ...prev,
      flightSegments: prev.flightSegments?.map((segment, i) => 
        i === currentFlightSegment.index 
          ? { ...segment, selectedFlights }
          : segment
      ) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // API 호출 로직
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          part: selectedPart, // 파트 정보 추가
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('예약 생성 성공:', result);
        alert('예약이 성공적으로 저장되었습니다.');
        router.push('/admin/bookings');
      } else {
        throw new Error('예약 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('예약 저장 실패:', error);
      alert('예약 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 파트 선택 화면 표시
  if (!selectedPart) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">{texts.title}</h1>
          <p className="text-gray-600 mb-8 text-center">{texts.subtitle}</p>
          
          <div className="space-y-4">
            <button
              onClick={() => handlePartSelection('AIR')}
              className="w-full py-4 px-6 border-2 border-blue-500 rounded-lg text-blue-600 font-semibold hover:bg-blue-50 transition-colors"
            >
              {texts.air}
            </button>
            <button
              onClick={() => handlePartSelection('CINT')}
              className="w-full py-4 px-6 border-2 border-green-500 rounded-lg text-green-600 font-semibold hover:bg-green-50 transition-colors"
            >
              {texts.cint}
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <Link href="/admin/bookings" className="text-gray-500 hover:text-gray-700">
              {texts.back}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">{texts.partSelection}:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedPart === 'AIR' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {selectedPart}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 섹션 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{texts.basicInfo}</h2>
              <span className="text-sm text-red-500 bg-red-50 px-2 py-1 rounded">
                {texts.notEditable}
              </span>
            </div>
            
            {/* 첫 번째 행: 에이전트명, 에이전트코드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.agentName}
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.agentName || ''}
                    onChange={(e) => updateFormData('agentName', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTASelectionModal(true)}
                    className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {texts.taSelection}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.agentCode}
                </label>
                <input
                  type="text"
                  value={formData.agentCode || ''}
                  onChange={(e) => updateFormData('agentCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  readOnly
                />
              </div>
            </div>
            
            {/* 투어 시작일/종료일 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.tourStartDate}
                </label>
                <input
                  type="date"
                  value={formData.tourStartDate || ''}
                  onChange={(e) => updateFormData('tourStartDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.tourEndDate}
                </label>
                <input
                  type="date"
                  value={formData.tourEndDate || ''}
                  onChange={(e) => updateFormData('tourEndDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* CINT 전용 필드들 */}
            {selectedPart === 'CINT' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {texts.country}
                  </label>
                  <select
                    value={formData.country || ''}
                    onChange={(e) => updateFormData('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">국가 선택</option>
                    <option value="KR">한국</option>
                    <option value="PH">필리핀</option>
                    <option value="JP">일본</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {texts.region}
                  </label>
                  <select
                    value={formData.region || ''}
                    onChange={(e) => updateFormData('region', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">지역 선택</option>
                    <option value="seoul">서울</option>
                    <option value="cebu">세부</option>
                    <option value="tokyo">도쿄</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {texts.localLandName}
                  </label>
                  <input
                    type="text"
                    value={formData.localLandName || ''}
                    onChange={(e) => updateFormData('localLandName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {texts.localLandCode}
                  </label>
                  <input
                    type="text"
                    value={formData.localLandCode || ''}
                    onChange={(e) => updateFormData('localLandCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    readOnly
                  />
                </div>
              </div>
            )}
          </motion.div>

          {/* 호텔 정보 - CINT 전용 */}
          {selectedPart === 'CINT' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow p-6"
            >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{texts.hotelInfo}</h2>
              <span className="text-sm text-green-500 bg-green-50 px-2 py-1 rounded">
                {texts.editable}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.hotelName}
                </label>
                <input
                  type="text"
                  value={formData.hotelName || ''}
                  onChange={(e) => updateFormData('hotelName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.roomType}
                </label>
                <input
                  type="text"
                  value={formData.roomType || ''}
                  onChange={(e) => updateFormData('roomType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.roomCount}
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.roomCount || 1}
                  onChange={(e) => updateFormData('roomCount', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.airIncluded || false}
                  onChange={(e) => updateFormData('airIncluded', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">
                  {texts.airlineIncluded}
                </label>
              </div>
            </div>
          </motion.div>
          )}

          {/* 항공 정보 - AIR/CINT 공통 */}
          {(selectedPart === 'AIR' || selectedPart === 'CINT') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-lg shadow p-6"
            >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{texts.airlineInfo}</h2>
              <span className="text-sm text-green-500 bg-green-50 px-2 py-1 rounded">
                {texts.editable}
              </span>
            </div>
            
            <div className="space-y-6">
              {/* 여정 유형 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {texts.flightTypeSelection}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => updateFormData('flightType', 'oneway')}
                    className={`px-4 py-3 border-2 rounded-lg text-center font-medium transition-colors ${
                      formData.flightType === 'oneway'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    {texts.oneway}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateFormData('flightType', 'roundtrip')}
                    className={`px-4 py-3 border-2 rounded-lg text-center font-medium transition-colors ${
                      formData.flightType === 'roundtrip'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    {texts.roundtrip}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateFormData('flightType', 'multicity')}
                    className={`px-4 py-3 border-2 rounded-lg text-center font-medium transition-colors ${
                      formData.flightType === 'multicity'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    {texts.multicity}
                  </button>
                </div>
              </div>

              {/* 여정 정보 */}
              {formData.flightType && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    {texts.flightInfo}
                  </h3>
                  
                  {/* 공항 코드 드롭다운 컴포넌트 */}
                  <div className="space-y-4">
                    {formData.flightType === 'oneway' && (
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {texts.departure}
                              </label>
                              <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onChange={(e) => {
                                  if (formData.flightSegments && formData.flightSegments.length > 0) {
                                    updateFlightSegment(0, 'departure', e.target.value);
                                  }
                                }}
                              >
                                <option value="">공항 선택</option>
                                <option value="ICN">ICN (인천)</option>
                                <option value="PUS">PUS (부산)</option>
                                <option value="TAE">TAE (대구)</option>
                                <option value="MNL">MNL (마닐라)</option>
                                <option value="CEB">CEB (세부)</option>
                                <option value="TAG">TAG (타그빌라란)</option>
                                <option value="CRK">CRK (클라크)</option>
                                <option value="KLO">KLO (칼리보)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {texts.arrival}
                              </label>
                              <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onChange={(e) => {
                                  if (formData.flightSegments && formData.flightSegments.length > 0) {
                                    updateFlightSegment(0, 'arrival', e.target.value);
                                  }
                                }}
                              >
                                <option value="">공항 선택</option>
                                <option value="ICN">ICN (인천)</option>
                                <option value="PUS">PUS (부산)</option>
                                <option value="TAE">TAE (대구)</option>
                                <option value="MNL">MNL (마닐라)</option>
                                <option value="CEB">CEB (세부)</option>
                                <option value="TAG">TAG (타그빌라란)</option>
                                <option value="CRK">CRK (클라크)</option>
                                <option value="KLO">KLO (칼리보)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                날짜
                              </label>
                              <input
                                type="date"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onChange={(e) => {
                                  if (formData.flightSegments && formData.flightSegments.length > 0) {
                                    updateFlightSegment(0, 'date', e.target.value);
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* 항공편 선택 버튼 */}
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => openFlightSelection(0)}
                            disabled={!formData.flightSegments?.[0]?.departure || !formData.flightSegments?.[0]?.arrival || !formData.flightSegments?.[0]?.date}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            항공편 선택 ({formData.flightSegments?.[0]?.selectedFlights?.length || 0})
                          </button>
                        </div>
                        
                        {/* 선택된 항공편 표시 */}
                        {formData.flightSegments?.[0]?.selectedFlights && formData.flightSegments[0].selectedFlights.length > 0 && (
                          <div className="space-y-2">
                            {formData.flightSegments[0].selectedFlights.map((flight, flightIndex) => (
                              <div key={flightIndex} className="bg-white p-3 rounded border">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium">{flight.flightNumber}</div>
                                    <div className="text-sm text-gray-600">{flight.airline}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm">{flight.departureTime} - {flight.arrivalTime}</div>
                                    <div className="text-xs text-gray-500">{flight.departure} → {flight.arrival}</div>
                                  </div>
                                </div>
                                <div className="mt-2 flex items-center space-x-2">
                                  <input
                                    type="number"
                                    placeholder="웹 가격"
                                    value={flight.webPrice || ''}
                                    onChange={(e) => {
                                      const newFlights = [...formData.flightSegments![0].selectedFlights];
                                      newFlights[flightIndex] = { ...flight, webPrice: e.target.value ? parseFloat(e.target.value) : undefined };
                                      setFormData(prev => ({
                                        ...prev,
                                        flightSegments: prev.flightSegments?.map((seg, i) => 
                                          i === 0 ? { ...seg, selectedFlights: newFlights } : seg
                                        ) || []
                                      }));
                                    }}
                                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {formData.flightType === 'roundtrip' && (
                      <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-800 mb-3">{texts.outbound}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {texts.departure}
                              </label>
                              <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onChange={(e) => {
                                  if (formData.flightSegments && formData.flightSegments.length > 0) {
                                    updateFlightSegment(0, 'departure', e.target.value);
                                  }
                                }}
                              >
                                <option value="">공항 선택</option>
                                <option value="ICN">ICN (인천)</option>
                                <option value="PUS">PUS (부산)</option>
                                <option value="TAE">TAE (대구)</option>
                                <option value="MNL">MNL (마닐라)</option>
                                <option value="CEB">CEB (세부)</option>
                                <option value="TAG">TAG (타그빌라란)</option>
                                <option value="CRK">CRK (클라크)</option>
                                <option value="KLO">KLO (칼리보)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {texts.arrival}
                              </label>
                              <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onChange={(e) => {
                                  if (formData.flightSegments && formData.flightSegments.length > 0) {
                                    updateFlightSegment(0, 'arrival', e.target.value);
                                  }
                                }}
                              >
                                <option value="">공항 선택</option>
                                <option value="ICN">ICN (인천)</option>
                                <option value="PUS">PUS (부산)</option>
                                <option value="TAE">TAE (대구)</option>
                                <option value="MNL">MNL (마닐라)</option>
                                <option value="CEB">CEB (세부)</option>
                                <option value="TAG">TAG (타그빌라란)</option>
                                <option value="CRK">CRK (클라크)</option>
                                <option value="KLO">KLO (칼리보)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                날짜
                              </label>
                              <input
                                type="date"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onChange={(e) => {
                                  if (formData.flightSegments && formData.flightSegments.length > 0) {
                                    updateFlightSegment(0, 'date', e.target.value);
                                  }
                                }}
                              />
                            </div>
                          </div>
                          
                          {/* 항공편 선택 버튼 - 가는편 */}
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() => openFlightSelection(0)}
                              disabled={!formData.flightSegments?.[0]?.departure || !formData.flightSegments?.[0]?.arrival || !formData.flightSegments?.[0]?.date}
                              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              가는편 항공편 선택 ({formData.flightSegments?.[0]?.selectedFlights?.length || 0})
                            </button>
                          </div>
                          
                          {/* 선택된 항공편 표시 - 가는편 */}
                          {formData.flightSegments?.[0]?.selectedFlights && formData.flightSegments[0].selectedFlights.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {formData.flightSegments[0].selectedFlights.map((flight, flightIndex) => (
                                <div key={flightIndex} className="bg-white p-3 rounded border">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-medium">{flight.flightNumber}</div>
                                      <div className="text-sm text-gray-600">{flight.airline}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm">{flight.departureTime} - {flight.arrivalTime}</div>
                                      <div className="text-xs text-gray-500">{flight.departure} → {flight.arrival}</div>
                                    </div>
                                  </div>
                                  <div className="mt-2 flex items-center space-x-2">
                                    <input
                                      type="number"
                                      placeholder="웹 가격"
                                      value={flight.webPrice || ''}
                                      onChange={(e) => {
                                        const newFlights = [...formData.flightSegments![0].selectedFlights];
                                        newFlights[flightIndex] = { ...flight, webPrice: e.target.value ? parseFloat(e.target.value) : undefined };
                                        setFormData(prev => ({
                                          ...prev,
                                          flightSegments: prev.flightSegments?.map((seg, i) => 
                                            i === 0 ? { ...seg, selectedFlights: newFlights } : seg
                                          ) || []
                                        }));
                                      }}
                                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-green-800 mb-3">{texts.inbound}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {texts.departure}
                              </label>
                              <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onChange={(e) => {
                                  if (formData.flightSegments && formData.flightSegments.length > 1) {
                                    updateFlightSegment(1, 'departure', e.target.value);
                                  }
                                }}
                              >
                                <option value="">공항 선택</option>
                                <option value="ICN">ICN (인천)</option>
                                <option value="PUS">PUS (부산)</option>
                                <option value="TAE">TAE (대구)</option>
                                <option value="MNL">MNL (마닐라)</option>
                                <option value="CEB">CEB (세부)</option>
                                <option value="TAG">TAG (타그빌라란)</option>
                                <option value="CRK">CRK (클라크)</option>
                                <option value="KLO">KLO (칼리보)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {texts.arrival}
                              </label>
                              <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onChange={(e) => {
                                  if (formData.flightSegments && formData.flightSegments.length > 1) {
                                    updateFlightSegment(1, 'arrival', e.target.value);
                                  }
                                }}
                              >
                                <option value="">공항 선택</option>
                                <option value="ICN">ICN (인천)</option>
                                <option value="PUS">PUS (부산)</option>
                                <option value="TAE">TAE (대구)</option>
                                <option value="MNL">MNL (마닐라)</option>
                                <option value="CEB">CEB (세부)</option>
                                <option value="TAG">TAG (타그빌라란)</option>
                                <option value="CRK">CRK (클라크)</option>
                                <option value="KLO">KLO (칼리보)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                날짜
                              </label>
                              <input
                                type="date"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onChange={(e) => {
                                  if (formData.flightSegments && formData.flightSegments.length > 1) {
                                    updateFlightSegment(1, 'date', e.target.value);
                                  }
                                }}
                              />
                            </div>
                          </div>
                          
                          {/* 항공편 선택 버튼 - 오는편 */}
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() => openFlightSelection(1)}
                              disabled={!formData.flightSegments?.[1]?.departure || !formData.flightSegments?.[1]?.arrival || !formData.flightSegments?.[1]?.date}
                              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              오는편 항공편 선택 ({formData.flightSegments?.[1]?.selectedFlights?.length || 0})
                            </button>
                          </div>
                          
                          {/* 선택된 항공편 표시 - 오는편 */}
                          {formData.flightSegments?.[1]?.selectedFlights && formData.flightSegments[1].selectedFlights.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {formData.flightSegments[1].selectedFlights.map((flight, flightIndex) => (
                                <div key={flightIndex} className="bg-white p-3 rounded border">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-medium">{flight.flightNumber}</div>
                                      <div className="text-sm text-gray-600">{flight.airline}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm">{flight.departureTime} - {flight.arrivalTime}</div>
                                      <div className="text-xs text-gray-500">{flight.departure} → {flight.arrival}</div>
                                    </div>
                                  </div>
                                  <div className="mt-2 flex items-center space-x-2">
                                    <input
                                      type="number"
                                      placeholder="웹 가격"
                                      value={flight.webPrice || ''}
                                      onChange={(e) => {
                                        const newFlights = [...formData.flightSegments![1].selectedFlights];
                                        newFlights[flightIndex] = { ...flight, webPrice: e.target.value ? parseFloat(e.target.value) : undefined };
                                        setFormData(prev => ({
                                          ...prev,
                                          flightSegments: prev.flightSegments?.map((seg, i) => 
                                            i === 1 ? { ...seg, selectedFlights: newFlights } : seg
                                          ) || []
                                        }));
                                      }}
                                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                                         {formData.flightType === 'multicity' && (
                       <div className="space-y-4">
                         <div className="flex items-center justify-between">
                           <h4 className="text-lg font-semibold text-gray-900">{texts.flightSegments}</h4>
                           <button
                             type="button"
                             onClick={addFlightSegment}
                             disabled={(formData.flightSegments?.length || 0) >= 4}
                             className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                           >
                             + {texts.addSegment}
                           </button>
                         </div>
                         
                         {formData.flightSegments?.map((segment, index) => (
                           <div key={index} className="bg-purple-50 p-4 rounded-lg">
                             <div className="flex items-center justify-between mb-3">
                               <h5 className="text-sm font-medium text-purple-800">{texts.segment} {index + 1}</h5>
                               {formData.flightSegments && formData.flightSegments.length > 1 && (
                                 <button
                                   type="button"
                                   onClick={() => removeFlightSegment(index)}
                                   className="text-red-600 hover:text-red-800 text-sm"
                                 >
                                   {texts.removeSegment}
                                 </button>
                               )}
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                               <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">
                                   {texts.departure}
                                 </label>
                                 <select
                                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   onChange={(e) => updateFlightSegment(index, 'departure', e.target.value)}
                                 >
                                   <option value="">공항 선택</option>
                                   <option value="ICN">ICN (인천)</option>
                                   <option value="PUS">PUS (부산)</option>
                                   <option value="TAE">TAE (대구)</option>
                                   <option value="MNL">MNL (마닐라)</option>
                                   <option value="CEB">CEB (세부)</option>
                                   <option value="TAG">TAG (타그빌라란)</option>
                                   <option value="CRK">CRK (클라크)</option>
                                   <option value="KLO">KLO (칼리보)</option>
                                 </select>
                               </div>
                               <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">
                                   {texts.arrival}
                                 </label>
                                 <select
                                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   onChange={(e) => updateFlightSegment(index, 'arrival', e.target.value)}
                                 >
                                   <option value="">공항 선택</option>
                                   <option value="ICN">ICN (인천)</option>
                                   <option value="PUS">PUS (부산)</option>
                                   <option value="TAE">TAE (대구)</option>
                                   <option value="MNL">MNL (마닐라)</option>
                                   <option value="CEB">CEB (세부)</option>
                                   <option value="TAG">TAG (타그빌라란)</option>
                                   <option value="CRK">CRK (클라크)</option>
                                   <option value="KLO">KLO (칼리보)</option>
                                 </select>
                               </div>
                               <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">
                                   날짜
                                 </label>
                                 <input
                                   type="date"
                                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   onChange={(e) => updateFlightSegment(index, 'date', e.target.value)}
                                 />
                               </div>
                             </div>
                             
                             {/* 항공편 선택 버튼 */}
                             <div className="flex items-center justify-between">
                               <button
                                 type="button"
                                 onClick={() => openFlightSelection(index)}
                                 disabled={!segment.departure || !segment.arrival || !segment.date}
                                 className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                               >
                                 항공편 선택 ({segment.selectedFlights?.length || 0})
                               </button>
                             </div>
                             
                             {/* 선택된 항공편 표시 */}
                             {segment.selectedFlights && segment.selectedFlights.length > 0 && (
                               <div className="mt-3 space-y-2">
                                 {segment.selectedFlights.map((flight, flightIndex) => (
                                   <div key={flightIndex} className="bg-white p-3 rounded border">
                                     <div className="flex items-center justify-between">
                                       <div>
                                         <div className="font-medium">{flight.flightNumber}</div>
                                         <div className="text-sm text-gray-600">{flight.airline}</div>
                                       </div>
                                       <div className="text-right">
                                         <div className="text-sm">{flight.departureTime} - {flight.arrivalTime}</div>
                                         <div className="text-xs text-gray-500">{flight.departure} → {flight.arrival}</div>
                                       </div>
                                     </div>
                                     <div className="mt-2 flex items-center space-x-2">
                                       <input
                                         type="number"
                                         placeholder="웹 가격"
                                         value={flight.webPrice || ''}
                                         onChange={(e) => {
                                           const newFlights = [...segment.selectedFlights];
                                           newFlights[flightIndex] = { ...flight, webPrice: e.target.value ? parseFloat(e.target.value) : undefined };
                                           setFormData(prev => ({
                                             ...prev,
                                             flightSegments: prev.flightSegments?.map((seg, i) => 
                                               i === index ? { ...seg, selectedFlights: newFlights } : seg
                                             ) || []
                                           }));
                                         }}
                                         className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                       />
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             )}
                           </div>
                         ))}
                       </div>
                     )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
          )}

          {/* 인원 정보 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{texts.passengerInfo}</h2>
              <span className="text-sm text-green-500 bg-green-50 px-2 py-1 rounded">
                {texts.editable}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.adults}
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.adults || 1}
                  onChange={(e) => updateFormData('adults', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.children}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.children || 0}
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
                  value={formData.infants || 0}
                  onChange={(e) => updateFormData('infants', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.foc}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.foc || 0}
                  onChange={(e) => updateFormData('foc', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.totalPax}
                </label>
                <input
                  type="text"
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.costPrice}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.costPrice || ''}
                  onChange={(e) => updateFormData('costPrice', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {texts.markup}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.markup || ''}
                  onChange={(e) => updateFormData('markup', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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

          {/* 고객 정보 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{texts.customerInfo}</h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {texts.laterInput}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev: FormData) => ({
                      ...prev,
                      customers: [...(prev.customers || []), { firstName: '', lastName: '', gender: '', nationality: '', passportNumber: '', passportExpiry: '' }]
                    }));
                  }}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {texts.addCustomer}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(true)}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  {texts.searchCustomer}
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              {formData.customers?.map((customer: Customer, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700">고객 {index + 1}</h3>
                    <div className="flex items-center space-x-2">
                      {(!customer.firstName && !customer.lastName) && (
                        <button
                          type="button"
                          onClick={() => setShowCustomerModal(true)}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          {texts.customerSelection}
                        </button>
                      )}
                      {formData.customers && formData.customers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCustomer(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          {texts.removeCustomer}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {(!customer.firstName && !customer.lastName) ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>{texts.enterCustomerInfo}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {texts.lastName}
                        </label>
                        <input
                          type="text"
                          value={customer.lastName || ''}
                          onChange={(e) => updateCustomer(index, 'lastName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {texts.firstName}
                        </label>
                        <input
                          type="text"
                          value={customer.firstName || ''}
                          onChange={(e) => updateCustomer(index, 'firstName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {texts.gender}
                        </label>
                        <select
                          value={customer.gender || ''}
                          onChange={(e) => updateCustomer(index, 'gender', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">성별 선택</option>
                          <option value="M">남성</option>
                          <option value="F">여성</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {texts.nationality}
                        </label>
                        <input
                          type="text"
                          value={customer.nationality || ''}
                          onChange={(e) => updateCustomer(index, 'nationality', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {texts.passportNumber}
                        </label>
                        <input
                          type="text"
                          value={customer.passportNumber || ''}
                          onChange={(e) => updateCustomer(index, 'passportNumber', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {texts.passportExpiry}
                        </label>
                        <input
                          type="date"
                          value={customer.passportExpiry || ''}
                          onChange={(e) => updateCustomer(index, 'passportExpiry', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* 비고 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{texts.remarks}</h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {texts.optional}
              </span>
            </div>
            
            <textarea
              value={formData.remarks || ''}
              onChange={(e) => updateFormData('remarks', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="비고 사항을 입력하세요..."
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

        <CustomerSelectionModal
          isOpen={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          onSelect={handleCustomerSelect}
        />

        <TASelectionModal
          isOpen={showTASelectionModal}
          onClose={() => setShowTASelectionModal(false)}
          onSelect={handleTASelect}
        />

        <FlightSelectionModal
          isOpen={showFlightSelectionModal}
          onClose={() => setShowFlightSelectionModal(false)}
          onSelect={handleFlightSelection}
          route={currentFlightSegment?.route || ''}
          date={currentFlightSegment?.date || ''}
        />
      </main>
    </div>
  );
} 