/**
 * Compliance Report Service
 *
 * Main service for generating state-specific compliance reports
 */

import type { Pool } from 'pg';
import type {
  GeneratedComplianceReport,
  ComplianceReportTemplate,
  GenerateReportRequest,
  ReportQueryFilters,
  ValidationResults,
  ReportDataSummary,
  ExportFormat
} from '@care-commons/core/types/compliance-reporting.js';
import { ValidationService } from './validation-service.js';
import { AuditService } from './audit-service.js';
import { ExportService } from './export-service.js';

export class ComplianceReportService {
  private validationService: ValidationService;
  private auditService: AuditService;
  private exportService: ExportService;

  constructor(private db: Pool) {
    this.validationService = new ValidationService(db);
    this.auditService = new AuditService(db);
    this.exportService = new ExportService(db);
  }

  /**
   * Generate a new compliance report
   */
  async generateReport(request: GenerateReportRequest, userId: string): Promise<GeneratedComplianceReport> {
    // Fetch the template
    const template = await this.getTemplate(request.templateId);
    if (!template) {
      throw new Error(`Template not found: ${request.templateId}`);
    }

    // Generate unique report number
    const reportNumber = await this.generateReportNumber(template.stateCode, template.reportType);

    // Fetch report data based on template type
    const reportData = await this.fetchReportData(template, request);

    // Create report record
    const report: Partial<GeneratedComplianceReport> = {
      templateId: request.templateId,
      organizationId: request.organizationId,
      branchId: request.branchId || null,
      reportTitle: this.generateReportTitle(template, request.periodStartDate, request.periodEndDate),
      reportNumber,
      stateCode: template.stateCode,
      reportType: template.reportType,
      periodStartDate: request.periodStartDate,
      periodEndDate: request.periodEndDate,
      reportingPeriod: this.formatReportingPeriod(request.periodStartDate, request.periodEndDate),
      generationMethod: 'MANUAL',
      recordCount: reportData.records.length,
      dataSummary: reportData.summary,
      filterCriteria: request.filterCriteria || {},
      status: 'DRAFT',
      validationStatus: 'PENDING',
      generatedFiles: {},
      generatedBy: userId,
      createdBy: userId,
      updatedBy: userId
    };

    // Insert report into database
    const savedReport = await this.saveReport(report);

    // Log audit event
    await this.auditService.logEvent({
      reportId: savedReport.id,
      eventType: 'REPORT_GENERATED',
      eventCategory: 'GENERATION',
      eventDescription: `Generated ${template.reportType} report for ${template.stateCode}`,
      userId,
      actorType: 'USER',
      eventData: {
        templateId: template.id,
        recordCount: reportData.records.length,
        period: { start: request.periodStartDate, end: request.periodEndDate }
      }
    });

    // Validate the report
    const validationResults = await this.validateReport(savedReport.id, reportData.records, template);
    await this.updateReportValidation(savedReport.id, validationResults);

    // Generate exports if requested
    if (request.exportFormats && request.exportFormats.length > 0) {
      for (const format of request.exportFormats) {
        await this.exportService.exportReport(savedReport.id, format, reportData.records, template);
      }
    }

    return this.getReportById(savedReport.id);
  }

