'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/components/LanguageContext';

interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  departureTime: string;
  arrivalTime: string;
  departure: string;
  arrival: string;
  date: string;
  webPrice?: number;
}

interface FlightSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selectedFlights: Flight[]) => void;
  route: string;
  date: string;
}

const FLIGHT_SELECTION_TEXTS = {
  ko: {
    title: "항공편 선택",
    searchPlaceholder: "항공편 검색...",
    noResults: "검색 결과가 없습니다.",
    directInput: "직접 입력",
    selectFlights: "항공편 선택",
    cancel: "취소",
    flightNumber: "항공편 번호",
    airline: "항공사",
    departureTime: "출발 시간",
    arrivalTime: "도착 시간",
    departure: "출발지",
    arrival: "도착지",
    date: "날짜",
    addFlight: "항공편 추가",
    removeFlight: "삭제",
    selectedFlights: "선택된 항공편",
    webPrice: "웹 가격",
    enterWebPrice: "웹 가격 입력",
    save: "저장",
    loading: "항공편 로딩 중...",
    error: "항공편 조회 중 오류가 발생했습니다.",
    noFlightsFound: "해당 날짜와 루트에 항공편이 없습니다.",
    manualInput: "수동 입력",
    flightNumberLabel: "항공편 번호",
    airlineLabel: "항공사",
    departureTimeLabel: "출발 시간",
    arrivalTimeLabel: "도착 시간",
    webPriceLabel: "웹 가격",
  },
  en: {
    title: "Flight Selection",
    searchPlaceholder: "Search flights...",
    noResults: "No results found.",
    directInput: "Direct Input",
    selectFlights: "Select Flights",
    cancel: "Cancel",
    flightNumber: "Flight Number",
    airline: "Airline",
    departureTime: "Departure Time",
    arrivalTime: "Arrival Time",
    departure: "Departure",
    arrival: "Arrival",
    date: "Date",
    addFlight: "Add Flight",
    removeFlight: "Remove",
    selectedFlights: "Selected Flights",
    webPrice: "Web Price",
    enterWebPrice: "Enter Web Price",
    save: "Save",
    loading: "Loading flights...",
    error: "Error loading flights.",
    noFlightsFound: "No flights found for this date and route.",
    manualInput: "Manual Input",
    flightNumberLabel: "Flight Number",
    airlineLabel: "Airline",
    departureTimeLabel: "Departure Time",
    arrivalTimeLabel: "Arrival Time",
    webPriceLabel: "Web Price",
  }
};

