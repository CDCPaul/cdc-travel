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

interface MainPageData {
  bannerVideo?: string;
  bannerImage?: string;
  mainTitle?: string;
  mainSubtitle?: string;
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
  copyright: { ko: "All rights reserved.", en: "All rights reserved." }
};

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [mainPage, setMainPage] = useState<MainPageData | null>(null);
  const { lang } = useLanguage();

  useEffect(() => {
    fetchProducts().then(setProducts);
    // Firestore에서 settings/mainPage 문서 읽기
    const fetchMainPage = async () => {
      const docRef = doc(db, "settings", "mainPage");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as MainPageData;
        console.log("Firestore mainPage data:", data);
        console.log("bannerVideo URL:", data.bannerVideo);
        console.log("bannerImage URL:", data.bannerImage);
        setMainPage(data);
      } else {
        console.log("mainPage document does not exist");
      }
    };
    fetchMainPage();
  }, []);

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* 비디오/이미지/없음 */}
        {mainPage && mainPage.bannerVideo ? (
          <video
            key={mainPage.bannerVideo}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover z-0"
            style={{ objectFit: "cover" }}
            ref={el => {
              if (el) {
                console.log("video element currentSrc:", el.currentSrc);
                const source = el.children[0] as HTMLSourceElement | undefined;
                if (source) {
                  console.log("video source src:", source.src);
                }
              }
            }}
          >
            <source src={mainPage.bannerVideo} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : mainPage && typeof mainPage.bannerImage === 'string' && !!mainPage.bannerImage ? (
          <Image
            src={mainPage.bannerImage}
            alt="Banner"
            fill
            className="absolute inset-0 w-full h-full object-cover z-0"
            style={{ objectFit: "cover" }}
            priority
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-black z-0" />
        )}
        {/* 오버레이 */}
        {/* <div className="absolute inset-0 bg-black bg-opacity-10 z-10"></div> */}
        {/* 텍스트 */}
        <div className="relative z-20 text-center text-white px-4">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold mb-4"
          >
            {mainPage && typeof mainPage.mainTitle === 'object' ? mainPage.mainTitle[lang] : mainPage?.mainTitle || ""}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl mb-8"
          >
            {mainPage && typeof mainPage.mainSubtitle === 'object' ? mainPage.mainSubtitle[lang] : mainPage?.mainSubtitle || ""}
          </motion.p>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl font-bold text-gray-900 mb-4"
            >
              {TEXT.aboutTitle[lang]}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              {TEXT.aboutDesc[lang]}
            </motion.p>
          </div>
        </div>
      </section>

      {/* Featured Tours */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold text-center text-gray-900 mb-16"
          >
            {TEXT.featuredTours[lang]}
          </motion.h2>
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
                <Link href={`/tours/${product.id}`} className="block bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="relative">
                    {product.imageUrl ? (
                      <Image 
                        src={product.imageUrl} 
                        alt={typeof product.title === 'object' ? product.title[lang] : product.title || 'Tour Image'} 
                        width={400} 
                        height={250} 
                        className="w-full h-48 object-cover rounded-t-xl" 
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 rounded-t-xl flex items-center justify-center">
                        <span className="text-gray-500">이미지 없음</span>
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {typeof product.price === 'object' ? product.price[lang] : product.price}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">
                      {typeof product.title === 'object' ? product.title[lang] : product.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {typeof product.description === 'object' ? product.description[lang] : product.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-600 font-semibold">자세히 보기 →</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/tours"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors inline-block"
            >
              {TEXT.seeAllTours[lang]}
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold text-gray-900 mb-8"
          >
            {TEXT.contactTitle[lang]}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-gray-600 mb-12"
          >
            {TEXT.contactDesc[lang]}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-6"
          >
            <a
              href="mailto:info@cdc-travel.com"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {TEXT.email[lang]}
            </a>
            <a
              href="https://www.facebook.com/cdctravel"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-800 hover:bg-blue-900 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center"
            >
              <Image src="/images/messenger_facebook.png" alt="Facebook" width={20} height={20} className="mr-2" />
              {TEXT.facebook[lang]}
            </a>
            <a
              href="https://open.kakao.com/your-kakao-id"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold transition-colors flex items-center"
            >
              <Image src="/images/messenger_kakao.png" alt="KakaoTalk" width={20} height={20} className="mr-2" />
              {TEXT.kakao[lang]}
            </a>
            <a
              href="https://www.viber.com/your-viber-id"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center"
            >
              <Image src="/images/messenger_viber.png" alt="Viber" width={20} height={20} className="mr-2" />
              {TEXT.viber[lang]}
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Image
                src="/images/CDC_LOGO.png"
                alt="CDC Travel"
                width={120}
                height={40}
                className="h-10 w-auto mb-4"
                style={{ width: "auto", height: "auto" }}
              />
              <p className="text-gray-400">
                {TEXT.footerSlogan[lang]}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">{TEXT.service[lang]}</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/tours" className="hover:text-white transition-colors">{TEXT.tour[lang]}</Link></li>
                <li><Link href="/travel-info" className="hover:text-white transition-colors">{TEXT.info[lang]}</Link></li>
                <li><Link href="/about-us" className="hover:text-white transition-colors">{TEXT.about[lang]}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">{TEXT.support[lang]}</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/contact" className="hover:text-white transition-colors">{TEXT.inquiry[lang]}</Link></li>
                <li><a href="mailto:info@cdc-travel.com" className="hover:text-white transition-colors">{TEXT.email2[lang]}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">{TEXT.contact[lang]}</h3>
              <p className="text-gray-400">
                {TEXT.email2[lang]}: info@cdc-travel.com<br />
                {TEXT.phone[lang]}: +82-XXX-XXXX-XXXX
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 CDC Travel. {TEXT.copyright[lang]}</p>
          </div>
        </div>
      </footer>
    </MainLayout>
  );
}
