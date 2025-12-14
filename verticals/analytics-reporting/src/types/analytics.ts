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

// ============================================================================
// Staff Cost Analysis Types
// ============================================================================

/**
 * Staff role category for cost analysis
 */
export type StaffCategory =
  | 'CAREGIVER'
  | 'COORDINATOR'
  | 'ADMINISTRATOR'
  | 'NURSING'
  | 'THERAPIST'
  | 'OTHER';

/**
 * Cost breakdown by category
 */
export interface StaffCostByCategory {
  category: StaffCategory;
  headcount: number;
  totalWages: number;
  overtimeWages: number;
  benefitsCost: number;
  totalCost: number;
  costPercentage: number; // Percentage of total labor cost
  hoursWorked: number;
  averageHourlyRate: number;
}

/**
 * Labor cost metrics
 */
export interface LaborCostMetrics {
  totalWages: number;
  totalOvertime: number;
  totalBenefits: number;
  totalLaborCost: number;
  totalRevenue: number;
  laborCostPercentage: number; // Labor cost as % of revenue
  productiveHours: number;
  nonproductiveHours: number;
  costPerBillableHour: number;
}

/**
 * Staff cost trend data point
 */
export interface StaffCostTrendDataPoint {
  period: string; // e.g., "2025-01", "2025-02"
  totalLaborCost: number;
  totalRevenue: number;
  laborCostPercentage: number;
  headcount: number;
}

/**
 * Staff cost analysis result
 */
export interface StaffCostAnalysis {
  period: DateRange;
  organizationId: string;
  branchId?: string;

  // Summary metrics
  summary: LaborCostMetrics;

  // Breakdown by staff category
  byCategory: StaffCostByCategory[];

  // Cost trends over time
  trends: StaffCostTrendDataPoint[];

  // Benchmarks
  benchmarks: {
    targetLaborCostPercentage: number;
    industryAverageLaborCostPercentage: number;
    status: 'ABOVE_TARGET' | 'AT_TARGET' | 'BELOW_TARGET' | 'CRITICAL';
  };

  // Top cost drivers
  topCostDrivers: Array<{
    driver: string;
    impact: number; // Dollar amount
    description: string;
  }>;

  // Optimization opportunities
  optimizationOpportunities: Array<{
    opportunity: string;
    potentialSavings: number;
    effort: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
  }>;
}

/**
 * Staff cost query options
 */
export interface StaffCostQueryOptions {
  organizationId: string;
  branchId?: string;
  dateRange: DateRange;
  includeSubBranches?: boolean;
  categories?: StaffCategory[];
  includeBenchmarks?: boolean;
  includeTrends?: boolean;
  trendPeriods?: number; // Number of months for trend data
}

// ============================================================================
// Margin Analysis Types
// ============================================================================

/**
 * Service type for margin analysis
 */
export type ServiceType =
  | 'PERSONAL_CARE'
  | 'HOMEMAKER'
  | 'COMPANION'
  | 'RESPITE'
  | 'SKILLED_NURSING'
  | 'PHYSICAL_THERAPY'
  | 'OCCUPATIONAL_THERAPY'
  | 'SPEECH_THERAPY'
  | 'HOSPICE'
  | 'OTHER';

/**
 * Margin metrics for a service type
 */
export interface ServiceMarginMetrics {
  serviceType: ServiceType;
  serviceName: string;

  // Volume metrics
  totalVisits: number;
  totalHours: number;
  uniqueClients: number;

  // Revenue metrics
  grossRevenue: number;
  adjustments: number;
  netRevenue: number;

  // Cost metrics
  directLaborCost: number;
  indirectCost: number;
  totalCost: number;

  // Margin calculations
  grossMargin: number;
  grossMarginPercentage: number;
  netMargin: number;
  netMarginPercentage: number;

  // Efficiency metrics
  revenuePerHour: number;
  costPerHour: number;
  marginPerHour: number;
  averageVisitDuration: number;
}

/**
 * Margin trend data point
 */
export interface MarginTrendDataPoint {
  period: string; // e.g., "2025-01"
  serviceType: ServiceType;
  grossRevenue: number;
  totalCost: number;
  grossMargin: number;
  grossMarginPercentage: number;
}

/**
 * Payer-level margin breakdown
 */
export interface PayerMarginBreakdown {
  payerId: string;
  payerName: string;
  payerType: 'MEDICARE' | 'MEDICAID' | 'PRIVATE_INSURANCE' | 'PRIVATE_PAY' | 'OTHER';
  totalRevenue: number;
  totalCost: number;
  margin: number;
  marginPercentage: number;
  visitCount: number;
  averageReimbursementRate: number;
}

/**
 * Service margin analysis result
 */
export interface ServiceMarginAnalysis {
  period: DateRange;
  organizationId: string;
  branchId?: string;

  // Summary metrics
  summary: {
    totalGrossRevenue: number;
    totalNetRevenue: number;
    totalCost: number;
    overallGrossMargin: number;
    overallGrossMarginPercentage: number;
    overallNetMargin: number;
    overallNetMarginPercentage: number;
    totalVisits: number;
    totalHours: number;
  };

  // Breakdown by service type
  byService: ServiceMarginMetrics[];

  // Breakdown by payer (optional)
  byPayer?: PayerMarginBreakdown[];

  // Trends over time (optional)
  trends?: MarginTrendDataPoint[];

  // Top performers
  topPerformingServices: Array<{
    serviceType: ServiceType;
    serviceName: string;
    marginPercentage: number;
    marginContribution: number; // Dollar amount contributed to total margin
  }>;

