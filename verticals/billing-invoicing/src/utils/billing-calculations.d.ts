import { UnitType, RoundingRule, BillingModifier, ServiceRate } from '../types/billing';
export declare function calculateUnits(durationMinutes: number, unitType: UnitType, roundingRule?: RoundingRule): number;
export declare function applyRounding(units: number, rule: RoundingRule): number;
export declare function calculateBaseAmount(units: number, unitRate: number): number;
export declare function applyModifiers(baseAmount: number, modifiers?: BillingModifier[]): number;
export declare function calculateRateWithTimeModifiers(baseRate: number, serviceRate?: ServiceRate, options?: {
    isWeekend?: boolean;
    isHoliday?: boolean;
    isNightShift?: boolean;
    isOvertime?: boolean;
}): number;
export declare function isWeekend(date: Date): boolean;
export declare function isHoliday(date: Date): boolean;
export declare function isNightShift(time: Date, nightStart?: number, nightEnd?: number): boolean;
export declare function calculateTax(subtotal: number, taxRate: number): number;
export declare function calculateInvoiceTotal(subtotal: number, taxAmount?: number, discountAmount?: number, adjustmentAmount?: number): number;
export declare function calculateBalanceDue(totalAmount: number, paidAmount: number): number;
export declare function roundToTwoDecimals(amount: number): number;
export declare function formatCurrency(amount: number, currency?: string): string;
export declare function calculateCollectionRate(totalBilled: number, totalPaid: number): number;
export declare function calculateDenialRate(totalClaims: number, deniedClaims: number): number;
export declare function calculateAveragePaymentDays(invoices: Array<{
    invoiceDate: Date;
    paymentDate: Date;
}>): number;
export declare function isInvoicePastDue(dueDate: Date, currentDate?: Date): boolean;
export declare function calculateDaysPastDue(dueDate: Date, currentDate?: Date): number;
export declare function calculateLateFee(balanceDue: number, lateFeeRate: number, daysPastDue: number, gracePeriodDays?: number): number;
export declare function validateInvoiceAmounts(invoice: {
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    adjustmentAmount: number;
    totalAmount: number;
    paidAmount: number;
    balanceDue: number;
}): {
    valid: boolean;
    errors: string[];
};
export declare function generateInvoiceNumber(organizationCode: string, sequence: number, year?: number): string;
export declare function generatePaymentNumber(organizationCode: string, sequence: number, year?: number): string;
export declare function generateClaimNumber(organizationCode: string, sequence: number, year?: number): string;
export declare function getServiceDateRange(periodStart: Date, periodEnd: Date): {
    startDate: Date;
    endDate: Date;
};
export declare function calculateDueDate(invoiceDate: Date, paymentTermsDays: number): Date;
//# sourceMappingURL=billing-calculations.d.ts.map