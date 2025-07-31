import { getAdminDb } from './firebase-admin';
import { ActualFlightApiResponse, ActualFlightData, FlightSchedule, PHILIPPINE_AIRPORTS, NewFlightApiRequest } from '@/types/flight';

// LOCAL 시간 문자열을 Date 객체로 파싱하는 함수
const parseLocalTime = (localTimeStr: string): Date => {
  if (!localTimeStr) {
    return new Date();
  }
  
  // "2025-08-01 06:55+09:00" 형태에서 시간대 정보 제거
  // 순수한 로컬 시간만 추출: "2025-08-01 06:55"
  const cleanTimeStr = localTimeStr.replace(/\s*[+-]\d{2}:\d{2}$/, '');
  
  // "2025-08-01 06:55" 형태를 파싱
  const match = cleanTimeStr.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/);
  
  if (match) {
    const [, year, month, day, hour, minute, second = '00'] = match;
    
    // 로컬 시간으로 Date 객체 생성 (시간대 정보 없이)
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
    return date;
  }
  
  // 파싱 실패 시 원본 문자열로 시도 (시간대 정보 제거 후)
  return new Date(cleanTimeStr);
};

export class NewFlightService {
  private static db = getAdminDb();
  
  // 메모리 캐시 (5분 유효)
  private static cache = new Map<string, { data: FlightSchedule[], timestamp: number }>();
  private static CACHE_DURATION = 5 * 60 * 1000; // 5분

  /**
   * 캐시 키 생성
   */
  private static getCacheKey(route: string, year: number, month: number): string {
    return `flights_${route}_${year}_${month}`;
  }

