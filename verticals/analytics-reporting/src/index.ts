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
  // Margin Analysis types
  ServiceType,
  ServiceMarginMetrics,
  MarginTrendDataPoint,
  PayerMarginBreakdown,
  ServiceMarginAnalysis,
  MarginAnalysisQueryOptions,
  // Payer Margin Analysis types
  PayerType,
  PayerMarginMetrics,
  PayerTrendDataPoint,
  PayerContractInfo,
  PayerComparison,
  PayerOptimizationOpportunity,
  PayerMarginAnalysis,
  PayerMarginAnalysisQueryOptions,
  // Conversion Rate Tracking types
  ReferralSource,
  InquiryStatus,
  DeclineReason,
  Inquiry,
  ConversionStageMetrics,
  ConversionBySource,
  ConversionTrendDataPoint,
  CoordinatorConversionMetrics,
  LostOpportunityAnalysis,
  ConversionFunnelSummary,
  ConversionRateAnalysis,
  ConversionRateQueryOptions,
  // Budget vs. Actual types
  BudgetCategory,
  BudgetPeriod,
  VarianceStatus,
  BudgetLineItem,
  BudgetCategorySummary,
  BudgetTrendDataPoint,
  BudgetForecast,
  VarianceExplanation,
  BudgetVsActualAnalysis,
  BudgetDefinition,
  BudgetVsActualQueryOptions,
  // Growth Opportunity Analysis types
  GrowthOpportunityType,
  MarketAttractiveness,
  CompetitivePosition,
  GeographicOpportunity,
  ServiceLineOpportunity,
  PayerDiversificationOpportunity,
  PartnershipOpportunity,
  GrowthOpportunitySummary,
  GrowthOpportunityAnalysis,
  GrowthOpportunityQueryOptions,
  // Investor/Board Reporting types
  ReportPeriodType,
  FinancialPerformanceSummary,
  OperationalMetricsSummary,
  QualityComplianceMetrics,
  MarketPositionMetrics,
  RiskAssessment,
  BoardKPI,
  StrategicInitiative,
  ExecutiveSummaryHighlights,
  PeriodComparison,
  InvestorBoardReport,
  InvestorBoardReportQueryOptions,
  // Strategic Planning types
  GoalCategory,
  GoalStatus,
  GoalPriority,
  PlanningHorizon,
  KeyResult,
  StrategicGoal,
  ActionItem,
  Milestone,
  PlanningScenario,
  ResourceAllocation,
  GoalProgressReport,
  StrategicPlanSummary,
  StrategicPlanningAnalysis,
  StrategicPlanningQueryOptions,
  // Benchmark Comparison types
  BenchmarkCategory,
  BenchmarkSource,
  BenchmarkStatus,
  BenchmarkMetric,
  BenchmarkCategorySummary,
  PeerGroup,
  BenchmarkTrend,
  BenchmarkGap,
  BenchmarkComparisonSummary,
  BenchmarkComparisonAnalysis,
  BenchmarkComparisonQueryOptions,
  // Competitor Analysis types
  CompetitorType,
  CompetitorSize,
  ThreatLevel,
  MarketPosition,
  CompetitorProfile,
  MarketShareData,
  MarketShareAnalysis,
  CompetitivePositioning,
  ServiceComparison,
  PricingIntelligence,
  SWOTAnalysis,
  CompetitiveIntelligenceSummary,
  CompetitorAnalysis,
  CompetitorAnalysisQueryOptions,
} from './types/analytics';

// Service exports
export { AnalyticsService } from './service/analytics-service';
export { ReportService } from './service/report-service';
export { ExportService } from './service/export-service';
export { StaffCostAnalysisService } from './service/staff-cost-analysis-service';
export { MarginAnalysisService } from './service/margin-analysis-service';
export { PayerMarginAnalysisService } from './service/payer-margin-analysis-service';
export { ConversionTrackingService } from './service/conversion-tracking-service';
export { BudgetVsActualService } from './service/budget-vs-actual-service';
export { GrowthOpportunityService } from './service/growth-opportunity-service';
export { InvestorBoardReportingService } from './service/investor-board-reporting-service';
export { StrategicPlanningService } from './service/strategic-planning-service';
export { BenchmarkComparisonService } from './service/benchmark-comparison-service';
export { CompetitorAnalysisService } from './service/competitor-analysis-service';

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
