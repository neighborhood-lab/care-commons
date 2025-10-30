import { TaxConfiguration, TaxCalculationResult } from '../types/payroll';
export declare function calculateFederalIncomeTax(grossPay: number, payPeriodType: 'WEEKLY' | 'BI_WEEKLY' | 'SEMI_MONTHLY' | 'MONTHLY', taxConfig: TaxConfiguration): number;
export declare function calculateSocialSecurityTax(grossPay: number, ytdGrossPay: number): number;
export declare function calculateMedicareTax(grossPay: number): number;
export declare function calculateAdditionalMedicareTax(grossPay: number, ytdGrossPay: number): number;
export declare function calculateStateIncomeTax(grossPay: number, stateCode: string, taxConfig: TaxConfiguration): number;
export declare function calculateAllTaxes(grossPay: number, ytdGrossPay: number, payPeriodType: 'WEEKLY' | 'BI_WEEKLY' | 'SEMI_MONTHLY' | 'MONTHLY', taxConfig: TaxConfiguration): TaxCalculationResult;
export declare function calculateSupplementalWithholding(supplementalAmount: number, useFlatRate?: boolean, aggregateParams?: {
    regularGrossPay: number;
    payPeriodType: 'WEEKLY' | 'BI_WEEKLY' | 'SEMI_MONTHLY' | 'MONTHLY';
    taxConfig: TaxConfiguration;
}): number;
export declare function estimateQuarterlyTaxLiability(totalGrossWages: number, totalFederalWithheld: number): {
    employerSocialSecurity: number;
    employerMedicare: number;
    totalEmployerTaxes: number;
    totalDeposits: number;
};
//# sourceMappingURL=tax-calculations.d.ts.map