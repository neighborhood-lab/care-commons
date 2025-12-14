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
