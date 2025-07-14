import { formatDate, formatCurrentDate, formatTimestamp, formatRelativeTime } from '@/lib/utils'

describe('Date Utils', () => {
  describe('formatDate', () => {
    test('should format date with default format', () => {
      const date = new Date('2024-01-15T10:30:00')
      expect(formatDate(date)).toBe('2024-01-15')
    })

    test('should format date with custom format', () => {
      const date = new Date('2024-01-15T10:30:45')
      expect(formatDate(date, 'YYYY-MM-DD HH:mm:ss')).toBe('2024-01-15 10:30:45')
    })

    test('should format date string', () => {
      expect(formatDate('2024-01-15')).toBe('2024-01-15')
    })

    test('should format timestamp number', () => {
      const timestamp = new Date('2024-01-15').getTime()
      expect(formatDate(timestamp)).toBe('2024-01-15')
    })

    test('should throw error for invalid date', () => {
      expect(() => formatDate('invalid-date')).toThrow('Invalid date provided to formatDate')
    })

    test('should handle different format patterns', () => {
      const date = new Date('2024-01-15T10:30:45')
      expect(formatDate(date, 'MM/DD/YYYY')).toBe('01/15/2024')
      expect(formatDate(date, 'YYYY년 MM월 DD일')).toBe('2024년 01월 15일')
    })
  })

  describe('formatCurrentDate', () => {
    test('should format current date with default format', () => {
      const result = formatCurrentDate()
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    test('should format current date with custom format', () => {
      const result = formatCurrentDate('MM/DD/YYYY')
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
    })
  })

  describe('formatTimestamp', () => {
    test('should format Unix timestamp', () => {
      const timestamp = new Date('2024-01-15').getTime()
      expect(formatTimestamp(timestamp)).toBe('2024-01-15')
    })

    test('should format Firestore timestamp', () => {
      const firestoreTimestamp = { seconds: 1705312800, nanoseconds: 0 }
      expect(formatTimestamp(firestoreTimestamp)).toBe('2024-01-15')
    })

    test('should format timestamp with custom format', () => {
      const timestamp = new Date('2024-01-15T10:30:45').getTime()
      expect(formatTimestamp(timestamp, 'YYYY-MM-DD HH:mm')).toBe('2024-01-15 10:30')
    })
  })

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      // Mock current date to 2024-01-15 12:00:00
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-01-15T12:00:00'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    test('should format "방금 전" for recent time', () => {
      const recentTime = new Date('2024-01-15T11:59:30')
      expect(formatRelativeTime(recentTime)).toBe('방금 전')
    })

    test('should format minutes ago', () => {
      const fiveMinutesAgo = new Date('2024-01-15T11:55:00')
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5분 전')
    })

    test('should format hours ago', () => {
      const twoHoursAgo = new Date('2024-01-15T10:00:00')
      expect(formatRelativeTime(twoHoursAgo)).toBe('2시간 전')
    })

    test('should format days ago', () => {
      const threeDaysAgo = new Date('2024-01-12T12:00:00')
      expect(formatRelativeTime(threeDaysAgo)).toBe('3일 전')
    })

    test('should format date for older times', () => {
      const oldDate = new Date('2024-01-01T12:00:00')
      expect(formatRelativeTime(oldDate)).toBe('2024-01-01')
    })

    test('should handle string input', () => {
      const timeString = '2024-01-15T11:55:00'
      expect(formatRelativeTime(timeString)).toBe('5분 전')
    })

    test('should handle timestamp input', () => {
      const timestamp = new Date('2024-01-15T11:55:00').getTime()
      expect(formatRelativeTime(timestamp)).toBe('5분 전')
    })
  })
}) 