/**
 * Caregiver Burnout Prediction - Type Definitions
 *
 * Defines types for predicting and tracking caregiver burnout risk based on
 * behavioral patterns, workload, and performance indicators.
 *
 * This is worker-first AI - designed to help coordinators proactively support
 * caregivers before burnout leads to turnover.
 */

/**
 * Burnout risk level categories
 */
export type BurnoutRiskLevel =
  | 'HEALTHY'      // 0-40: No concerning indicators
  | 'AT_RISK'      // 40-70: Monitor closely, early intervention
  | 'HIGH_RISK'    // 70-90: Immediate action needed
  | 'CRITICAL';    // 90-100: Urgent intervention to prevent turnover

/**
 * Burnout risk trend direction
 */
export type BurnoutTrend =
  | 'IMPROVING'    // Risk decreasing
  | 'STABLE'       // No significant change
  | 'DECLINING';   // Risk increasing

/**
 * Time period for burnout analysis
 */
export type AnalysisPeriod =
  | 'LAST_2_WEEKS'
  | 'LAST_4_WEEKS'
  | 'LAST_8_WEEKS'
  | 'LAST_12_WEEKS';

/**
 * Raw data points that indicate potential burnout
 * Collected over a rolling time window (typically 4 weeks)
 */
export interface BurnoutIndicators {
  // Workload metrics
  avgHoursPerWeek: number;           // Average hours worked per week
  weeksExceedingMax: number;         // Count of weeks exceeding max_hours_per_week
  consecutiveDaysWorked: number;     // Longest streak of consecutive days
  totalVisitsAssigned: number;       // Total visits assigned in period

  // Reliability decline signals
  noShowRate: number;                // % of assigned visits not completed (no-show)
  cancellationRate: number;          // % of visits cancelled by caregiver
  lateClockInRate: number;           // % of visits clocked in late (>10min)

  // EVV compliance issues (stress signals)
  geofenceViolationCount: number;    // Left service location during visit
  manualOverrideCount: number;       // Supervisor had to fix EVV records
  missedClockOutCount: number;       // Incomplete EVV records
  lateSubmissionRate: number;        // % of EVV records submitted after deadline

  // Performance degradation
  performanceTrendPercentage: number;  // % change from prior period
  complianceTrendPercentage: number;   // % change in compliance rate

  // External factors
  credentialsExpiringCount: number;    // Certifications expiring soon
  trainingOverdueCount: number;        // Required trainings past due
  currentPerformanceRating: number;    // Manager rating (1-5)
}

/**
 * Calculated burnout risk for a caregiver
 */
export interface CaregiverBurnoutRisk {
  // Identity
  caregiverId: string;
  caregiverName: string;
  organizationId: string;

  // Risk assessment
  riskScore: number;                  // 0-100
  riskLevel: BurnoutRiskLevel;
  trend: BurnoutTrend;

  // Supporting data
  indicators: BurnoutIndicators;
  contributingFactors: BurnoutFactor[];  // Sorted by impact

  // Metadata
  calculatedAt: Date;
  analysisPeriod: AnalysisPeriod;
  priorRiskScore: number | null;      // Previous period score for trending
}

/**
 * Individual factor contributing to burnout risk
 */
export interface BurnoutFactor {
  factor: string;                     // e.g., "Excessive hours"
  impact: number;                     // Points contributed to risk score
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;                // Human-readable explanation
  recommendation: string;             // Suggested intervention
}

/**
 * Burnout alert for coordinator dashboard
 */
export interface BurnoutAlert {
  alertId: string;
  caregiverId: string;
  caregiverName: string;
  riskScore: number;
  riskLevel: BurnoutRiskLevel;
  severity: 'WARNING' | 'HIGH' | 'CRITICAL';  // Maps to alert severity
  message: string;
  recommendations: string[];
  createdAt: Date;
  acknowledgedAt: Date | null;
  acknowledgedBy: string | null;
}

/**
 * Historical snapshot of burnout risk for trending
 */
export interface BurnoutSnapshot {
  snapshotId: string;
  caregiverId: string;
  organizationId: string;
  snapshotDate: Date;
  riskScore: number;
  riskLevel: BurnoutRiskLevel;
  indicators: BurnoutIndicators;
}

/**
 * Burnout report for organization-level analysis
 */
export interface OrganizationBurnoutReport {
  organizationId: string;
  reportDate: Date;
  analysisPeriod: AnalysisPeriod;

  // Summary stats
  totalCaregivers: number;
  healthyCount: number;
  atRiskCount: number;
  highRiskCount: number;
  criticalCount: number;

  // Caregiver breakdown
  caregivers: CaregiverBurnoutRisk[];

  // Trends
  avgRiskScore: number;
  trendDirection: BurnoutTrend;
  percentageChange: number;  // vs prior period
}

/**
 * Configuration for burnout risk calculation algorithm
 */
export interface BurnoutCalculationConfig {
  // Workload weights
  workloadWeight: number;           // Default: 20%
  reliabilityWeight: number;        // Default: 30%
  complianceWeight: number;         // Default: 20%
  performanceWeight: number;        // Default: 20%
  externalWeight: number;           // Default: 10%

  // Thresholds
  lateClockInThreshold: number;     // Minutes late (default: 10)
  excessiveHoursMultiplier: number; // Multiple of max_hours (default: 1.1 = 110%)

  // Risk level boundaries
  atRiskThreshold: number;          // Default: 40
  highRiskThreshold: number;        // Default: 70
  criticalRiskThreshold: number;    // Default: 90
}

/**
 * Date range for analysis queries
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Request to calculate burnout risk
 */
export interface CalculateBurnoutRiskRequest {
  caregiverId: string;
  analysisPeriod?: AnalysisPeriod;
  config?: Partial<BurnoutCalculationConfig>;
}

/**
 * Request to generate organization-wide burnout report
 */
export interface GenerateBurnoutReportRequest {
  organizationId: string;
  analysisPeriod?: AnalysisPeriod;
  includeHealthy?: boolean;  // Default: false (only at-risk and above)
}
