import { AeroDataBoxFlight, AeroDataBoxResponse, PHILIPPINE_AIRPORTS } from '@/types/flight';

const AERODATABOX_BASE_URL = 'https://aerodatabox.p.rapidapi.com';
const API_KEY = process.env.NEW_FLIGHT_API_KEY;

if (!API_KEY) {
  console.warn('⚠️ NEW_FLIGHT_API_KEY가 설정되지 않았습니다.');
}

export class AeroDataBoxService {
  /**
   * AeroDataBox API에서 항공편 정보를 가져옵니다
   * @param departureIata 출발 공항 IATA 코드
   * @param offsetMinutes 시간 오프셋 (분)
   * @param durationMinutes 조회 기간 (분)
   * @returns Promise<AeroDataBoxResponse>
   */
  static async getFlights(
    departureIata: string,
    offsetMinutes: number = -120,
    durationMinutes: number = 720
  ): Promise<AeroDataBoxResponse> {
    if (!API_KEY) {
      throw new Error('NEW_FLIGHT_API_KEY가 설정되지 않았습니다.');
    }

    const params = new URLSearchParams({
      offsetMinutes: offsetMinutes.toString(),
      durationMinutes: durationMinutes.toString(),
      withLeg: 'true',
      direction: 'Both',
      withCancelled: 'true',
      withCodeshared: 'true',
      withCargo: 'true',
      withPrivate: 'true',
      withLocation: 'false',
    });

    const url = `${AERODATABOX_BASE_URL}/flights/airports/iata/${departureIata}?${params.toString()}`;
    
    try {
      console.log(`🔄 AeroDataBox API 호출: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': API_KEY,
          'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API 응답 오류: ${response.status} ${response.statusText}`);
        console.error(`응답 내용: ${errorText}`);
        throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ API 응답 성공: ${data.flights?.length || 0}개 항공편`);
      return data as AeroDataBoxResponse;
    } catch (error) {
      console.error('❌ AeroDataBox API 호출 실패:', error);
      throw error;
    }
  }

  /**
   * 필리핀 도착 항공편만 필터링합니다
   * @param flights 모든 항공편 목록
   * @returns 필리핀 도착 항공편만 필터링된 목록
   */
  static filterPhilippineFlights(flights: AeroDataBoxFlight[]): AeroDataBoxFlight[] {
    const philippineAirportCodes = Object.keys(PHILIPPINE_AIRPORTS);
    
    return flights.filter(flight => {
      const arrivalIata = flight.arrival.iata;
      return philippineAirportCodes.includes(arrivalIata);
    });
  }

  /**
   * AeroDataBox 응답을 FlightSchedule 형식으로 변환합니다
   * @param flight AeroDataBox 항공편 데이터
   * @returns FlightSchedule 형식의 데이터
   */
  static convertToFlightSchedule(flight: AeroDataBoxFlight) {
    const departureTime = new Date(flight.departure.scheduledTime);
    const arrivalTime = new Date(flight.arrival.scheduledTime);

    return {
      id: `${flight.flight.iata}${flight.flight.number}_${departureTime.getTime()}`,
      flightNumber: flight.flight.number,
      airline: flight.airline.name,
      airlineCode: flight.airline.iata,
      departureAirport: flight.departure.airport,
      departureIata: flight.departure.iata,
      arrivalAirport: flight.arrival.airport,
      arrivalIata: flight.arrival.iata,
      departureTime: departureTime.toISOString(),
      arrivalTime: arrivalTime.toISOString(),
      departureDate: departureTime.toISOString().split('T')[0],
      arrivalDate: arrivalTime.toISOString().split('T')[0],
      aircraftType: flight.aircraft?.model,
      status: this.mapFlightStatus(flight.status),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * AeroDataBox 상태를 내부 상태로 매핑합니다
   * @param status AeroDataBox 상태 문자열
   * @returns 내부 상태 값
   */
  private static mapFlightStatus(status: string): 'Scheduled' | 'Delayed' | 'Cancelled' | 'Diverted' {
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('cancelled') || statusLower.includes('canceled')) {
      return 'Cancelled';
    }
    if (statusLower.includes('delayed')) {
      return 'Delayed';
    }
    if (statusLower.includes('diverted')) {
      return 'Diverted';
    }
    
    return 'Scheduled';
  }

  /**
   * 날짜 범위를 12시간 단위로 분할합니다
   * @param startDate 시작 날짜
   * @param endDate 종료 날짜
   * @returns 12시간 단위로 분할된 날짜 범위 배열
   */
  static splitDateRangeInto12HourChunks(startDate: Date, endDate: Date): Array<{from: Date, to: Date}> {
    const chunks: Array<{from: Date, to: Date}> = [];
    const currentDate = new Date(startDate);
    
    while (currentDate < endDate) {
      const chunkEnd = new Date(currentDate.getTime() + 12 * 60 * 60 * 1000); // 12시간 추가
      const actualEnd = chunkEnd > endDate ? endDate : chunkEnd;
      
      chunks.push({
        from: new Date(currentDate),
        to: actualEnd,
      });
      
      currentDate.setTime(actualEnd.getTime());
    }
    
    return chunks;
  }

  /**
   * 날짜를 ISO 8601 형식으로 변환합니다
   * @param date 날짜 객체
   * @returns ISO 8601 형식 문자열
   */
  static formatDateToISO(date: Date): string {
    return date.toISOString().split('.')[0] + 'Z';
  }

  /**
   * 특정 날짜에 대한 offsetMinutes를 계산합니다
   * @param targetDate 목표 날짜
   * @returns offsetMinutes 값
   */
  static calculateOffsetMinutes(targetDate: Date): number {
    const now = new Date();
    const diffMs = targetDate.getTime() - now.getTime();
    return Math.round(diffMs / (1000 * 60)); // 분 단위로 변환
  }
} 