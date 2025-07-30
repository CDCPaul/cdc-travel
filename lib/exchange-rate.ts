import { db } from './firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { ExchangeRate, ExchangeRateDisplay, ExchangeRateAPIResponse } from '@/types/exchange-rate';

export class ExchangeRateService {
  private static readonly API_URL = process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_URL;
  private static readonly API_KEY = process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY;

  /**
   * 오늘 날짜의 환율 데이터를 가져옵니다.
   * DB에 저장된 데이터가 있으면 사용하고, 없으면 API 호출 후 저장합니다.
   * 필리핀 시간 기준으로 작동합니다.
   */
  static async getTodayExchangeRate(): Promise<ExchangeRateDisplay> {
    // 필리핀 시간 기준으로 오늘 날짜 계산
    const phTime = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Manila"}));
    const today = phTime.toISOString().split('T')[0]; // YYYY-MM-DD
    
    try {
      // 1. DB에서 오늘 날짜의 환율 데이터 조회
      const savedRate = await this.getExchangeRateFromDB(today);
      
      if (savedRate) {
        console.log('✅ DB에서 환율 데이터 로드:', today);
        return this.convertToDisplayFormat(savedRate);
      }
      
      // 2. DB에 없으면 API 호출
      console.log('🔄 API에서 환율 데이터 가져오기:', today);
      const apiRate = await this.fetchExchangeRateFromAPI();
      
      // 3. DB에 저장
      await this.saveExchangeRateToDB(today, apiRate);
      console.log('💾 환율 데이터 DB 저장 완료:', today);
      
      return this.convertToDisplayFormat(apiRate);
      
    } catch (error) {
      console.error('환율 데이터 가져오기 실패:', error);
      // 에러 시 기본값 반환
      return {
        USD_KRW: 1390.51,
        USD_PHP: 57.22,
        KRW_PHP: 24.30,
        lastUpdated: '오류 발생'
      };
    }
  }

  /**
   * API에서 환율 데이터를 가져옵니다.
   */
  private static async fetchExchangeRateFromAPI(): Promise<ExchangeRate> {
    if (!this.API_URL || !this.API_KEY) {
      throw new Error('환율 API 설정이 없습니다.');
    }

    const url = `${this.API_URL}?access_key=${this.API_KEY}&source=USD&currencies=PHP,KRW`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    const data: ExchangeRateAPIResponse = await response.json();
    
    if (!data.success) {
      throw new Error('API 응답이 성공하지 않았습니다.');
    }

    // 필리핀 시간 기준으로 오늘 날짜 계산
    const phTime = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Manila"}));
    const today = phTime.toISOString().split('T')[0];
    
    // KRWPHP 계산 (USDKRW / USDPHP)
    const krwphp = data.quotes.USDKRW / data.quotes.USDPHP;
    
    return {
      date: today,
      USDPHP: data.quotes.USDPHP,
      USDKRW: data.quotes.USDKRW,
      KRWPHP: krwphp,
      timestamp: data.timestamp,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * DB에서 특정 날짜의 환율 데이터를 가져옵니다.
   */
  private static async getExchangeRateFromDB(date: string): Promise<ExchangeRate | null> {
    try {
      const q = query(
        collection(db, 'exchangeRates'),
        where('date', '==', date)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        
        return {
          id: doc.id,
          date: data.date,
          USDPHP: data.USDPHP,
          USDKRW: data.USDKRW,
          KRWPHP: data.KRWPHP,
          timestamp: data.timestamp,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        };
      }
      
      return null;
    } catch (error) {
      console.error('DB에서 환율 데이터 조회 실패:', error);
      return null;
    }
  }

  /**
   * 환율 데이터를 DB에 저장합니다.
   */
  private static async saveExchangeRateToDB(date: string, rate: ExchangeRate): Promise<void> {
    try {
      // 기존 데이터가 있는지 확인
      const existingRate = await this.getExchangeRateFromDB(date);
      
      if (existingRate) {
        // 기존 데이터 업데이트
        const docRef = doc(db, 'exchangeRates', existingRate.id!);
        await updateDoc(docRef, {
          USDPHP: rate.USDPHP,
          USDKRW: rate.USDKRW,
          KRWPHP: rate.KRWPHP,
          timestamp: rate.timestamp,
          updatedAt: new Date()
        });
      } else {
        // 새 데이터 저장
        await addDoc(collection(db, 'exchangeRates'), {
          date: rate.date,
          USDPHP: rate.USDPHP,
          USDKRW: rate.USDKRW,
          KRWPHP: rate.KRWPHP,
          timestamp: rate.timestamp,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('환율 데이터 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 환율 데이터를 표시용 형식으로 변환합니다.
   */
  private static convertToDisplayFormat(rate: ExchangeRate): ExchangeRateDisplay {
    const date = new Date(rate.timestamp * 1000);
    return {
      USD_KRW: rate.USDKRW, // USD → KRW
      USD_PHP: rate.USDPHP,  // USD → PHP
      KRW_PHP: rate.KRWPHP, // KRW → PHP
      lastUpdated: `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    };
  }

  /**
   * 수동으로 환율을 업데이트합니다 (관리자용).
   * 필리핀 시간 기준으로 작동합니다.
   */
  static async updateExchangeRate(): Promise<ExchangeRateDisplay> {
    // 필리핀 시간 기준으로 오늘 날짜 계산
    const phTime = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Manila"}));
    const today = phTime.toISOString().split('T')[0];
    const apiRate = await this.fetchExchangeRateFromAPI();
    await this.saveExchangeRateToDB(today, apiRate);
    return this.convertToDisplayFormat(apiRate);
  }
} 