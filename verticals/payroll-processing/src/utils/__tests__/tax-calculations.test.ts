/**
 * Unit tests for tax calculation utilities
 * 
 * Tests federal and state income tax withholding calculations,
 * FICA taxes, and compliance with IRS Publication 15-T
 */

import {
  calculateFederalIncomeTax,
  calculateSocialSecurityTax,
  calculateMedicareTax,
  calculateAdditionalMedicareTax,
  calculateStateIncomeTax,
  calculateAllTaxes,
  calculateSupplementalWithholding,
  estimateQuarterlyTaxLiability,
} from '../tax-calculations';
import { TaxConfiguration, FederalFilingStatus } from '../../types/payroll';

describe('Tax Calculation Utilities', () => {
  const mockTaxConfig: TaxConfiguration = {
    id: 'test-id',
    organizationId: 'test-org',
    caregiverId: 'test-caregiver',
    federalFilingStatus: 'SINGLE',
    federalAllowances: 0,
    federalExtraWithholding: 0,
    federalExempt: false,
    w4Step2: false,
    w4Step3Dependents: 0,
    w4Step4aOtherIncome: 0,
    w4Step4bDeductions: 0,
    w4Step4cExtraWithholding: 0,
    stateFilingStatus: 'SINGLE',
    stateAllowances: 0,
    stateExtraWithholding: 0,
    stateExempt: false,
    stateResidence: 'TX',
    localExempt: false,
    effectiveFrom: new Date(),
    lastUpdated: new Date(),
    updatedBy: 'test-user',
    w4OnFile: true,
    stateFormOnFile: true,
    createdAt: new Date(),
    createdBy: 'test-user',
    updatedAt: new Date(),
    version: 1,
  };

  describe('calculateFederalIncomeTax', () => {
    it('should return zero for exempt employees', () => {
      const exemptConfig = { ...mockTaxConfig, federalExempt: true };
      const result = calculateFederalIncomeTax(1000, 'WEEKLY', exemptConfig);
      expect(result).toBe(0);
    });

    it('should calculate federal tax for single filer', () => {
      const result = calculateFederalIncomeTax(1000, 'WEEKLY', mockTaxConfig);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(1000); // Tax should be less than gross pay
    });

    it('should calculate different amounts for different filing statuses', () => {
      const singleResult = calculateFederalIncomeTax(1000, 'WEEKLY', {
        ...mockTaxConfig,
        federalFilingStatus: 'SINGLE',
      });
      
      const marriedResult = calculateFederalIncomeTax(1000, 'WEEKLY', {
        ...mockTaxConfig,
        federalFilingStatus: 'MARRIED_JOINTLY',
      });
      
      expect(singleResult).not.toBe(marriedResult);
    });

    it('should handle W-4 Step 2 (multiple jobs)', () => {
      const multipleJobsConfig = { ...mockTaxConfig, w4Step2: true };
      const result = calculateFederalIncomeTax(1000, 'WEEKLY', multipleJobsConfig);
      expect(result).toBeGreaterThan(0);
    });

    it('should handle dependents credit (W-4 Step 3)', () => {
      const withDependents = { ...mockTaxConfig, w4Step3Dependents: 2 };
      const result = calculateFederalIncomeTax(1000, 'WEEKLY', withDependents);
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should handle other income (W-4 Step 4a)', () => {
      const withOtherIncome = { ...mockTaxConfig, w4Step4aOtherIncome: 10000 };
      const result = calculateFederalIncomeTax(1000, 'WEEKLY', withOtherIncome);
      expect(result).toBeGreaterThan(0);
    });

    it('should handle deductions (W-4 Step 4b)', () => {
      const withDeductions = { ...mockTaxConfig, w4Step4bDeductions: 5000 };
      const result = calculateFederalIncomeTax(1000, 'WEEKLY', withDeductions);
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should handle extra withholding (W-4 Step 4c)', () => {
      const withExtra = { ...mockTaxConfig, w4Step4cExtraWithholding: 50 };
      const result = calculateFederalIncomeTax(1000, 'WEEKLY', withExtra);
      expect(result).toBeGreaterThan(50);
    });

    it('should handle different pay periods', () => {
      const weekly = calculateFederalIncomeTax(1000, 'WEEKLY', mockTaxConfig);
      const biWeekly = calculateFederalIncomeTax(2000, 'BI_WEEKLY', mockTaxConfig);
      const monthly = calculateFederalIncomeTax(4000, 'MONTHLY', mockTaxConfig);
      
      expect(weekly).toBeGreaterThan(0);
      expect(biWeekly).toBeGreaterThan(0);
      expect(monthly).toBeGreaterThan(0);
    });

    it('should return zero for negative or zero gross pay', () => {
      expect(calculateFederalIncomeTax(0, 'WEEKLY', mockTaxConfig)).toBe(0);
      expect(calculateFederalIncomeTax(-100, 'WEEKLY', mockTaxConfig)).toBe(0);
    });
  });

  describe('calculateSocialSecurityTax', () => {
    it('should calculate 6.2% of gross pay', () => {
      const result = calculateSocialSecurityTax(1000, 0);
      expect(result).toBe(62); // 1000 * 0.062
    });

    it('should return zero when wage base is already met', () => {
      const result = calculateSocialSecurityTax(1000, 169000);
      expect(result).toBe(0);
    });

    it('should calculate partial tax when approaching wage base', () => {
      const result = calculateSocialSecurityTax(1000, 168000);
      expect(result).toBe(37.20); // (168600 - 168000) * 0.062
    });

    it('should handle zero gross pay', () => {
      const result = calculateSocialSecurityTax(0, 0);
      expect(result).toBe(0);
    });

    it('should handle negative YTD (should treat as zero)', () => {
      const result = calculateSocialSecurityTax(1000, -100);
      expect(result).toBe(62);
    });
  });

  describe('calculateMedicareTax', () => {
    it('should calculate 1.45% of gross pay', () => {
      const result = calculateMedicareTax(1000);
      expect(result).toBe(14.50); // 1000 * 0.0145
    });

    it('should handle zero gross pay', () => {
      const result = calculateMedicareTax(0);
      expect(result).toBe(0);
    });

    it('should handle very large amounts', () => {
      const result = calculateMedicareTax(100000);
      expect(result).toBe(1450);
    });
  });

  describe('calculateAdditionalMedicareTax', () => {
    it('should return zero when under threshold', () => {
      const result = calculateAdditionalMedicareTax(1000, 50000);
      expect(result).toBe(0);
    });

    it('should return zero when exactly at threshold', () => {
      const result = calculateAdditionalMedicareTax(1000, 199000);
      expect(result).toBe(0);
    });

    it('should calculate additional tax when exceeding threshold', () => {
      const result = calculateAdditionalMedicareTax(5000, 199000);
      expect(result).toBe(36); // (199000 + 5000 - 200000) * 0.009
    });

    it('should calculate full amount when already over threshold', () => {
      const result = calculateAdditionalMedicareTax(1000, 201000);
      expect(result).toBe(9); // 1000 * 0.009
    });

    it('should handle zero gross pay', () => {
      const result = calculateAdditionalMedicareTax(0, 201000);
      expect(result).toBe(0);
    });
  });

  describe('calculateStateIncomeTax', () => {
    it('should return zero for exempt employees', () => {
      const exemptConfig = { ...mockTaxConfig, stateExempt: true };
      const result = calculateStateIncomeTax(1000, 'TX', exemptConfig);
      expect(result).toBe(0);
    });

    it('should return zero for Texas (no state income tax)', () => {
      const result = calculateStateIncomeTax(1000, 'TX', mockTaxConfig);
      expect(result).toBe(0);
    });

    it('should return zero for Florida (no state income tax)', () => {
      const result = calculateStateIncomeTax(1000, 'FL', mockTaxConfig);
      expect(result).toBe(0);
    });

    it('should calculate tax for California', () => {
      const result = calculateStateIncomeTax(1000, 'CA', mockTaxConfig);
      expect(result).toBe(50); // 1000 * 0.05 (simplified)
    });

    it('should calculate tax for New York', () => {
      const result = calculateStateIncomeTax(1000, 'NY', mockTaxConfig);
      expect(result).toBe(40); // 1000 * 0.04 (simplified)
    });

    it('should handle extra state withholding', () => {
      const withExtra = { ...mockTaxConfig, stateExtraWithholding: 25 };
      const result = calculateStateIncomeTax(1000, 'CA', withExtra);
      expect(result).toBe(75); // 50 + 25
    });

    it('should use default rate for unknown state', () => {
      const result = calculateStateIncomeTax(1000, 'XX', mockTaxConfig);
      expect(result).toBe(30); // 1000 * 0.03 (default)
    });

    it('should handle negative gross pay', () => {
      const result = calculateStateIncomeTax(-100, 'CA', mockTaxConfig);
      expect(result).toBe(0);
    });
  });

  describe('calculateAllTaxes', () => {
    it('should calculate all tax components', () => {
      const result = calculateAllTaxes(1000, 0, 'WEEKLY', mockTaxConfig);
      
      expect(result.federalIncomeTax).toBeGreaterThanOrEqual(0);
      expect(result.stateIncomeTax).toBeGreaterThanOrEqual(0);
      expect(result.localIncomeTax).toBeGreaterThanOrEqual(0);
      expect(result.socialSecurityTax).toBe(62);
      expect(result.medicareTax).toBe(14.50);
      expect(result.additionalMedicareTax).toBeGreaterThanOrEqual(0);
      expect(result.totalTax).toBeGreaterThan(0);
    });

    it('should sum taxes correctly', () => {
      const result = calculateAllTaxes(1000, 0, 'WEEKLY', mockTaxConfig);
      const expectedTotal = 
        result.federalIncomeTax +
        result.stateIncomeTax +
        result.localIncomeTax +
        result.socialSecurityTax +
        result.medicareTax +
        result.additionalMedicareTax;
      
      expect(result.totalTax).toBeCloseTo(expectedTotal, 2);
    });

    it('should handle YTD gross pay for Social Security limit', () => {
      const result = calculateAllTaxes(1000, 168000, 'WEEKLY', mockTaxConfig);
      expect(result.socialSecurityTax).toBeLessThan(62);
    });

    it('should handle additional Medicare tax threshold', () => {
      const result = calculateAllTaxes(5000, 199000, 'WEEKLY', mockTaxConfig);
      expect(result.additionalMedicareTax).toBeGreaterThan(0);
    });
  });

  describe('calculateSupplementalWithholding', () => {
    it('should use 22% flat rate for regular supplemental wages', () => {
      const result = calculateSupplementalWithholding(1000, true);
      expect(result).toBe(220); // 1000 * 0.22
    });

    it('should use 37% flat rate for supplemental wages over $1 million', () => {
      const result = calculateSupplementalWithholding(1500000, true);
      expect(result).toBe(555000); // 1500000 * 0.37
    });

    it('should calculate withholding using aggregate method when parameters provided', () => {
      const aggregateParams = {
        regularGrossPay: 2000,
        payPeriodType: 'BI_WEEKLY' as const,
        taxConfig: mockTaxConfig,
      };
      
      const result = calculateSupplementalWithholding(1000, false, aggregateParams);
      // Should calculate the difference between withholding on $3000 vs $2000
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1000);
    });

    it('should throw error when using aggregate method without parameters', () => {
      expect(() => {
        calculateSupplementalWithholding(1000, false);
      }).toThrow('Aggregate method requires aggregate parameters');
    });

    it('should handle zero supplemental amount', () => {
      const result = calculateSupplementalWithholding(0, true);
      expect(result).toBe(0);
    });

    it('should handle negative supplemental amount', () => {
      const result = calculateSupplementalWithholding(-100, true);
      expect(result).toBe(0);
    });
  });

  describe('estimateQuarterlyTaxLiability', () => {
    it('should calculate employer FICA taxes correctly', () => {
      const result = estimateQuarterlyTaxLiability(50000, 5000);
      
      expect(result.employerSocialSecurity).toBe(3100); // 50000 * 0.062
      expect(result.employerMedicare).toBe(725); // 50000 * 0.0145
      expect(result.totalEmployerTaxes).toBe(3825); // 3100 + 725
    });

    it('should respect Social Security wage base', () => {
      const result = estimateQuarterlyTaxLiability(200000, 20000);
      
      // Should only calculate on wage base of 168600
      expect(result.employerSocialSecurity).toBe(10453.20); // 168600 * 0.062
      expect(result.employerMedicare).toBe(2900); // 200000 * 0.0145
    });

    it('should calculate total deposits correctly', () => {
      const result = estimateQuarterlyTaxLiability(50000, 5000);
      
      // Total deposits = withheld taxes + employee FICA + employer FICA
      const expectedDeposits = 5000 + (3100 * 2) + (725 * 2);
      expect(result.totalDeposits).toBeCloseTo(expectedDeposits, 2);
    });

    it('should handle zero wages', () => {
      const result = estimateQuarterlyTaxLiability(0, 0);
      
      expect(result.employerSocialSecurity).toBe(0);
      expect(result.employerMedicare).toBe(0);
      expect(result.totalEmployerTaxes).toBe(0);
      expect(result.totalDeposits).toBe(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle very large gross pay amounts', () => {
      const result = calculateAllTaxes(1000000, 0, 'WEEKLY', mockTaxConfig);
      expect(Number.isFinite(result.totalTax)).toBe(true);
      expect(result.totalTax).toBeGreaterThan(0);
    });

    it('should handle very small gross pay amounts', () => {
      const result = calculateAllTaxes(0.01, 0, 'WEEKLY', mockTaxConfig);
      expect(Number.isFinite(result.totalTax)).toBe(true);
      expect(result.totalTax).toBeGreaterThanOrEqual(0);
    });

    it('should handle negative YTD amounts gracefully', () => {
      const result = calculateAllTaxes(1000, -1000, 'WEEKLY', mockTaxConfig);
      expect(result.socialSecurityTax).toBe(62); // Should treat negative YTD as 0
    });

    it('should handle all exempt configurations', () => {
      const exemptConfig = {
        ...mockTaxConfig,
        federalExempt: true,
        stateExempt: true,
      };
      const result = calculateAllTaxes(1000, 0, 'WEEKLY', exemptConfig);
      
      expect(result.federalIncomeTax).toBe(0);
      expect(result.stateIncomeTax).toBe(0);
      // FICA taxes should still apply
      expect(result.socialSecurityTax).toBe(62);
      expect(result.medicareTax).toBe(14.50);
    });

    it('should handle maximum withholding scenarios', () => {
      const maxConfig = {
        ...mockTaxConfig,
        w4Step4cExtraWithholding: 1000,
        stateExtraWithholding: 500,
      };
      const result = calculateAllTaxes(2000, 0, 'WEEKLY', maxConfig);
      
      expect(result.federalIncomeTax).toBeGreaterThanOrEqual(1000);
      expect(result.stateIncomeTax).toBeGreaterThanOrEqual(500);
    });
  });

  describe('Tax Compliance Tests', () => {
    it('should never return negative tax amounts', () => {
      const testCases = [
        { gross: 0, ytd: 0 },
        { gross: -100, ytd: 0 },
        { gross: 100, ytd: -100 },
      ];
      
      testCases.forEach(({ gross, ytd }) => {
        const result = calculateAllTaxes(gross, ytd, 'WEEKLY', mockTaxConfig);
        expect(result.federalIncomeTax).toBeGreaterThanOrEqual(0);
        expect(result.stateIncomeTax).toBeGreaterThanOrEqual(0);
        expect(result.localIncomeTax).toBeGreaterThanOrEqual(0);
        expect(result.socialSecurityTax).toBeGreaterThanOrEqual(0);
        expect(result.medicareTax).toBeGreaterThanOrEqual(0);
        expect(result.additionalMedicareTax).toBeGreaterThanOrEqual(0);
        expect(result.totalTax).toBeGreaterThanOrEqual(0);
      });
    });

    it('should respect Social Security wage base limit', () => {
      const wageBase = 168600;
      const testCases = [
        { gross: 1000, ytd: wageBase - 1000, expected: 62 },
        { gross: 1000, ytd: wageBase - 500, expected: 31 },
        { gross: 1000, ytd: wageBase, expected: 0 },
        { gross: 1000, ytd: wageBase + 1000, expected: 0 },
      ];
      
      testCases.forEach(({ gross, ytd, expected }) => {
        const result = calculateSocialSecurityTax(gross, ytd);
        expect(result).toBeCloseTo(expected, 2);
      });
    });

    it('should handle Additional Medicare threshold correctly', () => {
      const threshold = 200000;
      const testCases = [
        { gross: 1000, ytd: threshold - 1000, expected: 0 },
        { gross: 1000, ytd: threshold - 500, expected: 4.5 },
        { gross: 1000, ytd: threshold, expected: 9 },
        { gross: 1000, ytd: threshold + 1000, expected: 9 },
      ];
      
      testCases.forEach(({ gross, ytd, expected }) => {
        const result = calculateAdditionalMedicareTax(gross, ytd);
        expect(result).toBeCloseTo(expected, 2);
      });
    });
  });
});