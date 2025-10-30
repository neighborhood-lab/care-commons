"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tax_calculations_1 = require("../tax-calculations");
const vitest_1 = require("vitest");
(0, vitest_1.describe)('Tax Calculation Utilities', () => {
    const mockTaxConfig = {
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
    (0, vitest_1.describe)('calculateFederalIncomeTax', () => {
        (0, vitest_1.it)('should return zero for exempt employees', () => {
            const exemptConfig = { ...mockTaxConfig, federalExempt: true };
            const result = (0, tax_calculations_1.calculateFederalIncomeTax)(1000, 'WEEKLY', exemptConfig);
            (0, vitest_1.expect)(result).toBe(0);
        });
        (0, vitest_1.it)('should calculate federal tax for single filer', () => {
            const result = (0, tax_calculations_1.calculateFederalIncomeTax)(1000, 'WEEKLY', mockTaxConfig);
            (0, vitest_1.expect)(result).toBeGreaterThan(0);
            (0, vitest_1.expect)(result).toBeLessThan(1000);
        });
        (0, vitest_1.it)('should calculate different amounts for different filing statuses', () => {
            const singleResult = (0, tax_calculations_1.calculateFederalIncomeTax)(1000, 'WEEKLY', {
                ...mockTaxConfig,
                federalFilingStatus: 'SINGLE',
            });
            const marriedResult = (0, tax_calculations_1.calculateFederalIncomeTax)(1000, 'WEEKLY', {
                ...mockTaxConfig,
                federalFilingStatus: 'MARRIED_JOINTLY',
            });
            (0, vitest_1.expect)(singleResult).not.toBe(marriedResult);
        });
        (0, vitest_1.it)('should handle W-4 Step 2 (multiple jobs)', () => {
            const multipleJobsConfig = { ...mockTaxConfig, w4Step2: true };
            const result = (0, tax_calculations_1.calculateFederalIncomeTax)(1000, 'WEEKLY', multipleJobsConfig);
            (0, vitest_1.expect)(result).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should handle dependents credit (W-4 Step 3)', () => {
            const withDependents = { ...mockTaxConfig, w4Step3Dependents: 2 };
            const result = (0, tax_calculations_1.calculateFederalIncomeTax)(1000, 'WEEKLY', withDependents);
            (0, vitest_1.expect)(result).toBeGreaterThanOrEqual(0);
        });
        (0, vitest_1.it)('should handle other income (W-4 Step 4a)', () => {
            const withOtherIncome = { ...mockTaxConfig, w4Step4aOtherIncome: 10000 };
            const result = (0, tax_calculations_1.calculateFederalIncomeTax)(1000, 'WEEKLY', withOtherIncome);
            (0, vitest_1.expect)(result).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should handle deductions (W-4 Step 4b)', () => {
            const withDeductions = { ...mockTaxConfig, w4Step4bDeductions: 5000 };
            const result = (0, tax_calculations_1.calculateFederalIncomeTax)(1000, 'WEEKLY', withDeductions);
            (0, vitest_1.expect)(result).toBeGreaterThanOrEqual(0);
        });
        (0, vitest_1.it)('should handle extra withholding (W-4 Step 4c)', () => {
            const withExtra = { ...mockTaxConfig, w4Step4cExtraWithholding: 50 };
            const result = (0, tax_calculations_1.calculateFederalIncomeTax)(1000, 'WEEKLY', withExtra);
            (0, vitest_1.expect)(result).toBeGreaterThan(50);
        });
        (0, vitest_1.it)('should handle different pay periods', () => {
            const weekly = (0, tax_calculations_1.calculateFederalIncomeTax)(1000, 'WEEKLY', mockTaxConfig);
            const biWeekly = (0, tax_calculations_1.calculateFederalIncomeTax)(2000, 'BI_WEEKLY', mockTaxConfig);
            const monthly = (0, tax_calculations_1.calculateFederalIncomeTax)(4000, 'MONTHLY', mockTaxConfig);
            (0, vitest_1.expect)(weekly).toBeGreaterThan(0);
            (0, vitest_1.expect)(biWeekly).toBeGreaterThan(0);
            (0, vitest_1.expect)(monthly).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should return zero for negative or zero gross pay', () => {
            (0, vitest_1.expect)((0, tax_calculations_1.calculateFederalIncomeTax)(0, 'WEEKLY', mockTaxConfig)).toBe(0);
            (0, vitest_1.expect)((0, tax_calculations_1.calculateFederalIncomeTax)(-100, 'WEEKLY', mockTaxConfig)).toBe(0);
        });
    });
    (0, vitest_1.describe)('calculateSocialSecurityTax', () => {
        (0, vitest_1.it)('should calculate 6.2% of gross pay', () => {
            const result = (0, tax_calculations_1.calculateSocialSecurityTax)(1000, 0);
            (0, vitest_1.expect)(result).toBe(62);
        });
        (0, vitest_1.it)('should return zero when wage base is already met', () => {
            const result = (0, tax_calculations_1.calculateSocialSecurityTax)(1000, 169000);
            (0, vitest_1.expect)(result).toBe(0);
        });
        (0, vitest_1.it)('should calculate partial tax when approaching wage base', () => {
            const result = (0, tax_calculations_1.calculateSocialSecurityTax)(1000, 168000);
            (0, vitest_1.expect)(result).toBe(37.20);
        });
        (0, vitest_1.it)('should handle zero gross pay', () => {
            const result = (0, tax_calculations_1.calculateSocialSecurityTax)(0, 0);
            (0, vitest_1.expect)(result).toBe(0);
        });
        (0, vitest_1.it)('should handle negative YTD (should treat as zero)', () => {
            const result = (0, tax_calculations_1.calculateSocialSecurityTax)(1000, -100);
            (0, vitest_1.expect)(result).toBe(62);
        });
    });
    (0, vitest_1.describe)('calculateMedicareTax', () => {
        (0, vitest_1.it)('should calculate 1.45% of gross pay', () => {
            const result = (0, tax_calculations_1.calculateMedicareTax)(1000);
            (0, vitest_1.expect)(result).toBe(14.50);
        });
        (0, vitest_1.it)('should handle zero gross pay', () => {
            const result = (0, tax_calculations_1.calculateMedicareTax)(0);
            (0, vitest_1.expect)(result).toBe(0);
        });
        (0, vitest_1.it)('should handle very large amounts', () => {
            const result = (0, tax_calculations_1.calculateMedicareTax)(100000);
            (0, vitest_1.expect)(result).toBe(1450);
        });
    });
    (0, vitest_1.describe)('calculateAdditionalMedicareTax', () => {
        (0, vitest_1.it)('should return zero when under threshold', () => {
            const result = (0, tax_calculations_1.calculateAdditionalMedicareTax)(1000, 50000);
            (0, vitest_1.expect)(result).toBe(0);
        });
        (0, vitest_1.it)('should return zero when exactly at threshold', () => {
            const result = (0, tax_calculations_1.calculateAdditionalMedicareTax)(1000, 199000);
            (0, vitest_1.expect)(result).toBe(0);
        });
        (0, vitest_1.it)('should calculate additional tax when exceeding threshold', () => {
            const result = (0, tax_calculations_1.calculateAdditionalMedicareTax)(5000, 199000);
            (0, vitest_1.expect)(result).toBe(36);
        });
        (0, vitest_1.it)('should calculate full amount when already over threshold', () => {
            const result = (0, tax_calculations_1.calculateAdditionalMedicareTax)(1000, 201000);
            (0, vitest_1.expect)(result).toBe(9);
        });
        (0, vitest_1.it)('should handle zero gross pay', () => {
            const result = (0, tax_calculations_1.calculateAdditionalMedicareTax)(0, 201000);
            (0, vitest_1.expect)(result).toBe(0);
        });
    });
    (0, vitest_1.describe)('calculateStateIncomeTax', () => {
        (0, vitest_1.it)('should return zero for exempt employees', () => {
            const exemptConfig = { ...mockTaxConfig, stateExempt: true };
            const result = (0, tax_calculations_1.calculateStateIncomeTax)(1000, 'TX', exemptConfig);
            (0, vitest_1.expect)(result).toBe(0);
        });
        (0, vitest_1.it)('should return zero for Texas (no state income tax)', () => {
            const result = (0, tax_calculations_1.calculateStateIncomeTax)(1000, 'TX', mockTaxConfig);
            (0, vitest_1.expect)(result).toBe(0);
        });
        (0, vitest_1.it)('should return zero for Florida (no state income tax)', () => {
            const result = (0, tax_calculations_1.calculateStateIncomeTax)(1000, 'FL', mockTaxConfig);
            (0, vitest_1.expect)(result).toBe(0);
        });
        (0, vitest_1.it)('should calculate tax for California', () => {
            const result = (0, tax_calculations_1.calculateStateIncomeTax)(1000, 'CA', mockTaxConfig);
            (0, vitest_1.expect)(result).toBe(50);
        });
        (0, vitest_1.it)('should calculate tax for New York', () => {
            const result = (0, tax_calculations_1.calculateStateIncomeTax)(1000, 'NY', mockTaxConfig);
            (0, vitest_1.expect)(result).toBe(40);
        });
        (0, vitest_1.it)('should handle extra state withholding', () => {
            const withExtra = { ...mockTaxConfig, stateExtraWithholding: 25 };
            const result = (0, tax_calculations_1.calculateStateIncomeTax)(1000, 'CA', withExtra);
            (0, vitest_1.expect)(result).toBe(75);
        });
        (0, vitest_1.it)('should use default rate for unknown state', () => {
            const result = (0, tax_calculations_1.calculateStateIncomeTax)(1000, 'XX', mockTaxConfig);
            (0, vitest_1.expect)(result).toBe(30);
        });
        (0, vitest_1.it)('should handle negative gross pay', () => {
            const result = (0, tax_calculations_1.calculateStateIncomeTax)(-100, 'CA', mockTaxConfig);
            (0, vitest_1.expect)(result).toBe(0);
        });
    });
    (0, vitest_1.describe)('calculateAllTaxes', () => {
        (0, vitest_1.it)('should calculate all tax components', () => {
            const result = (0, tax_calculations_1.calculateAllTaxes)(1000, 0, 'WEEKLY', mockTaxConfig);
            (0, vitest_1.expect)(result.federalIncomeTax).toBeGreaterThanOrEqual(0);
            (0, vitest_1.expect)(result.stateIncomeTax).toBeGreaterThanOrEqual(0);
            (0, vitest_1.expect)(result.localIncomeTax).toBeGreaterThanOrEqual(0);
            (0, vitest_1.expect)(result.socialSecurityTax).toBe(62);
            (0, vitest_1.expect)(result.medicareTax).toBe(14.50);
            (0, vitest_1.expect)(result.additionalMedicareTax).toBeGreaterThanOrEqual(0);
            (0, vitest_1.expect)(result.totalTax).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should sum taxes correctly', () => {
            const result = (0, tax_calculations_1.calculateAllTaxes)(1000, 0, 'WEEKLY', mockTaxConfig);
            const expectedTotal = result.federalIncomeTax +
                result.stateIncomeTax +
                result.localIncomeTax +
                result.socialSecurityTax +
                result.medicareTax +
                result.additionalMedicareTax;
            (0, vitest_1.expect)(result.totalTax).toBeCloseTo(expectedTotal, 2);
        });
        (0, vitest_1.it)('should handle YTD gross pay for Social Security limit', () => {
            const result = (0, tax_calculations_1.calculateAllTaxes)(1000, 168000, 'WEEKLY', mockTaxConfig);
            (0, vitest_1.expect)(result.socialSecurityTax).toBeLessThan(62);
        });
        (0, vitest_1.it)('should handle additional Medicare tax threshold', () => {
            const result = (0, tax_calculations_1.calculateAllTaxes)(5000, 199000, 'WEEKLY', mockTaxConfig);
            (0, vitest_1.expect)(result.additionalMedicareTax).toBeGreaterThan(0);
        });
    });
    (0, vitest_1.describe)('calculateSupplementalWithholding', () => {
        (0, vitest_1.it)('should use 22% flat rate for regular supplemental wages', () => {
            const result = (0, tax_calculations_1.calculateSupplementalWithholding)(1000, true);
            (0, vitest_1.expect)(result).toBe(220);
        });
        (0, vitest_1.it)('should use 37% flat rate for supplemental wages over $1 million', () => {
            const result = (0, tax_calculations_1.calculateSupplementalWithholding)(1500000, true);
            (0, vitest_1.expect)(result).toBe(555000);
        });
        (0, vitest_1.it)('should calculate withholding using aggregate method when parameters provided', () => {
            const aggregateParams = {
                regularGrossPay: 2000,
                payPeriodType: 'BI_WEEKLY',
                taxConfig: mockTaxConfig,
            };
            const result = (0, tax_calculations_1.calculateSupplementalWithholding)(1000, false, aggregateParams);
            (0, vitest_1.expect)(result).toBeGreaterThan(0);
            (0, vitest_1.expect)(result).toBeLessThanOrEqual(1000);
        });
        (0, vitest_1.it)('should throw error when using aggregate method without parameters', () => {
            (0, vitest_1.expect)(() => {
                (0, tax_calculations_1.calculateSupplementalWithholding)(1000, false);
            }).toThrow('Aggregate method requires aggregate parameters');
        });
        (0, vitest_1.it)('should handle zero supplemental amount', () => {
            const result = (0, tax_calculations_1.calculateSupplementalWithholding)(0, true);
            (0, vitest_1.expect)(result).toBe(0);
        });
        (0, vitest_1.it)('should handle negative supplemental amount', () => {
            const result = (0, tax_calculations_1.calculateSupplementalWithholding)(-100, true);
            (0, vitest_1.expect)(result).toBe(0);
        });
    });
    (0, vitest_1.describe)('estimateQuarterlyTaxLiability', () => {
        (0, vitest_1.it)('should calculate employer FICA taxes correctly', () => {
            const result = (0, tax_calculations_1.estimateQuarterlyTaxLiability)(50000, 5000);
            (0, vitest_1.expect)(result.employerSocialSecurity).toBe(3100);
            (0, vitest_1.expect)(result.employerMedicare).toBe(725);
            (0, vitest_1.expect)(result.totalEmployerTaxes).toBe(3825);
        });
        (0, vitest_1.it)('should respect Social Security wage base', () => {
            const result = (0, tax_calculations_1.estimateQuarterlyTaxLiability)(200000, 20000);
            (0, vitest_1.expect)(result.employerSocialSecurity).toBe(10453.20);
            (0, vitest_1.expect)(result.employerMedicare).toBe(2900);
        });
        (0, vitest_1.it)('should calculate total deposits correctly', () => {
            const result = (0, tax_calculations_1.estimateQuarterlyTaxLiability)(50000, 5000);
            const expectedDeposits = 5000 + (3100 * 2) + (725 * 2);
            (0, vitest_1.expect)(result.totalDeposits).toBeCloseTo(expectedDeposits, 2);
        });
        (0, vitest_1.it)('should handle zero wages', () => {
            const result = (0, tax_calculations_1.estimateQuarterlyTaxLiability)(0, 0);
            (0, vitest_1.expect)(result.employerSocialSecurity).toBe(0);
            (0, vitest_1.expect)(result.employerMedicare).toBe(0);
            (0, vitest_1.expect)(result.totalEmployerTaxes).toBe(0);
            (0, vitest_1.expect)(result.totalDeposits).toBe(0);
        });
    });
    (0, vitest_1.describe)('Edge Cases and Error Handling', () => {
        (0, vitest_1.it)('should handle very large gross pay amounts', () => {
            const result = (0, tax_calculations_1.calculateAllTaxes)(1000000, 0, 'WEEKLY', mockTaxConfig);
            (0, vitest_1.expect)(Number.isFinite(result.totalTax)).toBe(true);
            (0, vitest_1.expect)(result.totalTax).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should handle very small gross pay amounts', () => {
            const result = (0, tax_calculations_1.calculateAllTaxes)(0.01, 0, 'WEEKLY', mockTaxConfig);
            (0, vitest_1.expect)(Number.isFinite(result.totalTax)).toBe(true);
            (0, vitest_1.expect)(result.totalTax).toBeGreaterThanOrEqual(0);
        });
        (0, vitest_1.it)('should handle negative YTD amounts gracefully', () => {
            const result = (0, tax_calculations_1.calculateAllTaxes)(1000, -1000, 'WEEKLY', mockTaxConfig);
            (0, vitest_1.expect)(result.socialSecurityTax).toBe(62);
        });
        (0, vitest_1.it)('should handle all exempt configurations', () => {
            const exemptConfig = {
                ...mockTaxConfig,
                federalExempt: true,
                stateExempt: true,
            };
            const result = (0, tax_calculations_1.calculateAllTaxes)(1000, 0, 'WEEKLY', exemptConfig);
            (0, vitest_1.expect)(result.federalIncomeTax).toBe(0);
            (0, vitest_1.expect)(result.stateIncomeTax).toBe(0);
            (0, vitest_1.expect)(result.socialSecurityTax).toBe(62);
            (0, vitest_1.expect)(result.medicareTax).toBe(14.50);
        });
        (0, vitest_1.it)('should handle maximum withholding scenarios', () => {
            const maxConfig = {
                ...mockTaxConfig,
                w4Step4cExtraWithholding: 1000,
                stateExtraWithholding: 500,
            };
            const result = (0, tax_calculations_1.calculateAllTaxes)(2000, 0, 'WEEKLY', maxConfig);
            (0, vitest_1.expect)(result.federalIncomeTax).toBeGreaterThanOrEqual(1000);
            (0, vitest_1.expect)(result.stateIncomeTax).toBeGreaterThanOrEqual(500);
        });
    });
    (0, vitest_1.describe)('Tax Compliance Tests', () => {
        (0, vitest_1.it)('should never return negative tax amounts', () => {
            const testCases = [
                { gross: 0, ytd: 0 },
                { gross: -100, ytd: 0 },
                { gross: 100, ytd: -100 },
            ];
            testCases.forEach(({ gross, ytd }) => {
                const result = (0, tax_calculations_1.calculateAllTaxes)(gross, ytd, 'WEEKLY', mockTaxConfig);
                (0, vitest_1.expect)(result.federalIncomeTax).toBeGreaterThanOrEqual(0);
                (0, vitest_1.expect)(result.stateIncomeTax).toBeGreaterThanOrEqual(0);
                (0, vitest_1.expect)(result.localIncomeTax).toBeGreaterThanOrEqual(0);
                (0, vitest_1.expect)(result.socialSecurityTax).toBeGreaterThanOrEqual(0);
                (0, vitest_1.expect)(result.medicareTax).toBeGreaterThanOrEqual(0);
                (0, vitest_1.expect)(result.additionalMedicareTax).toBeGreaterThanOrEqual(0);
                (0, vitest_1.expect)(result.totalTax).toBeGreaterThanOrEqual(0);
            });
        });
        (0, vitest_1.it)('should respect Social Security wage base limit', () => {
            const wageBase = 168600;
            const testCases = [
                { gross: 1000, ytd: wageBase - 1000, expected: 62 },
                { gross: 1000, ytd: wageBase - 500, expected: 31 },
                { gross: 1000, ytd: wageBase, expected: 0 },
                { gross: 1000, ytd: wageBase + 1000, expected: 0 },
            ];
            testCases.forEach(({ gross, ytd, expected }) => {
                const result = (0, tax_calculations_1.calculateSocialSecurityTax)(gross, ytd);
                (0, vitest_1.expect)(result).toBeCloseTo(expected, 2);
            });
        });
        (0, vitest_1.it)('should handle Additional Medicare threshold correctly', () => {
            const threshold = 200000;
            const testCases = [
                { gross: 1000, ytd: threshold - 1000, expected: 0 },
                { gross: 1000, ytd: threshold - 500, expected: 4.5 },
                { gross: 1000, ytd: threshold, expected: 9 },
                { gross: 1000, ytd: threshold + 1000, expected: 9 },
            ];
            testCases.forEach(({ gross, ytd, expected }) => {
                const result = (0, tax_calculations_1.calculateAdditionalMedicareTax)(gross, ytd);
                (0, vitest_1.expect)(result).toBeCloseTo(expected, 2);
            });
        });
    });
});
//# sourceMappingURL=tax-calculations.test.js.map