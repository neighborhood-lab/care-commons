# Task 0023: Timezone Handling Standardization Across Platform

**Priority**: 🔴 CRITICAL
**Phase**: Phase 1 - Production Readiness
**Estimated Effort**: 4-6 hours

## Context

Home healthcare agencies operate across multiple timezones, and caregivers/clients may be in different timezones than the agency. Inconsistent timezone handling causes scheduling errors, payroll mistakes, and compliance issues.

## Problem Statement

**Current Issues**:
- Timestamps stored inconsistently (some local, some UTC)
- No timezone information stored with visits
- Mobile app doesn't handle timezone conversions
- Scheduled times ambiguous (coordinator's timezone vs client's timezone)
- EVV timestamps may be incorrect timezone

**Impact**:
- Visits scheduled at wrong times
- Payroll calculations incorrect
- Compliance reporting failures
- Caregiver confusion about visit times
- Family portal shows wrong times

## Task

### 1. Database Schema Updates

Add timezone columns to relevant tables:

**Migration**: `migrations/YYYYMMDDHHMMSS_add_timezone_columns.ts`

```typescript
export async function up(knex: Knex): Promise<void> {
  // Clients table - store client's timezone
  await knex.schema.alterTable('clients', (table) => {
    table.string('timezone', 100).defaultTo('America/Chicago');
    table.comment('Client timezone (IANA format: America/New_York)');
  });

  // Caregivers table - store caregiver's home timezone
  await knex.schema.alterTable('caregivers', (table) => {
    table.string('timezone', 100).defaultTo('America/Chicago');
  });

  // Agencies table - store agency's primary timezone
  await knex.schema.alterTable('agencies', (table) => {
    table.string('timezone', 100).defaultTo('America/Chicago');
  });

  // Visits table - store the timezone for the visit
  await knex.schema.alterTable('visits', (table) => {
    table.string('timezone', 100);
    table.comment('Timezone for this visit (usually client timezone)');
  });

  // Update existing visits to use client's timezone
  await knex.raw(`
    UPDATE visits v
    SET timezone = COALESCE(c.timezone, 'America/Chicago')
    FROM clients c
    WHERE v.client_id = c.id
    AND v.timezone IS NULL
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('clients', (table) => {
    table.dropColumn('timezone');
  });

  await knex.schema.alterTable('caregivers', (table) => {
    table.dropColumn('timezone');
  });

  await knex.schema.alterTable('agencies', (table) => {
    table.dropColumn('timezone');
  });

  await knex.schema.alterTable('visits', (table) => {
    table.dropColumn('timezone');
  });
}
```

### 2. Create Timezone Utility Service

**File**: `packages/core/src/utils/timezone.utils.ts`

```typescript
import { DateTime } from 'luxon';

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
    try {
      DateTime.now().setZone(timezone);
      return true;
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
}
```

### 3. Update Visit Scheduling Logic

**File**: `verticals/scheduling-visits/src/services/schedule.service.ts`

```typescript
import { TimezoneUtils } from '@care-commons/core/utils/timezone.utils';

export class ScheduleService {
  async createVisit(data: CreateVisitInput): Promise<Visit> {
    // Get client to determine timezone
    const client = await this.clientProvider.getClientById(data.client_id);
    if (!client) throw new Error('Client not found');

    const clientTimezone = client.timezone || 'America/Chicago';

    // Parse scheduled start/end in client's timezone, store as UTC
    const scheduledStartUTC = TimezoneUtils.toUTC(
      data.scheduled_start,
      clientTimezone
    );

    const scheduledEndUTC = TimezoneUtils.toUTC(
      data.scheduled_end,
      clientTimezone
    );

    // Create visit with timezone information
    const visit = await this.db('visits').insert({
      ...data,
      scheduled_start: scheduledStartUTC,
      scheduled_end: scheduledEndUTC,
      timezone: clientTimezone, // Store the timezone for this visit
      created_at: new Date(),
      updated_at: new Date()
    }).returning('*');

    return visit[0];
  }

