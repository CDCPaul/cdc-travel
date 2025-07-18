"use client";

import { useState } from "react";
import { useLanguage } from "../../components/LanguageContext";
import MainLayout from "../../components/MainLayout";
import Link from "next/link";

// 다국어 텍스트
const TEXT = {
  title: { ko: "개인정보처리방침", en: "Privacy Policy" },
  lastUpdated: { ko: "최종 업데이트", en: "Last Updated" },
  languageSwitch: { ko: "English", en: "한국어" },
  backToHome: { ko: "홈으로 돌아가기", en: "Back to Home" },
};

// 한국어 개인정보처리방침
const PRIVACY_POLICY_KO = {
  title: "개인정보처리방침",
  lastUpdated: "2025년 7월 18일",
  content: `
    <h2>1. 개인정보의 처리 목적</h2>
    <p>CDC Travel은 원칙적으로 고객의 개인정보를 수집하지 않으며, 로그인 기능 또한 관리자용으로만 제공됩니다. 다만, 다음의 경우에 한해 이메일 주소 등의 개인정보를 수집할 수 있습니다.</p>
    <ul>
      <li>고객 문의 또는 제휴 문의 접수 시</li>
      <li>뉴스레터 구독 시</li>
      <li>기타 서비스 운영상 필요한 경우 (동의 기반)</li>
    </ul>

    <h2>2. 수집하는 개인정보 항목 및 수집 방법</h2>
    <p>CDC Travel이 수집하는 개인정보는 아래와 같으며, 수집 방법은 홈페이지 내 양식 입력 또는 이메일을 통한 직접 제공 방식입니다.</p>
    <ul>
      <li>수집 항목: 이메일 주소</li>
    </ul>

    <h2>3. 개인정보의 처리 및 보유 기간</h2>
    <p>수집된 개인정보는 문의 응답 또는 목적 달성 후 즉시 파기하며, 법령에 따라 일정 기간 보관이 필요한 경우 해당 법령에 따릅니다.</p>

    <h2>4. 개인정보의 제3자 제공</h2>
    <p>CDC Travel은 수집한 개인정보를 제3자에게 제공하지 않습니다. 단, 법령에 의거한 경우에는 예외로 합니다.</p>

    <h2>5. 개인정보처리의 위탁</h2>
    <p>CDC Travel은 서비스 운영을 위해 아래 외부 서비스에 개인정보 처리 업무를 위탁할 수 있습니다.</p>
    <ul>
      <li>Google Cloud Platform, Firebase (데이터 호스팅 및 관리자 인증용)</li>
      <li>Gmail API (문의 응답용 메일 발송)</li>
    </ul>

    <h2>6. 정보주체의 권리 및 행사 방법</h2>
    <p>이용자는 언제든지 자신의 개인정보 열람, 수정, 삭제, 처리정지를 요청할 수 있습니다. 요청은 이메일을 통해 가능합니다.</p>

    <h2>7. 개인정보의 파기</h2>
    <p>개인정보는 보유기간 경과, 목적 달성 시 지체 없이 파기합니다. 전자적 파일은 복구 불가능한 방식으로 삭제됩니다.</p>

    <h2>8. 개인정보의 안전성 확보 조치</h2>
    <ul>
      <li>개인정보 최소 수집 및 접근 제한</li>
      <li>관리자 페이지에 대한 접근 통제 및 인증 강화 (OAuth 기반)</li>
      <li>Google Workspace 기반 보안 환경 운용</li>
    </ul>

    <h2>9. 개인정보 보호책임자</h2>
    <p>CDC Travel은 개인정보 관련 업무를 총괄하는 보호책임자를 다음과 같이 지정하고 있습니다.</p>
    <ul>
      <li>성명: Jessiebel</li>
      <li>직책: 개인정보 보호책임자</li>
      <li>연락처: jessiebel@cebudirectclub.com</li>
    </ul>

    <h2>10. 개인정보처리방침의 변경</h2>
    <p>본 개인정보처리방침은 시행일로부터 적용되며, 법령 변경이나 내부 방침에 따라 수정될 수 있습니다. 변경 시 사전 고지합니다.</p>
  `
};

