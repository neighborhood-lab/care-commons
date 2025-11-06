/**
 * Export utilities for payroll reports
 *
 * Handles exporting payroll data to various formats:
 * - PDF (pay stubs, reports)
 * - CSV (payroll data for accounting software)
 * - ADP/Paychex format
 * - QuickBooks format
 */

import type { PayStub, PayRun, PayPeriod } from '../types';

/**
 * Format data for CSV export
 */
export function formatPayrollDataForCSV(payStubs: PayStub[]): string {
  const headers = [
    'Employee ID',
    'Employee Name',
    'Pay Period Start',
    'Pay Period End',
    'Pay Date',
    'Regular Hours',
    'Overtime Hours',
    'Total Hours',
    'Regular Pay',
    'Overtime Pay',
    'Gross Pay',
    'Federal Tax',
    'State Tax',
    'Social Security',
    'Medicare',
    'Total Tax',
    'Other Deductions',
    'Net Pay',
  ];

  const rows = payStubs.map(stub => [
    stub.caregiverEmployeeId,
    stub.caregiverName,
    stub.payPeriodStartDate.split('T')[0],
    stub.payPeriodEndDate.split('T')[0],
    stub.payDate.split('T')[0],
    stub.regularHours.toFixed(2),
    stub.overtimeHours.toFixed(2),
    stub.totalHours.toFixed(2),
    stub.regularPay.toFixed(2),
    stub.overtimePay.toFixed(2),
    stub.currentGrossPay.toFixed(2),
    stub.federalIncomeTax.toFixed(2),
    stub.stateIncomeTax.toFixed(2),
    stub.socialSecurityTax.toFixed(2),
    stub.medicareTax.toFixed(2),
    stub.totalTaxWithheld.toFixed(2),
    stub.totalOtherDeductions.toFixed(2),
    stub.currentNetPay.toFixed(2),
  ]);

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
}

/**
 * Format data for ADP export
 * ADP uses a specific file format for payroll import
 */
export function formatPayrollDataForADP(payStubs: PayStub[]): string {
  // ADP format varies by client configuration
  // This is a simplified version
  const headers = [
    'Co Code',
    'Batch ID',
    'File #',
    'Reg Hours',
    'O/T Hours',
    'Reg Earnings',
    'O/T Earnings',
    'Earnings 3 Code',
    'Earnings 3 Amount',
  ];

  const rows = payStubs.map(stub => [
    '001', // Company code (would come from configuration)
    'PAYROLL', // Batch ID
    stub.caregiverEmployeeId,
    stub.regularHours.toFixed(2),
    stub.overtimeHours.toFixed(2),
    stub.regularPay.toFixed(2),
    stub.overtimePay.toFixed(2),
    'BONUS', // Additional earnings code
    stub.bonuses.toFixed(2),
  ]);

  return [headers, ...rows]
    .map(row => row.join('\t')) // ADP typically uses tab-delimited
    .join('\n');
}

/**
 * Format data for Paychex export
 */