  // Services needing attention
  lowMarginServices: Array<{
    serviceType: ServiceType;
    serviceName: string;
    marginPercentage: number;
    potentialIssue: string;
    recommendation: string;
  }>;

  // Benchmarks
  benchmarks: {
    targetGrossMarginPercentage: number;
    industryAverageGrossMarginPercentage: number;
    status: 'ABOVE_TARGET' | 'AT_TARGET' | 'BELOW_TARGET' | 'CRITICAL';
  };
}

/**
 * Margin analysis query options
 */
export interface MarginAnalysisQueryOptions {
  organizationId: string;
  branchId?: string;
  dateRange: DateRange;
  serviceTypes?: ServiceType[];
  includePayerBreakdown?: boolean;
  includeTrends?: boolean;
  trendPeriods?: number;
}

// ============================================================================
// Payer Margin Analysis Types
// ============================================================================

/**
 * Payer type classification
 */
export type PayerType =
  | 'MEDICARE'
  | 'MEDICAID'
  | 'PRIVATE_INSURANCE'
  | 'PRIVATE_PAY'
  | 'VA'
  | 'WORKERS_COMP'
  | 'MANAGED_CARE'
  | 'OTHER';

/**
 * Detailed payer margin metrics
 */
export interface PayerMarginMetrics {
  payerId: string;
  payerName: string;
  payerType: PayerType;

  // Volume metrics
  totalVisits: number;
  totalHours: number;
  uniqueClients: number;

  // Revenue metrics
  grossCharges: number;
  contractualAdjustments: number;
  billedAmount: number;
  paidAmount: number;
  writeOffs: number;
  patientResponsibility: number;
  outstandingAR: number;

  // Collection metrics
  collectionRate: number; // Paid / Billed
  daysInAR: number;
  cleanClaimRate: number;

  // Denial metrics
  denialCount: number;
  denialAmount: number;
  denialRate: number;
  appealRate: number;
  appealSuccessRate: number;
  resubmissionCount: number;

  // Cost metrics
  directLaborCost: number;
  indirectCost: number;
  billingAdminCost: number;
  totalCost: number;

  // Margin calculations
  grossMargin: number;
  grossMarginPercentage: number;
  netMargin: number;
  netMarginPercentage: number;

  // Efficiency metrics
  revenuePerHour: number;
  costPerHour: number;
  marginPerHour: number;
  averageReimbursementRate: number;
  reimbursementVariance: number; // Variance from contracted rate
}

/**
 * Payer trend data point
 */
export interface PayerTrendDataPoint {
  period: string; // e.g., "2025-01"
  payerId: string;
  payerName: string;
  billedAmount: number;
  paidAmount: number;
  margin: number;
  marginPercentage: number;
  collectionRate: number;
  denialRate: number;
}

/**
 * Payer contract details
 */
export interface PayerContractInfo {
  payerId: string;
  payerName: string;
  contractStartDate?: string;
  contractEndDate?: string;
  isRenegotiationDue: boolean;
  daysTillExpiration?: number;
  rateSchedule?: Record<string, number>; // Service code -> rate
  lastRateIncrease?: string;
  rateIncreasePercentage?: number;
}

/**
 * Payer comparison metrics
 */
export interface PayerComparison {
  payerId: string;
  payerName: string;
  payerType: PayerType;
  marginPercentage: number;
  collectionRate: number;
  denialRate: number;
  daysInAR: number;
  volumePercentage: number; // % of total visits
  revenuePercentage: number; // % of total revenue
  performanceScore: number; // 0-100 composite score
  rank: number;
}

/**
 * Payer optimization opportunity
 */
export interface PayerOptimizationOpportunity {
  payerId: string;
  payerName: string;
  opportunity: string;
  category: 'RATE_INCREASE' | 'DENIAL_REDUCTION' | 'COLLECTION_IMPROVEMENT' | 'VOLUME_GROWTH' | 'CONTRACT_RENEGOTIATION';
  potentialImpact: number; // Dollar amount
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  priority: number; // 1-10
  description: string;
  actionItems: string[];
}

/**
 * Payer margin analysis result
 */
export interface PayerMarginAnalysis {
  period: DateRange;
  organizationId: string;
  branchId?: string;

  // Summary metrics
  summary: {
    totalBilledAmount: number;
    totalPaidAmount: number;
    totalOutstandingAR: number;
    overallCollectionRate: number;
    overallMargin: number;
    overallMarginPercentage: number;
    averageDaysInAR: number;
    overallDenialRate: number;
    totalPayerCount: number;
    totalVisits: number;
    totalHours: number;
  };

  // Breakdown by payer
  byPayer: PayerMarginMetrics[];

  // Payer rankings and comparison
  payerRankings: PayerComparison[];

  // Trends over time (optional)
  trends?: PayerTrendDataPoint[];

  // Contract information (optional)
  contracts?: PayerContractInfo[];

  // Top performers
  topPerformingPayers: Array<{
    payerId: string;
    payerName: string;
    marginPercentage: number;
    reason: string;
  }>;

  // Payers needing attention
  underperformingPayers: Array<{
    payerId: string;
    payerName: string;
    marginPercentage: number;
    primaryIssue: string;
    recommendation: string;
  }>;

  // Optimization opportunities
  optimizationOpportunities: PayerOptimizationOpportunity[];

  // Benchmarks
  benchmarks: {
    targetCollectionRate: number;
    industryAverageCollectionRate: number;
    targetDenialRate: number;
    industryAverageDenialRate: number;
    targetDaysInAR: number;
    industryAverageDaysInAR: number;
    status: 'ABOVE_TARGET' | 'AT_TARGET' | 'BELOW_TARGET' | 'CRITICAL';
  };
}

