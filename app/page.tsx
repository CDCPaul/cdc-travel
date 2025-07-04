"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { fetchProducts, Product } from "@/lib/firebase-sample";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLanguage } from "@/components/LanguageContext";
import MainLayout from '../components/MainLayout';
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { Banner } from "@/types/banner";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css/pagination";

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
  copyright: { ko: "All rights reserved.", en: "All rights reserved." },
  viewDetails: { ko: "자세히 보기", en: "View Details" },
  heroTitle: { ko: "새로운 여행의 시작", en: "Start Your New Journey" },
  heroSubtitle: { ko: "CDC Travel과 함께 특별한 순간을 만들어보세요", en: "Create special moments with CDC Travel" }
};

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const { lang } = useLanguage();
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
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

    async function fetchBanners() {
      const q = query(
        collection(db, "settings/banners/items"),
        where("active", "==", true),
        orderBy("order"),
      );
      const snap = await getDocs(q);
      const data: Banner[] = snap.docs.slice(0, 10).map(doc => ({ id: doc.id, ...doc.data() } as Banner));
      setBanners(data);
    }
    fetchBanners();
  }, []);

  return (
    <MainLayout>
      {/* Hero Section - Swiper 배너 슬라이더로 대체 */}
      <section
        className="relative w-full h-[40vw] min-h-[200px] max-h-[320px] md:h-[70vh] md:min-h-[400px] md:max-h-[700px] flex items-center justify-center overflow-hidden"
      >
        {banners.length > 0 ? (
          <Swiper
            modules={[Autoplay, Pagination]}
            spaceBetween={30}
            slidesPerView={1}
            loop={banners.length > 1}
            autoplay={{ delay: 10000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            className="w-full h-full rounded-none"
          >
            {banners.map((banner) => (
              <SwiperSlide key={banner.id}>
                <Link href={banner.link} className="block group w-full h-full">
                  <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
                    {banner.type === "image" ? (
                      <Image
                        src={banner.url}
                        alt={banner[`title_${lang}`] || "banner"}
                        fill
                        className="object-cover w-full h-full mx-auto my-auto group-hover:opacity-90 transition"
                        priority
                      />
                    ) : (
                      <video
                        src={banner.url}
                        controls={false}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="object-cover w-full h-full mx-auto my-auto group-hover:opacity-90 transition"
                      />
                    )}
                  </div>
                </Link>
              </SwiperSlide>
            ))}
            {/* 페이지네이션 위치 커스텀 */}
            <div className="absolute left-1/2 bottom-4 md:bottom-8 -translate-x-1/2 z-10 pointer-events-none">
              {/* Swiper의 pagination이 자동으로 렌더링됨 */}
            </div>
          </Swiper>
        ) : (
          <div className="w-full h-full min-h-[200px] max-h-[320px] md:min-h-[400px] md:max-h-[700px] bg-gradient-to-br from-[#2C6E6F] via-[#3A8A8B] to-[#4A9D9E] flex items-center justify-center">
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
                <Link href={`/tours/${product.id}`} className="block h-full">
                  <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 h-full overflow-hidden group">
                    <div className="relative h-56 overflow-hidden">
                      {product.imageUrl ? (
                        <Image 
                          src={product.imageUrl} 
                          alt={typeof product.title === 'object' ? product.title[lang] : product.title || 'Tour Image'} 
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
                          {typeof product.region === 'object' ? product.region[lang] : product.region}
                        </div>
                      )}
                      {product.price && (
                        <div className="absolute bottom-4 right-4 bg-[#2C6E6F]/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                          {typeof product.price === 'object' ? product.price[lang] : product.price}
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-3 text-[#1A3A3A] line-clamp-1 group-hover:text-[#2C6E6F] transition-colors">
                        {typeof product.title === 'object' ? product.title[lang] : product.title}
                      </h3>
                      <p className="text-[#5A7A7A] mb-4 line-clamp-2">
                        {typeof product.description === 'object' ? product.description[lang] : product.description}
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
              href="mailto:info@cdc-travel.com"
              className="flex flex-col items-center bg-gradient-to-br from-[#F0F7F7] to-white border-2 border-[#7FC4C5] text-[#2C6E6F] px-6 py-8 rounded-2xl font-medium hover:shadow-xl hover:scale-105 transition-all duration-300 group"
            >
              <svg className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {TEXT.email[lang]}
            </a>
            
            <a
              href="https://www.facebook.com/cdctravel"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 px-6 py-8 rounded-2xl font-medium hover:shadow-xl hover:scale-105 transition-all duration-300 group"
            >
              <div className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform">
                <Image src="/images/messenger_facebook.png" alt="Facebook" width={48} height={48} />
              </div>
              {TEXT.facebook[lang]}
            </a>
            
            <a
              href="https://open.kakao.com/your-kakao-id"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center bg-[#FEE500] text-black px-6 py-8 rounded-2xl font-medium hover:shadow-xl hover:scale-105 transition-all duration-300 group"
            >
              <div className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform">
                <Image src="/images/messenger_kakao.png" alt="KakaoTalk" width={48} height={48} />
              </div>
              {TEXT.kakao[lang]}
            </a>
            
            <a
              href="https://www.viber.com/your-viber-id"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center bg-gradient-to-br from-[#7360F2] to-[#665ED3] text-white px-6 py-8 rounded-2xl font-medium hover:shadow-xl hover:scale-105 transition-all duration-300 group"
            >
              <div className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform">
                <Image src="/images/messenger_viber.png" alt="Viber" width={48} height={48} />
              </div>
              {TEXT.viber[lang]}
            </a>
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
                {TEXT.footerSlogan[lang]}
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
                <li><a href="mailto:info@cdc-travel.com" className="hover:text-white hover:translate-x-1 inline-block transition-all">{TEXT.email2[lang]}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-6 text-[#7FC4C5]">{TEXT.contact[lang]}</h3>
              <p className="text-gray-300 leading-relaxed">
                {TEXT.email2[lang]}: info@cdc-travel.com<br />
                {TEXT.phone[lang]}: +82-XXX-XXXX-XXXX
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
