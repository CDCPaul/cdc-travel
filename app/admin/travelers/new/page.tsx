'use client';

import { useState, useRef } from 'react';
import { useLanguage } from '../../../../components/LanguageContext';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import ImageUploader from '@/components/ui/ImageUploader';

const NEW_TRAVELER_TEXTS = {
  ko: {
    title: "새 여행객 등록",
    save: "저장",
    cancel: "취소",
    loading: "저장 중...",
    success: "여행객이 성공적으로 등록되었습니다.",
    error: "여행객 등록에 실패했습니다.",
    surname: "성",
    surnamePlaceholder: "성(姓)을 입력하세요",
    givenNames: "이름",
    givenNamesPlaceholder: "이름을 입력하세요",
    gender: "성별",
    male: "남성",
    female: "여성",
    nationality: "국적",
    nationalityPlaceholder: "국적을 입력하세요",
    passportNumber: "여권번호",
    passportNumberPlaceholder: "여권번호를 입력하세요",
    passportExpiry: "여권만료일",
    passportExpiryPlaceholder: "여권만료일을 선택하세요",
    email: "이메일",
    emailPlaceholder: "이메일을 입력하세요",
    phone: "전화번호",
    phonePlaceholder: "전화번호를 입력하세요",
    passportPhoto: "여권사진",
    uploadPhoto: "사진 업로드",
    dragDrop: "파일을 드래그하거나 클릭하여 업로드하세요",
    readingPassport: "여권을 판독 중입니다...",
    photoRequired: "여권사진은 필수입니다",
    invalidEmail: "올바른 이메일 형식을 입력하세요",
    invalidPhone: "올바른 전화번호 형식을 입력하세요",
    invalidPassportNumber: "올바른 여권번호 형식을 입력하세요",
    requiredField: "필수 입력 항목입니다",
    passportReadSuccess: "여권이 성공적으로 판독되었습니다. 정보를 확인하고 수정해주세요.",
    passportReadNote: "※ 여권사진을 업로드하면 자동으로 정보를 판독합니다. 판독된 정보를 확인하고 수정한 후 저장해주세요."
  },
  en: {
    title: "New Traveler Registration",
    save: "Save",
    cancel: "Cancel",
    loading: "Saving...",
    success: "Traveler registered successfully.",
    error: "Failed to register traveler.",
    surname: "Surname",
    surnamePlaceholder: "Enter surname",
    givenNames: "Given Names",
    givenNamesPlaceholder: "Enter given names",
    gender: "Gender",
    male: "Male",
    female: "Female",
    nationality: "Nationality",
    nationalityPlaceholder: "Enter nationality",
    passportNumber: "Passport Number",
    passportNumberPlaceholder: "Enter passport number",
    passportExpiry: "Passport Expiry Date",
    passportExpiryPlaceholder: "Select passport expiry date",
    email: "Email",
    emailPlaceholder: "Enter email address",
    phone: "Phone Number",
    phonePlaceholder: "Enter phone number",
    passportPhoto: "Passport Photo",
    uploadPhoto: "Upload Photo",
    dragDrop: "Drag and drop files here, or click to select",
    readingPassport: "Reading passport...",
    photoRequired: "Passport photo is required",
    invalidEmail: "Please enter a valid email address",
    invalidPhone: "Please enter a valid phone number",
    invalidPassportNumber: "Please enter a valid passport number",
    requiredField: "This field is required",
    passportReadSuccess: "Passport read successfully. Please verify and edit the information before saving.",
    passportReadNote: "※ When you upload a passport photo, the information will be automatically read. Please verify and edit the read information before saving."
  }
};

interface TravelerFormData {
  surname: string;
  givenNames: string;
  gender: 'M' | 'F';
  nationality: string;
  passportNumber: string;
  passportExpiry: string;
  email: string;
  phone: string;
  passportPhoto: File | null;
}