/**
 * Payer margin analysis query options
 */
export interface PayerMarginAnalysisQueryOptions {
  organizationId: string;
  branchId?: string;
  dateRange: DateRange;
  payerIds?: string[];
  payerTypes?: PayerType[];
  includeTrends?: boolean;
  includeContracts?: boolean;
  trendPeriods?: number;
  minVisitThreshold?: number; // Minimum visits to include payer
}

// ============================================================================
// Conversion Rate Tracking Types
// ============================================================================

/**
 * Inquiry/referral source types
 */
export type ReferralSource =
  | 'HOSPITAL_DISCHARGE'
  | 'PHYSICIAN_REFERRAL'
  | 'SKILLED_NURSING_FACILITY'
  | 'INSURANCE_COMPANY'
  | 'FAMILY_SELF_REFERRAL'
  | 'COMMUNITY_ORGANIZATION'
  | 'WEBSITE'
  | 'MARKETING_CAMPAIGN'
  | 'WORD_OF_MOUTH'
  | 'OTHER';

/**
 * Inquiry status in the pipeline
 */
export type InquiryStatus =
  | 'NEW_INQUIRY'
  | 'CONTACTED'
  | 'ASSESSMENT_SCHEDULED'
  | 'ASSESSMENT_COMPLETED'
  | 'AUTHORIZATION_PENDING'
  | 'READY_FOR_SERVICE'
  | 'ADMITTED'
  | 'DECLINED'
  | 'LOST_TO_COMPETITOR'
  | 'NOT_QUALIFIED'
  | 'NO_RESPONSE';

/**
 * Decline reason categories
 */
export type DeclineReason =
  | 'COST_CONCERNS'
  | 'CHOSE_COMPETITOR'
  | 'NO_LONGER_NEEDED'
  | 'NOT_ELIGIBLE'
  | 'NO_COVERAGE'
  | 'LOCATION_NOT_SERVED'
  | 'SERVICES_NOT_AVAILABLE'
  | 'TIMING_ISSUES'
  | 'FAMILY_DECISION'
  | 'OTHER';

/**
 * Individual inquiry/lead record
 */
export interface Inquiry {
  id: string;
  organizationId: string;
  branchId?: string;

  // Client/prospect info
  prospectName: string;
  prospectPhone?: string;
  prospectEmail?: string;

  // Referral info
  referralSource: ReferralSource;
  referralSourceName?: string; // e.g., specific hospital name
  referralDate: string;

  // Pipeline status
  status: InquiryStatus;
  statusDate: string;

  // Service needs
  servicesRequested: string[];
  estimatedHoursPerWeek?: number;
  payerType?: PayerType;

  // Outcome
  admittedDate?: string;
  declineReason?: DeclineReason;
  declineNotes?: string;

  // Timing metrics
  daysToContact?: number;
  daysToAssessment?: number;
  daysToAdmission?: number;

  // Assigned staff
  assignedCoordinatorId?: string;
  assignedCoordinatorName?: string;

  createdAt: string;
  updatedAt: string;
}

/**
 * Conversion rate metrics by stage
 */
export interface ConversionStageMetrics {
  stage: InquiryStatus;
  stageName: string;
  count: number;
  conversionRate: number; // % that move to next stage
  avgDaysInStage: number;
  dropOffCount: number;
  dropOffRate: number;
}

/**
 * Conversion metrics by referral source
 */
export interface ConversionBySource {
  source: ReferralSource;
  sourceName: string;
  totalInquiries: number;
  admissions: number;
  conversionRate: number;
  avgDaysToAdmission: number;
  avgRevenuePerAdmission: number;
  declineCount: number;
  topDeclineReason?: DeclineReason;
}

/**
 * Conversion trend data point
 */
export interface ConversionTrendDataPoint {
  period: string; // e.g., "2025-01"
  totalInquiries: number;
  admissions: number;
  conversionRate: number;
  avgDaysToAdmission: number;
  topSource: ReferralSource;
}

/**
 * Coordinator performance in conversions
 */
export interface CoordinatorConversionMetrics {
  coordinatorId: string;
  coordinatorName: string;
  assignedInquiries: number;
  admissions: number;
  conversionRate: number;
  avgDaysToAdmission: number;
  avgResponseTime: number; // Hours to first contact
  inquiriesInProgress: number;
}

/**
 * Lost opportunity analysis
 */
export interface LostOpportunityAnalysis {
  reason: DeclineReason;
  reasonName: string;
  count: number;
  percentage: number;
  estimatedRevenueLost: number;
  preventable: boolean;
  recommendations: string[];
}

/**
 * Conversion funnel summary
 */
export interface ConversionFunnelSummary {
  totalInquiries: number;
  contacted: number;
  assessmentsScheduled: number;
  assessmentsCompleted: number;
  authorizationsPending: number;
  readyForService: number;
  admitted: number;
  declined: number;
  lostToCompetitor: number;
  notQualified: number;
  noResponse: number;
  overallConversionRate: number;
  avgDaysToAdmission: number;
}

/**
 * Conversion rate analysis result
 */
export interface ConversionRateAnalysis {
  period: DateRange;
  organizationId: string;
  branchId?: string;

  // Summary funnel
  funnel: ConversionFunnelSummary;

  // Stage-by-stage conversion
  byStage: ConversionStageMetrics[];

  // Conversion by referral source
  bySource: ConversionBySource[];

  // Coordinator performance
  byCoordinator: CoordinatorConversionMetrics[];

  // Lost opportunity analysis
  lostOpportunities: LostOpportunityAnalysis[];

