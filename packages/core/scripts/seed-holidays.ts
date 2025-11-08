/**
 * Seed Holidays Script
 *
 * Creates holiday calendars and holidays for:
 * - US National holidays
 * - State-specific holidays (Texas, Florida)
 *
 * This data is used by the scheduling service to filter holidays
 * when generating recurring visits.
 */

import dotenv from 'dotenv';
import { Database, DatabaseConfig } from '../src/db/connection.js';

dotenv.config({ path: '.env', quiet: true });

interface RecurrencePattern {
  type: 'fixed' | 'nth_weekday' | 'last_weekday';
  month: number;
  day?: number;
  nth?: number;
  weekday?: number;
}

interface Holiday {
  name: string;
  pattern: RecurrencePattern;
}

/**
 * Calculate the date for a holiday based on its recurrence pattern
 */
function calculateHolidayDate(year: number, pattern: RecurrencePattern): Date {
  if (pattern.type === 'fixed') {
    return new Date(year, pattern.month - 1, pattern.day);
  } else if (pattern.type === 'nth_weekday') {
    return getNthWeekdayOfMonth(year, pattern.month, pattern.nth!, pattern.weekday!);
  } else if (pattern.type === 'last_weekday') {
    return getLastWeekdayOfMonth(year, pattern.month, pattern.weekday!);
  }
  throw new Error('Unknown pattern type');
}

/**
 * Get the Nth occurrence of a weekday in a month
 * @param year Year
 * @param month Month (1-12)
 * @param nth Which occurrence (1-5)
 * @param weekday Day of week (0=Sunday, 1=Monday, etc.)
 */
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

/**
 * Get the last occurrence of a weekday in a month
 * @param year Year
 * @param month Month (1-12)
 * @param weekday Day of week (0=Sunday, 1=Monday, etc.)
 */
function getLastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
  // Start with last day of month
  const lastDay = new Date(year, month, 0);
  const lastWeekday = lastDay.getDay();

  // Calculate days to subtract to get to target weekday
  const offset = (lastWeekday - weekday + 7) % 7;

  return new Date(year, month, 0 - offset);
}

async function seedHolidays(db: Database): Promise<void> {
  console.log('Starting holiday seeding...');

  const currentYear = new Date().getFullYear();

  // Create national US calendar
  console.log('Creating US National Holidays calendar...');
  const nationalResult = await db.query(
    `INSERT INTO holiday_calendars (name, calendar_type, description, is_active)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    ['US National Holidays', 'national', 'Federal holidays observed nationwide', true]
  );

  const nationalId = nationalResult.rows[0].id;

  // Fixed date holidays
  const fixedHolidays = [
    { name: 'New Year\'s Day', month: 1, day: 1 },
    { name: 'Independence Day', month: 7, day: 4 },
    { name: 'Veterans Day', month: 11, day: 11 },
    { name: 'Christmas Day', month: 12, day: 25 },
  ];

  console.log('Creating fixed-date national holidays...');
  for (const holiday of fixedHolidays) {
    const pattern: RecurrencePattern = { type: 'fixed', month: holiday.month, day: holiday.day };
    const date = calculateHolidayDate(currentYear, pattern);

    await db.query(
      `INSERT INTO holidays (calendar_id, name, holiday_date, is_recurring, recurrence_pattern)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        nationalId,
        holiday.name,
        date.toISOString().split('T')[0],
        true,
        JSON.stringify(pattern),
      ]
    );
  }

  // Floating holidays (rules-based)
  const floatingHolidays: Holiday[] = [
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

  console.log('Creating floating national holidays...');
  for (const holiday of floatingHolidays) {
    const date = calculateHolidayDate(currentYear, holiday.pattern);

    await db.query(
      `INSERT INTO holidays (calendar_id, name, holiday_date, is_recurring, recurrence_pattern)
       VALUES ($1, $2, $3, $4, $5)`,
      [nationalId, holiday.name, date.toISOString().split('T')[0], true, JSON.stringify(holiday.pattern)]
    );
  }

  // State-specific calendars
  // Texas
  console.log('Creating Texas State Holidays calendar...');
  const texasResult = await db.query(
    `INSERT INTO holiday_calendars (name, calendar_type, state_code, description, is_active)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    ['Texas State Holidays', 'state', 'TX', 'Texas-specific holidays', true]
  );

  const texasPattern: RecurrencePattern = { type: 'fixed', month: 3, day: 2 };
  const texasDate = calculateHolidayDate(currentYear, texasPattern);

  await db.query(
    `INSERT INTO holidays (calendar_id, name, holiday_date, is_recurring, recurrence_pattern)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      texasResult.rows[0].id,
      'Texas Independence Day',
      texasDate.toISOString().split('T')[0],
      true,
      JSON.stringify(texasPattern),
    ]
  );

  // Florida
  console.log('Creating Florida State Holidays calendar...');
  const floridaResult = await db.query(
    `INSERT INTO holiday_calendars (name, calendar_type, state_code, description, is_active)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    ['Florida State Holidays', 'state', 'FL', 'Florida-specific holidays', true]
  );

  // Add Florida-specific holidays if needed
  // For now, Florida will just use the national calendar

  // Link calendars to branches based on state
  console.log('Linking holiday calendars to branches...');

  // Get all branches with their state codes
  const branchesResult = await db.query(`
    SELECT id, address->>'state' as state
    FROM branches
    WHERE deleted_at IS NULL
  `);

  for (const branch of branchesResult.rows) {
    // Always link national calendar
    await db.query(
      `INSERT INTO branch_holiday_calendars (branch_id, calendar_id)
       VALUES ($1, $2)
       ON CONFLICT (branch_id, calendar_id) DO NOTHING`,
      [branch.id, nationalId]
    );

    // Link state-specific calendar
    if (branch.state === 'TX' || branch.state === 'Texas') {
      await db.query(
        `INSERT INTO branch_holiday_calendars (branch_id, calendar_id)
         VALUES ($1, $2)
         ON CONFLICT (branch_id, calendar_id) DO NOTHING`,
        [branch.id, texasResult.rows[0].id]
      );
    } else if (branch.state === 'FL' || branch.state === 'Florida') {
      await db.query(
        `INSERT INTO branch_holiday_calendars (branch_id, calendar_id)
         VALUES ($1, $2)
         ON CONFLICT (branch_id, calendar_id) DO NOTHING`,
        [branch.id, floridaResult.rows[0].id]
      );
    }
  }

  console.log('Holiday seeding completed successfully!');
}

async function main() {
  const config: DatabaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number.parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'care_commons',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  };

  const db = new Database(config);

  try {
    await seedHolidays(db);
    console.log('\n✅ Holiday seeding completed successfully');
  } catch (error) {
    console.error('\n❌ Holiday seeding failed:', error);
    throw error;
  } finally {
    await db.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { seedHolidays };
