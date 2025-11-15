/**
 * Payroll Export Utilities
 *
 * Generate payroll files for common payroll providers (ADP, Paychex, etc.)
 * in standard formats (CSV, fixed-width, etc.)
 */

import { PayRun, PayStub } from '../types/payroll';

/**
 * Export format types
 */
export type ExportFormat = 'ADP_CSV' | 'PAYCHEX_CSV' | 'QUICKBOOKS_IIF' | 'GENERIC_CSV';

/**
 * Export configuration
 */
export interface ExportConfig {
  format: ExportFormat;
  companyId?: string;
  companyName?: string;
  fileDate?: Date;
}

/**
 * ADP CSV Export
 *
 * Standard ADP payroll import format
 * Format: File Code, Company Code, Batch ID, Employee ID, Regular Hours,
 *         Overtime Hours, Gross Pay, Tax Withheld, Net Pay
 */
export function generateADPCSV(
  payRun: PayRun,
  payStubs: PayStub[],
  config: ExportConfig
): string {
  const lines: string[] = [];

  // Header row
  lines.push([
    'File Code',
    'Company Code',
    'Batch ID',
    'Employee ID',
    'Employee Name',
    'Regular Hours',
    'Overtime Hours',
    'Double Time Hours',
    'Regular Pay',
    'Overtime Pay',
    'Double Time Pay',
    'Bonuses',
    'Reimbursements',
    'Gross Pay',
    'Federal Tax',
    'State Tax',
    'Social Security',
    'Medicare',
    'Total Deductions',
    'Net Pay',
    'Payment Method',
    'Check Number',
    'Bank Account Last 4',
  ].join(','));

  // Data rows
  for (const stub of payStubs) {
    const row = [
      'PAY', // File Code
      config.companyId || 'COMPANY', // Company Code
      payRun.runNumber, // Batch ID
      stub.caregiverEmployeeId, // Employee ID
      `"${stub.caregiverName}"`, // Employee Name (quoted for CSV)
      stub.regularHours.toFixed(2), // Regular Hours
      stub.overtimeHours.toFixed(2), // Overtime Hours
      stub.doubleTimeHours.toFixed(2), // Double Time Hours
      stub.regularPay.toFixed(2), // Regular Pay
      stub.overtimePay.toFixed(2), // Overtime Pay
      stub.doubleTimePay.toFixed(2), // Double Time Pay
      stub.bonuses.toFixed(2), // Bonuses
      stub.reimbursements.toFixed(2), // Reimbursements
      stub.currentGrossPay.toFixed(2), // Gross Pay
      stub.federalIncomeTax.toFixed(2), // Federal Tax
      stub.stateIncomeTax.toFixed(2), // State Tax
      stub.socialSecurityTax.toFixed(2), // Social Security
      stub.medicareTax.toFixed(2), // Medicare
      stub.totalOtherDeductions.toFixed(2), // Total Deductions
      stub.currentNetPay.toFixed(2), // Net Pay
      stub.paymentMethod, // Payment Method
      stub.checkNumber || '', // Check Number
      stub.bankAccountLast4 || '', // Bank Account Last 4
    ];

    lines.push(row.join(','));
  }

  return lines.join('\n');
}

/**
 * Paychex CSV Export
 *
 * Paychex Preview payroll import format
 * Format: Client ID, Employee ID, Check Date, Pay Period Start, Pay Period End,
 *         Regular Hours, OT Hours, Gross Pay, Net Pay
 */
