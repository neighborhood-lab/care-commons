import { DateTime } from 'luxon';

/**
 * Timezone utility functions for handling timezone conversions across the platform
 *
 * This utility uses Luxon for timezone-aware date operations. All dates should be:
 * - Stored in UTC in the database
 * - Converted to appropriate timezones for display
 * - Include timezone context when ambiguous
 */
export class TimezoneUtils {
  /**
   * Convert a date/time from one timezone to another
   */
  static convert(
    dateTime: Date | string,
    fromTimezone: string,
    toTimezone: string
  ): DateTime {
    return DateTime.fromJSDate(new Date(dateTime), { zone: fromTimezone })
      .setZone(toTimezone);
  }

  /**
   * Convert to UTC for storage
   */
  static toUTC(dateTime: Date | string, timezone: string): Date {
    return DateTime.fromJSDate(new Date(dateTime), { zone: timezone })
      .toUTC()
      .toJSDate();
  }

  /**
   * Convert from UTC to specific timezone for display
   */
  static fromUTC(utcDateTime: Date | string, timezone: string): DateTime {
    return DateTime.fromJSDate(new Date(utcDateTime), { zone: 'UTC' })
      .setZone(timezone);
  }

  /**
   * Format a date/time in specific timezone
   */
  static format(
    dateTime: Date | string,
    timezone: string,
    format: string = 'yyyy-MM-dd HH:mm:ss'
  ): string {
    return DateTime.fromJSDate(new Date(dateTime), { zone: timezone })
      .toFormat(format);
  }

  /**
   * Get current time in specific timezone
   */
  static now(timezone: string): DateTime {
    return DateTime.now().setZone(timezone);
  }

  /**
   * Validate timezone string (IANA format)
   */
  static isValidTimezone(timezone: string): boolean {
    if (timezone === '') return false;
    try {
      const dt = DateTime.now().setZone(timezone);
      // Check if the DateTime is valid and the zone name matches
      // Luxon returns the system zone if the timezone is invalid
      return dt.isValid && dt.zoneName === timezone;
    } catch {
      return false;
    }
  }

  /**
   * Get timezone offset from UTC
   */
  static getOffset(timezone: string): string {
    const dt = DateTime.now().setZone(timezone);
    return dt.toFormat('ZZ'); // e.g., "-06:00"
  }

  /**
   * Get timezone abbreviation (e.g., "CST", "EST")
   */
  static getAbbreviation(timezone: string): string {
    const dt = DateTime.now().setZone(timezone);
    return dt.toFormat('ZZZZ'); // e.g., "CST"
  }

  /**
   * Parse a local time string in specific timezone to UTC
   */
  static parseInTimezone(
    timeString: string,
    timezone: string,
    format: string = 'yyyy-MM-dd HH:mm:ss'
  ): Date {
    return DateTime.fromFormat(timeString, format, { zone: timezone })
      .toUTC()
      .toJSDate();
  }

  /**
   * Get the timezone abbreviation with offset for display
   * e.g., "CST (UTC-6)" or "EDT (UTC-4)"
   */
  static getDisplayName(timezone: string): string {
    const dt = DateTime.now().setZone(timezone);
    const abbr = dt.toFormat('ZZZZ');
    const offset = dt.toFormat('ZZ');
    return `${abbr} (UTC${offset})`;
  }

  /**
   * Check if a timezone observes DST
   */
  static observesDST(timezone: string): boolean {
    const january = DateTime.fromObject({ month: 1, day: 1 }, { zone: timezone });
    const july = DateTime.fromObject({ month: 7, day: 1 }, { zone: timezone });
    return january.offset !== july.offset;
  }

  /**
   * Get list of common US timezones with labels
   */
  static getCommonUSTimezones(): Array<{ value: string; label: string }> {
    return [
      { value: 'America/New_York', label: 'Eastern Time (ET)' },
      { value: 'America/Chicago', label: 'Central Time (CT)' },
      { value: 'America/Denver', label: 'Mountain Time (MT)' },
      { value: 'America/Phoenix', label: 'Arizona Time (no DST)' },
      { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
      { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
      { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' }
    ];
  }
}
