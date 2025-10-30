/**
 * Unit tests for deduction calculation utilities
 * 
 * Tests deduction calculations, garnishments, benefits,
 * and compliance with legal requirements
 */

import {
  calculateDeductionAmount,
  calculateGarnishmentAmount,
  calculateAllDeductions,
  sortGarnishmentsByPriority,
  calculateEmployerMatch,
  isDeductionLimitReached,
  getRemainingDeductionLimit,
  groupDeductionsByCategory,
} from '../deduction-calculations';
import { Deduction, GarnishmentOrder } from '../../types/payroll';
import { describe, it, expect } from 'vitest';

describe('Deduction Calculation Utilities', () => {
  const mockDeduction: Deduction = {
    id: 'test-deduction',
    deductionType: 'HEALTH_INSURANCE',
    deductionCode: 'HLTH-001',
    description: 'Health Insurance Premium',
    amount: 100,
    calculationMethod: 'FIXED',
    isPreTax: true,
    isPostTax: false,
    isStatutory: false,
    isActive: true,
    hasLimit: false,
  };

  const mockGarnishmentDeduction: Deduction = {
    id: 'garnishment-test',
    deductionType: 'GARNISHMENT_CHILD_SUPPORT',
    deductionCode: 'CS-001',
    description: 'Child Support',
    amount: 0,
    calculationMethod: 'FIXED',
    percentage: 25,
    isPreTax: false,
    isPostTax: true,
    isStatutory: true,
    isActive: true,
    hasLimit: false,
    garnishmentOrder: {
      orderNumber: 'CS-2023-001',
      issuingAuthority: 'Family Court',
      orderType: 'CHILD_SUPPORT',
      orderDate: new Date('2023-01-01'),
      orderAmount: 500,
      maxPercentage: 50,
      priority: 1,
      startDate: new Date('2023-01-01'),
      totalAmountOrdered: 12000,
      remittanceAddress: {
        line1: '123 Court St',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        country: 'USA',
      },
    },
  };

  describe('calculateDeductionAmount', () => {
    it('should calculate fixed amount deduction', () => {
      const result = calculateDeductionAmount(1000, 800, mockDeduction);
      expect(result).toBe(100);
    });

    it('should calculate percentage of gross pay', () => {
      const percentageDeduction = {
        ...mockDeduction,
        calculationMethod: 'PERCENTAGE' as const,
        percentage: 5,
        amount: 0,
      };
      const result = calculateDeductionAmount(1000, 800, percentageDeduction);
      expect(result).toBe(50); // 1000 * 0.05
    });

    it('should calculate percentage of net pay', () => {
      const netPercentageDeduction = {
        ...mockDeduction,
        calculationMethod: 'PERCENTAGE_OF_NET' as const,
        percentage: 10,
        amount: 0,
      };
      const result = calculateDeductionAmount(1000, 800, netPercentageDeduction);
      expect(result).toBe(80); // 800 * 0.10
    });

    it('should handle graduated/formula deductions', () => {
      const graduatedDeduction = {
        ...mockDeduction,
        calculationMethod: 'GRADUATED' as const,
        amount: 150,
      };
      const result = calculateDeductionAmount(1000, 800, graduatedDeduction);
      expect(result).toBe(150); // Falls back to amount
    });

    it('should respect yearly limit', () => {
      const limitedDeduction = {
        ...mockDeduction,
        hasLimit: true,
        yearlyLimit: 500,
        yearToDateAmount: 450,
      };
      const result = calculateDeductionAmount(1000, 800, limitedDeduction);
      expect(result).toBe(50); // 500 - 450 = 50 remaining
    });

    it('should return zero when limit is reached', () => {
      const maxedDeduction = {
        ...mockDeduction,
        hasLimit: true,
        yearlyLimit: 500,
        yearToDateAmount: 500,
      };
      const result = calculateDeductionAmount(1000, 800, maxedDeduction);
      expect(result).toBe(0);
    });

    it('should handle negative remaining limit', () => {
      const overLimitDeduction = {
        ...mockDeduction,
        hasLimit: true,
        yearlyLimit: 500,
        yearToDateAmount: 600,
      };
      const result = calculateDeductionAmount(1000, 800, overLimitDeduction);
      expect(result).toBe(0);
    });

    it('should handle zero gross pay', () => {
      const result = calculateDeductionAmount(0, 0, mockDeduction);
      expect(result).toBe(100); // Fixed amount still applies
    });

    it('should handle negative gross pay', () => {
      const result = calculateDeductionAmount(-100, -100, mockDeduction);
      expect(result).toBe(100); // Fixed amount still applies
    });
  });

  describe('calculateGarnishmentAmount', () => {
    it('should calculate child support garnishment', () => {
      const result = calculateGarnishmentAmount(1000, 800, mockGarnishmentDeduction);
      expect(result).toBe(400); // 800 * 0.50 (max percentage)
    });

    it('should use fixed order amount when specified', () => {
      const fixedGarnishment = {
        ...mockGarnishmentDeduction,
        garnishmentOrder: {
          ...mockGarnishmentDeduction.garnishmentOrder!,
          orderAmount: 300,
        },
      };
      const result = calculateGarnishmentAmount(1000, 800, fixedGarnishment);
      expect(result).toBe(300);
    });

    it('should respect remaining balance', () => {
      const balanceGarnishment = {
        ...mockGarnishmentDeduction,
        garnishmentOrder: {
          ...mockGarnishmentDeduction.garnishmentOrder!,
          remainingBalance: 200,
        },
      };
      const result = calculateGarnishmentAmount(1000, 800, balanceGarnishment);
      expect(result).toBe(200); // Limited by remaining balance
    });

    it('should handle tax levy with 100% max', () => {
      const taxLevyDeduction = {
        ...mockGarnishmentDeduction,
        deductionType: 'GARNISHMENT_TAX_LEVY' as const,
        garnishmentOrder: {
          ...mockGarnishmentDeduction.garnishmentOrder!,
          orderType: 'TAX_LEVY' as const,
          maxPercentage: 100,
        },
      };
      const result = calculateGarnishmentAmount(1000, 800, taxLevyDeduction);
      expect(result).toBe(800); // 100% of disposable income
    });

    it('should handle student loan garnishment', () => {
      const studentLoanDeduction = {
        ...mockGarnishmentDeduction,
        deductionType: 'GARNISHMENT_STUDENT_LOAN' as const,
        garnishmentOrder: {
          ...mockGarnishmentDeduction.garnishmentOrder!,
          orderType: 'STUDENT_LOAN' as const,
          maxPercentage: 15,
        },
      };
      const result = calculateGarnishmentAmount(1000, 800, studentLoanDeduction);
      expect(result).toBe(120); // 800 * 0.15
    });

    it('should handle creditor garnishment', () => {
      const creditorDeduction = {
        ...mockGarnishmentDeduction,
        deductionType: 'GARNISHMENT_CREDITOR' as const,
        garnishmentOrder: {
          ...mockGarnishmentDeduction.garnishmentOrder!,
          orderType: 'CREDITOR' as const,
          maxPercentage: 25,
        },
      };
      const result = calculateGarnishmentAmount(1000, 800, creditorDeduction);
      expect(result).toBe(200); // 800 * 0.25
    });

    it('should fall back to regular calculation for non-garnishment', () => {
      const result = calculateGarnishmentAmount(1000, 800, mockDeduction);
      expect(result).toBe(100); // Regular fixed amount
    });

    it('should handle zero disposable income', () => {
      const result = calculateGarnishmentAmount(1000, 0, mockGarnishmentDeduction);
      expect(result).toBe(0);
    });

    it('should handle negative disposable income', () => {
      const result = calculateGarnishmentAmount(1000, -100, mockGarnishmentDeduction);
      expect(result).toBe(0);
    });
  });

  describe('calculateAllDeductions', () => {
    const preTaxDeduction: Deduction = {
      ...mockDeduction,
      deductionType: 'HEALTH_INSURANCE',
      isPreTax: true,
      isPostTax: false,
      amount: 100,
    };

    const postTaxDeduction: Deduction = {
      ...mockDeduction,
      id: 'post-tax',
      deductionType: 'UNION_DUES',
      isPreTax: false,
      isPostTax: true,
      amount: 50,
    };

    const statutoryDeduction: Deduction = {
      ...mockDeduction,
      id: 'statutory',
      deductionType: 'FEDERAL_INCOME_TAX',
      isPreTax: false,
      isPostTax: false,
      isStatutory: true,
      amount: 200,
    };

    it('should calculate all deduction types in correct order', () => {
      const result = calculateAllDeductions(
        1000,
        [preTaxDeduction],
        [postTaxDeduction],
        [statutoryDeduction]
      );

      expect(result.preTaxTotal).toBe(100);
      expect(result.statutoryTotal).toBe(200);
      expect(result.postTaxTotal).toBe(50);
      expect(result.calculatedDeductions).toHaveLength(3);
    });

    it('should reduce taxable income by pre-tax deductions', () => {
      const result = calculateAllDeductions(
        1000,
        [preTaxDeduction],
        [],
        []
      );

      // Net pay should be gross minus pre-tax deductions
      expect(result.preTaxTotal).toBe(100);
      expect(result.statutoryTotal).toBe(0);
      expect(result.postTaxTotal).toBe(0);
    });

    it('should calculate post-tax deductions after taxes', () => {
      const result = calculateAllDeductions(
        1000,
        [],
        [postTaxDeduction],
        [statutoryDeduction]
      );

      // Post-tax should be calculated from (gross - statutory)
      expect(result.statutoryTotal).toBe(200);
      expect(result.postTaxTotal).toBe(50);
    });

    it('should handle multiple deductions of each type', () => {
      const preTax2: Deduction = { ...preTaxDeduction, id: 'pre2', amount: 75 };
      const postTax2: Deduction = { ...postTaxDeduction, id: 'post2', amount: 25 };
      const statutory2: Deduction = { ...statutoryDeduction, id: 'stat2', amount: 150 };

      const result = calculateAllDeductions(
        1000,
        [preTaxDeduction, preTax2],
        [postTaxDeduction, postTax2],
        [statutoryDeduction, statutory2]
      );

      expect(result.preTaxTotal).toBe(175); // 100 + 75
      expect(result.statutoryTotal).toBe(350); // 200 + 150
      expect(result.postTaxTotal).toBe(75); // 50 + 25
    });

    it('should include calculated amounts in returned deductions', () => {
      const result = calculateAllDeductions(
        1000,
        [preTaxDeduction],
        [],
        []
      );

      const calculated = result.calculatedDeductions[0];
      expect(calculated.id).toBe(preTaxDeduction.id);
      expect(calculated.calculatedAmount).toBe(100);
    });

    it('should handle empty deduction arrays', () => {
      const result = calculateAllDeductions(1000, [], [], []);

      expect(result.preTaxTotal).toBe(0);
      expect(result.statutoryTotal).toBe(0);
      expect(result.postTaxTotal).toBe(0);
      expect(result.calculatedDeductions).toHaveLength(0);
    });
  });

  describe('sortGarnishmentsByPriority', () => {
    it('should sort garnishments by legal priority', () => {
      const garnishments = [
        {
          ...mockGarnishmentDeduction,
          deductionType: 'GARNISHMENT_CREDITOR' as const,
          garnishmentOrder: { ...mockGarnishmentDeduction.garnishmentOrder!, priority: 4 },
        },
        {
          ...mockGarnishmentDeduction,
          deductionType: 'GARNISHMENT_CHILD_SUPPORT' as const,
          garnishmentOrder: { ...mockGarnishmentDeduction.garnishmentOrder!, priority: 1 },
        },
        {
          ...mockGarnishmentDeduction,
          deductionType: 'GARNISHMENT_STUDENT_LOAN' as const,
          garnishmentOrder: { ...mockGarnishmentDeduction.garnishmentOrder!, priority: 3 },
        },
        {
          ...mockGarnishmentDeduction,
          deductionType: 'GARNISHMENT_TAX_LEVY' as const,
          garnishmentOrder: { ...mockGarnishmentDeduction.garnishmentOrder!, priority: 2 },
        },
      ];

      const sorted = sortGarnishmentsByPriority(garnishments);

      expect(sorted[0].deductionType).toBe('GARNISHMENT_CHILD_SUPPORT');
      expect(sorted[1].deductionType).toBe('GARNISHMENT_TAX_LEVY');
      expect(sorted[2].deductionType).toBe('GARNISHMENT_STUDENT_LOAN');
      expect(sorted[3].deductionType).toBe('GARNISHMENT_CREDITOR');
    });

    it('should handle garnishments without priority using default mapping', () => {
      const garnishments = [
        {
          ...mockGarnishmentDeduction,
          deductionType: 'GARNISHMENT_CREDITOR' as const,
          garnishmentOrder: { ...mockGarnishmentDeduction.garnishmentOrder!, priority: 2 },
        },
        {
          ...mockGarnishmentDeduction,
          deductionType: 'GARNISHMENT_CHILD_SUPPORT' as const,
          garnishmentOrder: { ...mockGarnishmentDeduction.garnishmentOrder!, priority: 1 },
        },
      ];

      const sorted = sortGarnishmentsByPriority(garnishments);

      expect(sorted[0].deductionType).toBe('GARNISHMENT_CHILD_SUPPORT');
      expect(sorted[1].deductionType).toBe('GARNISHMENT_CREDITOR');
    });

    it('should handle non-garnishment deductions', () => {
      const deductions = [
        mockDeduction,
        mockGarnishmentDeduction,
      ];

      const sorted = sortGarnishmentsByPriority(deductions);

      // Non-garnishments should get high priority (999)
      expect(sorted[1].deductionType).toBe('HEALTH_INSURANCE');
    });
  });

  describe('calculateEmployerMatch', () => {
    it('should calculate employer match correctly', () => {
      const result = calculateEmployerMatch(100, 50, 200);
      expect(result).toBe(50); // 100 * 0.50
    });

    it('should respect maximum match amount', () => {
      const result = calculateEmployerMatch(100, 100, 50);
      expect(result).toBe(50); // Capped at 50
    });

    it('should handle zero contribution', () => {
      const result = calculateEmployerMatch(0, 50, 200);
      expect(result).toBe(0);
    });

    it('should handle zero match percentage', () => {
      const result = calculateEmployerMatch(100, 0, 200);
      expect(result).toBe(0);
    });

    it('should handle no maximum limit', () => {
      const result = calculateEmployerMatch(100, 50);
      expect(result).toBe(50);
    });
  });

  describe('isDeductionLimitReached', () => {
    it('should return false when no limit is set', () => {
      const result = isDeductionLimitReached(mockDeduction);
      expect(result).toBe(false);
    });

    it('should return false when under limit', () => {
      const limitedDeduction = {
        ...mockDeduction,
        hasLimit: true,
        yearlyLimit: 1000,
        yearToDateAmount: 500,
      };
      const result = isDeductionLimitReached(limitedDeduction);
      expect(result).toBe(false);
    });

    it('should return true when at limit', () => {
      const maxedDeduction = {
        ...mockDeduction,
        hasLimit: true,
        yearlyLimit: 1000,
        yearToDateAmount: 1000,
      };
      const result = isDeductionLimitReached(maxedDeduction);
      expect(result).toBe(true);
    });

    it('should return true when over limit', () => {
      const overLimitDeduction = {
        ...mockDeduction,
        hasLimit: true,
        yearlyLimit: 1000,
        yearToDateAmount: 1200,
      };
      const result = isDeductionLimitReached(overLimitDeduction);
      expect(result).toBe(true);
    });
  });

  describe('getRemainingDeductionLimit', () => {
    it('should return null when no limit is set', () => {
      const result = getRemainingDeductionLimit(mockDeduction);
      expect(result).toBeNull();
    });

    it('should return remaining amount when under limit', () => {
      const limitedDeduction = {
        ...mockDeduction,
        hasLimit: true,
        yearlyLimit: 1000,
        yearToDateAmount: 300,
      };
      const result = getRemainingDeductionLimit(limitedDeduction);
      expect(result).toBe(700);
    });

    it('should return zero when at limit', () => {
      const maxedDeduction = {
        ...mockDeduction,
        hasLimit: true,
        yearlyLimit: 1000,
        yearToDateAmount: 1000,
      };
      const result = getRemainingDeductionLimit(maxedDeduction);
      expect(result).toBe(0);
    });

    it('should return zero when over limit', () => {
      const overLimitDeduction = {
        ...mockDeduction,
        hasLimit: true,
        yearlyLimit: 1000,
        yearToDateAmount: 1200,
      };
      const result = getRemainingDeductionLimit(overLimitDeduction);
      expect(result).toBe(0);
    });
  });

  describe('groupDeductionsByCategory', () => {
    const taxDeduction: Deduction = {
      ...mockDeduction,
      deductionType: 'FEDERAL_INCOME_TAX',
    };

    const benefitDeduction: Deduction = {
      ...mockDeduction,
      deductionType: 'HEALTH_INSURANCE',
    };

    const loanDeduction: Deduction = {
      ...mockDeduction,
      deductionType: 'LOAN_REPAYMENT',
    };

    const retirementDeduction: Deduction = {
      ...mockDeduction,
      deductionType: 'RETIREMENT_401K',
    };

    const otherDeduction: Deduction = {
      ...mockDeduction,
      deductionType: 'OTHER',
    };

    const healthInsuranceDeduction = {
      ...mockDeduction,
      deductionType: 'HEALTH_INSURANCE',
      calculatedAmount: 100,
    };

    const retirement401kDeduction = {
      ...mockDeduction,
      deductionType: 'RETIREMENT_401K',
      calculatedAmount: 150,
    };

    const childSupportDeduction = {
      ...mockDeduction,
      deductionType: 'GARNISHMENT_CHILD_SUPPORT',
      calculatedAmount: 300,
    };

    const uniformDeduction = {
      ...mockDeduction,
      deductionType: 'UNIFORM',
      calculatedAmount: 50,
    };

    const deductions = [
      taxDeduction,
      healthInsuranceDeduction,
      retirement401kDeduction,
      childSupportDeduction,
      uniformDeduction,
    ] as Array<Deduction & { calculatedAmount: number }>;

    it('should group deductions into correct categories', () => {
      const result = groupDeductionsByCategory(deductions);

      expect(result.taxes).toHaveLength(1);
      expect(result.taxes[0].deductionType).toBe('FEDERAL_INCOME_TAX');

      expect(result.benefits).toHaveLength(1);
      expect(result.benefits[0].deductionType).toBe('HEALTH_INSURANCE');

      expect(result.retirement).toHaveLength(1);
      expect(result.retirement[0].deductionType).toBe('RETIREMENT_401K');

      expect(result.garnishments).toHaveLength(1);
      expect(result.garnishments[0].deductionType).toBe('GARNISHMENT_CHILD_SUPPORT');

      expect(result.other).toHaveLength(1);
      expect(result.other[0].deductionType).toBe('UNIFORM');
    });

    it('should handle Social Security and Medicare as taxes', () => {
      const ssDeduction = {
        ...mockDeduction,
        deductionType: 'SOCIAL_SECURITY' as const,
        calculatedAmount: 62,
      };

      const medicareDeduction = {
        ...mockDeduction,
        deductionType: 'MEDICARE' as const,
        calculatedAmount: 14.50,
      };

      const result = groupDeductionsByCategory([ssDeduction, medicareDeduction]);

      expect(result.taxes).toHaveLength(2);
      expect(result.taxes.map(t => t.deductionType)).toContain('SOCIAL_SECURITY');
      expect(result.taxes.map(t => t.deductionType)).toContain('MEDICARE');
    });

    it('should handle empty input', () => {
      const result = groupDeductionsByCategory([]);

      expect(result.taxes).toHaveLength(0);
      expect(result.benefits).toHaveLength(0);
      expect(result.retirement).toHaveLength(0);
      expect(result.garnishments).toHaveLength(0);
      expect(result.other).toHaveLength(0);
    });

    it('should handle 403b retirement plans', () => {
      const retirement403b = {
        ...mockDeduction,
        deductionType: 'RETIREMENT_403B' as const,
        calculatedAmount: 100,
      };

      const result = groupDeductionsByCategory([retirement403b]);

      expect(result.retirement).toHaveLength(1);
      expect(result.retirement[0].deductionType).toBe('RETIREMENT_403B');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle zero percentage deductions', () => {
      const zeroPercentageDeduction = {
        ...mockDeduction,
        calculationMethod: 'PERCENTAGE' as const,
        percentage: 0,
        amount: 0,
      };
      const result = calculateDeductionAmount(1000, 800, zeroPercentageDeduction);
      expect(result).toBe(0);
    });

    it('should handle very high percentage deductions', () => {
      const highPercentageDeduction = {
        ...mockDeduction,
        calculationMethod: 'PERCENTAGE' as const,
        percentage: 100,
        amount: 0,
      };
      const result = calculateDeductionAmount(1000, 800, highPercentageDeduction);
      expect(result).toBe(1000); // 100% of gross
    });

    it('should handle negative amounts gracefully', () => {
      const negativeDeduction = {
        ...mockDeduction,
        amount: -50,
      };
      const result = calculateDeductionAmount(1000, 800, negativeDeduction);
      expect(result).toBe(-50);
    });

    it('should handle undefined YTD amounts', () => {
      const noYTDDeduction = {
        ...mockDeduction,
        hasLimit: true,
        yearlyLimit: 1000,
        yearToDateAmount: undefined,
      };
      const result = calculateDeductionAmount(1000, 800, noYTDDeduction);
      expect(result).toBe(100); // Should treat undefined YTD as 0
    });

    it('should handle null YTD amounts', () => {
      const nullYTDDeduction = {
        ...mockDeduction,
        hasLimit: true,
        yearlyLimit: 1000,
        yearToDateAmount: undefined,
      };
      const result = calculateDeductionAmount(1000, 800, nullYTDDeduction);
      expect(result).toBe(100); // Should treat null YTD as 0
    });
  });

  describe('Compliance Tests', () => {
    it('should never return negative deduction amounts', () => {
      const testCases = [
        { gross: 0, net: 0 },
        { gross: -100, net: -100 },
        { gross: 100, net: -50 },
      ];

      testCases.forEach(({ gross, net }) => {
        const result = calculateDeductionAmount(gross, net, mockDeduction);
        expect(result).toBeGreaterThanOrEqual(0);
      });
    });

    it('should respect garnishment limits by law', () => {
      // Child support can be up to 50-65%
      const childSupportResult = calculateGarnishmentAmount(1000, 800, mockGarnishmentDeduction);
      expect(childSupportResult).toBeLessThanOrEqual(520); // 65% max for some cases

      // Creditor garnishments max 25%
      const creditorDeduction = {
        ...mockGarnishmentDeduction,
        deductionType: 'GARNISHMENT_CREDITOR' as const,
        garnishmentOrder: {
          ...mockGarnishmentDeduction.garnishmentOrder!,
          orderType: 'CREDITOR' as const,
          maxPercentage: 25,
        },
      };
      const creditorResult = calculateGarnishmentAmount(1000, 800, creditorDeduction);
      expect(creditorResult).toBeLessThanOrEqual(250); // 25% of disposable income
    });

    it('should handle deduction overflow gracefully', () => {
      // Create scenario where deductions exceed net pay
      const hugeDeduction = {
        ...mockDeduction,
        amount: 5000,
      };
      const result = calculateDeductionAmount(1000, 800, hugeDeduction);
      expect(result).toBe(5000); // Fixed amount still applies
    });
  });
});