  async getVisitsForCaregiver(
    caregiverId: string,
    date: Date
  ): Promise<VisitWithTimezone[]> {
    const caregiver = await this.caregiverProvider.getCaregiverById(caregiverId);
    const caregiverTimezone = caregiver?.timezone || 'America/Chicago';

    const visits = await this.db('visits')
      .where({ caregiver_id: caregiverId })
      .whereBetween('scheduled_start', [
        startOfDay(date),
        endOfDay(date)
      ]);

    // Convert each visit's times to caregiver's timezone for display
    return visits.map(visit => ({
      ...visit,
      scheduled_start_local: TimezoneUtils.fromUTC(
        visit.scheduled_start,
        visit.timezone
      ).toJSDate(),
      scheduled_end_local: TimezoneUtils.fromUTC(
        visit.scheduled_end,
        visit.timezone
      ).toJSDate(),
      timezone_display: TimezoneUtils.getAbbreviation(visit.timezone)
    }));
  }
}
```

### 4. Update EVV Service

**File**: `packages/app/src/services/evv-service.ts`

```typescript
export class EVVService {
  async checkIn(visitId: string, checkInData: CheckInInput): Promise<EVVRecord> {
    const visit = await this.visitProvider.getVisitById(visitId);
    if (!visit) throw new Error('Visit not found');

    // Record check-in time in UTC (comes from mobile device)
    const checkInTimeUTC = new Date(checkInData.timestamp);

    // Convert to visit's timezone for validation
    const checkInTimeLocal = TimezoneUtils.fromUTC(
      checkInTimeUTC,
      visit.timezone
    );

    const scheduledStartLocal = TimezoneUtils.fromUTC(
      visit.scheduled_start,
      visit.timezone
    );

    // Check if check-in is within allowed window (15 minutes early, 5 minutes late)
    const minutesEarly = scheduledStartLocal.diff(checkInTimeLocal, 'minutes').minutes;

    if (minutesEarly > 15) {
      throw new EVVException(
        'CHECK_IN_TOO_EARLY',
        `Check-in is ${Math.round(minutesEarly)} minutes early (max 15 minutes early)`
      );
    }

    const minutesLate = checkInTimeLocal.diff(scheduledStartLocal, 'minutes').minutes;

    if (minutesLate > 5) {
      // Allow but flag as late
      console.warn(`Late check-in: ${minutesLate} minutes late`);
    }

    // Store EVV record with timezone information
    const evvRecord = await this.db('evv_records').insert({
      visit_id: visitId,
      check_in_time: checkInTimeUTC, // Store in UTC
      check_in_timezone: visit.timezone,
      gps_coordinates: checkInData.gps_coordinates,
      device_timestamp: checkInData.device_timestamp,
      created_at: new Date()
    }).returning('*');

    return evvRecord[0];
  }
}
```

### 5. Update Frontend Timezone Display

**Web UI** - Show times in user's preferred timezone:

```typescript
// packages/web/src/hooks/useTimezone.ts
import { useAuthStore } from '../stores/auth.store';
import { TimezoneUtils } from '@care-commons/core/utils/timezone.utils';

export const useTimezone = () => {
  const user = useAuthStore((state) => state.user);

  // Default to agency timezone, or user's browser timezone
  const timezone = user?.agency?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  const formatDateTime = (date: Date | string, format?: string) => {
    return TimezoneUtils.format(date, timezone, format);
  };

  const toLocal = (utcDate: Date | string) => {
    return TimezoneUtils.fromUTC(utcDate, timezone).toJSDate();
  };

  return { timezone, formatDateTime, toLocal };
};

// Usage in components
const VisitCard = ({ visit }) => {
  const { formatDateTime, timezone } = useTimezone();

  return (
    <div>
      <p>Scheduled: {formatDateTime(visit.scheduled_start, 'MMM d, h:mm a')}</p>
      <p className="text-sm text-gray-500">
        ({TimezoneUtils.getAbbreviation(timezone)})
      </p>
    </div>
  );
};
```

**Mobile App** - Use device's local timezone:

```typescript
// packages/mobile/src/hooks/useTimezone.ts
import { useEffect, useState } from 'react';
import * as Localization from 'expo-localization';
import { TimezoneUtils } from '@care-commons/core/utils/timezone.utils';