// 영어 개인정보처리방침
const PRIVACY_POLICY_EN = {
  title: "Privacy Policy",
  lastUpdated: "July 18, 2025",
  content: `
    <h2>1. Purpose of Personal Information Processing</h2>
    <p>CDC Travel generally does not collect personal information from customers, and login functionality is provided for administrators only. However, email addresses and other personal information may be collected in the following cases.</p>
    <ul>
      <li>When receiving customer inquiries or partnership inquiries</li>
      <li>When subscribing to newsletters</li>
      <li>Other cases necessary for service operation (based on consent)</li>
    </ul>

    <h2>2. Personal Information Items Collected and Collection Methods</h2>
    <p>The personal information collected by CDC Travel is as follows, and the collection method is through form input on the homepage or direct provision via email.</p>
    <ul>
      <li>Items collected: Email address</li>
    </ul>

    <h2>3. Processing and Retention Period of Personal Information</h2>
    <p>Collected personal information is immediately destroyed after responding to inquiries or achieving the purpose, and follows relevant laws when retention is required by law for a certain period.</p>

    <h2>4. Provision of Personal Information to Third Parties</h2>
    <p>CDC Travel does not provide collected personal information to third parties. However, exceptions apply in cases based on laws and regulations.</p>

    <h2>5. Entrustment of Personal Information Processing</h2>
    <p>CDC Travel may entrust personal information processing tasks to external services for service operation as follows.</p>
    <ul>
      <li>Google Cloud Platform, Firebase (for data hosting and administrator authentication)</li>
      <li>Gmail API (for sending inquiry response emails)</li>
    </ul>

    <h2>6. Rights of Information Subjects and Exercise Methods</h2>
    <p>Users may request access, modification, deletion, and suspension of processing of their personal information at any time. Requests can be made via email.</p>

    <h2>7. Destruction of Personal Information</h2>
    <p>Personal information is destroyed without delay when the retention period expires or the purpose is achieved. Electronic files are deleted in a manner that makes recovery impossible.</p>

    <h2>8. Measures to Ensure Safety of Personal Information</h2>
    <ul>
      <li>Minimal collection of personal information and access restrictions</li>
      <li>Access control and enhanced authentication for administrator pages (OAuth-based)</li>
      <li>Operation of secure environment based on Google Workspace</li>
    </ul>

    <h2>9. Personal Information Protection Officer</h2>
    <p>CDC Travel designates a protection officer responsible for overseeing personal information-related tasks as follows.</p>
    <ul>
      <li>Name: Jessiebel</li>
      <li>Position: Personal Information Protection Officer</li>
      <li>Contact: jessiebel@cebudirectclub.com</li>
    </ul>

    <h2>10. Changes to Privacy Policy</h2>
    <p>This privacy policy applies from the effective date and may be modified according to changes in laws or internal policies. Prior notice will be given for any changes.</p>
  `
};

export default function PrivacyPolicyPage() {
  const { setLang } = useLanguage();
  const [showEnglish, setShowEnglish] = useState(false);

  const currentPolicy = showEnglish ? PRIVACY_POLICY_EN : PRIVACY_POLICY_KO;
  const currentLang = showEnglish ? 'en' : 'ko';

  const handleLanguageSwitch = () => {
    setShowEnglish(!showEnglish);
    setLang(showEnglish ? 'ko' : 'en');
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold text-gray-900">
                {currentPolicy.title}
              </h1>
              <button
                onClick={handleLanguageSwitch}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                {TEXT.languageSwitch[currentLang]}
              </button>
            </div>
            <p className="text-gray-600">
              {TEXT.lastUpdated[currentLang]}: {currentPolicy.lastUpdated}
            </p>
          </div>

          {/* 내용 */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div 
              className="max-w-none text-gray-800 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-gray-900 [&>h2]:mt-8 [&>h2]:mb-4 [&>p]:mb-4 [&>p]:leading-relaxed [&>ul]:mb-4 [&>ul]:pl-6 [&>li]:mb-2 [&>li]:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: currentPolicy.content }}
            />
          </div>

          {/* 하단 버튼 */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {TEXT.backToHome[currentLang]}
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 