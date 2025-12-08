/**
 * Analytics & Reporting Vertical
 *
 * Provides comprehensive analytics, reporting, and data visualization
 * for operational metrics, compliance monitoring, and performance tracking.
 */

// Type exports
export type {
  DateRange,
  VisitMetrics,
  EVVComplianceMetrics,
  RevenueMetrics,
  StaffingMetrics,
  ClientMetrics,
  OperationalKPIs,
  ComplianceAlertType,
  AlertSeverity,
  ComplianceAlert,
  CaregiverPerformance,
  RevenueTrendDataPoint,
  EVVSubmissionStatus,
  VisitException,
  DashboardStats,
  AgingBucket,
  RevenueByPayer,
  ReportType,
  ExportFormat,
  Report,
  EVVComplianceReport,
  ProductivityReport,
  RevenueCycleReport,
  AnalyticsQueryOptions,
  PerformanceBenchmark,
} from './types/analytics';

// Service exports
export { AnalyticsService } from './service/analytics-service';
export { ReportService } from './service/report-service';
export { ExportService } from './service/export-service';

// Natural Language Query (AI-powered)
export {
  NaturalLanguageQueryService,
  type NaturalLanguageQueryRequest,
  type QueryResult,
  type QueryInterpretation,
  type QueryCategory,
} from './service/natural-language-query-service';

// Repository exports
export { AnalyticsRepository } from './repository/analytics-repository';
