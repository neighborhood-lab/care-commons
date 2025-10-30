"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const billing_calculations_1 = require("../billing-calculations");
describe('Unit Calculations', () => {
    describe('calculateUnits', () => {
        it('should calculate units for hourly rate', () => {
            expect((0, billing_calculations_1.calculateUnits)(60, 'HOUR')).toBe(1);
            expect((0, billing_calculations_1.calculateUnits)(120, 'HOUR')).toBe(2);
            expect((0, billing_calculations_1.calculateUnits)(90, 'HOUR')).toBe(1.5);
            expect((0, billing_calculations_1.calculateUnits)(45, 'HOUR')).toBe(0.75);
        });
        it('should return 1 unit for visit-based services', () => {
            expect((0, billing_calculations_1.calculateUnits)(60, 'VISIT')).toBe(1);
            expect((0, billing_calculations_1.calculateUnits)(120, 'VISIT')).toBe(1);
        });
        it('should return 1 unit for day/week/month/task rates', () => {
            expect((0, billing_calculations_1.calculateUnits)(480, 'DAY')).toBe(1);
            expect((0, billing_calculations_1.calculateUnits)(2400, 'WEEK')).toBe(1);
            expect((0, billing_calculations_1.calculateUnits)(10000, 'MONTH')).toBe(1);
            expect((0, billing_calculations_1.calculateUnits)(30, 'TASK')).toBe(1);
        });
        it('should handle mileage and generic units', () => {
            expect((0, billing_calculations_1.calculateUnits)(15, 'MILE')).toBe(15);
            expect((0, billing_calculations_1.calculateUnits)(10, 'UNIT')).toBe(10);
        });
        it('should apply rounding when specified', () => {
            expect((0, billing_calculations_1.calculateUnits)(55, 'HOUR', 'UP')).toBe(1);
            expect((0, billing_calculations_1.calculateUnits)(55, 'HOUR', 'DOWN')).toBe(0);
            expect((0, billing_calculations_1.calculateUnits)(55, 'HOUR', 'NEAREST')).toBe(1);
        });
    });
    describe('applyRounding', () => {
        it('should not round with NONE rule', () => {
            expect((0, billing_calculations_1.applyRounding)(1.234, 'NONE')).toBe(1.234);
        });
        it('should round up with UP rule', () => {
            expect((0, billing_calculations_1.applyRounding)(1.1, 'UP')).toBe(2);
            expect((0, billing_calculations_1.applyRounding)(1.9, 'UP')).toBe(2);
            expect((0, billing_calculations_1.applyRounding)(1.0, 'UP')).toBe(1);
        });
        it('should round down with DOWN rule', () => {
            expect((0, billing_calculations_1.applyRounding)(1.1, 'DOWN')).toBe(1);
            expect((0, billing_calculations_1.applyRounding)(1.9, 'DOWN')).toBe(1);
            expect((0, billing_calculations_1.applyRounding)(1.0, 'DOWN')).toBe(1);
        });
        it('should round to nearest with NEAREST rule', () => {
            expect((0, billing_calculations_1.applyRounding)(1.4, 'NEAREST')).toBe(1);
            expect((0, billing_calculations_1.applyRounding)(1.5, 'NEAREST')).toBe(2);
            expect((0, billing_calculations_1.applyRounding)(1.6, 'NEAREST')).toBe(2);
        });
        it('should round to quarter hour (15 minutes)', () => {
            expect((0, billing_calculations_1.applyRounding)(0.9, 'QUARTER_HOUR')).toBe(1);
            expect((0, billing_calculations_1.applyRounding)(1.1, 'QUARTER_HOUR')).toBe(1.25);
            expect((0, billing_calculations_1.applyRounding)(1.5, 'QUARTER_HOUR')).toBe(1.5);
            expect((0, billing_calculations_1.applyRounding)(0.7, 'QUARTER_HOUR')).toBe(0.75);
        });
        it('should round to half hour (30 minutes)', () => {
            expect((0, billing_calculations_1.applyRounding)(0.9, 'HALF_HOUR')).toBe(1);
            expect((0, billing_calculations_1.applyRounding)(1.1, 'HALF_HOUR')).toBe(1.5);
            expect((0, billing_calculations_1.applyRounding)(1.5, 'HALF_HOUR')).toBe(1.5);
        });
    });
    describe('calculateBaseAmount', () => {
        it('should calculate base amount correctly', () => {
            expect((0, billing_calculations_1.calculateBaseAmount)(2, 25.5)).toBe(51);
            expect((0, billing_calculations_1.calculateBaseAmount)(1.5, 30)).toBe(45);
            expect((0, billing_calculations_1.calculateBaseAmount)(3, 15.75)).toBe(47.25);
        });
        it('should round to two decimal places', () => {
            expect((0, billing_calculations_1.calculateBaseAmount)(1.333, 30)).toBe(39.99);
            expect((0, billing_calculations_1.calculateBaseAmount)(2.5, 25.333)).toBe(63.33);
        });
    });
});
describe('Modifiers and Adjustments', () => {
    describe('applyModifiers', () => {
        it('should return base amount when no modifiers', () => {
            expect((0, billing_calculations_1.applyModifiers)(100)).toBe(100);
            expect((0, billing_calculations_1.applyModifiers)(100, [])).toBe(100);
        });
        it('should apply multiplier modifiers', () => {
            const modifiers = [
                { code: 'WEEKEND', description: 'Weekend rate', multiplier: 1.5 },
            ];
            expect((0, billing_calculations_1.applyModifiers)(100, modifiers)).toBe(150);
        });
        it('should apply added amount modifiers', () => {
            const modifiers = [
                { code: 'TRAVEL', description: 'Travel fee', addedAmount: 25 },
            ];
            expect((0, billing_calculations_1.applyModifiers)(100, modifiers)).toBe(125);
        });
        it('should apply multiple modifiers in sequence', () => {
            const modifiers = [
                { code: 'WEEKEND', description: 'Weekend rate', multiplier: 1.5 },
                { code: 'TRAVEL', description: 'Travel fee', addedAmount: 20 },
            ];
            expect((0, billing_calculations_1.applyModifiers)(100, modifiers)).toBe(170);
        });
        it('should handle combined multiplier and added amount in one modifier', () => {
            const modifiers = [
                {
                    code: 'COMPLEX',
                    description: 'Complex care',
                    multiplier: 1.25,
                    addedAmount: 10,
                },
            ];
            expect((0, billing_calculations_1.applyModifiers)(100, modifiers)).toBe(135);
        });
    });
    describe('calculateRateWithTimeModifiers', () => {
        it('should return base rate when no modifiers', () => {
            expect((0, billing_calculations_1.calculateRateWithTimeModifiers)(25)).toBe(25);
        });
        it('should apply weekend rate modifier', () => {
            const serviceRate = { weekendRate: 1.5 };
            expect((0, billing_calculations_1.calculateRateWithTimeModifiers)(20, serviceRate, { isWeekend: true })).toBe(30);
        });
        it('should apply holiday rate modifier', () => {
            const serviceRate = { holidayRate: 2.0 };
            expect((0, billing_calculations_1.calculateRateWithTimeModifiers)(20, serviceRate, { isHoliday: true })).toBe(40);
        });
        it('should apply night shift modifier', () => {
            const serviceRate = { nightRate: 1.3 };
            expect((0, billing_calculations_1.calculateRateWithTimeModifiers)(20, serviceRate, { isNightShift: true })).toBe(26);
        });
        it('should apply overtime modifier', () => {
            const serviceRate = { overtimeRate: 1.5 };
            expect((0, billing_calculations_1.calculateRateWithTimeModifiers)(20, serviceRate, { isOvertime: true })).toBe(30);
        });
        it('should stack multiple time modifiers', () => {
            const serviceRate = {
                weekendRate: 1.5,
                nightRate: 1.2,
            };
            expect((0, billing_calculations_1.calculateRateWithTimeModifiers)(20, serviceRate, {
                isWeekend: true,
                isNightShift: true,
            })).toBe(36);
        });
    });
});
describe('Date and Time Utilities', () => {
    describe('isWeekend', () => {
        it('should identify Saturday as weekend', () => {
            const saturday = new Date(2024, 0, 6);
            expect((0, billing_calculations_1.isWeekend)(saturday)).toBe(true);
        });
        it('should identify Sunday as weekend', () => {
            const sunday = new Date(2024, 0, 7);
            expect((0, billing_calculations_1.isWeekend)(sunday)).toBe(true);
        });
        it('should identify weekdays correctly', () => {
            const monday = new Date(2024, 0, 8);
            const wednesday = new Date(2024, 0, 10);
            const friday = new Date(2024, 0, 12);
            expect((0, billing_calculations_1.isWeekend)(monday)).toBe(false);
            expect((0, billing_calculations_1.isWeekend)(wednesday)).toBe(false);
            expect((0, billing_calculations_1.isWeekend)(friday)).toBe(false);
        });
    });
    describe('isHoliday', () => {
        it('should identify New Years Day', () => {
            expect((0, billing_calculations_1.isHoliday)(new Date(2024, 0, 1))).toBe(true);
        });
        it('should identify Independence Day', () => {
            expect((0, billing_calculations_1.isHoliday)(new Date(2024, 6, 4))).toBe(true);
        });
        it('should identify Christmas', () => {
            expect((0, billing_calculations_1.isHoliday)(new Date(2024, 11, 25))).toBe(true);
        });
        it('should identify Juneteenth', () => {
            expect((0, billing_calculations_1.isHoliday)(new Date(2024, 5, 19))).toBe(true);
        });
        it('should identify Veterans Day', () => {
            expect((0, billing_calculations_1.isHoliday)(new Date(2024, 10, 11))).toBe(true);
        });
        it('should not identify regular days as holidays', () => {
            expect((0, billing_calculations_1.isHoliday)(new Date(2024, 2, 15))).toBe(false);
            expect((0, billing_calculations_1.isHoliday)(new Date(2024, 7, 20))).toBe(false);
        });
    });
    describe('isNightShift', () => {
        it('should identify night hours (default 10 PM - 6 AM)', () => {
            expect((0, billing_calculations_1.isNightShift)(new Date(2024, 0, 1, 22, 0, 0))).toBe(true);
            expect((0, billing_calculations_1.isNightShift)(new Date(2024, 0, 1, 23, 30, 0))).toBe(true);
            expect((0, billing_calculations_1.isNightShift)(new Date(2024, 0, 1, 2, 0, 0))).toBe(true);
            expect((0, billing_calculations_1.isNightShift)(new Date(2024, 0, 1, 5, 30, 0))).toBe(true);
        });
        it('should identify day hours', () => {
            expect((0, billing_calculations_1.isNightShift)(new Date(2024, 0, 1, 6, 0, 0))).toBe(false);
            expect((0, billing_calculations_1.isNightShift)(new Date(2024, 0, 1, 12, 0, 0))).toBe(false);
            expect((0, billing_calculations_1.isNightShift)(new Date(2024, 0, 1, 21, 59, 0))).toBe(false);
        });
        it('should support custom night shift hours', () => {
            const time = new Date(2024, 0, 1, 20, 0, 0);
            expect((0, billing_calculations_1.isNightShift)(time, 20, 6)).toBe(true);
            expect((0, billing_calculations_1.isNightShift)(time, 22, 6)).toBe(false);
        });
    });
});
describe('Financial Calculations', () => {
    describe('calculateTax', () => {
        it('should calculate tax amount', () => {
            expect((0, billing_calculations_1.calculateTax)(100, 0.08)).toBe(8);
            expect((0, billing_calculations_1.calculateTax)(250, 0.0625)).toBe(15.63);
        });
        it('should return 0 for zero or negative tax rate', () => {
            expect((0, billing_calculations_1.calculateTax)(100, 0)).toBe(0);
            expect((0, billing_calculations_1.calculateTax)(100, -0.05)).toBe(0);
        });
        it('should round to two decimals', () => {
            expect((0, billing_calculations_1.calculateTax)(100, 0.08333)).toBe(8.33);
        });
    });
    describe('calculateInvoiceTotal', () => {
        it('should calculate total with all components', () => {
            expect((0, billing_calculations_1.calculateInvoiceTotal)(100, 8, 10, 5)).toBe(103);
        });
        it('should handle zero values', () => {
            expect((0, billing_calculations_1.calculateInvoiceTotal)(100, 0, 0, 0)).toBe(100);
        });
        it('should not return negative totals', () => {
            expect((0, billing_calculations_1.calculateInvoiceTotal)(50, 0, 100, 0)).toBe(0);
        });
        it('should calculate typical healthcare invoice (no tax)', () => {
            expect((0, billing_calculations_1.calculateInvoiceTotal)(1500, 0, 0, -50)).toBe(1450);
        });
    });
    describe('calculateBalanceDue', () => {
        it('should calculate remaining balance', () => {
            expect((0, billing_calculations_1.calculateBalanceDue)(1000, 300)).toBe(700);
            expect((0, billing_calculations_1.calculateBalanceDue)(500, 500)).toBe(0);
        });
        it('should not return negative balance', () => {
            expect((0, billing_calculations_1.calculateBalanceDue)(1000, 1200)).toBe(0);
        });
        it('should handle partial payments', () => {
            expect((0, billing_calculations_1.calculateBalanceDue)(1000, 250)).toBe(750);
        });
    });
    describe('roundToTwoDecimals', () => {
        it('should round to two decimal places', () => {
            expect((0, billing_calculations_1.roundToTwoDecimals)(1.234)).toBe(1.23);
            expect((0, billing_calculations_1.roundToTwoDecimals)(1.235)).toBe(1.24);
            expect((0, billing_calculations_1.roundToTwoDecimals)(1.999)).toBe(2);
        });
        it('should handle whole numbers', () => {
            expect((0, billing_calculations_1.roundToTwoDecimals)(5)).toBe(5);
        });
    });
    describe('calculateCollectionRate', () => {
        it('should calculate collection rate percentage', () => {
            expect((0, billing_calculations_1.calculateCollectionRate)(10000, 8500)).toBe(85);
            expect((0, billing_calculations_1.calculateCollectionRate)(5000, 5000)).toBe(100);
            expect((0, billing_calculations_1.calculateCollectionRate)(10000, 7325)).toBe(73.25);
        });
        it('should return 0 when no billed amount', () => {
            expect((0, billing_calculations_1.calculateCollectionRate)(0, 0)).toBe(0);
        });
    });
    describe('calculateDenialRate', () => {
        it('should calculate denial rate percentage', () => {
            expect((0, billing_calculations_1.calculateDenialRate)(100, 15)).toBe(15);
            expect((0, billing_calculations_1.calculateDenialRate)(250, 30)).toBe(12);
        });
        it('should return 0 when no claims', () => {
            expect((0, billing_calculations_1.calculateDenialRate)(0, 0)).toBe(0);
        });
    });
    describe('calculateAveragePaymentDays', () => {
        it('should calculate average days from invoice to payment', () => {
            const invoices = [
                {
                    invoiceDate: new Date('2024-01-01'),
                    paymentDate: new Date('2024-01-31'),
                },
                {
                    invoiceDate: new Date('2024-02-01'),
                    paymentDate: new Date('2024-02-16'),
                },
            ];
            expect((0, billing_calculations_1.calculateAveragePaymentDays)(invoices)).toBe(23);
        });
        it('should return 0 for empty array', () => {
            expect((0, billing_calculations_1.calculateAveragePaymentDays)([])).toBe(0);
        });
    });
});
describe('Past Due Calculations', () => {
    describe('isInvoicePastDue', () => {
        it('should identify past due invoices', () => {
            const pastDate = new Date('2024-01-01');
            const currentDate = new Date('2024-01-15');
            expect((0, billing_calculations_1.isInvoicePastDue)(pastDate, currentDate)).toBe(true);
        });
        it('should not mark current or future invoices as past due', () => {
            const futureDate = new Date('2024-12-31');
            const currentDate = new Date('2024-01-15');
            expect((0, billing_calculations_1.isInvoicePastDue)(futureDate, currentDate)).toBe(false);
        });
    });
    describe('calculateDaysPastDue', () => {
        it('should calculate days past due', () => {
            const dueDate = new Date('2024-01-01');
            const currentDate = new Date('2024-01-16');
            expect((0, billing_calculations_1.calculateDaysPastDue)(dueDate, currentDate)).toBe(15);
        });
        it('should return 0 if not past due', () => {
            const dueDate = new Date('2024-12-31');
            const currentDate = new Date('2024-01-15');
            expect((0, billing_calculations_1.calculateDaysPastDue)(dueDate, currentDate)).toBe(0);
        });
    });
    describe('calculateLateFee', () => {
        it('should calculate late fees based on daily rate', () => {
            const lateFee = (0, billing_calculations_1.calculateLateFee)(1000, 0.12, 30, 0);
            expect(lateFee).toBe(9.86);
        });
        it('should respect grace period', () => {
            expect((0, billing_calculations_1.calculateLateFee)(1000, 0.12, 5, 10)).toBe(0);
            expect((0, billing_calculations_1.calculateLateFee)(1000, 0.12, 15, 10)).toBe(1.64);
        });
        it('should return 0 for zero rate', () => {
            expect((0, billing_calculations_1.calculateLateFee)(1000, 0, 30, 0)).toBe(0);
        });
    });
});
describe('Invoice Amount Validation', () => {
    describe('validateInvoiceAmounts', () => {
        it('should validate correct invoice amounts', () => {
            const invoice = {
                subtotal: 1000,
                taxAmount: 0,
                discountAmount: 100,
                adjustmentAmount: 50,
                totalAmount: 950,
                paidAmount: 500,
                balanceDue: 450,
            };
            const result = (0, billing_calculations_1.validateInvoiceAmounts)(invoice);
            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });
        it('should catch total amount mismatch', () => {
            const invoice = {
                subtotal: 1000,
                taxAmount: 0,
                discountAmount: 0,
                adjustmentAmount: 0,
                totalAmount: 1100,
                paidAmount: 0,
                balanceDue: 1100,
            };
            const result = (0, billing_calculations_1.validateInvoiceAmounts)(invoice);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain('Total amount mismatch');
        });
        it('should catch balance due mismatch', () => {
            const invoice = {
                subtotal: 1000,
                taxAmount: 0,
                discountAmount: 0,
                adjustmentAmount: 0,
                totalAmount: 1000,
                paidAmount: 300,
                balanceDue: 800,
            };
            const result = (0, billing_calculations_1.validateInvoiceAmounts)(invoice);
            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.includes('Balance due mismatch'))).toBe(true);
        });
        it('should reject negative amounts', () => {
            const invoice = {
                subtotal: -100,
                taxAmount: 0,
                discountAmount: 0,
                adjustmentAmount: 0,
                totalAmount: -100,
                paidAmount: 0,
                balanceDue: -100,
            };
            const result = (0, billing_calculations_1.validateInvoiceAmounts)(invoice);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(2);
        });
    });
});
describe('Number Generation', () => {
    describe('generateInvoiceNumber', () => {
        it('should generate formatted invoice number', () => {
            expect((0, billing_calculations_1.generateInvoiceNumber)('ABC', 1, 2024)).toBe('INV-ABC-2024-000001');
            expect((0, billing_calculations_1.generateInvoiceNumber)('XYZ', 123, 2024)).toBe('INV-XYZ-2024-000123');
            expect((0, billing_calculations_1.generateInvoiceNumber)('TEST', 999999, 2024)).toBe('INV-TEST-2024-999999');
        });
        it('should use current year if not provided', () => {
            const currentYear = new Date().getFullYear();
            const invoiceNumber = (0, billing_calculations_1.generateInvoiceNumber)('ABC', 1);
            expect(invoiceNumber).toContain(`INV-ABC-${currentYear}`);
        });
    });
    describe('generatePaymentNumber', () => {
        it('should generate formatted payment number', () => {
            expect((0, billing_calculations_1.generatePaymentNumber)('ABC', 1, 2024)).toBe('PAY-ABC-2024-000001');
            expect((0, billing_calculations_1.generatePaymentNumber)('XYZ', 456, 2024)).toBe('PAY-XYZ-2024-000456');
        });
    });
    describe('generateClaimNumber', () => {
        it('should generate formatted claim number', () => {
            expect((0, billing_calculations_1.generateClaimNumber)('ABC', 1, 2024)).toBe('CLM-ABC-2024-000001');
            expect((0, billing_calculations_1.generateClaimNumber)('XYZ', 789, 2024)).toBe('CLM-XYZ-2024-000789');
        });
    });
});
describe('Date Calculations', () => {
    describe('calculateDueDate', () => {
        it('should add payment terms days to invoice date', () => {
            const invoiceDate = new Date('2024-01-01');
            const dueDate = (0, billing_calculations_1.calculateDueDate)(invoiceDate, 30);
            expect(dueDate.toISOString().split('T')[0]).toBe('2024-01-31');
        });
        it('should handle different payment terms', () => {
            const invoiceDate = new Date('2024-01-01');
            expect((0, billing_calculations_1.calculateDueDate)(invoiceDate, 0).toISOString().split('T')[0]).toBe('2024-01-01');
            expect((0, billing_calculations_1.calculateDueDate)(invoiceDate, 15).toISOString().split('T')[0]).toBe('2024-01-16');
            expect((0, billing_calculations_1.calculateDueDate)(invoiceDate, 60).toISOString().split('T')[0]).toBe('2024-03-01');
        });
        it('should handle month boundaries correctly', () => {
            const invoiceDate = new Date('2024-01-31');
            const dueDate = (0, billing_calculations_1.calculateDueDate)(invoiceDate, 1);
            expect(dueDate.toISOString().split('T')[0]).toBe('2024-02-01');
        });
    });
});
//# sourceMappingURL=billing-calculations.test.js.map