/**
 * Timezone hook for web application
 *
 * Provides timezone utilities for displaying dates and times in the user's preferred timezone.
 * Uses the organization/agency timezone by default, or falls back to browser's timezone.
 */

import { useMemo } from 'react';
import { TimezoneUtils } from '@care-commons/core/browser';
import { useAuth } from './auth';

export interface UseTimezoneResult {
  /**
   * The current timezone (IANA format)
   */
  timezone: string;

  /**
   * Format a date/time in the current timezone
   * @param date - Date object or ISO string
   * @param format - Luxon format string (default: 'yyyy-MM-dd HH:mm:ss')
   */
  formatDateTime: (date: Date | string, format?: string) => string;

  /**
   * Convert a UTC date to the current timezone
   * @param utcDate - UTC Date object or ISO string
   * @returns Date in current timezone
   */
  toLocal: (utcDate: Date | string) => Date;

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
 * Hook to access timezone utilities
 *
 * Priority:
 * 1. User's organization/agency timezone (from auth context)
 * 2. Browser's detected timezone (Intl API)
 * 3. Default to 'America/Chicago' (Central Time)
 *
 * @example
 * ```tsx
 * const VisitCard = ({ visit }) => {
 *   const { formatDateTime, timezone } = useTimezone();
 *
 *   return (
 *     <div>
 *       <p>Scheduled: {formatDateTime(visit.scheduled_start, 'MMM d, h:mm a')}</p>
 *       <p className="text-sm text-gray-500">({timezone})</p>
 *     </div>
 *   );
 * };
 * ```
 */
export const useTimezone = (): UseTimezoneResult => {
  const { user } = useAuth();

  // Determine timezone priority: organization > browser > default
  const timezone = useMemo(() => {
    // @ts-expect-error - organization may have timezone field added by migration
    const orgTimezone = user?.organization?.timezone;
    if (orgTimezone && TimezoneUtils.isValidTimezone(orgTimezone)) {
      return orgTimezone;
    }

    // Fall back to browser timezone
    try {
      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (browserTimezone && TimezoneUtils.isValidTimezone(browserTimezone)) {
        return browserTimezone;
      }
    } catch (error) {
      console.warn('Could not detect browser timezone:', error);
    }

    // Default to Central Time
    return 'America/Chicago';
  }, [user]);

  const formatDateTime = (date: Date | string, format?: string) => {
    return TimezoneUtils.format(date, timezone, format);
  };

  const toLocal = (utcDate: Date | string) => {
    return TimezoneUtils.fromUTC(utcDate, timezone).toJSDate();
  };

  const getAbbreviation = () => {
    return TimezoneUtils.getAbbreviation(timezone);
  };

  const getOffset = () => {
    return TimezoneUtils.getOffset(timezone);
  };

  return {
    timezone,
    formatDateTime,
    toLocal,
    getAbbreviation,
    getOffset,
  };
};