  /**
   * Get template by ID
   */
  private async getTemplate(templateId: string): Promise<ComplianceReportTemplate | null> {
    const result = await this.db.query(
      `SELECT * FROM compliance_report_templates WHERE id = $1 AND is_active = true`,
      [templateId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapTemplateFromDb(result.rows[0]);
  }

  /**
   * Generate unique report number
   */
  private async generateReportNumber(stateCode: string, reportType: string): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    // Count existing reports for this month
    const result = await this.db.query(
      `SELECT COUNT(*) as count
       FROM generated_compliance_reports
       WHERE state_code = $1
       AND report_type = $2
       AND EXTRACT(YEAR FROM generated_at) = $3
       AND EXTRACT(MONTH FROM generated_at) = $4`,
      [stateCode, reportType, year, date.getMonth() + 1]
    );

    const sequence = parseInt(result.rows[0].count) + 1;
    return `${stateCode}-${reportType}-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }

  /**
   * Fetch report data based on template type
   */
  private async fetchReportData(
    template: ComplianceReportTemplate,
    request: GenerateReportRequest
  ): Promise<{ records: any[]; summary: ReportDataSummary }> {
    switch (template.reportType) {
      case 'EVV_VISIT_LOGS':
        return this.fetchEVVVisitData(template, request);
      case 'CAREGIVER_TRAINING':
        return this.fetchCaregiverTrainingData(template, request);
      case 'CLIENT_CARE_PLANS':
        return this.fetchCarePlanData(template, request);
      case 'INCIDENT_REPORTS':
        return this.fetchIncidentData(template, request);
      case 'QA_AUDITS':
        return this.fetchQAData(template, request);
      default:
        throw new Error(`Unsupported report type: ${template.reportType}`);
    }
  }

  /**
   * Fetch EVV visit log data
   */
  private async fetchEVVVisitData(
    template: ComplianceReportTemplate,
    request: GenerateReportRequest
  ): Promise<{ records: any[]; summary: ReportDataSummary }> {
    const query = `
      SELECT
        evv.id,
        evv.service_date,
        evv.check_in_time,
        evv.check_out_time,
        evv.service_code,
        evv.location_verified,
        evv.signature_captured,
        c.first_name || ' ' || c.last_name as client_name,
        c.medicaid_id,
        cg.first_name || ' ' || cg.last_name as caregiver_name,
        cg.employee_id,
        o.name as organization_name
      FROM evv_records evv
      JOIN clients c ON evv.client_id = c.id
      JOIN caregivers cg ON evv.caregiver_id = cg.id
      JOIN organizations o ON evv.organization_id = o.id
      WHERE evv.organization_id = $1
        AND evv.service_date >= $2
        AND evv.service_date <= $3
        AND evv.deleted = false
        ${request.branchId ? 'AND evv.branch_id = $4' : ''}
      ORDER BY evv.service_date DESC
    `;

    const params = [
      request.organizationId,
      request.periodStartDate,
      request.periodEndDate,
      ...(request.branchId ? [request.branchId] : [])
    ];

    const result = await this.db.query(query, params);
    const records = result.rows;

    const summary: ReportDataSummary = {
      recordCount: records.length,
      dateRange: {
        start: request.periodStartDate,
        end: request.periodEndDate
      },
      categories: {
        total_visits: records.length,
        location_verified: records.filter((r: any) => r.location_verified).length,
        signature_captured: records.filter((r: any) => r.signature_captured).length
      }
    };

    return { records, summary };
  }

  /**
   * Fetch caregiver training data
   */
  private async fetchCaregiverTrainingData(
    template: ComplianceReportTemplate,
    request: GenerateReportRequest
  ): Promise<{ records: any[]; summary: ReportDataSummary }> {
    const query = `
      SELECT
        cc.id,
        cg.first_name || ' ' || cg.last_name as caregiver_name,
        cg.employee_id,
        cc.credential_type,
        cc.certification_number,
        cc.issue_date,
        cc.expiration_date,
        cc.status,
        cc.training_hours_completed
      FROM caregiver_credentials cc
      JOIN caregivers cg ON cc.caregiver_id = cg.id
      WHERE cg.organization_id = $1
        AND cc.issue_date >= $2
        AND cc.issue_date <= $3
        AND cc.deleted = false
        ${request.branchId ? 'AND cg.branch_id = $4' : ''}
      ORDER BY cg.last_name, cg.first_name
    `;

    const params = [
      request.organizationId,
      request.periodStartDate,
      request.periodEndDate,
      ...(request.branchId ? [request.branchId] : [])
    ];

    const result = await this.db.query(query, params);
    const records = result.rows;

    const summary: ReportDataSummary = {
      recordCount: records.length,
      dateRange: {
        start: request.periodStartDate,
        end: request.periodEndDate
      },
      categories: {
        total_credentials: records.length,
        active: records.filter((r: any) => r.status === 'ACTIVE').length,
        expired: records.filter((r: any) => r.status === 'EXPIRED').length
      }
    };

    return { records, summary };
  }

  /**
   * Fetch care plan data
   */
  private async fetchCarePlanData(
    template: ComplianceReportTemplate,
    request: GenerateReportRequest
  ): Promise<{ records: any[]; summary: ReportDataSummary }> {
    const query = `
      SELECT
        cp.id,
        c.first_name || ' ' || c.last_name as client_name,
        cp.status,
        cp.start_date,
        cp.end_date,
        cp.last_reviewed_at,
        cp.review_frequency_days
      FROM care_plans cp
      JOIN clients c ON cp.client_id = c.id
      WHERE c.organization_id = $1
        AND cp.start_date <= $3
        AND (cp.end_date IS NULL OR cp.end_date >= $2)
        AND cp.deleted = false
        ${request.branchId ? 'AND c.branch_id = $4' : ''}
      ORDER BY c.last_name, c.first_name
    `;

    const params = [
      request.organizationId,
      request.periodStartDate,
      request.periodEndDate,
      ...(request.branchId ? [request.branchId] : [])
    ];

    const result = await this.db.query(query, params);
    const records = result.rows;

    const summary: ReportDataSummary = {
      recordCount: records.length,
      dateRange: {
        start: request.periodStartDate,
        end: request.periodEndDate
      },
      categories: {
        total_care_plans: records.length,
        active: records.filter((r: any) => r.status === 'ACTIVE').length,
        pending_review: records.filter((r: any) => {
          const daysSinceReview = (Date.now() - new Date(r.last_reviewed_at).getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceReview > r.review_frequency_days;
        }).length
      }
    };

    return { records, summary };
  }

  /**
   * Fetch incident data
   */
  private async fetchIncidentData(
    template: ComplianceReportTemplate,
    request: GenerateReportRequest
  ): Promise<{ records: any[]; summary: ReportDataSummary }> {
    // Placeholder - would fetch from incidents table if it exists
    const records: any[] = [];
    const summary: ReportDataSummary = {
      recordCount: 0,
      dateRange: {
        start: request.periodStartDate,
        end: request.periodEndDate
      }
    };

    return { records, summary };
  }

  /**
   * Fetch QA audit data
   */
  private async fetchQAData(
    template: ComplianceReportTemplate,
    request: GenerateReportRequest
  ): Promise<{ records: any[]; summary: ReportDataSummary }> {
    const query = `
      SELECT
        qa.id,
        qa.audit_type,
        qa.status,
        qa.scheduled_date,
        qa.completed_date,
        qa.auditor_name,
        qa.findings_count,
        qa.compliance_score
      FROM quality_assurance_audits qa
      WHERE qa.organization_id = $1
        AND qa.scheduled_date >= $2
        AND qa.scheduled_date <= $3
        AND qa.deleted = false
        ${request.branchId ? 'AND qa.branch_id = $4' : ''}
      ORDER BY qa.scheduled_date DESC
    `;

    const params = [
      request.organizationId,
      request.periodStartDate,
      request.periodEndDate,
      ...(request.branchId ? [request.branchId] : [])
    ];

    const result = await this.db.query(query, params);
    const records = result.rows;

    const summary: ReportDataSummary = {
      recordCount: records.length,
      dateRange: {
        start: request.periodStartDate,
        end: request.periodEndDate
      },
      categories: {
        total_audits: records.length,
        completed: records.filter((r: any) => r.status === 'COMPLETED').length,
        pending: records.filter((r: any) => r.status === 'SCHEDULED').length
      }
    };

    return { records, summary };
  }

  /**
   * Generate report title
   */
  private generateReportTitle(template: ComplianceReportTemplate, startDate: Date, endDate: Date): string {
    const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${template.templateName} - ${start} to ${end}`;
  }

  /**
   * Format reporting period
   */
  private formatReportingPeriod(startDate: Date, endDate: Date): string {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check if it's a full month
    if (start.getDate() === 1 && end.getMonth() === start.getMonth()) {
      return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
    }

    // Check if it's a quarter
    const quarters = [
      { months: [0, 1, 2], label: 'Q1' },
      { months: [3, 4, 5], label: 'Q2' },
      { months: [6, 7, 8], label: 'Q3' },
      { months: [9, 10, 11], label: 'Q4' }
    ];

    for (const quarter of quarters) {
      if (quarter.months.includes(start.getMonth()) && quarter.months.includes(end.getMonth())) {
        return `${start.getFullYear()}-${quarter.label}`;
      }
    }

    // Otherwise return date range
    return `${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`;
  }

  /**
   * Save report to database
   */
  private async saveReport(report: Partial<GeneratedComplianceReport>): Promise<GeneratedComplianceReport> {
    const result = await this.db.query(
      `INSERT INTO generated_compliance_reports (
        template_id, organization_id, branch_id, report_title, report_number,
        state_code, report_type, period_start_date, period_end_date, reporting_period,
        generation_method, record_count, data_summary, filter_criteria,
        status, validation_status, generated_files, generated_by, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
      [
        report.templateId,
        report.organizationId,
        report.branchId,
        report.reportTitle,
        report.reportNumber,
        report.stateCode,
        report.reportType,
        report.periodStartDate,
        report.periodEndDate,
        report.reportingPeriod,
        report.generationMethod,
        report.recordCount,
        JSON.stringify(report.dataSummary),
        JSON.stringify(report.filterCriteria),
        report.status,
        report.validationStatus,
        JSON.stringify(report.generatedFiles),
        report.generatedBy,
        report.createdBy,
        report.updatedBy
      ]
    );

    return this.mapReportFromDb(result.rows[0]);
  }

  /**
   * Validate report data
   */
  private async validateReport(
    reportId: string,
    records: any[],
    template: ComplianceReportTemplate
  ): Promise<ValidationResults> {
    return this.validationService.validateReportData(records, template);
  }

  /**
   * Update report validation results
   */
  private async updateReportValidation(reportId: string, validationResults: ValidationResults): Promise<void> {
    const validationStatus = validationResults.isValid ? 'PASSED' : (validationResults.errors.length > 0 ? 'FAILED' : 'WARNING');

    await this.db.query(
      `UPDATE generated_compliance_reports
       SET validation_status = $1, validation_results = $2, validated_at = NOW()
       WHERE id = $3`,
      [validationStatus, JSON.stringify(validationResults), reportId]
    );
  }

  /**
   * Get report by ID
   */
  async getReportById(reportId: string): Promise<GeneratedComplianceReport> {
    const result = await this.db.query(
      `SELECT * FROM generated_compliance_reports WHERE id = $1`,
      [reportId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Report not found: ${reportId}`);
    }

    return this.mapReportFromDb(result.rows[0]);
  }

