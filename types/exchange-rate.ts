export interface ExchangeRate {
  id?: string;
  date: string; // YYYY-MM-DD 형식
  USDPHP: number;
  USDKRW: number;
  KRWPHP: number; // 계산된 값
  timestamp: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExchangeRateDisplay {
  USD_KRW: number;
  USD_PHP: number;
  KRW_PHP: number;
  lastUpdated: string;
}

export interface ExchangeRateAPIResponse {
  success: boolean;
  terms: string;
  privacy: string;
  timestamp: number;
  source: string;
  quotes: {
    USDPHP: number;
    USDKRW: number;
  };
} 