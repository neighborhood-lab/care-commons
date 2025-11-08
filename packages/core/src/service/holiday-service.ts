/**
 * @care-commons/core - Holiday Service
 *
 * Business logic for holiday calendar management
 */

import { UUID } from '../types/base';
import { Database } from '../db/connection';

export interface RecurrencePattern {
  type: 'fixed' | 'nth_weekday' | 'last_weekday';
  month: number;
  day?: number;
  nth?: number;
  weekday?: number;
}

export interface Holiday {
  id: UUID;
  calendar_id: UUID;
  name: string;
  holiday_date: Date;
  is_recurring: boolean;
  recurrence_pattern?: RecurrencePattern;
  created_at: Date;
}

export interface HolidayCalendar {
  id: UUID;
  name: string;
  description?: string;
  calendar_type: 'national' | 'state' | 'agency';
  state_code?: string;
  organization_id?: UUID;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IHolidayService {
  isHoliday(date: Date, branchId: UUID): Promise<boolean>;
  getHolidays(startDate: Date, endDate: Date, branchId: UUID): Promise<Holiday[]>;
  getHolidaysForYear(year: number, branchId: UUID): Promise<Holiday[]>;
  getCalendars(): Promise<HolidayCalendar[]>;
}

export class HolidayService implements IHolidayService {
  constructor(private database: Database) {}

  /**
   * Check if a given date is a holiday for a branch
   */
  async isHoliday(date: Date, branchId: UUID): Promise<boolean> {
    const holidays = await this.getHolidays(date, date, branchId);
    return holidays.length > 0;
  }

  /**
   * Get all holidays in a date range for a branch
   */
  async getHolidays(
    startDate: Date,
    endDate: Date,
    branchId: UUID
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

    interface HolidayRow {
      id: UUID;
      calendar_id: UUID;
      name: string;
      holiday_date: string;
      is_recurring: boolean;
      recurrence_pattern?: RecurrencePattern;
      created_at: string;
    }

    return (result.rows as unknown as HolidayRow[]).map((row) => ({
      id: row.id,
      calendar_id: row.calendar_id,
      name: row.name,
      holiday_date: new Date(row.holiday_date),
      is_recurring: row.is_recurring,
      recurrence_pattern: row.recurrence_pattern,
      created_at: new Date(row.created_at),
    }));
  }

  /**
   * Get all holidays for a year (including recurring)
   */
  async getHolidaysForYear(year: number, branchId: UUID): Promise<Holiday[]> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const holidays = await this.getHolidays(startDate, endDate, branchId);

    // Expand recurring holidays for this year
    const expandedHolidays: Holiday[] = [];

    for (const holiday of holidays) {
      if (holiday.is_recurring && holiday.recurrence_pattern !== undefined) {
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

  /**
   * Get all holiday calendars
   */
  async getCalendars(): Promise<HolidayCalendar[]> {
    const query = `
      SELECT *
      FROM holiday_calendars
      WHERE is_active = true
      ORDER BY calendar_type, name
    `;

    const result = await this.database.query(query);

    interface HolidayCalendarRow {
      id: UUID;
      name: string;
      description?: string;
      calendar_type: 'national' | 'state' | 'agency';
      state_code?: string;
      organization_id?: UUID;
      is_active: boolean;
      created_at: string;
      updated_at: string;
    }

    return (result.rows as unknown as HolidayCalendarRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      calendar_type: row.calendar_type,
      state_code: row.state_code,
      organization_id: row.organization_id,
      is_active: row.is_active,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    }));
  }

  private calculateRecurringDate(year: number, pattern: RecurrencePattern): Date {
    if (pattern.type === 'fixed') {
      return new Date(year, pattern.month - 1, pattern.day);
    }

    if (pattern.type === 'nth_weekday') {
      return getNthWeekdayOfMonth(year, pattern.month, pattern.nth!, pattern.weekday!);
    }

    // pattern.type === 'last_weekday'
    return getLastWeekdayOfMonth(year, pattern.month, pattern.weekday!);
  }
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
