/**
 * Basic tests for Mileage & Expense Tracking vertical
 */

import { describe, it, expect } from 'vitest';
import {
  milesToKilometers,
  kilometersToMiles,
  calculateMileageAmount,
  formatCurrency,
  validateExpenseAmount,
} from '../index.js';

describe('Mileage Calculator', () => {
  it('should convert miles to kilometers', () => {
    expect(milesToKilometers(10)).toBeCloseTo(16.0934, 2);
  });

  it('should convert kilometers to miles', () => {
    expect(kilometersToMiles(16.0934)).toBeCloseTo(10, 2);
  });

  it('should calculate mileage amount', () => {
    // 100 miles at $0.67 per mile = $67.00 (6700 cents)
    expect(calculateMileageAmount(100, 67)).toBe(6700);
  });

  it('should throw error for negative values', () => {
    expect(() => calculateMileageAmount(-10, 67)).toThrow();
    expect(() => calculateMileageAmount(10, -67)).toThrow();
  });
});

describe('Expense Validator', () => {
  it('should validate positive expense amount', () => {
    const result = validateExpenseAmount(1000, 'MEALS');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject negative expense amount', () => {
    const result = validateExpenseAmount(-100, 'MEALS');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Amount must be positive');
  });

  it('should reject zero expense amount', () => {
    const result = validateExpenseAmount(0, 'MEALS');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Amount must be positive');
  });

  it('should format currency correctly', () => {
    expect(formatCurrency(10000)).toBe('$100.00');
    expect(formatCurrency(567)).toBe('$5.67');
    expect(formatCurrency(0)).toBe('$0.00');
  });
});

describe('Module Exports', () => {
  it('should export all required utilities', () => {
    expect(milesToKilometers).toBeDefined();
    expect(kilometersToMiles).toBeDefined();
    expect(calculateMileageAmount).toBeDefined();
    expect(formatCurrency).toBeDefined();
    expect(validateExpenseAmount).toBeDefined();
  });
});
