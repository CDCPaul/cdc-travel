"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, User, Users, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// 여행객 타입 정의
interface Traveler {
  id: string;
  surname: string;
  givenNames: string;
  fullName: string;
  gender: string;
  nationality: string;
  passportNumber: string;
  passportExpiry: string;
  email: string;
  phone: string;
  passportPhotoURL?: string;
}

// 승객 정보 타입  
interface PassengerInfo {
  id: string;
  source: 'TRAVELER' | 'DIRECT';
  travelerId?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  passportNumber: string;
  passportExpiry: string;
  nationality: string;
  gender: 'M' | 'F';
  type: 'Adult' | 'Child' | 'Infant';
  email?: string;
  phone?: string;
}

interface PassengerSelectorProps {
  passengers: PassengerInfo[];
  onChange: (passengers: PassengerInfo[]) => void;
  className?: string;
}

export function PassengerSelector({ passengers, onChange, className = '' }: PassengerSelectorProps) {
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [isLoadingTravelers, setIsLoadingTravelers] = useState(false);
  const [showTravelerModal, setShowTravelerModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 여행객 목록 로드
  const loadTravelers = useCallback(async () => {
    setIsLoadingTravelers(true);
    try {
      const response = await fetch('/api/travelers', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        setTravelers(result.data?.travelers || []);
      } else {
        console.error('여행객 목록 로드 실패:', response.status);
      }
    } catch (error) {
      console.error('여행객 목록 로드 에러:', error);
    } finally {
      setIsLoadingTravelers(false);
    }
  }, []);

  useEffect(() => {
    loadTravelers();
  }, [loadTravelers]);

  // 검색된 여행객 목록
  const filteredTravelers = travelers.filter(traveler =>
    traveler.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    traveler.passportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    traveler.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 새 승객 추가 (직접 입력)
  const addDirectPassenger = () => {
    const newPassenger: PassengerInfo = {
      id: `passenger-${Date.now()}`,
      source: 'DIRECT',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      passportNumber: '',
      passportExpiry: '',
      nationality: 'KR',
      gender: 'M',
      type: 'Adult',
      email: '',
      phone: ''
    };
    
    onChange([...passengers, newPassenger]);
  };

  // 기존 여행객에서 승객 추가
  const addTravelerAsPassenger = (traveler: Traveler) => {
    const newPassenger: PassengerInfo = {
      id: `passenger-${Date.now()}`,
      source: 'TRAVELER',
      travelerId: traveler.id,
      firstName: traveler.givenNames,
      lastName: traveler.surname,
      dateOfBirth: '', // 여행객 DB에 생년월일이 없다면 추후 추가 입력 필요
      passportNumber: traveler.passportNumber,
      passportExpiry: traveler.passportExpiry,
      nationality: traveler.nationality,
      gender: traveler.gender as 'M' | 'F',
      type: 'Adult',
      email: traveler.email,
      phone: traveler.phone
    };
    
    onChange([...passengers, newPassenger]);
    setShowTravelerModal(false);
    setSearchTerm('');
  };

  // 승객 정보 업데이트
  const updatePassenger = (passengerId: string, field: keyof PassengerInfo, value: string) => {
    onChange(passengers.map(passenger =>
      passenger.id === passengerId
        ? { ...passenger, [field]: value }
        : passenger
    ));
  };

  // 승객 제거
  const removePassenger = (passengerId: string) => {
    onChange(passengers.filter(p => p.id !== passengerId));
  };

  // 승객 타입별 아이콘
  const getPassengerTypeIcon = (type: string) => {
    switch (type) {
      case 'Adult': return <User className="w-4 h-4" />;
      case 'Child': return <Users className="w-4 h-4" />;
      case 'Infant': return <User className="w-3 h-3" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 승객 추가 버튼들 */}
      <div className="flex space-x-2 mb-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowTravelerModal(true)}
          className="flex items-center"
        >
          <Users className="w-4 h-4 mr-2" />
          등록된 여행객 선택
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addDirectPassenger}
          className="flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          직접 입력
        </Button>
      </div>

      {/* 승객 목록 */}
      <div className="space-y-3">
        {passengers.map((passenger, index) => (
          <div key={passenger.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getPassengerTypeIcon(passenger.type)}
                <span className="font-medium text-gray-700">
                  승객 {index + 1}
                </span>
                {passenger.source === 'TRAVELER' && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    등록된 여행객
                  </span>
                )}
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removePassenger(passenger.id)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  성 *
                </label>
                <Input
                  type="text"
                  placeholder="Last Name"
                  value={passenger.lastName}
                  onChange={(e) => updatePassenger(passenger.id, 'lastName', e.target.value)}
                  disabled={passenger.source === 'TRAVELER'}
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  이름 *
                </label>
                <Input
                  type="text"
                  placeholder="First Name"
                  value={passenger.firstName}
                  onChange={(e) => updatePassenger(passenger.id, 'firstName', e.target.value)}
                  disabled={passenger.source === 'TRAVELER'}
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  생년월일 *
                </label>
                <Input
                  type="date"
                  value={passenger.dateOfBirth}
                  onChange={(e) => updatePassenger(passenger.id, 'dateOfBirth', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  성별 *
                </label>
                <select
                  value={passenger.gender}
                  onChange={(e) => updatePassenger(passenger.id, 'gender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                >
                  <option value="M">남성</option>
                  <option value="F">여성</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  승객 타입 *
                </label>
                <select
                  value={passenger.type}
                  onChange={(e) => updatePassenger(passenger.id, 'type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                >
                  <option value="Adult">성인 (12세 이상)</option>
                  <option value="Child">아동 (2-11세)</option>
                  <option value="Infant">유아 (2세 미만)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  국적 *
                </label>
                <Input
                  type="text"
                  placeholder="KR"
                  value={passenger.nationality}
                  onChange={(e) => updatePassenger(passenger.id, 'nationality', e.target.value)}
                  disabled={passenger.source === 'TRAVELER'}
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  여권번호 *
                </label>
                <Input
                  type="text"
                  placeholder="M12345678"
                  value={passenger.passportNumber}
                  onChange={(e) => updatePassenger(passenger.id, 'passportNumber', e.target.value)}
                  disabled={passenger.source === 'TRAVELER'}
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  여권만료일 *
                </label>
                <Input
                  type="date"
                  value={passenger.passportExpiry}
                  onChange={(e) => updatePassenger(passenger.id, 'passportExpiry', e.target.value)}
                  disabled={passenger.source === 'TRAVELER'}
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  이메일
                </label>
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={passenger.email || ''}
                  onChange={(e) => updatePassenger(passenger.id, 'email', e.target.value)}
                  disabled={passenger.source === 'TRAVELER'}
                />
              </div>
            </div>
          </div>
        ))}
        
        {passengers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            승객 정보를 추가해주세요
          </div>
        )}
      </div>

      {/* 여행객 선택 모달 */}
      {showTravelerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">등록된 여행객 선택</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowTravelerModal(false);
                  setSearchTerm('');
                }}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* 검색 */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="이름, 여권번호, 이메일로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 여행객 목록 */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {isLoadingTravelers ? (
                <div className="text-center py-8 text-gray-500">로딩 중...</div>
              ) : filteredTravelers.length > 0 ? (
                filteredTravelers.map((traveler) => (
                  <div
                    key={traveler.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => addTravelerAsPassenger(traveler)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <User className="w-10 h-10 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {traveler.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {traveler.passportNumber} • {traveler.nationality}
                          </div>
                          <div className="text-sm text-gray-400">
                            {traveler.email} • {traveler.phone}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          만료: {traveler.passportExpiry}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? '검색 결과가 없습니다.' : '등록된 여행객이 없습니다.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 요약 정보 */}
      {passengers.length > 0 && (
        <div className="p-3 bg-gray-100 rounded-lg text-sm text-gray-600">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-2" />
            <span>
              총 {passengers.length}명: 
              {' '}성인 {passengers.filter(p => p.type === 'Adult').length}명
              {passengers.filter(p => p.type === 'Child').length > 0 && 
                `, 아동 ${passengers.filter(p => p.type === 'Child').length}명`}
              {passengers.filter(p => p.type === 'Infant').length > 0 && 
                `, 유아 ${passengers.filter(p => p.type === 'Infant').length}명`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
