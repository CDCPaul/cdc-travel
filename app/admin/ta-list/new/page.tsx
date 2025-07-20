"use client";

import { useState, useRef } from "react";
import { useLanguage } from "../../../../components/LanguageContext";
import Link from "next/link";
import ImageUploader, { LocalImage } from "../../../../components/ui/ImageUploader";
import { auth } from "../../../../lib/firebase";

// 다국어 텍스트
const TEXT = {
  title: { ko: "새 TA 등록", en: "Add New TA" },
  backToList: { ko: "목록으로 돌아가기", en: "Back to List" },
  save: { ko: "저장", en: "Save" },
  cancel: { ko: "취소", en: "Cancel" },
  logo: { ko: "로고", en: "Logo" },
  companyName: { ko: "회사명", en: "Company Name" },
  companyNamePlaceholder: { ko: "회사명을 입력하세요", en: "Enter company name" },
  taCode: { ko: "TA 코드", en: "TA Code" },
  taCodePlaceholder: { ko: "TA 코드를 입력하세요 (영문, 숫자, - _ 만 가능)", en: "Enter TA code (English, numbers, - _ only)" },
  invalidTaCode: { ko: "TA 코드는 영문, 숫자, - _ 만 사용 가능합니다", en: "TA code can only contain English letters, numbers, - and _" },
  required: { ko: "필수 입력 항목입니다", en: "This field is required" },
  phone: { ko: "대표전화번호", en: "Phone Number" },
  phonePlaceholder: { ko: "대표전화번호를 입력하세요", en: "Enter phone number" },
  invalidPhone: { ko: "올바른 전화번호 형식이 아닙니다", en: "Invalid phone number format" },
  address: { ko: "주소", en: "Address" },
  addressPlaceholder: { ko: "주소를 입력하세요", en: "Enter address" },
  email: { ko: "대표이메일", en: "Email" },
  emailPlaceholder: { ko: "대표이메일을 입력하세요", en: "Enter email" },
  invalidEmail: { ko: "올바른 이메일 형식이 아닙니다", en: "Invalid email format" },
  contactPersons: { ko: "담당자", en: "Contact Persons" },
  contactPersonName: { ko: "담당자명", en: "Contact Person Name" },
  contactPersonNamePlaceholder: { ko: "담당자명을 입력하세요", en: "Enter contact person name" },
  contactPersonPhone: { ko: "담당자 전화번호", en: "Contact Person Phone" },
  contactPersonPhonePlaceholder: { ko: "담당자 전화번호를 입력하세요", en: "Enter contact person phone" },
  contactPersonEmail: { ko: "담당자 이메일", en: "Contact Person Email" },
  contactPersonEmailPlaceholder: { ko: "담당자 이메일을 입력하세요", en: "Enter contact person email" },
  addContactPerson: { ko: "담당자 추가", en: "Add Contact Person" },
  removeContactPerson: { ko: "담당자 제거", en: "Remove Contact Person" }
};

interface ContactPerson {
  name: string;
  phone: string;
  email: string;
}

