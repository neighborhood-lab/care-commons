"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const deduction_calculations_1 = require("../deduction-calculations");
const vitest_1 = require("vitest");
(0, vitest_1.describe)('Deduction Calculation Utilities', () => {
    const mockDeduction = {
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
    const mockGarnishmentDeduction = {
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
    (0, vitest_1.describe)('calculateDeductionAmount', () => {
        (0, vitest_1.it)('should calculate fixed amount deduction', () => {
            const result = (0, deduction_calculations_1.calculateDeductionAmount)(1000, 800, mockDeduction);
            (0, vitest_1.expect)(result).toBe(100);
        });
        (0, vitest_1.it)('should calculate percentage of gross pay', () => {
            const percentageDeduction = {
                ...mockDeduction,
                calculationMethod: 'PERCENTAGE',
                percentage: 5,
                amount: 0,
            };
            const result = (0, deduction_calculations_1.calculateDeductionAmount)(1000, 800, percentageDeduction);
            (0, vitest_1.expect)(result).toBe(50);
        });
        (0, vitest_1.it)('should calculate percentage of net pay', () => {
            const netPercentageDeduction = {
                ...mockDeduction,
                calculationMethod: 'PERCENTAGE_OF_NET',
                percentage: 10,
                amount: 0,
            };
            const result = (0, deduction_calculations_1.calculateDeductionAmount)(1000, 800, netPercentageDeduction);
            (0, vitest_1.expect)(result).toBe(80);
        });
        (0, vitest_1.it)('should handle graduated/formula deductions', () => {
            const graduatedDeduction = {
                ...mockDeduction,
                calculationMethod: 'GRADUATED',
                amount: 150,
            };
            const result = (0, deduction_calculations_1.calculateDeductionAmount)(1000, 800, graduatedDeduction);
            (0, vitest_1.expect)(result).toBe(150);
        });
        (0, vitest_1.it)('should respect yearly limit', () => {
            const limitedDeduction = {
                ...mockDeduction,
                hasLimit: true,
                yearlyLimit: 500,
                yearToDateAmount: 450,
            };
            const result = (0, deduction_calculations_1.calculateDeductionAmount)(1000, 800, limitedDeduction);
            (0, vitest_1.expect)(result).toBe(50);
        });
        (0, vitest_1.it)('should return zero when limit is reached', () => {
            const maxedDeduction = {
                ...mockDeduction,
                hasLimit: true,
                yearlyLimit: 500,
                yearToDateAmount: 500,
            };
            const result = (0, deduction_calculations_1.calculateDeductionAmount)(1000, 800, maxedDeduction);
            (0, vitest_1.expect)(result).toBe(0);
        });
        (0, vitest_1.it)('should handle negative remaining limit', () => {
            const overLimitDeduction = {
                ...mockDeduction,
                hasLimit: true,
                yearlyLimit: 500,
                yearToDateAmount: 600,
            };
            const result = (0, deduction_calculations_1.calculateDeductionAmount)(1000, 800, overLimitDeduction);
            (0, vitest_1.expect)(result).toBe(0);
        });
        (0, vitest_1.it)('should handle zero gross pay', () => {
            const result = (0, deduction_calculations_1.calculateDeductionAmount)(0, 0, mockDeduction);
            (0, vitest_1.expect)(result).toBe(100);
        });
        (0, vitest_1.it)('should handle negative gross pay', () => {
            const result = (0, deduction_calculations_1.calculateDeductionAmount)(-100, -100, mockDeduction);
            (0, vitest_1.expect)(result).toBe(100);
        });
    });
    (0, vitest_1.describe)('calculateGarnishmentAmount', () => {
        (0, vitest_1.it)('should calculate child support garnishment', () => {
            const result = (0, deduction_calculations_1.calculateGarnishmentAmount)(1000, 800, mockGarnishmentDeduction);
            (0, vitest_1.expect)(result).toBe(400);
        });
        (0, vitest_1.it)('should use fixed order amount when specified', () => {
            const fixedGarnishment = {
                ...mockGarnishmentDeduction,
                garnishmentOrder: {
                    ...mockGarnishmentDeduction.garnishmentOrder,
                    orderAmount: 300,
                },
            };
            const result = (0, deduction_calculations_1.calculateGarnishmentAmount)(1000, 800, fixedGarnishment);
            (0, vitest_1.expect)(result).toBe(300);
        });
        (0, vitest_1.it)('should respect remaining balance', () => {
            const balanceGarnishment = {
                ...mockGarnishmentDeduction,
                garnishmentOrder: {
                    ...mockGarnishmentDeduction.garnishmentOrder,
                    remainingBalance: 200,
                },
            };
            const result = (0, deduction_calculations_1.calculateGarnishmentAmount)(1000, 800, balanceGarnishment);
            (0, vitest_1.expect)(result).toBe(200);
        });
        (0, vitest_1.it)('should handle tax levy with 100% max', () => {
            const taxLevyDeduction = {
                ...mockGarnishmentDeduction,
                deductionType: 'GARNISHMENT_TAX_LEVY',
                garnishmentOrder: {
                    ...mockGarnishmentDeduction.garnishmentOrder,
                    orderType: 'TAX_LEVY',
                    maxPercentage: 100,
                },
            };
            const result = (0, deduction_calculations_1.calculateGarnishmentAmount)(1000, 800, taxLevyDeduction);
            (0, vitest_1.expect)(result).toBe(800);
        });
        (0, vitest_1.it)('should handle student loan garnishment', () => {
            const studentLoanDeduction = {
                ...mockGarnishmentDeduction,
                deductionType: 'GARNISHMENT_STUDENT_LOAN',
                garnishmentOrder: {
                    ...mockGarnishmentDeduction.garnishmentOrder,
                    orderType: 'STUDENT_LOAN',
                    maxPercentage: 15,
                },
            };
            const result = (0, deduction_calculations_1.calculateGarnishmentAmount)(1000, 800, studentLoanDeduction);
            (0, vitest_1.expect)(result).toBe(120);
        });
        (0, vitest_1.it)('should handle creditor garnishment', () => {
            const creditorDeduction = {
                ...mockGarnishmentDeduction,
                deductionType: 'GARNISHMENT_CREDITOR',
                garnishmentOrder: {
                    ...mockGarnishmentDeduction.garnishmentOrder,
                    orderType: 'CREDITOR',
                    maxPercentage: 25,
                },
            };
            const result = (0, deduction_calculations_1.calculateGarnishmentAmount)(1000, 800, creditorDeduction);
            (0, vitest_1.expect)(result).toBe(200);
        });
        (0, vitest_1.it)('should fall back to regular calculation for non-garnishment', () => {
            const result = (0, deduction_calculations_1.calculateGarnishmentAmount)(1000, 800, mockDeduction);
            (0, vitest_1.expect)(result).toBe(100);
        });
        (0, vitest_1.it)('should handle zero disposable income', () => {
            const result = (0, deduction_calculations_1.calculateGarnishmentAmount)(1000, 0, mockGarnishmentDeduction);
            (0, vitest_1.expect)(result).toBe(0);
        });
        (0, vitest_1.it)('should handle negative disposable income', () => {
            const result = (0, deduction_calculations_1.calculateGarnishmentAmount)(1000, -100, mockGarnishmentDeduction);
            (0, vitest_1.expect)(result).toBe(0);
        });
    });
    (0, vitest_1.describe)('calculateAllDeductions', () => {
        const preTaxDeduction = {
            ...mockDeduction,
            deductionType: 'HEALTH_INSURANCE',
            isPreTax: true,
            isPostTax: false,
            amount: 100,
        };
        const postTaxDeduction = {
            ...mockDeduction,
            id: 'post-tax',
            deductionType: 'UNION_DUES',
            isPreTax: false,
            isPostTax: true,
            amount: 50,
        };
        const statutoryDeduction = {
            ...mockDeduction,
            id: 'statutory',
            deductionType: 'FEDERAL_INCOME_TAX',
            isPreTax: false,
            isPostTax: false,
            isStatutory: true,
            amount: 200,
        };
        (0, vitest_1.it)('should calculate all deduction types in correct order', () => {
            const result = (0, deduction_calculations_1.calculateAllDeductions)(1000, [preTaxDeduction], [postTaxDeduction], [statutoryDeduction]);
            (0, vitest_1.expect)(result.preTaxTotal).toBe(100);
            (0, vitest_1.expect)(result.statutoryTotal).toBe(200);
            (0, vitest_1.expect)(result.postTaxTotal).toBe(50);
            (0, vitest_1.expect)(result.calculatedDeductions).toHaveLength(3);
        });
        (0, vitest_1.it)('should reduce taxable income by pre-tax deductions', () => {
            const result = (0, deduction_calculations_1.calculateAllDeductions)(1000, [preTaxDeduction], [], []);
            (0, vitest_1.expect)(result.preTaxTotal).toBe(100);
            (0, vitest_1.expect)(result.statutoryTotal).toBe(0);
            (0, vitest_1.expect)(result.postTaxTotal).toBe(0);
        });
        (0, vitest_1.it)('should calculate post-tax deductions after taxes', () => {
            const result = (0, deduction_calculations_1.calculateAllDeductions)(1000, [], [postTaxDeduction], [statutoryDeduction]);
            (0, vitest_1.expect)(result.statutoryTotal).toBe(200);
            (0, vitest_1.expect)(result.postTaxTotal).toBe(50);
        });
        (0, vitest_1.it)('should handle multiple deductions of each type', () => {
            const preTax2 = { ...preTaxDeduction, id: 'pre2', amount: 75 };
            const postTax2 = { ...postTaxDeduction, id: 'post2', amount: 25 };
            const statutory2 = { ...statutoryDeduction, id: 'stat2', amount: 150 };
            const result = (0, deduction_calculations_1.calculateAllDeductions)(1000, [preTaxDeduction, preTax2], [postTaxDeduction, postTax2], [statutoryDeduction, statutory2]);
            (0, vitest_1.expect)(result.preTaxTotal).toBe(175);
            (0, vitest_1.expect)(result.statutoryTotal).toBe(350);
            (0, vitest_1.expect)(result.postTaxTotal).toBe(75);
        });
        (0, vitest_1.it)('should include calculated amounts in returned deductions', () => {
            const result = (0, deduction_calculations_1.calculateAllDeductions)(1000, [preTaxDeduction], [], []);
            const calculated = result.calculatedDeductions[0];
            (0, vitest_1.expect)(calculated.id).toBe(preTaxDeduction.id);
            (0, vitest_1.expect)(calculated.calculatedAmount).toBe(100);
        });
        (0, vitest_1.it)('should handle empty deduction arrays', () => {
            const result = (0, deduction_calculations_1.calculateAllDeductions)(1000, [], [], []);
            (0, vitest_1.expect)(result.preTaxTotal).toBe(0);
            (0, vitest_1.expect)(result.statutoryTotal).toBe(0);
            (0, vitest_1.expect)(result.postTaxTotal).toBe(0);
            (0, vitest_1.expect)(result.calculatedDeductions).toHaveLength(0);
        });
    });
    (0, vitest_1.describe)('sortGarnishmentsByPriority', () => {
        (0, vitest_1.it)('should sort garnishments by legal priority', () => {
            const garnishments = [
                {
                    ...mockGarnishmentDeduction,
                    deductionType: 'GARNISHMENT_CREDITOR',
                    garnishmentOrder: { ...mockGarnishmentDeduction.garnishmentOrder, priority: 4 },
                },
                {
                    ...mockGarnishmentDeduction,
                    deductionType: 'GARNISHMENT_CHILD_SUPPORT',
                    garnishmentOrder: { ...mockGarnishmentDeduction.garnishmentOrder, priority: 1 },
                },
                {
                    ...mockGarnishmentDeduction,
                    deductionType: 'GARNISHMENT_STUDENT_LOAN',
                    garnishmentOrder: { ...mockGarnishmentDeduction.garnishmentOrder, priority: 3 },
                },
                {
                    ...mockGarnishmentDeduction,
                    deductionType: 'GARNISHMENT_TAX_LEVY',
                    garnishmentOrder: { ...mockGarnishmentDeduction.garnishmentOrder, priority: 2 },
                },
            ];
            const sorted = (0, deduction_calculations_1.sortGarnishmentsByPriority)(garnishments);
            (0, vitest_1.expect)(sorted[0].deductionType).toBe('GARNISHMENT_CHILD_SUPPORT');
            (0, vitest_1.expect)(sorted[1].deductionType).toBe('GARNISHMENT_TAX_LEVY');
            (0, vitest_1.expect)(sorted[2].deductionType).toBe('GARNISHMENT_STUDENT_LOAN');
            (0, vitest_1.expect)(sorted[3].deductionType).toBe('GARNISHMENT_CREDITOR');
        });
        (0, vitest_1.it)('should handle garnishments without priority using default mapping', () => {
            const garnishments = [
                {
                    ...mockGarnishmentDeduction,
                    deductionType: 'GARNISHMENT_CREDITOR',
                    garnishmentOrder: { ...mockGarnishmentDeduction.garnishmentOrder, priority: 2 },
                },
                {
                    ...mockGarnishmentDeduction,
                    deductionType: 'GARNISHMENT_CHILD_SUPPORT',
                    garnishmentOrder: { ...mockGarnishmentDeduction.garnishmentOrder, priority: 1 },
                },
            ];
            const sorted = (0, deduction_calculations_1.sortGarnishmentsByPriority)(garnishments);
            (0, vitest_1.expect)(sorted[0].deductionType).toBe('GARNISHMENT_CHILD_SUPPORT');
            (0, vitest_1.expect)(sorted[1].deductionType).toBe('GARNISHMENT_CREDITOR');
        });
        (0, vitest_1.it)('should handle non-garnishment deductions', () => {
            const deductions = [
                mockDeduction,
                mockGarnishmentDeduction,
            ];
            const sorted = (0, deduction_calculations_1.sortGarnishmentsByPriority)(deductions);
            (0, vitest_1.expect)(sorted[1].deductionType).toBe('HEALTH_INSURANCE');
        });
    });
    (0, vitest_1.describe)('calculateEmployerMatch', () => {
        (0, vitest_1.it)('should calculate employer match correctly', () => {
            const result = (0, deduction_calculations_1.calculateEmployerMatch)(100, 50, 200);
            (0, vitest_1.expect)(result).toBe(50);
        });
        (0, vitest_1.it)('should respect maximum match amount', () => {
            const result = (0, deduction_calculations_1.calculateEmployerMatch)(100, 100, 50);
            (0, vitest_1.expect)(result).toBe(50);
        });
        (0, vitest_1.it)('should handle zero contribution', () => {
            const result = (0, deduction_calculations_1.calculateEmployerMatch)(0, 50, 200);
            (0, vitest_1.expect)(result).toBe(0);
        });
        (0, vitest_1.it)('should handle zero match percentage', () => {
            const result = (0, deduction_calculations_1.calculateEmployerMatch)(100, 0, 200);
            (0, vitest_1.expect)(result).toBe(0);
        });
        (0, vitest_1.it)('should handle no maximum limit', () => {
            const result = (0, deduction_calculations_1.calculateEmployerMatch)(100, 50);
            (0, vitest_1.expect)(result).toBe(50);
        });
    });
    (0, vitest_1.describe)('isDeductionLimitReached', () => {
        (0, vitest_1.it)('should return false when no limit is set', () => {
            const result = (0, deduction_calculations_1.isDeductionLimitReached)(mockDeduction);
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should return false when under limit', () => {
            const limitedDeduction = {
                ...mockDeduction,
                hasLimit: true,
                yearlyLimit: 1000,
                yearToDateAmount: 500,
            };
            const result = (0, deduction_calculations_1.isDeductionLimitReached)(limitedDeduction);
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should return true when at limit', () => {
            const maxedDeduction = {
                ...mockDeduction,
                hasLimit: true,
                yearlyLimit: 1000,
                yearToDateAmount: 1000,
            };
            const result = (0, deduction_calculations_1.isDeductionLimitReached)(maxedDeduction);
            (0, vitest_1.expect)(result).toBe(true);
        });
        (0, vitest_1.it)('should return true when over limit', () => {
            const overLimitDeduction = {
                ...mockDeduction,
                hasLimit: true,
                yearlyLimit: 1000,
                yearToDateAmount: 1200,
            };
            const result = (0, deduction_calculations_1.isDeductionLimitReached)(overLimitDeduction);
            (0, vitest_1.expect)(result).toBe(true);
        });
    });
    (0, vitest_1.describe)('getRemainingDeductionLimit', () => {
        (0, vitest_1.it)('should return null when no limit is set', () => {
            const result = (0, deduction_calculations_1.getRemainingDeductionLimit)(mockDeduction);
            (0, vitest_1.expect)(result).toBeNull();
        });
        (0, vitest_1.it)('should return remaining amount when under limit', () => {
            const limitedDeduction = {
                ...mockDeduction,
                hasLimit: true,
                yearlyLimit: 1000,
                yearToDateAmount: 300,
            };
            const result = (0, deduction_calculations_1.getRemainingDeductionLimit)(limitedDeduction);
            (0, vitest_1.expect)(result).toBe(700);
        });
        (0, vitest_1.it)('should return zero when at limit', () => {
            const maxedDeduction = {
                ...mockDeduction,
                hasLimit: true,
                yearlyLimit: 1000,
                yearToDateAmount: 1000,
            };
            const result = (0, deduction_calculations_1.getRemainingDeductionLimit)(maxedDeduction);
            (0, vitest_1.expect)(result).toBe(0);
        });
        (0, vitest_1.it)('should return zero when over limit', () => {
            const overLimitDeduction = {
                ...mockDeduction,
                hasLimit: true,
                yearlyLimit: 1000,
                yearToDateAmount: 1200,
            };
            const result = (0, deduction_calculations_1.getRemainingDeductionLimit)(overLimitDeduction);
            (0, vitest_1.expect)(result).toBe(0);
        });
    });
    (0, vitest_1.describe)('groupDeductionsByCategory', () => {
        const taxDeduction = {
            ...mockDeduction,
            deductionType: 'FEDERAL_INCOME_TAX',
        };
        const benefitDeduction = {
            ...mockDeduction,
            deductionType: 'HEALTH_INSURANCE',
        };
        const loanDeduction = {
            ...mockDeduction,
            deductionType: 'LOAN_REPAYMENT',
        };
        const retirementDeduction = {
            ...mockDeduction,
            deductionType: 'RETIREMENT_401K',
        };
        const otherDeduction = {
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
        ];
        (0, vitest_1.it)('should group deductions into correct categories', () => {
            const result = (0, deduction_calculations_1.groupDeductionsByCategory)(deductions);
            (0, vitest_1.expect)(result.taxes).toHaveLength(1);
            (0, vitest_1.expect)(result.taxes[0].deductionType).toBe('FEDERAL_INCOME_TAX');
            (0, vitest_1.expect)(result.benefits).toHaveLength(1);
            (0, vitest_1.expect)(result.benefits[0].deductionType).toBe('HEALTH_INSURANCE');
            (0, vitest_1.expect)(result.retirement).toHaveLength(1);
            (0, vitest_1.expect)(result.retirement[0].deductionType).toBe('RETIREMENT_401K');
            (0, vitest_1.expect)(result.garnishments).toHaveLength(1);
            (0, vitest_1.expect)(result.garnishments[0].deductionType).toBe('GARNISHMENT_CHILD_SUPPORT');
            (0, vitest_1.expect)(result.other).toHaveLength(1);
            (0, vitest_1.expect)(result.other[0].deductionType).toBe('UNIFORM');
        });
        (0, vitest_1.it)('should handle Social Security and Medicare as taxes', () => {
            const ssDeduction = {
                ...mockDeduction,
                deductionType: 'SOCIAL_SECURITY',
                calculatedAmount: 62,
            };
            const medicareDeduction = {
                ...mockDeduction,
                deductionType: 'MEDICARE',
                calculatedAmount: 14.50,
            };
            const result = (0, deduction_calculations_1.groupDeductionsByCategory)([ssDeduction, medicareDeduction]);
            (0, vitest_1.expect)(result.taxes).toHaveLength(2);
            (0, vitest_1.expect)(result.taxes.map(t => t.deductionType)).toContain('SOCIAL_SECURITY');
            (0, vitest_1.expect)(result.taxes.map(t => t.deductionType)).toContain('MEDICARE');
        });
        (0, vitest_1.it)('should handle empty input', () => {
            const result = (0, deduction_calculations_1.groupDeductionsByCategory)([]);
            (0, vitest_1.expect)(result.taxes).toHaveLength(0);
            (0, vitest_1.expect)(result.benefits).toHaveLength(0);
            (0, vitest_1.expect)(result.retirement).toHaveLength(0);
            (0, vitest_1.expect)(result.garnishments).toHaveLength(0);
            (0, vitest_1.expect)(result.other).toHaveLength(0);
        });
        (0, vitest_1.it)('should handle 403b retirement plans', () => {
            const retirement403b = {
                ...mockDeduction,
                deductionType: 'RETIREMENT_403B',
                calculatedAmount: 100,
            };
            const result = (0, deduction_calculations_1.groupDeductionsByCategory)([retirement403b]);
            (0, vitest_1.expect)(result.retirement).toHaveLength(1);
            (0, vitest_1.expect)(result.retirement[0].deductionType).toBe('RETIREMENT_403B');
        });
    });
    (0, vitest_1.describe)('Edge Cases and Error Handling', () => {
        (0, vitest_1.it)('should handle zero percentage deductions', () => {
            const zeroPercentageDeduction = {
                ...mockDeduction,
                calculationMethod: 'PERCENTAGE',
                percentage: 0,
                amount: 0,
            };
            const result = (0, deduction_calculations_1.calculateDeductionAmount)(1000, 800, zeroPercentageDeduction);
            (0, vitest_1.expect)(result).toBe(0);
        });
        (0, vitest_1.it)('should handle very high percentage deductions', () => {
            const highPercentageDeduction = {
                ...mockDeduction,
                calculationMethod: 'PERCENTAGE',
                percentage: 100,
                amount: 0,
            };
            const result = (0, deduction_calculations_1.calculateDeductionAmount)(1000, 800, highPercentageDeduction);
            (0, vitest_1.expect)(result).toBe(1000);
        });
        (0, vitest_1.it)('should handle negative amounts gracefully', () => {
            const negativeDeduction = {
                ...mockDeduction,
                amount: -50,
            };
            const result = (0, deduction_calculations_1.calculateDeductionAmount)(1000, 800, negativeDeduction);
            (0, vitest_1.expect)(result).toBe(-50);
        });
        (0, vitest_1.it)('should handle undefined YTD amounts', () => {
            const noYTDDeduction = {
                ...mockDeduction,
                hasLimit: true,
                yearlyLimit: 1000,
                yearToDateAmount: undefined,
            };
            const result = (0, deduction_calculations_1.calculateDeductionAmount)(1000, 800, noYTDDeduction);
            (0, vitest_1.expect)(result).toBe(100);
        });
        (0, vitest_1.it)('should handle null YTD amounts', () => {
            const nullYTDDeduction = {
                ...mockDeduction,
                hasLimit: true,
                yearlyLimit: 1000,
                yearToDateAmount: undefined,
            };
            const result = (0, deduction_calculations_1.calculateDeductionAmount)(1000, 800, nullYTDDeduction);
            (0, vitest_1.expect)(result).toBe(100);
        });
    });
    (0, vitest_1.describe)('Compliance Tests', () => {
        (0, vitest_1.it)('should never return negative deduction amounts', () => {
            const testCases = [
                { gross: 0, net: 0 },
                { gross: -100, net: -100 },
                { gross: 100, net: -50 },
            ];
            testCases.forEach(({ gross, net }) => {
                const result = (0, deduction_calculations_1.calculateDeductionAmount)(gross, net, mockDeduction);
                (0, vitest_1.expect)(result).toBeGreaterThanOrEqual(0);
            });
        });
        (0, vitest_1.it)('should respect garnishment limits by law', () => {
            const childSupportResult = (0, deduction_calculations_1.calculateGarnishmentAmount)(1000, 800, mockGarnishmentDeduction);
            (0, vitest_1.expect)(childSupportResult).toBeLessThanOrEqual(520);
            const creditorDeduction = {
                ...mockGarnishmentDeduction,
                deductionType: 'GARNISHMENT_CREDITOR',
                garnishmentOrder: {
                    ...mockGarnishmentDeduction.garnishmentOrder,
                    orderType: 'CREDITOR',
                    maxPercentage: 25,
                },
            };
            const creditorResult = (0, deduction_calculations_1.calculateGarnishmentAmount)(1000, 800, creditorDeduction);
            (0, vitest_1.expect)(creditorResult).toBeLessThanOrEqual(250);
        });
        (0, vitest_1.it)('should handle deduction overflow gracefully', () => {
            const hugeDeduction = {
                ...mockDeduction,
                amount: 5000,
            };
            const result = (0, deduction_calculations_1.calculateDeductionAmount)(1000, 800, hugeDeduction);
            (0, vitest_1.expect)(result).toBe(5000);
        });
    });
});
//# sourceMappingURL=deduction-calculations.test.js.map