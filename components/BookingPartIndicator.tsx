'use client';

import { useLanguage } from './LanguageContext';

interface BookingPartIndicatorProps {
  selectedPart: 'AIR' | 'CINT' | null;
}

export default function BookingPartIndicator({ selectedPart }: BookingPartIndicatorProps) {
  const { lang } = useLanguage();

  if (!selectedPart) return null;

  const partLabels = {
    AIR: { ko: '항공', en: 'Air' },
    CINT: { ko: '현지', en: 'Local' }
  };

  const getPartColor = (part: 'AIR' | 'CINT') => {
    return part === 'AIR' 
      ? 'bg-blue-100 text-blue-800 border-blue-200' 
      : 'bg-green-100 text-green-800 border-green-200';
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700">
        {lang === 'ko' ? '파트' : 'Part'}:
      </span>
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPartColor(selectedPart)}`}>
        {partLabels[selectedPart][lang]}
      </span>
    </div>
  );
} 