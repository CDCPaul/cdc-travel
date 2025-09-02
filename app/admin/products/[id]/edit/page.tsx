"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, getDocs, query, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, storage, db } from '@/lib/firebase';
import { useLanguage } from '../../../../../components/LanguageContext';
import Link from 'next/link';
import Image from 'next/image';
import { PillButton } from '@/components/ui/PillButton';
import { useRouter } from 'next/navigation';

interface Spot {
  id: string;
  name: { ko: string; en: string };
  region: { ko: string; en: string };
  country: { en: string; ko: string };
  address: { ko: string; en: string };
  imageUrl?: string;
}

interface IncludeItem { id: string; ko: string; en: string; }
interface NotIncludeItem { id: string; ko: string; en: string; }

// 1. 타입 정의 추가
interface FlightInfo {
  airline: { ko: string; en: string };
  flightNumber: string;
  from: string;
  to: string;
  departTime: string;
  arriveTime: string;
}

// 실제 Firestore에 저장되는 데이터 구조에 맞는 타입 정의
interface Product {
  id: string;
  productCode?: string; // 상품코드 추가
  title: { ko: string; en: string };
  description: { ko: string; en: string };
  duration: { startDate: string; endDate: string };
  nights?: number;
  days?: number;
  price: { KRW?: string; PHP?: string; USD?: string };
  regions?: Array<{ ko: string; en: string }>; // 다중 지역 선택
  countries?: Array<{ en: string; ko: string; code: string }>; // 다중 국가 선택
  // 기존 호환성을 위한 단일 필드들 (deprecated)
  region?: { ko: string; en: string };
  country?: { en: string; ko: string };
  imageUrls?: string[];
  schedule?: Array<{
    day: number;
    spots: Array<{
      spotId: string;
      spotName: { ko: string; en: string };
      spotImage?: string;
    }>;
  }>;
  includedItems?: string[];
  notIncludedItems?: string[];
  // 상품 상세 설명 필드 추가
  detailedDescription?: { ko: string; en: string };
  detailImages?: string[]; // 상품 상세 설명용 이미지들
  flightCombos?: Array<{
    departure: {
      airline: { ko: string; en: string };
      flightNumber: string;
      from: string;
      to: string;
      departTime: string;
      arriveTime: string;
    };
    return: {
      airline: { ko: string; en: string };
      flightNumber: string;
      from: string;
      to: string;
      departTime: string;
      arriveTime: string;
    };
  }>;
  // 아이콘 정보 섹션 추가
  iconInfo?: {
    tripDuration?: { ko: string; en: string }; // 여행기간 (예: "5박7일")
    airline?: { ko: string; en: string }; // 항공사 정보 (예: "티웨이 항공 직항")
    groupSize?: { ko: string; en: string }; // 그룹 규모 (예: "소형 3인")
    guideFee?: string; // 가이드비 (예: "$70")
    selectInfo?: { ko: string; en: string }; // 선택 정보 (예: "선택관광 있음")
  };

  // 새로운 예약 시스템 필드들 추가
  visitingCities?: {
    ko: string[];  // ["남부 시드니", "시드니", "블루 마운틴"]
    en: string[];  // ["Southern Sydney", "Sydney", "Blue Mountains"]
  };

  bookingStatus?: {
    currentBookings: number;
    availableSeats: number;      // 여유좌석 (0명)
    minimumPax: number;          // 최소 출발인원 (6명)
    maxCapacity: number;         // 최대 수용인원
  };

  departureOptions?: Array<{
    departureDate: string;     // 출발일 "2025-09-03"
    returnDate: string;        // 도착일/종료일 "2025-09-07"
  }>;

  detailedPricing?: {
    adult: {
      age: string;           // "만 12세 이상"
      priceKRW: number;      // 1250800
      pricePHP?: number;     // PHP 가격
      priceUSD?: number;     // USD 가격
    };
    childExtraBed: {
      age: string;           // "만 12세 미만"
      priceKRW: number;      // 1250800
      pricePHP?: number;
      priceUSD?: number;
    };
    childNoBed: {
      age: string;           // "만 12세 미만"  
      priceKRW: number;      // 1250800
      pricePHP?: number;
      priceUSD?: number;
    };
    infant: {
      age: string;           // "만 2세 미만"
      priceKRW: number;      // 300000
      pricePHP?: number;
      priceUSD?: number;
    };
  };

  additionalInfo?: {
    fuelSurcharge: {
      ko: string;          // "유류할증료 127,600원 포함"
      en: string;          // "Fuel surcharge 127,600 KRW included"
    };
    taxes: {
      ko: string;          // "제세공과금 0원 포함"  
      en: string;          // "Taxes 0 KRW included"
    };
  };

  localExpenses?: {
    adult: number;         // 성인 현지 필수 경비 (USD)
    child: number;         // 아동 현지 필수 경비 (USD)  
  };
}

const PRODUCTS_TEXTS = {
  ko: {
    loading: "로딩 중...",
    backToList: "← 목록으로 돌아가기",
    title: "상품 수정",
    formTitle: "제목",
    formDescription: "설명",
    formCountry: "국가",
    formRegion: "지역",
    formPrice: "가격",
    formDuration: "기간",
    formImageUpload: "상품 이미지 업로드",
    formSchedule: "일정",
    formIncluded: "포함 사항",
    formNotIncluded: "불포함 사항",
    formIconInfo: "여행 정보",
    formTripDuration: "여행 기간",
    formAirline: "항공사 정보",
    formGroupSize: "그룹 규모",
    formGuideFee: "가이드비",
    formSelectInfo: "선택관광 정보",
    
    // 새로운 예약 시스템 필드들
    formVisitingCities: "방문 도시",
    formBookingStatus: "예약 현황",
    formCurrentBookings: "현재 예약인원",
    formAvailableSeats: "여유좌석",
    formMinimumPax: "최소 출발인원",
    formMaxCapacity: "최대 수용인원",
    formDepartureOptions: "출발일 옵션",
    formDetailedPricing: "상세 가격표",
    formAdultPrice: "성인 가격",
    formChildExtraBedPrice: "아동 Extra Bed 가격",
    formChildNoBedPrice: "아동 No Bed 가격", 
    formInfantPrice: "유아 가격",
    formAdditionalInfo: "추가 정보",
    formFuelSurcharge: "유류할증료",
    formTaxes: "제세공과금",
    
    startDate: "시작일",
    endDate: "종료일",
    selectCountry: "국가 선택",
    selectRegion: "지역 선택",
    imageUploading: "이미지 업로드 중...",
    imageUploadError: "이미지 업로드에 실패했습니다.",
    dragDropImages: "이미지를 드래그하여 업로드하거나 클릭하여 선택하세요",
    noSpotsInRegion: "이 지역에 등록된 스팟이 없습니다.",
    selectSpotsForDay: "이 날짜에 방문할 스팟을 선택하세요",
    day: "일차",
    addDay: "일차 추가",
    removeDay: "일차 삭제",
    includedPlaceholder: "포함 사항을 입력하세요",
    notIncludedPlaceholder: "불포함 사항을 입력하세요",
    delete: "삭제",
    addIncluded: "포함 사항 추가",
    addNotIncluded: "불포함 사항 추가",
    save: "수정",
    cancel: "취소",
    saveSuccess: "상품이 성공적으로 수정되었습니다!",
    saveFailed: "상품 수정에 실패했습니다.",
    notFound: "상품을 찾을 수 없습니다.",
    loadingProduct: "상품 정보를 불러오는 중...",
    depInput: "출발 항공편 입력",
    retInput: "리턴 항공편 입력",
    comboInput: "항공편 조합 입력",
    addCombo: "조합 추가",
    comboGuide: "조합은 출발 항공편과 리턴 항공편의 조합으로 구성됩니다. 중복된 조합은 추가되지 않습니다.",
    flightNo: "항공편명",
    from: "출발지",
    to: "도착지",
    date: "날짜",
  },
  en: {
    loading: "Loading...",
    backToList: "← Back to List",
    title: "Edit Product",
    formTitle: "Title",
    formDescription: "Description",
    formCountry: "Country",
    formRegion: "Region",
    formPrice: "Price",
    formDuration: "Duration",
    formImageUpload: "Product Image Upload",
    formSchedule: "Schedule",
    formIncluded: "Included Items",
    formNotIncluded: "Not Included Items",
    formIconInfo: "Travel Information",
    formTripDuration: "Trip Duration",
    formAirline: "Airline Information",
    formGroupSize: "Group Size",
    formGuideFee: "Guide Fee",
    formSelectInfo: "Optional Tour Information",
    
    // 새로운 예약 시스템 필드들
    formVisitingCities: "Visiting Cities",
    formBookingStatus: "Booking Status",
    formCurrentBookings: "Current Bookings",
    formAvailableSeats: "Available Seats",
    formMinimumPax: "Minimum Pax",
    formMaxCapacity: "Max Capacity",
    formDepartureOptions: "Departure Options",
    formDetailedPricing: "Detailed Pricing",
    formAdultPrice: "Adult Price",
    formChildExtraBedPrice: "Child Extra Bed Price",
    formChildNoBedPrice: "Child No Bed Price", 
    formInfantPrice: "Infant Price",
    formAdditionalInfo: "Additional Information",
    formFuelSurcharge: "Fuel Surcharge",
    formTaxes: "Taxes",
    
    startDate: "Start Date",
    endDate: "End Date",
    selectCountry: "Select Country",
    selectRegion: "Select Region",
    imageUploading: "Uploading image...",
    imageUploadError: "Image upload failed.",
    dragDropImages: "Drag and drop images or click to select",
    noSpotsInRegion: "No spots registered in this region.",
    selectSpotsForDay: "Select spots to visit on this day",
    day: "Day",
    addDay: "Add Day",
    removeDay: "Remove Day",
    includedPlaceholder: "Enter included items",
    notIncludedPlaceholder: "Enter not included items",
    delete: "Delete",
    addIncluded: "Add Included Item",
    addNotIncluded: "Add Not Included Item",
    save: "Update",
    cancel: "Cancel",
    saveSuccess: "Product updated successfully!",
    saveFailed: "Failed to update product.",
    notFound: "Product not found.",
    loadingProduct: "Loading product information...",
    depInput: "Departure Flight Input",
    retInput: "Return Flight Input",
    comboInput: "Flight Combo Input",
    addCombo: "Add Combo",
    comboGuide: "Combos consist of a combination of departure and return flights. Duplicate combos are not added.",
    flightNo: "Flight Number",
    from: "From",
    to: "To",
    date: "Date",
  }
};