export default function FlightSelectionModal({ isOpen, onClose, onSelect, route, date }: FlightSelectionModalProps) {
  const { lang } = useLanguage();
  const texts = FLIGHT_SELECTION_TEXTS[lang];
  
  const [flights, setFlights] = useState<Flight[]>([]);
  const [filteredFlights, setFilteredFlights] = useState<Flight[]>([]);
  const [selectedFlights, setSelectedFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualFlight, setManualFlight] = useState({
    flightNumber: '',
    airline: '',
    departureTime: '',
    arrivalTime: '',
    webPrice: ''
  });

  // 항공편 조회
  const fetchFlights = useCallback(async () => {
    if (!route || !date) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/flights/schedules?route=${route}&date=${date}`);
      const data = await response.json();
      
      if (response.ok && data.flights) {
        setFlights(data.flights);
        setFilteredFlights(data.flights);
      } else {
        setError(data.error || texts.error);
      }
    } catch (error) {
      console.error('항공편 조회 실패:', error);
      setError(texts.error);
    } finally {
      setLoading(false);
    }
  }, [route, date, texts.error]);

  // 검색 필터링
  useEffect(() => {
    if (!searchTerm) {
      setFilteredFlights(flights);
      return;
    }
    
    const filtered = flights.filter(flight =>
      flight.flightNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flight.airline.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFlights(filtered);
  }, [searchTerm, flights]);

  // 모달이 열릴 때 항공편 조회
  useEffect(() => {
    if (isOpen && route && date) {
      fetchFlights();
    }
  }, [isOpen, route, date, fetchFlights]);

  // 항공편 선택/해제
  const toggleFlightSelection = (flight: Flight) => {
    setSelectedFlights(prev => {
      const isSelected = prev.some(f => f.id === flight.id);
      if (isSelected) {
        return prev.filter(f => f.id !== flight.id);
      } else {
        return [...prev, flight];
      }
    });
  };

  // 수동 입력 항공편 추가
  const addManualFlight = () => {
    if (!manualFlight.flightNumber || !manualFlight.airline) {
      alert('항공편 번호와 항공사를 입력해주세요.');
      return;
    }

    const newFlight: Flight = {
      id: `manual-${Date.now()}`,
      flightNumber: manualFlight.flightNumber,
      airline: manualFlight.airline,
      departureTime: manualFlight.departureTime,
      arrivalTime: manualFlight.arrivalTime,
      departure: route.split('-')[0],
      arrival: route.split('-')[1],
      date: date,
      webPrice: manualFlight.webPrice ? parseFloat(manualFlight.webPrice) : undefined
    };

    setSelectedFlights(prev => [...prev, newFlight]);
    setManualFlight({
      flightNumber: '',
      airline: '',
      departureTime: '',
      arrivalTime: '',
      webPrice: ''
    });
    setShowManualInput(false);
  };

  // 선택된 항공편 제거
  const removeSelectedFlight = (flightId: string) => {
    setSelectedFlights(prev => prev.filter(f => f.id !== flightId));
  };

  // 웹 가격 업데이트
  const updateWebPrice = (flightId: string, price: string) => {
    setSelectedFlights(prev => prev.map(f => 
      f.id === flightId ? { ...f, webPrice: price ? parseFloat(price) : undefined } : f
    ));
  };

  // 저장
  const handleSave = () => {
    onSelect(selectedFlights);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">{texts.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex h-[calc(90vh-120px)]">
            {/* 왼쪽: 항공편 목록 */}
            <div className="flex-1 p-6 border-r">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {route} - {date}
                  </h3>
                  <button
                    onClick={() => setShowManualInput(!showManualInput)}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    {texts.directInput}
                  </button>
                </div>

                {/* 검색 */}
                <input
                  type="text"
                  placeholder={texts.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 수동 입력 폼 */}
              {showManualInput && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">{texts.manualInput}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder={texts.flightNumberLabel}
                      value={manualFlight.flightNumber}
                      onChange={(e) => setManualFlight(prev => ({ ...prev, flightNumber: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="text"
                      placeholder={texts.airlineLabel}
                      value={manualFlight.airline}
                      onChange={(e) => setManualFlight(prev => ({ ...prev, airline: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="time"
                      placeholder={texts.departureTimeLabel}
                      value={manualFlight.departureTime}
                      onChange={(e) => setManualFlight(prev => ({ ...prev, departureTime: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="time"
                      placeholder={texts.arrivalTimeLabel}
                      value={manualFlight.arrivalTime}
                      onChange={(e) => setManualFlight(prev => ({ ...prev, arrivalTime: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="mt-3 flex items-center space-x-2">
                    <input
                      type="number"
                      placeholder={texts.webPriceLabel}
                      value={manualFlight.webPrice}
                      onChange={(e) => setManualFlight(prev => ({ ...prev, webPrice: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <button
                      onClick={addManualFlight}
                      className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      {texts.addFlight}
                    </button>
                  </div>
                </div>
              )}

              {/* 항공편 목록 */}
              <div className="overflow-y-auto max-h-[calc(90vh-300px)]">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">{texts.loading}</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-red-600">{error}</p>
                  </div>
                ) : filteredFlights.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">{texts.noFlightsFound}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredFlights.map((flight) => {
                      const isSelected = selectedFlights.some(f => f.id === flight.id);
                      return (
                        <div
                          key={flight.id}
                          onClick={() => toggleFlightSelection(flight)}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{flight.flightNumber}</div>
                              <div className="text-sm text-gray-600">{flight.airline}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm">
                                {flight.departureTime} - {flight.arrivalTime}
                              </div>
                              <div className="text-xs text-gray-500">
                                {flight.departure} → {flight.arrival}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 오른쪽: 선택된 항공편 */}
            <div className="w-96 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{texts.selectedFlights}</h3>
              
              <div className="space-y-3 max-h-[calc(90vh-200px)] overflow-y-auto">
                {selectedFlights.map((flight) => (
                  <div key={flight.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium">{flight.flightNumber}</div>
                        <div className="text-sm text-gray-600">{flight.airline}</div>
                      </div>
                      <button
                        onClick={() => removeSelectedFlight(flight.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {flight.departureTime} - {flight.arrivalTime}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {flight.departure} → {flight.arrival}
                    </div>
                    <input
                      type="number"
                      placeholder={texts.enterWebPrice}
                      value={flight.webPrice || ''}
                      onChange={(e) => updateWebPrice(flight.id, e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                ))}
              </div>

              {/* 저장 버튼 */}
              <div className="mt-6 pt-4 border-t">
                <button
                  onClick={handleSave}
                  disabled={selectedFlights.length === 0}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {texts.save} ({selectedFlights.length})
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 