  /**
   * Query reports with filters
   */
  async queryReports(filters: ReportQueryFilters): Promise<GeneratedComplianceReport[]> {
    const conditions: string[] = ['deleted = false'];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.organizationId) {
      conditions.push(`organization_id = $${paramIndex++}`);
      params.push(filters.organizationId);
    }

    if (filters.stateCode) {
      conditions.push(`state_code = $${paramIndex++}`);
      params.push(filters.stateCode);
    }

    if (filters.reportType) {
      conditions.push(`report_type = $${paramIndex++}`);
      params.push(filters.reportType);
    }

    if (filters.status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(filters.status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await this.db.query(
      `SELECT * FROM generated_compliance_reports ${whereClause} ORDER BY generated_at DESC LIMIT 100`,
      params
    );

    return result.rows.map(row => this.mapReportFromDb(row));
  }

  /**
   * Map database row to ComplianceReportTemplate
   */
  private mapTemplateFromDb(row: any): ComplianceReportTemplate {
    return {
      id: row.id,
      templateName: row.template_name,
      templateCode: row.template_code,
      description: row.description,
      stateCode: row.state_code,
      reportType: row.report_type,
      regulatoryAgency: row.regulatory_agency,
      regulationReference: row.regulation_reference,
      requiredFields: row.required_fields,
      validationRules: row.validation_rules,
      exportFormats: row.export_formats,
      templateContent: row.template_content,
      metadataSchema: row.metadata_schema,
      defaultFrequency: row.default_frequency,
      defaultDayOfMonth: row.default_day_of_month,
      defaultQuarterEndOffsetDays: row.default_quarter_end_offset_days,
      version: row.version,
      effectiveDate: row.effective_date,
      expirationDate: row.expiration_date,
      isActive: row.is_active,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by
    };
  }

  /**
   * Map database row to GeneratedComplianceReport
   */
  private mapReportFromDb(row: any): GeneratedComplianceReport {
    return {
      id: row.id,
      templateId: row.template_id,
      scheduledReportId: row.scheduled_report_id,
      organizationId: row.organization_id,
      branchId: row.branch_id,
      reportTitle: row.report_title,
      reportNumber: row.report_number,
      stateCode: row.state_code,
      reportType: row.report_type,
      periodStartDate: row.period_start_date,
      periodEndDate: row.period_end_date,
      reportingPeriod: row.reporting_period,
      generatedAt: row.generated_at,
      generatedBy: row.generated_by,
      generationMethod: row.generation_method,
      recordCount: row.record_count,
      dataSummary: row.data_summary,
      filterCriteria: row.filter_criteria,
      validationStatus: row.validation_status,
      validationResults: row.validation_results,
      validatedAt: row.validated_at,
      validatedBy: row.validated_by,
      fileStoragePath: row.file_storage_path,
      generatedFiles: row.generated_files,
      fileSizeBytes: row.file_size_bytes,
      fileHash: row.file_hash,
      status: row.status,
      statusNotes: row.status_notes,
      finalizedAt: row.finalized_at,
      finalizedBy: row.finalized_by,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      deletedAt: row.deleted_at,
      version: row.version || 1,
      deletedBy: row.deleted_by
    };
  }
}