  // Trends over time (optional)
  trends?: ConversionTrendDataPoint[];

  // Top performers
  topPerformingSources: Array<{
    source: ReferralSource;
    sourceName: string;
    conversionRate: number;
    reason: string;
  }>;

  // Areas needing improvement
  improvementAreas: Array<{
    area: string;
    currentMetric: number;
    targetMetric: number;
    impact: string;
    recommendation: string;
  }>;

  // Benchmarks
  benchmarks: {
    targetConversionRate: number;
    industryAverageConversionRate: number;
    targetDaysToAdmission: number;
    industryAverageDaysToAdmission: number;
    status: 'ABOVE_TARGET' | 'AT_TARGET' | 'BELOW_TARGET' | 'CRITICAL';
  };
}

/**
 * Conversion rate analysis query options
 */
export interface ConversionRateQueryOptions {
  organizationId: string;
  branchId?: string;
  dateRange: DateRange;
  referralSources?: ReferralSource[];
  coordinatorIds?: string[];
  includeTrends?: boolean;
  trendPeriods?: number;
  includeCoordinatorMetrics?: boolean;
}

// ============================================================================
// Budget vs. Actual Reporting Types
// ============================================================================

/**
 * Budget category types
 */
export type BudgetCategory =
  | 'REVENUE'
  | 'LABOR_COST'
  | 'BENEFITS'
  | 'SUPPLIES'
  | 'EQUIPMENT'
  | 'MARKETING'
  | 'ADMINISTRATIVE'
  | 'FACILITIES'
  | 'PROFESSIONAL_SERVICES'
  | 'TRAINING'
  | 'TECHNOLOGY'
  | 'OTHER';

/**
 * Budget period granularity
 */
export type BudgetPeriod = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';

/**
 * Variance status classification
 */
export type VarianceStatus =
  | 'FAVORABLE'      // Actual is better than budget
  | 'ON_TARGET'      // Within acceptable variance
  | 'UNFAVORABLE'    // Actual is worse than budget
  | 'CRITICAL';      // Significantly worse than budget

/**
 * Individual budget line item
 */
export interface BudgetLineItem {
  id: string;
  category: BudgetCategory;
  categoryName: string;
  subcategory?: string;
  description?: string;

  // Budget figures
  budgetAmount: number;
  annualBudget: number;
  ytdBudget: number;

  // Actual figures
  actualAmount: number;
  ytdActual: number;

  // Variance calculations
  variance: number; // Actual - Budget (positive = over budget for costs)
  variancePercentage: number;
  varianceStatus: VarianceStatus;

  // Prior period comparison
  priorPeriodActual?: number;
  priorPeriodVariance?: number;
}

/**
 * Budget vs actual by category summary
 */
export interface BudgetCategorySummary {
  category: BudgetCategory;
  categoryName: string;
  budget: number;
  actual: number;
  variance: number;
  variancePercentage: number;
  varianceStatus: VarianceStatus;
  lineItems: BudgetLineItem[];
  percentOfTotalBudget: number;
  percentOfTotalActual: number;
}

/**
 * Monthly budget trend data point
 */
export interface BudgetTrendDataPoint {
  period: string; // e.g., "2025-01"
  month: number;
  year: number;
  budget: number;
  actual: number;
  variance: number;
  variancePercentage: number;
  cumulativeBudget: number;
  cumulativeActual: number;
  cumulativeVariance: number;
}

/**
 * Budget forecast
 */
export interface BudgetForecast {
  remainingPeriods: number;
  projectedYearEndActual: number;
  projectedYearEndVariance: number;
  projectedYearEndVariancePercentage: number;
  runRate: number; // Current monthly run rate
  requiredRunRate: number; // Required to meet budget
  forecastStatus: VarianceStatus;
  assumptions: string[];
}

/**
 * Variance explanation/note
 */
export interface VarianceExplanation {
  category: BudgetCategory;
  varianceAmount: number;
  explanation: string;
  isRecurring: boolean;
  actionRequired: boolean;
  recommendedAction?: string;
}

/**
 * Budget vs actual analysis result
 */
export interface BudgetVsActualAnalysis {
  period: DateRange;
  budgetPeriod: BudgetPeriod;
  organizationId: string;
  branchId?: string;
  fiscalYear: number;
  periodNumber: number; // Month or quarter number

  // Summary totals
  summary: {
    totalBudget: number;
    totalActual: number;
    totalVariance: number;
    totalVariancePercentage: number;
    varianceStatus: VarianceStatus;

    // Revenue
    revenueBudget: number;
    revenueActual: number;
    revenueVariance: number;
    revenueVariancePercentage: number;

    // Expenses
    expenseBudget: number;
    expenseActual: number;
    expenseVariance: number;
    expenseVariancePercentage: number;

    // Net income
    netIncomeBudget: number;
    netIncomeActual: number;
    netIncomeVariance: number;
    netIncomeVariancePercentage: number;

    // YTD figures
    ytdBudget: number;
    ytdActual: number;
    ytdVariance: number;
    ytdVariancePercentage: number;
  };

  // Breakdown by category
  byCategory: BudgetCategorySummary[];

  // Monthly trends
  monthlyTrends: BudgetTrendDataPoint[];

  // Forecast
  forecast: BudgetForecast;

  // Significant variances
  significantVariances: Array<{
    category: BudgetCategory;
    categoryName: string;
    variance: number;
    variancePercentage: number;
    impact: string;
    trend: 'IMPROVING' | 'STABLE' | 'WORSENING';
  }>;

  // Variance explanations
  varianceExplanations: VarianceExplanation[];

