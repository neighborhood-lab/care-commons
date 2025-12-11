/**
 * @folkcare/scheduling-visits
 * 
 * Scheduling & Visit Management vertical
 * 
 * Provides comprehensive scheduling and visit tracking functionality:
 * - Service pattern templates for recurring care
 * - Automated schedule generation
 * - Visit lifecycle management (planned → in progress → completed)
 * - Intelligent caregiver assignment
 * - Real-time status tracking
 * - Exception handling
 * - Availability checking and conflict detection
 */

// Types
export * from './types/schedule';

// Service
export { ScheduleService } from './service/schedule-service.js';
export type { IClientAddressProvider, ICredentialComplianceProvider } from './service/schedule-service.js';

// AI Scheduling Optimization
export { ScheduleOptimizationService } from './service/schedule-optimization-service.js';
export type {
  CaregiverSuggestion,
  ScoreBreakdown,
  ConflictDetail,
  OptimizationRequest,
  GeographicCluster,
  ICaregiverProfileProvider,
  IVisitHistoryProvider,
} from './service/schedule-optimization-service.js';

// Missed Visit Alerts (EVV Compliance)
export { MissedVisitAlertService } from './service/missed-visit-alert-service.js';
export type {
  MissedVisitAlert,
  MissedVisitStats,
} from './service/missed-visit-alert-service.js';
export { createMissedVisitAlertsRoutes } from './api/missed-visit-alerts-routes.js';

// AI Services (Cloudflare Workers AI, Cohere)
export { CloudflareAIService, createCloudflareAIService } from './service/cloudflare-ai-service.js';
export type {
  TextEmbeddingResponse,
  TextGenerationResponse,
  PreferenceAnalysis,
} from './service/cloudflare-ai-service.js';

// Visit Duration Prediction (AI-powered)
export { VisitDurationPredictionService } from './service/visit-duration-prediction-service.js';
export type {
  DurationPredictionRequest,
  VisitDurationPrediction,
  DurationRange,
  DurationFactor,
  ConfidenceLevel,
} from './service/visit-duration-prediction-service.js';

// Providers
export * from './providers';

// Repository
export { ScheduleRepository } from './repository/schedule-repository';

// Validation
export { ScheduleValidator } from './validation/schedule-validator';

// Utilities
export * from './utils/schedule-utils';

// API / Integration
export { VisitProvider, createVisitProvider } from './api/visit-provider';

// Staffing Demand Prediction (AI-powered)
export { StaffingDemandPredictionService } from './service/staffing-demand-prediction-service.js';
export type {
  StaffingDemandRequest,
  StaffingDemandResult,
  WeeklyDemand,
  ServiceTypeDemand,
  StaffingGap,
  DemandConfidence,
  DemandTrend,
  UrgencyLevel,
} from './service/staffing-demand-prediction-service.js';

// Caregiver-Patient Matching (AI-powered)
export { CaregiverMatchingService } from './service/caregiver-matching-service.js';
export type {
  MatchingRequest,
  MatchingResult,
  CaregiverMatch,
  MatchScore,
  MatchConfidence,
  MatchFactor,
} from './service/caregiver-matching-service.js';

// Optimal Visit Frequency (AI-powered)
export { OptimalVisitFrequencyService } from './service/optimal-visit-frequency-service.js';
export type {
  FrequencyRecommendationRequest,
  OptimalFrequencyRecommendation,
  VisitTypeFrequency,
  RiskFactor as FrequencyRiskFactor,
  CostImpact,
} from './service/optimal-visit-frequency-service.js';
export { createOptimalVisitFrequencyRoutes } from './api/optimal-visit-frequency-routes.js';

// Overtime Alerts
export { OvertimeAlertService, STATE_OVERTIME_CONFIGS } from './service/overtime-alert-service.js';
export type {
  OvertimeAlertSeverity,
  OvertimeConfig,
  OvertimeCheckResult,
  OvertimeAlert,
} from './service/overtime-alert-service.js';
export { createOvertimeAlertsRoutes } from './api/overtime-alerts-routes.js';

// Callout Handling
export { CalloutHandlingService } from './service/callout-handling-service.js';
export type {
  CalloutReason,
  CalloutUrgencyLevel,
  Callout,
  AffectedVisit,
  ReplacementCandidate,
  CalloutHandlingResult,
  CreateCalloutInput,
} from './service/callout-handling-service.js';
export { createCalloutRoutes } from './api/callout-routes.js';

// On-Call Schedule Management
export { OnCallScheduleService } from './service/on-call-schedule-service.js';
export type {
  OnCallPeriodType,
  OnCallStatus,
  EscalationLevel,
  OnCallShift,
  OnCallRotation,
  RotationPattern,
  CreateOnCallShiftInput,
  CreateRotationInput,
  OnCallCoverageStatus,
  CoverageGap,
  EscalationResult,
} from './service/on-call-schedule-service.js';
export { createOnCallRoutes } from './api/on-call-routes.js';

// Split Shift Support
export { SplitShiftService } from './service/split-shift-service.js';
export type {
  SplitShiftPart,
  SplitShiftConfig,
  SplitShiftGroup,
  SplitShiftVisit,
  SplitShiftStatus,
  CreateSplitShiftInput,
  SplitShiftPartInput,
  SplitShiftValidation,
  SplitShiftPayrollSummary,
} from './service/split-shift-service.js';
export { createSplitShiftRoutes } from './api/split-shift-routes.js';

// Schedule Scenario Planning
export { ScheduleScenarioService } from './service/schedule-scenario-service.js';
export type {
  ScenarioStatus,
  ScenarioType,
  ScheduleScenario,
  ScenarioVisit,
  ScenarioChangeType,
  ScenarioComparison,
  CreateScenarioInput,
  ScenarioChangeInput,
  AddScenarioVisitInput,
} from './service/schedule-scenario-service.js';
export { createScenarioRoutes } from './api/scenario-routes.js';
