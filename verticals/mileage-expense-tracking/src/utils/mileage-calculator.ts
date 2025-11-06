import type { DistanceUnit } from '../types/mileage.js';

/**
 * Utility functions for mileage calculations
 */

/**
 * Convert miles to kilometers
 */
export function milesToKilometers(miles: number): number {
  return miles * 1.60934;
}

/**
 * Convert kilometers to miles
 */
export function kilometersToMiles(kilometers: number): number {
  return kilometers / 1.60934;
}

/**
 * Convert distance between units
 */
export function convertDistance(
  distance: number,
  fromUnit: DistanceUnit,
  toUnit: DistanceUnit
): number {
  if (fromUnit === toUnit) {
    return distance;
  }

  if (fromUnit === 'MILES' && toUnit === 'KILOMETERS') {
    return milesToKilometers(distance);
  }

  if (fromUnit === 'KILOMETERS' && toUnit === 'MILES') {
    return kilometersToMiles(distance);
  }

  return distance;
}

/**
 * Calculate mileage reimbursement amount
 * @param distance - Distance traveled
 * @param ratePerUnit - Rate per unit (in cents)
 * @returns Amount in cents
 */
export function calculateMileageAmount(distance: number, ratePerUnit: number): number {
  if (distance < 0 || ratePerUnit < 0) {
    throw new Error('Distance and rate must be non-negative');
  }

  return Math.round(distance * ratePerUnit);
}

/**
 * Calculate total mileage from multiple trips
 */
export function calculateTotalDistance(distances: number[]): number {
  return distances.reduce((sum, distance) => sum + distance, 0);
}

/**
 * Calculate total amount from multiple trips
 */
export function calculateTotalAmount(amounts: number[]): number {
  return amounts.reduce((sum, amount) => sum + amount, 0);
}

/**
 * Validate distance is reasonable (not too large)
 */
export function isDistanceReasonable(
  distance: number,
  unit: DistanceUnit,
  maxMiles = 500
): boolean {
  const distanceInMiles = unit === 'MILES' ? distance : kilometersToMiles(distance);
  return distanceInMiles > 0 && distanceInMiles <= maxMiles;
}

/**
 * Format distance with unit
 */
export function formatDistance(distance: number, unit: DistanceUnit): string {
  const rounded = Math.round(distance * 10) / 10;
  return `${rounded} ${unit.toLowerCase()}`;
}

/**
 * Format amount in dollars
 */
export function formatAmount(amountInCents: number): string {
  const dollars = amountInCents / 100;
  return `$${dollars.toFixed(2)}`;
}

/**
 * Calculate odometer distance
 */
export function calculateOdometerDistance(start: number, end: number): number {
  if (end < start) {
    throw new Error('End odometer reading must be greater than start');
  }
  return end - start;
}

/**
 * Estimate drive time based on distance (assumes 30 mph average)
 */
export function estimateDriveTime(distanceInMiles: number): number {
  const averageSpeedMph = 30;
  return distanceInMiles / averageSpeedMph;
}

/**
 * Calculate IRS standard mileage rate deduction
 * Note: These rates change yearly and should be updated accordingly
 */
export const IRS_STANDARD_RATES = {
  2024: {
    BUSINESS: 67, // 67 cents per mile
    MEDICAL: 21, // 21 cents per mile
    MOVING: 21, // 21 cents per mile
    CHARITY: 14, // 14 cents per mile
  },
  2025: {
    BUSINESS: 70, // Projected rate (update when announced)
    MEDICAL: 22,
    MOVING: 22,
    CHARITY: 14,
  },
} as const;

/**
 * Get IRS standard rate for a given year and rate type
 */
export function getIRSStandardRate(
  year: number,
  rateType: 'BUSINESS' | 'MEDICAL' | 'MOVING' | 'CHARITY'
): number | null {
  const yearRates = IRS_STANDARD_RATES[year as keyof typeof IRS_STANDARD_RATES];
  return yearRates ? yearRates[rateType] : null;
}
