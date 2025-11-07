# Task 0037: Payroll Processing Implementation

**Priority**: 🟠 HIGH
**Phase**: Phase 2 - Feature Completeness
**Estimated Effort**: 14-18 hours

## Context

Payroll is a critical vertical for home healthcare agencies. The database schema exists, but the business logic, tax calculations, and UI need to be implemented to make payroll fully functional.

## Problem Statement

Current state:
- ✅ Database schema complete (`payroll_periods`, `pay_stubs`, `tax_withholdings`)
- ❌ No payroll calculation logic
- ❌ No tax withholding calculations
- ❌ No pay stub generation
- ❌ No payroll reports
- ❌ No UI for viewing/managing payroll

## Task

### 1. Implement Payroll Calculation Service

**File**: `verticals/payroll-processing/src/services/payroll-calculation.service.ts`

```typescript
import { Knex } from 'knex';
import { PayrollPeriod, PayStub, TaxWithholding } from '../types';

export class PayrollCalculationService {
  constructor(private db: Knex) {}

  async calculatePayrollForPeriod(periodId: string): Promise<PayStub[]> {
    const period = await this.getPayrollPeriod(periodId);
    const caregivers = await this.getActiveCareg ivers(period.organization_id);

    const payStubs: PayStub[] = [];

    for (const caregiver of caregivers) {
      const hours = await this.calculateHours(caregiver.id, period);
      const grossPay = await this.calculateGrossPay(caregiver.id, hours);
      const taxes = await this.calculateTaxes(caregiver, grossPay, period.state);
      const deductions = await this.calculateDeductions(caregiver.id);
      const netPay = grossPay - taxes.total - deductions.total;

      const payStub = await this.createPayStub({
        caregiver_id: caregiver.id,
        payroll_period_id: periodId,
        regular_hours: hours.regular,
        overtime_hours: hours.overtime,
        regular_pay: hours.regular * caregiver.hourly_rate,
        overtime_pay: hours.overtime * caregiver.hourly_rate * 1.5,
        gross_pay: grossPay,
        federal_tax: taxes.federal,
        state_tax: taxes.state,
        fica_tax: taxes.fica,
        medicare_tax: taxes.medicare,
        total_deductions: deductions.total,
        net_pay: netPay,
      });

      payStubs.push(payStub);
    }

    return payStubs;
  }

  private async calculateHours(
    caregiverId: string,
    period: PayrollPeriod
  ): Promise<{ regular: number; overtime: number }> {
    const visits = await this.db('visits')
      .join('evv_records', 'visits.id', 'evv_records.visit_id')
      .where({
        'visits.caregiver_id': caregiverId,
        'visits.status': 'completed',
      })
      .whereBetween('evv_records.check_in_time', [
        period.start_date,
        period.end_date,
      ])
      .select(
        this.db.raw(
          'SUM(EXTRACT(EPOCH FROM (check_out_time - check_in_time)) / 3600) as total_hours'
        )
      );

    const totalHours = parseFloat(visits[0]?.total_hours || '0');

    // Calculate overtime (>40 hours per week for most states)
    const regularHours = Math.min(totalHours, 40);
    const overtimeHours = Math.max(totalHours - 40, 0);

    return { regular: regularHours, overtime: overtimeHours };
  }

  private async calculateGrossPay(
    caregiverId: string,
    hours: { regular: number; overtime: number }
  ): Promise<number> {
    const caregiver = await this.db('caregivers')
      .where({ id: caregiverId })
      .first();

    const regularPay = hours.regular * caregiver.hourly_rate;
    const overtimePay = hours.overtime * caregiver.hourly_rate * 1.5;

    return regularPay + overtimePay;
  }

  private async calculateTaxes(
    caregiver: any,
    grossPay: number,
    state: string
  ): Promise<{
    federal: number;
    state: number;
    fica: number;
    medicare: number;
    total: number;
  }> {
    // Federal tax (simplified - use tax brackets in production)
    const federalRate = this.getFederalTaxRate(grossPay * 52); // Annualize
    const federal = grossPay * federalRate;

    // State tax
    const stateRate = this.getStateTaxRate(state, grossPay * 52);
    const stateTax = grossPay * stateRate;

    // FICA (Social Security) - 6.2% up to wage base
    const fica = Math.min(grossPay * 0.062, 160200 * 0.062); // 2025 wage base

    // Medicare - 1.45%
    const medicare = grossPay * 0.0145;

    return {
      federal,
      state: stateTax,
      fica,
      medicare,
      total: federal + stateTax + fica + medicare,
    };
  }

  private getFederalTaxRate(annualIncome: number): number {
    // 2025 federal tax brackets (single filer)
    if (annualIncome <= 11600) return 0.10;
    if (annualIncome <= 47150) return 0.12;
    if (annualIncome <= 100525) return 0.22;
    if (annualIncome <= 191950) return 0.24;
    if (annualIncome <= 243725) return 0.32;
    if (annualIncome <= 609350) return 0.35;
    return 0.37;
  }

  private getStateTaxRate(state: string, annualIncome: number): number {
    // State tax rates (simplified)
    const rates: Record<string, number> = {
      TX: 0, // No state income tax
      FL: 0, // No state income tax
      CA: 0.093,
      NY: 0.065,
      PA: 0.0307,
      OH: 0.0399,
      GA: 0.0575,
      NC: 0.0499,
      AZ: 0.025,
    };

    return rates[state] || 0.05; // Default 5% if state not found
  }

  private async calculateDeductions(caregiverId: string): Promise<{ total: number }> {
    // Fetch pre-tax deductions (health insurance, retirement contributions, etc.)
    const deductions = await this.db('caregiver_deductions')
      .where({ caregiver_id: caregiverId, active: true })
      .sum('amount as total');

    return { total: parseFloat(deductions[0]?.total || '0') };
  }
}
```

