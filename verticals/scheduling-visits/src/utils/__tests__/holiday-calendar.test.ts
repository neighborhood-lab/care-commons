/**
 * Tests for Holiday Calendar Utility
 */

import { describe, it, expect } from 'vitest';
import {
  calculateFederalHolidays,
  isFederalHoliday,
  filterHolidays,
  getHolidaysInRange,
} from '../holiday-calendar.js';

describe('Holiday Calendar', () => {
  describe('calculateFederalHolidays', () => {
    it('should calculate all 11 federal holidays for 2024', () => {
      const holidays = calculateFederalHolidays(2024);
      
      expect(holidays).toHaveLength(11);
    });

    it('should calculate New Year\'s Day correctly', () => {
      const holidays = calculateFederalHolidays(2024);
      const newYears = holidays.find(h => h.getMonth() === 0 && h.getDate() === 1);
      
      expect(newYears).toBeDefined();
      expect(newYears?.getFullYear()).toBe(2024);
    });

    it('should calculate MLK Day (3rd Monday in January) correctly', () => {
      const holidays = calculateFederalHolidays(2024);
      const mlkDay = holidays.find(h => h.getMonth() === 0 && h.getDay() === 1 && h.getDate() >= 15 && h.getDate() <= 21);
      
      expect(mlkDay).toBeDefined();
      expect(mlkDay?.getDate()).toBe(15); // January 15, 2024 is 3rd Monday
    });

    it('should calculate Presidents Day (3rd Monday in February) correctly', () => {
      const holidays = calculateFederalHolidays(2024);
      const presidentsDay = holidays.find(h => h.getMonth() === 1 && h.getDay() === 1 && h.getDate() >= 15 && h.getDate() <= 21);
      
      expect(presidentsDay).toBeDefined();
      expect(presidentsDay?.getDate()).toBe(19); // February 19, 2024 is 3rd Monday
    });

    it('should calculate Memorial Day (last Monday in May) correctly', () => {
      const holidays = calculateFederalHolidays(2024);
      const memorialDay = holidays.find(h => h.getMonth() === 4 && h.getDay() === 1 && h.getDate() >= 25);
      
      expect(memorialDay).toBeDefined();
      expect(memorialDay?.getDate()).toBe(27); // May 27, 2024 is last Monday
    });

    it('should calculate Juneteenth (June 19) correctly', () => {
      const holidays = calculateFederalHolidays(2024);
      const juneteenth = holidays.find(h => h.getMonth() === 5 && h.getDate() === 19);
      
      expect(juneteenth).toBeDefined();
    });

    it('should calculate Independence Day (July 4) correctly', () => {
      const holidays = calculateFederalHolidays(2024);
      const july4 = holidays.find(h => h.getMonth() === 6 && h.getDate() === 4);
      
      expect(july4).toBeDefined();
    });

    it('should calculate Labor Day (1st Monday in September) correctly', () => {
      const holidays = calculateFederalHolidays(2024);
      const laborDay = holidays.find(h => h.getMonth() === 8 && h.getDay() === 1 && h.getDate() <= 7);
      
      expect(laborDay).toBeDefined();
      expect(laborDay?.getDate()).toBe(2); // September 2, 2024 is 1st Monday
    });

    it('should calculate Columbus Day (2nd Monday in October) correctly', () => {
      const holidays = calculateFederalHolidays(2024);
      const columbusDay = holidays.find(h => h.getMonth() === 9 && h.getDay() === 1 && h.getDate() >= 8 && h.getDate() <= 14);
      
      expect(columbusDay).toBeDefined();
      expect(columbusDay?.getDate()).toBe(14); // October 14, 2024 is 2nd Monday
    });

    it('should calculate Veterans Day (November 11) correctly', () => {
      const holidays = calculateFederalHolidays(2024);
      const veteransDay = holidays.find(h => h.getMonth() === 10 && h.getDate() === 11);
      
      expect(veteransDay).toBeDefined();
    });

    it('should calculate Thanksgiving (4th Thursday in November) correctly', () => {
      const holidays = calculateFederalHolidays(2024);
      const thanksgiving = holidays.find(h => h.getMonth() === 10 && h.getDay() === 4 && h.getDate() >= 22 && h.getDate() <= 28);
      
      expect(thanksgiving).toBeDefined();
      expect(thanksgiving?.getDate()).toBe(28); // November 28, 2024 is 4th Thursday
    });

    it('should calculate Christmas (December 25) correctly', () => {
      const holidays = calculateFederalHolidays(2024);
      const christmas = holidays.find(h => h.getMonth() === 11 && h.getDate() === 25);
      
      expect(christmas).toBeDefined();
    });

    it('should calculate holidays correctly across different years', () => {
      const holidays2023 = calculateFederalHolidays(2023);
      const holidays2024 = calculateFederalHolidays(2024);
      const holidays2025 = calculateFederalHolidays(2025);
      
      expect(holidays2023).toHaveLength(11);
      expect(holidays2024).toHaveLength(11);
      expect(holidays2025).toHaveLength(11);
      
      // Verify they're different dates
      expect(holidays2023[0]?.getFullYear()).toBe(2023);
      expect(holidays2024[0]?.getFullYear()).toBe(2024);
      expect(holidays2025[0]?.getFullYear()).toBe(2025);
    });
  });

  describe('isFederalHoliday', () => {
    it('should return true for July 4th', () => {
      const july4 = new Date(2024, 6, 4); // July 4, 2024
      expect(isFederalHoliday(july4)).toBe(true);
    });

    it('should return true for Christmas', () => {
      const christmas = new Date(2024, 11, 25); // December 25, 2024
      expect(isFederalHoliday(christmas)).toBe(true);
    });

    it('should return false for a regular weekday', () => {
      const regularDay = new Date(2024, 5, 10); // June 10, 2024 (not a holiday)
      expect(isFederalHoliday(regularDay)).toBe(false);
    });

    it('should return true for Memorial Day 2024', () => {
      const memorialDay = new Date(2024, 4, 27); // May 27, 2024
      expect(isFederalHoliday(memorialDay)).toBe(true);
    });

    it('should return false for the day before a holiday', () => {
      const dayBefore = new Date(2024, 6, 3); // July 3, 2024
      expect(isFederalHoliday(dayBefore)).toBe(false);
    });

    it('should return false for the day after a holiday', () => {
      const dayAfter = new Date(2024, 6, 5); // July 5, 2024
      expect(isFederalHoliday(dayAfter)).toBe(false);
    });
  });

  describe('filterHolidays', () => {
    it('should remove holidays when includeHolidays is false', () => {
      const dates = [
        new Date(2024, 6, 3),  // July 3
        new Date(2024, 6, 4),  // July 4 (HOLIDAY)
        new Date(2024, 6, 5),  // July 5
        new Date(2024, 11, 24), // December 24
        new Date(2024, 11, 25), // December 25 (HOLIDAY)
      ];

      const filtered = filterHolidays(dates, false);
      
      expect(filtered).toHaveLength(3);
      expect(filtered).not.toContainEqual(new Date(2024, 6, 4));
      expect(filtered).not.toContainEqual(new Date(2024, 11, 25));
    });

    it('should keep all dates when includeHolidays is true', () => {
      const dates = [
        new Date(2024, 6, 3),
        new Date(2024, 6, 4),  // July 4 (HOLIDAY)
        new Date(2024, 6, 5),
      ];

      const filtered = filterHolidays(dates, true);
      
      expect(filtered).toHaveLength(3);
      expect(filtered).toContainEqual(dates[1]); // July 4 included
    });

    it('should handle empty array', () => {
      const filtered = filterHolidays([], false);
      expect(filtered).toHaveLength(0);
    });

    it('should handle array with no holidays', () => {
      const dates = [
        new Date(2024, 5, 10),
        new Date(2024, 5, 11),
        new Date(2024, 5, 12),
      ];

      const filtered = filterHolidays(dates, false);
      
      expect(filtered).toHaveLength(3);
    });
  });

  describe('getHolidaysInRange', () => {
    it('should return holidays within a date range', () => {
      const start = new Date(2024, 6, 1);  // July 1, 2024
      const end = new Date(2024, 6, 31);    // July 31, 2024

      const holidays = getHolidaysInRange(start, end);
      
      expect(holidays).toHaveLength(1);
      expect(holidays[0]?.getMonth()).toBe(6); // July
      expect(holidays[0]?.getDate()).toBe(4);  // 4th
    });

    it('should return multiple holidays in a longer range', () => {
      const start = new Date(2024, 10, 1);  // November 1, 2024
      const end = new Date(2024, 11, 31);   // December 31, 2024

      const holidays = getHolidaysInRange(start, end);
      
      expect(holidays).toHaveLength(3); // Veterans Day, Thanksgiving, Christmas
    });

    it('should return empty array when no holidays in range', () => {
      const start = new Date(2024, 7, 1);  // August 1, 2024
      const end = new Date(2024, 7, 31);   // August 31, 2024

      const holidays = getHolidaysInRange(start, end);
      
      expect(holidays).toHaveLength(0);
    });

    it('should handle ranges spanning multiple years', () => {
      const start = new Date(2024, 11, 1);  // December 1, 2024
      const end = new Date(2025, 1, 28);    // February 28, 2025

      const holidays = getHolidaysInRange(start, end);
      
      // Should include: Christmas 2024, New Year's 2025, MLK Day 2025, Presidents Day 2025
      expect(holidays.length).toBeGreaterThanOrEqual(4);
    });

    it('should return holidays in chronological order', () => {
      const start = new Date(2024, 0, 1);   // January 1, 2024
      const end = new Date(2024, 11, 31);   // December 31, 2024

      const holidays = getHolidaysInRange(start, end);
      
      // Verify chronological order
      for (let i = 1; i < holidays.length; i++) {
        expect(holidays[i]?.getTime()).toBeGreaterThan(holidays[i - 1]?.getTime() ?? 0);
      }
    });
  });
});
