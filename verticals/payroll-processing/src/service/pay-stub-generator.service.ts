/**
 * Pay Stub Generator Service
 *
 * Generates PDF pay stubs for caregivers
 * Creates professional, detailed earnings statements with all required information
 */

import PDFDocument from 'pdfkit';
import { PayStub } from '../types/payroll';

export interface PayStubPDFData extends PayStub {
  organizationName?: string;
  organizationAddress?: string;
  organizationCity?: string;
  organizationState?: string;
  organizationZip?: string;
  hourlyRate?: number;
}

/**
 * Service for generating pay stub PDFs
 */
export class PayStubGeneratorService {
  /**
   * Generate a PDF pay stub from pay stub data
   */
  async generatePayStubPDF(payStubData: PayStubPDFData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'LETTER',
        margin: 50,
        info: {
          Title: `Pay Stub - ${payStubData.stubNumber}`,
          Author: payStubData.organizationName || 'Care Commons',
          Subject: `Pay stub for ${payStubData.caregiverName}`,
          CreationDate: new Date(),
        },
      });

      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      try {
        // Header
        this.renderHeader(doc, payStubData);
        doc.moveDown(1);

        // Organization and Employee Information
        this.renderOrganizationInfo(doc, payStubData);
        doc.moveDown(0.5);
        this.renderEmployeeInfo(doc, payStubData);
        doc.moveDown(1);

        // Pay Period and Pay Date
        this.renderPayPeriodInfo(doc, payStubData);
        doc.moveDown(1);

        // Earnings Section
        this.renderEarningsSection(doc, payStubData);
        doc.moveDown(1);

        // Deductions Section
        this.renderDeductionsSection(doc, payStubData);
        doc.moveDown(1);

        // Net Pay
        this.renderNetPay(doc, payStubData);
        doc.moveDown(1);

        // Year-to-Date Totals
        this.renderYTDTotals(doc, payStubData);
        doc.moveDown(1);

        // Payment Method
        this.renderPaymentMethod(doc, payStubData);

        // Footer
        this.renderFooter(doc);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Render header section
   */
  private renderHeader(doc: InstanceType<typeof PDFDocument>, data: PayStubPDFData): void {
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('PAY STUB', { align: 'center' });

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Stub Number: ${data.stubNumber}`, { align: 'center' });
  }

  /**
   * Render organization information
   */
  private renderOrganizationInfo(doc: InstanceType<typeof PDFDocument>, data: PayStubPDFData): void {
    const orgName = data.organizationName || 'Organization';
    const orgAddress = data.organizationAddress || '';
    const orgCity = data.organizationCity || '';
    const orgState = data.organizationState || '';
    const orgZip = data.organizationZip || '';

    doc.fontSize(10).font('Helvetica-Bold').text('Employer Information', { underline: true });
    doc.fontSize(9).font('Helvetica');
    doc.text(orgName);
    if (orgAddress) {
      doc.text(orgAddress);
    }
    if (orgCity || orgState || orgZip) {
      doc.text(`${orgCity}${orgCity && (orgState || orgZip) ? ', ' : ''}${orgState} ${orgZip}`.trim());
    }
  }

  /**
   * Render employee information
   */
  private renderEmployeeInfo(doc: InstanceType<typeof PDFDocument>, data: PayStubPDFData): void {
    doc.fontSize(10).font('Helvetica-Bold').text('Employee Information', { underline: true });
    doc.fontSize(9).font('Helvetica');
    doc.text(`Name: ${data.caregiverName}`);
    doc.text(`Employee ID: ${data.caregiverEmployeeId}`);

    if (data.caregiverAddress) {
      const addr = data.caregiverAddress;
      doc.text(`Address: ${addr.line1}`);
      if (addr.line2) {
        doc.text(`         ${addr.line2}`);
      }
      doc.text(`         ${addr.city}, ${addr.state} ${addr.postalCode}`);
    }
  }

  /**
   * Render pay period information
   */
  private renderPayPeriodInfo(doc: InstanceType<typeof PDFDocument>, data: PayStubPDFData): void {
    const startDate = this.formatDate(data.payPeriodStartDate);
    const endDate = this.formatDate(data.payPeriodEndDate);
    const payDate = this.formatDate(data.payDate);

    doc.fontSize(10).font('Helvetica-Bold').text('Pay Period Information', { underline: true });
    doc.fontSize(9).font('Helvetica');
    doc.text(`Pay Period: ${startDate} to ${endDate}`);
    doc.text(`Pay Date: ${payDate}`);
  }

  /**
   * Render earnings section with table format
   */
  private renderEarningsSection(doc: InstanceType<typeof PDFDocument>, data: PayStubPDFData): void {
    doc.fontSize(12).font('Helvetica-Bold').text('Earnings', { underline: true });
    doc.moveDown(0.5);

    // Table header
    doc.fontSize(9).font('Helvetica-Bold');
    const y = doc.y;
    doc.text('Description', 50, y, { width: 200, continued: false });
    doc.text('Hours', 250, y, { width: 60, align: 'right', continued: false });
    doc.text('Rate', 310, y, { width: 60, align: 'right', continued: false });
    doc.text('Amount', 370, y, { width: 80, align: 'right', continued: false });

    // Draw line under header
    doc.moveTo(50, doc.y + 2).lineTo(450, doc.y + 2).stroke();
    doc.moveDown(0.3);

    // Table rows
    doc.font('Helvetica');
    const hourlyRate = data.hourlyRate || (data.regularHours > 0 ? data.regularPay / data.regularHours : 0);

    // Regular hours
    if (data.regularHours > 0) {
      this.addEarningsRow(doc, 'Regular Pay', data.regularHours, hourlyRate, data.regularPay);
    }

    // Overtime hours
    if (data.overtimeHours > 0) {
      this.addEarningsRow(doc, 'Overtime Pay (1.5x)', data.overtimeHours, hourlyRate * 1.5, data.overtimePay);
    }

    // Double time hours
    if (data.doubleTimeHours > 0) {
      this.addEarningsRow(doc, 'Double Time Pay (2x)', data.doubleTimeHours, hourlyRate * 2.0, data.doubleTimePay);
    }

    // PTO hours
    if (data.ptoHours > 0) {
      this.addEarningsRow(doc, 'PTO', data.ptoHours, hourlyRate, data.ptoPay);
    }

    // Holiday hours
    if (data.holidayHours > 0) {
      this.addEarningsRow(doc, 'Holiday Pay', data.holidayHours, hourlyRate, data.holidayPay);
    }

    // Sick hours
    if (data.sickHours > 0) {
      this.addEarningsRow(doc, 'Sick Pay', data.sickHours, hourlyRate, data.sickPay);
    }

    // Additional earnings
    if (data.bonuses > 0) {
      this.addEarningsRow(doc, 'Bonuses', 0, 0, data.bonuses);
    }

    if (data.commissions > 0) {
      this.addEarningsRow(doc, 'Commissions', 0, 0, data.commissions);
    }

    if (data.reimbursements > 0) {
      this.addEarningsRow(doc, 'Reimbursements', 0, 0, data.reimbursements);
    }

    if (data.retroactivePay > 0) {
      this.addEarningsRow(doc, 'Retroactive Pay', 0, 0, data.retroactivePay);
    }

    if (data.otherEarnings > 0) {
      this.addEarningsRow(doc, 'Other Earnings', 0, 0, data.otherEarnings);
    }

    // Draw line before total
    doc.moveDown(0.2);
    doc.moveTo(250, doc.y).lineTo(450, doc.y).stroke();
    doc.moveDown(0.3);

    // Total earnings
    doc.font('Helvetica-Bold');
    const totalY = doc.y;
    doc.text('Total Gross Pay:', 250, totalY, { width: 120, align: 'left' });
    doc.text(this.formatCurrency(data.currentGrossPay), 370, totalY, { width: 80, align: 'right' });
  }

  /**
   * Add a single earnings row to the table
   */
  private addEarningsRow(
    doc: InstanceType<typeof PDFDocument>,
    description: string,
    hours: number,
    rate: number,
    amount: number
  ): void {
    const y = doc.y;
    doc.text(description, 50, y, { width: 200, continued: false });
    if (hours > 0) {
      doc.text(hours.toFixed(2), 250, y, { width: 60, align: 'right', continued: false });
      doc.text(this.formatCurrency(rate), 310, y, { width: 60, align: 'right', continued: false });
    }
    doc.text(this.formatCurrency(amount), 370, y, { width: 80, align: 'right', continued: false });
    doc.moveDown(0.5);
  }

  /**
   * Render deductions section
   */
  private renderDeductionsSection(doc: InstanceType<typeof PDFDocument>, data: PayStubPDFData): void {
    doc.fontSize(12).font('Helvetica-Bold').text('Deductions', { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(9).font('Helvetica');

    // Tax withholdings
    doc.font('Helvetica-Bold').text('Tax Withholdings:');
    doc.font('Helvetica');
    this.addDeductionRow(doc, 'Federal Income Tax', data.federalIncomeTax);
    this.addDeductionRow(doc, 'State Income Tax', data.stateIncomeTax);
    if (data.localIncomeTax > 0) {
      this.addDeductionRow(doc, 'Local Income Tax', data.localIncomeTax);
    }
    this.addDeductionRow(doc, 'Social Security (FICA)', data.socialSecurityTax);
    this.addDeductionRow(doc, 'Medicare', data.medicareTax);
    if (data.additionalMedicareTax > 0) {
      this.addDeductionRow(doc, 'Additional Medicare Tax', data.additionalMedicareTax);
    }

    doc.moveDown(0.3);

    // Other deductions
    if (data.totalOtherDeductions > 0) {
      doc.font('Helvetica-Bold').text('Other Deductions:');
      doc.font('Helvetica');

      if (data.healthInsurance > 0) {
        this.addDeductionRow(doc, 'Health Insurance', data.healthInsurance);
      }
      if (data.dentalInsurance > 0) {
        this.addDeductionRow(doc, 'Dental Insurance', data.dentalInsurance);
      }
      if (data.visionInsurance > 0) {
        this.addDeductionRow(doc, 'Vision Insurance', data.visionInsurance);
      }
      if (data.lifeInsurance > 0) {
        this.addDeductionRow(doc, 'Life Insurance', data.lifeInsurance);
      }
      if (data.retirement401k > 0) {
        this.addDeductionRow(doc, '401(k) Contribution', data.retirement401k);
      }
      if (data.retirementRoth > 0) {
        this.addDeductionRow(doc, 'Roth IRA Contribution', data.retirementRoth);
      }
      if (data.fsaHealthcare > 0) {
        this.addDeductionRow(doc, 'FSA Healthcare', data.fsaHealthcare);
      }
      if (data.fsaDependentCare > 0) {
        this.addDeductionRow(doc, 'FSA Dependent Care', data.fsaDependentCare);
      }
      if (data.hsa > 0) {
        this.addDeductionRow(doc, 'HSA Contribution', data.hsa);
      }
      if (data.garnishments > 0) {
        this.addDeductionRow(doc, 'Garnishments', data.garnishments);
      }
      if (data.unionDues > 0) {
        this.addDeductionRow(doc, 'Union Dues', data.unionDues);
      }
      if (data.otherDeductions > 0) {
        this.addDeductionRow(doc, 'Other Deductions', data.otherDeductions);
      }
    }

    // Draw line before totals
    doc.moveDown(0.2);
    doc.moveTo(250, doc.y).lineTo(450, doc.y).stroke();
    doc.moveDown(0.3);

    // Total deductions
    doc.font('Helvetica-Bold');
    const totalTaxY = doc.y;
    doc.text('Total Tax Withheld:', 250, totalTaxY, { width: 120, align: 'left' });
    doc.text(this.formatCurrency(data.totalTaxWithheld), 370, totalTaxY, { width: 80, align: 'right' });
    doc.moveDown(0.5);

    const totalDeductionsY = doc.y;
    doc.text('Total Other Deductions:', 250, totalDeductionsY, { width: 120, align: 'left' });
    doc.text(this.formatCurrency(data.totalOtherDeductions), 370, totalDeductionsY, { width: 80, align: 'right' });
    doc.moveDown(0.5);

    const totalAllY = doc.y;
    doc.text('Total Deductions:', 250, totalAllY, { width: 120, align: 'left' });
    doc.text(
      this.formatCurrency(data.totalTaxWithheld + data.totalOtherDeductions),
      370,
      totalAllY,
      { width: 80, align: 'right' }
    );
  }

  /**
   * Add a single deduction row
   */
  private addDeductionRow(doc: InstanceType<typeof PDFDocument>, label: string, amount: number): void {
    const y = doc.y;
    doc.text(`  ${label}:`, 250, y, { width: 120, align: 'left', continued: false });
    doc.text(this.formatCurrency(amount), 370, y, { width: 80, align: 'right', continued: false });
    doc.moveDown(0.5);
  }

  /**
   * Render net pay section
   */
  private renderNetPay(doc: InstanceType<typeof PDFDocument>, data: PayStubPDFData): void {
    // Draw line
    doc.moveTo(50, doc.y).lineTo(450, doc.y).stroke();
    doc.moveDown(0.5);

    // Net pay
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('NET PAY:', 250, doc.y, { width: 120, align: 'left', continued: false });
    doc
      .text(this.formatCurrency(data.currentNetPay), 370, doc.y - 14, {
        width: 80,
        align: 'right',
        continued: false,
      });

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(450, doc.y).stroke();
  }

  /**
   * Render year-to-date totals
   */
  private renderYTDTotals(doc: InstanceType<typeof PDFDocument>, data: PayStubPDFData): void {
    doc.fontSize(12).font('Helvetica-Bold').text('Year-to-Date Totals', { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(9).font('Helvetica');
    const y = doc.y;

    doc.text('Total Hours:', 50, y, { width: 150, continued: false });
    doc.text(data.ytdHours.toFixed(2), 200, y, { width: 80, align: 'right', continued: false });
    doc.moveDown(0.5);

    const grossY = doc.y;
    doc.text('Gross Pay:', 50, grossY, { width: 150, continued: false });
    doc.text(this.formatCurrency(data.ytdGrossPay), 200, grossY, { width: 80, align: 'right', continued: false });
    doc.moveDown(0.5);

    const fedY = doc.y;
    doc.text('Federal Tax:', 50, fedY, { width: 150, continued: false });
    doc.text(this.formatCurrency(data.ytdFederalTax), 200, fedY, { width: 80, align: 'right', continued: false });
    doc.moveDown(0.5);

    const stateY = doc.y;
    doc.text('State Tax:', 50, stateY, { width: 150, continued: false });
    doc.text(this.formatCurrency(data.ytdStateTax), 200, stateY, { width: 80, align: 'right', continued: false });
    doc.moveDown(0.5);

    const ssY = doc.y;
    doc.text('Social Security:', 50, ssY, { width: 150, continued: false });
    doc.text(this.formatCurrency(data.ytdSocialSecurity), 200, ssY, { width: 80, align: 'right', continued: false });
    doc.moveDown(0.5);

    const medicareY = doc.y;
    doc.text('Medicare:', 50, medicareY, { width: 150, continued: false });
    doc.text(this.formatCurrency(data.ytdMedicare), 200, medicareY, { width: 80, align: 'right', continued: false });
    doc.moveDown(0.5);

    const deductionsY = doc.y;
    doc.text('Total Deductions:', 50, deductionsY, { width: 150, continued: false });
    doc.text(this.formatCurrency(data.ytdDeductions), 200, deductionsY, { width: 80, align: 'right', continued: false });
    doc.moveDown(0.5);

    const netY = doc.y;
    doc.font('Helvetica-Bold');
    doc.text('Net Pay:', 50, netY, { width: 150, continued: false });
    doc.text(this.formatCurrency(data.ytdNetPay), 200, netY, { width: 80, align: 'right', continued: false });
  }

  /**
   * Render payment method information
   */
  private renderPaymentMethod(doc: InstanceType<typeof PDFDocument>, data: PayStubPDFData): void {
    doc.fontSize(10).font('Helvetica-Bold').text('Payment Method', { underline: true });
    doc.fontSize(9).font('Helvetica');

    const methodText = this.getPaymentMethodText(data.paymentMethod);
    doc.text(methodText);

    if (data.paymentMethod === 'DIRECT_DEPOSIT' && data.bankAccountLast4) {
      doc.text(`Account ending in: ****${data.bankAccountLast4}`);
    } else if (data.paymentMethod === 'CHECK' && data.checkNumber) {
      doc.text(`Check Number: ${data.checkNumber}`);
      if (data.checkDate) {
        doc.text(`Check Date: ${this.formatDate(data.checkDate)}`);
      }
    }
  }

  /**
   * Render footer
   */
  private renderFooter(doc: InstanceType<typeof PDFDocument>): void {
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 70;

    doc
      .fontSize(8)
      .font('Helvetica')
      .text(
        'This is an official earnings statement. Please retain for your records.',
        50,
        footerY,
        { align: 'center', width: 500 }
      );

    doc.text(
      `Generated on ${this.formatDate(new Date())}`,
      50,
      footerY + 15,
      { align: 'center', width: 500 }
    );
  }

  /**
   * Format date as MM/DD/YYYY
   */
  private formatDate(date: Date): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  }

  /**
   * Format currency
   */
  private formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  /**
   * Get payment method display text
   */
  private getPaymentMethodText(method: string): string {
    const methods: Record<string, string> = {
      DIRECT_DEPOSIT: 'Direct Deposit',
      CHECK: 'Paper Check',
      CASH: 'Cash',
      PAYCARD: 'Payroll Debit Card',
      WIRE: 'Wire Transfer',
      VENMO: 'Venmo',
      ZELLE: 'Zelle',
    };
    return methods[method] || method;
  }
}
