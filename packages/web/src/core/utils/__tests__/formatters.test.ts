import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatTime,
  formatPhone,
  formatCurrency,
  formatDuration,
  truncate,
  capitalize,
} from '../formatters';

describe('formatters', () => {
  describe('formatDate', () => {
    it('should format a date string', () => {
      const result = formatDate('2024-01-15T12:00:00');
      expect(result).toContain('Jan');
      expect(result).toContain('2024');
    });

    it('should format a Date object', () => {
      const date = new Date('2024-01-15T12:00:00');
      const result = formatDate(date);
      expect(result).toContain('Jan');
      expect(result).toContain('2024');
    });
  });

  describe('formatDateTime', () => {
    it('should format a date with time', () => {
      const result = formatDateTime('2024-01-15T14:30:00');
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });
  });

  describe('formatTime', () => {
    it('should format time from date string', () => {
      const result = formatTime('2024-01-15T14:30:00');
      expect(result).toContain('30');
    });
  });

  describe('formatPhone', () => {
    it('should format a 10-digit phone number', () => {
      const result = formatPhone('5551234567');
      expect(result).toBe('(555) 123-4567');
    });

    it('should handle phone numbers with formatting', () => {
      const result = formatPhone('(555) 123-4567');
      expect(result).toBe('(555) 123-4567');
    });

    it('should return original if not 10 digits', () => {
      const result = formatPhone('123');
      expect(result).toBe('123');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency in USD by default', () => {
      const result = formatCurrency(1234.56);
      expect(result).toBe('$1,234.56');
    });

    it('should handle zero', () => {
      const result = formatCurrency(0);
      expect(result).toBe('$0.00');
    });

    it('should handle negative amounts', () => {
      const result = formatCurrency(-100);
      expect(result).toContain('-');
      expect(result).toContain('100');
    });
  });

  describe('formatDuration', () => {
    it('should format minutes only', () => {
      const result = formatDuration(45);
      expect(result).toBe('45m');
    });

    it('should format hours only', () => {
      const result = formatDuration(120);
      expect(result).toBe('2h');
    });

    it('should format hours and minutes', () => {
      const result = formatDuration(90);
      expect(result).toBe('1h 30m');
    });

    it('should handle zero', () => {
      const result = formatDuration(0);
      expect(result).toBe('0m');
    });
  });

  describe('truncate', () => {
    it('should truncate long text', () => {
      const result = truncate('This is a long text', 10);
      expect(result).toBe('This is...');
    });

    it('should not truncate short text', () => {
      const result = truncate('Short', 10);
      expect(result).toBe('Short');
    });

    it('should handle exact length', () => {
      const result = truncate('Exactly10!', 10);
      expect(result).toBe('Exactly10!');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      const result = capitalize('hello');
      expect(result).toBe('Hello');
    });

    it('should lowercase rest of string', () => {
      const result = capitalize('HELLO');
      expect(result).toBe('Hello');
    });

    it('should handle single character', () => {
      const result = capitalize('a');
      expect(result).toBe('A');
    });

    it('should handle empty string', () => {
      const result = capitalize('');
      expect(result).toBe('');
    });
  });
});
