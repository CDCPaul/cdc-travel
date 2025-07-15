// Google Maps API 공통 관리 유틸리티

let isGoogleMapsLoaded = false;
let isLoading = false;
let loadPromise: Promise<void> | null = null;

export const loadGoogleMapsAPI = (): Promise<void> => {
  // 이미 로드된 경우
  if (isGoogleMapsLoaded) {
    return Promise.resolve();
  }

  // 로딩 중인 경우 기존 Promise 반환
  if (isLoading && loadPromise) {
    return loadPromise;
  }

  // 이미 스크립트가 있는지 확인
  const existingScript = document.getElementById('google-maps-script');
  if (existingScript) {
    isLoading = true;
    loadPromise = new Promise((resolve) => {
      const checkLoaded = () => {
        if (window.google && window.google.maps && window.google.maps.places) {
          isGoogleMapsLoaded = true;
          isLoading = false;
          resolve();
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
    });
    return loadPromise;
  }

  // 새로운 스크립트 로드
  isLoading = true;
  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      isGoogleMapsLoaded = true;
      isLoading = false;
      resolve();
    };
    
    script.onerror = () => {
      isLoading = false;
      reject(new Error('Failed to load Google Maps API'));
    };
    
    document.head.appendChild(script);
  });

  return loadPromise;
};

export const getGoogleMapsLoadedStatus = (): boolean => {
  return isGoogleMapsLoaded;
}; 