export function generatePaychexCSV(
  payRun: PayRun,
  payStubs: PayStub[],
  config: ExportConfig
): string {
  const lines: string[] = [];

  // Header row
  lines.push([
    'Client ID',
    'Employee ID',
    'Employee Name',
    'Check Date',
    'Pay Period Start',
    'Pay Period End',
    'Regular Hours',
    'Overtime Hours',
    'Regular Pay',
    'Overtime Pay',
    'Other Earnings',
    'Gross Pay',
    'Federal Withholding',
    'State Withholding',
    'FICA',
    'Medicare',
    'Other Deductions',
    'Net Pay',
    'Payment Type',
    'Direct Deposit Account',
  ].join(','));

  // Data rows
  for (const stub of payStubs) {
    const row = [
      config.companyId || 'CLIENT', // Client ID
      stub.caregiverEmployeeId, // Employee ID
      `"${stub.caregiverName}"`, // Employee Name
      formatDate(stub.payDate), // Check Date
      formatDate(stub.payPeriodStartDate), // Pay Period Start
      formatDate(stub.payPeriodEndDate), // Pay Period End
      stub.regularHours.toFixed(2), // Regular Hours
      stub.overtimeHours.toFixed(2), // Overtime Hours
      stub.regularPay.toFixed(2), // Regular Pay
      stub.overtimePay.toFixed(2), // Overtime Pay
      (stub.bonuses + stub.reimbursements).toFixed(2), // Other Earnings
      stub.currentGrossPay.toFixed(2), // Gross Pay
      stub.federalIncomeTax.toFixed(2), // Federal Withholding
      stub.stateIncomeTax.toFixed(2), // State Withholding
      stub.socialSecurityTax.toFixed(2), // FICA
      stub.medicareTax.toFixed(2), // Medicare
      stub.totalOtherDeductions.toFixed(2), // Other Deductions
      stub.currentNetPay.toFixed(2), // Net Pay
      stub.paymentMethod === 'DIRECT_DEPOSIT' ? 'DD' : 'CHK', // Payment Type
      stub.bankAccountLast4 || '', // Direct Deposit Account
    ];

    lines.push(row.join(','));
  }

  return lines.join('\n');
}

/**
 * QuickBooks IIF Export
 *
 * QuickBooks Import/Export format for payroll
 * Uses IIF (Intuit Interchange Format)
 */
export function generateQuickBooksIIF(
  payRun: PayRun,
  payStubs: PayStub[],
  config: ExportConfig
): string {
  const lines: string[] = [];

  // IIF Header
  lines.push('!TIMERHDR\tVER\t7\tREL\t0\tCOMPANYNAME\t' + (config.companyName || 'Care Commons'));
  lines.push('!TIMEACT\tDATE\tJOB\tEMP\tITEM\tPITEM\tDURATION\tNOTE');

  // Convert pay stubs to time activities
  for (const stub of payStubs) {
    // Regular hours entry
    if (stub.regularHours > 0) {
      lines.push([
        'TIMEACT',
        formatDate(stub.payDate),
        '', // Job (can be populated if needed)
        stub.caregiverName,
        'Regular Hours',
        '', // Parent item
        formatDuration(stub.regularHours),
        `Pay Period: ${formatDate(stub.payPeriodStartDate)} - ${formatDate(stub.payPeriodEndDate)}`,
      ].join('\t'));
    }

    // Overtime hours entry
    if (stub.overtimeHours > 0) {
      lines.push([
        'TIMEACT',
        formatDate(stub.payDate),
        '',
        stub.caregiverName,
        'Overtime Hours',
        '',
        formatDuration(stub.overtimeHours),
        `Pay Period: ${formatDate(stub.payPeriodStartDate)} - ${formatDate(stub.payPeriodEndDate)}`,
      ].join('\t'));
    }

    // Double time hours entry
    if (stub.doubleTimeHours > 0) {
      lines.push([
        'TIMEACT',
        formatDate(stub.payDate),
        '',
        stub.caregiverName,
        'Double Time Hours',
        '',
        formatDuration(stub.doubleTimeHours),
        `Pay Period: ${formatDate(stub.payPeriodStartDate)} - ${formatDate(stub.payPeriodEndDate)}`,
      ].join('\t'));
    }
  }

  return lines.join('\n');
}

/**
 * Generic CSV Export
 *
 * Simple CSV export with all key fields
 */
