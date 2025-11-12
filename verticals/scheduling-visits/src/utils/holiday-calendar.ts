/**
 * Holiday Calendar Utility
 * 
 * Provides US federal holiday calculations for scheduling.
 * Supports federal holidays as defined by 5 U.S.C. 6103.
 */

/**
 * US Federal Holidays (10 official holidays)
 * Reference: 5 U.S.C. § 6103
 */
export const US_FEDERAL_HOLIDAYS = {
  NEW_YEARS_DAY: 'New Year\'s Day',
  MARTIN_LUTHER_KING_JR_DAY: 'Martin Luther King Jr. Day',
  WASHINGTONS_BIRTHDAY: 'Washington\'s Birthday', // Presidents' Day
  MEMORIAL_DAY: 'Memorial Day',
  JUNETEENTH: 'Juneteenth National Independence Day',
  INDEPENDENCE_DAY: 'Independence Day',
  LABOR_DAY: 'Labor Day',
  COLUMBUS_DAY: 'Columbus Day', // Indigenous Peoples' Day in some states
  VETERANS_DAY: 'Veterans Day',
  THANKSGIVING_DAY: 'Thanksgiving Day',
  CHRISTMAS_DAY: 'Christmas Day',
} as const;

/**
 * Calculate US federal holidays for a given year
 * 
 * @param year - The year to calculate holidays for
 * @returns Array of Date objects representing federal holidays
 */
export function calculateFederalHolidays(year: number): Date[] {
  const holidays: Date[] = [];

  // New Year's Day - January 1
  holidays.push(new Date(year, 0, 1));

  // Martin Luther King Jr. Day - Third Monday in January
  holidays.push(getNthWeekdayOfMonth(year, 0, 1, 3)); // 0=Jan, 1=Monday, 3rd occurrence

  // Washington's Birthday (Presidents' Day) - Third Monday in February
  holidays.push(getNthWeekdayOfMonth(year, 1, 1, 3)); // 1=Feb, 1=Monday, 3rd occurrence

  // Memorial Day - Last Monday in May
  holidays.push(getLastWeekdayOfMonth(year, 4, 1)); // 4=May, 1=Monday

  // Juneteenth - June 19 (added 2021)
  holidays.push(new Date(year, 5, 19)); // 5=June

  // Independence Day - July 4
  holidays.push(new Date(year, 6, 4)); // 6=July

  // Labor Day - First Monday in September
  holidays.push(getNthWeekdayOfMonth(year, 8, 1, 1)); // 8=Sep, 1=Monday, 1st occurrence

  // Columbus Day - Second Monday in October
  holidays.push(getNthWeekdayOfMonth(year, 9, 1, 2)); // 9=Oct, 1=Monday, 2nd occurrence

  // Veterans Day - November 11
  holidays.push(new Date(year, 10, 11)); // 10=Nov

  // Thanksgiving - Fourth Thursday in November
  holidays.push(getNthWeekdayOfMonth(year, 10, 4, 4)); // 10=Nov, 4=Thursday, 4th occurrence

  // Christmas - December 25
  holidays.push(new Date(year, 11, 25)); // 11=Dec

  return holidays;
}

/**
 * Get the nth occurrence of a weekday in a month
 * 
 * @param year - Year
 * @param month - Month (0-11, JavaScript convention)
 * @param weekday - Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @param n - Occurrence (1=first, 2=second, etc.)
 */
function getNthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date {
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  
  // Calculate days until target weekday
  let daysUntilWeekday = (weekday - firstWeekday + 7) % 7;
  
  // Add weeks to get to nth occurrence
  const date = 1 + daysUntilWeekday + (n - 1) * 7;
  
  return new Date(year, month, date);
}

/**
 * Get the last occurrence of a weekday in a month
 * 
 * @param year - Year
 * @param month - Month (0-11)
 * @param weekday - Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
 */
function getLastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
  // Start from last day of month and work backwards
  const lastDay = new Date(year, month + 1, 0);
  const lastDayWeekday = lastDay.getDay();
  
  let daysBack = (lastDayWeekday - weekday + 7) % 7;
  
  return new Date(year, month, lastDay.getDate() - daysBack);
}

/**
 * Check if a date is a US federal holiday
 * 
 * @param date - Date to check
 * @returns true if the date is a federal holiday
 */
export function isFederalHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const holidays = calculateFederalHolidays(year);
  
  return holidays.some(holiday => 
    holiday.getFullYear() === date.getFullYear() &&
    holiday.getMonth() === date.getMonth() &&
    holiday.getDate() === date.getDate()
  );
}

/**
 * Filter out holidays from a list of dates
 * 
 * @param dates - Array of dates to filter
 * @param includeHolidays - If true, keeps holidays; if false, removes them
 * @returns Filtered array of dates
 */
export function filterHolidays(dates: Date[], includeHolidays: boolean = false): Date[] {
  if (includeHolidays) {
    return dates; // No filtering needed
  }
  
  return dates.filter(date => !isFederalHoliday(date));
}

/**
 * Get all holidays within a date range
 * 
 * @param startDate - Start of range
 * @param endDate - End of range
 * @returns Array of holidays within the range
 */
export function getHolidaysInRange(startDate: Date, endDate: Date): Date[] {
  const holidays: Date[] = [];
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  
  // Get holidays for all years in range
  for (let year = startYear; year <= endYear; year++) {
    const yearHolidays = calculateFederalHolidays(year);
    
    for (const holiday of yearHolidays) {
      if (holiday >= startDate && holiday <= endDate) {
        holidays.push(holiday);
      }
    }
  }
  
  return holidays.sort((a, b) => a.getTime() - b.getTime());
}
