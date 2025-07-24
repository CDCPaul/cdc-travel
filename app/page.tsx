"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState, useCallback, useRef } from "react";
import { doc, getDoc, collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLanguage } from "@/components/LanguageContext";
import MainLayout from '../components/MainLayout';
import { Banner } from "@/types/banner";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Autoplay } from "swiper/modules";
import { logEvent, logScrollToBottom, logTimeOnPage, logViewAllToursClick, incrementTourClick } from "@/lib/analytics";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useSiteSettings } from "@/lib/settings";
import { safeLang } from "@/lib/types";

// Product 타입 정의
interface Product {
  id?: string;
  title?: string | { ko: string; en: string };
  subtitle?: string | { ko: string; en: string };
  description?: string | { ko: string; en: string };
  price?: string | { ko: string; en: string };
  originalPrice?: string | { ko: string; en: string };
  duration?: string | { ko: string; en: string };
  imageUrl?: string;
  imageUrls?: string[];
  category?: string | { ko: string; en: string };
  region?: string | { ko: string; en: string };
  discount?: number;
  highlights?: Array<string | { ko: string; en: string }>;
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
  isActive?: boolean;
  isFeatured?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// 상품 리스트 불러오기 함수
async function fetchProducts(): Promise<Product[]> {
  const querySnapshot = await getDocs(collection(db, "products"));
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      // 이미지 URL 처리: imageUrls 배열이 있으면 첫 번째 이미지 사용, 없으면 imageUrl 사용
      imageUrl: data.imageUrls && data.imageUrls.length > 0 
        ? data.imageUrls[0] 
        : data.imageUrl || null
    };
  });
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.15 } })
};

