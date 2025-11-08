/**
 * Analytics & Reporting Types
 * Real-time operational metrics and compliance monitoring
 */

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Visit Metrics
 */
export interface VisitMetrics {
  scheduled: number;
  completed: number;
  missed: number;
  inProgress: number;
  completionRate: number;
}

/**
 * EVV Compliance Metrics
 */
export interface EVVComplianceMetrics {
  compliantVisits: number;
  totalVisits: number;
  complianceRate: number;
  flaggedVisits: number;
  pendingReview: number;
}

/**
 * Revenue Metrics
 */
export interface RevenueMetrics {
  billableHours: number;
  billedAmount: number;
  paidAmount: number;
  outstandingAR: number;
  averageReimbursementRate: number;
}

/**
 * Staffing Metrics
 */
export interface StaffingMetrics {
  activeCaregivers: number;
  utilizationRate: number;
  overtimeHours: number;
  credentialExpirations: number;
}

/**
 * Client Metrics
 */
export interface ClientMetrics {
  activeClients: number;
  newClients: number;
  dischargedClients: number;
  highRiskClients: number;
  overdueAssessments: number;
}

/**
 * Operational KPIs
 */
export interface OperationalKPIs {
  visits: VisitMetrics;
  evvCompliance: EVVComplianceMetrics;
  revenueMetrics: RevenueMetrics;
  staffing: StaffingMetrics;
  clientMetrics: ClientMetrics;
}

/**
 * Compliance Alert Types
 */
export type ComplianceAlertType =
  | 'CREDENTIAL_EXPIRING'
  | 'AUTHORIZATION_EXPIRING'
  | 'SUPERVISORY_VISIT_OVERDUE'
  | 'EVV_SUBMISSION_DELAYED'
  | 'CARE_PLAN_EXPIRING'
  | 'ASSESSMENT_OVERDUE'
  | 'TRAINING_EXPIRING'
  | 'BACKGROUND_CHECK_EXPIRING';

/**
 * Alert Severity Levels
 */
export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING' | 'INFO';

/**
 * Compliance Alert
 */
export interface ComplianceAlert {
  type: ComplianceAlertType;
  severity: AlertSeverity;
  count: number;
  message: string;
  actionRequired: string;
  dueDate?: Date;
  affectedEntities?: string[];
}

/**
 * Caregiver Performance Metrics
 */
export interface CaregiverPerformance {
  caregiverId: string;
  caregiverName: string;
  visitsCompleted: number;
  averageVisitDuration: number; // minutes
  onTimePercentage: number;
  evvComplianceRate: number;
  clientSatisfactionScore?: number;
  noShowRate: number;
  geofenceViolations: number;
  overtimeHours: number;
  performanceScore: number; // 0-100
}

/**
 * Revenue Trend Data Point
 */
export interface RevenueTrendDataPoint {
  month: string;
  year: number;
  billed: number;
  paid: number;
  outstanding: number;
}

/**
 * EVV Aggregator Submission Status
 */
export interface EVVSubmissionStatus {
  state: string;
  aggregatorName: string;
  visitCount: number;
  status: 'SUBMITTED' | 'PENDING' | 'FAILED' | 'PARTIAL';
  submittedAt?: Date;
  dueAt?: Date;
  errorCount?: number;
}

/**
 * Visit Exception
 */
export interface VisitException {
  id: string;
  visitId: string;
  caregiverId: string;
  caregiverName: string;
  clientId: string;
  clientName: string;
  visitDate: Date;
  exceptionType: string;
  description: string;
  severity: AlertSeverity;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW';
  complianceFlags: string[];
}

/**
 * Dashboard Statistics
 */
export interface DashboardStats {
  inProgress: number;
  completedToday: number;
  upcoming: number;
  needsReview: number;
}

/**
 * Aging Bucket for A/R
 */
export interface AgingBucket {
  range: string; // e.g., "0-30", "31-60", "61-90", "90+"
  count: number;
  amount: number;
}

/**
 * Revenue by Payer
 */
export interface RevenueByPayer {
  payerId: string;
  payerName: string;
  billedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  visitCount: number;
}

/**
 * Report Types
 */