// 국가 옵션
interface CountryOption {
  ko: string;
  en: string;
  code: string; // DB 저장용
}

const COUNTRY_OPTIONS: CountryOption[] = [
  { ko: '대한민국', en: 'Korea', code: 'KR' },
  { ko: '필리핀', en: 'Philippines', code: 'PH' },
  { ko: '일본', en: 'Japan', code: 'JP' },
  { ko: '베트남', en: 'Vietnam', code: 'VN' },
  { ko: '대만', en: 'Taiwan', code: 'TW' },
];

// 국가별 지역 옵션
const REGION_OPTIONS_BY_COUNTRY = {
  KR: [
    { ko: '서울', en: 'Seoul' },
    { ko: '부산', en: 'Busan' },
    { ko: '제주', en: 'Jeju' },
    { ko: '경주', en: 'Gyeongju' },
    { ko: '전남', en: 'Jeonnam' },
    { ko: '경기도', en: 'Gyeonggi' },
    { ko: '강원도', en: 'Gangwon' },
    { ko: '인천', en: 'Incheon' },
    { ko: '대구', en: 'Daegu' },
    { ko: '광주', en: 'Gwangju' },
  ],
  PH: [
    { ko: '마닐라', en: 'Manila' },
    { ko: '세부', en: 'Cebu' },
    { ko: '보홀', en: 'Bohol' },
    { ko: '팔라완', en: 'Palawan' },
    { ko: '다바오', en: 'Davao' },
    { ko: '바기오', en: 'Baguio' },
    { ko: '푸에르토프린세사', en: 'Puerto Princesa' },
    { ko: '엘니도', en: 'El Nido' },
    { ko: '보라카이', en: 'Boracay' },
    { ko: '시아르가오', en: 'Siargao' },
  ],
  JP: [
    { ko: '도쿄', en: 'Tokyo' },
    { ko: '오사카', en: 'Osaka' },
    { ko: '교토', en: 'Kyoto' },
    { ko: '요코하마', en: 'Yokohama' },
    { ko: '나고야', en: 'Nagoya' },
    { ko: '삿포로', en: 'Sapporo' },
    { ko: '후쿠오카', en: 'Fukuoka' },
    { ko: '고베', en: 'Kobe' },
    { ko: '가와사키', en: 'Kawasaki' },
    { ko: '히로시마', en: 'Hiroshima' },
  ],
  VN: [
    { ko: '호치민', en: 'Ho Chi Minh City' },
    { ko: '하노이', en: 'Hanoi' },
    { ko: '다낭', en: 'Da Nang' },
    { ko: '하이퐁', en: 'Hai Phong' },
    { ko: '푸꾸옥', en: 'Phu Quoc' },
    { ko: '나트랑', en: 'Nha Trang' },
    { ko: '호이안', en: 'Hoi An' },
    { ko: '달랏', en: 'Da Lat' },
    { ko: '사파', en: 'Sapa' },
    { ko: '하롱베이', en: 'Ha Long Bay' },
  ],
  TW: [
    { ko: '타이페이', en: 'Taipei' },
    { ko: '가오슝', en: 'Kaohsiung' },
    { ko: '타이중', en: 'Taichung' },
    { ko: '타이난', en: 'Tainan' },
    { ko: '지룽', en: 'Keelung' },
    { ko: '신주', en: 'Hsinchu' },
    { ko: '자이', en: 'Chiayi' },
    { ko: '화롄', en: 'Hualien' },
    { ko: '타이둥', en: 'Taitung' },
    { ko: '핑둥', en: 'Pingtung' },
  ],
};