export const useTimezone = () => {
  const [timezone, setTimezone] = useState(Localization.timezone);

  useEffect(() => {
    // Update if timezone changes (e.g., user travels)
    const subscription = Localization.addLocalizationChangeListener((event) => {
      setTimezone(event.timezone);
    });

    return () => subscription.remove();
  }, []);

  const formatDateTime = (date: Date | string, format?: string) => {
    return TimezoneUtils.format(date, timezone, format);
  };

  return { timezone, formatDateTime };
};
```

### 6. Add Timezone Selector UI

**Client Form** (`packages/web/src/components/forms/ClientForm.tsx`):

```typescript
import timezones from 'timezones-list';

const COMMON_US_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Phoenix', label: 'Arizona Time (no DST)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' }
];

<Select
  label="Timezone"
  name="timezone"
  options={COMMON_US_TIMEZONES}
  defaultValue="America/Chicago"
/>
```

### 7. Update API Responses

Include timezone information in API responses:

```typescript
// Transform visit for API response
const transformVisit = (visit: Visit, userTimezone: string) => {
  return {
    ...visit,
    scheduled_start_utc: visit.scheduled_start,
    scheduled_start_local: TimezoneUtils.fromUTC(
      visit.scheduled_start,
      visit.timezone
    ).toISO(),
    scheduled_start_user: TimezoneUtils.fromUTC(
      visit.scheduled_start,
      userTimezone
    ).toISO(),
    timezone: visit.timezone,
    timezone_abbr: TimezoneUtils.getAbbreviation(visit.timezone)
  };
};
```

### 8. Add Timezone Tests

```typescript
describe('TimezoneUtils', () => {
  it('should convert between timezones correctly', () => {
    const date = new Date('2025-01-15T14:00:00Z'); // 2pm UTC

    const eastern = TimezoneUtils.fromUTC(date, 'America/New_York');
    expect(eastern.hour).toBe(9); // 9am EST

    const pacific = TimezoneUtils.fromUTC(date, 'America/Los_Angeles');
    expect(pacific.hour).toBe(6); // 6am PST
  });

  it('should handle DST transitions correctly', () => {
    // Test date during DST
    const summer = new Date('2025-07-15T14:00:00Z');
    const summerEastern = TimezoneUtils.fromUTC(summer, 'America/New_York');
    expect(summerEastern.hour).toBe(10); // 10am EDT (DST active)

    // Test date during standard time
    const winter = new Date('2025-01-15T14:00:00Z');
    const winterEastern = TimezoneUtils.fromUTC(winter, 'America/New_York');
    expect(winterEastern.hour).toBe(9); // 9am EST (DST not active)
  });
});
```

## Acceptance Criteria

- [ ] Database schema updated with timezone columns
- [ ] Timezone utility service created
- [ ] All timestamps stored in UTC
- [ ] Visit scheduling uses client timezone
- [ ] EVV check-in/out handles timezones correctly
- [ ] Web UI displays times in user's timezone
- [ ] Mobile app uses device timezone
- [ ] Timezone selector in client/caregiver forms
- [ ] API responses include timezone information
- [ ] Tests for timezone conversions
- [ ] DST transitions handled correctly
- [ ] Works across all 7 supported states
- [ ] Migration runs successfully

## Testing Checklist

1. **Scheduling**:
   - Create visit in Eastern timezone, view from Pacific timezone
   - Verify times are correct in both timezones
2. **EVV**:
   - Check in to visit from different timezone than scheduled
   - Verify timestamps are recorded correctly
3. **DST Transitions**:
   - Schedule visit during DST transition
   - Verify no weird hour shifts
4. **Multi-state**:
   - Client in AZ (no DST), caregiver in TX (has DST)
   - Verify scheduling works correctly

## Definition of Done

- ✅ All timestamps stored in UTC
- ✅ Timezone information stored and displayed
- ✅ Conversions work correctly
- ✅ DST handled properly
- ✅ Tests pass
- ✅ Migration successful
- ✅ No timezone-related bugs in production

## Dependencies

**Blocks**: Task 0020 (Production launch)
**Depends on**: None

## Priority Justification

This is **CRITICAL** because:
1. Incorrect scheduling causes missed visits
2. Payroll errors from wrong timestamps
3. Compliance failures
4. Multi-state operations require correct timezone handling
5. Production blocker for national deployment

---

**Next Task**: 0024 - Form Validation Standardization
