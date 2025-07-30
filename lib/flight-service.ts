import { getAdminDb } from './firebase-admin';
import { FlightSchedule, FlightCollectionRequest } from '@/types/flight';
import { AeroDataBoxService } from './aerodatabox-service';
import { Timestamp } from 'firebase-admin/firestore';

export class FlightService {
  private static db = getAdminDb();

  /**
   * 항공편 수집 요청을 생성합니다
   * @param departureAirport 출발 공항명
   * @param departureIata 출발 공항 IATA 코드
   * @param startDate 시작 날짜
   * @param endDate 종료 날짜
   * @returns 생성된 요청 ID
   */
  static async createCollectionRequest(
    departureAirport: string,
    departureIata: string,
    startDate: string,
    endDate: string
  ): Promise<string> {
    const request: Omit<FlightCollectionRequest, 'id'> = {
      departureAirport,
      departureIata,
      startDate,
      endDate,
      status: 'pending',
      totalFlights: 0,
      collectedFlights: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await this.db.collection('flight_collection_requests').add(request);
    return docRef.id;
  }

  /**
   * 항공편 수집 요청 상태를 업데이트합니다
   * @param requestId 요청 ID
   * @param status 새로운 상태
   * @param totalFlights 총 항공편 수
   * @param collectedFlights 수집된 항공편 수
   */
  static async updateCollectionRequest(
    requestId: string,
    status: FlightCollectionRequest['status'],
    totalFlights?: number,
    collectedFlights?: number
  ): Promise<void> {
    const updateData: Partial<FlightCollectionRequest> = {
      status,
      updatedAt: new Date(),
    };

    if (totalFlights !== undefined) {
      updateData.totalFlights = totalFlights;
    }
    if (collectedFlights !== undefined) {
      updateData.collectedFlights = collectedFlights;
    }

    await this.db.collection('flight_collection_requests').doc(requestId).update(updateData);
  }

  /**
   * 항공편을 Firestore에 저장합니다 (중복 방지)
   * @param flightSchedule 저장할 항공편 정보
   * @returns 저장 성공 여부
   */
  static async saveFlightSchedule(flightSchedule: FlightSchedule): Promise<boolean> {
    try {
      // 중복 확인
      const existingDoc = await this.db
        .collection('flight_schedules')
        .doc(flightSchedule.id)
        .get();

      if (existingDoc.exists) {
        console.log(`⚠️ 항공편 이미 존재: ${flightSchedule.flightNumber}`);
        return false;
      }

      // 새 항공편 저장
      await this.db
        .collection('flight_schedules')
        .doc(flightSchedule.id)
        .set(flightSchedule);

      console.log(`✅ 항공편 저장 완료: ${flightSchedule.flightNumber}`);
      return true;
    } catch (error) {
      console.error('❌ 항공편 저장 실패:', error);
      return false;
    }
  }

  /**
   * 특정 날짜의 항공편을 가져옵니다
   * @param date 날짜 (YYYY-MM-DD 형식)
   * @param departureIata 출발 공항 IATA 코드 (선택사항)
   * @returns 해당 날짜의 항공편 목록
   */
  static async getFlightsByDate(date: string, departureIata?: string): Promise<FlightSchedule[]> {
    try {
      let query = this.db.collection('flight_schedules').where('departureDate', '==', date);

      if (departureIata) {
        query = query.where('departureIata', '==', departureIata);
      }

      const snapshot = await query.get();
      const flights: FlightSchedule[] = [];

      snapshot.forEach(doc => {
        const data = doc.data() as FlightSchedule;
        flights.push({
          ...data,
          createdAt: (data.createdAt as unknown as Timestamp).toDate(),
          updatedAt: (data.updatedAt as unknown as Timestamp).toDate(),
        });
      });

      return flights.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
    } catch (error) {
      console.error('❌ 항공편 조회 실패:', error);
      return [];
    }
  }

  /**
   * 특정 월의 항공편을 가져옵니다
   * @param year 년도
   * @param month 월 (1-12)
   * @param departureIata 출발 공항 IATA 코드 (선택사항)
   * @returns 해당 월의 항공편 목록
   */
  static async getFlightsByMonth(year: number, month: number, departureIata?: string): Promise<FlightSchedule[]> {
    try {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

      let query = this.db
        .collection('flight_schedules')
        .where('departureDate', '>=', startDate)
        .where('departureDate', '<=', endDate);

      if (departureIata) {
        query = query.where('departureIata', '==', departureIata);
      }

      const snapshot = await query.get();
      const flights: FlightSchedule[] = [];

      snapshot.forEach(doc => {
        const data = doc.data() as FlightSchedule;
        flights.push({
          ...data,
          createdAt: (data.createdAt as unknown as Timestamp).toDate(),
          updatedAt: (data.updatedAt as unknown as Timestamp).toDate(),
        });
      });

      return flights.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
    } catch (error) {
      console.error('❌ 월별 항공편 조회 실패:', error);
      return [];
    }
  }

  /**
   * AeroDataBox API에서 항공편을 수집하고 Firestore에 저장합니다
   * @param departureIata 출발 공항 IATA 코드
   * @param startDate 시작 날짜
   * @param endDate 종료 날짜
   * @param requestId 수집 요청 ID
   * @returns 수집된 항공편 수
   */
  static async collectAndSaveFlights(
    departureIata: string,
    startDate: Date,
    endDate: Date,
    requestId: string
  ): Promise<number> {
    try {
      console.log(`🔄 항공편 수집 시작: ${departureIata} (${startDate.toISOString()} ~ ${endDate.toISOString()})`);

      // 상태를 진행 중으로 업데이트
      await this.updateCollectionRequest(requestId, 'in_progress');

      // 날짜 범위를 12시간 단위로 분할
      const chunks = AeroDataBoxService.splitDateRangeInto12HourChunks(startDate, endDate);
      let totalCollected = 0;

      for (const chunk of chunks) {
        try {
          console.log(`📅 청크 처리: ${chunk.from.toISOString()} ~ ${chunk.to.toISOString()}`);

          // 각 청크의 중간 시간을 기준으로 offsetMinutes 계산
          const chunkMiddleTime = new Date((chunk.from.getTime() + chunk.to.getTime()) / 2);
          const offsetMinutes = AeroDataBoxService.calculateOffsetMinutes(chunkMiddleTime);
          
          // durationMinutes는 청크의 실제 길이로 계산 (최대 720분 = 12시간)
          const durationMinutes = Math.min(
            Math.round((chunk.to.getTime() - chunk.from.getTime()) / (1000 * 60)),
            720
          );

          console.log(`⏰ API 호출 파라미터: offsetMinutes=${offsetMinutes}, durationMinutes=${durationMinutes}`);

          // AeroDataBox API 호출
          const response = await AeroDataBoxService.getFlights(
            departureIata,
            offsetMinutes,
            durationMinutes
          );

          // 필리핀 도착 항공편만 필터링
          const philippineFlights = AeroDataBoxService.filterPhilippineFlights(response.flights);
          console.log(`✈️ 필리핀 도착 항공편 발견: ${philippineFlights.length}개`);

          // Firestore에 저장
          for (const flight of philippineFlights) {
            const flightSchedule = AeroDataBoxService.convertToFlightSchedule(flight);
            const saved = await this.saveFlightSchedule(flightSchedule);
            if (saved) {
              totalCollected++;
            }
          }

          // 진행 상황 업데이트
          await this.updateCollectionRequest(requestId, 'in_progress', chunks.length, totalCollected);

          // API 호출 간격 조절 (Rate Limit 방지)
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`❌ 청크 처리 실패: ${chunk.from.toISOString()} ~ ${chunk.to.toISOString()}`, error);
        }
      }

      // 완료 상태로 업데이트
      await this.updateCollectionRequest(requestId, 'completed', chunks.length, totalCollected);

      console.log(`✅ 항공편 수집 완료: ${totalCollected}개 저장됨`);
      return totalCollected;

    } catch (error) {
      console.error('❌ 항공편 수집 실패:', error);
      await this.updateCollectionRequest(requestId, 'failed');
      throw error;
    }
  }

  /**
   * 항공편 수집 요청 목록을 가져옵니다
   * @param limit 가져올 개수 (기본값: 50)
   * @returns 수집 요청 목록
   */
  static async getCollectionRequests(limit: number = 50): Promise<FlightCollectionRequest[]> {
    try {
      const snapshot = await this.db
        .collection('flight_collection_requests')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const requests: FlightCollectionRequest[] = [];

      snapshot.forEach(doc => {
        const data = doc.data() as FlightCollectionRequest;
        requests.push({
          ...data,
          createdAt: (data.createdAt as unknown as Timestamp).toDate(),
          updatedAt: (data.updatedAt as unknown as Timestamp).toDate(),
        });
      });

      return requests;
    } catch (error) {
      console.error('❌ 수집 요청 조회 실패:', error);
      return [];
    }
  }
} 