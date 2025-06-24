"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { fetchProducts, Product } from "@/lib/firebase-sample";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navigation from "@/components/Navigation";

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

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [mainPage, setMainPage] = useState<MainPageData | null>(null);

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
    <div className="min-h-screen">
      {/* Navigation */}
      <Navigation />

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
            {mainPage ? mainPage.mainTitle : ""}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl mb-8"
          >
            {mainPage ? mainPage.mainSubtitle : ""}
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
              CDC Travel
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              CDC Travel is a professional travel company that puts customer satisfaction first.
              We are committed to providing safe and enjoyable travel experiences.
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
            인기 투어
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
                    {product.image && product.image !== "" ? (
                      <Image 
                        src={product.image} 
                        alt={product.title} 
                        width={400} 
                        height={250} 
                        className="w-full h-48 object-cover rounded-t-xl" 
                      />
                    ) : null}
                    <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {product.price}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">{product.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">{product.date}</span>
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
              모든 투어 보기
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
            문의하기
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-gray-600 mb-12"
          >
            궁금한 점이 있으시면 언제든지 연락주세요!
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
              이메일 문의
            </a>
            <a
              href="https://www.facebook.com/cdctravel"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-800 hover:bg-blue-900 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center"
            >
              <Image src="/images/messenger_facebook.png" alt="Facebook" width={20} height={20} className="mr-2" />
              Facebook
            </a>
            <a
              href="https://open.kakao.com/your-kakao-id"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold transition-colors flex items-center"
            >
              <Image src="/images/messenger_kakao.png" alt="KakaoTalk" width={20} height={20} className="mr-2" />
              KakaoTalk
            </a>
            <a
              href="https://www.viber.com/your-viber-id"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center"
            >
              <Image src="/images/messenger_viber.png" alt="Viber" width={20} height={20} className="mr-2" />
              Viber
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
                당신의 완벽한 여행을 위한 최고의 선택
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">서비스</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/tours" className="hover:text-white transition-colors">투어상품</Link></li>
                <li><Link href="/travel-info" className="hover:text-white transition-colors">여행정보</Link></li>
                <li><Link href="/about-us" className="hover:text-white transition-colors">회사소개</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">고객지원</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/contact" className="hover:text-white transition-colors">문의하기</Link></li>
                <li><a href="mailto:info@cdc-travel.com" className="hover:text-white transition-colors">이메일</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">연락처</h3>
              <p className="text-gray-400">
                이메일: info@cdc-travel.com<br />
                전화: +82-XXX-XXXX-XXXX
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 CDC Travel. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