  // Action items
  actionItems: Array<{
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    category: BudgetCategory;
    action: string;
    potentialImpact: number;
    deadline?: string;
  }>;

  // Benchmarks
  benchmarks: {
    expenseToRevenueRatio: number;
    targetExpenseToRevenueRatio: number;
    laborCostPercentage: number;
    targetLaborCostPercentage: number;
    status: VarianceStatus;
  };
}

/**
 * Budget definition for planning
 */
export interface BudgetDefinition {
  id: string;
  organizationId: string;
  branchId?: string;
  fiscalYear: number;
  budgetPeriod: BudgetPeriod;
  status: 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'CLOSED';
  approvedBy?: string;
  approvedAt?: string;
  lineItems: Array<{
    category: BudgetCategory;
    subcategory?: string;
    monthlyAmounts: number[]; // 12 months
    annualTotal: number;
    notes?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Budget vs actual query options
 */
export interface BudgetVsActualQueryOptions {
  organizationId: string;
  branchId?: string;
  fiscalYear: number;
  period: BudgetPeriod;
  periodNumber?: number; // Specific month or quarter
  includeForecasts?: boolean;
  includeExplanations?: boolean;
  compareTopriorYear?: boolean;
  categories?: BudgetCategory[];
}

// ============================================================================
// Growth Opportunity Analysis Types
// ============================================================================

/**
 * Growth opportunity category
 */
export type GrowthOpportunityType =
  | 'GEOGRAPHIC_EXPANSION'
  | 'SERVICE_LINE_EXPANSION'
  | 'PAYER_DIVERSIFICATION'
  | 'CLIENT_SEGMENT_GROWTH'
  | 'PARTNERSHIP_OPPORTUNITY'
  | 'MARKET_PENETRATION';

/**
 * Market attractiveness level
 */
export type MarketAttractiveness = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Competitive position
 */
export type CompetitivePosition = 'LEADER' | 'CHALLENGER' | 'FOLLOWER' | 'NICHE';

/**
 * Geographic area analysis
 */
export interface GeographicOpportunity {
  areaId: string;
  areaName: string;
  areaType: 'ZIP_CODE' | 'CITY' | 'COUNTY' | 'STATE' | 'REGION';

  // Demographics
  totalPopulation: number;
  elderlyPopulation: number; // 65+
  elderlyPercentage: number;
  populationGrowthRate: number;

  // Current presence
  currentClientCount: number;
  currentCaregiverCount: number;
  marketPenetration: number; // % of potential market served

  // Market potential
  estimatedMarketSize: number;
  potentialClients: number;
  untappedRevenue: number;

  // Competition
  competitorCount: number;
  competitorDensity: number; // Per 10K elderly
  marketShare: number;

  // Opportunity metrics
  attractiveness: MarketAttractiveness;
  opportunityScore: number; // 0-100
  investmentRequired: number;
  estimatedROI: number;
  timeToBreakeven: number; // Months

  // Risks
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskFactors: string[];
}

/**
 * Service line expansion opportunity
 */
export interface ServiceLineOpportunity {
  serviceType: ServiceType;
  serviceName: string;

  // Current state
  currentlyOffered: boolean;
  currentRevenue: number;
  currentClientCount: number;
  currentMarketShare: number;

  // Market opportunity
  totalAddressableMarket: number;
  demandTrend: 'GROWING' | 'STABLE' | 'DECLINING';
  demandGrowthRate: number;
  unmetDemand: number;

  // Competitive landscape
  competitorCount: number;
  averageCompetitorPrice: number;
  competitiveAdvantage?: string;

  // Investment required
  staffingNeeded: number;
  trainingCost: number;
  equipmentCost: number;
  certificationCost: number;
  totalInvestment: number;

  // Expected returns
  expectedRevenue: number;
  expectedMargin: number;
  timeToLaunch: number; // Months
  paybackPeriod: number; // Months

  // Opportunity assessment
  opportunityScore: number; // 0-100
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendation: string;
}

/**
 * Payer diversification opportunity
 */
export interface PayerDiversificationOpportunity {
  payerType: PayerType;
  payerTypeName: string;

  // Current state
  currentPayerCount: number;
  currentRevenue: number;
  revenuePercentage: number;

  // Opportunity
  targetPayerCount: number;
  potentialRevenue: number;
  averageReimbursementRate: number;
  reimbursementVsCurrentAvg: number; // Percentage difference

  // Diversification benefit
  riskReductionScore: number;
  revenueStabilityImpact: number;

  // Requirements
  credentialingTime: number; // Months
  complianceRequirements: string[];
  investmentRequired: number;

  // Assessment
  opportunityScore: number;
  recommendation: string;
}

/**
 * Partnership opportunity
 */
export interface PartnershipOpportunity {
  partnerType: 'HOSPITAL' | 'PHYSICIAN_GROUP' | 'SNF' | 'ACO' | 'HEALTH_PLAN' | 'COMMUNITY_ORG';
  partnerTypeName: string;

  // Potential
  partnerCount: number;
  referralPotential: number;
  revenueOpportunity: number;

  // Current state
  existingPartners: number;
  currentReferralVolume: number;

  // Gap analysis
  partnershipGap: number;
  untappedReferrals: number;

  // Assessment
  strategicValue: 'HIGH' | 'MEDIUM' | 'LOW';
  effortRequired: 'HIGH' | 'MEDIUM' | 'LOW';
  opportunityScore: number;
  recommendedApproach: string;
}

/**
 * Growth opportunity summary
 */
export interface GrowthOpportunitySummary {
  totalPotentialRevenue: number;
  totalInvestmentRequired: number;
  averageROI: number;
  topOpportunityType: GrowthOpportunityType;
  opportunityCount: number;
  highPriorityCount: number;
  mediumPriorityCount: number;
  lowPriorityCount: number;
}

/**
 * Growth opportunity analysis result
 */
export interface GrowthOpportunityAnalysis {
  analyzedAt: string;
  organizationId: string;
  branchId?: string;

  // Summary
  summary: GrowthOpportunitySummary;

  // Geographic opportunities
  geographicOpportunities: GeographicOpportunity[];

  // Service line opportunities
  serviceLineOpportunities: ServiceLineOpportunity[];

  // Payer diversification
  payerDiversification: PayerDiversificationOpportunity[];

  // Partnership opportunities
  partnershipOpportunities: PartnershipOpportunity[];

  // Prioritized recommendations
  recommendations: Array<{
    priority: number;
    type: GrowthOpportunityType;
    title: string;
    description: string;
    potentialRevenue: number;
    investmentRequired: number;
    timeframe: string;
    nextSteps: string[];
  }>;

  // SWOT analysis
  swotAnalysis: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };

  // Growth targets
  growthTargets: {
    currentAnnualRevenue: number;
    projectedRevenue: number;
    revenueGrowthTarget: number;
    clientGrowthTarget: number;
    marketShareTarget: number;
  };
}

/**
 * Growth opportunity query options
 */
export interface GrowthOpportunityQueryOptions {
  organizationId: string;
  branchId?: string;
  opportunityTypes?: GrowthOpportunityType[];
  includeGeographic?: boolean;
  includeServiceLine?: boolean;
  includePayerDiversification?: boolean;
  includePartnerships?: boolean;
  geographicRadius?: number; // Miles from current service area
  minimumOpportunityScore?: number;
}

// ============================================================================
// Investor/Board Reporting Types
// ============================================================================

/**
 * Report period type for board reports
 */
export type ReportPeriodType = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'YTD';

/**
 * Financial performance summary for investors
 */
export interface FinancialPerformanceSummary {
  // Revenue metrics
  totalRevenue: number;
  revenueGrowthRate: number;
  revenueVsPriorPeriod: number;
  revenueVsBudget: number;
  recurringRevenuePercentage: number;

