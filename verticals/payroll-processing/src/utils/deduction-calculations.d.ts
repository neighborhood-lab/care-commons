import { Deduction } from '../types/payroll';
export declare function calculateDeductionAmount(grossPay: number, netPay: number, deduction: Deduction): number;
export declare function calculateGarnishmentAmount(grossPay: number, taxableIncome: number, deduction: Deduction): number;
export declare function calculateAllDeductions(grossPay: number, preTaxDeductions: Deduction[], postTaxDeductions: Deduction[], statutoryDeductions: Deduction[]): {
    preTaxTotal: number;
    postTaxTotal: number;
    statutoryTotal: number;
    calculatedDeductions: Array<Deduction & {
        calculatedAmount: number;
    }>;
};
export declare function sortGarnishmentsByPriority(garnishments: Deduction[]): Deduction[];
export declare function calculateEmployerMatch(employeeContribution: number, matchPercentage: number, maxMatchAmount?: number): number;
export declare function isDeductionLimitReached(deduction: Deduction): boolean;
export declare function getRemainingDeductionLimit(deduction: Deduction): number | null;
export declare function groupDeductionsByCategory(deductions: Array<Deduction & {
    calculatedAmount: number;
}>): {
    taxes: Array<Deduction & {
        calculatedAmount: number;
    }>;
    benefits: Array<Deduction & {
        calculatedAmount: number;
    }>;
    retirement: Array<Deduction & {
        calculatedAmount: number;
    }>;
    garnishments: Array<Deduction & {
        calculatedAmount: number;
    }>;
    other: Array<Deduction & {
        calculatedAmount: number;
    }>;
};
//# sourceMappingURL=deduction-calculations.d.ts.map