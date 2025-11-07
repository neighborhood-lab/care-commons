/**
 * Timezone hook for mobile application
 *
 * Provides timezone utilities for displaying dates and times in the device's local timezone.
 * Mobile apps typically use the device's timezone for display, with server communication in UTC.
 */

import { useEffect, useState, useCallback } from 'react';
import { TimezoneUtils } from '@care-commons/core';
import * as Localization from 'expo-localization';

export interface UseTimezoneResult {
  /**
   * The current device timezone (IANA format)
   */
  timezone: string;

  /**
   * Format a date/time in the current timezone
   * @param date - Date object or ISO string
   * @param format - Luxon format string (default: 'yyyy-MM-dd HH:mm:ss')
   */
  formatDateTime: (date: Date | string, format?: string) => string;

  /**
   * Convert a UTC date to the device's local timezone
   * @param utcDate - UTC Date object or ISO string
   * @returns Date in device's timezone
   */
  toLocal: (utcDate: Date | string) => Date;

  /**
   * Convert a local date to UTC for API submission
   * @param localDate - Local Date object or ISO string
   * @returns UTC Date
   */
  toUTC: (localDate: Date | string) => Date;

  /**
   * Get timezone abbreviation (e.g., 'CST', 'EST')
   */
  getAbbreviation: () => string;

  /**
   * Get timezone offset (e.g., '-06:00')
   */
  getOffset: () => string;
}

/**
 * Hook to access timezone utilities for mobile devices
 *
 * Uses the device's timezone from expo-localization. Automatically updates
 * if the user travels to a different timezone.
 *
 * @example
 * ```tsx
 * const VisitCard = ({ visit }) => {
 *   const { formatDateTime, timezone } = useTimezone();
 *
 *   return (
 *     <View>
 *       <Text>Scheduled: {formatDateTime(visit.scheduled_start, 'MMM d, h:mm a')}</Text>
 *       <Text style={styles.subtitle}>({timezone})</Text>
 *     </View>
 *   );
 * };
 * ```
 */
export const useTimezone = (): UseTimezoneResult => {
  // Get device timezone, with fallback
  const [timezone, setTimezone] = useState<string>(() => {
    const deviceTimezone = Localization.timezone;
    if (deviceTimezone && TimezoneUtils.isValidTimezone(deviceTimezone)) {
      return deviceTimezone;
    }
    return 'America/Chicago'; // Default fallback
  });

  // Listen for timezone changes (e.g., user travels to different timezone)
  useEffect(() => {
    const subscription = Localization.addLocalizationChangeListener(() => {
      const newTimezone = Localization.timezone;
      if (newTimezone && TimezoneUtils.isValidTimezone(newTimezone)) {
        setTimezone(newTimezone);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const formatDateTime = useCallback(
    (date: Date | string, format?: string) => {
      return TimezoneUtils.format(date, timezone, format);
    },
    [timezone]
  );

  const toLocal = useCallback(
    (utcDate: Date | string) => {
      return TimezoneUtils.fromUTC(utcDate, timezone).toJSDate();
    },
    [timezone]
  );

  const toUTC = useCallback(
    (localDate: Date | string) => {
      return TimezoneUtils.toUTC(localDate, timezone);
    },
    [timezone]
  );

  const getAbbreviation = useCallback(() => {
    return TimezoneUtils.getAbbreviation(timezone);
  }, [timezone]);

  const getOffset = useCallback(() => {
    return TimezoneUtils.getOffset(timezone);
  }, [timezone]);

  return {
    timezone,
    formatDateTime,
    toLocal,
    toUTC,
    getAbbreviation,
    getOffset,
  };
};