### 2. Implement Pay Stub Generation

**File**: `verticals/payroll-processing/src/services/pay-stub-generator.service.ts`

```typescript
import PDFDocument from 'pdfkit';
import { PayStub } from '../types';

export class PayStubGeneratorService {
  async generatePayStubPDF(payStub: PayStub): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('PAY STUB', { align: 'center' });
      doc.moveDown();

      // Organization info
      doc.fontSize(10).text(`${payStub.organization_name}`, { align: 'left' });
      doc.text(`${payStub.organization_address}`);
      doc.moveDown();

      // Employee info
      doc.fontSize(12).text('Employee Information', { underline: true });
      doc.fontSize(10);
      doc.text(`Name: ${payStub.caregiver_name}`);
      doc.text(`Employee ID: ${payStub.caregiver_id}`);
      doc.text(`Pay Period: ${payStub.period_start} to ${payStub.period_end}`);
      doc.text(`Pay Date: ${payStub.pay_date}`);
      doc.moveDown();

      // Earnings
      doc.fontSize(12).text('Earnings', { underline: true });
      doc.fontSize(10);
      this.addTableRow(doc, 'Description', 'Hours', 'Rate', 'Amount');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

      this.addTableRow(
        doc,
        'Regular Pay',
        payStub.regular_hours.toFixed(2),
        payStub.hourly_rate.toFixed(2),
        payStub.regular_pay.toFixed(2)
      );

      if (payStub.overtime_hours > 0) {
        this.addTableRow(
          doc,
          'Overtime Pay (1.5x)',
          payStub.overtime_hours.toFixed(2),
          (payStub.hourly_rate * 1.5).toFixed(2),
          payStub.overtime_pay.toFixed(2)
        );
      }

      doc.moveDown();
      doc.text(`Gross Pay: $${payStub.gross_pay.toFixed(2)}`, { align: 'right' });
      doc.moveDown();

      // Deductions
      doc.fontSize(12).text('Deductions', { underline: true });
      doc.fontSize(10);
      doc.text(`Federal Tax: $${payStub.federal_tax.toFixed(2)}`);
      doc.text(`State Tax: $${payStub.state_tax.toFixed(2)}`);
      doc.text(`Social Security (FICA): $${payStub.fica_tax.toFixed(2)}`);
      doc.text(`Medicare: $${payStub.medicare_tax.toFixed(2)}`);
      doc.text(`Other Deductions: $${payStub.other_deductions.toFixed(2)}`);
      doc.moveDown();
      doc.text(`Total Deductions: $${payStub.total_deductions.toFixed(2)}`, {
        align: 'right',
      });
      doc.moveDown();

      // Net Pay
      doc.fontSize(14)
        .text(`NET PAY: $${payStub.net_pay.toFixed(2)}`, {
          align: 'right',
          bold: true,
        });

      // Year-to-date totals
      doc.moveDown();
      doc.fontSize(12).text('Year-to-Date Totals', { underline: true });
      doc.fontSize(10);
      doc.text(`Gross Pay YTD: $${payStub.ytd_gross.toFixed(2)}`);
      doc.text(`Federal Tax YTD: $${payStub.ytd_federal_tax.toFixed(2)}`);
      doc.text(`Net Pay YTD: $${payStub.ytd_net.toFixed(2)}`);

      doc.end();
    });
  }

  private addTableRow(
    doc: PDFKit.PDFDocument,
    col1: string,
    col2: string,
    col3: string,
    col4: string
  ) {
    const y = doc.y;
    doc.text(col1, 50, y, { width: 200 });
    doc.text(col2, 250, y, { width: 80, align: 'right' });
    doc.text(col3, 330, y, { width: 80, align: 'right' });
    doc.text(col4, 410, y, { width: 90, align: 'right' });
    doc.moveDown(0.5);
  }
}
```

