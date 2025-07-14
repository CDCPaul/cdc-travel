import { safeLang, isCurrencyPrice, isLanguagePrice, getPHPPrice, getPriceDisplayText } from '@/lib/types'

describe('Type Utils', () => {
  describe('safeLang', () => {
    test('should return Korean text when lang is ko', () => {
      const multilingualText = { ko: '안녕하세요', en: 'Hello' }
      expect(safeLang(multilingualText, 'ko')).toBe('안녕하세요')
    })

    test('should return English text when lang is en', () => {
      const multilingualText = { ko: '안녕하세요', en: 'Hello' }
      expect(safeLang(multilingualText, 'en')).toBe('Hello')
    })

    test('should return English as fallback when Korean is not available', () => {
      const multilingualText = { en: 'Hello' } as any
      expect(safeLang(multilingualText, 'ko')).toBe('Hello')
    })

    test('should return English as fallback when English is not available', () => {
      const multilingualText = { ko: '안녕하세요' } as any
      expect(safeLang(multilingualText, 'en')).toBe('안녕하세요')
    })

    test('should return empty string when no text is available', () => {
      const multilingualText = {} as any
      expect(safeLang(multilingualText, 'ko')).toBe('')
    })

    test('should handle string input', () => {
      expect(safeLang('Simple text', 'ko')).toBe('Simple text')
    })

    test('should handle null/undefined input', () => {
      expect(safeLang(null as any, 'ko')).toBe('')
      expect(safeLang(undefined as any, 'ko')).toBe('')
    })
  })

  describe('isCurrencyPrice', () => {
    test('should return true for currency price object', () => {
      const currencyPrice = { KRW: '₩100,000', PHP: '₱50,000', USD: '$100' }
      expect(isCurrencyPrice(currencyPrice)).toBe(true)
    })

    test('should return false for language price object', () => {
      const languagePrice = { ko: '₩100,000', en: '$100' }
      expect(isCurrencyPrice(languagePrice)).toBe(false)
    })

    test('should return false for string', () => {
      expect(isCurrencyPrice('₩100,000')).toBe(false)
    })

    test('should return false for null/undefined', () => {
      expect(isCurrencyPrice(null)).toBe(false)
      expect(isCurrencyPrice(undefined)).toBe(false)
    })
  })

  describe('isLanguagePrice', () => {
    test('should return true for language price object', () => {
      const languagePrice = { ko: '₩100,000', en: '$100' }
      expect(isLanguagePrice(languagePrice)).toBe(true)
    })

    test('should return false for currency price object', () => {
      const currencyPrice = { KRW: '₩100,000', PHP: '₱50,000', USD: '$100' }
      expect(isLanguagePrice(currencyPrice)).toBe(false)
    })

    test('should return false for string', () => {
      expect(isLanguagePrice('₩100,000')).toBe(false)
    })

    test('should return false for null/undefined', () => {
      expect(isLanguagePrice(null)).toBe(false)
      expect(isLanguagePrice(undefined)).toBe(false)
    })
  })

  describe('getPHPPrice', () => {
    test('should return PHP price from currency price object', () => {
      const currencyPrice = { KRW: '₩100,000', PHP: '₱50,000', USD: '$100' }
      expect(getPHPPrice(currencyPrice)).toBe('₱₱50,000')
    })

    test('should return KRW when PHP price is not available', () => {
      const currencyPrice = { KRW: '₩100,000', USD: '$100' }
      expect(getPHPPrice(currencyPrice)).toBe('₩₩100,000')
    })

    test('should return Korean price for language price object', () => {
      const languagePrice = { ko: '₩100,000', en: '$100' }
      expect(getPHPPrice(languagePrice)).toBe('₩100,000')
    })

    test('should return string for string input', () => {
      expect(getPHPPrice('₱50,000')).toBe('₱50,000')
    })

    test('should return dash for null/undefined', () => {
      expect(getPHPPrice(null)).toBe('-')
      expect(getPHPPrice(undefined)).toBe('-')
    })
  })

  describe('getPriceDisplayText', () => {
    test('should return Korean text for currency price', () => {
      const currencyPrice = { KRW: '₩100,000', PHP: '₱50,000', USD: '$100' }
      expect(getPriceDisplayText(currencyPrice, 'ko')).toBe('₩₩100,000 ₱₱50,000 $$100')
    })

    test('should return English text for language price', () => {
      const languagePrice = { ko: '₩100,000', en: '$100' }
      expect(getPriceDisplayText(languagePrice, 'en')).toBe('$100')
    })

    test('should return string for string price', () => {
      expect(getPriceDisplayText('₩100,000', 'ko')).toBe('₩100,000')
    })

    test('should return default text for null/undefined', () => {
      expect(getPriceDisplayText(null, 'ko')).toBe('가격 미지정')
      expect(getPriceDisplayText(undefined, 'en')).toBe('Price not set')
    })
  })
}) 