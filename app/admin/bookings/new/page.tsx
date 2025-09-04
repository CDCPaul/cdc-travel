'use client';

import { useRouter } from 'next/navigation';
import { Plane, Package, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BookingTypeSelectionPage() {
  const router = useRouter();

  const bookingTypes = [
    {
      id: 'air',
      title: '항공 예약',
      description: '항공권 단독 예약 (AIR ONLY)',
      icon: <Plane className="h-8 w-8" />,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      path: '/admin/bookings/air/new',
      features: [
        '항공권 예약 전용',
        '개인/그룹 항공 예약',
        '편도/왕복/다구간',
        '발권 마감일 관리'
      ]
    },
    {
      id: 'package',
      title: '패키지 예약',
      description: '세부 인터내셔널 패키지 상품',
      icon: <Package className="h-8 w-8" />,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      path: '/admin/bookings/package/new',
      features: [
        '패키지 상품 예약',
        '항공+숙박+관광',
        '표준/프리미엄 패키지',
        '마케팅 자료 관리'
      ]
    },
    {
      id: 'incentive',
      title: '인센티브 그룹예약',
      description: '세부 인터내셔널 인센티브 그룹',
      icon: <Users className="h-8 w-8" />,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      path: '/admin/bookings/incentive/new',
      features: [
        '대규모 그룹 예약',
        '맞춤형 인센티브 상품',
        '유연한 요구사항 대응',
        '예산 범위 설정'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">새 예약 등록</h1>
          <p className="text-xl text-gray-600">예약 유형을 선택해주세요</p>
        </div>

        {/* 예약 타입 선택 카드들 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {bookingTypes.map((type) => (
            <div
              key={type.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 group cursor-pointer overflow-hidden"
              onClick={() => router.push(type.path)}
            >
              {/* 카드 헤더 */}
              <div className={`${type.color} text-white p-8 relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white bg-opacity-10 transform translate-x-16 -translate-y-16" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-4 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                      {type.icon}
                    </div>
                    <ArrowRight className="h-6 w-6 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{type.title}</h3>
                  <p className="text-lg opacity-90">{type.description}</p>
                </div>
              </div>

              {/* 카드 본문 */}
              <div className="p-8">
                <ul className="space-y-4 mb-8">
                  {type.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <div className={`w-3 h-3 ${type.color} rounded-full mr-4 flex-shrink-0`} />
                      <span className="text-base font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${type.color} ${type.hoverColor} text-white text-lg py-4 transition-colors duration-300 shadow-lg hover:shadow-xl`}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(type.path);
                  }}
                >
                  {type.title} 등록하기
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* 하단 안내 */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-blue-200 p-8 shadow-sm">
            <div className="text-center mb-6">
              <h4 className="text-2xl font-bold text-blue-900 mb-3">💡 어떤 예약 타입을 선택해야 할까요?</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="p-4 bg-blue-50 rounded-lg">
                <Plane className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h5 className="font-bold text-blue-900 mb-2">항공 예약</h5>
                <p className="text-sm text-blue-800">항공권만 필요한 고객용<br/>개인 또는 그룹 항공 예약</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <Package className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h5 className="font-bold text-green-900 mb-2">패키지 예약</h5>
                <p className="text-sm text-green-800">기본 패키지 상품<br/>(항공+숙박+관광)</p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <Users className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <h5 className="font-bold text-purple-900 mb-2">인센티브 그룹</h5>
                <p className="text-sm text-purple-800">기업 단체, 특별 행사용<br/>맞춤 상품</p>
              </div>
            </div>
          </div>
        </div>

        {/* 빠른 통계 (선택사항) */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">항공 예약</div>
            <div className="text-sm text-gray-600 mt-1">AIR팀 처리</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-green-600">패키지 예약</div>
            <div className="text-sm text-gray-600 mt-1">CINT팀 처리</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">인센티브 그룹</div>
            <div className="text-sm text-gray-600 mt-1">CINT+AIR팀 협업</div>
          </div>
        </div>
      </div>
    </div>
  );
}