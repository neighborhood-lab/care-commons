/**
 * Date utility functions for consistent date handling across the application
 */

import { format, parseISO, addDays, differenceInMinutes, isWeekend } from 'date-fns';

export class DateUtils {
  /**
   * Format a date to a string with a specified format
   * @param date - Date object or ISO string
   * @param formatStr - Format string (default: 'yyyy-MM-dd')
   * @returns Formatted date string
   */
  static formatDate(date: Date | string, formatStr = 'yyyy-MM-dd'): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  }

  /**
   * Format a date and time to a string
   * @param date - Date object or ISO string
   * @returns Formatted datetime string (yyyy-MM-dd HH:mm:ss)
   */
  static formatDateTime(date: Date | string): string {
    return this.formatDate(date, 'yyyy-MM-dd HH:mm:ss');
  }

  /**
   * Format time only
   * @param date - Date object or ISO string
   * @returns Formatted time string (HH:mm)
   */
  static formatTime(date: Date | string): string {
    return this.formatDate(date, 'HH:mm');
  }

  /**
   * Add business days to a date (skipping weekends)
   * @param date - Starting date
   * @param days - Number of business days to add
   * @returns New date with business days added
   */
  static addBusinessDays(date: Date, days: number): Date {
    let result = new Date(date);
    // Normalize to noon to avoid timezone boundary issues
    result.setHours(12, 0, 0, 0);
    let addedDays = 0;

    while (addedDays < days) {
      result = addDays(result, 1);
      if (!isWeekend(result)) {
        addedDays++;
      }
    }

    return result;
  }

  /**
   * Check if actual time is within tolerance of expected time
   * @param actual - Actual date/time
   * @param expected - Expected date/time
   * @param toleranceMinutes - Tolerance in minutes
   * @returns True if within tolerance
   */
  static isWithinTolerance(
    actual: Date,
    expected: Date,
    toleranceMinutes: number
  ): boolean {
    const diffMinutes = Math.abs(differenceInMinutes(actual, expected));
    return diffMinutes <= toleranceMinutes;
  }

  /**
   * Get array of dates between start and end (inclusive)
   * @param start - Start date
   * @param end - End date
   * @returns Array of dates
   */
  static getDateRange(start: Date, end: Date): Date[] {
    const dates: Date[] = [];
    let current = new Date(start);
    // Normalize to noon to avoid timezone boundary issues
    current.setHours(12, 0, 0, 0);

    const endNormalized = new Date(end);
    endNormalized.setHours(12, 0, 0, 0);

    while (current <= endNormalized) {
      dates.push(new Date(current));
      current = addDays(current, 1);
    }

    return dates;
  }

  /**
   * Parse ISO string to Date, returning null if invalid
   * @param dateString - ISO date string
   * @returns Date object or null
   */
  static parseISOSafe(dateString: string | null | undefined): Date | null {
    if (dateString === null || dateString === undefined || dateString === '') {
      return null;
    }
    try {
      const parsed = parseISO(dateString);
      // Check if the parsed date is valid
      if (Number.isNaN(parsed.getTime())) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  /**
   * Check if a date is in the past
   * @param date - Date to check
   * @returns True if date is in the past
   */
  static isPast(date: Date): boolean {
    return date < new Date();
  }

  /**
   * Check if a date is in the future
   * @param date - Date to check
   * @returns True if date is in the future
   */
  static isFuture(date: Date): boolean {
    return date > new Date();
  }

  /**
   * Get start of day (00:00:00)
   * @param date - Date
   * @returns Date at start of day
   */
  static startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Get end of day (23:59:59.999)
   * @param date - Date
   * @returns Date at end of day
   */
  static endOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }
}
