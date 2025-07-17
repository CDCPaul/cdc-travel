import sharp from 'sharp';

export interface ImageOptimizationOptions {
  quality?: number;
  width?: number;
  height?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'gif';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

// 용도별 최적화 프리셋
export type ImageUsage = 
  | 'hero-banner'      // 메인 배너 (1200x800)
  | 'product-card'     // 상품 카드 (600x400)
  | 'travel-info'      // 여행정보 (800x500)
  | 'product-detail'   // 상품 상세 (800x1132)
  | 'spot-main'        // 스팟 대표 이미지 (800x600)
  | 'spot-gallery'     // 스팟 갤러리 이미지 (600x400)
  | 'custom';          // 커스텀 설정

export interface ImageUsagePreset {
  main: ImageOptimizationOptions;
}

export interface OptimizedImageResult {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
  size: number;
}

/**
 * 용도별 최적화 프리셋 정의 (단순화)
 */
export const IMAGE_USAGE_PRESETS: Record<ImageUsage, ImageUsagePreset> = {
  'hero-banner': {
    main: { width: 1200, height: 800, format: 'webp', quality: 80, fit: 'cover' }
  },
  'product-card': {
    main: { width: 600, height: 400, format: 'webp', quality: 80, fit: 'cover' }
  },
  'travel-info': {
    main: { width: 800, height: 500, format: 'webp', quality: 80, fit: 'cover' }
  },
  'product-detail': {
    main: { width: 800, height: 1132, format: 'webp', quality: 80, fit: 'cover' } // A4 비율
  },
  'spot-main': {
    main: { width: 800, height: 600, format: 'webp', quality: 85, fit: 'inside' } // 스팟 대표 이미지 - 비율 유지
  },
  'spot-gallery': {
    main: { width: 600, height: 400, format: 'webp', quality: 80, fit: 'inside' } // 스팟 갤러리 이미지 - 비율 유지
  },
  'custom': {
    main: { format: 'webp', quality: 80, fit: 'cover' }
  }
};

/**
 * 용도별 이미지 최적화 함수 (단순화)
 * @param buffer 원본 이미지 버퍼
 * @param usage 이미지 용도
 * @param customOptions 커스텀 옵션 (usage가 'custom'일 때 사용)
 * @returns 최적화된 이미지 결과
 */
export async function optimizeImageForUsage(
  buffer: Buffer,
  usage: ImageUsage,
  customOptions?: ImageOptimizationOptions
): Promise<OptimizedImageResult> {
  const preset = IMAGE_USAGE_PRESETS[usage];
  
  if (!preset) {
    throw new Error(`Unknown image usage: ${usage}`);
  }

  // 메인 이미지 최적화
  const mainOptions = usage === 'custom' ? customOptions! : preset.main;
  return await optimizeImage(buffer, mainOptions);
}



/**
 * 이미지 최적화 함수
 * @param buffer 원본 이미지 버퍼
 * @param options 최적화 옵션
 * @returns 최적화된 이미지 결과
 */
export async function optimizeImage(
  buffer: Buffer,
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImageResult> {
  const {
    quality = 80,
    width,
    height,
    format = 'jpeg',
    fit = 'cover'
  } = options;

  // BMP 파일인지 확인하고 메타데이터 먼저 확인
  let sharpInstance = sharp(buffer);
  
  try {
    // 메타데이터 확인
    const metadata = await sharpInstance.metadata();
    console.log('이미지 메타데이터:', metadata);
    
    if (!metadata.format) {
      throw new Error('이미지 형식을 확인할 수 없습니다.');
    }
  } catch (error) {
    console.error('메타데이터 확인 실패:', error);
    // BMP 파일인 경우 다른 방법 시도
    if (error instanceof Error && error.message.includes('unsupported')) {
      throw new Error('지원하지 않는 이미지 형식입니다. BMP 파일은 PNG나 JPEG로 변환 후 사용해주세요.');
    }
    throw error;
  }

  // 리사이징
  if (width || height) {
    sharpInstance = sharpInstance.resize(width, height, { fit });
  }

  // 포맷 변환 및 품질 설정
  switch (format) {
    case 'jpeg':
      sharpInstance = sharpInstance.jpeg({ quality });
      break;
    case 'png':
      sharpInstance = sharpInstance.png({ quality });
      break;
    case 'webp':
      sharpInstance = sharpInstance.webp({ quality });
      break;
    case 'gif':
      sharpInstance = sharpInstance.gif();
      break;
  }

  const optimizedBuffer = await sharpInstance.toBuffer();
  const metadata = await sharpInstance.metadata();

  return {
    buffer: optimizedBuffer,
    format,
    width: metadata.width || 0,
    height: metadata.height || 0,
    size: optimizedBuffer.length
  };
}

/**
 * 썸네일 생성 함수
 * @param buffer 원본 이미지 버퍼
 * @param width 썸네일 너비
 * @param height 썸네일 높이
 * @returns 썸네일 이미지 버퍼
 */
export async function createThumbnail(
  buffer: Buffer,
  width: number = 300,
  height: number = 200
): Promise<Buffer> {
  return await sharp(buffer)
    .resize(width, height, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toBuffer();
}

/**
 * 웹 최적화 이미지 생성 함수
 * @param buffer 원본 이미지 버퍼
 * @param maxWidth 최대 너비
 * @param maxHeight 최대 높이
 * @returns 웹 최적화된 이미지 버퍼
 */
export async function createWebOptimizedImage(
  buffer: Buffer,
  maxWidth: number = 1200,
  maxHeight: number = 800
): Promise<Buffer> {
  const metadata = await sharp(buffer).metadata();
  
  let targetWidth = metadata.width || maxWidth;
  let targetHeight = metadata.height || maxHeight;

  // 비율 유지하면서 크기 조정
  if (targetWidth > maxWidth || targetHeight > maxHeight) {
    const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
    targetWidth = Math.round(targetWidth * ratio);
    targetHeight = Math.round(targetHeight * ratio);
  }

  return await sharp(buffer)
    .resize(targetWidth, targetHeight, { fit: 'inside' })
    .webp({ quality: 85 })
    .toBuffer();
}

/**
 * 여러 크기의 이미지 생성 함수
 * @param buffer 원본 이미지 버퍼
 * @param sizes 생성할 이미지 크기들
 * @returns 각 크기별 최적화된 이미지들
 */
export async function createMultipleSizes(
  buffer: Buffer,
  sizes: Array<{ width: number; height: number; suffix: string }>
): Promise<Record<string, Buffer>> {
  const results: Record<string, Buffer> = {};

  for (const size of sizes) {
    const optimized = await sharp(buffer)
      .resize(size.width, size.height, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    results[size.suffix] = optimized;
  }

  return results;
}

/**
 * 이미지 메타데이터 추출
 * @param buffer 이미지 버퍼
 * @returns 이미지 메타데이터
 */
export async function extractImageMetadata(buffer: Buffer) {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    size: buffer.length,
    hasAlpha: metadata.hasAlpha,
    channels: metadata.channels
  };
} 