  // Profitability metrics
  grossMargin: number;
  grossMarginPercentage: number;
  operatingMargin: number;
  operatingMarginPercentage: number;
  ebitda: number;
  ebitdaMargin: number;
  netIncome: number;
  netIncomeMargin: number;

  // Cash flow
  operatingCashFlow: number;
  freeCashFlow: number;
  cashOnHand: number;
  monthsOfRunway: number;

  // Efficiency
  revenuePerEmployee: number;
  revenuePerClient: number;
  costPerVisit: number;
  collectionRate: number;
}

/**
 * Operational metrics summary for board
 */
export interface OperationalMetricsSummary {
  // Client metrics
  totalClients: number;
  activeClients: number;
  newClientsThisPeriod: number;
  clientGrowthRate: number;
  clientChurnRate: number;
  averageClientLifetime: number;
  clientSatisfactionScore: number;

  // Caregiver metrics
  totalCaregivers: number;
  activeCaregivers: number;
  caregiverUtilizationRate: number;
  caregiverTurnoverRate: number;
  averageCaregiverTenure: number;
  caregiverSatisfactionScore: number;

  // Service delivery
  totalVisits: number;
  totalHours: number;
  visitsPerClient: number;
  hoursPerClient: number;
  scheduleAdherenceRate: number;
  visitCompletionRate: number;

  // EVV compliance
  evvComplianceRate: number;
  evvExceptionRate: number;
}

/**
 * Quality and compliance metrics
 */
export interface QualityComplianceMetrics {
  // Quality scores
  overallQualityScore: number;
  careQualityScore: number;
  serviceQualityScore: number;
  documentationQualityScore: number;

  // Compliance
  regulatoryComplianceRate: number;
  trainingComplianceRate: number;
  backgroundCheckComplianceRate: number;
  licensureComplianceRate: number;

  // Incidents
  incidentCount: number;
  incidentRate: number; // Per 1000 visits
  seriousIncidentCount: number;
  complaintsCount: number;
  complaintResolutionTime: number; // Days

  // Audits
  lastAuditDate: string;
  lastAuditScore: number;
  openDeficiencies: number;
}

/**
 * Market position and growth metrics
 */
export interface MarketPositionMetrics {
  // Market share
  estimatedMarketShare: number;
  marketShareChange: number;
  marketRank: number;
  competitorCount: number;

  // Growth potential
  totalAddressableMarket: number;
  serviceableMarket: number;
  marketGrowthRate: number;
  expansionOpportunities: number;

  // Geographic reach
  serviceAreaCount: number;
  countiesServed: number;
  statesServed: number;
  geographicCoverage: number;
}

/**
 * Risk assessment for investors
 */
export interface RiskAssessment {
  overallRiskLevel: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH';
  riskScore: number; // 0-100

  risks: Array<{
    category: 'FINANCIAL' | 'OPERATIONAL' | 'REGULATORY' | 'MARKET' | 'STRATEGIC';
    title: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    likelihood: 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'ALMOST_CERTAIN';
    impact: string;
    mitigation: string;
    status: 'IDENTIFIED' | 'MITIGATING' | 'MITIGATED' | 'ACCEPTED';
  }>;