export function generateGenericCSV(
  payRun: PayRun,
  payStubs: PayStub[],
  _config: ExportConfig
): string {
  const lines: string[] = [];

  // Header row
  lines.push([
    'Pay Run Number',
    'Employee ID',
    'Employee Name',
    'Pay Date',
    'Period Start',
    'Period End',
    'Regular Hours',
    'Overtime Hours',
    'Double Time Hours',
    'PTO Hours',
    'Total Hours',
    'Regular Pay',
    'Overtime Pay',
    'Double Time Pay',
    'PTO Pay',
    'Bonuses',
    'Reimbursements',
    'Gross Pay',
    'Federal Income Tax',
    'State Income Tax',
    'Social Security Tax',
    'Medicare Tax',
    'Other Deductions',
    'Total Tax Withheld',
    'Net Pay',
    'YTD Gross',
    'YTD Federal Tax',
    'YTD State Tax',
    'YTD Social Security',
    'YTD Medicare',
    'YTD Net Pay',
    'Payment Method',
    'Check Number',
    'Bank Account',
    'Stub Number',
  ].join(','));

  // Data rows
  for (const stub of payStubs) {
    const row = [
      payRun.runNumber,
      stub.caregiverEmployeeId,
      `"${stub.caregiverName}"`,
      formatDate(stub.payDate),
      formatDate(stub.payPeriodStartDate),
      formatDate(stub.payPeriodEndDate),
      stub.regularHours.toFixed(2),
      stub.overtimeHours.toFixed(2),
      stub.doubleTimeHours.toFixed(2),
      stub.ptoHours.toFixed(2),
      stub.totalHours.toFixed(2),
      stub.regularPay.toFixed(2),
      stub.overtimePay.toFixed(2),
      stub.doubleTimePay.toFixed(2),
      stub.ptoPay.toFixed(2),
      stub.bonuses.toFixed(2),
      stub.reimbursements.toFixed(2),
      stub.currentGrossPay.toFixed(2),
      stub.federalIncomeTax.toFixed(2),
      stub.stateIncomeTax.toFixed(2),
      stub.socialSecurityTax.toFixed(2),
      stub.medicareTax.toFixed(2),
      stub.totalOtherDeductions.toFixed(2),
      stub.totalTaxWithheld.toFixed(2),
      stub.currentNetPay.toFixed(2),
      stub.ytdGrossPay.toFixed(2),
      stub.ytdFederalTax.toFixed(2),
      stub.ytdStateTax.toFixed(2),
      stub.ytdSocialSecurity.toFixed(2),
      stub.ytdMedicare.toFixed(2),
      stub.ytdNetPay.toFixed(2),
      stub.paymentMethod,
      stub.checkNumber || '',
      stub.bankAccountLast4 || '',
      stub.stubNumber,
    ];

    lines.push(row.join(','));
  }

  return lines.join('\n');
}

/**
 * Main export function - generates export based on format
 */
export function generatePayrollExport(
  payRun: PayRun,
  payStubs: PayStub[],
  config: ExportConfig
): string {
  switch (config.format) {
    case 'ADP_CSV':
      return generateADPCSV(payRun, payStubs, config);
    case 'PAYCHEX_CSV':
      return generatePaychexCSV(payRun, payStubs, config);
    case 'QUICKBOOKS_IIF':
      return generateQuickBooksIIF(payRun, payStubs, config);
    case 'GENERIC_CSV':
      return generateGenericCSV(payRun, payStubs, config);
    default:
      throw new Error(`Unsupported export format: ${config.format}`);
  }
}

/**
 * Generate export file name
 */