export type ReportType =
  | 'EVV_COMPLIANCE'
  | 'PRODUCTIVITY'
  | 'REVENUE_CYCLE'
  | 'CAREGIVER_PERFORMANCE'
  | 'CLIENT_SUMMARY'
  | 'AUTHORIZATION_STATUS'
  | 'CREDENTIAL_COMPLIANCE';

/**
 * Report Export Format
 */
export type ExportFormat = 'PDF' | 'EXCEL' | 'CSV';

/**
 * Base Report Interface
 */
export interface Report {
  id: string;
  reportType: ReportType;
  title: string;
  description?: string;
  organizationId: string;
  branchId?: string;
  generatedAt: Date;
  generatedBy: string;
  period: DateRange;
  exportFormats: ExportFormat[];
  data: Record<string, unknown>;
}

/**
 * EVV Compliance Report
 */
export interface EVVComplianceReport extends Report {
  reportType: 'EVV_COMPLIANCE';
  data: {
    state: string;
    totalVisits: number;
    compliantVisits: number;
    flaggedVisits: Array<{
      visitId: string;
      clientName: string;
      caregiverName: string;
      serviceDate: Date;
      complianceFlags: string[];
      resolutionStatus: string;
    }>;
    aggregatorSubmissions: EVVSubmissionStatus[];
    complianceRate: number;
  };
}

/**
 * Productivity Report
 */
export interface ProductivityReport extends Report {
  reportType: 'PRODUCTIVITY';
  data: {
    caregivers: CaregiverPerformance[];
    summary: {
      totalHours: number;
      averageUtilization: number;
      topPerformers: CaregiverPerformance[];
      needsImprovement: CaregiverPerformance[];
    };
  };
}

/**
 * Revenue Cycle Report
 */
export interface RevenueCycleReport extends Report {
  reportType: 'REVENUE_CYCLE';
  data: {
    billed: number;
    paid: number;
    outstanding: number;
    aging: AgingBucket[];
    denialRate: number;
    resubmissions: number;
    byPayer: RevenueByPayer[];
    trends: RevenueTrendDataPoint[];
  };
}

/**
 * Analytics Query Options
 */
export interface AnalyticsQueryOptions {
  organizationId: string;
  branchId?: string;
  dateRange: DateRange;
  includeSubBranches?: boolean;
}

/**
 * Performance Benchmark
 */
export interface PerformanceBenchmark {
  metric: string;
  value: number;
  target: number;
  industryAverage?: number;
  status: 'ABOVE_TARGET' | 'AT_TARGET' | 'BELOW_TARGET' | 'CRITICAL';
}

/**
 * Optimized Caregiver Performance Report (using materialized views)
 */
export interface CaregiverPerformanceReportRow {
  caregiver_id: string;
  caregiver_name: string;
  total_visits: number;
  completed_visits: number;
  missed_visits: number;
  completion_rate: number;
  total_hours: number;
  active_months: number;
  avg_compliance_score: number;
}

/**
 * Client Service Summary (using materialized views)
 */
export interface ClientServiceSummaryRow {
  week: Date;
  scheduled_visits: number;
  completed_visits: number;
  missed_visits: number;
  total_service_hours: number;
  unique_caregivers: number;
  total_billed: number;
}

export interface ClientServiceSummary {
  weeks: ClientServiceSummaryRow[];
  totals: {
    scheduled_visits: number;
    completed_visits: number;
    missed_visits: number;
    total_service_hours: number;
    unique_caregivers: number;
    total_billed: number;
  };
}

/**
 * Revenue Report Row
 */
export interface RevenueReportRow {
  period: Date;
  invoiced: number;
  collected: number;
  outstanding: number;
  payments_received: number;
  invoice_count: number;
  unique_clients: number;
  payment_count: number;
}

/**
 * EVV Compliance Report (Optimized)
 */
export interface EVVComplianceDailyRow {
  day: Date;
  total_visits: number;
  evv_submitted: number;
  compliant: number;
  non_compliant: number;
  pending: number;
  compliance_rate: number;
  rejection_reasons: string[];
}

export interface EVVComplianceReportData {
  daily: EVVComplianceDailyRow[];
  summary: {
    total_visits: number;
    evv_submitted: number;
    compliant: number;
    non_compliant: number;
    pending: number;
    overall_compliance_rate: number;
  };
}
