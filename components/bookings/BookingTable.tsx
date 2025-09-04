"use client";

import { DataTable, Column, Action } from '@/components/ui/data-table';
import { StatusBadge, TeamBadge, PriorityBadge } from './StatusBadge';
import { Booking, AIRBooking, CINTPackageBooking, CINTIncentiveGroupBooking } from '@/types/booking';
import { Team } from '@/types/team';
import { formatDate } from '@/lib/utils';
import { 
  Edit, 
  Eye, 
  MessageSquare, 
  Users, 
  User,
  Plane,
  Trash2, 
  MapPin,
  Clock,
  AlertTriangle,
  FileText
} from 'lucide-react';

interface BookingTableProps {
  bookings: Booking[];
  currentTeam?: Team;
  isLoading?: boolean;
  onBookingClick?: (booking: Booking) => void;
  onBookingEdit?: (booking: Booking) => void;
  onCollaborate?: (booking: Booking) => void;
  onViewDetails?: (booking: Booking) => void;
  onBookingDelete?: (booking: Booking) => void;
  className?: string;
}

export function BookingTable({
  bookings,
  isLoading = false,
  onBookingClick,
  onBookingEdit,
  onCollaborate,
  onViewDetails,
  onBookingDelete,
  className = ''
}: BookingTableProps) {

  // 컬럼 정의
  const columns: Column<Booking>[] = [
    {
      key: 'bookingNumber',
      header: '부킹번호',
      sortable: true,
      searchable: true,
      cell: (booking) => (
        <div className="font-mono text-sm">
          <div className="font-semibold">{booking.bookingNumber}</div>
          <TeamBadge team={booking.primaryTeam} className="mt-1" />
        </div>
      )
    },
    {
      key: 'customer.name',
      header: '고객 정보',
      sortable: true,
      searchable: true,
      cell: (booking) => {
        const customer = booking.customer;
        
        return (
          <div className="min-w-[120px] max-w-[150px]">
            <div className="font-semibold text-gray-900 truncate">{customer.name}</div>
            <div className="text-xs text-gray-500">
              {customer.taCode ? (
                // TA인 경우 TA 코드를 배지로 표시
                <div className="font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs inline-block">
                  {customer.taCode}
                </div>
              ) : (
                // 개인 고객인 경우 이메일 표시 (truncate)
                <div className="truncate" title={customer.email}>
                  {customer.email}
                </div>
              )}
            </div>
          </div>
        );
      }
    },
    {
      key: 'projectType',
      header: '프로젝트',
      sortable: true,
      cell: (booking) => (
        <div className="text-sm">
          <div className="font-medium">
            {booking.projectType === 'AIR_ONLY' ? 'AIR 단독' :
             booking.projectType === 'CINT_PACKAGE' ? 'CINT 패키지' :
             'CINT 인센티브'}
          </div>
          {booking.collaboratingTeam && (
            <div className="flex items-center space-x-1 mt-1">
              <span className="text-xs text-gray-500">협업:</span>
              <TeamBadge team={booking.collaboratingTeam} />
            </div>
          )}
        </div>
      )
    },
    {
      key: 'currentStep',
      header: '진행 상태',
      sortable: true,
      cell: (booking) => (
        <StatusBadge status={booking.currentStep} showProgress />
      )
    },
    {
      key: 'dates.start',
      header: '출발일',
      sortable: true,
      cell: (booking) => (
        <div className="text-sm min-w-[100px]">
          <div className="font-medium">{formatDate(booking.dates.start)}</div>
        </div>
      )
    },
    {
      key: 'dates.end',
      header: '리턴일',
      sortable: true,
      cell: (booking) => {
        const startDate = booking.dates.start instanceof Date ? booking.dates.start : new Date(booking.dates.start);
        const endDate = booking.dates.end instanceof Date ? booking.dates.end : new Date(booking.dates.end);
        const isOneWay = startDate.getTime() === endDate.getTime();
        return (
          <div className="text-sm min-w-[100px]">
            {isOneWay ? (
              <div className="font-medium text-orange-600">편도</div>
            ) : (
              <div className="font-medium">{formatDate(booking.dates.end)}</div>
            )}
          </div>
        );
      }
    },
    {
      key: 'paxInfo',
      header: '예약인원',
      sortable: true,
      cell: (booking) => (
        <div className="text-sm min-w-[80px]">
          <div className="space-y-1">
            {booking.paxInfo.adults > 0 && (
              <div className="flex items-center text-xs">
                <Users className="h-3 w-3 text-blue-500 mr-1" />
                <span>성인 {booking.paxInfo.adults}</span>
              </div>
            )}
            {booking.paxInfo.children > 0 && (
              <div className="flex items-center text-xs">
                <User className="h-3 w-3 text-green-500 mr-1" />
                <span>아동 {booking.paxInfo.children}</span>
              </div>
            )}
            {booking.paxInfo.infants > 0 && (
              <div className="flex items-center text-xs">
                <User className="h-3 w-3 text-pink-500 mr-1" />
                <span>유아 {booking.paxInfo.infants}</span>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'priority',
      header: '우선순위',
      sortable: true,
      cell: (booking) => (
        <PriorityBadge priority={booking.priority} />
      )
    },
    {
      key: 'assignedTo',
      header: '담당자',
      sortable: true,
      cell: (booking) => (
        <div className="text-sm min-w-[100px]">
          {booking.customer.assignedManager ? (
            <div className="font-medium text-gray-800">
              {booking.customer.assignedManager}
            </div>
          ) : (booking.customer as { type?: string }).type === 'DIRECT' ? (
            <div className="font-medium text-blue-600">Individual</div>
          ) : (
            <span className="text-gray-400 italic">미지정</span>
          )}
        </div>
      )
    },
    {
      key: 'deadlines',
      header: '마감일',
      sortable: true,
      cell: (booking) => {
        const now = new Date();
        const upcoming = [];
        
        if (booking.deadlines?.confirmation && booking.deadlines.confirmation > now) {
          const confirmationDate = booking.deadlines.confirmation instanceof Date ? booking.deadlines.confirmation : new Date(booking.deadlines.confirmation);
          upcoming.push({
            label: '확정',
            date: confirmationDate,
            urgent: confirmationDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000
          });
        }
        
        if (booking.deadlines?.deposit && booking.deadlines.deposit > now) {
          const depositDate = booking.deadlines.deposit instanceof Date ? booking.deadlines.deposit : new Date(booking.deadlines.deposit);
          upcoming.push({
            label: '예약금',
            date: depositDate,
            urgent: depositDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000
          });
        }
        
        if (booking.deadlines?.finalPayment && booking.deadlines.finalPayment > now) {
          const finalPaymentDate = booking.deadlines.finalPayment instanceof Date ? booking.deadlines.finalPayment : new Date(booking.deadlines.finalPayment);
          upcoming.push({
            label: '잔금',
            date: finalPaymentDate,
            urgent: finalPaymentDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000
          });
        }

        if (upcoming.length === 0) {
          return <span className="text-xs text-gray-400">없음</span>;
        }

        const nextDeadline = upcoming.sort((a, b) => a.date.getTime() - b.date.getTime())[0];

        return (
          <div className="text-xs">
            <div className={`flex items-center ${nextDeadline.urgent ? 'text-red-600' : 'text-gray-700'}`}>
              <Clock className="h-3 w-3 mr-1" />
              {nextDeadline.label}
            </div>
            <div className={nextDeadline.urgent ? 'text-red-600 font-medium' : 'text-gray-500'}>
              {formatDate(nextDeadline.date)}
            </div>
            {nextDeadline.urgent && (
              <div className="flex items-center text-red-500 mt-1">
                <AlertTriangle className="h-3 w-3 mr-1" />
                <span className="text-xs">긴급</span>
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'createdAt',
      header: '등록일',
      sortable: true,
      cell: (booking) => (
        <div className="text-sm text-gray-600 min-w-[100px]">
          {formatDate(booking.createdAt)}
        </div>
      )
    }
  ];

  // 액션 정의
  const actions: Action<Booking>[] = [
    {
      label: '상세보기',
      icon: <Eye className="h-8 w-8 text-blue-600" />,
      onClick: onViewDetails,
      variant: 'ghost' as const
    },
    {
      label: '수정',
      icon: <Edit className="h-8 w-8 text-green-600" />,
      onClick: onBookingEdit,
      variant: 'ghost' as const
    },
    {
      label: '협업요청',
      icon: <MessageSquare className="h-8 w-8 text-orange-600" />,
      onClick: onCollaborate,
      variant: 'ghost' as const
    },
    {
      label: '삭제',
      icon: <Trash2 className="h-8 w-8 text-red-600" />,
      onClick: onBookingDelete,
      variant: 'ghost' as const
    }
  ].filter(action => action.onClick !== undefined);

  // 확장 가능한 행 내용
  const expandedRow = (booking: Booking) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 기본 정보 */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 border-b pb-2">기본 정보</h4>
        
        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-gray-700">프로젝트 타입:</span>
            <div className="mt-1">
              {booking.projectType === 'AIR_ONLY' ? '항공 단독 예약' :
               booking.projectType === 'CINT_PACKAGE' ? 'CINT 패키지 상품' :
               'CINT 인센티브 그룹 예약'}
            </div>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-700">담당 팀:</span>
            <div className="mt-1">
              <TeamBadge team={booking.primaryTeam} className="mr-2" />
              {booking.collaboratingTeam && (
                <>
                  <span className="text-xs text-gray-500 mx-2">+</span>
                  <TeamBadge team={booking.collaboratingTeam} />
                </>
              )}
            </div>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-700">승객 정보:</span>
            <div className="mt-1 text-sm text-gray-600">
              성인 {booking.paxInfo.adults}명
              {booking.paxInfo.children > 0 && `, 아동 ${booking.paxInfo.children}명`}
              {booking.paxInfo.infants > 0 && `, 유아 ${booking.paxInfo.infants}명`}
              <span className="text-gray-400 ml-2">(총 {booking.paxInfo.adults + booking.paxInfo.children + booking.paxInfo.infants}명)</span>
            </div>
          </div>

          {booking.tags && booking.tags.length > 0 && (
            <div>
              <span className="text-sm font-medium text-gray-700">태그:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {booking.tags.map((tag, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 프로젝트별 추가 정보 */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 border-b pb-2">상세 정보</h4>
        
        {booking.projectType === 'AIR_ONLY' && (
          <AIRBookingDetails booking={booking as AIRBooking} />
        )}
        
        {booking.projectType === 'CINT_PACKAGE' && (
          <CINTPackageDetails booking={booking as CINTPackageBooking} />
        )}
        
        {booking.projectType === 'CINT_INCENTIVE_GROUP' && (
          <CINTIncentiveDetails booking={booking as CINTIncentiveGroupBooking} />
        )}

        {booking.notes && (
          <div>
            <span className="text-sm font-medium text-gray-700">메모:</span>
            <div className="mt-1 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              {booking.notes}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-8 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      <DataTable
        data={bookings}
        columns={columns}
        actions={actions}
        itemsPerPage={20}
        emptyMessage="예약이 없습니다."
        expandable
        expandedRow={expandedRow}
        onRowClick={onBookingClick}
      />
    </div>
  );
}

// AIR 예약 상세 정보 컴포넌트
function AIRBookingDetails({ booking }: { booking: AIRBooking }) {
  if (!booking.flightDetails) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center">
        <Plane className="h-4 w-4 mr-2 text-blue-600" />
        <span className="text-sm font-medium text-gray-700">항공편 정보</span>
      </div>
      
      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md space-y-2">
        <div><strong>경로:</strong> {booking.flightDetails.route}</div>
        <div><strong>출발일:</strong> {formatDate(booking.flightDetails.departureDate)}</div>
        {booking.flightDetails.returnDate && (
          <div><strong>복귀일:</strong> {formatDate(booking.flightDetails.returnDate)}</div>
        )}
        <div><strong>구간:</strong> {booking.flightDetails.flightType === 'ONE_WAY' ? '편도' : '왕복'}</div>
        {booking.flightDetails.departureFlights && booking.flightDetails.departureFlights.length > 0 && (
          <div>
            <strong>출발편:</strong> {booking.flightDetails.departureFlights[0].airline} {booking.flightDetails.departureFlights[0].flightNumber}
            <span className="text-xs text-gray-500 ml-2">
              {booking.flightDetails.departureFlights[0].departureTime} → {booking.flightDetails.departureFlights[0].arrivalTime}
            </span>
          </div>
        )}
        {booking.flightDetails.returnFlights && booking.flightDetails.returnFlights.length > 0 && (
          <div>
            <strong>복귀편:</strong> {booking.flightDetails.returnFlights[0].airline} {booking.flightDetails.returnFlights[0].flightNumber}
            <span className="text-xs text-gray-500 ml-2">
              {booking.flightDetails.returnFlights[0].departureTime} → {booking.flightDetails.returnFlights[0].arrivalTime}
            </span>
          </div>
        )}
        {(booking as AIRBooking).specialRequests && (booking as AIRBooking).specialRequests!.length > 0 && (
          <div><strong>특별요청:</strong> {(booking as AIRBooking).specialRequests!.join(', ')}</div>
        )}
      </div>

      {(booking as AIRBooking).airlineQuotes && (booking as AIRBooking).airlineQuotes.length > 0 && (
        <div>
          <span className="text-sm font-medium text-gray-700">견적 현황:</span>
          <div className="mt-1 text-xs text-gray-500">
            {(booking as AIRBooking).airlineQuotes.length}개 항공사 견적 접수
          </div>
        </div>
      )}
    </div>
  );
}

// CINT 패키지 예약 상세 정보 컴포넌트
function CINTPackageDetails({ booking }: { booking: CINTPackageBooking }) {
  if (!booking.packageInfo) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center">
        <FileText className="h-4 w-4 mr-2 text-purple-600" />
        <span className="text-sm font-medium text-gray-700">패키지 정보</span>
      </div>
      
      <div className="text-sm text-gray-600 bg-purple-50 p-3 rounded-md space-y-2">
        <div><strong>패키지:</strong> {booking.packageInfo.packageName}</div>
        <div><strong>타입:</strong> {booking.packageInfo.packageType}</div>
        <div><strong>최소인원:</strong> {booking.packageInfo.minimumPax}명</div>
        <div><strong>최대인원:</strong> {booking.packageInfo.maximumPax}명</div>
        {booking.packageInfo.isPublished ? (
          <div className="text-green-600"><strong>상태:</strong> 발행됨</div>
        ) : (
          <div className="text-orange-600"><strong>상태:</strong> 준비중</div>
        )}
      </div>

      {booking.landInfo && (
        <div>
          <span className="text-sm font-medium text-gray-700">현지 정보:</span>
          <div className="mt-1 text-sm text-gray-600">
            <div className="flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              {booking.landInfo.destination} - {booking.landInfo.partner}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// CINT 인센티브 예약 상세 정보 컴포넌트
function CINTIncentiveDetails({ booking }: { booking: CINTIncentiveGroupBooking }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center">
        <Users className="h-4 w-4 mr-2 text-green-600" />
        <span className="text-sm font-medium text-gray-700">인센티브 그룹</span>
      </div>
      
      {booking.customRequirements && (
        <div className="text-sm text-gray-600 bg-green-50 p-3 rounded-md">
          <div><strong>맞춤 요구사항:</strong></div>
          <div className="mt-1 space-y-1">
            <div><strong>항공 포함:</strong> {booking.customRequirements.includeFlights ? '예' : '아니오'}</div>
            <div><strong>숙박 포함:</strong> {booking.customRequirements.includeAccommodation ? '예' : '아니오'}</div>
            <div><strong>식사 포함:</strong> {booking.customRequirements.includeMeals ? '예' : '아니오'}</div>
            <div><strong>교통 포함:</strong> {booking.customRequirements.includeTransportation ? '예' : '아니오'}</div>
            <div><strong>가이드 포함:</strong> {booking.customRequirements.includeGuide ? '예' : '아니오'}</div>
            <div><strong>쇼핑 포함:</strong> {booking.customRequirements.includeShopping ? '예' : '아니오'}</div>
            {booking.customRequirements.specialRequests.length > 0 && (
              <div><strong>특별요청:</strong> {booking.customRequirements.specialRequests.join(', ')}</div>
            )}
            {booking.customRequirements.budgetRange && (
              <div>
                <strong>예산범위:</strong> {booking.customRequirements.budgetRange.min.toLocaleString()} ~ {booking.customRequirements.budgetRange.max.toLocaleString()} {booking.customRequirements.budgetRange.currency}
              </div>
            )}
          </div>
        </div>
      )}

      {booking.landPartnerQuotes && booking.landPartnerQuotes.length > 0 && (
        <div>
          <span className="text-sm font-medium text-gray-700">현지 파트너 견적:</span>
          <div className="mt-1 text-xs text-gray-500">
            {booking.landPartnerQuotes.length}개 파트너 견적 접수
          </div>
        </div>
      )}

      {booking.collaboratingTeam && (
        <div>
          <span className="text-sm font-medium text-gray-700">협업팀:</span>
          <div className="mt-1">
            <TeamBadge team={booking.collaboratingTeam} />
          </div>
        </div>
      )}
    </div>
  );
}
