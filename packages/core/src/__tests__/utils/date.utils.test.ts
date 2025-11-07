/**
 * Tests for DateUtils
 */

import { describe, it, expect } from 'vitest';
import { DateUtils } from '../../utils/date.utils.js';

describe('DateUtils', () => {
  describe('formatDate', () => {
    it('should format date to yyyy-MM-dd by default', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = DateUtils.formatDate(date);
      expect(formatted).toBe('2024-01-15');
    });

    it('should format date with custom format', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = DateUtils.formatDate(date, 'MM/dd/yyyy');
      expect(formatted).toBe('01/15/2024');
    });

    it('should handle ISO string input', () => {
      const formatted = DateUtils.formatDate('2024-01-15T10:30:00Z');
      expect(formatted).toBe('2024-01-15');
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time', () => {
      const date = new Date('2024-01-15T10:30:45Z');
      const formatted = DateUtils.formatDateTime(date);
      expect(formatted).toMatch(/2024-01-15 \d{2}:\d{2}:\d{2}/);
    });
  });

  describe('formatTime', () => {
    it('should format time only', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = DateUtils.formatTime(date);
      expect(formatted).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe('addBusinessDays', () => {
    it('should add business days skipping weekends', () => {
      const friday = new Date('2024-01-12'); // Friday
      const result = DateUtils.addBusinessDays(friday, 1);
      expect(result.getDay()).toBe(1); // Monday
    });

    it('should handle multiple business days', () => {
      const monday = new Date('2024-01-15'); // Monday
      const result = DateUtils.addBusinessDays(monday, 5);
      expect(result.getDay()).toBe(1); // Next Monday
    });
  });

  describe('isWithinTolerance', () => {
    it('should return true when within tolerance', () => {
      const base = new Date('2024-01-15T10:00:00Z');
      const test = new Date('2024-01-15T10:05:00Z');
      expect(DateUtils.isWithinTolerance(test, base, 10)).toBe(true);
    });

    it('should return false when outside tolerance', () => {
      const base = new Date('2024-01-15T10:00:00Z');
      const test = new Date('2024-01-15T11:00:00Z');
      expect(DateUtils.isWithinTolerance(test, base, 10)).toBe(false);
    });
  });

  describe('getDateRange', () => {
    it('should generate array of dates', () => {
      const start = new Date('2024-01-15');
      const end = new Date('2024-01-17');
      const range = DateUtils.getDateRange(start, end);
      expect(range).toHaveLength(3);
      expect(range[0]?.getDate()).toBe(15);
      expect(range[2]?.getDate()).toBe(17);
    });
  });

  describe('parseISOSafe', () => {
    it('should parse valid ISO string', () => {
      const result = DateUtils.parseISOSafe('2024-01-15T10:30:00Z');
      expect(result).toBeInstanceOf(Date);
    });

    it('should return null for invalid string', () => {
      expect(DateUtils.parseISOSafe('invalid')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(DateUtils.parseISOSafe('')).toBeNull();
    });

    it('should return null for null', () => {
      expect(DateUtils.parseISOSafe(null)).toBeNull();
    });

    it('should return null for undefined', () => {
      expect(DateUtils.parseISOSafe(undefined)).toBeNull();
    });
  });

  describe('isPast', () => {
    it('should return true for past date', () => {
      const pastDate = new Date('2020-01-01');
      expect(DateUtils.isPast(pastDate)).toBe(true);
    });

    it('should return false for future date', () => {
      const futureDate = new Date('2030-01-01');
      expect(DateUtils.isPast(futureDate)).toBe(false);
    });
  });

  describe('isFuture', () => {
    it('should return true for future date', () => {
      const futureDate = new Date('2030-01-01');
      expect(DateUtils.isFuture(futureDate)).toBe(true);
    });

    it('should return false for past date', () => {
      const pastDate = new Date('2020-01-01');
      expect(DateUtils.isFuture(pastDate)).toBe(false);
    });
  });

  describe('startOfDay', () => {
    it('should set time to 00:00:00', () => {
      const date = new Date('2024-01-15T10:30:45Z');
      const result = DateUtils.startOfDay(date);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });
  });

  describe('endOfDay', () => {
    it('should set time to 23:59:59.999', () => {
      const date = new Date('2024-01-15T10:30:45Z');
      const result = DateUtils.endOfDay(date);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });
  });
});
