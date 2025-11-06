import { addHours, addDays, addWeeks, addMonths, startOfDay } from 'date-fns';
import type { MedicationFrequency, Medication } from '../types/medication.js';

/**
 * Calculate next administration time based on frequency
 */
export function calculateNextAdministration(
  lastAdministration: Date,
  frequency: MedicationFrequency
): Date {
  switch (frequency) {
    case 'once_daily':
      return addDays(lastAdministration, 1);
    case 'twice_daily':
      return addHours(lastAdministration, 12);
    case 'three_times_daily':
      return addHours(lastAdministration, 8);
    case 'four_times_daily':
      return addHours(lastAdministration, 6);
    case 'every_hour':
      return addHours(lastAdministration, 1);
    case 'every_2_hours':
      return addHours(lastAdministration, 2);
    case 'every_4_hours':
      return addHours(lastAdministration, 4);
    case 'every_6_hours':
      return addHours(lastAdministration, 6);
    case 'every_8_hours':
      return addHours(lastAdministration, 8);
    case 'every_12_hours':
      return addHours(lastAdministration, 12);
    case 'weekly':
      return addWeeks(lastAdministration, 1);
    case 'monthly':
      return addMonths(lastAdministration, 1);
    case 'as_needed':
    case 'custom':
    default:
      // For PRN and custom, no automatic scheduling
      return lastAdministration;
  }
}

/**
 * Generate scheduled administration times for a given period
 */
export function generateAdministrationSchedule(
  medication: Medication,
  startDate: Date,
  endDate: Date
): Date[] {
  if (medication.is_prn) {
    // PRN medications are not scheduled
    return [];
  }

  const schedule: Date[] = [];
  let currentTime = startOfDay(startDate);

  // Get first administration times for the day based on frequency
  const dailyTimes = getDailyAdministrationTimes(medication.frequency);

  while (currentTime <= endDate) {
    for (const time of dailyTimes) {
      const scheduledTime = new Date(currentTime);
      scheduledTime.setHours(time.hours, time.minutes, 0, 0);

      if (scheduledTime >= startDate && scheduledTime <= endDate) {
        schedule.push(scheduledTime);
      }
    }

    currentTime = addDays(currentTime, 1);
  }

  return schedule;
}

/**
 * Get standard administration times for a frequency
 */
export function getDailyAdministrationTimes(
  frequency: MedicationFrequency
): Array<{ hours: number; minutes: number }> {
  switch (frequency) {
    case 'once_daily':
      return [{ hours: 9, minutes: 0 }]; // 9:00 AM
    case 'twice_daily':
      return [
        { hours: 9, minutes: 0 }, // 9:00 AM
        { hours: 21, minutes: 0 }, // 9:00 PM
      ];
    case 'three_times_daily':
      return [
        { hours: 9, minutes: 0 }, // 9:00 AM
        { hours: 14, minutes: 0 }, // 2:00 PM
        { hours: 21, minutes: 0 }, // 9:00 PM
      ];
    case 'four_times_daily':
      return [
        { hours: 8, minutes: 0 }, // 8:00 AM
        { hours: 12, minutes: 0 }, // 12:00 PM
        { hours: 17, minutes: 0 }, // 5:00 PM
        { hours: 22, minutes: 0 }, // 10:00 PM
      ];
    case 'every_4_hours':
      return [
        { hours: 0, minutes: 0 },
        { hours: 4, minutes: 0 },
        { hours: 8, minutes: 0 },
        { hours: 12, minutes: 0 },
        { hours: 16, minutes: 0 },
        { hours: 20, minutes: 0 },
      ];
    case 'every_6_hours':
      return [
        { hours: 6, minutes: 0 },
        { hours: 12, minutes: 0 },
        { hours: 18, minutes: 0 },
        { hours: 0, minutes: 0 },
      ];
    case 'every_8_hours':
      return [
        { hours: 8, minutes: 0 },
        { hours: 16, minutes: 0 },
        { hours: 0, minutes: 0 },
      ];
    case 'every_12_hours':
      return [
        { hours: 8, minutes: 0 },
        { hours: 20, minutes: 0 },
      ];
    default:
      return [];
  }
}

/**
 * Format medication dosage for display
 */
export function formatDosage(medication: Medication): string {
  let dosage = medication.dosage;

  if (medication.strength) {
    dosage = `${dosage} (${medication.strength})`;
  }

  return dosage;
}

/**
 * Format medication frequency for display
 */
export function formatFrequency(medication: Medication): string {
  if (medication.frequency === 'custom' && medication.frequency_details) {
    return medication.frequency_details;
  }

  const frequencyMap: Record<MedicationFrequency, string> = {
    once_daily: 'Once daily',
    twice_daily: 'Twice daily',
    three_times_daily: 'Three times daily',
    four_times_daily: 'Four times daily',
    every_hour: 'Every hour',
    every_2_hours: 'Every 2 hours',
    every_4_hours: 'Every 4 hours',
    every_6_hours: 'Every 6 hours',
    every_8_hours: 'Every 8 hours',
    every_12_hours: 'Every 12 hours',
    weekly: 'Weekly',
    monthly: 'Monthly',
    as_needed: 'As needed (PRN)',
    custom: 'Custom',
  };

  return frequencyMap[medication.frequency] || medication.frequency;
}

/**
 * Check if medication is due for refill
 */
export function isDueForRefill(medication: Medication, daysThreshold = 7): boolean {
  if (medication.refills_remaining === undefined || medication.refills_remaining === null) {
    return false;
  }

  if (medication.refills_remaining === 0) {
    return true;
  }

  if (!medication.last_refill_date) {
    return false;
  }

  // Calculate days since last refill
  const lastRefill = new Date(medication.last_refill_date);
  const now = new Date();
  const daysSinceRefill = Math.floor((now.getTime() - lastRefill.getTime()) / (1000 * 60 * 60 * 24));

  // Assume 30-day supply, alert when within threshold
  return daysSinceRefill >= 30 - daysThreshold;
}

/**
 * Check if medication is expired or ending soon
 */
export function isExpiring(medication: Medication, daysThreshold = 7): boolean {
  if (!medication.end_date) {
    return false;
  }

  const endDate = new Date(medication.end_date);
  const now = new Date();
  const daysUntilEnd = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return daysUntilEnd <= daysThreshold && daysUntilEnd >= 0;
}

/**
 * Check if medication is currently active
 */
export function isCurrentlyActive(medication: Medication): boolean {
  if (medication.status !== 'active') {
    return false;
  }

  const now = new Date();
  const startDate = new Date(medication.start_date);

  if (startDate > now) {
    return false;
  }

  if (medication.end_date) {
    const endDate = new Date(medication.end_date);
    if (endDate < now) {
      return false;
    }
  }

  return true;
}

/**
 * Get medication display name
 */
export function getMedicationDisplayName(medication: Medication): string {
  if (medication.generic_name) {
    return `${medication.name} (${medication.generic_name})`;
  }
  return medication.name;
}

/**
 * Calculate adherence rate
 */
export function calculateAdherenceRate(administered: number, scheduled: number): number {
  if (scheduled === 0) {
    return 0;
  }
  return Math.round((administered / scheduled) * 100 * 10) / 10; // Round to 1 decimal place
}

/**
 * Get adherence status label
 */
export function getAdherenceStatus(adherenceRate: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (adherenceRate >= 95) {
    return 'excellent';
  } else if (adherenceRate >= 80) {
    return 'good';
  } else if (adherenceRate >= 60) {
    return 'fair';
  }
  return 'poor';
}