  riskTrend: 'IMPROVING' | 'STABLE' | 'WORSENING';
}

/**
 * Key performance indicator with trend
 */
export interface BoardKPI {
  name: string;
  category: 'FINANCIAL' | 'OPERATIONAL' | 'QUALITY' | 'GROWTH';
  currentValue: number;
  priorPeriodValue: number;
  yearAgoValue: number;
  targetValue: number;
  unit: string;
  format: 'NUMBER' | 'CURRENCY' | 'PERCENTAGE' | 'RATIO';
  trend: 'UP' | 'DOWN' | 'STABLE';
  trendIsPositive: boolean;
  status: 'EXCEEDING' | 'ON_TRACK' | 'AT_RISK' | 'BELOW_TARGET';
  commentary?: string;
}

/**
 * Strategic initiative status
 */
export interface StrategicInitiative {
  id: string;
  name: string;
  description: string;
  category: 'GROWTH' | 'EFFICIENCY' | 'QUALITY' | 'TECHNOLOGY' | 'COMPLIANCE';
  owner: string;
  startDate: string;
  targetEndDate: string;
  status: 'NOT_STARTED' | 'ON_TRACK' | 'AT_RISK' | 'DELAYED' | 'COMPLETED' | 'CANCELLED';
  percentComplete: number;
  budgetAllocated: number;
  budgetSpent: number;
  keyMilestones: Array<{
    name: string;
    dueDate: string;
    status: 'PENDING' | 'COMPLETED' | 'MISSED';
  }>;
  challenges?: string;
  nextSteps: string[];
}

/**
 * Executive summary highlights
 */
export interface ExecutiveSummaryHighlights {
  periodDescription: string;
  overallPerformance: 'EXCELLENT' | 'GOOD' | 'SATISFACTORY' | 'NEEDS_IMPROVEMENT';

  topAchievements: string[];
  keyChallengess: string[];
  criticalIssues: string[];

  outlook: 'VERY_POSITIVE' | 'POSITIVE' | 'NEUTRAL' | 'CAUTIOUS' | 'CONCERNING';
  outlookCommentary: string;

  immediateActions: string[];
  boardDecisionsNeeded: string[];
}

/**
 * Comparison to prior periods
 */
export interface PeriodComparison {
  currentPeriod: {
    startDate: string;
    endDate: string;
    label: string;
  };
  priorPeriod: {
    startDate: string;
    endDate: string;
    label: string;
  };
  yearAgoPeriod: {
    startDate: string;
    endDate: string;
    label: string;
  };

  metrics: Array<{
    name: string;
    currentValue: number;
    priorPeriodValue: number;
    yearAgoValue: number;
    priorPeriodChange: number;
    yearOverYearChange: number;
    unit: string;
  }>;
}

/**
 * Investor/Board report
 */
export interface InvestorBoardReport {
  reportId: string;
  organizationId: string;
  organizationName: string;
  branchId?: string;
  branchName?: string;

  // Report metadata
  reportType: 'INVESTOR' | 'BOARD' | 'EXECUTIVE';
  periodType: ReportPeriodType;
  reportDate: string;
  periodStart: string;
  periodEnd: string;
  preparedBy: string;
  preparedAt: string;

  // Executive summary
  executiveSummary: ExecutiveSummaryHighlights;

  // Key metrics
  kpis: BoardKPI[];

  // Detailed sections
  financialPerformance: FinancialPerformanceSummary;
  operationalMetrics: OperationalMetricsSummary;
  qualityCompliance: QualityComplianceMetrics;
  marketPosition: MarketPositionMetrics;
  riskAssessment: RiskAssessment;

  // Period comparisons
  periodComparisons: PeriodComparison;

  // Strategic initiatives
  strategicInitiatives: StrategicInitiative[];

  // Forward-looking
  projections: {
    nextPeriodRevenue: number;
    nextPeriodMargin: number;
    clientGrowthProjection: number;
    keyAssumptions: string[];
  };

  // Appendix data
  appendix?: {
    detailedFinancials?: Record<string, number>;
    regionalBreakdown?: Array<{
      region: string;
      revenue: number;
      clients: number;
      caregivers: number;
    }>;
    payerMix?: Array<{
      payerType: string;
      revenue: number;
      percentage: number;
    }>;
    serviceBreakdown?: Array<{
      serviceType: string;
      revenue: number;
      visits: number;
      margin: number;
    }>;
  };
}

/**
 * Investor/Board report query options
 */
export interface InvestorBoardReportQueryOptions {
  organizationId: string;
  branchId?: string;
  reportType: 'INVESTOR' | 'BOARD' | 'EXECUTIVE';
  periodType: ReportPeriodType;
  periodEnd?: string; // Defaults to current period
  includePriorPeriodComparison?: boolean;
  includeYearOverYearComparison?: boolean;
  includeProjections?: boolean;
  includeStrategicInitiatives?: boolean;
  includeRiskAssessment?: boolean;
  includeAppendix?: boolean;
}

// ============================================================================
// Strategic Planning Types
// ============================================================================

/**
 * Strategic goal category
 */
export type GoalCategory =
  | 'REVENUE_GROWTH'
  | 'MARKET_EXPANSION'
  | 'OPERATIONAL_EXCELLENCE'
  | 'QUALITY_IMPROVEMENT'
  | 'WORKFORCE_DEVELOPMENT'
  | 'TECHNOLOGY_INNOVATION'
  | 'COMPLIANCE_REGULATORY'
  | 'FINANCIAL_HEALTH';

/**
 * Goal status
 */
export type GoalStatus = 'DRAFT' | 'ACTIVE' | 'ON_TRACK' | 'AT_RISK' | 'BEHIND' | 'COMPLETED' | 'CANCELLED';

/**
 * Goal priority
 */
export type GoalPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Time horizon for planning
 */
export type PlanningHorizon = 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM'; // <1 yr, 1-3 yr, 3-5 yr

/**
 * Key result (OKR style)
 */
export interface KeyResult {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  metricName: string;
  metricUnit: string;
  baselineValue: number;
  targetValue: number;
  currentValue: number;
  progressPercentage: number;
  startDate: string;
  targetDate: string;
  owner?: string;
  status: GoalStatus;
  updateFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  lastUpdated: string;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  notes?: string;
}

/**
 * Strategic goal definition
 */
export interface StrategicGoal {
  id: string;
  organizationId: string;
  branchId?: string;