  /**
   * 캐시에서 데이터 조회
   */
  private static getFromCache(key: string): FlightSchedule[] | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`📦 캐시에서 데이터 조회: ${key}`);
      return cached.data;
    }
    return null;
  }

  /**
   * 캐시에 데이터 저장
   */
  private static setCache(key: string, data: FlightSchedule[]): void {
    this.cache.set(key, { data, timestamp: Date.now() });
    console.log(`💾 캐시에 데이터 저장: ${key}, ${data.length}개`);
  }

  /**
   * 새로운 항공 API를 호출하고 응답을 처리합니다
   * @param request API 요청 파라미터
   * @returns 저장된 항공편 수
   */
  static async callApiAndSaveFlights(request: NewFlightApiRequest): Promise<number> {
    try {
      console.log(`🔄 새로운 항공 API 호출 시작: ${request.departureIata}, ${request.date}, ${request.timeSlot}`);

      // 시간대에 따른 시작/종료 시간 설정
      const startTime = request.timeSlot === '00-12' ? '00:00' : '12:00';
      const endTime = request.timeSlot === '00-12' ? '12:00' : '23:59';

      // AeroDataBox API 호출
      const baseUrl = process.env.NEW_FLIGHT_API_URL || 'https://aerodatabox.p.rapidapi.com';
      const apiUrl = `${baseUrl}/flights/airports/iata/${request.departureIata}/${request.date}T${startTime}/${request.date}T${endTime}?withLeg=true&direction=Both&withCancelled=true&withCodeshared=true&withCargo=true&withPrivate=true&withLocation=false`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'aerodatabox.p.rapidapi.com',
          'x-rapidapi-key': process.env.NEW_FLIGHT_API_KEY || '',
        },
      });

      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
      }

      const apiResponse: ActualFlightApiResponse = await response.json();
      console.log(`✅ API 응답 수신: ${apiResponse.departures?.length || 0}개 출발, ${apiResponse.arrivals?.length || 0}개 도착`);
      console.log(`🔍 API 응답 구조 확인:`, {
        hasDepartures: !!apiResponse.departures,
        hasArrivals: !!apiResponse.arrivals,
        departuresLength: apiResponse.departures?.length || 0,
        arrivalsLength: apiResponse.arrivals?.length || 0,
        sampleDeparture: JSON.stringify(apiResponse.departures?.[0], null, 2),
        sampleArrival: JSON.stringify(apiResponse.arrivals?.[0], null, 2)
      });

      // 응답 데이터 파싱 및 저장
      return await this.parseAndSaveFlights(apiResponse, request.departureIata, request.date);

    } catch (error) {
      console.error('❌ 새로운 항공 API 호출 실패:', error);
      throw error;
    }
  }

  /**
   * 실제 API 응답을 파싱하고 DB에 저장합니다
   * @param response API 응답 데이터
   * @param departureIata 출발 공항 코드
   * @param date 날짜 (YYYY-MM-DD 형식)
   * @returns 저장된 항공편 수
   */
  static async parseAndSaveFlights(
    response: ActualFlightApiResponse,
    departureIata: string,
    date: string
  ): Promise<number> {
    let savedCount = 0;
    const batch = this.db.batch(); // 배치 처리 사용
    const maxBatchSize = 500; // Firestore 배치 제한
    let batchCount = 0;

    try {
      // 출발 항공편 처리 (필리핀 도착 항공편만 필터링)
      if (response.departures && Array.isArray(response.departures)) {
        const philippineDepartures = this.filterPhilippineFlights(response.departures, 'departure');
        console.log(`🔍 필리핀 도착 출발 항공편 필터링: ${philippineDepartures.length}개 (전체: ${response.departures.length}개)`);

        for (const flight of philippineDepartures) {
          try {
            const flightSchedule = this.convertToFlightSchedule(flight, date, 'departure', departureIata);
            const saved = await this.addToBatch(batch, flightSchedule, batchCount, maxBatchSize);
            if (saved) {
              savedCount++;
              batchCount++;
            }
          } catch (error) {
            console.error(`❌ 출발 항공편 변환 실패: ${flight.number}`, error);
          }
        }
      }

      // 도착 항공편 처리 (필리핀 출발 항공편만 필터링)
      if (response.arrivals && Array.isArray(response.arrivals)) {
        const philippineArrivals = this.filterPhilippineFlights(response.arrivals, 'arrival');
        console.log(`🔍 필리핀 출발 도착 항공편 필터링: ${philippineArrivals.length}개 (전체: ${response.arrivals.length}개)`);

        for (const flight of philippineArrivals) {
          try {
            const flightSchedule = this.convertToFlightSchedule(flight, date, 'arrival', departureIata);
            const saved = await this.addToBatch(batch, flightSchedule, batchCount, maxBatchSize);
            if (saved) {
              savedCount++;
              batchCount++;
            }
          } catch (error) {
            console.error(`❌ 도착 항공편 변환 실패: ${flight.number}`, error);
          }
        }
      }

      // 마지막 배치 커밋
      if (batchCount > 0) {
        await batch.commit();
        console.log(`✅ 배치 커밋 완료: ${batchCount}개 항공편`);
      }

      console.log(`✅ 항공편 저장 완료: ${savedCount}개 (${departureIata}, ${date})`);
      return savedCount;

    } catch (error) {
      console.error('❌ 항공편 파싱 및 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 필리핀 관련 항공편만 필터링합니다
   * @param flights 모든 항공편 목록
   * @param type 'departure' 또는 'arrival'
   * @returns 필리핀 관련 항공편만 필터링된 목록
   */
  private static filterPhilippineFlights(flights: ActualFlightData[], type: 'departure' | 'arrival'): ActualFlightData[] {
    const philippineAirportCodes = Object.keys(PHILIPPINE_AIRPORTS);
    
    return flights.filter(flight => {
      if (type === 'departure') {
        // 출발 항공편: 도착지가 필리핀인 항공편만
        const arrivalIata = flight.arrival?.airport?.iata;
        return arrivalIata && philippineAirportCodes.includes(arrivalIata);
      } else {
        // 도착 항공편: 출발지가 필리핀인 항공편만
        const departureIata = flight.departure?.airport?.iata;
        return departureIata && philippineAirportCodes.includes(departureIata);
      }
    });
  }

  /**
   * 실제 API 응답을 FlightSchedule 형식으로 변환합니다
   * @param flight 실제 API 항공편 데이터
   * @param date 날짜
   * @param type 'departure' 또는 'arrival'
   * @param requestedDepartureIata 요청한 출발 공항 코드
   * @returns FlightSchedule 형식의 데이터
   */
  private static convertToFlightSchedule(flight: ActualFlightData, date: string, type: 'departure' | 'arrival', requestedDepartureIata: string): FlightSchedule {
    // 항공편 번호에서 항공사 코드 추출
    const flightNumberParts = flight.number.split(' ');
    const airlineCode = flightNumberParts[0] || '';
    const flightNumber = flightNumberParts.slice(1).join(' ') || flight.number;

    // 시간 정보 파싱 (LOCAL 시간 사용)
    let departureTime: Date;
    let arrivalTime: Date;
    let departureAirport: string;
    let arrivalAirport: string;
    let departureIata: string;
    let arrivalIata: string;

    if (type === 'departure') {
      // 출발 항공편 (ICN에서 출발해서 필리핀으로)
      // 출발지: ICN (고정)
      departureIata = requestedDepartureIata;
      departureAirport = 'Incheon International Airport';
      
      // 도착지: API 응답에서 가져옴
      arrivalIata = flight.arrival?.airport?.iata || '';
      arrivalAirport = flight.arrival?.airport?.name || '';
      
      // 시간 정보 (LOCAL 시간 사용)
      departureTime = parseLocalTime(flight.departure?.scheduledTime?.local || '');
      arrivalTime = parseLocalTime(flight.arrival?.scheduledTime?.local || '');
      
    } else {
      // 도착 항공편 (필리핀에서 출발해서 ICN으로)
      // 출발지: API 응답에서 가져옴
      departureIata = flight.departure?.airport?.iata || '';
      departureAirport = flight.departure?.airport?.name || '';
      
      // 도착지: ICN (고정)
      arrivalIata = requestedDepartureIata;
      arrivalAirport = 'Incheon International Airport';
      
      // 시간 정보 (LOCAL 시간 사용)
      departureTime = parseLocalTime(flight.departure?.scheduledTime?.local || '');
      arrivalTime = parseLocalTime(flight.arrival?.scheduledTime?.local || '');
    }

    // 디버깅: 공항 코드 확인
    console.log(`🔍 항공편 ${flight.number} (${type}):`, {
      departureIata,
      arrivalIata,
      requestedDepartureIata,
      flightDepartureIata: flight.departure?.airport?.iata,
      flightArrivalIata: flight.arrival?.airport?.iata,
      departureAirport: flight.departure?.airport?.name,
      arrivalAirport: flight.arrival?.airport?.name,
      departureTimeLocal: flight.departure?.scheduledTime?.local,
      arrivalTimeLocal: flight.arrival?.scheduledTime?.local,
      parsedDepartureTime: `${departureTime.getFullYear()}-${String(departureTime.getMonth() + 1).padStart(2, '0')}-${String(departureTime.getDate()).padStart(2, '0')}T${String(departureTime.getHours()).padStart(2, '0')}:${String(departureTime.getMinutes()).padStart(2, '0')}:${String(departureTime.getSeconds()).padStart(2, '0')}`,
      parsedArrivalTime: `${arrivalTime.getFullYear()}-${String(arrivalTime.getMonth() + 1).padStart(2, '0')}-${String(arrivalTime.getDate()).padStart(2, '0')}T${String(arrivalTime.getHours()).padStart(2, '0')}:${String(arrivalTime.getMinutes()).padStart(2, '0')}:${String(arrivalTime.getSeconds()).padStart(2, '0')}`
    });

    return {
      id: `${airlineCode}${flightNumber}_${departureTime.getFullYear()}${String(departureTime.getMonth() + 1).padStart(2, '0')}${String(departureTime.getDate()).padStart(2, '0')}${String(departureTime.getHours()).padStart(2, '0')}${String(departureTime.getMinutes()).padStart(2, '0')}`,
      flightNumber: flightNumber,
      airline: flight.airline?.name || 'Unknown',
      airlineCode: airlineCode,
      departureAirport: departureAirport,
      departureIata: departureIata,
      arrivalAirport: arrivalAirport,
      arrivalIata: arrivalIata,
      departureTime: `${departureTime.getFullYear()}-${String(departureTime.getMonth() + 1).padStart(2, '0')}-${String(departureTime.getDate()).padStart(2, '0')}T${String(departureTime.getHours()).padStart(2, '0')}:${String(departureTime.getMinutes()).padStart(2, '0')}:${String(departureTime.getSeconds()).padStart(2, '0')}`,
      arrivalTime: `${arrivalTime.getFullYear()}-${String(arrivalTime.getMonth() + 1).padStart(2, '0')}-${String(arrivalTime.getDate()).padStart(2, '0')}T${String(arrivalTime.getHours()).padStart(2, '0')}:${String(arrivalTime.getMinutes()).padStart(2, '0')}:${String(arrivalTime.getSeconds()).padStart(2, '0')}`,
      departureDate: `${departureTime.getFullYear()}-${String(departureTime.getMonth() + 1).padStart(2, '0')}-${String(departureTime.getDate()).padStart(2, '0')}`,
      arrivalDate: `${arrivalTime.getFullYear()}-${String(arrivalTime.getMonth() + 1).padStart(2, '0')}-${String(arrivalTime.getDate()).padStart(2, '0')}`,
      aircraftType: flight.aircraft?.model,
      status: this.mapFlightStatus(flight.status),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * 항공편 상태를 매핑합니다
   * @param status 원본 상태 문자열
   * @returns 매핑된 상태
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
   * 배치에 항공편을 추가합니다
   * @param batch Firestore 배치
   * @param flightSchedule 저장할 항공편
   * @param batchCount 현재 배치 카운트
   * @param maxBatchSize 최대 배치 크기
   * @returns 저장 성공 여부
   */
  private static async addToBatch(
    batch: FirebaseFirestore.WriteBatch,
    flightSchedule: FlightSchedule,
    batchCount: number,
    maxBatchSize: number
  ): Promise<boolean> {
    try {
      // 유효한 출발/도착 공항 코드 확인
      if (!flightSchedule.departureIata || !flightSchedule.arrivalIata) {
        console.log(`⚠️ 유효하지 않은 공항 코드: ${flightSchedule.departureIata}-${flightSchedule.arrivalIata}`);
        return false;
      }

      // 루트별, 날짜별 폴더링된 경로 생성 (짝수 개의 컴포넌트를 위해 flights 컬렉션 추가)
      const routePath = `${flightSchedule.departureIata}-${flightSchedule.arrivalIata}`;
      
      // 도착편의 경우 출발 날짜를 기준으로 저장 (도착 날짜가 아닌 출발 날짜)
      // 예: MNL→ICN 항공편이 2025-07-31 출발, 2025-08-01 도착이면 2025-07-31에 저장
      const datePath = flightSchedule.departureDate;
      
      const docPath = `flight_schedules/routes/${routePath}/${datePath}/flights/${flightSchedule.id}`;
      
      // 중복 확인
      const existingDoc = await this.db.doc(docPath).get();

      if (existingDoc.exists) {
        console.log(`⚠️ 항공편 이미 존재: ${flightSchedule.flightNumber} (${routePath}/${datePath})`);
        return false;
      }

      // 배치에 추가
      const docRef = this.db.doc(docPath);
      batch.set(docRef, flightSchedule);

      // 배치 크기 제한에 도달하면 커밋
      if (batchCount >= maxBatchSize) {
        await batch.commit();
        console.log(`✅ 배치 커밋: ${maxBatchSize}개 항공편`);
        return true;
      }

      return true;
    } catch (error) {
      console.error('❌ 배치 추가 실패:', error);
      return false;
    }
  }

  /**
   * 특정 경로와 날짜의 항공편을 조회합니다
   * @param route 경로 (예: ICN-CEB)
   * @param date 날짜 (YYYY-MM-DD 형식) - 출발 날짜 기준
   * @returns 항공편 목록
   */
  static async getFlightsByRouteAndDate(route: string, date: string): Promise<FlightSchedule[]> {
    try {
      const docPath = `flight_schedules/routes/${route}/${date}/flights`;
      
      const snapshot = await this.db
        .collection(docPath)
        .get();

      const flights: FlightSchedule[] = [];

             snapshot.forEach(doc => {
         const data = doc.data() as FlightSchedule;
         flights.push({
           ...data,
           createdAt: (data.createdAt as unknown as FirebaseFirestore.Timestamp).toDate(),
           updatedAt: (data.updatedAt as unknown as FirebaseFirestore.Timestamp).toDate(),
         });
       });

      return flights.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
    } catch (error) {
      console.error('❌ 항공편 조회 실패:', error);
      return [];
    }
  }

  /**
   * 특정 항공사의 항공편을 조회합니다
   * @param airline 항공사 코드 (예: KE, OZ)
   * @param date 날짜 (YYYY-MM-DD 형식) - 출발 날짜 기준
   * @returns 항공편 목록
   */
  static async getFlightsByAirline(airline: string, date: string): Promise<FlightSchedule[]> {
    try {
      // 모든 루트에서 해당 날짜의 항공편을 조회
      const routesSnapshot = await this.db
        .collection('flight_schedules/routes')
        .get();

      const flights: FlightSchedule[] = [];

      for (const routeDoc of routesSnapshot.docs) {
        try {
          const dateSnapshot = await this.db
            .collection(`flight_schedules/routes/${routeDoc.id}/${date}/flights`)
            .get();

                     dateSnapshot.forEach((doc) => {
             const data = doc.data() as FlightSchedule;
             if (data.airlineCode === airline) {
               flights.push({
                 ...data,
                 createdAt: (data.createdAt as unknown as FirebaseFirestore.Timestamp).toDate(),
                 updatedAt: (data.updatedAt as unknown as FirebaseFirestore.Timestamp).toDate(),
               });
             }
           });
        } catch {
          // 특정 날짜 컬렉션이 없을 수 있음 (무시)
          console.log(`날짜 컬렉션 없음: ${routeDoc.id}/${date}`);
        }
      }

      return flights.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
    } catch (error) {
      console.error('❌ 항공편 조회 실패:', error);
      return [];
    }
  }

  /**
   * 특정 날짜의 모든 항공편을 조회합니다
   * @param date 날짜 (YYYY-MM-DD 형식) - 출발 날짜 기준
   * @returns 항공편 목록
   */
  static async getFlightsByDate(date: string): Promise<FlightSchedule[]> {
    try {
      // 모든 루트에서 해당 날짜의 항공편을 조회
      const routesSnapshot = await this.db
        .collection('flight_schedules/routes')
        .get();

      const flights: FlightSchedule[] = [];

      for (const routeDoc of routesSnapshot.docs) {
        try {
          const dateSnapshot = await this.db
            .collection(`flight_schedules/routes/${routeDoc.id}/${date}/flights`)
            .get();

                     dateSnapshot.forEach((doc) => {
             const data = doc.data() as FlightSchedule;
             flights.push({
               ...data,
               createdAt: (data.createdAt as unknown as FirebaseFirestore.Timestamp).toDate(),
               updatedAt: (data.updatedAt as unknown as FirebaseFirestore.Timestamp).toDate(),
             });
           });
        } catch {
          // 특정 날짜 컬렉션이 없을 수 있음 (무시)
          console.log(`날짜 컬렉션 없음: ${routeDoc.id}/${date}`);
        }
      }

      return flights.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
    } catch (error) {
      console.error('❌ 항공편 조회 실패:', error);
      return [];
    }
  }

  /**
   * 특정 루트의 월별 항공편을 한 번에 조회합니다 (최적화된 버전)
   * @param route 루트 (예: CEB-ICN)
   * @param year 년도
   * @param month 월 (1-12)
   * @returns 항공편 목록
   */
  static async getFlightsByRouteAndMonth(route: string, year: number, month: number): Promise<FlightSchedule[]> {
    try {
      console.log(`🔄 월별 항공편 조회 시작: ${route}, ${year}-${month}`);
      
      // 캐시 확인
      const cacheKey = this.getCacheKey(route, year, month);
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      const flights: FlightSchedule[] = [];
      const daysInMonth = new Date(year, month, 0).getDate();
      
      // 병렬 처리로 모든 날짜를 동시에 조회
      const promises = [];
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const promise = this.getFlightsByRouteAndDate(route, dateStr);
        promises.push(promise);
      }
      
      // 모든 날짜의 데이터를 병렬로 조회
      const results = await Promise.all(promises);
      
      // 결과를 하나로 합치고 정렬
      results.forEach(dayFlights => {
        flights.push(...dayFlights);
      });
      
      const sortedFlights = flights.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
      
      // 캐시에 저장
      this.setCache(cacheKey, sortedFlights);
      
      console.log(`✅ 월별 항공편 조회 완료: ${route}, ${year}-${month}, 총 ${sortedFlights.length}개`);
      
      return sortedFlights;
    } catch (error) {
      console.error('❌ 월별 항공편 조회 실패:', error);
      return [];
    }
  }
} 