export default function NewTravelerPage() {
  const { lang } = useLanguage();
  const texts = NEW_TRAVELER_TEXTS[lang];
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    surname?: string;
    givenNames?: string;
    nationality?: string;
    passportNumber?: string;
    passportExpiry?: string;
    email?: string;
    phone?: string;
    passportPhoto?: string;
  }>({});
  
  const [formData, setFormData] = useState<TravelerFormData>({
    surname: '',
    givenNames: '',
    gender: 'M',
    nationality: '',
    passportNumber: '',
    passportExpiry: '',
    email: '',
    phone: '',
    passportPhoto: null
  });

  const [isReadingPassport, setIsReadingPassport] = useState(false);
  const passportPhotoUploaderRef = useRef<{ 
    uploadToStorage: () => Promise<{ urls: string[] }>;
    getLocalImages: () => { file: File; preview: string; originalName: string }[];
    clearAll: () => void;
  }>(null);

  const validateForm = (): boolean => {
    const newErrors: {
      surname?: string;
      givenNames?: string;
      nationality?: string;
      passportNumber?: string;
      passportExpiry?: string;
      email?: string;
      phone?: string;
      passportPhoto?: string;
    } = {};

    if (!formData.surname.trim()) {
      newErrors.surname = texts.requiredField;
    }

    if (!formData.givenNames.trim()) {
      newErrors.givenNames = texts.requiredField;
    }

    if (!formData.nationality.trim()) {
      newErrors.nationality = texts.requiredField;
    }

    if (!formData.passportNumber.trim()) {
      newErrors.passportNumber = texts.requiredField;
    } else if (!/^[A-Z0-9]{6,9}$/.test(formData.passportNumber)) {
      newErrors.passportNumber = texts.invalidPassportNumber;
    }

    if (!formData.passportExpiry) {
      newErrors.passportExpiry = texts.requiredField;
    }

    // 이메일은 선택사항이지만 입력된 경우 형식 검증
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = texts.invalidEmail;
    }

    // 전화번호는 선택사항이지만 입력된 경우 형식 검증
    if (formData.phone.trim() && !/^[0-9+\-\s()]{10,}$/.test(formData.phone)) {
      newErrors.phone = texts.invalidPhone;
    }

    if (!formData.passportPhoto) {
      newErrors.passportPhoto = texts.photoRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof TravelerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('폼 제출 시작');
    console.log('폼 데이터:', formData);
    
    if (!validateForm()) {
      console.log('폼 검증 실패');
      return;
    }

    console.log('폼 검증 통과, 저장 시작');
    setLoading(true);

    try {
      // 여권사진 업로드
      let passportPhotoUrl = '';
      if (passportPhotoUploaderRef.current) {
        console.log('여권사진 업로드 시작');
        const uploadResult = await passportPhotoUploaderRef.current.uploadToStorage();
        if (uploadResult.urls.length > 0) {
          passportPhotoUrl = uploadResult.urls[0];
          console.log('여권사진 업로드 완료:', passportPhotoUrl);
        }
      }

      // API를 통해 여행객 정보 저장
      const response = await fetch('/api/travelers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          surname: formData.surname,
          givenNames: formData.givenNames,
          gender: formData.gender,
          nationality: formData.nationality,
          passportNumber: formData.passportNumber,
          passportExpiry: formData.passportExpiry,
          email: formData.email,
          phone: formData.phone,
          passportPhotoUrl: passportPhotoUrl,
        }),
        credentials: 'include'
      });

      console.log('API 응답 상태:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('API 성공 응답:', result);
        alert(texts.success);
        router.push('/admin/travelers');
      } else {
        const errorData = await response.json();
        console.error('API 오류 응답:', errorData);
        alert(errorData.message || texts.error);
      }
    } catch (error) {
      console.error('여행객 등록 실패:', error);
      alert(texts.error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (confirm('작성 중인 내용이 사라집니다. 계속하시겠습니까?')) {
      router.push('/admin/travelers');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <form onSubmit={handleSubmit} id="new-traveler-form">
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  기본 정보
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 성 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {texts.surname} *
                    </label>
                    <input
                      type="text"
                      value={formData.surname}
                      onChange={(e) => handleInputChange('surname', e.target.value)}
                      placeholder={texts.surnamePlaceholder}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.surname ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.surname && (
                      <p className="mt-1 text-sm text-red-600">{errors.surname}</p>
                    )}
                  </div>

                  {/* 이름 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {texts.givenNames} *
                    </label>
                    <input
                      type="text"
                      value={formData.givenNames}
                      onChange={(e) => handleInputChange('givenNames', e.target.value)}
                      placeholder={texts.givenNamesPlaceholder}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.givenNames ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.givenNames && (
                      <p className="mt-1 text-sm text-red-600">{errors.givenNames}</p>
                    )}
                  </div>

                  {/* 성별 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {texts.gender} *
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="M">{texts.male}</option>
                      <option value="F">{texts.female}</option>
                    </select>
                  </div>

                  {/* 국적 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {texts.nationality} *
                    </label>
                    <input
                      type="text"
                      value={formData.nationality}
                      onChange={(e) => handleInputChange('nationality', e.target.value)}
                      placeholder={texts.nationalityPlaceholder}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.nationality ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.nationality && (
                      <p className="mt-1 text-sm text-red-600">{errors.nationality}</p>
                    )}
                  </div>

                  {/* 여권번호 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {texts.passportNumber} *
                    </label>
                    <input
                      type="text"
                      value={formData.passportNumber}
                      onChange={(e) => handleInputChange('passportNumber', e.target.value.toUpperCase())}
                      placeholder={texts.passportNumberPlaceholder}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.passportNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.passportNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.passportNumber}</p>
                    )}
                  </div>

                  {/* 여권만료일 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {texts.passportExpiry} *
                    </label>
                    <input
                      type="date"
                      value={formData.passportExpiry}
                      onChange={(e) => handleInputChange('passportExpiry', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.passportExpiry ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.passportExpiry && (
                      <p className="mt-1 text-sm text-red-600">{errors.passportExpiry}</p>
                    )}
                  </div>

                  {/* 이메일 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {texts.email}
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder={texts.emailPlaceholder}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  {/* 전화번호 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {texts.phone}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder={texts.phonePlaceholder}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 여권사진 업로드 */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {texts.passportPhoto}
                </label>
                <ImageUploader
                  ref={passportPhotoUploaderRef}
                  onImagesSelected={async (files) => {
                    if (files.length > 0) {
                      const file = files[0];
                      setFormData(prev => ({ ...prev, passportPhoto: file }));
                      
                      // OCR 기능 실행
                      try {
                        setIsReadingPassport(true);
                        
                        // 파일을 base64로 변환
                        const base64Reader = new FileReader();
                        base64Reader.onload = async (e) => {
                          const base64 = (e.target?.result as string).split(',')[1]; // data:image/...;base64, 부분 제거
                          
                          // Vision API 호출
                          const response = await fetch('/api/travelers/read-passport', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ image: base64 }),
                            credentials: 'include'
                          });

                          if (response.ok) {
                            const passportData = await response.json();
                            
                            console.log('Vision API 응답 데이터:', passportData);
                            
                            // 판독된 데이터로 폼 업데이트
                            setFormData(prev => {
                              const updatedData = {
                                ...prev,
                                surname: passportData.surname || prev.surname,
                                givenNames: passportData.givenNames || prev.givenNames,
                                gender: passportData.gender || prev.gender,
                                nationality: passportData.nationality || prev.nationality,
                                passportNumber: passportData.passportNumber || prev.passportNumber,
                                passportExpiry: passportData.passportExpiry || prev.passportExpiry,
                              };
                              
                              console.log('폼 데이터 업데이트:', {
                                before: prev,
                                after: updatedData,
                                passportData: passportData
                              });
                              
                              return updatedData;
                            });

                            if (passportData.surname || passportData.passportNumber) {
                              alert(texts.passportReadSuccess);
                            }
                          } else {
                            console.log('여권 판독 실패 (정상적인 경우입니다)');
                          }
                        };
                        base64Reader.readAsDataURL(file);
                      } catch (error) {
                        console.error('여권 판독 중 오류:', error);
                      } finally {
                        setIsReadingPassport(false);
                      }
                    }
                  }}
                  folder="travelers"
                  multiple={false}
                  maxFiles={1}
                  className="w-full"
                />
                
                {/* OCR 진행 상태 표시 */}
                {isReadingPassport && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <div className="text-blue-600 font-medium">{texts.readingPassport}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {texts.cancel}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? texts.loading : texts.save}
              </button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
} 