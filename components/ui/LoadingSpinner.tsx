import { motion } from "framer-motion";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
  lang?: 'ko' | 'en';
}

export default function LoadingSpinner({ 
  size = "md", 
  text, 
  className = "",
  lang = 'ko'
}: LoadingSpinnerProps) {
  const defaultTexts = {
    ko: "로딩 중...",
    en: "Loading..."
  };
  
  const displayText = text || defaultTexts[lang];
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-12 h-12", 
    lg: "w-16 h-16"
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        {/* 외부 원 */}
        <motion.div
          className={`${sizeClasses[size]} border-4 border-blue-200 rounded-full`}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        {/* 내부 원 */}
        <motion.div
          className={`${sizeClasses[size]} border-4 border-transparent border-t-blue-600 rounded-full absolute top-0 left-0`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        {/* 중앙 점 */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-2 h-2 bg-blue-600 rounded-full"
          style={{ 
            transform: "translate(-50%, -50%)",
            marginTop: size === "sm" ? "-2px" : size === "md" ? "-4px" : "-6px",
            marginLeft: size === "sm" ? "-2px" : size === "md" ? "-4px" : "-6px"
          }}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* 추가 효과 - 작은 원들 */}
        {size === "lg" && (
          <>
            <motion.div
              className="absolute top-0 left-1/2 w-1 h-1 bg-blue-400 rounded-full"
              style={{ transform: "translateX(-50%)" }}
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
            <motion.div
              className="absolute bottom-0 left-1/2 w-1 h-1 bg-blue-400 rounded-full"
              style={{ transform: "translateX(-50%)" }}
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
          </>
        )}
      </div>
      {displayText && (
        <motion.p
          className="mt-4 text-gray-600 font-medium"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {displayText}
        </motion.p>
      )}
    </div>
  );
}

// 페이지 전체 로딩 컴포넌트
export function PageLoading({ lang = 'ko' }: { lang?: 'ko' | 'en' }) {
  const texts = {
    ko: {
      loading: "페이지를 불러오는 중...",
      wait: "잠시만 기다려주세요"
    },
    en: {
      loading: "Loading page...",
      wait: "Please wait a moment"
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" text={texts[lang].loading} lang={lang} />
        <motion.div
          className="mt-8 text-gray-500 text-sm"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {texts[lang].wait}
        </motion.div>
      </div>
    </div>
  );
}

// 카드 스켈레톤 로딩 컴포넌트
export function CardSkeleton({}: { lang?: 'ko' | 'en' }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
      <div className="w-48 h-64 bg-gray-200" />
      <div className="p-5">
        <div className="h-6 bg-gray-200 rounded mb-2" />
        <div className="h-4 bg-gray-200 rounded mb-2 w-3/4" />
        <div className="h-4 bg-gray-200 rounded mb-4 w-1/2" />
        <div className="flex gap-2 mb-3">
          <div className="h-6 bg-gray-200 rounded-full w-16" />
          <div className="h-6 bg-gray-200 rounded-full w-20" />
        </div>
        <div className="h-8 bg-gray-200 rounded w-24" />
      </div>
    </div>
  );
}

// 그리드 스켈레톤 로딩 컴포넌트
export function GridSkeleton({ count = 6, lang = 'ko' }: { count?: number; lang?: 'ko' | 'en' }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <CardSkeleton lang={lang} />
        </motion.div>
      ))}
    </div>
  );
} 