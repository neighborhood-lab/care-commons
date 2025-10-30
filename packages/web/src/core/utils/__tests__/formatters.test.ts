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

describe('formatDate', () => {
  it('formats date string with default options', () => {
    const result = formatDate('2023-12-25');
    expect(result).toBe('Dec 25, 2023');
  });

  it('formats Date object with default options', () => {
    const date = new Date(2023, 11, 25); // December 25, 2023
    const result = formatDate(date);
    expect(result).toBe('Dec 25, 2023');
  });

  it('formats with custom options', () => {
    const result = formatDate('2023-12-25', { 
      year: '2-digit', 
      month: 'long', 
      day: '2-digit' 
    });
    expect(result).toBe('December 25, 23');
  });

  it('handles invalid date string', () => {
    const result = formatDate('invalid-date');
    expect(result).toBe('Invalid Date');
  });
});

describe('formatDateTime', () => {
  it('formats date and time', () => {
    const result = formatDateTime('2023-12-25T14:30:00');
    expect(result).toMatch(/Dec 25, 2023,?\s*\d{1,2}:\d{2}\s*(AM|PM)/);
  });

  it('handles Date object', () => {
    const date = new Date(2023, 11, 25, 14, 30);
    const result = formatDateTime(date);
    expect(result).toMatch(/Dec 25, 2023,?\s*\d{1,2}:\d{2}\s*(AM|PM)/);
  });
});

describe('formatTime', () => {
  it('formats time only', () => {
    const result = formatTime('2023-12-25T14:30:00');
    expect(result).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/);
  });

  it('handles Date object', () => {
    const date = new Date(2023, 11, 25, 14, 30);
    const result = formatTime(date);
    expect(result).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/);
  });

  it('handles midnight', () => {
    const result = formatTime('2023-12-25T00:00:00');
    expect(result).toMatch(/12:00\s*AM/);
  });

  it('handles noon', () => {
    const result = formatTime('2023-12-25T12:00:00');
    expect(result).toMatch(/12:00\s*PM/);
  });
});

describe('formatPhone', () => {
  it('formats 10-digit phone number', () => {
    const result = formatPhone('1234567890');
    expect(result).toBe('(123) 456-7890');
  });

  it('formats phone number with formatting', () => {
    const result = formatPhone('(123) 456-7890');
    expect(result).toBe('(123) 456-7890');
  });

  it('formats phone number with dashes', () => {
    const result = formatPhone('123-456-7890');
    expect(result).toBe('(123) 456-7890');
  });

  it('formats phone number with spaces', () => {
    const result = formatPhone('123 456 7890');
    expect(result).toBe('(123) 456-7890');
  });

  it('returns original if not 10 digits', () => {
    const result = formatPhone('123456');
    expect(result).toBe('123456');
  });

  it('handles phone number with country code', () => {
    const result = formatPhone('11234567890');
    expect(result).toBe('11234567890'); // Returns original as it's 11 digits
  });

  it('handles empty string', () => {
    const result = formatPhone('');
    expect(result).toBe('');
  });
});

describe('formatCurrency', () => {
  it('formats USD currency', () => {
    const result = formatCurrency(123.45);
    expect(result).toBe('$123.45');
  });

  it('formats whole number', () => {
    const result = formatCurrency(100);
    expect(result).toBe('$100.00');
  });

  it('formats large number', () => {
    const result = formatCurrency(1234567.89);
    expect(result).toBe('$1,234,567.89');
  });

  it('formats with custom currency', () => {
    const result = formatCurrency(123.45, 'EUR');
    expect(result).toBe('€123.45');
  });

  it('formats zero', () => {
    const result = formatCurrency(0);
    expect(result).toBe('$0.00');
  });

  it('formats negative number', () => {
    const result = formatCurrency(-123.45);
    expect(result).toBe('-$123.45');
  });
});

describe('formatDuration', () => {
  it('formats minutes only', () => {
    const result = formatDuration(45);
    expect(result).toBe('45m');
  });

  it('formats hours only', () => {
    const result = formatDuration(120);
    expect(result).toBe('2h');
  });

  it('formats hours and minutes', () => {
    const result = formatDuration(125);
    expect(result).toBe('2h 5m');
  });

  it('formats zero minutes', () => {
    const result = formatDuration(0);
    expect(result).toBe('0m');
  });

  it('formats one hour', () => {
    const result = formatDuration(60);
    expect(result).toBe('1h');
  });

  it('formats one minute', () => {
    const result = formatDuration(1);
    expect(result).toBe('1m');
  });

  it('formats large duration', () => {
    const result = formatDuration(485); // 8 hours 5 minutes
    expect(result).toBe('8h 5m');
  });
});

describe('truncate', () => {
  it('truncates long text', () => {
    const result = truncate('This is a very long text', 10);
    expect(result).toBe('This is...');
  });

  it('returns original if shorter than max length', () => {
    const result = truncate('Short', 10);
    expect(result).toBe('Short');
  });

  it('returns original if equal to max length', () => {
    const result = truncate('Exactly10', 10);
    expect(result).toBe('Exactly10');
  });

  it('handles empty string', () => {
    const result = truncate('', 10);
    expect(result).toBe('');
  });

  it('handles single character', () => {
    const result = truncate('A', 1);
    expect(result).toBe('A');
  });

  it('handles very small max length', () => {
    const result = truncate('Hello', 2);
    expect(result).toBe('...');
  });

  it('handles exact boundary case', () => {
    const result = truncate('Hello', 4);
    expect(result).toBe('...');
  });
});

describe('capitalize', () => {
  it('capitalizes first letter', () => {
    const result = capitalize('hello');
    expect(result).toBe('Hello');
  });

  it('lowercases rest of string', () => {
    const result = capitalize('hELLO');
    expect(result).toBe('Hello');
  });

  it('handles already capitalized', () => {
    const result = capitalize('Hello');
    expect(result).toBe('Hello');
  });

  it('handles empty string', () => {
    const result = capitalize('');
    expect(result).toBe('');
  });

  it('handles single character', () => {
    const result = capitalize('h');
    expect(result).toBe('H');
  });

  it('handles single uppercase character', () => {
    const result = capitalize('H');
    expect(result).toBe('H');
  });

  it('handles string with numbers', () => {
    const result = capitalize('hello123');
    expect(result).toBe('Hello123');
  });

  it('handles string with special characters', () => {
    const result = capitalize('hello-world');
    expect(result).toBe('Hello-world');
  });

  it('handles string starting with number', () => {
    const result = capitalize('123hello');
    expect(result).toBe('123hello');
  });
});