// FlightInputForm 컴포넌트 (상품등록페이지와 동일하게, 타입 명시, lang prop 지원)
function FlightInputForm({ onAdd, lang = 'en' }: { onAdd: (flight: FlightInfo) => void; lang?: 'ko' | 'en' }) {
  const airlineOptions = [
    { ko: '진에어', en: 'Jin Air' },
    { ko: '에어부산', en: 'Air Busan' },
    { ko: '제주항공', en: 'Jeju Air' },
    { ko: '대한항공', en: 'Korean Air' },
    { ko: '아시아나항공', en: 'Asiana Airlines' },
    { ko: '세부퍼시픽', en: 'Cebu Pacific' },
    { ko: '필리핀항공', en: 'Philippine Airlines' },
    { ko: '티웨이항공', en: 'Tway Air' },
    { ko: '에어서울', en: 'Air Seoul' },
  ];
  const [airlineIdx, setAirlineIdx] = useState<number>(0);
  const [flightNumber, setFlightNumber] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [hour, setHour] = useState('00');
  const [minute, setMinute] = useState('00');
  const [arriveDate, setArriveDate] = useState('');
  const [arriveHour, setArriveHour] = useState('00');
  const [arriveMinute, setArriveMinute] = useState('00');
  const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minuteOptions = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));
  const texts = PRODUCTS_TEXTS[lang];
  return (
    <div className="flex flex-wrap gap-2 mb-2 items-center">
      <select value={airlineIdx} onChange={e => setAirlineIdx(Number(e.target.value))} className="p-2 border rounded min-w-[120px]">
        {airlineOptions.map((opt, idx) => (
          <option key={opt.en} value={idx}>{opt.en}</option>
        ))}
      </select>
      <input type="text" placeholder={texts.flightNo} value={flightNumber} onChange={e => setFlightNumber(e.target.value)} className="p-2 border rounded min-w-[90px] max-w-[120px] flex-1" />
      <input type="text" placeholder={texts.from} value={from} onChange={e => setFrom(e.target.value)} className="p-2 border rounded min-w-[70px] max-w-[90px] flex-1" />
      <input type="text" placeholder={texts.to} value={to} onChange={e => setTo(e.target.value)} className="p-2 border rounded min-w-[70px] max-w-[90px] flex-1" />
      {/* 출발 날짜/시간 */}
      <div className="flex gap-1 items-center min-w-[220px]">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="p-2 border rounded w-[110px]" placeholder={texts.date} />
        <select value={hour} onChange={e => setHour(e.target.value)} className="p-2 border rounded w-[55px]">
          {hourOptions.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        :
        <select value={minute} onChange={e => setMinute(e.target.value)} className="p-2 border rounded w-[55px]">
          {minuteOptions.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      {/* 도착 날짜/시간 */}
      <div className="flex gap-1 items-center min-w-[220px]">
        <input type="date" value={arriveDate} onChange={e => setArriveDate(e.target.value)} className="p-2 border rounded w-[110px]" placeholder={texts.date} />
        <select value={arriveHour} onChange={e => setArriveHour(e.target.value)} className="p-2 border rounded w-[55px]">
          {hourOptions.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        :
        <select value={arriveMinute} onChange={e => setArriveMinute(e.target.value)} className="p-2 border rounded w-[55px]">
          {minuteOptions.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <button type="button" className="bg-blue-500 text-white rounded px-3 py-1 mt-1 min-w-[60px]" onClick={() => {
        if (
          flightNumber && from && to && date && hour && minute && arriveDate && arriveHour && arriveMinute
        ) {
          const departTime = `${date}T${hour}:${minute}`;
          const arriveTime = `${arriveDate}T${arriveHour}:${arriveMinute}`;
          onAdd({
            airline: airlineOptions[airlineIdx],
            flightNumber,
            from,
            to,
            departTime,
            arriveTime,
          });
          setFlightNumber(''); setFrom(''); setTo(''); setDate(''); setHour('00'); setMinute('00'); setArriveDate(''); setArriveHour('00'); setArriveMinute('00');
        }
      }}>{texts.addCombo}</button>
    </div>
  );
}

export default function EditProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [productLoading, setProductLoading] = useState(true);
  const params = useParams();
  const { lang } = useLanguage();
  const texts = PRODUCTS_TEXTS[lang];

  // Form states
  const [formData, setFormData] = useState<Product>({
    id: '',
    productCode: '', // 상품코드 추가
    title: { ko: '', en: '' },
    description: { ko: '', en: '' },
    // 새로운 다중 선택 필드들
    countries: [] as Array<{ en: string; ko: string; code: string }>,
    regions: [] as Array<{ ko: string; en: string }>,
    // 기존 호환성 필드들 (deprecated)
    country: { en: 'KR', ko: '대한민국' },
    region: { ko: '', en: '' },
    price: { KRW: '', PHP: '', USD: '' },
    duration: { startDate: '', endDate: '' },
    imageUrls: [] as string[],
    schedule: [{
      day: 1,
      spots: [] as Array<{
        spotId: string;
        spotName: { ko: string; en: string };
        spotImage?: string;
      }>
    }],
    includedItems: [] as string[],
    notIncludedItems: [] as string[],
    nights: 1,
    days: 1,
    detailedDescription: { ko: '', en: '' },
    detailImages: [] as string[],
    flightCombos: [] as Array<{
      departure: {
        airline: { ko: string; en: string };
        flightNumber: string;
        from: string;
        to: string;
        departTime: string;
        arriveTime: string;
      };
      return: {
        airline: { ko: string; en: string };
        flightNumber: string;
        from: string;
        to: string;
        departTime: string;
        arriveTime: string;
      };
    }>,
    // 아이콘 정보 필드 추가
    iconInfo: {
      tripDuration: { ko: '', en: '' },
      airline: { ko: '', en: '' },
      groupSize: { ko: '', en: '' },
      guideFee: '',
      selectInfo: { ko: '', en: '' }
    },
    
    // 새로운 예약 시스템 필드들 추가
    visitingCities: {
      ko: [] as string[],
      en: [] as string[]
    },
    bookingStatus: {
      currentBookings: 0,
      availableSeats: 0,
      minimumPax: 0,
      maxCapacity: 0
    },
    departureOptions: [] as Array<{
      departureDate: string;     
      returnDate: string;        
    }>,
    detailedPricing: {
      adult: {
        age: '',
        priceKRW: 0,
        pricePHP: undefined,
        priceUSD: undefined
      },
      childExtraBed: {
        age: '',
        priceKRW: 0,
        pricePHP: undefined,
        priceUSD: undefined
      },
      childNoBed: {
        age: '',
        priceKRW: 0,
        pricePHP: undefined,
        priceUSD: undefined
      },
      infant: {
        age: '',
        priceKRW: 0,
        pricePHP: undefined,
        priceUSD: undefined
      }
    },
    additionalInfo: {
      fuelSurcharge: { ko: '', en: '' },
      taxes: { ko: '', en: '' }
    },
    localExpenses: {
      adult: 70,
      child: 70
    }
  });

  // 2. 상태 추가
  const [flightDepartures, setFlightDepartures] = useState<FlightInfo[]>([]);
  const [flightReturns, setFlightReturns] = useState<FlightInfo[]>([]);
  const [flightCombos, setFlightCombos] = useState<{ departure: FlightInfo; return: FlightInfo }[]>([]);
  const [selectedDepIdx, setSelectedDepIdx] = useState<number>(0);
  const [selectedRetIdx, setSelectedRetIdx] = useState<number>(0);

  const [uploadingCount, setUploadingCount] = useState(0);
  const [imageUploadError, setImageUploadError] = useState('');
  const [spots, setSpots] = useState<Spot[]>([]);
  const [availableIncludedItems, setAvailableIncludedItems] = useState<IncludeItem[]>([]);
  const [availableNotIncludedItems, setAvailableNotIncludedItems] = useState<NotIncludeItem[]>([]);

  // fetchProduct에서 불러오기
  const fetchProduct = useCallback(async () => {
    try {
      setProductLoading(true);
      const productDoc = await getDoc(doc(db, 'products', params.id as string));
      
      if (productDoc.exists()) {
        const productData = productDoc.data();
        setFormData({
          id: params.id as string,
          productCode: productData.productCode || '', // 상품코드 로드
          title: productData.title || { ko: '', en: '' },
          description: productData.description || { ko: '', en: '' },
          // 새로운 다중 선택 필드들 (기존 단일 데이터에서 배열로 변환)
          countries: productData.countries || (productData.country ? [productData.country] : []),
          regions: productData.regions || (productData.region ? [productData.region] : []),
          // 기존 호환성 필드들
          country: productData.country || { en: 'KR', ko: '대한민국' },
          region: productData.region || { ko: '', en: '' },
          price: productData.price || { KRW: '', PHP: '', USD: '' },
          duration: productData.duration || { startDate: '', endDate: '' },
          imageUrls: productData.imageUrls || [],
          schedule: productData.schedule || [{
            day: 1,
            spots: []
          }],
          includedItems: productData.includedItems || [],
          notIncludedItems: productData.notIncludedItems || [],
          nights: productData.nights || 1,
          days: productData.days || 1,
          flightCombos: productData.flightCombos || [],
          // 아이콘 정보 로드
          iconInfo: productData.iconInfo || {
            tripDuration: { ko: '', en: '' },
            airline: { ko: '', en: '' },
            groupSize: { ko: '', en: '' },
            guideFee: '',
            selectInfo: { ko: '', en: '' }
          },
          
          // 새로운 예약 시스템 필드들 로드
          visitingCities: productData.visitingCities || {
            ko: [],
            en: []
          },
          bookingStatus: productData.bookingStatus || {
            currentBookings: 0,
            availableSeats: 0,
            minimumPax: 0,
            maxCapacity: 0
          },
          departureOptions: productData.departureOptions || [],
          detailedPricing: productData.detailedPricing || {
            adult: {
              age: '',
              priceKRW: 0,
              pricePHP: undefined,
              priceUSD: undefined
            },
            childExtraBed: {
              age: '',
              priceKRW: 0,
              pricePHP: undefined,
              priceUSD: undefined
            },
            childNoBed: {
              age: '',
              priceKRW: 0,
              pricePHP: undefined,
              priceUSD: undefined
            },
            infant: {
              age: '',
              priceKRW: 0,
              pricePHP: undefined,
              priceUSD: undefined
            }
          },
          additionalInfo: productData.additionalInfo || {
            fuelSurcharge: { ko: '', en: '' },
            taxes: { ko: '', en: '' }
          },
          localExpenses: productData.localExpenses || {
            adult: 70,
            child: 70
          }
        });
        setFlightDepartures(productData.flightDepartures || []);
        setFlightReturns(productData.flightReturns || []);
        setFlightCombos(productData.flightCombos || []);
      } else {
        alert(texts.notFound);
        // router.push('/admin/products'); // Removed useRouter
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      alert(texts.saveFailed);
    } finally {
      setProductLoading(false);
    }
  }, [params.id, texts.notFound, texts.saveFailed]);

  const fetchSpots = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(query(collection(db, 'spots'), orderBy('name.ko')));
      const spotsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Spot[];
      setSpots(spotsData);
    } catch (error) {
      console.error('Error fetching spots:', error);
    }
  }, []);

  // 포함/불포함 항목 목록 불러오기
  useEffect(() => {
    const fetchIncludeItems = async () => {
      const querySnapshot = await getDocs(collection(db, 'includeItems'));
      setAvailableIncludedItems(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IncludeItem)));
    };
    const fetchNotIncludeItems = async () => {
      const querySnapshot = await getDocs(collection(db, 'notIncludeItems'));
      setAvailableNotIncludedItems(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotIncludeItem)));
    };
    fetchIncludeItems();
    fetchNotIncludeItems();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchSpots();
        if (params.id) {
          fetchProduct();
        }
        setLoading(false);
      } else {
        // router.push('/admin-login'); // Removed useRouter
      }
    });

    return () => unsubscribe();
  }, [params.id, fetchProduct, fetchSpots]);

  // 선택된 국가의 지역 옵션 가져오기 (다중 선택으로 변경됨으로 사용 안함)
  // const getRegionOptions = () => {
  //   const countryCode = COUNTRY_OPTIONS.find(c => c.ko === formData.country?.ko)?.code || 'KR';
  //   return REGION_OPTIONS_BY_COUNTRY[countryCode as keyof typeof REGION_OPTIONS_BY_COUNTRY] || [];
  // };

  // 선택된 지역의 스팟들 가져오기
  const getSpotsInRegion = () => {
    return spots.filter(spot => 
      spot.country.ko === formData.country?.ko && 
      spot.region.ko === formData.region?.ko
    );
  };

  // 일정 관련 함수들
  const addDay = () => {
    setFormData(prev => ({
      ...prev,
      schedule: [...(prev.schedule || []), { day: (prev.schedule?.length || 0) + 1, spots: [] }]
    }));
  };

  const removeDay = (dayIndex: number) => {
    setFormData(prev => ({
      ...prev,
      schedule: (prev.schedule || []).filter((_, i) => i !== dayIndex).map((day, i) => ({ ...day, day: i + 1 }))
    }));
  };

  const addSpotToDay = (dayIndex: number, spot: Spot) => {
    setFormData(prev => ({
      ...prev,
      schedule: (prev.schedule || []).map((day, i) => 
        i === dayIndex 
          ? { 
              ...day, 
              spots: [...day.spots, {
                spotId: spot.id,
                spotName: spot.name,
                spotImage: spot.imageUrl
              }]
            }
          : day
      )
    }));
  };

  const removeSpotFromDay = (dayIndex: number, spotIndex: number) => {
    setFormData(prev => ({
      ...prev,
      schedule: (prev.schedule || []).map((day, i) => 
        i === dayIndex 
          ? { ...day, spots: day.spots.filter((_, j) => j !== spotIndex) }
          : day
      )
    }));
  };

  // 포함/불포함 항목 관리 함수들
  const toggleIncluded = (id: string) => {
    setFormData(prev => ({
      ...prev,
      includedItems: prev.includedItems?.includes(id)
        ? prev.includedItems.filter(i => i !== id)
        : [...(prev.includedItems || []), id],
    }));
  };
  const toggleNotIncluded = (id: string) => {
    setFormData(prev => ({
      ...prev,
      notIncludedItems: prev.notIncludedItems?.includes(id)
        ? prev.notIncludedItems.filter(i => i !== id)
        : [...(prev.notIncludedItems || []), id],
    }));
  };

  // 하이라이트 기능 제거됨

  const handleImageUpload = async (file: File) => {
    const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleMultiImageUpload = async (files: FileList | File[]) => {
    setUploadingCount((prev) => prev + (files.length || 0));
    setImageUploadError('');
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await handleImageUpload(file);
        urls.push(url);
      }
      setFormData(prev => ({ ...prev, imageUrls: [...(prev.imageUrls || []), ...urls] }));
    } catch {
      setImageUploadError(texts.imageUploadError);
    } finally {
      setUploadingCount((prev) => prev - (files.length || 0));
    }
  };

  const handleRemoveImage = (idx: number) => {
    setFormData(prev => ({ ...prev, imageUrls: (prev.imageUrls || []).filter((_, i) => i !== idx) }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleMultiImageUpload(files);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleMultiImageUpload(files);
    }
  };

  // handleSubmit에서 저장
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
            // Product form data prepared
    try {
      const productData = {
        title: formData.title,
        description: formData.description,
        price: formData.price,
        duration: formData.duration,
        productCode: formData.productCode, // 상품코드 추가
        // 새로운 다중 선택 필드들
        countries: formData.countries,
        regions: formData.regions,
        // 기존 호환성 필드들 (첫 번째 선택 항목으로 설정)
        country: formData.countries && formData.countries.length > 0 ? formData.countries[0] : formData.country,
        region: formData.regions && formData.regions.length > 0 ? formData.regions[0] : formData.region,
        imageUrls: formData.imageUrls,
        schedule: formData.schedule,
        includedItems: formData.includedItems?.filter(item => item.trim() !== '') || [],
        notIncludedItems: formData.notIncludedItems?.filter(item => item.trim() !== '') || [],
        nights: formData.nights,
        days: formData.days,
        flightDepartures,
        flightReturns,
        flightCombos,
        // 아이콘 정보 추가
        iconInfo: {
          tripDuration: {
            ko: formData.iconInfo?.tripDuration?.ko || '',
            en: formData.iconInfo?.tripDuration?.en || ''
          },
          airline: {
            ko: formData.iconInfo?.airline?.ko || '',
            en: formData.iconInfo?.airline?.en || ''
          },
          groupSize: {
            ko: formData.iconInfo?.groupSize?.ko || '',
            en: formData.iconInfo?.groupSize?.en || ''
          },
          guideFee: formData.iconInfo?.guideFee || '',
          selectInfo: {
            ko: formData.iconInfo?.selectInfo?.ko || '',
            en: formData.iconInfo?.selectInfo?.en || ''
          }
        },
        // 새로운 예약 시스템 필드들 추가
        visitingCities: formData.visitingCities || { ko: [], en: [] },
        bookingStatus: formData.bookingStatus || { 
          currentBookings: 0, 
          availableSeats: 0, 
          minimumPax: 0, 
          maxCapacity: 0 
        },
        departureOptions: formData.departureOptions || [],
        detailedPricing: {
          adult: {
            age: formData.detailedPricing?.adult?.age || '만 12세 이상',
            priceKRW: formData.detailedPricing?.adult?.priceKRW || 0,
            pricePHP: formData.detailedPricing?.adult?.pricePHP || 0,
            priceUSD: formData.detailedPricing?.adult?.priceUSD || 0
          },
          childExtraBed: {
            age: formData.detailedPricing?.childExtraBed?.age || '만 2세 ~ 11세',
            priceKRW: formData.detailedPricing?.childExtraBed?.priceKRW || 0,
            pricePHP: formData.detailedPricing?.childExtraBed?.pricePHP || 0,
            priceUSD: formData.detailedPricing?.childExtraBed?.priceUSD || 0
          },
          childNoBed: {
            age: formData.detailedPricing?.childNoBed?.age || '만 2세 ~ 11세',
            priceKRW: formData.detailedPricing?.childNoBed?.priceKRW || 0,
            pricePHP: formData.detailedPricing?.childNoBed?.pricePHP || 0,
            priceUSD: formData.detailedPricing?.childNoBed?.priceUSD || 0
          },
          infant: {
            age: formData.detailedPricing?.infant?.age || '만 24개월 미만',
            priceKRW: formData.detailedPricing?.infant?.priceKRW || 0,
            pricePHP: formData.detailedPricing?.infant?.pricePHP || 0,
            priceUSD: formData.detailedPricing?.infant?.priceUSD || 0
          }
        },
        additionalInfo: formData.additionalInfo || '',
        localExpenses: formData.localExpenses || { adult: 0, child: 0 },
        updatedAt: new Date()
      };
              // Product data ready for update
      await updateDoc(doc(db, 'products', params.id as string), productData);
      
      // 활동 기록
      try {
        const user = auth.currentUser;
        if (user) {
          const idToken = await user.getIdToken(true); // 강제 갱신
          await fetch('/api/users/activity', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              action: 'productEdit',
              details: `상품 "${formData.title[lang]}" 수정 - ${Object.keys(productData).join(', ')}`,
              userId: user.uid,
              userEmail: user.email
            })
          });
        }
      } catch (error) {
        console.error('활동 기록 실패:', error);
      }
      
      alert(texts.saveSuccess);
      router.push('/admin/products');
    } catch (error) {
      console.error('[Product Update] Error updating product:', error);
      alert(texts.saveFailed);
    }
  };

  if (loading || productLoading) {
    return <div className="p-6">{productLoading ? texts.loadingProduct : texts.loading}</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{texts.title}</h1>
        <Link
          href="/admin/products"
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          {texts.backToList}
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 섹션 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">{texts.formTitle} & {texts.formDescription}</h2>
          
          {/* 상품코드 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              상품코드 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.productCode || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, productCode: e.target.value }))}
              placeholder="예: KR-SEOUL-001"
              className="w-full p-2 border rounded"
              required
            />
            <p className="text-xs text-gray-500 mt-1">고유한 상품 식별 코드를 입력하세요</p>
          </div>
          
          {/* 제목 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">{texts.formTitle}</label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={formData.title.ko}
                onChange={(e) => setFormData(prev => ({ ...prev, title: { ...prev.title, ko: e.target.value } }))}
                placeholder="한국어 제목"
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="text"
                value={formData.title.en}
                onChange={(e) => setFormData(prev => ({ ...prev, title: { ...prev.title, en: e.target.value } }))}
                placeholder="English Title"
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>
          {/* 설명 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">{texts.formDescription}</label>
            <div className="grid grid-cols-2 gap-4">
              <textarea
                value={formData.description.ko}
                onChange={(e) => setFormData(prev => ({ ...prev, description: { ...prev.description, ko: e.target.value } }))}
                placeholder="한국어 설명"
                className="w-full p-2 border rounded h-24"
                required
              />
              <textarea
                value={formData.description.en}
                onChange={(e) => setFormData(prev => ({ ...prev, description: { ...prev.description, en: e.target.value } }))}
                placeholder="English Description"
                className="w-full p-2 border rounded h-24"
                required
              />
            </div>
          </div>
          {/* 국가/지역 다중 선택 */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {texts.formCountry} (중복선택 가능) <span className="text-red-500">*</span>
              </label>
              <div className="border rounded p-3 max-h-48 overflow-y-auto">
                {COUNTRY_OPTIONS.map((country: CountryOption) => (
                  <label key={country.code} className="flex items-center mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.countries?.some(c => c.code === country.code) || false}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            countries: [...(prev.countries || []), { ...country }]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            countries: (prev.countries || []).filter(c => c.code !== country.code)
                          }));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">
                      {lang === 'ko' ? country.ko : country.en}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">선택된 국가: {formData.countries?.length || 0}개</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {texts.formRegion} (중복선택 가능) <span className="text-red-500">*</span>
              </label>
              <div className="border rounded p-3 max-h-48 overflow-y-auto">
                {formData.countries && formData.countries.length > 0 ? (
                  formData.countries.flatMap(country => {
                    const regions = REGION_OPTIONS_BY_COUNTRY[country.code as keyof typeof REGION_OPTIONS_BY_COUNTRY] || [];
                    return regions.map(region => ({
                      ...region,
                      countryCode: country.code,
                      countryName: country.ko
                    }));
                  }).map((region, index) => (
                    <label key={`${region.countryCode}-${region.ko}-${index}`} className="flex items-center mb-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.regions?.some(r => r.ko === region.ko) || false}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              regions: [...(prev.regions || []), { ko: region.ko, en: region.en }]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              regions: (prev.regions || []).filter(r => r.ko !== region.ko)
                            }));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">
                        <span className="text-gray-500 text-xs">[{region.countryName}]</span> {' '}
                        {lang === 'ko' ? region.ko : region.en}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">먼저 국가를 선택해주세요</p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">선택된 지역: {formData.regions?.length || 0}개</p>
            </div>
          </div>
          {/* 가격 (다중 통화) */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">{texts.formPrice}</label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">KRW</label>
                <input
                  type="number"
                  value={formData.price.KRW}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    price: { ...prev.price, KRW: e.target.value } 
                  }))}
                  placeholder="₩"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">PHP</label>
                <input
                  type="number"
                  value={formData.price.PHP}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    price: { ...prev.price, PHP: e.target.value } 
                  }))}
                  placeholder="₱"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">USD</label>
                <input
                  type="number"
                  value={formData.price.USD}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    price: { ...prev.price, USD: e.target.value } 
                  }))}
                  placeholder="$"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>
          {/* 기간 선택 */}
          <div>
            <label className="block text-sm font-medium mb-2">{texts.formDuration}</label>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">{texts.startDate}</label>
                <input
                  type="date"
                  value={formData.duration.startDate}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    duration: { ...prev.duration, startDate: e.target.value } 
                  }))}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">{texts.endDate}</label>
                <input
                  type="date"
                  value={formData.duration.endDate}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    duration: { ...prev.duration, endDate: e.target.value } 
                  }))}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">박 (Nights)</label>
                <input
                  type="number"
                  min={1}
                  value={formData.nights || ''}
                  onChange={e => setFormData(prev => ({ ...prev, nights: Number(e.target.value) }))}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">일 (Days)</label>
                <input
                  type="number"
                  min={1}
                  value={formData.days || ''}
                  onChange={e => setFormData(prev => ({ ...prev, days: Number(e.target.value) }))}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* 항공정보 입력 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">항공 정보 (Flight Info)</h2>
          {/* 기존 flightInfo 관련 코드는 주석처리 */}
          {/*
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">항공사 (한국어)</label>
              <input
                type="text"
                value={formData.flightInfo.airline.ko}
                onChange={e => setFormData(prev => ({ ...prev, flightInfo: { ...prev.flightInfo, airline: { ...prev.flightInfo.airline, ko: e.target.value } } }))}
                className="w-full p-2 border rounded"
                placeholder="대한항공"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Airline (English)</label>
              <input
                type="text"
                value={formData.flightInfo.airline.en}
                onChange={e => setFormData(prev => ({ ...prev, flightInfo: { ...prev.flightInfo, airline: { ...prev.flightInfo.airline, en: e.target.value } } }))}
                className="w-full p-2 border rounded"
                placeholder="Korean Air"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">항공편명 (Flight Number)</label>
            <input
              type="text"
              value={formData.flightInfo.flightNumber}
              onChange={e => setFormData(prev => ({ ...prev, flightInfo: { ...prev.flightInfo, flightNumber: e.target.value } }))}
              className="w-full p-2 border rounded"
              placeholder="KE123"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">출발편 - 출발지</label>
              <input
                type="text"
                value={formData.flightInfo.departure.from}
                onChange={e => setFormData(prev => ({ ...prev, flightInfo: { ...prev.flightInfo, departure: { ...prev.flightInfo.departure, from: e.target.value } } }))}
                className="w-full p-2 border rounded"
                placeholder="ICN"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">출발편 - 도착지</label>
              <input
                type="text"
                value={formData.flightInfo.departure.to}
                onChange={e => setFormData(prev => ({ ...prev, flightInfo: { ...prev.flightInfo, departure: { ...prev.flightInfo.departure, to: e.target.value } } }))}
                className="w-full p-2 border rounded"
                placeholder="CEB"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">출발편 - 출발시간</label>
              <input
                type="datetime-local"
                value={formData.flightInfo.departure.departTime}
                onChange={e => setFormData(prev => ({ ...prev, flightInfo: { ...prev.flightInfo, departure: { ...prev.flightInfo.departure, departTime: e.target.value } } }))}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">출발편 - 도착시간</label>
              <input
                type="datetime-local"
                value={formData.flightInfo.departure.arriveTime}
                onChange={e => setFormData(prev => ({ ...prev, flightInfo: { ...prev.flightInfo, departure: { ...prev.flightInfo.departure, arriveTime: e.target.value } } }))}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">리턴편 - 출발지</label>
              <input
                type="text"
                value={formData.flightInfo.return.from}
                onChange={e => setFormData(prev => ({ ...prev, flightInfo: { ...prev.flightInfo, return: { ...prev.flightInfo.return, from: e.target.value } } }))}
                className="w-full p-2 border rounded"
                placeholder="CEB"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">리턴편 - 도착지</label>
              <input
                type="text"
                value={formData.flightInfo.return.to}
                onChange={e => setFormData(prev => ({ ...prev, flightInfo: { ...prev.flightInfo, return: { ...prev.flightInfo.return, to: e.target.value } } }))}
                className="w-full p-2 border rounded"
                placeholder="ICN"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">리턴편 - 출발시간</label>
              <input
                type="datetime-local"
                value={formData.flightInfo.return.departTime}
                onChange={e => setFormData(prev => ({ ...prev, flightInfo: { ...prev.flightInfo, return: { ...prev.flightInfo.return, departTime: e.target.value } } }))}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">리턴편 - 도착시간</label>
              <input
                type="datetime-local"
                value={formData.flightInfo.return.arriveTime}
                onChange={e => setFormData(prev => ({ ...prev, flightInfo: { ...prev.flightInfo, return: { ...prev.flightInfo.return, arriveTime: e.target.value } } }))}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          */}

          {/* 아이콘 정보 섹션 */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-lg font-bold mb-4">{texts.formIconInfo}</h2>
            
            {/* 여행 기간 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">{texts.formTripDuration}</label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={formData.iconInfo?.tripDuration?.ko || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    iconInfo: {
                      ...prev.iconInfo,
                      tripDuration: { ...(prev.iconInfo?.tripDuration || { ko: '', en: '' }), ko: e.target.value }
                    }
                  }))}
                  placeholder="예: 5박7일"
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  value={formData.iconInfo?.tripDuration?.en || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    iconInfo: {
                      ...prev.iconInfo,
                      tripDuration: { ...(prev.iconInfo?.tripDuration || { ko: '', en: '' }), en: e.target.value }
                    }
                  }))}
                  placeholder="e.g., 5N7D"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            {/* 항공사 정보 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">{texts.formAirline}</label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={formData.iconInfo?.airline?.ko || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    iconInfo: {
                      ...prev.iconInfo,
                      airline: { ...(prev.iconInfo?.airline || { ko: '', en: '' }), ko: e.target.value }
                    }
                  }))}
                  placeholder="예: 티웨이 항공 직항"
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  value={formData.iconInfo?.airline?.en || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    iconInfo: {
                      ...prev.iconInfo,
                      airline: { ...(prev.iconInfo?.airline || { ko: '', en: '' }), en: e.target.value }
                    }
                  }))}
                  placeholder="e.g., Tway Direct Flight"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            {/* 그룹 규모 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">{texts.formGroupSize}</label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={formData.iconInfo?.groupSize?.ko || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    iconInfo: {
                      ...prev.iconInfo,
                      groupSize: { ...(prev.iconInfo?.groupSize || { ko: '', en: '' }), ko: e.target.value }
                    }
                  }))}
                  placeholder="예: 소형 3인"
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  value={formData.iconInfo?.groupSize?.en || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    iconInfo: {
                      ...prev.iconInfo,
                      groupSize: { ...(prev.iconInfo?.groupSize || { ko: '', en: '' }), en: e.target.value }
                    }
                  }))}
                  placeholder="e.g., Small Group 3pax"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            {/* 가이드비 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">{texts.formGuideFee}</label>
              <input
                type="text"
                value={formData.iconInfo?.guideFee || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  iconInfo: {
                    ...prev.iconInfo,
                    guideFee: e.target.value
                  }
                }))}
                placeholder="예: $70"
                className="w-full p-2 border rounded"
              />
            </div>

            {/* 선택관광 정보 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">{texts.formSelectInfo}</label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={formData.iconInfo?.selectInfo?.ko || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    iconInfo: {
                      ...(prev.iconInfo || { tripDuration: { ko: '', en: '' }, airline: { ko: '', en: '' }, groupSize: { ko: '', en: '' }, guideFee: '', selectInfo: { ko: '', en: '' } }),
                      selectInfo: { ...(prev.iconInfo?.selectInfo || { ko: '', en: '' }), ko: e.target.value }
                    }
                  }))}
                  placeholder="예: 선택관광 있음"
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  value={formData.iconInfo?.selectInfo?.en || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    iconInfo: {
                      ...(prev.iconInfo || { tripDuration: { ko: '', en: '' }, airline: { ko: '', en: '' }, groupSize: { ko: '', en: '' }, guideFee: '', selectInfo: { ko: '', en: '' } }),
                      selectInfo: { ...(prev.iconInfo?.selectInfo || { ko: '', en: '' }), en: e.target.value }
                    }
                  }))}
                  placeholder="e.g., Optional Tour Available"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>

          {/* 새로운 예약 시스템 섹션 */}
          <div className="border-t pt-6 mt-6">
            <h2 className="text-lg font-bold mb-4 text-blue-600">{texts.formBookingStatus}</h2>
            
            {/* 방문 도시 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">{texts.formVisitingCities}</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">한국어 (쉼표로 구분)</p>
                  <input
                    type="text"
                    value={(formData.visitingCities?.ko || []).join(', ')}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      visitingCities: {
                        ...(prev.visitingCities || { ko: [], en: [] }),
                        ko: e.target.value.split(',').map(city => city.trim())
                      }
                    }))}
                    placeholder="예: 남부 시드니, 시드니, 블루 마운틴"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">English (comma separated)</p>
                  <input
                    type="text"
                    value={(formData.visitingCities?.en || []).join(', ')}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      visitingCities: {
                        ...(prev.visitingCities || { ko: [], en: [] }),
                        en: e.target.value.split(',').map(city => city.trim())
                      }
                    }))}
                    placeholder="e.g., Southern Sydney, Sydney, Blue Mountains"
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>

            {/* 예약 현황 정보 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">{texts.formBookingStatus}</label>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-gray-600">{texts.formCurrentBookings}</label>
                  <input
                    type="number"
                    value={formData.bookingStatus?.currentBookings || 0}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      bookingStatus: {
                        ...(prev.bookingStatus || { currentBookings: 0, availableSeats: 0, minimumPax: 0, maxCapacity: 0 }),
                        currentBookings: parseInt(e.target.value) || 0
                      }
                    }))}
                    placeholder="14"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">{texts.formAvailableSeats}</label>
                  <input
                    type="number"
                    value={formData.bookingStatus?.availableSeats || 0}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      bookingStatus: {
                        ...(prev.bookingStatus || { currentBookings: 0, availableSeats: 0, minimumPax: 0, maxCapacity: 0 }),
                        availableSeats: parseInt(e.target.value) || 0
                      }
                    }))}
                    placeholder="0"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">{texts.formMinimumPax}</label>
                  <input
                    type="number"
                    value={formData.bookingStatus?.minimumPax || 0}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      bookingStatus: {
                        ...(prev.bookingStatus || { currentBookings: 0, availableSeats: 0, minimumPax: 0, maxCapacity: 0 }),
                        minimumPax: parseInt(e.target.value) || 0
                      }
                    }))}
                    placeholder="6"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">{texts.formMaxCapacity}</label>
                  <input
                    type="number"
                    value={formData.bookingStatus?.maxCapacity || 0}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      bookingStatus: {
                        ...(prev.bookingStatus || { currentBookings: 0, availableSeats: 0, minimumPax: 0, maxCapacity: 0 }),
                        maxCapacity: parseInt(e.target.value) || 0
                      }
                    }))}
                    placeholder="20"
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>

            {/* 상세 가격표 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">{texts.formDetailedPricing}</label>
              
              {/* 성인 가격 */}
              <div className="mb-3 p-3 border rounded-lg">
                <h4 className="font-medium text-sm mb-2">성인 가격 (만 12세 이상)</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">KRW</label>
                    <input
                      type="number"
                      value={formData.detailedPricing?.adult?.priceKRW || 0}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        detailedPricing: {
                          ...(prev.detailedPricing || { adult: {age: '만 12세 이상', priceKRW: 0, pricePHP: 0, priceUSD: 0}, childExtraBed: {age: '만 2세 ~ 11세', priceKRW: 0, pricePHP: 0, priceUSD: 0}, childNoBed: {age: '만 2세 ~ 11세', priceKRW: 0, pricePHP: 0, priceUSD: 0}, infant: {age: '만 24개월 미만', priceKRW: 0, pricePHP: 0, priceUSD: 0} }),
                          adult: { ...(prev.detailedPricing?.adult || {age: '만 12세 이상', priceKRW: 0, pricePHP: 0, priceUSD: 0}), priceKRW: parseInt(e.target.value) || 0 }
                        }
                      }))}
                      placeholder="0"
                      className="w-full p-2 border rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">PHP</label>
                    <input
                      type="number"
                      value={formData.detailedPricing?.adult?.pricePHP || 0}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        detailedPricing: {
                          ...(prev.detailedPricing || { adult: {age: '만 12세 이상', priceKRW: 0, pricePHP: 0, priceUSD: 0}, childExtraBed: {age: '만 2세 ~ 11세', priceKRW: 0, pricePHP: 0, priceUSD: 0}, childNoBed: {age: '만 2세 ~ 11세', priceKRW: 0, pricePHP: 0, priceUSD: 0}, infant: {age: '만 24개월 미만', priceKRW: 0, pricePHP: 0, priceUSD: 0} }),
                          adult: { ...(prev.detailedPricing?.adult || {age: '만 12세 이상', priceKRW: 0, pricePHP: 0, priceUSD: 0}), pricePHP: parseInt(e.target.value) || 0 }
                        }
                      }))}
                      placeholder="0"
                      className="w-full p-2 border rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">USD</label>
                    <input
                      type="number"
                      value={formData.detailedPricing?.adult?.priceUSD || 0}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        detailedPricing: {
                          ...(prev.detailedPricing || { adult: {age: '만 12세 이상', priceKRW: 0, pricePHP: 0, priceUSD: 0}, childExtraBed: {age: '만 2세 ~ 11세', priceKRW: 0, pricePHP: 0, priceUSD: 0}, childNoBed: {age: '만 2세 ~ 11세', priceKRW: 0, pricePHP: 0, priceUSD: 0}, infant: {age: '만 24개월 미만', priceKRW: 0, pricePHP: 0, priceUSD: 0} }),
                          adult: { ...(prev.detailedPricing?.adult || {age: '만 12세 이상', priceKRW: 0, pricePHP: 0, priceUSD: 0}), priceUSD: parseInt(e.target.value) || 0 }
                        }
                      }))}
                      placeholder="0"
                      className="w-full p-2 border rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 아동 Extra Bed 가격 */}
              <div className="mb-3 p-3 border rounded-lg">
                <h4 className="font-medium text-sm mb-2">아동 Extra Bed 가격 (만 2세 ~ 11세)</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">KRW</label>
                    <input
                      type="number"
                      value={formData.detailedPricing?.childExtraBed?.priceKRW || 0}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        detailedPricing: {
                          ...(prev.detailedPricing || { adult: {age: '만 12세 이상', priceKRW: 0, pricePHP: 0, priceUSD: 0}, childExtraBed: {age: '만 2세 ~ 11세', priceKRW: 0, pricePHP: 0, priceUSD: 0}, childNoBed: {age: '만 2세 ~ 11세', priceKRW: 0, pricePHP: 0, priceUSD: 0}, infant: {age: '만 24개월 미만', priceKRW: 0, pricePHP: 0, priceUSD: 0} }),
                          childExtraBed: { ...(prev.detailedPricing?.childExtraBed || {age: '만 2세 ~ 11세', priceKRW: 0, pricePHP: 0, priceUSD: 0}), priceKRW: parseInt(e.target.value) || 0 }
                        }
                      }))}
                      placeholder="0"
                      className="w-full p-2 border rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">PHP</label>
                    <input
                      type="number"
                      value={formData.detailedPricing?.childExtraBed?.pricePHP || 0}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        detailedPricing: {
                          ...(prev.detailedPricing || { adult: {age: '만 12세 이상', priceKRW: 0, pricePHP: 0, priceUSD: 0}, childExtraBed: {age: '만 2세 ~ 11세', priceKRW: 0, pricePHP: 0, priceUSD: 0}, childNoBed: {age: '만 2세 ~ 11세', priceKRW: 0, pricePHP: 0, priceUSD: 0}, infant: {age: '만 24개월 미만', priceKRW: 0, pricePHP: 0, priceUSD: 0} }),
                          childExtraBed: { ...(prev.detailedPricing?.childExtraBed || {age: '만 2세 ~ 11세', priceKRW: 0, pricePHP: 0, priceUSD: 0}), pricePHP: parseInt(e.target.value) || 0 }
                        }
                      }))}
                      placeholder="0"
                      className="w-full p-2 border rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">USD</label>
                    <input
                      type="number"
                      value={formData.detailedPricing?.childExtraBed?.priceUSD || 0}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        detailedPricing: {
                          ...(prev.detailedPricing || { adult: {age: '만 12세 이상', priceKRW: 0, pricePHP: 0, priceUSD: 0}, childExtraBed: {age: '만 2세 ~ 11세', priceKRW: 0, pricePHP: 0, priceUSD: 0}, childNoBed: {age: '만 2세 ~ 11세', priceKRW: 0, pricePHP: 0, priceUSD: 0}, infant: {age: '만 24개월 미만', priceKRW: 0, pricePHP: 0, priceUSD: 0} }),
                          childExtraBed: { ...(prev.detailedPricing?.childExtraBed || {age: '만 2세 ~ 11세', priceKRW: 0, pricePHP: 0, priceUSD: 0}), priceUSD: parseInt(e.target.value) || 0 }
                        }
                      }))}
                      placeholder="0"
                      className="w-full p-2 border rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 아동 No Bed 가격 */}
              <div className="mb-3 p-3 border rounded-lg">
                <h4 className="font-medium text-sm mb-2">아동 No Bed 가격 (만 2세 ~ 11세)</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">KRW</label>
                    <input
                      type="number"
                      value={formData.detailedPricing?.childNoBed?.priceKRW || 0}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        detailedPricing: {
                          ...(prev.detailedPricing || { adult: {age: '만 12세 이상', priceKRW: 0, pricePHP: 0, priceUSD: 0}, childExtraBed: {age: '만 2세 ~ 11세', priceKRW: 0, pricePHP: 0, priceUSD: 0}, childNoBed: {age: '만 2세 ~ 11세', priceKRW: 0, pricePHP: 0, priceUSD: 0}, infant: {age: '만 24개월 미만', priceKRW: 0, pricePHP: 0, priceUSD: 0} }),
                          childNoBed: { ...(prev.detailedPricing?.childNoBed || {age: '만 2세 ~ 11세', priceKRW: 0, pricePHP: 0, priceUSD: 0}), priceKRW: parseInt(e.target.value) || 0 }
                        }
                      }))}
                      placeholder="0"
                      className="w-full p-2 border rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">PHP</label>
                    <input
                      type="number"
                      value={formData.detailedPricing?.childNoBed?.pricePHP || 0}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        detailedPricing: {
                          ...(prev.detailedPricing || { adult: {age: '만 12세 이상', priceKRW: 0, pricePHP: 0, priceUSD: 0}, childExtraBed: {age: '만 2세 ~ 11세', priceKRW: 0, pricePHP: 0, priceUSD: 0}, childNoBed: {age: '만 2세 ~ 11세', priceKRW: 0, pricePHP: 0, priceUSD: 0}, infant: {age: '만 24개월 미만', priceKRW: 0, pricePHP: 0, priceUSD: 0} }),
                          childNoBed: { ...(prev.detailedPricing?.childNoBed || {age: '만 2세 ~ 11세', priceKRW: 0, pricePHP: 0, priceUSD: 0}), pricePHP: parseInt(e.target.value) || 0 }
                        }
                      }))}
                      placeholder="0"
                      className="w-full p-2 border rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">USD</label>
                    <input
                      type="number"
                      value={formData.detailedPricing?.childNoBed?.priceUSD || 0}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        detailedPricing: {
                          ...(prev.detailedPricing || { adult: {age: '만 12세 이상', priceKRW: 0, pricePHP: 0, priceUSD: 0}, childExtraBed: {age: '만 2세 ~ 11세', priceKRW: 0, pricePHP: 0, priceUSD: 0}, childNoBed: {age: '만 2세 ~ 11세', priceKRW: 0, pricePHP: 0, priceUSD: 0}, infant: {age: '만 24개월 미만', priceKRW: 0, pricePHP: 0, priceUSD: 0} }),
                          childNoBed: { ...(prev.detailedPricing?.childNoBed || {age: '만 2세 ~ 11세', priceKRW: 0, pricePHP: 0, priceUSD: 0}), priceUSD: parseInt(e.target.value) || 0 }
                        }
                      }))}
                      placeholder="0"
                      className="w-full p-2 border rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 유아 가격 */}
              <div className="mb-3 p-3 border rounded-lg">
                <h4 className="font-medium text-sm mb-2">유아 가격 (만 24개월 미만)</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">KRW</label>
                    <input
                      type="number"
                      value={formData.detailedPricing?.infant?.priceKRW || 0}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        detailedPricing: {
                          ...(prev.detailedPricing || { adult: {age: '만 12세 이상', priceKRW: 0, pricePHP: 0, priceUSD: 0}, childExtraBed: {age: '만 2세 ~ 11세', priceKRW: 0, pricePHP: 0, priceUSD: 0}, childNoBed: {age: '만 2세 ~ 11세', priceKRW: 0, pricePHP: 0, priceUSD: 0}, infant: {age: '만 24개월 미만', priceKRW: 0, pricePHP: 0, priceUSD: 0} }),
                          infant: { ...(prev.detailedPricing?.infant || {age: '만 24개월 미만', priceKRW: 0, pricePHP: 0, priceUSD: 0}), priceKRW: parseInt(e.target.value) || 0 }
                        }
                      }))}
                      placeholder="0"
                      className="w-full p-2 border rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">PHP</label>
                    <input
                      type="number"
                      value={formData.detailedPricing?.infant?.pricePHP || 0}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        detailedPricing: {
                          ...(prev.detailedPricing || { adult: {age: '만 12세 이상', priceKRW: 0, pricePHP: 0, priceUSD: 0}, childExtraBed: {age: '만 2세 ~ 11세', priceKRW: 0, pricePHP: 0, priceUSD: 0}, childNoBed: {age: '만 2세 ~ 11세', priceKRW: 0, pricePHP: 0, priceUSD: 0}, infant: {age: '만 24개월 미만', priceKRW: 0, pricePHP: 0, priceUSD: 0} }),
                          infant: { ...(prev.detailedPricing?.infant || {age: '만 24개월 미만', priceKRW: 0, pricePHP: 0, priceUSD: 0}), pricePHP: parseInt(e.target.value) || 0 }
                        }
                      }))}
                      placeholder="0"
                      className="w-full p-2 border rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">USD</label>
                    <input
                      type="number"
                      value={formData.detailedPricing?.infant?.priceUSD || 0}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        detailedPricing: {
                          ...(prev.detailedPricing || { adult: {age: '만 12세 이상', priceKRW: 0, pricePHP: 0, priceUSD: 0}, childExtraBed: {age: '만 2세 ~ 11세', priceKRW: 0, pricePHP: 0, priceUSD: 0}, childNoBed: {age: '만 2세 ~ 11세', priceKRW: 0, pricePHP: 0, priceUSD: 0}, infant: {age: '만 24개월 미만', priceKRW: 0, pricePHP: 0, priceUSD: 0} }),
                          infant: { ...(prev.detailedPricing?.infant || {age: '만 24개월 미만', priceKRW: 0, pricePHP: 0, priceUSD: 0}), priceUSD: parseInt(e.target.value) || 0 }
                        }
                      }))}
                      placeholder="0"
                      className="w-full p-2 border rounded text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 추가 정보 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">{texts.formAdditionalInfo}</label>
              
              {/* 유류할증료 */}
              <div className="mb-3">
                <label className="text-xs text-gray-600 mb-1 block">{texts.formFuelSurcharge}</label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={formData.additionalInfo?.fuelSurcharge?.ko || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      additionalInfo: {
                        ...(prev.additionalInfo || { fuelSurcharge: { ko: '', en: '' }, taxes: { ko: '', en: '' } }),
                        fuelSurcharge: { ...(prev.additionalInfo?.fuelSurcharge || { ko: '', en: '' }), ko: e.target.value }
                      }
                    }))}
                    placeholder="예: 유류할증료 127,600원 포함"
                    className="w-full p-2 border rounded"
                  />
                  <input
                    type="text"
                    value={formData.additionalInfo?.fuelSurcharge?.en || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      additionalInfo: {
                        ...(prev.additionalInfo || { fuelSurcharge: { ko: '', en: '' }, taxes: { ko: '', en: '' } }),
                        fuelSurcharge: { ...(prev.additionalInfo?.fuelSurcharge || { ko: '', en: '' }), en: e.target.value }
                      }
                    }))}
                    placeholder="e.g., Fuel surcharge 127,600 KRW included"
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              {/* 제세공과금 */}
              <div className="mb-3">
                <label className="text-xs text-gray-600 mb-1 block">{texts.formTaxes}</label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={formData.additionalInfo?.taxes?.ko || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      additionalInfo: {
                        ...(prev.additionalInfo || { fuelSurcharge: { ko: '', en: '' }, taxes: { ko: '', en: '' } }),
                        taxes: { ...(prev.additionalInfo?.taxes || { ko: '', en: '' }), ko: e.target.value }
                      }
                    }))}
                    placeholder="예: 제세공과금 0원 포함"
                    className="w-full p-2 border rounded"
                  />
                  <input
                    type="text"
                    value={formData.additionalInfo?.taxes?.en || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      additionalInfo: {
                        ...(prev.additionalInfo || { fuelSurcharge: { ko: '', en: '' }, taxes: { ko: '', en: '' } }),
                        taxes: { ...(prev.additionalInfo?.taxes || { ko: '', en: '' }), en: e.target.value }
                      }
                    }))}
                    placeholder="e.g., Taxes 0 KRW included"
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              
              {/* 현지 필수 경비 입력 필드 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">현지 필수 경비 (USD)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">성인 (USD)</label>
                    <input
                      type="number"
                      value={formData.localExpenses?.adult || 70}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        localExpenses: {
                          ...(prev.localExpenses || { adult: 70, child: 70 }),
                          adult: Number(e.target.value) || 0
                        }
                      }))}
                      placeholder="예: 70"
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">아동 (USD)</label>
                    <input
                      type="number"
                      value={formData.localExpenses?.child || 70}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        localExpenses: {
                          ...(prev.localExpenses || { adult: 70, child: 70 }),
                          child: Number(e.target.value) || 0
                        }
                      }))}
                      placeholder="예: 70"
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 항공편 입력/조합 UI (등록페이지와 동일하게, 다국어 지원) */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-2">{texts.depInput}</h2>
            <FlightInputForm onAdd={flight => setFlightDepartures(prev => [...prev, flight])} lang={lang} />
            <div className="flex flex-wrap gap-2 mt-2">
              {flightDepartures.map((flight, idx) => (
                <PillButton key={idx} selected={selectedDepIdx === idx} onClick={() => setSelectedDepIdx(idx)}>
                  {flight.airline[lang]} {flight.flightNumber} {flight.from}-{flight.to} {flight.departTime}-{flight.arriveTime}
                </PillButton>
              ))}
            </div>
            <h2 className="text-lg font-bold mb-2 mt-6">{texts.retInput}</h2>
            <FlightInputForm onAdd={flight => setFlightReturns(prev => [...prev, flight])} lang={lang} />
            <div className="flex flex-wrap gap-2 mt-2">
              {flightReturns.map((flight, idx) => (
                <PillButton key={idx} selected={selectedRetIdx === idx} onClick={() => setSelectedRetIdx(idx)}>
                  {flight.airline[lang]} {flight.flightNumber} {flight.from}-{flight.to} {flight.departTime}-{flight.arriveTime}
                </PillButton>
              ))}
            </div>
            <div className="mt-8">
              <h2 className="text-lg font-bold mb-2">{texts.comboInput}</h2>
              <div className="flex items-center gap-2 mb-4">
                <select value={selectedDepIdx} onChange={e => setSelectedDepIdx(Number(e.target.value))} className="p-2 border rounded">
                  {flightDepartures.map((flight, idx) => (
                    <option key={idx} value={idx}>
                      {flight.airline[lang]} {flight.flightNumber} {flight.from}-{flight.to} {flight.departTime}
                    </option>
                  ))}
                </select>
                <span>→</span>
                <select value={selectedRetIdx} onChange={e => setSelectedRetIdx(Number(e.target.value))} className="p-2 border rounded">
                  {flightReturns.map((flight, idx) => (
                    <option key={idx} value={idx}>
                      {flight.airline[lang]} {flight.flightNumber} {flight.from}-{flight.to} {flight.departTime}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="bg-blue-500 text-white rounded px-3 py-1"
                  onClick={() => {
                    const dep = flightDepartures[selectedDepIdx];
                    const ret = flightReturns[selectedRetIdx];
                    if (!dep || !ret) return;
                    if (flightCombos.some(c => c.departure === dep && c.return === ret)) return;
                    setFlightCombos(prev => [...prev, { departure: dep, return: ret }]);
                  }}
                >{texts.addCombo}</button>
              </div>
              <div className="min-h-[60px] border rounded p-2 flex flex-col gap-2 bg-gray-50">
                {flightCombos.map((combo, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white rounded shadow p-2">
                    <span className="font-semibold">[{combo.departure.airline[lang]} {combo.departure.flightNumber}]</span>
                    <span>→</span>
                    <span className="font-semibold">[{combo.return.airline[lang]} {combo.return.flightNumber}]</span>
                    <button type="button" className="ml-2 text-red-500" onClick={() => setFlightCombos(prev => prev.filter((_, i) => i !== idx))}>{texts.delete}</button>
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-2">{texts.comboGuide}</div>
            </div>
          </div>

          {/* 출발 일정 입력폼 */}
          <div className="border-t pt-6 mt-6">
            <h2 className="text-lg font-bold mb-4">
              {lang === 'ko' ? '출발 일정 관리' : 'Departure Schedule Management'}
            </h2>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-700">
                {lang === 'ko' 
                  ? '여러 회차의 출발 일정을 등록할 수 있습니다. 각 회차마다 출발일과 도착일을 설정하세요.'
                  : 'You can register multiple departure schedules. Set departure and arrival dates for each session.'}
              </p>
            </div>
            
            <DepartureOptionsInput
              departureOptions={formData.departureOptions || []}
              onUpdate={(options) => setFormData(prev => ({ ...prev, departureOptions: options }))}
              lang={lang}
            />
          </div>
        </div>

        {/* 이미지 섹션 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">{texts.formImageUpload}</h2>
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <div className="text-gray-600">
                {uploadingCount > 0 ? (
                  <div>{texts.imageUploading} ({uploadingCount})</div>
                ) : (
                  <div>{texts.dragDropImages}</div>
                )}
              </div>
            </label>
          </div>
          
          {imageUploadError && (
            <p className="text-red-500 text-sm mt-2">{imageUploadError}</p>
          )}

          {/* 이미지 미리보기 */}
          {(formData.imageUrls?.length || 0) > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-4">
              {(formData.imageUrls || []).map((url, index) => (
                <div key={index} className="relative">
                  <Image
                    src={url}
                    alt={`Product image ${index + 1}`}
                    width={200}
                    height={200}
                    className="w-full h-32 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 일정 관리 섹션 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">{texts.formSchedule}</h2>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-medium">{texts.formSchedule}</label>
            <button
              type="button"
              onClick={addDay}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
            >
              {texts.addDay}
            </button>
          </div>
          
          {(formData.schedule || []).map((day, dayIndex) => (
            <div key={dayIndex} className="border rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">{texts.day} {day.day}</h4>
                {(formData.schedule?.length || 0) > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDay(dayIndex)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    {texts.removeDay}
                  </button>
                )}
              </div>
              
              {/* 스팟 선택 */}
              {formData.region?.ko && (
                <div className="mb-3">
                  <label className="block text-sm text-gray-600 mb-2">
                    {texts.selectSpotsForDay}
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {getSpotsInRegion().map(spot => (
                      <button
                        key={spot.id}
                        type="button"
                        onClick={() => addSpotToDay(dayIndex, spot)}
                        disabled={day.spots.some(s => s.spotId === spot.id)}
                        className={`p-2 text-left rounded border text-sm ${
                          day.spots.some(s => s.spotId === spot.id)
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'bg-white hover:bg-gray-50 cursor-pointer'
                        }`}
                      >
                        {spot.name[lang]}
                      </button>
                    ))}
                  </div>
                  {getSpotsInRegion().length === 0 && (
                    <p className="text-gray-500 text-sm">{texts.noSpotsInRegion}</p>
                  )}
                </div>
              )}
              
              {/* 선택된 스팟들 */}
              {day.spots.length > 0 && (
                <div className="space-y-2">
                  {day.spots.map((spot, spotIndex) => (
                    <div key={spotIndex} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div className="flex items-center space-x-2">
                        {spot.spotImage && (
                          <Image
                            src={spot.spotImage}
                            alt={spot.spotName[lang]}
                            width={40}
                            height={40}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <span className="text-sm">{spot.spotName[lang]}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSpotFromDay(dayIndex, spotIndex)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        {texts.delete}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 포함 사항 섹션 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">{texts.formIncluded}</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {availableIncludedItems.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleIncluded(item.id)}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors
                  ${formData.includedItems?.includes(item.id)
                    ? 'bg-blue-600 text-white border-blue-600 shadow'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
              >
                {item[lang]}
              </button>
            ))}
          </div>
        </div>

        {/* 하이라이트 기능 제거됨 */}

        {/* 불포함 사항 섹션 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">{texts.formNotIncluded}</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {availableNotIncludedItems.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleNotIncluded(item.id)}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors
                  ${formData.notIncludedItems?.includes(item.id)
                    ? 'bg-red-600 text-white border-red-600 shadow'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-red-50'}`}
              >
                {item[lang]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {texts.save}
          </button>
          <Link
            href="/admin/products"
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            {texts.cancel}
          </Link>
        </div>
      </form>
    </div>
  );
}

// 출발 일정 입력 컴포넌트
function DepartureOptionsInput({ 
  departureOptions, 
  onUpdate, 
  lang = 'ko' 
}: { 
  departureOptions: Array<{
    departureDate: string;     
    returnDate: string;        
  }>; 
  onUpdate: (options: Array<{
    departureDate: string;     
    returnDate: string;        
  }>) => void; 
  lang?: 'ko' | 'en'; 
}) {
  const [newOption, setNewOption] = useState({
    departureDate: '',
    returnDate: ''
  });

  const addOption = () => {
    if (newOption.departureDate && newOption.returnDate) {
      onUpdate([...departureOptions, newOption]);
      setNewOption({
        departureDate: '',
        returnDate: ''
      });
    }
  };

  const removeOption = (index: number) => {
    onUpdate(departureOptions.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: keyof (typeof departureOptions)[0], value: string | number | boolean) => {
    const updated = [...departureOptions];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate(updated);
  };

  return (
    <div className="space-y-4">
      {/* 새 일정 추가 폼 */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">
          {lang === 'ko' ? '새 출발 일정 추가' : 'Add New Departure Schedule'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">
              {lang === 'ko' ? '출발일' : 'Departure'}
            </label>
            <input
              type="date"
              value={newOption.departureDate}
              onChange={(e) => setNewOption(prev => ({ ...prev, departureDate: e.target.value }))}
              className="w-full p-2 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">
              {lang === 'ko' ? '종료일' : 'Return'}
            </label>
            <input
              type="date"
              value={newOption.returnDate}
              onChange={(e) => setNewOption(prev => ({ ...prev, returnDate: e.target.value }))}
              className="w-full p-2 border rounded text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={addOption}
              className="w-full bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600"
            >
              {lang === 'ko' ? '추가' : 'Add'}
            </button>
          </div>
        </div>
      </div>

      {/* 등록된 일정 목록 */}
      <div className="space-y-2">
        <h3 className="font-semibold">
          {lang === 'ko' ? `등록된 출발 일정 (${departureOptions.length}개)` : `Registered Schedules (${departureOptions.length})`}
        </h3>
        
        {departureOptions.length === 0 ? (
          <div className="text-gray-500 text-sm p-4 border rounded-lg text-center">
            {lang === 'ko' ? '등록된 출발 일정이 없습니다.' : 'No departure schedules registered.'}
          </div>
        ) : (
          departureOptions.map((option, index) => (
            <div key={index} className="border rounded-lg p-3 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    {lang === 'ko' ? '출발일' : 'Departure'}
                  </label>
                  <input
                    type="date"
                    value={option.departureDate}
                    onChange={(e) => updateOption(index, 'departureDate', e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    {lang === 'ko' ? '종료일' : 'Return'}
                  </label>
                  <input
                    type="date"
                    value={option.returnDate}
                    onChange={(e) => updateOption(index, 'returnDate', e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="w-full bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600"
                  >
                    {lang === 'ko' ? '삭제' : 'Delete'}
                  </button>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {lang === 'ko' 
                  ? `여행기간: ${option.departureDate} ~ ${option.returnDate}`
                  : `Travel Period: ${option.departureDate} ~ ${option.returnDate}`}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}