// 항공편 관련 타입 정의

export interface FlightSchedule {
  id: string;
  flightNumber: string;
  airline: string;
  airlineCode: string;
  departureAirport: string;
  departureIata: string;
  arrivalAirport: string;
  arrivalIata: string;
  departureTime: string;
  arrivalTime: string;
  departureDate: string;
  arrivalDate: string;
  aircraftType?: string;
  status: 'Scheduled' | 'Delayed' | 'Cancelled' | 'Diverted';
  callSign?: string;
  isCargo?: boolean;
  codeshareStatus?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FlightCollectionRequest {
  id: string;
  departureAirport: string;
  departureIata: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  totalFlights: number;
  collectedFlights: number;
  createdAt: Date;
  updatedAt: Date;
}

// 새로운 항공 API 요청 파라미터
export interface NewFlightApiRequest {
  departureIata: string;
  date: string;
  timeSlot: '00-12' | '12-00'; // 00시~12시 또는 12시~00시
}

// 새로운 항공 API 응답 구조 (공식 문서 기반)
export interface ActualFlightApiResponse {
  departures?: ActualFlightData[];
  arrivals?: ActualFlightData[];
}

export interface ActualFlightData {
  departure?: {
    airport: {
      icao: string;
      iata: string;
      localCode?: string;
      name: string;
      shortName?: string;
      municipalityName?: string;
      location?: {
        lat: number;
        lon: number;
      };
      countryCode?: string;
      timeZone?: string;
    };
    scheduledTime: {
      utc: string;
      local: string;
    };
    revisedTime?: {
      utc: string;
      local: string;
    };
    predictedTime?: {
      utc: string;
      local: string;
    };
    runwayTime?: {
      utc: string;
      local: string;
    };
    terminal?: string;
    checkInDesk?: string;
    gate?: string;
    baggageBelt?: string;
    runway?: string;
    quality: string[];
  };
  arrival?: {
    airport: {
      icao: string;
      iata: string;
      localCode?: string;
      name: string;
      shortName?: string;
      municipalityName?: string;
      location?: {
        lat: number;
        lon: number;
      };
      countryCode?: string;
      timeZone?: string;
    };
    scheduledTime: {
      utc: string;
      local: string;
    };
    revisedTime?: {
      utc: string;
      local: string;
    };
    predictedTime?: {
      utc: string;
      local: string;
    };
    runwayTime?: {
      utc: string;
      local: string;
    };
    terminal?: string;
    checkInDesk?: string;
    gate?: string;
    baggageBelt?: string;
    runway?: string;
    quality: string[];
  };
  number: string;
  callSign?: string;
  status: string;
  codeshareStatus?: string;
  isCargo: boolean;
  aircraft?: {
    reg?: string;
    modeS?: string;
    model?: string;
    image?: {
      url?: string;
      webUrl?: string;
      author?: string;
      title?: string;
      description?: string;
      license?: string;
      htmlAttributions?: string[];
    };
  };
  airline?: {
    name: string;
    iata?: string;
    icao?: string;
  };
  location?: {
    pressureAltitude?: {
      meter?: number;
      km?: number;
      mile?: number;
      nm?: number;
      feet?: number;
    };
    altitude?: {
      meter?: number;
      km?: number;
      mile?: number;
      nm?: number;
      feet?: number;
    };
    pressure?: {
      hPa?: number;
      inHg?: number;
      mmHg?: number;
    };
    groundSpeed?: {
      kt?: number;
      kmPerHour?: number;
      miPerHour?: number;
      meterPerSecond?: number;
    };
    trueTrack?: {
      deg?: number;
      rad?: number;
    };
    reportedAtUtc?: string;
    lat?: number;
    lon?: number;
  };
}

export interface AeroDataBoxFlight {
  flight: {
    iata: string;
    icao?: string;
    number: string;
  };
  departure: {
    iata: string;
    icao?: string;
    airport: string;
    scheduledTime: string;
    terminal?: string;
    gate?: string;
  };
  arrival: {
    iata: string;
    icao?: string;
    airport: string;
    scheduledTime: string;
    terminal?: string;
    gate?: string;
  };
  airline: {
    iata: string;
    icao?: string;
    name: string;
  };
  aircraft?: {
    model: string;
    registration?: string;
  };
  status: string;
}

export interface AeroDataBoxResponse {
  flights: AeroDataBoxFlight[];
  meta: {
    count: number;
    links: {
      next?: string;
      prev?: string;
    };
  };
}

// 필리핀 주요 공항 목록
export const PHILIPPINE_AIRPORTS = {
  CEB: 'Mactan-Cebu International Airport',
  CRK: 'Clark International Airport',
  MNL: 'Ninoy Aquino International Airport',
  TAG: 'Tagbilaran Airport',
  KLO: 'Kalibo International Airport',
  DVO: 'Francisco Bangoy International Airport',
  ILO: 'Iloilo International Airport',
  BCD: 'Bacolod-Silay International Airport',
  PPS: 'Puerto Princesa International Airport',
  CGY: 'Laguindingan Airport',
  ZAM: 'Zamboanga International Airport',
  TAC: 'Daniel Z. Romualdez Airport',
} as const;

export type PhilippineAirportCode = keyof typeof PHILIPPINE_AIRPORTS;

// 주요 출발 공항 목록
export const DEPARTURE_AIRPORTS = {
  ICN: 'Incheon International Airport',
  PUS: 'Gimhae International Airport',
  GMP: 'Gimpo International Airport',
  CJU: 'Jeju International Airport',
  CEB: 'Mactan-Cebu International Airport',
  MNL: 'Ninoy Aquino International Airport',
  CRK: 'Clark International Airport',
  TAG: 'Tagbilaran Airport',
  KLO: 'Kalibo International Airport',
  DVO: 'Francisco Bangoy International Airport',
  ILO: 'Iloilo International Airport',
  BCD: 'Bacolod-Silay International Airport',
  PPS: 'Puerto Princesa International Airport',
  CGY: 'Laguindingan Airport',
  ZAM: 'Zamboanga International Airport',
  TAC: 'Daniel Z. Romualdez Airport',
} as const;

export type DepartureAirportCode = keyof typeof DEPARTURE_AIRPORTS; 