const TEXT = {
  slogan: {
    ko: "CDC Travel은 고객 만족을 최우선으로 생각하는 전문 여행사입니다.",
    en: "CDC Travel is a professional travel company that puts customer satisfaction first."
  },
  aboutTitle: { ko: "CDC Travel", en: "CDC Travel" },
  aboutDesc: {
    ko: "CDC Travel은 고객 만족을 최우선으로 생각하는 전문 여행사입니다. 안전하고 즐거운 여행을 약속드립니다.",
    en: "CDC Travel is a professional travel company that puts customer satisfaction first. We are committed to providing safe and enjoyable travel experiences."
  },
  featuredTours: { ko: "인기 투어", en: "Featured Tours" },
  seeAllTours: { ko: "모든 투어 보기", en: "See All Tours" },
  contactTitle: { ko: "문의하기", en: "Contact Us" },
  contactDesc: { ko: "궁금한 점이 있으시면 언제든지 연락주세요!", en: "If you have any questions, feel free to contact us!" },
  email: { ko: "이메일 문의", en: "Email Inquiry" },
  facebook: { ko: "Facebook", en: "Facebook" },
  kakao: { ko: "KakaoTalk", en: "KakaoTalk" },
  viber: { ko: "Viber", en: "Viber" },
  footerSlogan: { ko: "당신의 완벽한 여행을 위한 최고의 선택", en: "The best choice for your perfect trip" },
  service: { ko: "서비스", en: "Services" },
  support: { ko: "고객지원", en: "Support" },
  contact: { ko: "연락처", en: "Contact" },
  tour: { ko: "투어상품", en: "Tours" },
  info: { ko: "여행정보", en: "Travel Info" },
  about: { ko: "회사소개", en: "About Us" },
  inquiry: { ko: "문의하기", en: "Contact" },
  email2: { ko: "이메일", en: "Email" },
  phone: { ko: "전화", en: "Phone" },
  privacy: { ko: "개인정보처리방침", en: "Privacy Policy" },
  terms: { ko: "서비스 이용약관", en: "Terms of Service" },
  copyright: { ko: "All rights reserved.", en: "All rights reserved." },
  viewDetails: { ko: "자세히 보기", en: "View Details" },
  heroTitle: { ko: "새로운 여행의 시작", en: "Start Your New Journey" },
  heroSubtitle: { ko: "CDC Travel과 함께 특별한 순간을 만들어보세요", en: "Create special moments with CDC Travel" }
};

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const { lang } = useLanguage();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerCache, setBannerCache] = useState<Banner[]>([]);
  const [hasInitialBanner, setHasInitialBanner] = useState(false);
  const [bannerLoadingStates, setBannerLoadingStates] = useState<{ [key: string]: boolean }>({});
  const [bannerLoadProgress, setBannerLoadProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const { settings } = useSiteSettings();

  // 배너별 색상 배열
  const bannerColors = [
    "from-[#2C6E6F] via-[#3A8A8B] to-[#4A9D9E]", // 기본 색상
    "from-[#1E4A4B] via-[#2A6A6B] to-[#3A7D7E]", // 어두운 톤
    "from-[#3A8A8B] via-[#4A9D9E] to-[#5AB0B1]", // 밝은 톤
    "from-[#2A6A6B] via-[#3A7D7E] to-[#4A9091]", // 중간 톤
    "from-[#4A9D9E] via-[#5AB0B1] to-[#6AC3C4]", // 매우 밝은 톤
  ];

  // 배너 이미지 순차적 프리로딩 함수
  const preloadBannerImages = async (bannerList: Banner[]) => {
    const imageBanners = bannerList.filter(banner => banner.type === "image");
    
    for (let i = 0; i < imageBanners.length; i++) {
      const banner = imageBanners[i];
      setBannerLoadingStates(prev => ({ ...prev, [banner.id]: true }));
      
      try {
        await new Promise<void>((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => {
            setBannerLoadingStates(prev => ({ ...prev, [banner.id]: false }));
            setBannerLoadProgress(prev => prev + (100 / imageBanners.length));
            resolve();
          };
          img.onerror = () => {
            setBannerLoadingStates(prev => ({ ...prev, [banner.id]: false }));
            reject(new Error(`Failed to load banner image: ${banner.url}`));
          };
          img.src = banner.url;
        });
        
        // 순차적 로딩을 위한 짧은 지연
        if (i < imageBanners.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`배너 이미지 로딩 실패 (${banner.id}):`, error);
      }
    }
  };

  // 배너 데이터를 미리 로드하는 함수
  const preloadBanners = useCallback(async () => {
    try {
      const q = query(
        collection(db, "settings/banners/items"),
        where("active", "==", true),
        orderBy("order"),
      );
      const snap = await getDocs(q);
      const data: Banner[] = snap.docs.slice(0, 10).map(doc => ({ id: doc.id, ...doc.data() } as Banner));
      setBannerCache(data);
      
      // 모든 배너를 한번에 표시 (비디오 재생 제어를 위해)
      if (data.length > 0) {
        setBanners(data);
        setHasInitialBanner(true);
        
        // 이미지 배너들만 순차적으로 프리로드
        const imageBanners = data.filter(b => b.type === "image");
        if (imageBanners.length > 0) {
          await preloadBannerImages(imageBanners);
        }
      }
    } catch (error) {
      console.error('배너 프리로드 실패:', error);
    }
  }, []);



  useEffect(() => {
    // 배너 로딩 상태 초기화
    setBannerLoadingStates({});
    setBannerLoadProgress(0);
    
    // 페이지 로드 이벤트 추적
    logEvent('page_view', {
      page_title: 'Home',
      page_location: '/',
      language: lang
    });

    // 스크롤 이벤트 추적
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      
      // 페이지 하단에 도달했을 때 (90% 이상 스크롤)
      if (scrollTop + windowHeight >= documentHeight * 0.9) {
        logScrollToBottom('/', 'Home');
      }
    };

    // 시간 체류 이벤트 추적 (30초 후)
    const timeOnPageTimer = setTimeout(() => {
      logTimeOnPage('/', 'Home', 30);
    }, 30000);

    // 스크롤 이벤트 리스너 추가
    window.addEventListener('scroll', handleScroll);

    fetchProducts().then(setProducts);
    // Firestore에서 settings/mainPage 문서 읽기
    const fetchMainPage = async () => {
      const docRef = doc(db, "settings", "mainPage");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        // const data = docSnap.data() as MainPageData; // 사용하지 않으므로 주석 처리 또는 삭제
      }
    };
    fetchMainPage();

    // 배너 초기화 - 캐시된 데이터가 있으면 즉시 사용
    const initializeBanners = () => {
      if (bannerCache.length > 0) {
        setBanners(bannerCache);
        setHasInitialBanner(true);
        
        // 이미지 배너들만 순차적으로 프리로드
        const imageBanners = bannerCache.filter(b => b.type === "image");
        if (imageBanners.length > 0) {
          preloadBannerImages(imageBanners);
        }
        return;
      }
      
      // 캐시가 없으면 즉시 로드
      preloadBanners();
    };

    initializeBanners();

    // 클린업 함수
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeOnPageTimer);
    };
  }, [lang, bannerCache, preloadBanners]);

  // 비디오 재생 제어를 위한 useEffect
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === activeIndex) {
          video.play().catch(() => {}); // 브라우저 autoplay 정책 방지
        } else {
          video.pause();
          video.currentTime = 0;
        }
      }
    });
  }, [activeIndex]);

  // 투어 클릭 이벤트 핸들러
  const handleTourClick = async (tourId: string, tourTitle: string) => {
    // 투어 클릭수 증가
    try {
      await incrementTourClick(tourId);
    } catch (error) {
      console.error('Failed to increment tour click:', error);
    }
    
    logEvent('tour_click', {
      tour_id: tourId,
      tour_title: tourTitle,
      location: 'homepage_featured',
      language: lang
    });
  };

  // 연락처 클릭 이벤트 핸들러
  const handleContactClick = (contactType: string) => {
    logEvent('contact_click', {
      contact_type: contactType,
      location: 'homepage',
      language: lang
    });
  };

  // 배너 클릭 이벤트 핸들러
  const handleBannerClick = (bannerId: string, bannerTitle: string) => {
    logEvent('banner_click', {
      banner_id: bannerId,
      banner_title: bannerTitle,
      location: 'homepage_hero',
      language: lang
    });
  };

  return (
    <MainLayout>
      {/* Hero Section - 새로운 레이아웃 */}
      <section
        className="relative w-full h-[800px] flex items-center justify-center overflow-hidden"
      >
        {!hasInitialBanner && banners.length === 0 ? (
          // 즉시 표시되는 스켈레톤 (첫 번째 배너가 없을 때만)
          <div className={`w-full h-full bg-gradient-to-br ${bannerColors[0]} flex items-center justify-center relative`}>
            <div className="absolute inset-0 bg-[url('/pattern.svg')] bg-repeat opacity-10" />
            <div className="text-center text-white">
              <div className="w-12 h-12 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <div className="text-sm opacity-80">배너 로딩 중...</div>
              {bannerLoadProgress > 0 && (
                <div className="mt-2">
                  <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden mx-auto">
                    <div 
                      className="h-full bg-white transition-all duration-300 ease-out"
                      style={{ width: `${bannerLoadProgress}%` }}
                    />
                  </div>
                  <div className="text-xs mt-1 opacity-60">{Math.round(bannerLoadProgress)}%</div>
                </div>
              )}
            </div>
          </div>
        ) : banners.length > 0 ? (
          <Swiper
            modules={[Autoplay]}
            spaceBetween={0}
            slidesPerView={1}
            loop={banners.length > 1}
            autoplay={{ delay: 10000, disableOnInteraction: false }}
            className="w-full h-full rounded-none"
            onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
          >
            {banners.map((banner, index) => (
              <SwiperSlide key={banner.id}>
                <Link 
                  href={banner.link} 
                  className="block group w-full h-full"
                  onClick={() => handleBannerClick(banner.id, banner[`title_${lang}`] || 'banner')}
                >
                  <div className="relative w-full h-full flex bg-black overflow-hidden">
                    {/* 왼쪽 텍스트 영역 (720px) */}
                    <div className="w-[720px] h-full flex items-center justify-center relative">
                      <div className={`absolute inset-0 bg-gradient-to-br ${banner.leftBackgroundColor || bannerColors[index % bannerColors.length]}`} />
                      <div className="absolute inset-0 bg-[url('/pattern.svg')] bg-repeat opacity-10" />
                      <div className={`relative z-10 text-center ${banner.leftTextColor || 'text-white'} px-12`}>
                        <h1 className="text-5xl font-bold mb-6 leading-tight">
                          {banner[`leftTitle_${lang}`] || TEXT.heroTitle[lang]}
                        </h1>
                        <p className="text-xl mb-8 opacity-90 leading-relaxed">
                          {banner[`leftSubtitle_${lang}`] || TEXT.heroSubtitle[lang]}
                        </p>
                        
                      </div>
                    </div>
                    
                    {/* 오른쪽 미디어 영역 (1200px) */}
                    <div className="flex-1 h-full relative overflow-hidden">
                      {banner.type === "image" ? (
                        <>
                          {bannerLoadingStates[banner.id] && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                              <LoadingSpinner size="sm" text={lang === 'ko' ? "이미지 로딩 중..." : "Loading image..."} lang={lang} className="text-white" />
                            </div>
                          )}
                          <Image
                            src={banner.url}
                            alt={banner[`title_${lang}`] || "banner"}
                            fill
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
                            priority={index === 0}
                            loading={index === 0 ? "eager" : "lazy"}
                            sizes="1200px"
                            quality={85}
                            placeholder="blur"
                            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                          />
                        </>
                      ) : (
                        <video
                          ref={(el) => {
                            videoRefs.current[index] = el;
                          }}
                          src={banner.url}
                          controls={false}
                          autoPlay={false}
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
                        />
                      )}
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${bannerColors[0]} flex items-center justify-center`}>
            <div className="absolute inset-0 bg-[url('/pattern.svg')] bg-repeat opacity-10" />
          </div>
        )}
      </section>

      {/* Featured Tours - 개선된 디자인 */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-white to-[#F0F7F7]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1A3A3A] mb-4">
              {TEXT.featuredTours[lang]}
            </h2>
            <div className="h-1 w-32 bg-gradient-to-r from-[#2C6E6F] to-[#4A9D9E] mx-auto rounded-full" />
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.slice(0, 3).map((product: Product, i: number) => (
              <motion.div
                key={product.id}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariants}
              >
                <Link 
                  href={`/tours/${product.id}`} 
                  className="block h-full"
                  onClick={() => handleTourClick(product.id || '', safeLang(product.title || '', lang))}
                >
                  <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 h-full overflow-hidden group">
                    <div className="relative h-56 overflow-hidden">
                      {product.imageUrl ? (
                        <Image 
                          src={product.imageUrl} 
                          alt={safeLang(product.title || '', lang) || 'Tour Image'} 
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110" 
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#2C6E6F] to-[#4A9D9E] flex items-center justify-center">
                          <span className="text-white text-7xl">🌏</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {product.region && (
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-[#2C6E6F] px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                          {safeLang(product.region, lang)}
                        </div>
                      )}
                      {product.price && (
                        <div className="absolute bottom-4 right-4 bg-[#2C6E6F]/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                          {safeLang(product.price, lang)}
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-3 text-[#1A3A3A] line-clamp-1 group-hover:text-[#2C6E6F] transition-colors">
                        {safeLang(product.title || '', lang)}
                      </h3>
                      <p className="text-[#5A7A7A] mb-4 line-clamp-2">
                        {safeLang(product.description || '', lang)}
                      </p>
                      <div className="flex items-center text-[#2C6E6F] font-semibold group-hover:text-[#3A8A8B] transition-colors">
                        <span>{TEXT.viewDetails[lang]}</span>
                        <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center mt-16"
          >
            <Link
              href="/tours"
              className="inline-block bg-gradient-to-r from-[#2C6E6F] to-[#3A8A8B] text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              onClick={() => logViewAllToursClick('homepage')}
            >
              {TEXT.seeAllTours[lang]}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Contact Section - 개선된 디자인 */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1A3A3A] mb-4">
              {TEXT.contactTitle[lang]}
            </h2>
            <div className="h-1 w-32 bg-gradient-to-r from-[#2C6E6F] to-[#4A9D9E] mx-auto rounded-full mb-8" />
            <p className="text-lg md:text-xl text-[#5A7A7A] max-w-2xl mx-auto">
              {TEXT.contactDesc[lang]}
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto"
          >
            <a
              href={`mailto:${settings?.contactEmail || 'info@cdc-travel.com'}`}
              className="flex flex-col items-center bg-gradient-to-br from-[#F0F7F7] to-white border-2 border-[#7FC4C5] text-[#2C6E6F] px-6 py-8 rounded-2xl font-medium hover:shadow-xl hover:scale-105 transition-all duration-300 group"
              onClick={() => handleContactClick('email')}
            >
              <svg className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {TEXT.email[lang]}
            </a>
            
            {settings?.socialMedia?.facebook && (
              <a
                href={settings.socialMedia.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 px-6 py-8 rounded-2xl font-medium hover:shadow-xl hover:scale-105 transition-all duration-300 group"
                onClick={() => handleContactClick('facebook')}
              >
                <div className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform">
                  <Image src="/images/messenger_facebook.png" alt="Facebook" width={48} height={48} />
                </div>
                {TEXT.facebook[lang]}
              </a>
            )}
            
            {settings?.socialMedia?.kakao && (
              <a
                href={settings.socialMedia.kakao}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center bg-[#FEE500] text-black px-6 py-8 rounded-2xl font-medium hover:shadow-xl hover:scale-105 transition-all duration-300 group"
                onClick={() => handleContactClick('kakao')}
              >
                <div className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform">
                  <Image src="/images/messenger_kakao.png" alt="KakaoTalk" width={48} height={48} />
                </div>
                {TEXT.kakao[lang]}
              </a>
            )}
            
            {settings?.socialMedia?.viber && (
              <a
                href={settings.socialMedia.viber}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center bg-gradient-to-br from-[#7360F2] to-[#665ED3] text-white px-6 py-8 rounded-2xl font-medium hover:shadow-xl hover:scale-105 transition-all duration-300 group"
                onClick={() => handleContactClick('viber')}
              >
                <div className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform">
                  <Image src="/images/messenger_viber.png" alt="Viber" width={48} height={48} />
                </div>
                {TEXT.viber[lang]}
              </a>
            )}
          </motion.div>
        </div>
      </section>

      {/* Footer - 개선된 디자인 */}
      <footer className="bg-gradient-to-br from-[#1A3A3A] to-[#2C6E6F] text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div style={{ position: 'relative', height: '50px', width: '150px', marginBottom: '20px' }}>
                <Image
                  src="/images/CDC_LOGO.webp"
                  alt="CDC Travel"
                  fill
                  style={{ objectFit: 'contain' }}
                  priority
                  sizes="150px"
                />
              </div>
              <p className="text-gray-300 leading-relaxed">
                {typeof settings?.siteDescription === 'object' 
                  ? settings.siteDescription[lang] 
                  : settings?.siteDescription || TEXT.footerSlogan[lang]}
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-6 text-[#7FC4C5]">{TEXT.service[lang]}</h3>
              <ul className="space-y-3 text-gray-300">
                <li><Link href="/tours" className="hover:text-white hover:translate-x-1 inline-block transition-all">{TEXT.tour[lang]}</Link></li>
                <li><Link href="/travel-info" className="hover:text-white hover:translate-x-1 inline-block transition-all">{TEXT.info[lang]}</Link></li>
                <li><Link href="/about-us" className="hover:text-white hover:translate-x-1 inline-block transition-all">{TEXT.about[lang]}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-6 text-[#7FC4C5]">{TEXT.support[lang]}</h3>
              <ul className="space-y-3 text-gray-300">
                <li><Link href="/contact" className="hover:text-white hover:translate-x-1 inline-block transition-all">{TEXT.inquiry[lang]}</Link></li>
                <li><a href={`mailto:${settings?.contactEmail || 'info@cdc-travel.com'}`} className="hover:text-white hover:translate-x-1 inline-block transition-all">{TEXT.email2[lang]}</a></li>
                <li><Link href="/privacy-policy" className="hover:text-white hover:translate-x-1 inline-block transition-all">{TEXT.privacy[lang]}</Link></li>
                <li><Link href="/terms-of-service" className="hover:text-white hover:translate-x-1 inline-block transition-all">{TEXT.terms[lang]}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-6 text-[#7FC4C5]">{TEXT.contact[lang]}</h3>
              <p className="text-gray-300 leading-relaxed">
                {TEXT.email2[lang]}: {settings?.contactEmail || 'info@cdc-travel.com'}<br />
                {TEXT.phone[lang]}: {settings?.contactPhone || '+82-XXX-XXXX-XXXX'}
              </p>
            </div>
          </div>
          <div className="border-t border-[#3A8A8B] pt-8 text-center">
            <p className="text-gray-300">&copy; 2024 CDC Travel. {TEXT.copyright[lang]}</p>
          </div>
        </div>
      </footer>
    </MainLayout>
  );
}
