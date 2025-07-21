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
    formHighlights: "하이라이트",
    formIncluded: "포함 사항",
    formNotIncluded: "불포함 사항",
    startDate: "시작일",
    endDate: "종료일",
    selectCountry: "국가 선택",
    selectRegion: "지역 선택",
    imageUploading: "이미지 업로드 중...",
    imageUploadError: "이미지 업로드에 실패했습니다.",
    dragDropImages: "이미지를 드래그하여 업로드하거나 클릭하여 선택하세요",
    noSpotsInRegion: "이 지역에 등록된 스팟이 없습니다.",
    selectSpotsForDay: "이 날짜에 방문할 스팟을 선택하세요",
    selectHighlightSpotsFromSchedule: "일정에 포함된 스팟 중에서 하이라이트를 선택하세요",
    day: "일차",
    addDay: "일차 추가",
    removeDay: "일차 삭제",
    selectHighlightSpots: "하이라이트 스팟 선택",
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
    formHighlights: "Highlights",
    formIncluded: "Included Items",
    formNotIncluded: "Not Included Items",
    startDate: "Start Date",
    endDate: "End Date",
    selectCountry: "Select Country",
    selectRegion: "Select Region",
    imageUploading: "Uploading image...",
    imageUploadError: "Image upload failed.",
    dragDropImages: "Drag and drop images or click to select",
    noSpotsInRegion: "No spots registered in this region.",
    selectSpotsForDay: "Select spots to visit on this day",
    selectHighlightSpotsFromSchedule: "Select highlights from spots in the schedule",
    day: "Day",
    addDay: "Add Day",
    removeDay: "Remove Day",
    selectHighlightSpots: "Select Highlight Spots",
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
  const [formData, setFormData] = useState({
    title: { ko: '', en: '' },
    description: { ko: '', en: '' },
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
    highlights: [] as Array<{
      spotId: string;
      spotName: { ko: string; en: string };
    }>,
    included: [''] as string[],
    notIncluded: [''] as string[],
    nights: 1,
    days: 1,
    flightInfo: {
      airline: { ko: '', en: '' },
      flightNumber: '',
      departure: { from: '', to: '', departTime: '', arriveTime: '' },
      return: { from: '', to: '', departTime: '', arriveTime: '' },
    },
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
          title: productData.title || { ko: '', en: '' },
          description: productData.description || { ko: '', en: '' },
          country: productData.country || { en: 'KR', ko: '대한민국' },
          region: productData.region || { ko: '', en: '' },
          price: productData.price || { KRW: '', PHP: '', USD: '' },
          duration: productData.duration || { startDate: '', endDate: '' },
          imageUrls: productData.imageUrls || [],
          schedule: productData.schedule || [{
            day: 1,
            spots: []
          }],
          highlights: productData.highlights || [],
          included: productData.includedItems || [''],
          notIncluded: productData.notIncludedItems || [''],
          nights: productData.nights || 1,
          days: productData.days || 1,
          flightInfo: productData.flightInfo || {
            airline: { ko: '', en: '' },
            flightNumber: '',
            departure: { from: '', to: '', departTime: '', arriveTime: '' },
            return: { from: '', to: '', departTime: '', arriveTime: '' },
          },
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

  // 선택된 국가의 지역 옵션 가져오기
  const getRegionOptions = () => {
    const countryCode = COUNTRY_OPTIONS.find(c => c.ko === formData.country.ko)?.code || 'KR';
    return REGION_OPTIONS_BY_COUNTRY[countryCode as keyof typeof REGION_OPTIONS_BY_COUNTRY] || [];
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

  // 포함/불포함 항목 관리 함수들
  const toggleIncluded = (id: string) => {
    setFormData(prev => ({
      ...prev,
      included: prev.included.includes(id)
        ? prev.included.filter(i => i !== id)
        : [...prev.included, id],
    }));
  };
  const toggleNotIncluded = (id: string) => {
    setFormData(prev => ({
      ...prev,
      notIncluded: prev.notIncluded.includes(id)
        ? prev.notIncluded.filter(i => i !== id)
        : [...prev.notIncluded, id],
    }));
  };

  // 일정에 포함된 모든 스팟들 가져오기
  const getSpotsInSchedule = () => {
    const spotIds = formData.schedule.flatMap(day => day.spots.map(spot => spot.spotId));
    return spots.filter(spot => spotIds.includes(spot.id));
  };

  // 하이라이트 관련 함수들
  const addHighlight = (spot: Spot) => {
    setFormData(prev => ({
      ...prev,
      highlights: [...prev.highlights, {
        spotId: spot.id,
        spotName: spot.name
      }]
    }));
  };

  const removeHighlight = (spotId: string) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights.filter(h => h.spotId !== spotId)
    }));
  };

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
      setFormData(prev => ({ ...prev, imageUrls: [...prev.imageUrls, ...urls] }));
    } catch {
      setImageUploadError(texts.imageUploadError);
    } finally {
      setUploadingCount((prev) => prev - (files.length || 0));
    }
  };

  const handleRemoveImage = (idx: number) => {
    setFormData(prev => ({ ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== idx) }));
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
        country: formData.country,
        region: formData.region,
        imageUrls: formData.imageUrls,
        schedule: formData.schedule,
        highlights: formData.highlights,
        includedItems: formData.included.filter(item => item.trim() !== ''),
        notIncludedItems: formData.notIncluded.filter(item => item.trim() !== ''),
        nights: formData.nights,
        days: formData.days,
        flightDepartures,
        flightReturns,
        flightCombos,
        updatedAt: new Date()
      };
              // Product data ready for update
      await updateDoc(doc(db, 'products', params.id as string), productData);
      
      // 활동 기록
      try {
        const user = auth.currentUser;
        if (user) {
          const idToken = await user.getIdToken();
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
          {/* 국가/지역 선택 */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">{texts.formCountry}</label>
              <select
                value={formData.country.ko}
                onChange={(e) => {
                  const country = COUNTRY_OPTIONS.find(c => c.ko === e.target.value);
                  setFormData(prev => ({ 
                    ...prev, 
                    country: country || { en: 'Korea', ko: '대한민국' },
                    region: { ko: '', en: '' }
                  }));
                }}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">{texts.selectCountry}</option>
                {COUNTRY_OPTIONS.map((country: CountryOption) => (
                  <option key={country.code} value={country.ko}>
                    {lang === 'ko' ? country.ko : country.en}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{texts.formRegion}</label>
              <select
                value={formData.region.ko}
                onChange={(e) => {
                  const region = getRegionOptions().find(r => r.ko === e.target.value);
                  setFormData(prev => ({ 
                    ...prev, 
                    region: region || { ko: '', en: '' }
                  }));
                }}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">{texts.selectRegion}</option>
                {getRegionOptions().map((region: { ko: string; en: string }) => (
                  <option key={region.ko} value={region.ko}>
                    {lang === 'ko' ? region.ko : region.en}
                  </option>
                ))}
              </select>
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
          {formData.imageUrls.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-4">
              {formData.imageUrls.map((url, index) => (
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
                  ${formData.included.includes(item.id)
                    ? 'bg-blue-600 text-white border-blue-600 shadow'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
              >
                {item[lang]}
              </button>
            ))}
          </div>
        </div>

        {/* 하이라이트 섹션 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">{texts.formHighlights}</h2>
          <p className="text-sm text-gray-600 mb-3">{texts.selectHighlightSpotsFromSchedule}</p>
          
          {/* 일정에 포함된 스팟들 중에서 선택 */}
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto mb-3">
            {getSpotsInSchedule().map(spot => (
              <button
                key={spot.id}
                type="button"
                onClick={() => addHighlight(spot)}
                disabled={formData.highlights.some(h => h.spotId === spot.id)}
                className={`p-2 text-left rounded border text-sm ${
                  formData.highlights.some(h => h.spotId === spot.id)
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'bg-white hover:bg-gray-50 cursor-pointer'
                }`}
              >
                {spot.name[lang]}
              </button>
            ))}
          </div>
          
          {/* 선택된 하이라이트들 */}
          {formData.highlights.length > 0 && (
            <div className="space-y-2">
              {formData.highlights.map((highlight, index) => (
                <div key={index} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                  <span className="text-sm">{highlight.spotName[lang]}</span>
                  <button
                    type="button"
                    onClick={() => removeHighlight(highlight.spotId)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    {texts.delete}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

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