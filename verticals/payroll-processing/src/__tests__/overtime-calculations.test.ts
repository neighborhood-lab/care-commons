/**
 * Overtime Calculations and Edge Cases Tests
 * 
 * Tests comprehensive overtime scenarios including federal, state-specific rules,
 * California overtime, daily overtime, and complex edge cases
 */

import {
  calculateOvertimeHours,
  calculateOvertimePay,
  calculateDailyOvertime,
  calculateLiveInOvertime,
  calculateBlendedOvertimeRate,
  calculateSeventhDayOvertime,
} from '../utils/pay-calculations';
import { v4 as uuid } from 'uuid';

describe('Overtime Calculations and Edge Cases', () => {
  describe('Basic Overtime Calculations', () => {
    it('should calculate simple overtime pay', () => {
      const result = calculateOvertimePay(40, 10, 0, 20.00, 1.5);
      expect(result.overtimePay).toBe(300); // 10 * 20 * 1.5
    });

    it('should calculate double time pay', () => {
      const result = calculateOvertimePay(40, 0, 5, 25.00, 1.5, 2.0);
      expect(result.doubleTimePay).toBe(250); // 5 * 25 * 2.0
    });

    it('should calculate triple time pay', () => {
      const result = calculateOvertimePay(40, 2, 0, 30.00, 3.0);
      expect(result.overtimePay).toBe(180); // 2 * 30 * 3.0
    });

    it('should handle zero overtime hours', () => {
      const result = calculateOvertimePay(40, 0, 0, 25.00, 1.5);
      expect(result.overtimePay).toBe(0);
    });

    it('should handle fractional overtime hours', () => {
      const result = calculateOvertimePay(40, 2.5, 0, 24.00, 1.5);
      expect(result.overtimePay).toBe(90); // 2.5 * 24 * 1.5
    });

    it('should handle very small overtime fractions', () => {
      const result = calculateOvertimePay(40, 0.25, 0, 40.00, 1.5);
      expect(result.overtimePay).toBe(15); // 0.25 * 40 * 1.5
    });

    it('should handle large overtime hours', () => {
      const result = calculateOvertimePay(40, 60, 0, 50.00, 1.5);
      expect(result.overtimePay).toBe(4500); // 60 * 50 * 1.5
    });
  });

  describe('Weekly Overtime Calculations', () => {
    it('should calculate regular week with no overtime', () => {
      const hours = calculateOvertimeHours(40, 40);
      const result = calculateOvertimePay(hours.regular, hours.overtime, hours.doubleTime, 25.00);
      expect(result.regularHours).toBe(40);
      expect(result.overtimeHours).toBe(0);
      expect(result.doubleTimeHours).toBe(0);
      expect(result.regularPay).toBe(1000);
      expect(result.overtimePay).toBe(0);
      expect(result.doubleTimePay).toBe(0);
    });

    it('should calculate week with overtime only', () => {
      const hours = calculateOvertimeHours(45, 40);
      const result = calculateOvertimePay(hours.regular, hours.overtime, hours.doubleTime, 25.00);
      expect(result.regularHours).toBe(40);
      expect(result.overtimeHours).toBe(5);
      expect(result.doubleTimeHours).toBe(0);
      expect(result.regularPay).toBe(1000);
      expect(result.overtimePay).toBe(187.5); // 5 * 25 * 1.5
      expect(result.doubleTimePay).toBe(0);
    });

    it('should calculate week with fractional overtime', () => {
      const hours = calculateOvertimeHours(42.5, 40);
      const result = calculateOvertimePay(hours.regular, hours.overtime, hours.doubleTime, 24.00);
      expect(result.regularHours).toBe(40);
      expect(result.overtimeHours).toBe(2.5);
      expect(result.doubleTimeHours).toBe(0);
      expect(result.regularPay).toBe(960);
      expect(result.overtimePay).toBe(90); // 2.5 * 24 * 1.5
      expect(result.doubleTimePay).toBe(0);
    });

    it('should calculate week with double time', () => {
      const hours = calculateOvertimeHours(60, 40, 48);
      const result = calculateOvertimePay(hours.regular, hours.overtime, hours.doubleTime, 30.00);
      expect(result.regularHours).toBe(40);
      expect(result.overtimeHours).toBe(8);
      expect(result.doubleTimeHours).toBe(12);
      expect(result.regularPay).toBe(1200);
      expect(result.overtimePay).toBe(360); // 8 * 30 * 1.5
      expect(result.doubleTimePay).toBe(720); // 12 * 30 * 2.0
    });

    it('should handle zero hours worked', () => {
      const hours = calculateOvertimeHours(0, 40);
      const result = calculateOvertimePay(hours.regular, hours.overtime, hours.doubleTime, 25.00);
      expect(result.overtimeHours).toBe(0);
      expect(result.regularPay).toBe(0);
      expect(result.overtimePay).toBe(0);
      expect(result.doubleTimePay).toBe(0);
    });
  });

  describe('California Daily Overtime', () => {
    it('should calculate regular day with no overtime', () => {
      const dailyHours = [8, 8, 8, 8, 8];
      const rate = 25.00;
      
      let totalRegular = 0, totalOvertime = 0, totalDoubleTime = 0;
      for (const hours of dailyHours) {
        const dayResult = calculateDailyOvertime(hours, 8, 12);
        totalRegular += dayResult.regular;
        totalOvertime += dayResult.overtime;
        totalDoubleTime += dayResult.doubleTime;
      }
      
      const result = calculateOvertimePay(totalRegular, totalOvertime, totalDoubleTime, rate);
      
      expect(result.regularHours).toBe(40);
      expect(result.overtimeHours).toBe(0);
      expect(result.doubleTimeHours).toBe(0);
      expect(result.regularPay).toBe(1000);
      expect(result.overtimePay).toBe(0);
      expect(result.doubleTimePay).toBe(0);
    });

    it('should calculate day with overtime only', () => {
      const dailyHours = [8, 8, 8, 8, 10];
      const rate = 25.00;
      
      let totalRegular = 0, totalOvertime = 0, totalDoubleTime = 0;
      for (const hours of dailyHours) {
        const dayResult = calculateDailyOvertime(hours, 8, 12);
        totalRegular += dayResult.regular;
        totalOvertime += dayResult.overtime;
        totalDoubleTime += dayResult.doubleTime;
      }
      
      const result = calculateOvertimePay(totalRegular, totalOvertime, totalDoubleTime, rate);
      
      expect(result.regularHours).toBe(40);
      expect(result.overtimeHours).toBe(2);
      expect(result.doubleTimeHours).toBe(0);
      expect(result.regularPay).toBe(1000);
      expect(result.overtimePay).toBe(75); // 2 * 25 * 1.5
      expect(result.doubleTimePay).toBe(0);
    });

    it('should calculate day with double time', () => {
      const dailyHours = [8, 8, 8, 8, 14];
      const rate = 25.00;
      
      let totalRegular = 0, totalOvertime = 0, totalDoubleTime = 0;
      for (const hours of dailyHours) {
        const dayResult = calculateDailyOvertime(hours, 8, 12);
        totalRegular += dayResult.regular;
        totalOvertime += dayResult.overtime;
        totalDoubleTime += dayResult.doubleTime;
      }
      
      const result = calculateOvertimePay(totalRegular, totalOvertime, totalDoubleTime, rate);
      
      expect(result.regularHours).toBe(40);
      expect(result.overtimeHours).toBe(4);
      expect(result.doubleTimeHours).toBe(2);
      expect(result.regularPay).toBe(1000);
      expect(result.overtimePay).toBe(150); // 4 * 25 * 1.5
      expect(result.doubleTimePay).toBe(100); // 2 * 25 * 2.0
    });
  });

  describe('Seventh Day Overtime', () => {
    it('should calculate seventh day overtime', () => {
      const result = calculateSeventhDayOvertime(6);
      expect(result.regular).toBe(0);
      expect(result.overtime).toBe(6);
      expect(result.doubleTime).toBe(0);
    });

    it('should calculate seventh day double time', () => {
      const result = calculateSeventhDayOvertime(10);
      expect(result.regular).toBe(0);
      expect(result.overtime).toBe(8);
      expect(result.doubleTime).toBe(2);
    });

    it('should handle zero hours on seventh day', () => {
      const result = calculateSeventhDayOvertime(0);
      expect(result.regular).toBe(0);
      expect(result.overtime).toBe(0);
      expect(result.doubleTime).toBe(0);
    });
  });

  describe('Live-In Overtime', () => {
    it('should calculate live-in overtime with standard threshold', () => {
      const result = calculateLiveInOvertime(50, 44, 20);
      expect(result.regularHours).toBe(44);
      expect(result.overtimeHours).toBe(6);
      expect(result.doubleTimeHours).toBe(0);
      expect(result.regularPay).toBe(880);
      expect(result.overtimePay).toBe(180); // 6 * 20 * 1.5
    });

    it('should calculate live-in overtime with double time', () => {
      const result = calculateLiveInOvertime(60, 44, 20);
      expect(result.regularHours).toBe(44);
      expect(result.overtimeHours).toBe(16);
      expect(result.doubleTimeHours).toBe(0);
      expect(result.regularPay).toBe(880);
      expect(result.overtimePay).toBe(480); // 16 * 20 * 1.5
    });
  });

  describe('Blended Overtime Rate', () => {
    it('should calculate blended overtime rate', () => {
      const result = calculateBlendedOvertimeRate(1000, 40);
      expect(result).toBe(37.5); // (1000/40) * 1.5
    });

    it('should handle zero regular hours', () => {
      const result = calculateBlendedOvertimeRate(1000, 0);
      expect(result).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative hours gracefully', () => {
      const hours = calculateOvertimeHours(-5, 40);
      expect(hours.regular).toBe(-5);
      expect(hours.overtime).toBe(0);
      expect(hours.doubleTime).toBe(0);
    });

    it('should handle very large hour values', () => {
      const hours = calculateOvertimeHours(100, 40, 60);
      expect(hours.regular).toBe(40);
      expect(hours.overtime).toBe(20);
      expect(hours.doubleTime).toBe(40);
    });

    it('should handle decimal precision correctly', () => {
      const result = calculateOvertimePay(40, 1.5, 0, 15.67, 1.5);
      expect(result.overtimePay).toBeCloseTo(35.26, 2);
    });
  });
});