"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Edit2, 
  Share2, 
  Download, 
  MessageSquare,
  Calendar,
  Users,
  Plane,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  Star
} from 'lucide-react';
import { Booking } from '@/types/booking';
import { TeamBadge, BookingStatusBadge, PriorityBadge } from '@/components/bookings/StatusBadge';

interface BookingDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function BookingDetailPage({ params }: BookingDetailPageProps) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBooking();
  }, [resolvedParams.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadBooking = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/bookings/${resolvedParams.id}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('예약 정보를 불러오는데 실패했습니다.');
      }

      const result = await response.json();
      setBooking(result.data);
    } catch (error) {
      console.error('Failed to load booking:', error);
      setError(error instanceof Error ? error.message : '예약 정보 로드 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/admin/bookings/${resolvedParams.id}/edit`);
  };

  const handleCollaborate = () => {
    // TODO: 협업 요청 모달 구현
    console.log('Collaborate on booking:', resolvedParams.id);
  };

  const handleDownload = () => {
    // TODO: PDF 다운로드 구현
    console.log('Download booking:', resolvedParams.id);
  };

  const handleShare = () => {
    // TODO: 공유 기능 구현
    console.log('Share booking:', resolvedParams.id);
  };

  const handleBackToList = () => {
    router.push('/admin/bookings');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">예약 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">오류가 발생했습니다</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleBackToList} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">예약을 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-4">요청하신 예약 정보가 존재하지 않습니다.</p>
          <Button onClick={handleBackToList} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const InfoCard = ({ 
    title, 
    icon, 
    children, 
    className = '' 
  }: { 
    title: string; 
    icon: React.ReactNode; 
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 헤더 */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToList}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  예약 목록으로
                </Button>
                
                <div className="border-l border-gray-300 pl-4">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">{booking.bookingNumber}</h1>
                      <div className="flex items-center space-x-2 mt-1">
                        <TeamBadge team={booking.primaryTeam} />
                        <BookingStatusBadge status={booking.status} />
                        <PriorityBadge priority={booking.priority} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  공유
                </Button>
                
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  다운로드
                </Button>
                
                <Button variant="outline" size="sm" onClick={handleCollaborate}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  협업요청
                </Button>
                
                <Button size="sm" onClick={handleEdit}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  수정
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 컨텐츠 */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 고객 정보 */}
            <InfoCard title="고객 정보" icon={<Users className="h-5 w-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">고객명</label>
                  <p className="mt-1 text-gray-900">{booking.customer.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">이메일</label>
                  <p className="mt-1 text-gray-900">{booking.customer.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">전화번호</label>
                  <p className="mt-1 text-gray-900">{booking.customer.phone}</p>
                </div>
                {booking.customer.company && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">회사명</label>
                    <p className="mt-1 text-gray-900">{booking.customer.company}</p>
                  </div>
                )}
                {booking.customer.address && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">주소</label>
                    <p className="mt-1 text-gray-900">{booking.customer.address}</p>
                  </div>
                )}
              </div>
            </InfoCard>

            {/* 여행 정보 */}
            <InfoCard title="여행 정보" icon={<Calendar className="h-5 w-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">출발일</label>
                  <p className="mt-1 text-gray-900">{formatDate(booking.dates.start)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">복귀일</label>
                  <p className="mt-1 text-gray-900">{formatDate(booking.dates.end)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">승객 수</label>
                  <p className="mt-1 text-gray-900">
                    총 {booking.paxInfo.total}명 (성인 {booking.paxInfo.adults}명, 아동 {booking.paxInfo.children}명, 유아 {booking.paxInfo.infants}명)
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">프로젝트 타입</label>
                  <p className="mt-1 text-gray-900">
                    {booking.projectType === 'AIR_ONLY' && 'AIR 단독'}
                    {booking.projectType === 'CINT_PACKAGE' && 'CINT 패키지'}
                    {booking.projectType === 'CINT_INCENTIVE_GROUP' && 'CINT 인센티브 그룹'}
                  </p>
                </div>
              </div>
            </InfoCard>

            {/* 항공편 정보 (있는 경우만) */}
            {'flightDetails' in booking && booking.flightDetails && (
              <InfoCard title="항공편 정보" icon={<Plane className="h-5 w-5" />}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">경로</label>
                      <p className="mt-1 text-gray-900">{booking.flightDetails.route}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">항공편 타입</label>
                      <p className="mt-1 text-gray-900">
                        {booking.flightDetails.flightType === 'ONE_WAY' ? '편도' : '왕복'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">출발일</label>
                      <p className="mt-1 text-gray-900">{formatDate(booking.flightDetails.departureDate)}</p>
                    </div>
                  </div>

                  {/* 출발편 정보 */}
                  {booking.flightDetails.departureFlights && booking.flightDetails.departureFlights.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">출발편</h4>
                      {booking.flightDetails.departureFlights.map((flight, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg mb-2">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">항공사: </span>
                              <span className="font-medium">{flight.airline} {flight.flightNumber}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">출발: </span>
                              <span className="font-medium">{flight.departureTime}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">도착: </span>
                              <span className="font-medium">{flight.arrivalTime}</span>
                            </div>
                            {flight.aircraft && (
                              <div>
                                <span className="text-gray-600">기종: </span>
                                <span className="font-medium">{flight.aircraft}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 복귀편 정보 */}
                  {booking.flightDetails.returnFlights && booking.flightDetails.returnFlights.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">복귀편</h4>
                      {booking.flightDetails.returnFlights.map((flight, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg mb-2">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">항공사: </span>
                              <span className="font-medium">{flight.airline} {flight.flightNumber}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">출발: </span>
                              <span className="font-medium">{flight.departureTime}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">도착: </span>
                              <span className="font-medium">{flight.arrivalTime}</span>
                            </div>
                            {flight.aircraft && (
                              <div>
                                <span className="text-gray-600">기종: </span>
                                <span className="font-medium">{flight.aircraft}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </InfoCard>
            )}

            {/* 패키지 정보 (CINT 패키지인 경우) */}
            {booking.projectType === 'CINT_PACKAGE' && 'packageInfo' in booking && booking.packageInfo && (
              <InfoCard title="패키지 정보" icon={<Star className="h-5 w-5" />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">패키지명</label>
                    <p className="mt-1 text-gray-900">{booking.packageInfo.packageName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">패키지 ID</label>
                    <p className="mt-1 text-gray-900">{booking.packageInfo.packageId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">패키지 타입</label>
                    <p className="mt-1 text-gray-900">
                      {booking.packageInfo.packageType === 'STANDARD' && '스탠다드'}
                      {booking.packageInfo.packageType === 'PREMIUM' && '프리미엄'}
                      {booking.packageInfo.packageType === 'CUSTOM' && '맞춤형'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">인원 제한</label>
                    <p className="mt-1 text-gray-900">{booking.packageInfo.minimumPax}~{booking.packageInfo.maximumPax}명</p>
                  </div>
                </div>
              </InfoCard>
            )}

            {/* 메모 */}
            {(booking.notes || booking.internalNotes) && (
              <InfoCard title="메모" icon={<MessageSquare className="h-5 w-5" />}>
                {booking.notes && (
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700">고객용 메모</label>
                    <p className="mt-1 text-gray-900 whitespace-pre-wrap">{booking.notes}</p>
                  </div>
                )}
                {booking.internalNotes && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">내부 전용 메모</label>
                    <p className="mt-1 text-gray-900 whitespace-pre-wrap bg-yellow-50 p-3 rounded-lg">{booking.internalNotes}</p>
                  </div>
                )}
              </InfoCard>
            )}
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 상태 요약 */}
            <InfoCard title="상태 요약" icon={<CheckCircle className="h-5 w-5" />}>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">상태</span>
                  <BookingStatusBadge status={booking.status} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">우선순위</span>
                  <PriorityBadge priority={booking.priority} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">담당팀</span>
                  <TeamBadge team={booking.primaryTeam} />
                </div>
                {booking.collaboratingTeam && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">협업팀</span>
                    <TeamBadge team={booking.collaboratingTeam} />
                  </div>
                )}
              </div>
            </InfoCard>

            {/* 중요 일정 */}
            {Object.values(booking.deadlines).some(Boolean) && (
              <InfoCard title="중요 일정" icon={<Clock className="h-5 w-5" />}>
                <div className="space-y-3">
                  {booking.deadlines.confirmation && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">확정 마감</span>
                      <span className="text-sm font-medium">{formatDate(booking.deadlines.confirmation)}</span>
                    </div>
                  )}
                  {booking.deadlines.deposit && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">예약금 마감</span>
                      <span className="text-sm font-medium">{formatDate(booking.deadlines.deposit)}</span>
                    </div>
                  )}
                  {booking.deadlines.finalPayment && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">잔금 마감</span>
                      <span className="text-sm font-medium">{formatDate(booking.deadlines.finalPayment)}</span>
                    </div>
                  )}
                  {booking.deadlines.departure && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">출발일</span>
                      <span className="text-sm font-medium">{formatDate(booking.deadlines.departure)}</span>
                    </div>
                  )}
                </div>
              </InfoCard>
            )}

            {/* 결제 정보 */}
            {booking.payments.length > 0 && (
              <InfoCard title="결제 정보" icon={<CreditCard className="h-5 w-5" />}>
                <div className="space-y-3">
                  {booking.payments.map((payment, index) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">
                          {payment.type === 'DEPOSIT' && '예약금'}
                          {payment.type === 'FINAL' && '잔금'}
                          {payment.type === 'FULL' && '전액'}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'PAID' ? 'bg-green-100 text-green-800' :
                          payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          payment.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {payment.status === 'PAID' && '결제완료'}
                          {payment.status === 'PENDING' && '대기중'}
                          {payment.status === 'OVERDUE' && '연체'}
                          {payment.status === 'CANCELLED' && '취소'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>금액: {payment.amount.toLocaleString()} {payment.currency}</div>
                        <div>마감: {formatDate(payment.dueDate)}</div>
                        {payment.paidDate && (
                          <div>결제일: {formatDate(payment.paidDate)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </InfoCard>
            )}

            {/* 생성 정보 */}
            <InfoCard title="생성 정보" icon={<Calendar className="h-5 w-5" />}>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">생성일: </span>
                  <span className="font-medium">{formatDate(booking.createdAt)}</span>
                </div>
                <div>
                  <span className="text-gray-600">수정일: </span>
                  <span className="font-medium">{formatDate(booking.updatedAt)}</span>
                </div>
                {booking.tags.length > 0 && (
                  <div>
                    <span className="text-gray-600">태그: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {booking.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </InfoCard>
          </div>
        </div>

      </div>
    </div>
  );
}