export function generateExportFileName(
  payRun: PayRun,
  format: ExportFormat
): string {
  const dateStr = new Date().toISOString().split('T')[0]!;
  const runNumber = payRun.runNumber.replace(/\//g, '-');

  switch (format) {
    case 'ADP_CSV':
      return `ADP_Payroll_${runNumber}_${dateStr}.csv`;
    case 'PAYCHEX_CSV':
      return `Paychex_Payroll_${runNumber}_${dateStr}.csv`;
    case 'QUICKBOOKS_IIF':
      return `QuickBooks_Payroll_${runNumber}_${dateStr}.iif`;
    case 'GENERIC_CSV':
      return `Payroll_Export_${runNumber}_${dateStr}.csv`;
    default:
      return `Payroll_${runNumber}_${dateStr}.csv`;
  }
}

/**
 * Generate payroll summary report (for internal use)
 */
export function generatePayrollSummary(
  payRun: PayRun,
  payStubs: PayStub[]
): string {
  const lines: string[] = [];

  lines.push('===============================================');
  lines.push('        PAYROLL SUMMARY REPORT');
  lines.push('===============================================');
  lines.push('');
  lines.push(`Pay Run: ${payRun.runNumber}`);
  lines.push(`Pay Period: ${formatDate(payRun.payPeriodStartDate)} - ${formatDate(payRun.payPeriodEndDate)}`);
  lines.push(`Pay Date: ${formatDate(payRun.payDate)}`);
  lines.push(`Total Caregivers: ${payStubs.length}`);
  lines.push('');
  lines.push('-----------------------------------------------');
  lines.push('HOURS SUMMARY');
  lines.push('-----------------------------------------------');
  lines.push(`Total Hours: ${payStubs.reduce((sum, s) => sum + s.totalHours, 0).toFixed(2)}`);
  lines.push(`Regular Hours: ${payStubs.reduce((sum, s) => sum + s.regularHours, 0).toFixed(2)}`);
  lines.push(`Overtime Hours: ${payStubs.reduce((sum, s) => sum + s.overtimeHours, 0).toFixed(2)}`);
  lines.push(`Double Time Hours: ${payStubs.reduce((sum, s) => sum + s.doubleTimeHours, 0).toFixed(2)}`);
  lines.push(`PTO Hours: ${payStubs.reduce((sum, s) => sum + s.ptoHours, 0).toFixed(2)}`);
  lines.push('');
  lines.push('-----------------------------------------------');
  lines.push('EARNINGS SUMMARY');
  lines.push('-----------------------------------------------');
  lines.push(`Gross Pay: $${payStubs.reduce((sum, s) => sum + s.currentGrossPay, 0).toFixed(2)}`);
  lines.push(`  Regular Pay: $${payStubs.reduce((sum, s) => sum + s.regularPay, 0).toFixed(2)}`);
  lines.push(`  Overtime Pay: $${payStubs.reduce((sum, s) => sum + s.overtimePay, 0).toFixed(2)}`);
  lines.push(`  Double Time Pay: $${payStubs.reduce((sum, s) => sum + s.doubleTimePay, 0).toFixed(2)}`);
  lines.push(`  Bonuses: $${payStubs.reduce((sum, s) => sum + s.bonuses, 0).toFixed(2)}`);
  lines.push(`  Reimbursements: $${payStubs.reduce((sum, s) => sum + s.reimbursements, 0).toFixed(2)}`);
  lines.push('');
  lines.push('-----------------------------------------------');
  lines.push('TAX WITHHOLDING SUMMARY');
  lines.push('-----------------------------------------------');
  lines.push(`Total Tax Withheld: $${payStubs.reduce((sum, s) => sum + s.totalTaxWithheld, 0).toFixed(2)}`);
  lines.push(`  Federal Income Tax: $${payStubs.reduce((sum, s) => sum + s.federalIncomeTax, 0).toFixed(2)}`);
  lines.push(`  State Income Tax: $${payStubs.reduce((sum, s) => sum + s.stateIncomeTax, 0).toFixed(2)}`);
  lines.push(`  Social Security Tax: $${payStubs.reduce((sum, s) => sum + s.socialSecurityTax, 0).toFixed(2)}`);
  lines.push(`  Medicare Tax: $${payStubs.reduce((sum, s) => sum + s.medicareTax, 0).toFixed(2)}`);
  lines.push('');
  lines.push('-----------------------------------------------');
  lines.push('OTHER DEDUCTIONS SUMMARY');
  lines.push('-----------------------------------------------');
  lines.push(`Total Other Deductions: $${payStubs.reduce((sum, s) => sum + s.totalOtherDeductions, 0).toFixed(2)}`);
  lines.push(`  Health Insurance: $${payStubs.reduce((sum, s) => sum + s.healthInsurance, 0).toFixed(2)}`);
  lines.push(`  401(k): $${payStubs.reduce((sum, s) => sum + s.retirement401k, 0).toFixed(2)}`);
  lines.push(`  Garnishments: $${payStubs.reduce((sum, s) => sum + s.garnishments, 0).toFixed(2)}`);
  lines.push('');
  lines.push('-----------------------------------------------');
  lines.push('NET PAY SUMMARY');
  lines.push('-----------------------------------------------');
  lines.push(`Total Net Pay: $${payStubs.reduce((sum, s) => sum + s.currentNetPay, 0).toFixed(2)}`);
  lines.push('');
  lines.push('-----------------------------------------------');
  lines.push('PAYMENT METHOD BREAKDOWN');
  lines.push('-----------------------------------------------');

  const paymentMethods = payStubs.reduce((acc, stub) => {
    const method = stub.paymentMethod;
    if (!acc[method]) {
      acc[method] = { count: 0, amount: 0 };
    }
    acc[method].count++;
    acc[method].amount += stub.currentNetPay;
    return acc;
  }, {} as Record<string, { count: number; amount: number }>);

  Object.entries(paymentMethods).forEach(([method, data]) => {
    lines.push(`${method}: ${data.count} stubs, $${data.amount.toFixed(2)}`);
  });

  lines.push('');
  lines.push('===============================================');

  return lines.join('\n');
}

/**
 * Utility: Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Utility: Format duration as HH:MM for IIF format
 */
function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}
