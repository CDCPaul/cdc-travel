"use client";

import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, orderBy, addDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useLanguage } from '../../../../components/LanguageContext';
import Link from 'next/link';
import Image from 'next/image';
import { PillButton } from '@/components/ui/PillButton';
import ImageUploader from '@/components/ui/ImageUploader';

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

// 출발 옵션 인터페이스 추가 (단순화)
interface DepartureOption {
  departureDate: string;     // 출발일 "2025-09-03"
  returnDate: string;        // 도착일/종료일 "2025-09-07"
}

const PRODUCTS_TEXTS = {
  ko: {
    loading: "로딩 중...",
    backToList: "← 목록으로 돌아가기",
    title: "새 상품 등록",
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
    save: "등록",
    cancel: "취소",
    saveSuccess: "상품이 성공적으로 등록되었습니다!",
    saveFailed: "상품 등록에 실패했습니다.",
    saving: "저장 중...",
    uploadProgress: "이미지 업로드 중... ({progress}%)",
    addCombo: "조합 추가",
    comboGuide: "출발/리턴 항공편을 각각 선택 후 '조합 추가' 버튼을 눌러 원하는 조합을 만들어주세요.",
    depInput: "출발편 입력",
    retInput: "리턴편 입력",
    comboInput: "출발-리턴 조합 만들기",
    flightNo: "편명",
    from: "출발지",
    to: "도착지",
    date: "연도-월-일",
  },
  en: {
    loading: "Loading...",
    backToList: "← Back to List",
    title: "Add New Product",
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
    save: "Add",
    cancel: "Cancel",
    saveSuccess: "Product added successfully!",
    saveFailed: "Failed to add product.",
    saving: "Saving...",
    uploadProgress: "Uploading images... ({progress}%)",
    addCombo: "Add Combo",
    comboGuide: "Select a departure and return flight, then click 'Add Combo' to create your desired combinations.",
    depInput: "Departure Flight Input",
    retInput: "Return Flight Input",
    comboInput: "Create Departure-Return Combo",
    flightNo: "Flight No.",
    from: "From",
    to: "To",
    date: "YYYY-MM-DD",
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

export default function NewProductPage() {
  const [loading, setLoading] = useState(true);
  const { lang } = useLanguage();
  const texts = PRODUCTS_TEXTS[lang];

  // Form states
  const [formData, setFormData] = useState({
    productCode: '', // 상품코드 추가
    title: { ko: '', en: '' },
    description: { ko: '', en: '' },
    // 새로운 다중 선택 필드들
    countries: [] as Array<{ en: string; ko: string; code: string }>,
    regions: [] as Array<{ ko: string; en: string }>,
    // 기존 호환성 필드들
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
    included: [] as string[],
    notIncluded: [] as string[],
    nights: 1,
    days: 1,
    // 2. 상태 추가 및 기존 flightInfo 주석처리
    flightDepartures: [] as FlightInfo[],
    flightReturns: [] as FlightInfo[],
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
    departureOptions: [] as DepartureOption[],
    detailedPricing: {
      adult: {
        age: '만 12세 이상',
        priceKRW: 0,
        pricePHP: 0,
        priceUSD: 0
      },
      childExtraBed: {
        age: '만 2세 ~ 11세',
        priceKRW: 0,
        pricePHP: 0,
        priceUSD: 0
      },
      childNoBed: {
        age: '만 2세 ~ 11세',
        priceKRW: 0,
        pricePHP: 0,
        priceUSD: 0
      },
      infant: {
        age: '만 24개월 미만',
        priceKRW: 0,
        pricePHP: 0,
        priceUSD: 0
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

  // 이미지 업로드 관련 상태 (ImageUploader 사용으로 인해 불필요)
  // const [imageFiles, setImageFiles] = useState<File[]>([]);
  // const [imagePreviews, setImagePreviews] = useState<string>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [imageUploadError, setImageUploadError] = useState('');

  const [spots, setSpots] = useState<Spot[]>([]);
  const [availableIncludedItems, setAvailableIncludedItems] = useState<IncludeItem[]>([]);
  const [availableNotIncludedItems, setAvailableNotIncludedItems] = useState<NotIncludeItem[]>([]);

  // 3. 조합 상태 추가
  const [flightCombos, setFlightCombos] = useState<{ departure: FlightInfo; return: FlightInfo }[]>([]);
  const [selectedDepIdx, setSelectedDepIdx] = useState<number>(0);
  const [selectedRetIdx, setSelectedRetIdx] = useState<number>(0);

  // ImageUploader 관련 상태
  const imageUploaderRef = useRef<{ uploadToStorage: () => Promise<{ urls: string[] }>; getLocalImages: () => { file: File; preview: string; originalName: string }[]; clearAll: () => void }>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchSpots();
        fetchIncludeItems();
        fetchNotIncludeItems();
        setLoading(false);
      } else {
        // router.push('/admin-login'); // Removed as per edit hint
      }
    });

    return () => unsubscribe();
  }, []); // Removed router from dependency array

  const fetchSpots = async () => {
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
  };

  const fetchIncludeItems = async () => {
    const querySnapshot = await getDocs(collection(db, 'includeItems'));
    setAvailableIncludedItems(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IncludeItem)));
  };
  const fetchNotIncludeItems = async () => {
    const querySnapshot = await getDocs(collection(db, 'notIncludeItems'));
    setAvailableNotIncludedItems(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotIncludeItem)));
  };



  // 선택된 지역의 스팟들 가져오기
  const getSpotsInRegion = () => {
    return spots.filter(spot => 
      spot.country.ko === formData.country.ko && 
      spot.region.ko === formData.region.ko
    );
  };

  // 일정 관련 함수들
  const addDay = () => {
    setFormData(prev => ({
      ...prev,
      schedule: [...prev.schedule, { day: prev.schedule.length + 1, spots: [] }]
    }));
  };

  const removeDay = (dayIndex: number) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== dayIndex).map((day, i) => ({ ...day, day: i + 1 }))
    }));
  };

  const addSpotToDay = (dayIndex: number, spot: Spot) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.map((day, i) => 
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
      schedule: prev.schedule.map((day, i) => 
        i === dayIndex 
          ? { ...day, spots: day.spots.filter((_, j) => j !== spotIndex) }
          : day
      )
    }));
  };

  const toggleIncluded = (id: string) => {
    setFormData(prev => ({
      ...prev,
      included: prev.included.includes(id) 
        ? prev.included.filter(item => item !== id)
        : [...prev.included, id]
    }));
  };

  const toggleNotIncluded = (id: string) => {
    setFormData(prev => ({
      ...prev,
      notIncluded: prev.notIncluded.includes(id) 
        ? prev.notIncluded.filter(item => item !== id)
        : [...prev.notIncluded, id]
    }));
  };

  // 하이라이트 기능 제거됨





  // 이미지 업로드 함수 (ImageUploader 사용으로 인해 불필요)
  // const uploadImages = async (): Promise<string> => {
  //   if (imageFiles.length === 0) return //   const uploadPromises: Promise<string>[] =
  //   imageFiles.forEach(file =>[object Object] //     uploadPromises.push(
  //       uploadFileToServer(file, "products").then(result =>[object Object]  //         if (!result.success || !result.url) {
  //           throw new Error(result.error || Upload failed');
  //         }
  //         return result.url;
  //       })
  //     );
  //   });

  //   return await Promise.all(uploadPromises);
  // };

  const handleImagesUploaded = async (uploadedUrls: string[]) => {
    setImageUploadError('');
    setFormData(prev => ({ ...prev, imageUrls: uploadedUrls }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSaving(true);
    setImageUploadError('');
    
    try {
      // ImageUploader를 통한 이미지 업로드
      let uploadedUrls: string[] = [];
      
      if (imageUploaderRef.current) {
        const result = await imageUploaderRef.current.uploadToStorage();
        uploadedUrls = result.urls;
      }
      
      const productData = {
        title: formData.title,
        description: formData.description,
        duration: {
          startDate: formData.duration.startDate,
          endDate: formData.duration.endDate,
        },
        nights: formData.nights,
        days: formData.days,
        price: formData.price,
        originalPrice: { ko: "", en: "" },
        discount: 0,
        productCode: formData.productCode, // 상품코드 추가
        // 새로운 다중 선택 필드들
        countries: formData.countries,
        regions: formData.regions,
        // 기존 호환성 필드들 (첫 번째 선택 항목으로 설정)
        country: formData.countries.length > 0 ? formData.countries[0] : formData.country,
        region: formData.regions.length > 0 ? formData.regions[0] : formData.region,
        imageUrls: uploadedUrls,
        schedule: formData.schedule,
        includedItems: formData.included.filter(item => item.trim() !== ''),
        notIncludedItems: formData.notIncluded.filter(item => item.trim() !== ''),
        // 기존 flightInfo 관련 코드는 주석처리
        // flightInfo: formData.flightInfo,
        flightDepartures: formData.flightDepartures,
        flightReturns: formData.flightReturns,
        requirements: [{ ko: '', en: '' }],
        notes: [{ ko: '', en: '' }],
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
      };

      await addDoc(collection(db, 'products'), productData);
      
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
              action: 'productCreate',
              details: `새 상품 "${formData.title[lang]}" 등록 - ${Object.keys(productData).join(', ')}`,
              userId: user.uid,
              userEmail: user.email
            })
          });
        }
      } catch (error) {
        console.error('활동 기록 실패:', error);
      }
      
      alert(texts.saveSuccess);
      // router.push('/admin/products'); // Removed as per edit hint
    } catch (error) {
      console.error('[Product Submit] Error saving product:', error);
      setImageUploadError(texts.imageUploadError);
      alert(texts.saveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">{texts.loading}</div>;
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

      <div className="bg-white p-6 rounded-lg shadow">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 상품코드 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              상품코드 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.productCode}
              onChange={(e) => setFormData(prev => ({ ...prev, productCode: e.target.value }))}
              placeholder="예: KR-SEOUL-001"
              className="w-full p-2 border rounded"
              required
            />
            <p className="text-xs text-gray-500 mt-1">고유한 상품 식별 코드를 입력하세요</p>
          </div>
          
          {/* 제목 */}
          <div>
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
          <div>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {texts.formCountry} (중복선택 가능) <span className="text-red-500">*</span>
              </label>
              <div className="border rounded p-3 max-h-48 overflow-y-auto">
                {COUNTRY_OPTIONS.map((country: CountryOption) => (
                  <label key={country.code} className="flex items-center mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.countries.some(c => c.code === country.code)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            countries: [...prev.countries, { ...country }]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            countries: prev.countries.filter(c => c.code !== country.code)
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
              <p className="text-xs text-gray-500 mt-1">선택된 국가: {formData.countries.length}개</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {texts.formRegion} (중복선택 가능) <span className="text-red-500">*</span>
              </label>
              <div className="border rounded p-3 max-h-48 overflow-y-auto">
                {formData.countries.length > 0 ? (
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
                        checked={formData.regions.some(r => r.ko === region.ko)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              regions: [...prev.regions, { ko: region.ko, en: region.en }]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              regions: prev.regions.filter(r => r.ko !== region.ko)
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
              <p className="text-xs text-gray-500 mt-1">선택된 지역: {formData.regions.length}개</p>
            </div>
          </div>

          {/* 가격 (다중 통화) */}
          <div>
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
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                value={formData.duration.startDate}
                onChange={e => setFormData(prev => ({ ...prev, duration: { ...prev.duration, startDate: e.target.value } }))}
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="date"
                value={formData.duration.endDate}
                onChange={e => setFormData(prev => ({ ...prev, duration: { ...prev.duration, endDate: e.target.value } }))}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>
          {/* 몇 박/며칠 입력 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">몇 박 (Nights)</label>
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
              <label className="block text-sm font-medium mb-2">며칠 (Days)</label>
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

          {/* 아이콘 정보 섹션 */}
          <div className="border-t pt-6 mt-6">
            <h2 className="text-lg font-bold mb-4">{texts.formIconInfo}</h2>
            
            {/* 여행 기간 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">{texts.formTripDuration}</label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={formData.iconInfo.tripDuration.ko}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    iconInfo: {
                      ...prev.iconInfo,
                      tripDuration: { ...prev.iconInfo.tripDuration, ko: e.target.value }
                    }
                  }))}
                  placeholder="예: 5박7일"
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  value={formData.iconInfo.tripDuration.en}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    iconInfo: {
                      ...prev.iconInfo,
                      tripDuration: { ...prev.iconInfo.tripDuration, en: e.target.value }
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
                  value={formData.iconInfo.airline.ko}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    iconInfo: {
                      ...prev.iconInfo,
                      airline: { ...prev.iconInfo.airline, ko: e.target.value }
                    }
                  }))}
                  placeholder="예: 티웨이 항공 직항"
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  value={formData.iconInfo.airline.en}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    iconInfo: {
                      ...prev.iconInfo,
                      airline: { ...prev.iconInfo.airline, en: e.target.value }
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
                  value={formData.iconInfo.groupSize.ko}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    iconInfo: {
                      ...prev.iconInfo,
                      groupSize: { ...prev.iconInfo.groupSize, ko: e.target.value }
                    }
                  }))}
                  placeholder="예: 소형 3인"
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  value={formData.iconInfo.groupSize.en}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    iconInfo: {
                      ...prev.iconInfo,
                      groupSize: { ...prev.iconInfo.groupSize, en: e.target.value }
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
                value={formData.iconInfo.guideFee}
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
                  value={formData.iconInfo.selectInfo.ko}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    iconInfo: {
                      ...prev.iconInfo,
                      selectInfo: { ...prev.iconInfo.selectInfo, ko: e.target.value }
                    }
                  }))}
                  placeholder="예: 선택관광 있음"
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  value={formData.iconInfo.selectInfo.en}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    iconInfo: {
                      ...prev.iconInfo,
                      selectInfo: { ...prev.iconInfo.selectInfo, en: e.target.value }
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
                    value={formData.visitingCities.ko.join(', ')}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      visitingCities: {
                        ...prev.visitingCities,
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
                    value={formData.visitingCities.en.join(', ')}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      visitingCities: {
                        ...prev.visitingCities,
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
                    value={formData.bookingStatus.currentBookings}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      bookingStatus: {
                        ...prev.bookingStatus,
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
                    value={formData.bookingStatus.availableSeats}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      bookingStatus: {
                        ...prev.bookingStatus,
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
                    value={formData.bookingStatus.minimumPax}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      bookingStatus: {
                        ...prev.bookingStatus,
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
                    value={formData.bookingStatus.maxCapacity}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      bookingStatus: {
                        ...prev.bookingStatus,
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
                    value={formData.detailedPricing.adult.priceKRW}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      detailedPricing: {
                        ...prev.detailedPricing,
                        adult: { ...prev.detailedPricing.adult, priceKRW: parseInt(e.target.value) || 0 }
                      }
                    }))}
                    placeholder="KRW"
                    className="w-full p-2 border rounded text-xs"
                  />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">PHP</label>
                    <input
                    type="number"
                    value={formData.detailedPricing.adult.pricePHP || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      detailedPricing: {
                        ...prev.detailedPricing,
                        adult: { ...prev.detailedPricing.adult, pricePHP: parseInt(e.target.value) || 0 }
                      }
                    }))}
                    placeholder="PHP (선택)"
                    className="w-full p-2 border rounded text-xs"
                  />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">USD</label>
                    <input
                    type="number"
                    value={formData.detailedPricing.adult.priceUSD || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      detailedPricing: {
                        ...prev.detailedPricing,
                        adult: { ...prev.detailedPricing.adult, priceUSD: parseInt(e.target.value) || 0 }
                      }
                    }))}
                    placeholder="USD (선택)"
                    className="w-full p-2 border rounded text-xs"
                  />
                </div>
              </div>

              {/* 아동 Extra Bed 가격 */}
              <div className="mb-3 p-3 border rounded-lg">
                <h4 className="font-medium text-sm mb-2">{texts.formChildExtraBedPrice}</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="w-full p-2 border rounded text-xs bg-gray-50 flex items-center">
                    <span className="text-gray-700 font-medium">만 2세 ~ 11세</span>
                  </div>
                  <input
                    type="number"
                    value={formData.detailedPricing.childExtraBed.priceKRW}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      detailedPricing: {
                        ...prev.detailedPricing,
                        childExtraBed: { ...prev.detailedPricing.childExtraBed, priceKRW: parseInt(e.target.value) || 0 }
                      }
                    }))}
                    placeholder="KRW"
                    className="w-full p-2 border rounded text-xs"
                  />
                  <input
                    type="number"
                    value={formData.detailedPricing.childExtraBed.pricePHP || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      detailedPricing: {
                        ...prev.detailedPricing,
                        childExtraBed: { ...prev.detailedPricing.childExtraBed, pricePHP: parseInt(e.target.value) || 0 }
                      }
                    }))}
                    placeholder="PHP (선택)"
                    className="w-full p-2 border rounded text-xs"
                  />
                  <input
                    type="number"
                    value={formData.detailedPricing.childExtraBed.priceUSD || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      detailedPricing: {
                        ...prev.detailedPricing,
                        childExtraBed: { ...prev.detailedPricing.childExtraBed, priceUSD: parseInt(e.target.value) || 0 }
                      }
                    }))}
                    placeholder="USD (선택)"
                    className="w-full p-2 border rounded text-xs"
                  />
                </div>
              </div>

              {/* 아동 No Bed 가격 */}
              <div className="mb-3 p-3 border rounded-lg">
                <h4 className="font-medium text-sm mb-2">{texts.formChildNoBedPrice}</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="w-full p-2 border rounded text-xs bg-gray-50 flex items-center">
                    <span className="text-gray-700 font-medium">만 2세 ~ 11세</span>
                  </div>
                  <input
                    type="number"
                    value={formData.detailedPricing.childNoBed.priceKRW}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      detailedPricing: {
                        ...prev.detailedPricing,
                        childNoBed: { ...prev.detailedPricing.childNoBed, priceKRW: parseInt(e.target.value) || 0 }
                      }
                    }))}
                    placeholder="KRW"
                    className="w-full p-2 border rounded text-xs"
                  />
                  <input
                    type="number"
                    value={formData.detailedPricing.childNoBed.pricePHP || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      detailedPricing: {
                        ...prev.detailedPricing,
                        childNoBed: { ...prev.detailedPricing.childNoBed, pricePHP: parseInt(e.target.value) || 0 }
                      }
                    }))}
                    placeholder="PHP (선택)"
                    className="w-full p-2 border rounded text-xs"
                  />
                  <input
                    type="number"
                    value={formData.detailedPricing.childNoBed.priceUSD || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      detailedPricing: {
                        ...prev.detailedPricing,
                        childNoBed: { ...prev.detailedPricing.childNoBed, priceUSD: parseInt(e.target.value) || 0 }
                      }
                    }))}
                    placeholder="USD (선택)"
                    className="w-full p-2 border rounded text-xs"
                  />
                </div>
              </div>

              {/* 유아 가격 */}
              <div className="mb-3 p-3 border rounded-lg">
                <h4 className="font-medium text-sm mb-2">{texts.formInfantPrice}</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="w-full p-2 border rounded text-xs bg-gray-50 flex items-center">
                    <span className="text-gray-700 font-medium">만 24개월 미만</span>
                  </div>
                  <input
                    type="number"
                    value={formData.detailedPricing.infant.priceKRW}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      detailedPricing: {
                        ...prev.detailedPricing,
                        infant: { ...prev.detailedPricing.infant, priceKRW: parseInt(e.target.value) || 0 }
                      }
                    }))}
                    placeholder="KRW"
                    className="w-full p-2 border rounded text-xs"
                  />
                  <input
                    type="number"
                    value={formData.detailedPricing.infant.pricePHP || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      detailedPricing: {
                        ...prev.detailedPricing,
                        infant: { ...prev.detailedPricing.infant, pricePHP: parseInt(e.target.value) || 0 }
                      }
                    }))}
                    placeholder="PHP (선택)"
                    className="w-full p-2 border rounded text-xs"
                  />
                  <input
                    type="number"
                    value={formData.detailedPricing.infant.priceUSD || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      detailedPricing: {
                        ...prev.detailedPricing,
                        infant: { ...prev.detailedPricing.infant, priceUSD: parseInt(e.target.value) || 0 }
                      }
                    }))}
                    placeholder="USD (선택)"
                    className="w-full p-2 border rounded text-xs"
                  />
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
                    value={formData.additionalInfo.fuelSurcharge.ko}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      additionalInfo: {
                        ...prev.additionalInfo,
                        fuelSurcharge: { ...prev.additionalInfo.fuelSurcharge, ko: e.target.value }
                      }
                    }))}
                    placeholder="예: 유류할증료 127,600원 포함"
                    className="w-full p-2 border rounded"
                  />
                  <input
                    type="text"
                    value={formData.additionalInfo.fuelSurcharge.en}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      additionalInfo: {
                        ...prev.additionalInfo,
                        fuelSurcharge: { ...prev.additionalInfo.fuelSurcharge, en: e.target.value }
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
                    value={formData.additionalInfo.taxes.ko}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      additionalInfo: {
                        ...prev.additionalInfo,
                        taxes: { ...prev.additionalInfo.taxes, ko: e.target.value }
                      }
                    }))}
                    placeholder="예: 제세공과금 0원 포함"
                    className="w-full p-2 border rounded"
                  />
                  <input
                    type="text"
                    value={formData.additionalInfo.taxes.en}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      additionalInfo: {
                        ...prev.additionalInfo,
                        taxes: { ...prev.additionalInfo.taxes, en: e.target.value }
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
                      value={formData.localExpenses.adult}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        localExpenses: {
                          ...prev.localExpenses,
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
                      value={formData.localExpenses.child}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        localExpenses: {
                          ...prev.localExpenses,
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
          </div>

          {/* 항공편 입력폼 */}
  <div className="border-t pt-6 mt-6">
    <h2 className="text-lg font-bold mb-2">{texts.depInput}</h2>
                <FlightInputForm
              onAdd={flight => setFormData(prev => ({ ...prev, flightDepartures: [...prev.flightDepartures, flight] }))}
              lang={lang}
            />
    <div className="flex flex-wrap gap-2 mt-2">
      {formData.flightDepartures.map((flight, idx) => (
        <PillButton key={idx} selected={selectedDepIdx === idx} onClick={() => setSelectedDepIdx(idx)}>
          {flight.airline[lang]} {flight.flightNumber} {flight.from}-{flight.to} {flight.departTime}-{flight.arriveTime}
        </PillButton>
      ))}
    </div>
    <h2 className="text-lg font-bold mb-2 mt-6">{texts.retInput}</h2>
                <FlightInputForm
              onAdd={flight => setFormData(prev => ({ ...prev, flightReturns: [...prev.flightReturns, flight] }))}
              lang={lang}
            />
    <div className="flex flex-wrap gap-2 mt-2">
      {formData.flightReturns.map((flight, idx) => (
        <PillButton key={idx} selected={selectedRetIdx === idx} onClick={() => setSelectedRetIdx(idx)}>
          {flight.airline[lang]} {flight.flightNumber} {flight.from}-{flight.to} {flight.departTime}-{flight.arriveTime}
        </PillButton>
      ))}
    </div>
    {/* 조합 만들기 영역 */}
    <div className="mt-8">
      <h2 className="text-lg font-bold mb-2">{texts.comboInput}</h2>
      <div className="flex items-center gap-2 mb-4">
        <select value={selectedDepIdx} onChange={e => setSelectedDepIdx(Number(e.target.value))} className="p-2 border rounded">
          {formData.flightDepartures.map((flight, idx) => (
            <option key={idx} value={idx}>
              {flight.airline[lang]} {flight.flightNumber} {flight.from}-{flight.to} {flight.departTime}
            </option>
          ))}
        </select>
        <span>→</span>
        <select value={selectedRetIdx} onChange={e => setSelectedRetIdx(Number(e.target.value))} className="p-2 border rounded">
          {formData.flightReturns.map((flight, idx) => (
            <option key={idx} value={idx}>
              {flight.airline[lang]} {flight.flightNumber} {flight.from}-{flight.to} {flight.departTime}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="bg-blue-500 text-white rounded px-3 py-1"
          onClick={() => {
            const dep = formData.flightDepartures[selectedDepIdx];
            const ret = formData.flightReturns[selectedRetIdx];
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
              departureOptions={formData.departureOptions}
              onUpdate={(options) => setFormData(prev => ({ ...prev, departureOptions: options }))}
              lang={lang}
            />
          </div>

          {/* 이미지 업로드 (새 스팟 등록 페이지와 동일한 방식) */}
          <div>
            <label className="block text-sm font-medium mb-2">{texts.formImageUpload}</label>
            <ImageUploader
              ref={imageUploaderRef}
              onImagesSelected={(files) => {
                console.log('상품 이미지 선택됨:', files.length);
              }}
              onImagesUploaded={handleImagesUploaded}
              folder="products"
              multiple={true}
              maxFiles={10}
              showOptimizationInfo={true}
              usage="product-detail" // 상품 상세용 최적화 적용
            />
            
            {imageUploadError && (
              <p className="text-red-500 text-sm mt-2">{imageUploadError}</p>
            )}

            {/* 이미지 미리보기 */}
            {formData.imageUrls.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-4">
                {formData.imageUrls.map((preview, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={preview}
                      alt={`Product image ${index + 1}`}
                      width={200}
                      height={200}
                      className="w-full h-32 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== index) }))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 일정 관리 */}
          <div>
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
            
            {formData.schedule.map((day, dayIndex) => (
              <div key={dayIndex} className="border rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">{texts.day} {day.day}</h4>
                  {formData.schedule.length > 1 && (
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
                {formData.region.ko && (
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

          {/* 포함 사항 */}
          <div>
            <label className="block text-sm font-medium mb-2">{texts.formIncluded}</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {availableIncludedItems.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleIncluded(item.id)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors
                    ${formData.included.includes(item.id)
                      ? 'bg-blue-600 text-white border-blue-600 shadow'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
                >
                  {item[lang]}
                </button>
              ))}
            </div>
          </div>

          {/* 하이라이트 기능 제거됨 */}

          {/* 불포함 사항 */}
          <div>
            <label className="block text-sm font-medium mb-2">{texts.formNotIncluded}</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {availableNotIncludedItems.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleNotIncluded(item.id)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors
                    ${formData.notIncluded.includes(item.id)
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
              disabled={isSaving}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSaving ? texts.saving : texts.save}
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
    </div>
  );
} 

// FlightInputForm 컴포넌트는 아래에 임시로 파일 내에 구현(추후 분리 가능)
function FlightInputForm({ onAdd, lang = 'en' }: { onAdd: (flight: FlightInfo) => void; lang?: 'ko' | 'en' }) {
  // 항공사 옵션
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
  // 시/분 옵션
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

// 출발 일정 입력 컴포넌트
function DepartureOptionsInput({ 
  departureOptions, 
  onUpdate, 
  lang = 'ko' 
}: { 
  departureOptions: DepartureOption[]; 
  onUpdate: (options: DepartureOption[]) => void; 
  lang?: 'ko' | 'en'; 
}) {
  const [newOption, setNewOption] = useState<DepartureOption>({
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

  const updateOption = (index: number, field: keyof DepartureOption, value: string) => {
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