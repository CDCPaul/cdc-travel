"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/LanguageContext";
import MainLayout from "@/components/MainLayout";
import { logPageView } from "@/lib/analytics";
import { useEffect, useState } from "react";
import Link from "next/link";

const SIDEBAR = [
  { href: "/about-us", label: { ko: "비전/미션", en: "Vision/Mission" } },
  { href: "/about-us/history", label: { ko: "연혁", en: "History" } },
  { href: "/about-us/team", label: { ko: "대표/팀소개", en: "Team" } },
  { href: "/about-us/office", label: { ko: "오피스/연락처", en: "Office/Contact" } },
  { href: "/about-us/awards", label: { ko: "인증/파트너/수상", en: "Awards/Partners" } },
  { href: "/about-us/ebook-collection", label: { ko: "CDC 비즈니스 eBook관", en: "CDC Business eBook Collection" } },
  { href: "/about-us/contact", label: { ko: "문의/상담", en: "Contact" } },
];

const HISTORY_DATA = {
  ko: {
    title: "회사 연혁",
    subtitle: "Cebu Direct Club의 성장 스토리",
    sections: [
      {
        period: "2009-2015",
        title: "기업 설립 및 초기 성장",
        events: [
          {
            year: "2009",
            events: [
              "법인 등록",
              "DOT (Department of Tourism Philippines) 등록"
            ]
          },
          {
            year: "2010",
            events: [
              "KOTAA (Korean Travel Agencies Association) 등록"
            ]
          },
          {
            year: "2012",
            events: [
              "C.D.C Bohol 지사 신설"
            ]
          },
          {
            year: "2013",
            events: [
              "Bohol Dumaluan Resort와 GSA 체결",
              "\"CEBU SKY TOUR\" 전세기 서비스 부서 신설"
            ]
          },
          {
            year: "2014",
            events: [
              "CATOS (Cebu Alliance of Tour Operation Specialists, Inc.) 등록",
              "Bohol Bellevue 5성 호텔 \"TOP PRODUCER\" 수상",
              "C.D.C International 부서(아웃바운드) 신설",
              "CTTA (Cebu Travel Agencies Association, outbound) 등록"
            ]
          },
          {
            year: "2015",
            events: [
              "전세기 운항 (2월/9월 – Korean Air)",
              "전세기 운항 (2월 – Asiana Air, 9월 – Korean Air)"
            ]
          }
        ]
      },
      {
        period: "2016-2022",
        title: "전세기 서비스 확장",
        events: [
          {
            year: "2016",
            events: [
              "전세기 운항 (2월 – Asiana, 9월 – Korean Air)",
              "Bohol Bellevue 5성 호텔 \"TOP PRODUCER\" 수상"
            ]
          },
          {
            year: "2017",
            events: [
              "전세기 운항 (세부–제주 직항, Jeju Air)",
              "전세기 운항 (2월 – Asiana, 9월 – Korean Air)",
              "Bohol Bellevue 5성 호텔 \"TOP PRODUCER\" 수상"
            ]
          },
          {
            year: "2018",
            events: [
              "전세기 운항 (세부–제주 직항, JIN Air)",
              "C.D.C Palawan 부서 신설",
              "Bohol HENANN 5성 호텔 \"TOP PRODUCER\" 수상"
            ]
          },
          {
            year: "2019",
            events: [
              "Bohol HENANN 5성 호텔 \"TOP PRODUCER\" 수상"
            ]
          },
          {
            year: "2020-2022",
            events: [
              "팬데믹 중 경비행기 및 항공권 판매, 격리 패키지 운영 지속"
            ]
          },
          {
            year: "2022",
            events: [
              "JIN Air – TOP PRODUCER (Philippines) 수상",
              "JEJU Air – TOP PRODUCER (Visayas Region) 수상"
            ]
          }
        ]
      },
      {
        period: "2022-2024",
        title: "디지털 혁신 및 미래 준비",
        events: [
          {
            year: "2022",
            events: [
              "전세기 운항 (12월 15일 – 세부–제주 직항, T-way Air)"
            ]
          },
          {
            year: "2023",
            events: [
              "전세기 운항 (2월, 3월 – 세부–제주 직항, T-way Air)",
              "Jpark Park Resort 5성 호텔 \"TOP PRODUCER\" 수상",
              "주한한국대사관 단체비자(E-visa) 공인대리점 인증",
              "JIN Air – TOP PRODUCER (Philippines) 수상",
              "JEJU Air – TOP PRODUCER (Visayas Region) 수상"
            ]
          },
          {
            year: "2024",
            events: [
              "GSA 체결: Bohol RAMEDE Resort",
              "Bohol HENANN ALONA 호텔 \"TOP PRODUCER\" 수상"
            ]
          }
        ]
      }
    ]
  },
  en: {
    title: "Company History",
    subtitle: "The Growth Story of Cebu Direct Club",
    sections: [
      {
        period: "2009-2015",
        title: "Foundation & Early Growth",
        events: [
          {
            year: "2009",
            events: [
              "Corporation registration",
              "Registered with DOT (Department of Tourism Philippines)"
            ]
          },
          {
            year: "2010",
            events: [
              "Registered with KOTAA (Korean Travel Agencies Association)"
            ]
          },
          {
            year: "2012",
            events: [
              "Established C.D.C Bohol branch"
            ]
          },
          {
            year: "2013",
            events: [
              "GSA agreement with Bohol Dumaluan Resort",
              "Established \"CEBU SKY TOUR\" charter service department"
            ]
          },
          {
            year: "2014",
            events: [
              "Registered with CATOS (Cebu Alliance of Tour Operation Specialists, Inc.)",
              "Awarded \"TOP PRODUCER\" by Bohol Bellevue 5-star hotel",
              "Established C.D.C International department (outbound)",
              "Registered with CTTA (Cebu Travel Agencies Association, outbound)"
            ]
          },
          {
            year: "2015",
            events: [
              "Charter flights (February/September – Korean Air)",
              "Charter flights (February – Asiana Air, September – Korean Air)"
            ]
          }
        ]
      },
      {
        period: "2016-2022",
        title: "Charter Service Expansion",
        events: [
          {
            year: "2016",
            events: [
              "Charter flights (February – Asiana, September – Korean Air)",
              "Awarded \"TOP PRODUCER\" by Bohol Bellevue 5-star hotel"
            ]
          },
          {
            year: "2017",
            events: [
              "Charter flights (Cebu-Jeju direct, Jeju Air)",
              "Charter flights (February – Asiana, September – Korean Air)",
              "Awarded \"TOP PRODUCER\" by Bohol Bellevue 5-star hotel"
            ]
          },
          {
            year: "2018",
            events: [
              "Charter flights (Cebu-Jeju direct, JIN Air)",
              "Established C.D.C Palawan department",
              "Awarded \"TOP PRODUCER\" by Bohol HENANN 5-star hotel"
            ]
          },
          {
            year: "2019",
            events: [
              "Awarded \"TOP PRODUCER\" by Bohol HENANN 5-star hotel"
            ]
          },
          {
            year: "2020-2022",
            events: [
              "Continued private aircraft and ticket sales, quarantine package operations during pandemic"
            ]
          },
          {
            year: "2022",
            events: [
              "Awarded JIN Air – TOP PRODUCER (Philippines)",
              "Awarded JEJU Air – TOP PRODUCER (Visayas Region)"
            ]
          }
        ]
      },
      {
        period: "2022-2024",
        title: "Digital Innovation & Future Preparation",
        events: [
          {
            year: "2022",
            events: [
              "Charter flights (December 15 – Cebu-Jeju direct, T-way Air)"
            ]
          },
          {
            year: "2023",
            events: [
              "Charter flights (February, March – Cebu-Jeju direct, T-way Air)",
              "Awarded \"TOP PRODUCER\" by Jpark Park Resort 5-star hotel",
              "Certified as authorized agent for Korean Embassy group visa (E-visa)",
              "Awarded JIN Air – TOP PRODUCER (Philippines)",
              "Awarded JEJU Air – TOP PRODUCER (Visayas Region)"
            ]
          },
          {
            year: "2024",
            events: [
              "GSA agreement: Bohol RAMEDE Resort",
              "Awarded \"TOP PRODUCER\" by Bohol HENANN ALONA hotel"
            ]
          }
        ]
      }
    ]
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function HistoryPage() {
  const { lang } = useLanguage();
  const data = HISTORY_DATA[lang];
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    logPageView('Company History', '/about-us/history', { language: lang });
  }, [lang]);

  return (
    <MainLayout>
      <div className="min-h-screen flex bg-gray-50">
        {/* 데스크톱 사이드바 */}
        <aside className="hidden md:flex w-64 bg-white border-r flex-col gap-2 py-12 px-6">
          <h2 className="text-2xl font-bold mb-8">{data.title}</h2>
          {SIDEBAR.map(item => (
            <Link key={item.href} href={item.href} className="block px-4 py-2 rounded hover:bg-blue-50 font-medium text-gray-700">
              {item.label[lang]}
            </Link>
          ))}
        </aside>

        {/* 모바일 햄버거 버튼 */}
        <div className="md:hidden fixed top-20 left-4 z-50">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* 모바일 사이드바 오버레이 */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              {/* 배경 오버레이 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              />
              
              {/* 모바일 사이드바 */}
              <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="md:hidden fixed left-0 top-0 h-full w-80 bg-white shadow-xl z-50 flex flex-col gap-2 py-12 px-6"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold">{data.title}</h2>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {SIDEBAR.map(item => (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    onClick={() => setIsSidebarOpen(false)}
                    className="block px-4 py-3 rounded hover:bg-blue-50 font-medium text-gray-700"
                  >
                    {item.label[lang]}
                  </Link>
                ))}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
        
        {/* 본문 */}
        <main className="flex-1 p-4 md:p-12 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <section className="pb-16">
              <div className="text-center mb-12">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4"
                >
                  {data.title}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-xl text-gray-600 mb-8"
                >
                  {data.subtitle}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 mx-auto rounded-full"
                />
              </div>
            </section>

            {/* Timeline Section */}
            <section className="pb-20">
              {data.sections.map((section, sectionIndex) => (
                <motion.div
                  key={section.period}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: sectionIndex * 0.2 }}
                  viewport={{ once: true }}
                  className="mb-16"
                >
                  {/* Section Header */}
                  <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                      {section.period}
                    </h2>
                    <h3 className="text-xl text-blue-600 font-semibold">
                      {section.title}
                    </h3>
                  </div>

                  {/* Timeline */}
                  <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-indigo-600 transform md:-translate-x-1/2" />
                    
                    {/* Timeline Events */}
                    <div className="space-y-8">
                      {section.events.map((yearData, eventIndex) => (
                        <motion.div
                          key={yearData.year}
                          initial={{ opacity: 0, x: eventIndex % 2 === 0 ? -50 : 50 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.6, delay: eventIndex * 0.1 }}
                          viewport={{ once: true }}
                          className={`relative flex items-start ${
                            eventIndex % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                          }`}
                        >
                          {/* Timeline Dot */}
                          <div className="absolute left-8 md:left-1/2 transform md:-translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full border-4 border-white shadow-lg z-10" />
                          
                          {/* Content Card */}
                          <div className={`ml-16 md:ml-0 md:w-5/12 ${
                            eventIndex % 2 === 0 ? 'md:pr-8' : 'md:pl-8'
                          }`}>
                            <motion.div
                              variants={cardVariants}
                              initial="hidden"
                              whileInView="visible"
                              viewport={{ once: true }}
                              className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow"
                            >
                              <div className="mb-4">
                                <h4 className="text-2xl font-bold text-blue-600 mb-2">
                                  {yearData.year}
                                </h4>
                                <div className="space-y-2">
                                  {yearData.events.map((event, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                                      <p className="text-gray-700 leading-relaxed">
                                        {event}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </section>

            {/* Achievement Summary */}
            <section className="py-16 bg-white rounded-xl shadow-lg">
              <div className="text-center">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className="text-3xl md:text-4xl font-bold text-gray-900 mb-8"
                >
                  {lang === 'ko' ? '주요 성과' : 'Key Achievements'}
                </motion.h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6"
                  >
                    <div className="text-4xl mb-4">✈️</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {lang === 'ko' ? '전세기 서비스' : 'Charter Services'}
                    </h3>
                    <p className="text-gray-600">
                      {lang === 'ko' 
                        ? '15년간 안전한 전세기 운항으로 고객 만족도 극대화'
                        : '15 years of safe charter operations maximizing customer satisfaction'
                      }
                    </p>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6"
                  >
                    <div className="text-4xl mb-4">🏆</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {lang === 'ko' ? '수상 실적' : 'Awards'}
                    </h3>
                    <p className="text-gray-600">
                      {lang === 'ko' 
                        ? '다수의 항공사 및 호텔 TOP PRODUCER 수상'
                        : 'Multiple TOP PRODUCER awards from airlines and hotels'
                      }
                    </p>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-6"
                  >
                    <div className="text-4xl mb-4">🌏</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {lang === 'ko' ? '글로벌 네트워크' : 'Global Network'}
                    </h3>
                    <p className="text-gray-600">
                      {lang === 'ko' 
                        ? '필리핀 전역의 파트너십과 글로벌 서비스'
                        : 'Partnerships across Philippines and global services'
                      }
                    </p>
                  </motion.div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </MainLayout>
  );
} 