export default function NewTAPage() {
  const { lang } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [taCode, setTaCode] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([
    { name: "", phone: "", email: "" }
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const imageUploaderRef = useRef<{ uploadToStorage: () => Promise<{ urls: string[] }>; getLocalImages: () => LocalImage[]; clearAll: () => void } | null>(null);

  const handleContactPersonChange = (index: number, field: keyof ContactPerson, value: string) => {
    const newContactPersons = [...contactPersons];
    newContactPersons[index] = { ...newContactPersons[index], [field]: value };
    setContactPersons(newContactPersons);

    const errorKey = `contactPerson${field.charAt(0).toUpperCase() + field.slice(1)}_${index}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: "" }));
    }
  };

  const addContactPerson = () => {
    setContactPersons([...contactPersons, { name: "", phone: "", email: "" }]);
  };

  const removeContactPerson = (index: number) => {
    if (contactPersons.length > 1) {
      const newContactPersons = contactPersons.filter((_, i) => i !== index);
      setContactPersons(newContactPersons);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 기본 검증
    const newErrors: Record<string, string> = {};
    if (!companyName.trim()) {
      newErrors.companyName = TEXT.required[lang];
    }
    if (!taCode.trim()) {
      newErrors.taCode = TEXT.required[lang];
    } else if (!/^[A-Za-z0-9\-_]+$/.test(taCode)) {
      newErrors.taCode = TEXT.invalidTaCode[lang];
    }
    if (!phone.trim()) {
      newErrors.phone = TEXT.required[lang];
    } else if (!/^[0-9\-\s()]+$/.test(phone)) {
      newErrors.phone = TEXT.invalidPhone[lang];
    }
    if (!address.trim()) {
      newErrors.address = TEXT.required[lang];
    }
    if (!email.trim()) {
      newErrors.email = TEXT.required[lang];
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = TEXT.invalidEmail[lang];
    }

    // 담당자 검증
    contactPersons.forEach((person, index) => {
      if (!person.name.trim()) {
        newErrors[`contactPersonName_${index}`] = TEXT.required[lang];
      }
      if (!person.phone.trim()) {
        newErrors[`contactPersonPhone_${index}`] = TEXT.required[lang];
      } else if (!/^[0-9\-\s()]+$/.test(person.phone)) {
        newErrors[`contactPersonPhone_${index}`] = TEXT.invalidPhone[lang];
      }
      if (!person.email.trim()) {
        newErrors[`contactPersonEmail_${index}`] = TEXT.required[lang];
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email)) {
        newErrors[`contactPersonEmail_${index}`] = TEXT.invalidEmail[lang];
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      // 로고 이미지 업로드
      const logoResult = await imageUploaderRef.current?.uploadToStorage() || { urls: [] };
      const logoUrl = logoResult.urls[0] || "";

      // TA 데이터 준비
      const taData = {
        companyName: companyName.trim(),
        taCode: taCode.trim(),
        phone: phone.trim(),
        address: address.trim(),
        email: email.trim(),
        logo: logoUrl,
        contactPersons: contactPersons.filter(person => person.name.trim() && person.email.trim())
      };

      // API 호출
      const response = await fetch('/api/ta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '저장에 실패했습니다.');
      }

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
              action: 'taCreate',
              details: `새 TA "${companyName}" 등록 - ${Object.keys(taData).join(', ')}`,
              userId: user.uid,
              userEmail: user.email
            })
          });
        }
      } catch (error) {
        console.error('활동 기록 실패:', error);
      }
      
      alert(result.message || 'TA가 성공적으로 등록되었습니다.');
      window.location.href = "/admin/ta-list";
    } catch (error) {
      console.error("저장 실패:", error);
      alert(error instanceof Error ? error.message : "저장에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{TEXT.title[lang]}</h1>
        <Link
          href="/admin/ta-list"
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          {TEXT.backToList[lang]}
        </Link>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 로고 업로드 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {TEXT.logo[lang]}
            </label>
            <div className="mb-2 text-sm text-gray-600">
              • PNG 형식의 로고를 권장합니다. 투명 배경은 자동으로 흰색으로 변경됩니다.
            </div>
            <ImageUploader
              ref={imageUploaderRef}
              folder="TA"
              maxFiles={1}
              onImagesSelected={() => {}}
              showOptimizationInfo={false}
            />
          </div>

          {/* 회사명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {TEXT.companyName[lang]} *
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => {
                setCompanyName(e.target.value);
                if (errors.companyName) {
                  setErrors(prev => ({ ...prev, companyName: "" }));
                }
              }}
              placeholder={TEXT.companyNamePlaceholder[lang]}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.companyName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.companyName && (
              <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
            )}
          </div>

          {/* TA 코드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {TEXT.taCode[lang]} *
            </label>
            <input
              type="text"
              value={taCode}
              onChange={(e) => {
                setTaCode(e.target.value);
                if (errors.taCode) {
                  setErrors(prev => ({ ...prev, taCode: "" }));
                }
              }}
              placeholder={TEXT.taCodePlaceholder[lang]}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.taCode ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.taCode && (
              <p className="mt-1 text-sm text-red-600">{errors.taCode}</p>
            )}
          </div>

          {/* 대표전화번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {TEXT.phone[lang]} *
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) {
                  setErrors(prev => ({ ...prev, phone: "" }));
                }
              }}
              placeholder={TEXT.phonePlaceholder[lang]}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.phone ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          {/* 주소 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {TEXT.address[lang]} *
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (errors.address) {
                  setErrors(prev => ({ ...prev, address: "" }));
                }
              }}
              placeholder={TEXT.addressPlaceholder[lang]}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.address ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address}</p>
            )}
          </div>

          {/* 대표이메일 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {TEXT.email[lang]} *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) {
                  setErrors(prev => ({ ...prev, email: "" }));
                }
              }}
              placeholder={TEXT.emailPlaceholder[lang]}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* 담당자 섹션 */}
          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">
                {TEXT.contactPersons[lang]} *
              </label>
              <button
                type="button"
                onClick={addContactPerson}
                className="px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600"
              >
                {TEXT.addContactPerson[lang]}
              </button>
            </div>

            {contactPersons.map((person, index) => (
              <div key={index} className="border rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    {TEXT.contactPersons[lang]} {index + 1}
                  </h4>
                  {contactPersons.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeContactPerson(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      {TEXT.removeContactPerson[lang]}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {TEXT.contactPersonName[lang]} *
                    </label>
                    <input
                      type="text"
                      value={person.name}
                      onChange={(e) => handleContactPersonChange(index, "name", e.target.value)}
                      placeholder={TEXT.contactPersonNamePlaceholder[lang]}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`contactPersonName_${index}`] ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors[`contactPersonName_${index}`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`contactPersonName_${index}`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {TEXT.contactPersonPhone[lang]} *
                    </label>
                    <input
                      type="text"
                      value={person.phone}
                      onChange={(e) => handleContactPersonChange(index, "phone", e.target.value)}
                      placeholder={TEXT.contactPersonPhonePlaceholder[lang]}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`contactPersonPhone_${index}`] ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors[`contactPersonPhone_${index}`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`contactPersonPhone_${index}`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {TEXT.contactPersonEmail[lang]} *
                    </label>
                    <input
                      type="email"
                      value={person.email}
                      onChange={(e) => handleContactPersonChange(index, "email", e.target.value)}
                      placeholder={TEXT.contactPersonEmailPlaceholder[lang]}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`contactPersonEmail_${index}`] ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors[`contactPersonEmail_${index}`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`contactPersonEmail_${index}`]}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-4 mt-6">
          <Link
            href="/admin/ta-list"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            {TEXT.cancel[lang]}
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? "저장중..." : TEXT.save[lang]}
          </button>
        </div>
      </form>
    </div>
  );
}