import { describe, it, expect } from 'vitest';
import { TimezoneUtils } from '../timezone.utils';

describe('TimezoneUtils', () => {
  describe('timezone conversion', () => {
    it('should convert between timezones correctly', () => {
      const date = new Date('2025-01-15T14:00:00Z'); // 2pm UTC

      const eastern = TimezoneUtils.fromUTC(date, 'America/New_York');
      expect(eastern.hour).toBe(9); // 9am EST (UTC-5 in winter)

      const pacific = TimezoneUtils.fromUTC(date, 'America/Los_Angeles');
      expect(pacific.hour).toBe(6); // 6am PST (UTC-8 in winter)
    });

    it('should convert to UTC correctly', () => {
      const localDate = new Date('2025-01-15T09:00:00'); // 9am local time
      const utcDate = TimezoneUtils.toUTC(localDate, 'America/New_York');

      // 9am EST is 2pm UTC (EST is UTC-5)
      expect(utcDate.getUTCHours()).toBe(14);
    });
  });

  describe('DST transitions', () => {
    it('should handle DST transitions correctly', () => {
      // Test date during DST (summer)
      const summer = new Date('2025-07-15T14:00:00Z');
      const summerEastern = TimezoneUtils.fromUTC(summer, 'America/New_York');
      expect(summerEastern.hour).toBe(10); // 10am EDT (UTC-4 during DST)

      // Test date during standard time (winter)
      const winter = new Date('2025-01-15T14:00:00Z');
      const winterEastern = TimezoneUtils.fromUTC(winter, 'America/New_York');
      expect(winterEastern.hour).toBe(9); // 9am EST (UTC-5 in winter)
    });

    it('should detect DST observation', () => {
      const observesDST = TimezoneUtils.observesDST('America/New_York');
      expect(observesDST).toBe(true);

      const noDST = TimezoneUtils.observesDST('America/Phoenix'); // Arizona doesn't observe DST
      expect(noDST).toBe(false);
    });
  });

  describe('formatting', () => {
    it('should format dates in specific timezone', () => {
      const date = new Date('2025-01-15T14:00:00Z');
      const formatted = TimezoneUtils.format(date, 'America/New_York', 'yyyy-MM-dd HH:mm:ss');

      expect(formatted).toBe('2025-01-15 09:00:00');
    });

    it('should return timezone abbreviations', () => {
      const abbr = TimezoneUtils.getAbbreviation('America/Chicago');
      expect(abbr).toMatch(/CST|CDT/); // Could be CST or CDT depending on date
    });

    it('should return timezone offsets', () => {
      const offset = TimezoneUtils.getOffset('America/Chicago');
      expect(offset).toMatch(/^[+-]\d{2}:\d{2}$/); // Format: +HH:MM or -HH:MM
    });
  });

  describe('validation', () => {
    it('should validate IANA timezone strings', () => {
      expect(TimezoneUtils.isValidTimezone('America/New_York')).toBe(true);
      expect(TimezoneUtils.isValidTimezone('America/Chicago')).toBe(true);
      expect(TimezoneUtils.isValidTimezone('Invalid/Timezone')).toBe(false);
      expect(TimezoneUtils.isValidTimezone('')).toBe(false);
    });
  });

  describe('common US timezones', () => {
    it('should return list of common US timezones', () => {
      const timezones = TimezoneUtils.getCommonUSTimezones();

      expect(timezones.length).toBeGreaterThan(0);
      expect(timezones[0]).toHaveProperty('value');
      expect(timezones[0]).toHaveProperty('label');

      // Check that common timezones are included
      const values = timezones.map(tz => tz.value);
      expect(values).toContain('America/New_York');
      expect(values).toContain('America/Chicago');
      expect(values).toContain('America/Los_Angeles');
    });
  });

  describe('now', () => {
    it('should get current time in specific timezone', () => {
      const now = TimezoneUtils.now('America/New_York');
      expect(now).toBeDefined();
      expect(now.zoneName).toBe('America/New_York');
    });
  });
});