### 3. Create Payroll UI Components

**File**: `packages/web/src/app/pages/payroll/PayrollDashboard.tsx`

```typescript
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { PayrollPeriodCard } from './components/PayrollPeriodCard';

export const PayrollDashboard: React.FC = () => {
  const { data: currentPeriod } = useQuery({
    queryKey: ['payroll', 'current-period'],
    queryFn: () => api.get('/api/payroll/current-period'),
  });

  const { data: recentPeriods } = useQuery({
    queryKey: ['payroll', 'periods'],
    queryFn: () => api.get('/api/payroll/periods?limit=5'),
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Payroll Management</h1>
        <Button variant="primary">Create New Period</Button>
      </div>

      {/* Current Period */}
      {currentPeriod && (
        <Card title="Current Pay Period" className="mb-8">
          <PayrollPeriodCard period={currentPeriod} />
        </Card>
      )}

      {/* Recent Periods */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Pay Periods</h2>
        {recentPeriods?.map(period => (
          <PayrollPeriodCard key={period.id} period={period} />
        ))}
      </div>
    </div>
  );
};
```

## Acceptance Criteria

- [ ] Payroll calculation service implemented
- [ ] Tax calculations accurate for all supported states
- [ ] Overtime calculation correct
- [ ] Pay stub generation working (PDF)
- [ ] Payroll UI implemented
- [ ] Reports: payroll summary, tax liability
- [ ] Tests for tax calculations (critical!)
- [ ] Year-to-date totals accurate

## Testing Checklist

1. **Tax Calculation Test**: Verify tax calculations for various income levels
2. **Overtime Test**: Verify overtime calculations
3. **Pay Stub Test**: Generate sample pay stubs, verify accuracy
4. **State Tax Test**: Test different states with different tax rates
5. **YTD Test**: Verify year-to-date calculations

## Dependencies

**Blocks**: None
**Depends on**: Task 0024 (Provider interfaces)

## Priority Justification

This is **HIGH** priority because:
1. Core vertical for agencies
2. Schema exists, needs implementation
3. Critical for operational efficiency
4. High business value

---

**Next Task**: 0038 - E2E Test Coverage Expansion