  // Goal definition
  title: string;
  description: string;
  category: GoalCategory;
  priority: GoalPriority;
  horizon: PlanningHorizon;

  // Timeline
  startDate: string;
  targetDate: string;
  fiscalYear: number;

  // Status
  status: GoalStatus;
  overallProgress: number; // 0-100

  // Key results
  keyResults: KeyResult[];

  // Ownership
  owner: string;
  stakeholders: string[];

  // Dependencies
  dependencies?: string[]; // Other goal IDs
  blockedBy?: string[];

  // Resources
  budgetAllocated?: number;
  budgetSpent?: number;
  ftesAllocated?: number;

  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Action item for goal achievement
 */
export interface ActionItem {
  id: string;
  goalId: string;
  keyResultId?: string;
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  priority: GoalPriority;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';
  completedDate?: string;
  dependencies?: string[];
  notes?: string;
}

/**
 * Milestone for tracking progress
 */
export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  dueDate: string;
  status: 'PENDING' | 'COMPLETED' | 'MISSED' | 'RESCHEDULED';
  completedDate?: string;
  deliverables: string[];
  owner: string;
}

/**
 * Scenario for planning
 */
export interface PlanningScenario {
  id: string;
  name: string;
  description: string;
  type: 'OPTIMISTIC' | 'BASELINE' | 'CONSERVATIVE' | 'WORST_CASE';
  assumptions: string[];
  projectedRevenue: number;
  projectedCosts: number;
  projectedMargin: number;
  projectedClientGrowth: number;
  projectedCaregiverGrowth: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  probability: number; // 0-100
  keyRisks: string[];
  mitigationStrategies: string[];
}

/**
 * Resource allocation plan
 */
export interface ResourceAllocation {
  category: GoalCategory;
  budgetAmount: number;
  budgetPercentage: number;
  fteCount: number;
  ftePercentage: number;
  priorityRanking: number;
  goals: Array<{
    goalId: string;
    goalTitle: string;
    allocation: number;
  }>;
}

/**
 * Goal progress report
 */
export interface GoalProgressReport {
  goalId: string;
  goalTitle: string;
  category: GoalCategory;
  status: GoalStatus;
  overallProgress: number;
  keyResultsCompleted: number;
  keyResultsTotal: number;
  actionItemsCompleted: number;
  actionItemsTotal: number;
  milestonesCompleted: number;
  milestonesTotal: number;
  daysRemaining: number;
  onTrack: boolean;
  progressTrend: 'ACCELERATING' | 'ON_PACE' | 'SLOWING' | 'STALLED';
  riskFactors: string[];
  recentAccomplishments: string[];
  upcomingMilestones: Array<{
    title: string;
    dueDate: string;
    status: string;
  }>;
}

/**
 * Strategic plan summary
 */
export interface StrategicPlanSummary {
  organizationId: string;
  branchId?: string;
  planName: string;
  fiscalYear: number;
  planningHorizon: PlanningHorizon;
  createdAt: string;
  lastUpdated: string;

  // Summary metrics
  totalGoals: number;
  goalsOnTrack: number;
  goalsAtRisk: number;
  goalsBehind: number;
  goalsCompleted: number;
  overallProgress: number;

  // By category
  goalsByCategory: Array<{
    category: GoalCategory;
    count: number;
    progress: number;
    status: GoalStatus;
  }>;

  // Resource summary
  totalBudgetAllocated: number;
  totalBudgetSpent: number;
  budgetUtilization: number;
  totalFTEs: number;

  // Timeline
  upcomingMilestones: Milestone[];
  overdueItems: number;
}

/**
 * Strategic planning analysis result
 */
export interface StrategicPlanningAnalysis {
  generatedAt: string;
  organizationId: string;
  branchId?: string;
  fiscalYear: number;

  // Plan summary
  summary: StrategicPlanSummary;

  // Goals
  goals: StrategicGoal[];
  goalProgress: GoalProgressReport[];

  // Actions and milestones
  actionItems: ActionItem[];
  milestones: Milestone[];

  // Resource allocation
  resourceAllocation: ResourceAllocation[];

  // Scenarios
  scenarios?: PlanningScenario[];

  // Risk analysis
  riskAnalysis: {
    highRiskGoals: Array<{
      goalId: string;
      title: string;
      riskFactors: string[];
      recommendedActions: string[];
    }>;
    overallRiskLevel: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH';
  };

  // Recommendations
  recommendations: Array<{
    priority: number;
    category: string;
    recommendation: string;
    rationale: string;
    impact: string;
  }>;

  // Performance vs plan
  performanceVsPlan: {
    revenueVariance: number;
    clientGrowthVariance: number;
    marginVariance: number;
    complianceRate: number;
    qualityScore: number;
  };
}

/**
 * Strategic planning query options
 */
export interface StrategicPlanningQueryOptions {
  organizationId: string;
  branchId?: string;
  fiscalYear?: number;
  planningHorizon?: PlanningHorizon;
  categories?: GoalCategory[];
  includeCompletedGoals?: boolean;
  includeScenarios?: boolean;
  includeActionItems?: boolean;
  includeMilestones?: boolean;
}
