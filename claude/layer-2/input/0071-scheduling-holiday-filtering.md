# Task 0071: Scheduling Holiday Filtering Implementation

**Priority:** 🟡 MEDIUM
**Estimated Effort:** 2-3 days
**Vertical:** scheduling-visits
**Type:** Feature Completion

---

## Context

The scheduling service has a TODO comment for holiday filtering:

```typescript
// verticals/scheduling-visits/src/service/schedule-service.ts:564
TODO: Filter holidays if skipHolidays is true
```

Currently, the `generateRecurringVisits()` method creates visits on all dates matching the recurrence pattern, even if those dates are holidays. This can result in visits being scheduled on:
- National holidays (Christmas, Thanksgiving, etc.)
- State-specific holidays
- Agency-defined non-working days

Coordinators must manually delete these visits or reschedule them, which is time-consuming and error-prone.

---

## Objectives

Implement holiday filtering to:
1. Skip holidays when generating recurring visits
2. Support multiple holiday calendars (national, state, agency)
3. Allow optional inclusion of holidays per visit series
4. Provide holiday override capability

---

## Technical Requirements

### 1. Holiday Calendar Schema

**Migration:** `packages/core/migrations/027_holiday_calendars.sql`

```sql
-- Holiday calendar definitions
CREATE TABLE holiday_calendars (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  calendar_type VARCHAR(20) NOT NULL, -- 'national', 'state', 'agency'
  state_code VARCHAR(2), -- For state-specific calendars (TX, FL, etc.)
  organization_id INTEGER REFERENCES organizations(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual holidays
CREATE TABLE holidays (
  id SERIAL PRIMARY KEY,
  calendar_id INTEGER NOT NULL REFERENCES holiday_calendars(id),
  name VARCHAR(100) NOT NULL,
  holiday_date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT false, -- If true, repeats annually
  recurrence_pattern JSONB, -- For complex patterns (e.g., "4th Thursday of November")
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_holidays_calendar ON holidays(calendar_id);
CREATE INDEX idx_holidays_date ON holidays(holiday_date);

-- Link calendars to branches
CREATE TABLE branch_holiday_calendars (
  branch_id INTEGER NOT NULL REFERENCES branches(id),
  calendar_id INTEGER NOT NULL REFERENCES holiday_calendars(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (branch_id, calendar_id)
);
```

### 2. Seed Data for Common Holidays

**Seed File:** `packages/core/seeds/holidays.ts`