export function formatPayrollDataForPaychex(payStubs: PayStub[]): string {
  // Paychex format
  const headers = [
    'Client ID',
    'Employee ID',
    'Check Date',
    'Hours Type 1',
    'Hours 1',
    'Earnings 1',
    'Hours Type 2',
    'Hours 2',
    'Earnings 2',
  ];

  const rows = payStubs.map(stub => [
    'CLIENT001', // Client ID (would come from configuration)
    stub.caregiverEmployeeId,
    stub.payDate.split('T')[0],
    'REG',
    stub.regularHours.toFixed(2),
    stub.regularPay.toFixed(2),
    'OT',
    stub.overtimeHours.toFixed(2),
    stub.overtimePay.toFixed(2),
  ]);

  return [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');
}

/**
 * Format data for QuickBooks IIF import
 * IIF (Intuit Interchange Format) for QuickBooks Desktop
 */
export function formatPayrollDataForQuickBooksIIF(_payRun: PayRun, payStubs: PayStub[]): string {
  const lines: string[] = [];

  // Header
  lines.push('!TIMERHDR\tVER\tREL\tCOMPANYNAME\tIMPORTEDBEFORE');
  lines.push(`TIMERHDR\t8\t0\tPayroll Import\tN`);

  // Timesheet entries
  lines.push('!TIMEACT\tDATE\tJOB\tEMP\tITEM\tPITEM\tDURATION\tPROJ\tNOTE');

  payStubs.forEach(stub => {
    // Regular hours
    if (stub.regularHours > 0) {
      lines.push([
        'TIMEACT',
        stub.payPeriodEndDate.split('T')[0],
        '', // Job
        stub.caregiverName,
        'Regular', // Service item
        '', // Payroll item
        formatDurationForQuickBooks(stub.regularHours),
        '', // Project
        `Pay period ${stub.payPeriodStartDate.split('T')[0]} to ${stub.payPeriodEndDate.split('T')[0]}`,
      ].join('\t'));
    }

    // Overtime hours
    if (stub.overtimeHours > 0) {
      lines.push([
        'TIMEACT',
        stub.payPeriodEndDate.split('T')[0],
        '',
        stub.caregiverName,
        'Overtime',
        '',
        formatDurationForQuickBooks(stub.overtimeHours),
        '',
        'Overtime',
      ].join('\t'));
    }
  });

  return lines.join('\n');
}

/**
 * Format hours as duration for QuickBooks (hh:mm format)
 */
function formatDurationForQuickBooks(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Format data for QuickBooks Online CSV import
 */
export function formatPayrollDataForQuickBooksOnline(payStubs: PayStub[]): string {
  const headers = [
    'Employee Name',
    'Employee ID',
    'Pay Period Start',
    'Pay Period End',
    'Pay Date',
    'Regular Pay',
    'Overtime Pay',
    'Total Pay',
    'Federal Withholding',
    'State Withholding',
    'Social Security Employee',
    'Medicare Employee',
    'Net Pay',
  ];

  const rows = payStubs.map(stub => [
    stub.caregiverName,
    stub.caregiverEmployeeId,
    stub.payPeriodStartDate.split('T')[0],
    stub.payPeriodEndDate.split('T')[0],
    stub.payDate.split('T')[0],
    stub.regularPay.toFixed(2),
    stub.overtimePay.toFixed(2),
    stub.currentGrossPay.toFixed(2),
    stub.federalIncomeTax.toFixed(2),
    stub.stateIncomeTax.toFixed(2),
    stub.socialSecurityTax.toFixed(2),
    stub.medicareTax.toFixed(2),
    stub.currentNetPay.toFixed(2),
  ]);

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
}

/**
 * Generate filename for export
 */
export function generateExportFilename(
  type: 'csv' | 'adp' | 'paychex' | 'quickbooks' | 'pdf',
  period: PayPeriod
): string {
  const dateStr = period.startDate.split('T')[0];
  const prefix = type.toUpperCase();
  return `${prefix}_Payroll_${dateStr}.${type === 'pdf' ? 'pdf' : type === 'quickbooks' ? 'iif' : 'csv'}`;
}

/**
 * Trigger file download in browser
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/csv'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export pay stubs to CSV
 */
export function exportPayStubsToCSV(payStubs: PayStub[], filename?: string): void {
  const csv = formatPayrollDataForCSV(payStubs);
  const defaultFilename = filename || `paystubs_${new Date().toISOString().split('T')[0]}.csv`;
  downloadFile(csv, defaultFilename, 'text/csv');
}

/**
 * Export to ADP format
 */
export function exportToADP(payStubs: PayStub[], filename?: string): void {
  const data = formatPayrollDataForADP(payStubs);
  const defaultFilename = filename || `adp_payroll_${new Date().toISOString().split('T')[0]}.txt`;
  downloadFile(data, defaultFilename, 'text/plain');
}

/**
 * Export to Paychex format
 */
export function exportToPaychex(payStubs: PayStub[], filename?: string): void {
  const data = formatPayrollDataForPaychex(payStubs);
  const defaultFilename = filename || `paychex_payroll_${new Date().toISOString().split('T')[0]}.csv`;
  downloadFile(data, defaultFilename, 'text/csv');
}

/**
 * Export to QuickBooks format
 */
export function exportToQuickBooks(payRun: PayRun, payStubs: PayStub[], format: 'desktop' | 'online' = 'online', filename?: string): void {
  if (format === 'desktop') {
    const data = formatPayrollDataForQuickBooksIIF(payRun, payStubs);
    const defaultFilename = filename || `quickbooks_payroll_${new Date().toISOString().split('T')[0]}.iif`;
    downloadFile(data, defaultFilename, 'text/plain');
  } else {
    const data = formatPayrollDataForQuickBooksOnline(payStubs);
    const defaultFilename = filename || `quickbooks_payroll_${new Date().toISOString().split('T')[0]}.csv`;
    downloadFile(data, defaultFilename, 'text/csv');
  }
}
