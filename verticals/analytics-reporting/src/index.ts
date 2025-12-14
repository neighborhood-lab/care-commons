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
  // Staff Cost Analysis types
  StaffCategory,
  StaffCostByCategory,
  LaborCostMetrics,
  StaffCostTrendDataPoint,
  StaffCostAnalysis,
  StaffCostQueryOptions,
} from './types/analytics';

// Service exports
export { AnalyticsService } from './service/analytics-service';
export { ReportService } from './service/report-service';
export { ExportService } from './service/export-service';
export { StaffCostAnalysisService } from './service/staff-cost-analysis-service';

// Natural Language Query (AI-powered)
export {
  NaturalLanguageQueryService,
  type NaturalLanguageQueryRequest,
  type QueryResult,
  type QueryInterpretation,
  type QueryCategory,
} from './service/natural-language-query-service';

// Predictive Maintenance (AI-powered)
export {
  PredictiveMaintenanceService,
  type PredictiveMaintenanceRequest,
  type PredictiveMaintenanceResult,
  type PredictiveAlert,
  type AlertCategory,
  type AlertSeverity as PredictiveAlertSeverity,
  type AlertUrgency,
} from './service/predictive-maintenance-service';

// Quality Improvement (AI-powered)
export {
  QualityImprovementService,
  type QualityImprovementRequest,
  type QualityImprovementResult,
  type ImprovementInitiative,
  type QualityDomain,
  type ImprovementPriority,
  type ImprovementEffort,
  type ImprovementStatus,
  type QualityMetric,
} from './service/quality-improvement-service';

// Repository exports
export { AnalyticsRepository } from './repository/analytics-repository';

// Churn Prediction (AI-powered)
export { ChurnPredictionService } from './service/churn-prediction-service.js';
export type {
  ChurnPredictionRequest,
  ChurnPredictionResult,
  ClientChurnPrediction,
  CaregiverChurnPrediction,
  ChurnRiskLevel,
  ChurnConfidence,
  RiskFactor,
} from './service/churn-prediction-service.js';