```typescript
export async function seedHolidays(database: Database) {
  // Create national US calendar
  const [nationalCalendar] = await database.query(
    `INSERT INTO holiday_calendars (name, calendar_type, description)
     VALUES ($1, $2, $3)
     RETURNING id`,
    ['US National Holidays', 'national', 'Federal holidays observed nationwide']
  );

  const nationalId = nationalCalendar.rows[0].id;

  // Fixed date holidays
  const fixedHolidays = [
    { name: 'New Year\'s Day', month: 1, day: 1 },
    { name: 'Independence Day', month: 7, day: 4 },
    { name: 'Veterans Day', month: 11, day: 11 },
    { name: 'Christmas Day', month: 12, day: 25 },
  ];

  for (const holiday of fixedHolidays) {
    await database.query(
      `INSERT INTO holidays (calendar_id, name, holiday_date, is_recurring, recurrence_pattern)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        nationalId,
        holiday.name,
        `2025-${String(holiday.month).padStart(2, '0')}-${String(holiday.day).padStart(2, '0')}`,
        true,
        JSON.stringify({ type: 'fixed', month: holiday.month, day: holiday.day }),
      ]
    );
  }

  // Floating holidays (rules-based)
  const floatingHolidays = [
    {
      name: 'Martin Luther King Jr. Day',
      pattern: { type: 'nth_weekday', month: 1, nth: 3, weekday: 1 }, // 3rd Monday of January
    },
    {
      name: 'Presidents\' Day',
      pattern: { type: 'nth_weekday', month: 2, nth: 3, weekday: 1 }, // 3rd Monday of February
    },
    {
      name: 'Memorial Day',
      pattern: { type: 'last_weekday', month: 5, weekday: 1 }, // Last Monday of May
    },
    {
      name: 'Labor Day',
      pattern: { type: 'nth_weekday', month: 9, nth: 1, weekday: 1 }, // 1st Monday of September
    },
    {
      name: 'Thanksgiving Day',
      pattern: { type: 'nth_weekday', month: 11, nth: 4, weekday: 4 }, // 4th Thursday of November
    },
  ];

  for (const holiday of floatingHolidays) {
    const date = calculateHolidayDate(2025, holiday.pattern);

    await database.query(
      `INSERT INTO holidays (calendar_id, name, holiday_date, is_recurring, recurrence_pattern)
       VALUES ($1, $2, $3, $4, $5)`,
      [nationalId, holiday.name, date.toISOString().split('T')[0], true, JSON.stringify(holiday.pattern)]
    );
  }

  // State-specific calendars
  // Texas
  const [texasCalendar] = await database.query(
    `INSERT INTO holiday_calendars (name, calendar_type, state_code, description)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    ['Texas State Holidays', 'state', 'TX', 'Texas-specific holidays']
  );

  await database.query(
    `INSERT INTO holidays (calendar_id, name, holiday_date, is_recurring, recurrence_pattern)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      texasCalendar.rows[0].id,
      'Texas Independence Day',
      '2025-03-02',
      true,
      JSON.stringify({ type: 'fixed', month: 3, day: 2 }),
    ]
  );

  // Florida
  const [floridaCalendar] = await database.query(
    `INSERT INTO holiday_calendars (name, calendar_type, state_code, description)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    ['Florida State Holidays', 'state', 'FL', 'Florida-specific holidays']
  );

  // Add Florida-specific holidays as needed
}

function calculateHolidayDate(year: number, pattern: any): Date {
  if (pattern.type === 'nth_weekday') {
    return getNthWeekdayOfMonth(year, pattern.month, pattern.nth, pattern.weekday);
  } else if (pattern.type === 'last_weekday') {
    return getLastWeekdayOfMonth(year, pattern.month, pattern.weekday);
  }
  throw new Error('Unknown pattern type');
}

function getNthWeekdayOfMonth(
  year: number,
  month: number,
  nth: number,
  weekday: number
): Date {
  const firstDay = new Date(year, month - 1, 1);
  const firstWeekday = firstDay.getDay();

  // Calculate offset to first occurrence of target weekday
  let offset = (weekday - firstWeekday + 7) % 7;

  // Add (nth - 1) weeks
  offset += (nth - 1) * 7;

  return new Date(year, month - 1, 1 + offset);
}

function getLastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
  // Start with last day of month
  const lastDay = new Date(year, month, 0);
  const lastWeekday = lastDay.getDay();

  // Calculate days to subtract to get to target weekday
  let offset = (lastWeekday - weekday + 7) % 7;

  return new Date(year, month, 0 - offset);
}
```

---

### 3. Holiday Service

**File:** `packages/core/src/services/holiday-service.ts`

```typescript
export interface IHolidayService {
  isHoliday(date: Date, branchId: number): Promise<boolean>;
  getHolidays(startDate: Date, endDate: Date, branchId: number): Promise<Holiday[]>;
  getHolidaysForYear(year: number, branchId: number): Promise<Holiday[]>;
}

export class HolidayService implements IHolidayService {
  constructor(private database: Database) {}

  /**
   * Check if a given date is a holiday for a branch
   */
  async isHoliday(date: Date, branchId: number): Promise<boolean> {
    const holidays = await this.getHolidays(date, date, branchId);
    return holidays.length > 0;
  }

  /**
   * Get all holidays in a date range for a branch
   */
  async getHolidays(
    startDate: Date,
    endDate: Date,
    branchId: number
  ): Promise<Holiday[]> {
    // Get calendars for this branch
    const query = `
      SELECT DISTINCT h.*
      FROM holidays h
      JOIN branch_holiday_calendars bhc ON h.calendar_id = bhc.calendar_id
      WHERE bhc.branch_id = $1
        AND h.holiday_date >= $2
        AND h.holiday_date <= $3
      ORDER BY h.holiday_date
    `;

    const result = await this.database.query(query, [
      branchId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
    ]);

    return result.rows;
  }

  /**
   * Get all holidays for a year (including recurring)
   */
  async getHolidaysForYear(year: number, branchId: number): Promise<Holiday[]> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const holidays = await this.getHolidays(startDate, endDate, branchId);

    // Expand recurring holidays for this year
    const expandedHolidays: Holiday[] = [];

    for (const holiday of holidays) {
      if (holiday.is_recurring && holiday.recurrence_pattern) {
        const date = this.calculateRecurringDate(year, holiday.recurrence_pattern);
        expandedHolidays.push({
          ...holiday,
          holiday_date: date,
        });
      } else {
        expandedHolidays.push(holiday);
      }
    }

    return expandedHolidays.sort((a, b) => a.holiday_date.getTime() - b.holiday_date.getTime());
  }

  private calculateRecurringDate(year: number, pattern: RecurrencePattern): Date {
    // Use same logic as seedHolidays
    if (pattern.type === 'fixed') {
      return new Date(year, pattern.month - 1, pattern.day);
    } else if (pattern.type === 'nth_weekday') {
      return getNthWeekdayOfMonth(year, pattern.month, pattern.nth, pattern.weekday);
    } else if (pattern.type === 'last_weekday') {
      return getLastWeekdayOfMonth(year, pattern.month, pattern.weekday);
    }

    throw new Error(`Unknown recurrence pattern type: ${pattern.type}`);
  }
}
```

---

### 4. Update Schedule Service

**File:** `verticals/scheduling-visits/src/service/schedule-service.ts`

**Replace TODO at line 564:**

```typescript
async generateRecurringVisits(
  recurrenceData: RecurrenceData,
  options: { skipHolidays?: boolean } = {}
): Promise<Visit[]> {
  const { skipHolidays = false } = options;

  // ... existing code to calculate dates based on recurrence pattern ...

  const visits: Visit[] = [];

  for (const date of occurrenceDates) {
    // NEW: Filter holidays if requested
    if (skipHolidays) {
      const isHoliday = await this.holidayService.isHoliday(
        date,
        recurrenceData.branchId
      );

      if (isHoliday) {
        console.log(`Skipping holiday: ${date.toISOString()}`);
        continue; // Skip this date
      }
    }

    // Create visit for this date
    const visit = await this.createVisit({
      clientId: recurrenceData.clientId,
      serviceId: recurrenceData.serviceId,
      scheduledStartTime: this.combineDateTime(date, recurrenceData.startTime),
      scheduledEndTime: this.combineDateTime(date, recurrenceData.endTime),
      recurrenceId: recurrenceData.recurrenceId,
    });

    visits.push(visit);
  }

  return visits;
}
```

---

### 5. Update Visit Creation UI

**File:** `packages/web/src/verticals/scheduling/components/RecurringVisitForm.tsx`

Add checkbox for holiday filtering:

```tsx
export function RecurringVisitForm() {
  const [skipHolidays, setSkipHolidays] = useState(true);

  return (
    <form>
      {/* ... existing fields ... */}

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={skipHolidays}
          onChange={e => setSkipHolidays(e.target.checked)}
        />
        <span>Skip holidays</span>
      </label>

      {skipHolidays && (
        <div className="ml-6 text-sm text-gray-600">
          <p>The following holidays will be skipped:</p>
          <HolidayPreview
            startDate={form.startDate}
            endDate={form.endDate}
            branchId={form.branchId}
          />
        </div>
      )}

      {/* ... submit button ... */}
    </form>
  );
}

function HolidayPreview({ startDate, endDate, branchId }) {
  const { data: holidays } = useQuery({
    queryKey: ['holidays', startDate, endDate, branchId],
    queryFn: () => holidayApi.getHolidays(startDate, endDate, branchId),
  });

  if (!holidays || holidays.length === 0) {
    return <p className="text-green-600">✓ No holidays in this period</p>;
  }

  return (
    <ul className="mt-2 space-y-1">
      {holidays.map(h => (
        <li key={h.id}>
          • {h.name} ({formatDate(h.holiday_date)})
        </li>
      ))}
    </ul>
  );
}
```

---

### 6. Admin UI for Holiday Management

**File:** `packages/web/src/verticals/scheduling/pages/HolidayManagement.tsx`

```tsx
export function HolidayManagementPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: calendars } = useQuery({
    queryKey: ['holiday-calendars'],
    queryFn: holidayApi.getCalendars,
  });

  const { data: holidays } = useQuery({
    queryKey: ['holidays', selectedYear],
    queryFn: () => holidayApi.getHolidaysForYear(selectedYear),
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Holiday Management</h1>

      <div className="grid grid-cols-3 gap-6">
        {/* Calendar selection */}
        <Card>
          <h2 className="font-semibold mb-4">Active Calendars</h2>
          {calendars?.map(cal => (
            <label key={cal.id} className="flex items-center gap-2">
              <input type="checkbox" checked={cal.is_active} />
              <span>{cal.name}</span>
            </label>
          ))}
        </Card>

        {/* Holiday list */}
        <Card className="col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Holidays {selectedYear}</h2>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <table className="w-full">
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Calendar</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {holidays?.map(h => (
                <tr key={h.id}>
                  <td>{formatDate(h.holiday_date)}</td>
                  <td>{h.name}</td>
                  <td>{h.calendar_name}</td>
                  <td>
                    <Button size="sm" variant="ghost">Edit</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Button className="mt-4">Add Holiday</Button>
        </Card>
      </div>
    </div>
  );
}
```

---

## API Endpoints

**File:** `packages/app/routes/holidays.ts`

```typescript
router.get('/holidays', async (req, res) => {
  const { startDate, endDate, branchId } = req.query;

  const holidays = await holidayService.getHolidays(
    new Date(startDate as string),
    new Date(endDate as string),
    Number(branchId)
  );

  res.json(holidays);
});

router.get('/holiday-calendars', async (req, res) => {
  const calendars = await holidayService.getCalendars();
  res.json(calendars);
});
```

---

## Testing

```typescript
describe('Holiday Filtering', () => {
  it('should skip holidays when generating recurring visits', async () => {
    // Create recurring visit for Jan-Dec 2025, weekly
    const visits = await scheduleService.generateRecurringVisits({
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      pattern: 'weekly',
      skipHolidays: true,
    });

    const visitDates = visits.map(v => v.scheduledStartTime);

    // Should NOT include Christmas
    expect(visitDates).not.toContainEqual(expect.objectContaining({
      month: 11, // December (0-indexed)
      date: 25,
    }));

    // Should NOT include Thanksgiving (4th Thursday of November)
    // 2025 Thanksgiving is Nov 27
    expect(visitDates).not.toContainEqual(new Date('2025-11-27'));
  });

  it('should include holidays when skipHolidays is false', async () => {
    const visits = await scheduleService.generateRecurringVisits({
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      pattern: 'daily',
      skipHolidays: false,
    });

    const visitDates = visits.map(v => v.scheduledStartTime.toISOString().split('T')[0]);

    // Should include Christmas
    expect(visitDates).toContain('2025-12-25');
  });
});
```

---

## Success Criteria

- [ ] Holiday calendar schema created and migrated
- [ ] US federal holidays seeded
- [ ] State-specific holidays seeded (TX, FL)
- [ ] Holiday service implemented
- [ ] Schedule service updated to filter holidays
- [ ] UI checkbox for "Skip holidays" added
- [ ] Holiday preview shown in form
- [ ] Admin UI for holiday management complete
- [ ] Tests passing
- [ ] Documentation updated

---

## Future Enhancements

- Import holidays from external APIs (Google Calendar, iCal)
- Custom holidays per organization
- Half-day holidays
- Holiday pay rate adjustments
- Automatic rescheduling of holiday visits

---

## Related Tasks

- Task 0022: Fix Scheduling Service Placeholder Addresses (already resolved)
