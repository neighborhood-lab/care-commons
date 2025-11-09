/**
 * Export Service
 * Handles report exports to PDF, Excel, and CSV formats
 */

import { Report, ExportFormat } from '../types/analytics';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';

export class ExportService {
  /**
   * Export report to specified format
   */
  async exportReport(
    report: Report,
    format: ExportFormat
  ): Promise<Buffer | string> {
    switch (format) {
      case 'PDF':
        return this.exportToPDF(report);
      case 'EXCEL':
        return this.exportToExcel(report);
      case 'CSV':
        return this.exportToCSV(report);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export to PDF
   * Uses jsPDF library
   */
  async exportToPDF(report: Report): Promise<Buffer> {
    const pdf = new jsPDF();

    // Add title
    pdf.setFontSize(18);
    pdf.text(report.title, 14, 20);

    // Add metadata
    pdf.setFontSize(10);
    pdf.text(`Generated: ${report.generatedAt.toLocaleString()}`, 14, 30);
    pdf.text(
      `Period: ${report.period.startDate.toLocaleDateString()} - ${report.period.endDate.toLocaleDateString()}`,
      14,
      36
    );

    const yPosition = 46;

    // Add report-specific data based on type
    switch (report.reportType) {
      case 'EVV_COMPLIANCE':
        this.addEVVComplianceToPDF(pdf, report.data, yPosition);
        break;
      case 'PRODUCTIVITY':
        this.addProductivityToPDF(pdf, report.data, yPosition);
        break;
      case 'REVENUE_CYCLE':
        this.addRevenueCycleToPDF(pdf, report.data, yPosition);
        break;
      case 'CAREGIVER_PERFORMANCE':
        this.addCaregiverPerformanceToPDF(pdf, report.data, yPosition);
        break;
      default:
        this.addGenericDataToPDF(pdf, report.data, yPosition);
    }

    // Convert to buffer
    const pdfOutput = pdf.output('arraybuffer');
    return Buffer.from(pdfOutput);
  }

  /**
   * Add EVV Compliance data to PDF
   */
  private addEVVComplianceToPDF(
    pdf: jsPDF,
    data: Record<string, unknown>,
    startY: number
  ): number {
    // Summary metrics
    autoTable(pdf, {
      startY,
      head: [['Metric', 'Value']],
      body: [
        ['State', data.state as string],
        ['Total Visits', (data.totalVisits as number).toString()],
        ['Compliant Visits', (data.compliantVisits as number).toString()],
        ['Compliance Rate', `${((data.complianceRate as number) * 100).toFixed(2)}%`],
      ],
      theme: 'grid',
    });

    let currentY = (pdf as any).lastAutoTable.finalY + 10;

    // Flagged visits table
    if (Array.isArray(data.flaggedVisits) && data.flaggedVisits.length > 0) {
      autoTable(pdf, {
        startY: currentY,
        head: [['Visit ID', 'Client', 'Caregiver', 'Date', 'Flags', 'Status']],
        body: data.flaggedVisits.map((visit: any) => [
          visit.visitId,
          visit.clientName,
          visit.caregiverName,
          new Date(visit.serviceDate).toLocaleDateString(),
          visit.complianceFlags.join(', '),
          visit.resolutionStatus,
        ]),
        theme: 'striped',
      });
      currentY = (pdf as any).lastAutoTable.finalY;
    }

    return currentY;
  }

  /**
   * Add Productivity data to PDF
   */
  private addProductivityToPDF(
    pdf: jsPDF,
    data: Record<string, unknown>,
    startY: number
  ): number {
    const caregivers = data.caregivers as any[];

    autoTable(pdf, {
      startY,
      head: [['Caregiver', 'Visits', 'Avg Duration', 'On-Time %', 'EVV %', 'Score']],
      body: caregivers.map((cg) => [
        cg.caregiverName,
        cg.visitsCompleted.toString(),
        `${cg.averageVisitDuration.toFixed(0)} min`,
        `${(cg.onTimePercentage * 100).toFixed(1)}%`,
        `${(cg.evvComplianceRate * 100).toFixed(1)}%`,
        cg.performanceScore.toFixed(1),
      ]),
      theme: 'striped',
    });

    let currentY = (pdf as any).lastAutoTable.finalY + 10;

    // Summary
    const summary = data.summary as any;
    autoTable(pdf, {
      startY: currentY,
      head: [['Summary Metric', 'Value']],
      body: [
        ['Total Hours', summary.totalHours.toFixed(2)],
        ['Average Utilization', `${(summary.averageUtilization * 100).toFixed(1)}%`],
      ],
      theme: 'grid',
    });

    return (pdf as any).lastAutoTable.finalY;
  }

  /**
   * Add Revenue Cycle data to PDF
   */
  private addRevenueCycleToPDF(
    pdf: jsPDF,
    data: Record<string, unknown>,
    startY: number
  ): number {
    // Summary metrics
    autoTable(pdf, {
      startY,
      head: [['Metric', 'Value']],
      body: [
        ['Total Billed', `$${(data.billed as number).toFixed(2)}`],
        ['Total Paid', `$${(data.paid as number).toFixed(2)}`],
        ['Outstanding A/R', `$${(data.outstanding as number).toFixed(2)}`],
        ['Denial Rate', `${((data.denialRate as number) * 100).toFixed(2)}%`],
      ],
      theme: 'grid',
    });

    let currentY = (pdf as any).lastAutoTable.finalY + 10;

    // Aging buckets
    if (Array.isArray(data.aging) && data.aging.length > 0) {
      autoTable(pdf, {
        startY: currentY,
        head: [['Aging Range', 'Count', 'Amount']],
        body: data.aging.map((bucket: any) => [
          bucket.range,
          bucket.count.toString(),
          `$${bucket.amount.toFixed(2)}`,
        ]),
        theme: 'striped',
      });
      currentY = (pdf as any).lastAutoTable.finalY + 10;
    }

    // By payer
    if (Array.isArray(data.byPayer) && data.byPayer.length > 0) {
      autoTable(pdf, {
        startY: currentY,
        head: [['Payer', 'Visits', 'Billed', 'Paid', 'Outstanding']],
        body: data.byPayer.map((payer: any) => [
          payer.payerName,
          payer.visitCount.toString(),
          `$${payer.billedAmount.toFixed(2)}`,
          `$${payer.paidAmount.toFixed(2)}`,
          `$${payer.outstandingAmount.toFixed(2)}`,
        ]),
        theme: 'striped',
      });
      currentY = (pdf as any).lastAutoTable.finalY;
    }

    return currentY;
  }

  /**
   * Add Caregiver Performance data to PDF
   */
  private addCaregiverPerformanceToPDF(
    pdf: jsPDF,
    data: Record<string, unknown>,
    startY: number
  ): number {
    autoTable(pdf, {
      startY,
      head: [['Metric', 'Value']],
      body: [
        ['Caregiver Name', data.caregiverName as string],
        ['Visits Completed', (data.visitsCompleted as number).toString()],
        ['Avg Visit Duration', `${(data.averageVisitDuration as number).toFixed(0)} min`],
        ['On-Time Percentage', `${((data.onTimePercentage as number) * 100).toFixed(1)}%`],
        ['EVV Compliance Rate', `${((data.evvComplianceRate as number) * 100).toFixed(1)}%`],
        ['No-Show Rate', `${((data.noShowRate as number) * 100).toFixed(1)}%`],
        ['Geofence Violations', (data.geofenceViolations as number).toString()],
        ['Overtime Hours', (data.overtimeHours as number).toFixed(2)],
        ['Performance Score', (data.performanceScore as number).toFixed(1)],
      ],
      theme: 'grid',
    });

    return (pdf as any).lastAutoTable.finalY;
  }

  /**
   * Add generic data to PDF
   */
  private addGenericDataToPDF(
    pdf: jsPDF,
    data: Record<string, unknown>,
    startY: number
  ): number {
    const rows = Object.entries(data).map(([key, value]) => [
      key,
      typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value),
    ]);

    autoTable(pdf, {
      startY,
      head: [['Key', 'Value']],
      body: rows,
      theme: 'grid',
    });

    return (pdf as any).lastAutoTable.finalY;
  }

  /**
   * Export to Excel
   * Uses exceljs library
   */
  async exportToExcel(report: Report): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(report.title);

    // Set worksheet properties
    worksheet.properties.defaultRowHeight = 20;

    // Add header
    worksheet.addRow(['Report Title', report.title]);
    worksheet.addRow(['Generated', report.generatedAt.toLocaleString()]);
    worksheet.addRow([
      'Period',
      `${report.period.startDate.toLocaleDateString()} - ${report.period.endDate.toLocaleDateString()}`,
    ]);
    worksheet.addRow([]); // Empty row

    // Style header rows
    worksheet.getRow(1).font = { bold: true, size: 14 };
    worksheet.getRow(2).font = { bold: true };
    worksheet.getRow(3).font = { bold: true };

    // Add report-specific data
    switch (report.reportType) {
      case 'EVV_COMPLIANCE':
        this.addEVVComplianceToExcel(worksheet, report.data);
        break;
      case 'PRODUCTIVITY':
        this.addProductivityToExcel(worksheet, report.data);
        break;
      case 'REVENUE_CYCLE':
        this.addRevenueCycleToExcel(worksheet, report.data);
        break;
      case 'CAREGIVER_PERFORMANCE':
        this.addCaregiverPerformanceToExcel(worksheet, report.data);
        break;
      default:
        this.addGenericDataToExcel(worksheet, report.data);
    }

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      if (column?.eachCell !== undefined) {
        let maxLength = 10;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const cellValue = cell.value !== null && cell.value !== undefined ? cell.value.toString() : '';
          maxLength = Math.max(maxLength, cellValue.length);
        });
        column.width = Math.min(maxLength + 2, 50);
      }
    });

    // Generate buffer
    return await workbook.xlsx.writeBuffer();
  }

  /**
   * Add EVV Compliance data to Excel worksheet
   */
  private addEVVComplianceToExcel(
    worksheet: ExcelJS.Worksheet,
    data: Record<string, unknown>
  ): void {
    // Summary metrics
    worksheet.addRow(['Metric', 'Value']).font = { bold: true };
    worksheet.addRow(['State', data.state]);
    worksheet.addRow(['Total Visits', data.totalVisits]);
    worksheet.addRow(['Compliant Visits', data.compliantVisits]);
    worksheet.addRow([
      'Compliance Rate',
      `${((data.complianceRate as number) * 100).toFixed(2)}%`,
    ]);
    worksheet.addRow([]); // Empty row

    // Flagged visits
    if (Array.isArray(data.flaggedVisits) && data.flaggedVisits.length > 0) {
      const headerRow = worksheet.addRow([
        'Visit ID',
        'Client Name',
        'Caregiver Name',
        'Service Date',
        'Compliance Flags',
        'Resolution Status',
      ]);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      data.flaggedVisits.forEach((visit: any) => {
        worksheet.addRow([
          visit.visitId,
          visit.clientName,
          visit.caregiverName,
          new Date(visit.serviceDate).toLocaleDateString(),
          visit.complianceFlags.join(', '),
          visit.resolutionStatus,
        ]);
      });
    }
  }

  /**
   * Add Productivity data to Excel worksheet
   */
  private addProductivityToExcel(
    worksheet: ExcelJS.Worksheet,
    data: Record<string, unknown>
  ): void {
    const caregivers = data.caregivers as any[];

    // Caregiver performance table
    const headerRow = worksheet.addRow([
      'Caregiver Name',
      'Visits Completed',
      'Avg Visit Duration (min)',
      'On-Time %',
      'EVV Compliance %',
      'Performance Score',
    ]);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    caregivers.forEach((cg) => {
      worksheet.addRow([
        cg.caregiverName,
        cg.visitsCompleted,
        cg.averageVisitDuration.toFixed(0),
        `${(cg.onTimePercentage * 100).toFixed(1)}%`,
        `${(cg.evvComplianceRate * 100).toFixed(1)}%`,
        cg.performanceScore.toFixed(1),
      ]);
    });

    worksheet.addRow([]); // Empty row

    // Summary
    const summary = data.summary as any;
    const summaryHeaderRow = worksheet.addRow(['Summary Metric', 'Value']);
    summaryHeaderRow.font = { bold: true };
    worksheet.addRow(['Total Hours', summary.totalHours.toFixed(2)]);
    worksheet.addRow([
      'Average Utilization',
      `${(summary.averageUtilization * 100).toFixed(1)}%`,
    ]);
  }

  /**
   * Add Revenue Cycle data to Excel worksheet
   */
  private addRevenueCycleToExcel(
    worksheet: ExcelJS.Worksheet,
    data: Record<string, unknown>
  ): void {
    // Summary metrics
    worksheet.addRow(['Metric', 'Value']).font = { bold: true };
    worksheet.addRow(['Total Billed', `$${(data.billed as number).toFixed(2)}`]);
    worksheet.addRow(['Total Paid', `$${(data.paid as number).toFixed(2)}`]);
    worksheet.addRow(['Outstanding A/R', `$${(data.outstanding as number).toFixed(2)}`]);
    worksheet.addRow([
      'Denial Rate',
      `${((data.denialRate as number) * 100).toFixed(2)}%`,
    ]);
    worksheet.addRow([]); // Empty row

    // Aging buckets
    if (Array.isArray(data.aging) && data.aging.length > 0) {
      const agingHeaderRow = worksheet.addRow(['Aging Range', 'Count', 'Amount']);
      agingHeaderRow.font = { bold: true };
      agingHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      data.aging.forEach((bucket: any) => {
        worksheet.addRow([
          bucket.range,
          bucket.count,
          `$${bucket.amount.toFixed(2)}`,
        ]);
      });
      worksheet.addRow([]); // Empty row
    }

    // By payer
    if (Array.isArray(data.byPayer) && data.byPayer.length > 0) {
      const payerHeaderRow = worksheet.addRow([
        'Payer Name',
        'Visit Count',
        'Billed Amount',
        'Paid Amount',
        'Outstanding Amount',
      ]);
      payerHeaderRow.font = { bold: true };
      payerHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      data.byPayer.forEach((payer: any) => {
        worksheet.addRow([
          payer.payerName,
          payer.visitCount,
          `$${payer.billedAmount.toFixed(2)}`,
          `$${payer.paidAmount.toFixed(2)}`,
          `$${payer.outstandingAmount.toFixed(2)}`,
        ]);
      });
    }
  }

  /**
   * Add Caregiver Performance data to Excel worksheet
   */
  private addCaregiverPerformanceToExcel(
    worksheet: ExcelJS.Worksheet,
    data: Record<string, unknown>
  ): void {
    worksheet.addRow(['Metric', 'Value']).font = { bold: true };
    worksheet.addRow(['Caregiver Name', data.caregiverName]);
    worksheet.addRow(['Visits Completed', data.visitsCompleted]);
    worksheet.addRow([
      'Avg Visit Duration',
      `${(data.averageVisitDuration as number).toFixed(0)} min`,
    ]);
    worksheet.addRow([
      'On-Time Percentage',
      `${((data.onTimePercentage as number) * 100).toFixed(1)}%`,
    ]);
    worksheet.addRow([
      'EVV Compliance Rate',
      `${((data.evvComplianceRate as number) * 100).toFixed(1)}%`,
    ]);
    worksheet.addRow([
      'No-Show Rate',
      `${((data.noShowRate as number) * 100).toFixed(1)}%`,
    ]);
    worksheet.addRow(['Geofence Violations', data.geofenceViolations]);
    worksheet.addRow(['Overtime Hours', (data.overtimeHours as number).toFixed(2)]);
    worksheet.addRow(['Performance Score', (data.performanceScore as number).toFixed(1)]);
  }

  /**
   * Add generic data to Excel worksheet
   */
  private addGenericDataToExcel(
    worksheet: ExcelJS.Worksheet,
    data: Record<string, unknown>
  ): void {
    const headerRow = worksheet.addRow(['Key', 'Value']);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    Object.entries(data).forEach(([key, value]) => {
      worksheet.addRow([
        key,
        typeof value === 'object' && value !== null ? JSON.stringify(value) : value,
      ]);
    });
  }

  /**
   * Export to CSV
   */
  async exportToCSV(report: Report): Promise<string> {
    const rows: string[] = [];

    // Add report header
    rows.push(`"Report Title","${report.title}"`);
    rows.push(`"Generated","${report.generatedAt.toISOString()}"`);
    rows.push(
      `"Period","${report.period.startDate.toLocaleDateString()} - ${report.period.endDate.toLocaleDateString()}"`
    );
    rows.push(''); // Empty row

    // Add report-specific data based on type
    switch (report.reportType) {
      case 'EVV_COMPLIANCE':
        rows.push(...this.generateEVVComplianceCSV(report.data));
        break;
      case 'PRODUCTIVITY':
        rows.push(...this.generateProductivityCSV(report.data));
        break;
      case 'REVENUE_CYCLE':
        rows.push(...this.generateRevenueCycleCSV(report.data));
        break;
      default:
        rows.push(...this.generateGenericCSV(report.data));
    }

    return rows.join('\n');
  }

  /**
   * Generate CSV rows for EVV Compliance Report
   */
  private generateEVVComplianceCSV(data: Record<string, unknown>): string[] {
    const rows: string[] = [];

    rows.push('"Metric","Value"');
    rows.push(`"State","${data.state}"`);
    rows.push(`"Total Visits","${data.totalVisits}"`);
    rows.push(`"Compliant Visits","${data.compliantVisits}"`);
    rows.push(
      `"Compliance Rate","${((data.complianceRate as number) * 100).toFixed(2)}%"`
    );
    rows.push('');

    // Flagged visits table
    if (Array.isArray(data.flaggedVisits) && data.flaggedVisits.length > 0) {
      rows.push('"Flagged Visits"');
      rows.push(
        '"Visit ID","Client Name","Caregiver Name","Service Date","Compliance Flags","Resolution Status"'
      );

      data.flaggedVisits.forEach((visit: any) => {
        rows.push(
          `"${visit.visitId}","${visit.clientName}","${visit.caregiverName}","${new Date(visit.serviceDate).toLocaleDateString()}","${visit.complianceFlags.join(', ')}","${visit.resolutionStatus}"`
        );
      });
    }

    return rows;
  }

  /**
   * Generate CSV rows for Productivity Report
   */
  private generateProductivityCSV(data: Record<string, unknown>): string[] {
    const rows: string[] = [];
    const caregivers = data.caregivers as any[];

    rows.push(
      '"Caregiver Name","Visits Completed","Avg Visit Duration (min)","On-Time %","EVV Compliance %","Performance Score"'
    );

    caregivers.forEach((cg) => {
      rows.push(
        `"${cg.caregiverName}","${cg.visitsCompleted}","${cg.averageVisitDuration.toFixed(0)}","${(cg.onTimePercentage * 100).toFixed(1)}%","${(cg.evvComplianceRate * 100).toFixed(1)}%","${cg.performanceScore.toFixed(1)}"`
      );
    });

    rows.push('');
    rows.push('"Summary"');
    const summary = data.summary as any;
    rows.push(`"Total Hours","${summary.totalHours.toFixed(2)}"`);
    rows.push(
      `"Average Utilization","${(summary.averageUtilization * 100).toFixed(1)}%"`
    );

    return rows;
  }

  /**
   * Generate CSV rows for Revenue Cycle Report
   */
  private generateRevenueCycleCSV(data: Record<string, unknown>): string[] {
    const rows: string[] = [];

    rows.push('"Metric","Value"');
    rows.push(`"Total Billed","$${(data.billed as number).toFixed(2)}"`);
    rows.push(`"Total Paid","$${(data.paid as number).toFixed(2)}"`);
    rows.push(`"Outstanding A/R","$${(data.outstanding as number).toFixed(2)}"`);
    rows.push(
      `"Denial Rate","${((data.denialRate as number) * 100).toFixed(2)}%"`
    );
    rows.push('');

    // Aging buckets
    if (Array.isArray(data.aging) && data.aging.length > 0) {
      rows.push('"Aging Analysis"');
      rows.push('"Range","Count","Amount"');

      data.aging.forEach((bucket: any) => {
        rows.push(
          `"${bucket.range}","${bucket.count}","$${bucket.amount.toFixed(2)}"`
        );
      });
      rows.push('');
    }

    // By payer
    if (Array.isArray(data.byPayer) && data.byPayer.length > 0) {
      rows.push('"Revenue by Payer"');
      rows.push(
        '"Payer Name","Visit Count","Billed Amount","Paid Amount","Outstanding Amount"'
      );

      data.byPayer.forEach((payer: any) => {
        rows.push(
          `"${payer.payerName}","${payer.visitCount}","$${payer.billedAmount.toFixed(2)}","$${payer.paidAmount.toFixed(2)}","$${payer.outstandingAmount.toFixed(2)}"`
        );
      });
    }

    return rows;
  }

  /**
   * Generate generic CSV for unknown report types
   */
  private generateGenericCSV(data: Record<string, unknown>): string[] {
    const rows: string[] = [];
    rows.push('"Key","Value"');

    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        rows.push(`"${key}","${JSON.stringify(value)}"`);
      } else {
        rows.push(`"${key}","${value}"`);
      }
    });

    return rows;
  }

  /**
   * Get MIME type for export format
   */
  getMimeType(format: ExportFormat): string {
    switch (format) {
      case 'PDF':
        return 'application/pdf';
      case 'EXCEL':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'CSV':
        return 'text/csv';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Get file extension for export format
   */
  getFileExtension(format: ExportFormat): string {
    switch (format) {
      case 'PDF':
        return 'pdf';
      case 'EXCEL':
        return 'xlsx';
      case 'CSV':
        return 'csv';
      default:
        return 'bin';
    }
  }

  /**
   * Generate download filename
   */
  generateFilename(report: Report, format: ExportFormat): string {
    const timestamp = report.generatedAt.toISOString().split('T')[0];
    const reportName = report.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    return `${reportName}-${timestamp}.${this.getFileExtension(format)}`;
  }
}
