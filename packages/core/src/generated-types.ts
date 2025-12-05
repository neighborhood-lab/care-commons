/**
 * Database Type Definitions
 *
 * Auto-generated from database schema.
 * Do not edit manually - run 'npm run db:generate-types' to regenerate.
 *
 * Generated: 2025-12-05T18:46:53.112Z
 */

/**
 * Table: ab_test_assignments
 */
export interface AbTestAssignments {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  openShiftId: string;
  testName: string;
  testVariant: string;
  testVersion?: number;
  assignedAt?: Date | string;
  assignmentMethod: string;
  matchScore?: number;
  wasMatched?: boolean;
  wasAccepted?: boolean;
  wasCompleted?: boolean;
  responseTimeMinutes?: number;
  clientSatisfactionRating?: number;
  metadata?: Record<string, unknown>;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
}

/**
 * Input type for creating ab_test_assignments
 */
export type CreateAbTestAssignments = Omit<AbTestAssignments, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating ab_test_assignments
 */
export type UpdateAbTestAssignments = Partial<Omit<AbTestAssignments, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: ach_batches
 */
export interface AchBatches {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  batchNumber: string;
  batchDate: Date | string;
  effectiveDate: Date | string;
  companyName: string;
  companyId: string;
  companyEntryDescription: string;
  paymentIds?: Record<string, unknown>;
  transactionCount?: number;
  totalDebitAmount?: number;
  totalCreditAmount?: number;
  achFileUrl?: string;
  achFileFormat: string;
  achFileGeneratedAt?: Date | string;
  achFileHash?: string;
  status?: string;
  submittedAt?: Date | string;
  submittedBy?: string;
  originatingBankRoutingNumber: string;
  originatingBankAccountNumber: string;
  settledAt?: Date | string;
  settlementConfirmation?: string;
  hasReturns?: boolean;
  returnCount?: number;
  returns?: Record<string, unknown>;
  notes?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
}

/**
 * Input type for creating ach_batches
 */
export type CreateAchBatches = Omit<AchBatches, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating ach_batches
 */
export type UpdateAchBatches = Partial<Omit<AchBatches, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: assignment_proposals
 */
export interface AssignmentProposals {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  branchId: string;
  openShiftId: string;
  visitId: string;
  caregiverId: string;
  matchScore: number;
  matchQuality: string;
  matchReasons?: Record<string, unknown>;
  proposalStatus?: string;
  proposedBy: string;
  proposedAt?: Date | string;
  proposalMethod: string;
  sentToCaregiver?: boolean;
  sentAt?: Date | string;
  notificationMethod?: string;
  viewedByCaregiver?: boolean;
  viewedAt?: Date | string;
  respondedAt?: Date | string;
  responseMethod?: string;
  acceptedAt?: Date | string;
  acceptedBy?: string;
  rejectedAt?: Date | string;
  rejectedBy?: string;
  rejectionReason?: string;
  rejectionCategory?: string;
  expiredAt?: Date | string;
  isPreferred?: boolean;
  urgencyFlag?: boolean;
  notes?: string;
  internalNotes?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
  deletedAt?: Date | string;
  deletedBy?: string;
  /** Flag indicating this is demo/seed data */
  isDemoData?: boolean;
}

/**
 * Input type for creating assignment_proposals
 */
export type CreateAssignmentProposals = Omit<AssignmentProposals, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating assignment_proposals
 */
export type UpdateAssignmentProposals = Partial<Omit<AssignmentProposals, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: audit_checklist_responses
 */
export interface AuditChecklistResponses {
  /** Primary key (UUID) */
  id?: string;
  auditId: string;
  templateId: string;
  sectionId: string;
  itemId: string;
  response: string;
  notes?: string;
  evidenceUrls?: Record<string, unknown>;
  respondedBy: string;
  respondedByName: string;
  respondedAt: Date | string;
  findingId?: string;
  organizationId: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
}

/**
 * Input type for creating audit_checklist_responses
 */
export type CreateAuditChecklistResponses = Omit<AuditChecklistResponses, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating audit_checklist_responses
 */
export type UpdateAuditChecklistResponses = Partial<Omit<AuditChecklistResponses, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: audit_events
 */
export interface AuditEvents {
  eventId?: string;
  timestamp?: Date | string;
  userId: string;
  organizationId: string;
  eventType: string;
  resource: string;
  resourceId: string;
  action: string;
  result: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Input type for creating audit_events
 */
export type CreateAuditEvents = Omit<AuditEvents, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating audit_events
 */
export type UpdateAuditEvents = Partial<Omit<AuditEvents, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: audit_findings
 */
export interface AuditFindings {
  /** Primary key (UUID) */
  id?: string;
  auditId: string;
  findingNumber: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status?: string;
  standardReference?: string;
  regulatoryRequirement?: string;
  evidenceDescription?: string;
  evidenceUrls?: Record<string, unknown>;
  observedBy: string;
  observedByName: string;
  observedAt: Date | string;
  locationDescription?: string;
  affectedEntity?: string;
  affectedEntityId?: string;
  affectedEntityName?: string;
  potentialImpact?: string;
  actualImpact?: string;
  requiredCorrectiveAction: string;
  recommendedTimeframe?: string;
  targetResolutionDate?: Date | string;
  actualResolutionDate?: Date | string;
  resolutionDescription?: string;
  verifiedBy?: string;
  verifiedAt?: Date | string;
  requiresFollowUp?: boolean;
  followUpNotes?: string;
  organizationId: string;
  branchId?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
}

/**
 * Input type for creating audit_findings
 */
export type CreateAuditFindings = Omit<AuditFindings, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating audit_findings
 */
export type UpdateAuditFindings = Partial<Omit<AuditFindings, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: audit_revisions
 */
export interface AuditRevision {
  revisionId?: string;
  entityId: string;
  entityType: string;
  timestamp?: Date | string;
  userId: string;
  operation: string;
  changes: Record<string, unknown>;
  snapshot: Record<string, unknown>;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Input type for creating audit_revisions
 */
export type CreateAuditRevision = Omit<AuditRevision, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating audit_revisions
 */
export type UpdateAuditRevision = Partial<Omit<AuditRevision, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: audit_templates
 */
export interface AuditTemplates {
  /** Primary key (UUID) */
  id?: string;
  templateName: string;
  description: string;
  auditType: string;
  applicableScope: Record<string, unknown>;
  standardsReference?: string;
  templateVersion: string;
  effectiveDate: Date | string;
  expiryDate?: Date | string;
  checklistSections: Record<string, unknown>;
  isActive?: boolean;
  usageCount?: number;
  lastUsedAt?: Date | string;
  organizationId: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
}

/**
 * Input type for creating audit_templates
 */
export type CreateAuditTemplates = Omit<AuditTemplates, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating audit_templates
 */
export type UpdateAuditTemplates = Partial<Omit<AuditTemplates, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: audits
 */
export interface Audits {
  /** Primary key (UUID) */
  id?: string;
  auditNumber: string;
  title: string;
  description: string;
  auditType: string;
  status?: string;
  priority?: string;
  scope: string;
  scopeEntityId?: string;
  scopeEntityName?: string;
  scheduledStartDate: Date | string;
  scheduledEndDate: Date | string;
  actualStartDate?: Date | string;
  actualEndDate?: Date | string;
  leadAuditorId: string;
  leadAuditorName: string;
  auditorIds?: Record<string, unknown>;
  standardsReference?: string;
  auditCriteria?: Record<string, unknown>;
  templateId?: string;
  totalFindings?: number;
  criticalFindings?: number;
  majorFindings?: number;
  minorFindings?: number;
  complianceScore?: number;
  overallRating?: string;
  executiveSummary?: string;
  recommendations?: string;
  attachmentUrls?: Record<string, unknown>;
  reviewedBy?: string;
  reviewedAt?: Date | string;
  approvedBy?: string;
  approvedAt?: Date | string;
  requiresFollowUp?: boolean;
  followUpDate?: Date | string;
  followUpAuditId?: string;
  organizationId: string;
  branchId?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
}

/**
 * Input type for creating audits
 */
export type CreateAudits = Omit<Audits, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating audits
 */
export type UpdateAudits = Partial<Omit<Audits, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: auth_events
 */
export interface AuthEvents {
  /** Primary key (UUID) */
  id?: string;
  timestamp?: Date | string;
  userId?: string;
  eventType: string;
  authMethod: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  result: string;
  failureReason?: string;
}

/**
 * Input type for creating auth_events
 */
export type CreateAuthEvents = Omit<AuthEvents, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating auth_events
 */
export type UpdateAuthEvents = Partial<Omit<AuthEvents, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: billable_items
 */
export interface BillableItems {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  branchId: string;
  clientId: string;
  visitId?: string;
  evvRecordId?: string;
  serviceTypeId: string;
  serviceTypeCode: string;
  serviceTypeName: string;
  serviceDate: Date | string;
  startTime?: Date | string;
  endTime?: Date | string;
  durationMinutes: number;
  caregiverId?: string;
  caregiverName?: string;
  providerNpi?: string;
  rateScheduleId?: string;
  unitType: string;
  units: number;
  unitRate: number;
  subtotal: number;
  modifiers?: Record<string, unknown>;
  adjustments?: Record<string, unknown>;
  finalAmount: number;
  authorizationId?: string;
  authorizationNumber?: string;
  isAuthorized?: boolean;
  authorizationRemainingUnits?: number;
  payerId: string;
  payerType: string;
  payerName: string;
  status?: string;
  statusHistory?: Record<string, unknown>;
  invoiceId?: string;
  invoiceDate?: Date | string;
  claimId?: string;
  claimSubmittedDate?: Date | string;
  isHold?: boolean;
  holdReason?: string;
  requiresReview?: boolean;
  reviewReason?: string;
  isDenied?: boolean;
  denialReason?: string;
  denialCode?: string;
  denialDate?: Date | string;
  isAppealable?: boolean;
  isPaid?: boolean;
  paidAmount?: number;
  paidDate?: Date | string;
  paymentId?: string;
  notes?: string;
  tags?: Record<string, unknown>;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
  deletedAt?: Date | string;
  deletedBy?: string;
}

/**
 * Input type for creating billable_items
 */
export type CreateBillableItems = Omit<BillableItems, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating billable_items
 */
export type UpdateBillableItems = Partial<Omit<BillableItems, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: billing_usage
 */
export interface BillingUsage {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  subscriptionId: string;
  periodStart: Date | string;
  periodEnd: Date | string;
  periodType?: string;
  clientCount?: number;
  caregiverCount?: number;
  visitCount?: number;
  userCount?: number;
  peakClientCount?: number;
  peakCaregiverCount?: number;
  peakRecordedDate?: Date | string;
  clientLimit: number;
  caregiverLimit: number;
  visitLimit?: number;
  clientOverage?: number;
  caregiverOverage?: number;
  visitOverage?: number;
  overageCharges?: number;
  totalCharges?: number;
  status?: string;
  isBilled?: boolean;
  billedDate?: Date | string;
  dailySnapshots?: Record<string, unknown>;
  notes?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
}

/**
 * Input type for creating billing_usage
 */
export type CreateBillingUsage = Omit<BillingUsage, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating billing_usage
 */
export type UpdateBillingUsage = Partial<Omit<BillingUsage, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: branches
 */
export interface Branches {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  name: string;
  code?: string;
  phone?: string;
  email?: string;
  address: Record<string, unknown>;
  serviceArea?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  status?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
  deletedAt?: Date | string;
  deletedBy?: string;
  timezone?: string;
}

/**
 * Input type for creating branches
 */
export type CreateBranches = Omit<Branches, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating branches
 */
export type UpdateBranches = Partial<Omit<Branches, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: bulk_match_requests
 */
export interface BulkMatchRequests {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  branchId?: string;
  dateFrom: Date | string;
  dateTo: Date | string;
  openShiftIds?: Record<string, unknown>;
  configurationId?: string;
  optimizationGoal?: string;
  requestedBy: string;
  requestedAt?: Date | string;
  status?: string;
  startedAt?: Date | string;
  completedAt?: Date | string;
  totalShifts?: number;
  matchedShifts?: number;
  unmatchedShifts?: number;
  proposalsGenerated?: number;
  errorMessage?: string;
  notes?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
}

/**
 * Input type for creating bulk_match_requests
 */
export type CreateBulkMatchRequests = Omit<BulkMatchRequests, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating bulk_match_requests
 */
export type UpdateBulkMatchRequests = Partial<Omit<BulkMatchRequests, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: care_plan_progress_reports
 */
export interface CarePlanProgressReports {
  /** Primary key (UUID) */
  id?: string;
  carePlanId: string;
  clientId: string;
  familyMemberIds: string[];
  reportPeriodStart: Date | string;
  reportPeriodEnd: Date | string;
  reportType: string;
  goalsTotal?: number;
  goalsAchieved?: number;
  goalsInProgress?: number;
  goalsAtRisk?: number;
  goalProgress?: Record<string, unknown>;
  overallSummary: string;
  concernsNoted?: string;
  recommendationsForFamily?: string;
  preparedBy: string;
  preparedByName: string;
  publishedAt?: Date | string;
  organizationId: string;
  branchId: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
}

/**
 * Input type for creating care_plan_progress_reports
 */
export type CreateCarePlanProgressReports = Omit<CarePlanProgressReports, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating care_plan_progress_reports
 */
export type UpdateCarePlanProgressReports = Partial<Omit<CarePlanProgressReports, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: care_plans
 */
export interface CarePlans {
  /** Primary key (UUID) */
  id?: string;
  planNumber: string;
  name: string;
  clientId: string;
  organizationId: string;
  branchId?: string;
  planType: string;
  status?: string;
  priority?: string;
  effectiveDate: Date | string;
  expirationDate?: Date | string;
  reviewDate?: Date | string;
  lastReviewedDate?: Date | string;
  primaryCaregiverId?: string;
  coordinatorId?: string;
  supervisorId?: string;
  physicianId?: string;
  assessmentSummary?: string;
  medicalDiagnosis?: unknown[][];
  functionalLimitations?: unknown[][];
  goals?: Record<string, unknown>;
  interventions?: Record<string, unknown>;
  taskTemplates?: Record<string, unknown>;
  serviceFrequency?: Record<string, unknown>;
  estimatedHoursPerWeek?: number;
  authorizedBy?: string;
  authorizedDate?: Date | string;
  authorizationNumber?: string;
  payerSource?: Record<string, unknown>;
  authorizationHours?: number;
  authorizationStartDate?: Date | string;
  authorizationEndDate?: Date | string;
  requiredDocumentation?: Record<string, unknown>;
  signatureRequirements?: Record<string, unknown>;
  restrictions?: unknown[][];
  precautions?: unknown[][];
  allergies?: Record<string, unknown>;
  contraindications?: unknown[][];
  progressNotes?: Record<string, unknown>;
  outcomesMeasured?: Record<string, unknown>;
  regulatoryRequirements?: unknown[][];
  complianceStatus?: string;
  lastComplianceCheck?: Date | string;
  modificationHistory?: Record<string, unknown>;
  notes?: string;
  tags?: unknown[][];
  customFields?: Record<string, unknown>;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
  deletedAt?: Date | string;
  deletedBy?: string;
  stateJurisdiction?: string;
  stateSpecificData?: Record<string, unknown>;
  orderSource?: string;
  orderingProviderId?: string;
  orderingProviderName?: string;
  orderingProviderLicense?: string;
  orderingProviderNpi?: string;
  orderDate?: Date | string;
  verbalOrderAuthenticatedBy?: string;
  verbalOrderAuthenticatedAt?: Date | string;
  rnDelegationId?: string;
  rnSupervisorId?: string;
  rnSupervisorName?: string;
  rnSupervisorLicense?: string;
  lastSupervisoryVisitDate?: Date | string;
  nextSupervisoryVisitDue?: Date | string;
  planReviewIntervalDays?: number;
  nextReviewDue?: Date | string;
  lastReviewCompletedDate?: Date | string;
  lastReviewCompletedBy?: string;
  medicaidProgram?: string;
  medicaidWaiver?: string;
  serviceAuthorizationForm?: string;
  serviceAuthorizationUnits?: number;
  serviceAuthorizationPeriodStart?: Date | string;
  serviceAuthorizationPeriodEnd?: Date | string;
  isCdsModel?: boolean;
  employerAuthorityId?: string;
  financialManagementServiceId?: string;
  planOfCareFormNumber?: string;
  disasterPlanOnFile?: boolean;
  infectionControlPlanReviewed?: boolean;
  /** Flag indicating this is demo/seed data */
  isDemoData?: boolean;
}

/**
 * Input type for creating care_plans
 */
export type CreateCarePlans = Omit<CarePlans, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating care_plans
 */
export type UpdateCarePlans = Partial<Omit<CarePlans, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: caregiver_deductions
 */
export interface CaregiverDeductions {
  /** Primary key (UUID) */
  id?: string;
  caregiverId: string;
  deductionType: string;
  deductionCode: string;
  description: string;
  amount?: number;
  calculationMethod: string;
  percentage?: number;
  hasLimit?: boolean;
  yearlyLimit?: number;
  yearToDateAmount?: number;
  remainingAmount?: number;
  isPreTax?: boolean;
  isPostTax?: boolean;
  isStatutory?: boolean;
  employerMatch?: number;
  employerMatchPercentage?: number;
  garnishmentOrder?: Record<string, unknown>;
  isActive?: boolean;
  effectiveFrom?: Date | string;
  effectiveTo?: Date | string;
}

/**
 * Input type for creating caregiver_deductions
 */
export type CreateCaregiverDeductions = Omit<CaregiverDeductions, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating caregiver_deductions
 */
export type UpdateCaregiverDeductions = Partial<Omit<CaregiverDeductions, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: caregiver_performance_metrics
 */
export interface CaregiverPerformanceMetrics {
  /** Primary key (UUID) */
  id?: string;
  caregiverId: string;
  organizationId: string;
  periodStart: Date | string;
  periodEnd: Date | string;
  periodType: string;
  totalVisits?: number;
  completedVisits?: number;
  noShowCount?: number;
  lateArrivals?: number;
  earlyDepartures?: number;
  completionRate?: number;
  noShowRate?: number;
  proposalsReceived?: number;
  proposalsAccepted?: number;
  proposalsRejected?: number;
  acceptanceRate?: number;
  avgResponseTimeMinutes?: number;
  avgClientRating?: number;
  totalRatings?: number;
  avgTravelDistanceMiles?: number;
  totalMilesTraveled?: number;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
}

/**
 * Input type for creating caregiver_performance_metrics
 */
export type CreateCaregiverPerformanceMetrics = Omit<CaregiverPerformanceMetrics, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating caregiver_performance_metrics
 */
export type UpdateCaregiverPerformanceMetrics = Partial<Omit<CaregiverPerformanceMetrics, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: caregiver_preference_profiles
 */
export interface CaregiverPreferenceProfiles {
  /** Primary key (UUID) */
  id?: string;
  caregiverId: string;
  organizationId: string;
  preferredDaysOfWeek?: Record<string, unknown>;
  preferredTimeRanges?: Record<string, unknown>;
  preferredShiftTypes?: Record<string, unknown>;
  preferredClientIds?: Record<string, unknown>;
  preferredClientTypes?: Record<string, unknown>;
  preferredServiceTypes?: Record<string, unknown>;
  maxTravelDistance?: number;
  preferredZipCodes?: unknown[][];
  avoidZipCodes?: unknown[][];
  maxShiftsPerDay?: number;
  maxShiftsPerWeek?: number;
  maxHoursPerWeek?: number;
  requireMinimumHoursBetweenShifts?: number;
  willingToAcceptUrgentShifts?: boolean;
  willingToWorkWeekends?: boolean;
  willingToWorkHolidays?: boolean;
  acceptAutoAssignment?: boolean;
  notificationMethods?: Record<string, unknown>;
  quietHoursStart?: unknown;
  quietHoursEnd?: unknown;
  lastUpdated?: Date | string;
  updatedBy: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  version?: number;
}

/**
 * Input type for creating caregiver_preference_profiles
 */
export type CreateCaregiverPreferenceProfiles = Omit<CaregiverPreferenceProfiles, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating caregiver_preference_profiles
 */
export type UpdateCaregiverPreferenceProfiles = Partial<Omit<CaregiverPreferenceProfiles, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: caregiver_service_authorizations
 */
export interface CaregiverServiceAuthorizations {
  /** Primary key (UUID) */
  id?: string;
  caregiverId: string;
  serviceTypeCode: string;
  serviceTypeName: string;
  authorizationSource?: string;
  effectiveDate?: Date | string;
  expirationDate?: Date | string;
  status?: string;
  notes?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
}

/**
 * Input type for creating caregiver_service_authorizations
 */
export type CreateCaregiverServiceAuthorizations = Omit<CaregiverServiceAuthorizations, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating caregiver_service_authorizations
 */
export type UpdateCaregiverServiceAuthorizations = Partial<Omit<CaregiverServiceAuthorizations, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: caregiver_state_screenings
 */
export interface CaregiverStateScreenings {
  /** Primary key (UUID) */
  id?: string;
  caregiverId: string;
  stateCode: string;
  screeningType: string;
  status?: string;
  initiationDate?: Date | string;
  completionDate?: Date | string;
  expirationDate?: Date | string;
  confirmationNumber?: string;
  clearanceNumber?: string;
  results?: Record<string, unknown>;
  notes?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
}

/**
 * Input type for creating caregiver_state_screenings
 */
export type CreateCaregiverStateScreenings = Omit<CaregiverStateScreenings, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating caregiver_state_screenings
 */
export type UpdateCaregiverStateScreenings = Partial<Omit<CaregiverStateScreenings, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: caregivers
 */
export interface Caregivers {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  branchIds?: string[];
  primaryBranchId: string;
  employeeNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth: Date | string;
  ssn?: string;
  gender?: string;
  pronouns?: string;
  primaryPhone: Record<string, unknown>;
  alternatePhone?: Record<string, unknown>;
  email: string;
  preferredContactMethod?: string;
  communicationPreferences?: Record<string, unknown>;
  language?: string;
  languages?: unknown[][];
  ethnicity?: string;
  race?: unknown[][];
  primaryAddress: Record<string, unknown>;
  mailingAddress?: Record<string, unknown>;
  emergencyContacts?: Record<string, unknown>;
  employmentType: string;
  employmentStatus?: string;
  hireDate: Date | string;
  terminationDate?: Date | string;
  terminationReason?: string;
  rehireEligible?: boolean;
  role: string;
  permissions?: unknown[][];
  supervisorId?: string;
  credentials?: Record<string, unknown>;
  backgroundCheck?: Record<string, unknown>;
  drugScreening?: Record<string, unknown>;
  healthScreening?: Record<string, unknown>;
  training?: Record<string, unknown>;
  skills?: Record<string, unknown>;
  specializations?: unknown[][];
  availability: Record<string, unknown>;
  workPreferences?: Record<string, unknown>;
  maxHoursPerWeek?: number;
  minHoursPerWeek?: number;
  willingToTravel?: boolean;
  maxTravelDistance?: number;
  payRate: Record<string, unknown>;
  alternatePayRates?: Record<string, unknown>;
  payrollInfo?: Record<string, unknown>;
  performanceRating?: number;
  lastReviewDate?: Date | string;
  nextReviewDate?: Date | string;
  complianceStatus?: string;
  lastComplianceCheck?: Date | string;
  reliabilityScore?: number;
  preferredClients?: string[];
  restrictedClients?: string[];
  status?: string;
  statusReason?: string;
  documents?: Record<string, unknown>;
  notes?: string;
  customFields?: Record<string, unknown>;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
  deletedAt?: Date | string;
  deletedBy?: string;
  stateSpecific?: Record<string, unknown>;
  timezone?: string;
  /** Flag indicating this is demo/seed data */
  isDemoData?: boolean;
}

/**
 * Input type for creating caregivers
 */
export type CreateCaregivers = Omit<Caregivers, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating caregivers
 */
export type UpdateCaregivers = Partial<Omit<Caregivers, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: claims
 */
export interface Claims {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  branchId: string;
  claimNumber: string;
  claimType: string;
  claimFormat: string;
  payerId: string;
  payerType: string;
  payerName: string;
  clientId: string;
  clientName: string;
  invoiceId: string;
  invoiceNumber: string;
  billableItemIds: Record<string, unknown>;
  lineItems: Record<string, unknown>;
  totalCharges: number;
  totalApproved?: number;
  totalPaid?: number;
  totalAdjustments?: number;
  patientResponsibility?: number;
  submittedDate: Date | string;
  submittedBy: string;
  submissionMethod: string;
  submissionBatchId?: string;
  controlNumber?: string;
  status?: string;
  statusHistory?: Record<string, unknown>;
  processingDate?: Date | string;
  paymentDate?: Date | string;
  denialReason?: string;
  denialCode?: string;
  denialDate?: Date | string;
  isAppealable?: boolean;
  appealDeadline?: Date | string;
  appealId?: string;
  appealSubmittedDate?: Date | string;
  appealStatus?: string;
  eraReceived?: boolean;
  eraReceivedDate?: Date | string;
  eraDocumentId?: string;
  claimFormUrl?: string;
  supportingDocumentIds?: Record<string, unknown>;
  notes?: string;
  internalNotes?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
}

/**
 * Input type for creating claims
 */
export type CreateClaims = Omit<Claims, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating claims
 */
export type UpdateClaims = Partial<Omit<Claims, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: client_access_audit
 */
export interface ClientAccessAudit {
  /** Primary key (UUID) */
  id?: string;
  clientId: string;
  accessedBy: string;
  accessType: string;
  accessTimestamp?: Date | string;
  accessReason?: string;
  ipAddress?: unknown;
  userAgent?: string;
  disclosureRecipient?: string;
  disclosureMethod?: string;
  authorizationReference?: string;
  informationDisclosed?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
}

/**
 * Input type for creating client_access_audit
 */
export type CreateClientAccessAudit = Omit<ClientAccessAudit, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating client_access_audit
 */
export type UpdateClientAccessAudit = Partial<Omit<ClientAccessAudit, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: client_authorizations
 */
export interface ClientAuthorizations {
  /** Primary key (UUID) */
  id?: string;
  clientId: string;
  authorizationNumber: string;
  authorizationType: string;
  state?: string;
  authorizingEntity?: string;
  authorizingProvider?: string;
  authorizationDate: Date | string;
  effectiveDate: Date | string;
  expirationDate: Date | string;
  authorizedServices?: Record<string, unknown>;
  totalAuthorizedUnits?: number;
  usedUnits?: number;
  remainingUnits?: number;
  unitType?: string;
  status?: string;
  statusReason?: string;
  formNumber?: string;
  documentPath?: string;
  lastReviewDate?: Date | string;
  nextReviewDue?: Date | string;
  notes?: string;
  customFields?: Record<string, unknown>;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
  deletedAt?: Date | string;
  deletedBy?: string;
}

/**
 * Input type for creating client_authorizations
 */
export type CreateClientAuthorizations = Omit<ClientAuthorizations, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating client_authorizations
 */
export type UpdateClientAuthorizations = Partial<Omit<ClientAuthorizations, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: client_care_plan_access_logs
 */
export interface ClientCarePlanAccessLogs {
  /** Primary key (UUID) */
  id?: string;
  clientId: string;
  carePlanId: string;
  organizationId: string;
  accessedAt?: Date | string;
  accessType: string;
  clientIp?: string;
  userAgent?: string;
  deviceType?: string;
  portalSessionId?: string;
  timeSpentSeconds?: number;
  fullyRead?: boolean;
  accessibilityFeatures?: Record<string, unknown>;
}

/**
 * Input type for creating client_care_plan_access_logs
 */
export type CreateClientCarePlanAccessLogs = Omit<ClientCarePlanAccessLogs, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating client_care_plan_access_logs
 */
export type UpdateClientCarePlanAccessLogs = Partial<Omit<ClientCarePlanAccessLogs, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: client_caregiver_pairings
 */
export interface ClientCaregiverPairings {
  /** Primary key (UUID) */
  id?: string;
  clientId: string;
  caregiverId: string;
  organizationId: string;
  totalVisits?: number;
  completedVisits?: number;
  firstVisitDate?: Date | string;
  lastVisitDate?: Date | string;
  avgClientRating?: number;
  totalRatings?: number;
  noShowCount?: number;
  incidentCount?: number;
  compatibilityScore?: number;
  compatibilityLastUpdated?: Date | string;
  clientPreferred?: boolean;
  clientBlocked?: boolean;
  caregiverPreferred?: boolean;
  caregiverAvoided?: boolean;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
}

/**
 * Input type for creating client_caregiver_pairings
 */
export type CreateClientCaregiverPairings = Omit<ClientCaregiverPairings, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating client_caregiver_pairings
 */
export type UpdateClientCaregiverPairings = Partial<Omit<ClientCaregiverPairings, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: client_portal_access
 */
export interface ClientPortalAccess {
  /** Primary key (UUID) */
  id?: string;
  clientId: string;
  organizationId: string;
  branchId: string;
  status?: string;
  portalEnabled?: boolean;
  lastLoginAt?: Date | string;
  lastLoginIp?: string;
  loginCount?: number;
  invitationCode?: string;
  invitationSentAt?: Date | string;
  invitationExpiresAt?: Date | string;
  activatedAt?: Date | string;
  accessibilityPreferences?: Record<string, unknown>;
  notificationPreferences?: Record<string, unknown>;
  passwordResetRequired?: boolean;
  passwordChangedAt?: Date | string;
  failedLoginAttempts?: number;
  lockedUntil?: Date | string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  deletedAt?: Date | string;
  deletedBy?: string;
  version?: number;
}

/**
 * Input type for creating client_portal_access
 */
export type CreateClientPortalAccess = Omit<ClientPortalAccess, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating client_portal_access
 */
export type UpdateClientPortalAccess = Partial<Omit<ClientPortalAccess, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: client_portal_preferences
 */
export interface ClientPortalPreferences {
  /** Primary key (UUID) */
  id?: string;
  clientId: string;
  theme?: string;
  fontSize?: string;
  animationsEnabled?: boolean;
  language?: string;
  screenReaderMode?: boolean;
  keyboardNavigationOnly?: boolean;
  reducedMotion?: boolean;
  voiceControlEnabled?: boolean;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
  notificationSchedule?: Record<string, unknown>;
  dashboardLayout?: Record<string, unknown>;
  widgetPreferences?: Record<string, unknown>;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
}

/**
 * Input type for creating client_portal_preferences
 */
export type CreateClientPortalPreferences = Omit<ClientPortalPreferences, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating client_portal_preferences
 */
export type UpdateClientPortalPreferences = Partial<Omit<ClientPortalPreferences, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: client_portal_sessions
 */
export interface ClientPortalSessions {
  /** Primary key (UUID) */
  id?: string;
  clientPortalAccessId: string;
  clientId: string;
  sessionToken: string;
  startedAt?: Date | string;
  expiresAt: Date | string;
  lastActivityAt?: Date | string;
  endedAt?: Date | string;
  ipAddress: string;
  userAgent?: string;
  deviceType?: string;
  deviceInfo?: Record<string, unknown>;
  status?: string;
}

/**
 * Input type for creating client_portal_sessions
 */
export type CreateClientPortalSessions = Omit<ClientPortalSessions, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating client_portal_sessions
 */
export type UpdateClientPortalSessions = Partial<Omit<ClientPortalSessions, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: client_schedule_change_requests
 */
export interface ClientScheduleChangeRequests {
  /** Primary key (UUID) */
  id?: string;
  clientId: string;
  visitId?: string;
  organizationId: string;
  branchId: string;
  requestType: string;
  currentStartTime?: Date | string;
  currentEndTime?: Date | string;
  requestedStartTime?: Date | string;
  requestedEndTime?: Date | string;
  requestedReason: string;
  priority?: number;
  status?: string;
  reviewedBy?: string;
  reviewedAt?: Date | string;
  reviewNotes?: string;
  denialReason?: string;
  newVisitId?: string;
  changeApplied?: boolean;
  appliedAt?: Date | string;
  clientNotified?: boolean;
  clientNotifiedAt?: Date | string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  deletedAt?: Date | string;
  deletedBy?: string;
}

/**
 * Input type for creating client_schedule_change_requests
 */
export type CreateClientScheduleChangeRequests = Omit<ClientScheduleChangeRequests, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating client_schedule_change_requests
 */
export type UpdateClientScheduleChangeRequests = Partial<Omit<ClientScheduleChangeRequests, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: client_video_call_sessions
 */
export interface ClientVideoCallSessions {
  /** Primary key (UUID) */
  id?: string;
  clientId: string;
  coordinatorId: string;
  organizationId: string;
  branchId: string;
  callType: string;
  status?: string;
  scheduledStart?: Date | string;
  scheduledEnd?: Date | string;
  actualStart?: Date | string;
  actualEnd?: Date | string;
  durationMinutes?: number;
  platform?: string;
  externalSessionId?: string;
  clientJoinUrl?: string;
  coordinatorJoinUrl?: string;
  platformMetadata?: string;
  callPurpose?: string;
  coordinatorNotes?: string;
  clientNotes?: string;
  clientRating?: number;
  clientFeedback?: string;
  qualityMetrics?: Record<string, unknown>;
  captionsEnabled?: boolean;
  signLanguageInterpreter?: boolean;
  languagePreference?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  deletedAt?: Date | string;
  deletedBy?: string;
}

/**
 * Input type for creating client_video_call_sessions
 */
export type CreateClientVideoCallSessions = Omit<ClientVideoCallSessions, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating client_video_call_sessions
 */
export type UpdateClientVideoCallSessions = Partial<Omit<ClientVideoCallSessions, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: client_visit_ratings
 */
export interface ClientVisitRatings {
  /** Primary key (UUID) */
  id?: string;
  clientId: string;
  visitId: string;
  caregiverId: string;
  organizationId: string;
  overallRating: number;
  professionalismRating?: number;
  punctualityRating?: number;
  qualityOfCareRating?: number;
  communicationRating?: number;
  positiveFeedback?: string;
  improvementFeedback?: string;
  additionalComments?: string;
  wouldRequestAgain?: boolean;
  flaggedForReview?: boolean;
  flagReason?: string;
  ratedAt?: Date | string;
  isAnonymous?: boolean;
  visibleToCaregiver?: boolean;
  coordinatorResponse?: string;
  coordinatorRespondedAt?: Date | string;
  coordinatorId?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  deletedAt?: Date | string;
  deletedBy?: string;
}

/**
 * Input type for creating client_visit_ratings
 */
export type CreateClientVisitRatings = Omit<ClientVisitRatings, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating client_visit_ratings
 */
export type UpdateClientVisitRatings = Partial<Omit<ClientVisitRatings, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: clients
 */
export interface Clients {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  branchId: string;
  clientNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth: Date | string;
  ssn?: string;
  gender?: string;
  pronouns?: string;
  primaryPhone?: Record<string, unknown>;
  alternatePhone?: Record<string, unknown>;
  email?: string;
  preferredContactMethod?: string;
  communicationPreferences?: Record<string, unknown>;
  language?: string;
  ethnicity?: string;
  race?: Record<string, unknown>;
  maritalStatus?: string;
  veteranStatus?: boolean;
  primaryAddress: Record<string, unknown>;
  secondaryAddresses?: Record<string, unknown>;
  livingArrangement?: Record<string, unknown>;
  mobilityInfo?: Record<string, unknown>;
  emergencyContacts?: Record<string, unknown>;
  authorizedContacts?: Record<string, unknown>;
  primaryPhysician?: Record<string, unknown>;
  pharmacy?: Record<string, unknown>;
  insurance?: Record<string, unknown>;
  medicalRecordNumber?: string;
  programs?: Record<string, unknown>;
  serviceEligibility: Record<string, unknown>;
  fundingSources?: Record<string, unknown>;
  riskFlags?: Record<string, unknown>;
  allergies?: Record<string, unknown>;
  specialInstructions?: string;
  accessInstructions?: string;
  status?: string;
  intakeDate?: Date | string;
  dischargeDate?: Date | string;
  dischargeReason?: string;
  referralSource?: string;
  notes?: string;
  customFields?: Record<string, unknown>;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
  deletedAt?: Date | string;
  deletedBy?: string;
  stateSpecific?: Record<string, unknown>;
  coordinates?: Record<string, unknown>;
  geocodingConfidence?: string;
  geocodedAt?: Date | string;
  geocodingFailed?: boolean;
  timezone?: string;
  /** Flag indicating this is demo/seed data */
  isDemoData?: boolean;
}

/**
 * Input type for creating clients
 */
export type CreateClients = Omit<Clients, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating clients
 */
export type UpdateClients = Partial<Omit<Clients, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: clinical_visit_notes
 */
export interface ClinicalVisitNotes {
  /** Primary key (UUID) */
  id?: string;
  visitId: string;
  organizationId: string;
  branchId: string;
  clientId: string;
  caregiverId: string;
  noteType: string;
  serviceDate: Date | string;
  documentedAt?: Date | string;
  subjectiveNotes?: string;
  objectiveNotes?: string;
  assessment?: string;
  plan?: string;
  narrativeNote?: string;
  interventionsPerformed?: Record<string, unknown>;
  patientResponse?: string;
  safetyIncidents?: boolean;
  incidentDescription?: string;
  signedBy: string;
  signedByName: string;
  signedByCredentials: string;
  signedAt: Date | string;
  supervisedBy?: string;
  supervisedByName?: string;
  supervisedByCredentials?: string;
  supervisedAt?: Date | string;
  status?: string;
  requiresCoSign?: boolean;
  coSignedBy?: string;
  coSignedByName?: string;
  coSignedAt?: Date | string;
  amendmentReason?: string;
  amendedAt?: Date | string;
  amendedBy?: string;
  originalNoteId?: string;
  isEncrypted?: boolean;
  encryptedFields?: Record<string, unknown>;
  deletedAt?: Date | string;
  deletedBy?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  createdBy: string;
  updatedBy: string;
  version?: number;
}

/**
 * Input type for creating clinical_visit_notes
 */
export type CreateClinicalVisitNotes = Omit<ClinicalVisitNotes, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating clinical_visit_notes
 */
export type UpdateClinicalVisitNotes = Partial<Omit<ClinicalVisitNotes, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: compliance_deadlines
 */
export interface ComplianceDeadlines {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  entityType: string;
  entityId: string;
  entityName: string;
  category: string;
  title: string;
  description: string;
  deadlineDate: Date | string;
  warningDate: Date | string;
  urgentDate: Date | string;
  status?: string;
  priority?: string;
  stateCode?: string;
  regulation?: string;
  resolvedAt?: Date | string;
  resolvedBy?: string;
  resolutionNote?: string;
  actionUrl?: string;
  actionLabel?: string;
  blocksScheduling?: boolean;
  blocksAssignment?: boolean;
  lastNotifiedAt?: Date | string;
  notificationCount?: number;
  metadata?: Record<string, unknown>;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
}

/**
 * Input type for creating compliance_deadlines
 */
export type CreateComplianceDeadlines = Omit<ComplianceDeadlines, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating compliance_deadlines
 */
export type UpdateComplianceDeadlines = Partial<Omit<ComplianceDeadlines, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: corrective_actions
 */
export interface CorrectiveActions {
  /** Primary key (UUID) */
  id?: string;
  findingId: string;
  auditId: string;
  actionNumber: string;
  title: string;
  description: string;
  actionType: string;
  status?: string;
  rootCause?: string;
  contributingFactors?: Record<string, unknown>;
  specificActions: Record<string, unknown>;
  responsiblePersonId: string;
  responsiblePersonName: string;
  targetCompletionDate: Date | string;
  actualCompletionDate?: Date | string;
  resourcesRequired?: string;
  estimatedCost?: number;
  actualCost?: number;
  monitoringPlan?: string;
  successCriteria?: Record<string, unknown>;
  verificationMethod?: string;
  progressUpdates?: Record<string, unknown>;
  completionPercentage?: number;
  verifiedBy?: string;
  verifiedAt?: Date | string;
  verificationNotes?: string;
  effectivenessRating?: string;
  attachmentUrls?: Record<string, unknown>;
  organizationId: string;
  branchId?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
}

/**
 * Input type for creating corrective_actions
 */
export type CreateCorrectiveActions = Omit<CorrectiveActions, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating corrective_actions
 */
export type UpdateCorrectiveActions = Partial<Omit<CorrectiveActions, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: domain_mappings
 */
export interface DomainMappings {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  domain: string;
  domainType?: string;
  isPrimary?: boolean;
  sslStatus?: string;
  sslCertificate?: string;
  sslPrivateKey?: string;
  sslExpiresAt?: Date | string;
  autoRenewSsl?: boolean;
  dnsStatus?: string;
  dnsRecords?: Record<string, unknown>;
  dnsVerifiedAt?: Date | string;
  lastDnsCheckAt?: Date | string;
  redirectToDomain?: string;
  forceHttps?: boolean;
  includeWww?: boolean;
  status?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  activatedAt?: Date | string;
  activatedBy?: string;
  suspendedAt?: Date | string;
  suspendedBy?: string;
  suspensionReason?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
}

/**
 * Input type for creating domain_mappings
 */
export type CreateDomainMappings = Omit<DomainMappings, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating domain_mappings
 */
export type UpdateDomainMappings = Partial<Omit<DomainMappings, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: email_templates
 */
export interface EmailTemplates {
  /** Primary key (UUID) */
  id?: string;
  organizationId?: string;
  templateKey: string;
  templateName: string;
  description?: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  previewText?: string;
  availableVariables?: Record<string, unknown>;
  defaultValues?: Record<string, unknown>;
  fromName?: string;
  fromEmail?: string;
  replyToEmail?: string;
  attachments?: Record<string, unknown>;
  customCss?: string;
  useOrgBranding?: boolean;
  language?: string;
  locale?: string;
  status?: string;
  templateVersion?: number;
  isDefault?: boolean;
  lastTestedAt?: Date | string;
  lastTestedBy?: string;
  testNotes?: string;
  sentCount?: number;
  lastSentAt?: Date | string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy?: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy?: string;
  version?: number;
}

/**
 * Input type for creating email_templates
 */
export type CreateEmailTemplates = Omit<EmailTemplates, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating email_templates
 */
export type UpdateEmailTemplates = Partial<Omit<EmailTemplates, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: evv_access_log
 */
export interface EvvAccessLog {
  /** Primary key (UUID) */
  id?: string;
  evvRecordId: string;
  accessedAt?: Date | string;
  accessedBy: string;
  accessedByName: string;
  accessedByRole: string;
  accessedByIp?: unknown;
  accessType: string;
  accessReason?: string;
  fieldsAccessed?: Record<string, unknown>;
  searchFilters?: Record<string, unknown>;
  exportFormat?: string;
  exportDestination?: string;
}

/**
 * Input type for creating evv_access_log
 */
export type CreateEvvAccessLog = Omit<EvvAccessLog, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating evv_access_log
 */
export type UpdateEvvAccessLog = Partial<Omit<EvvAccessLog, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: evv_exception_queue
 */
export interface EvvExceptionQueue {
  /** Primary key (UUID) */
  id?: string;
  evvRecordId: string;
  visitId: string;
  organizationId: string;
  branchId: string;
  exceptionType: string;
  exceptionCode: string;
  exceptionSeverity: string;
  exceptionDescription: string;
  issues: Record<string, unknown>;
  issueCount: number;
  detectedAt?: Date | string;
  detectedBy: string;
  detectionMethod?: string;
  assignedTo?: string;
  assignedToRole?: string;
  assignedAt?: Date | string;
  status?: string;
  priority?: string;
  dueDate?: Date | string;
  slaDeadline?: Date | string;
  resolutionMethod?: string;
  resolvedAt?: Date | string;
  resolvedBy?: string;
  resolutionNotes?: string;
  escalatedAt?: Date | string;
  escalatedTo?: string;
  escalationReason?: string;
  viewedAt?: Date | string;
  viewedBy?: string;
  notificationSent?: boolean;
  notificationSentAt?: Date | string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
}

/**
 * Input type for creating evv_exception_queue
 */
export type CreateEvvExceptionQueue = Omit<EvvExceptionQueue, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating evv_exception_queue
 */
export type UpdateEvvExceptionQueue = Partial<Omit<EvvExceptionQueue, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: evv_original_data
 */
export interface EvvOriginalData {
  evvRecordId: string;
  originalClockInTime: Date | string;
  originalClockOutTime?: Date | string;
  originalDuration?: number;
  originalClockInLocation: Record<string, unknown>;
  originalClockOutLocation?: Record<string, unknown>;
  originalClockInDevice: string;
  originalClockOutDevice?: string;
  originalVerificationMethod: string;
  capturedAt?: Date | string;
  capturedBy: string;
  capturedViaDevice: string;
  capturedViaApp: string;
  originalIntegrityHash: string;
  originalChecksum: string;
  lockedForEditing?: boolean;
  lockReason?: string;
  lockedAt?: Date | string;
  lockedBy?: string;
}

/**
 * Input type for creating evv_original_data
 */
export type CreateEvvOriginalData = Omit<EvvOriginalData, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating evv_original_data
 */
export type UpdateEvvOriginalData = Partial<Omit<EvvOriginalData, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: evv_records
 */
export interface EvvRecords {
  /** Primary key (UUID) */
  id?: string;
  visitId: string;
  organizationId: string;
  branchId: string;
  clientId: string;
  caregiverId: string;
  serviceTypeCode: string;
  serviceTypeName: string;
  clientName: string;
  clientMedicaidId?: string;
  caregiverName: string;
  caregiverEmployeeId: string;
  caregiverNpi?: string;
  serviceDate: Date | string;
  serviceAddress: Record<string, unknown>;
  clockInTime: Date | string;
  clockOutTime?: Date | string;
  totalDuration?: number;
  clockInVerification: Record<string, unknown>;
  clockOutVerification?: Record<string, unknown>;
  midVisitChecks?: Record<string, unknown>;
  pauseEvents?: Record<string, unknown>;
  exceptionEvents?: Record<string, unknown>;
  recordStatus?: string;
  verificationLevel: string;
  complianceFlags?: Record<string, unknown>;
  integrityHash: string;
  integrityChecksum: string;
  recordedAt?: Date | string;
  recordedBy: string;
  syncMetadata: Record<string, unknown>;
  submittedToPayor?: Date | string;
  payorApprovalStatus?: string;
  stateSpecificData?: Record<string, unknown>;
  caregiverAttestation?: Record<string, unknown>;
  clientAttestation?: Record<string, unknown>;
  supervisorReview?: Record<string, unknown>;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
  /** Flag indicating this is demo/seed data */
  isDemoData?: boolean;
}

/**
 * Input type for creating evv_records
 */
export type CreateEvvRecords = Omit<EvvRecords, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating evv_records
 */
export type UpdateEvvRecords = Partial<Omit<EvvRecords, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: evv_revisions
 */
export interface EvvRevision {
  /** Primary key (UUID) */
  id?: string;
  evvRecordId: string;
  visitId: string;
  organizationId: string;
  revisionNumber: number;
  revisionType: string;
  revisionReason: string;
  revisionReasonCode?: string;
  revisedBy: string;
  revisedByName: string;
  revisedByRole: string;
  revisedAt?: Date | string;
  fieldPath: string;
  originalValue: Record<string, unknown>;
  newValue: Record<string, unknown>;
  justification: string;
  supportingDocuments?: Record<string, unknown>;
  requiresApproval?: boolean;
  approvalStatus?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: Date | string;
  denialReason?: string;
  aggregatorNotified?: boolean;
  aggregatorNotifiedAt?: Date | string;
  aggregatorConfirmation?: string;
  resubmissionRequired?: boolean;
  resubmittedAt?: Date | string;
  revisionHash: string;
  previousRevisionHash?: string;
  complianceNotes?: string;
  complianceReviewed?: boolean;
  complianceReviewedBy?: string;
  complianceReviewedAt?: Date | string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
}

/**
 * Input type for creating evv_revisions
 */
export type CreateEvvRevision = Omit<EvvRevision, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating evv_revisions
 */
export type UpdateEvvRevision = Partial<Omit<EvvRevision, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: evv_state_config
 */
export interface EvvStateConfig {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  branchId?: string;
  stateCode: string;
  aggregatorType: string;
  aggregatorEntityId: string;
  aggregatorEndpoint: string;
  aggregatorApiKeyEncrypted?: string;
  programType: string;
  allowedClockMethods: Record<string, unknown>;
  requiresGpsForMobile?: boolean;
  geoPerimeterTolerance?: number;
  clockInGracePeriod?: number;
  clockOutGracePeriod?: number;
  lateClockInThreshold?: number;
  vmurEnabled?: boolean;
  vmurApprovalRequired?: boolean;
  vmurReasonCodesRequired?: boolean;
  additionalAggregators?: Record<string, unknown>;
  mcoRequirements?: Record<string, unknown>;
  isActive?: boolean;
  effectiveFrom: Date | string;
  effectiveTo?: Date | string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
  retentionYears?: number;
  immutableAfterDays?: number;
  aggregatorAuthEndpoint?: string;
  aggregatorClientId?: string;
  aggregatorClientSecretEncrypted?: string;
  aggregatorMetadata?: Record<string, unknown>;
}

/**
 * Input type for creating evv_state_config
 */
export type CreateEvvStateConfig = Omit<EvvStateConfig, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating evv_state_config
 */
export type UpdateEvvStateConfig = Partial<Omit<EvvStateConfig, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: evv_state_validation_rules
 */
export interface EvvStateValidationRules {
  /** Primary key (UUID) */
  id?: string;
  stateCode: string;
  geofenceRadiusMeters?: number;
  geofenceToleranceMeters?: number;
  geofenceToleranceReason?: string;
  maxClockInEarlyMinutes?: number;
  maxClockOutLateMinutes?: number;
  overtimeThresholdMinutes?: number;
  minimumGpsAccuracyMeters?: number;
  requiresBiometric?: boolean;
  requiresPhoto?: boolean;
  requiresClientAttestation?: boolean;
  allowManualOverride?: boolean;
  manualOverrideRequiresSupervisor?: boolean;
  manualOverrideReasonCodes?: Record<string, unknown>;
  retentionYears?: number;
  immutableAfterDays?: number;
  stateDepartment?: string;
  statePrograms?: Record<string, unknown>;
  lenientRuralPolicy?: boolean;
  hcbsWaiverFocus?: boolean;
  nonMedicalExempt?: boolean;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  createdBy: string;
  updatedBy: string;
}

/**
 * Input type for creating evv_state_validation_rules
 */
export type CreateEvvStateValidationRules = Omit<EvvStateValidationRules, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating evv_state_validation_rules
 */
export type UpdateEvvStateValidationRules = Partial<Omit<EvvStateValidationRules, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: family_activity_feed
 */
export interface FamilyActivityFeed {
  /** Primary key (UUID) */
  id?: string;
  familyMemberId: string;
  clientId: string;
  activityType: string;
  title: string;
  description: string;
  summary?: string;
  relatedEntityType: string;
  relatedEntityId: string;
  performedBy?: string;
  performedByName?: string;
  occurredAt?: Date | string;
  iconType?: string;
  viewedByFamily?: boolean;
  viewedAt?: Date | string;
  organizationId: string;
  branchId: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
}

/**
 * Input type for creating family_activity_feed
 */
export type CreateFamilyActivityFeed = Omit<FamilyActivityFeed, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating family_activity_feed
 */
export type UpdateFamilyActivityFeed = Partial<Omit<FamilyActivityFeed, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: family_consent
 */
export interface FamilyConsent {
  /** Primary key (UUID) */
  id?: string;
  familyMemberId: string;
  clientId: string;
  consentType: string;
  consentGiven: boolean;
  consentDate: Date | string;
  expiresAt?: Date | string;
  signedByClientId?: string;
  signedByGuardianId?: string;
  documentUrl?: string;
  revokedAt?: Date | string;
  revokedBy?: string;
  revokedReason?: string;
  organizationId: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
}

/**
 * Input type for creating family_consent
 */
export type CreateFamilyConsent = Omit<FamilyConsent, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating family_consent
 */
export type UpdateFamilyConsent = Partial<Omit<FamilyConsent, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: family_members
 */
export interface FamilyMembers {
  /** Primary key (UUID) */
  id?: string;
  clientId: string;
  relationship: string;
  relationshipNote?: string;
  isPrimaryContact?: boolean;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  preferredContactMethod?: string;
  portalAccessLevel?: string;
  accessGrantedBy: string;
  accessGrantedAt?: Date | string;
  accessExpiresAt?: Date | string;
  status?: string;
  invitationStatus?: string;
  invitationSentAt?: Date | string;
  invitationAcceptedAt?: Date | string;
  receiveNotifications?: boolean;
  notificationPreferences?: Record<string, unknown>;
  lastLoginAt?: Date | string;
  passwordResetRequired?: boolean;
  organizationId: string;
  branchId: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
  /** Flag indicating this is demo/seed data */
  isDemoData?: boolean;
}

/**
 * Input type for creating family_members
 */
export type CreateFamilyMembers = Omit<FamilyMembers, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating family_members
 */
export type UpdateFamilyMembers = Partial<Omit<FamilyMembers, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: family_notifications
 */
export interface FamilyNotifications {
  /** Primary key (UUID) */
  id?: string;
  familyMemberId: string;
  clientId: string;
  category: string;
  priority?: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  deliveryStatus?: string;
  sentAt?: Date | string;
  deliveredAt?: Date | string;
  readAt?: Date | string;
  dismissedAt?: Date | string;
  emailSent?: boolean;
  smsSent?: boolean;
  pushSent?: boolean;
  expiresAt?: Date | string;
  organizationId: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  /** Flag indicating this is demo/seed data */
  isDemoData?: boolean;
}

/**
 * Input type for creating family_notifications
 */
export type CreateFamilyNotifications = Omit<FamilyNotifications, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating family_notifications
 */
export type UpdateFamilyNotifications = Partial<Omit<FamilyNotifications, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: family_visit_summaries
 */
export interface FamilyVisitSummaries {
  /** Primary key (UUID) */
  id?: string;
  visitId: string;
  clientId: string;
  familyMemberIds: string[];
  scheduledStartTime: Date | string;
  scheduledEndTime: Date | string;
  actualStartTime?: Date | string;
  actualEndTime?: Date | string;
  caregiverName: string;
  caregiverPhotoUrl?: string;
  tasksCompleted?: Record<string, unknown>;
  visitNotes?: string;
  status: string;
  cancellationReason?: string;
  visibleToFamily?: boolean;
  publishedAt?: Date | string;
  viewedByFamily?: boolean;
  viewedAt?: Date | string;
  organizationId: string;
  branchId: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
}

/**
 * Input type for creating family_visit_summaries
 */
export type CreateFamilyVisitSummaries = Omit<FamilyVisitSummaries, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating family_visit_summaries
 */
export type UpdateFamilyVisitSummaries = Partial<Omit<FamilyVisitSummaries, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: feature_flags
 */
export interface FeatureFlags {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  featureKey: string;
  featureName: string;
  description?: string;
  isEnabled?: boolean;
  enabledAt?: Date | string;
  enabledBy?: string;
  configuration?: Record<string, unknown>;
  limits?: Record<string, unknown>;
  rolloutPercentage?: number;
  rolloutUserIds?: string[];
  rolloutBranchIds?: string[];
  billingTier?: string;
  monthlyCost?: number;
  requiresUpgrade?: boolean;
  dependsOn?: unknown[][];
  conflictsWith?: unknown[][];
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
}

/**
 * Input type for creating feature_flags
 */
export type CreateFeatureFlags = Omit<FeatureFlags, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating feature_flags
 */
export type UpdateFeatureFlags = Partial<Omit<FeatureFlags, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: geofences
 */
export interface Geofences {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  clientId: string;
  addressId: string;
  centerLatitude: number;
  centerLongitude: number;
  radiusMeters: number;
  radiusType?: string;
  shape?: string;
  polygonPoints?: Record<string, unknown>;
  isActive?: boolean;
  allowedVariance?: number;
  calibratedAt?: Date | string;
  calibratedBy?: string;
  calibrationMethod?: string;
  calibrationNotes?: string;
  verificationCount?: number;
  successfulVerifications?: number;
  failedVerifications?: number;
  averageAccuracy?: number;
  status?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
}

/**
 * Input type for creating geofences
 */
export type CreateGeofences = Omit<Geofences, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating geofences
 */
export type UpdateGeofences = Partial<Omit<Geofences, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: incidents
 */
export interface Incidents {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  clientId: string;
  reportedBy: string;
  incidentType: string;
  severity: string;
  status?: string;
  occurredAt: Date | string;
  discoveredAt: Date | string;
  location: string;
  description: string;
  immediateAction: string;
  witnessIds?: string[];
  involvedStaffIds?: string[];
  injurySeverity?: string;
  injuryDescription?: string;
  medicalAttentionRequired?: boolean;
  medicalAttentionProvided?: string;
  emergencyServicesContacted?: boolean;
  emergencyServicesDetails?: string;
  familyNotified?: boolean;
  familyNotifiedAt?: Date | string;
  familyNotifiedBy?: string;
  familyNotificationNotes?: string;
  physicianNotified?: boolean;
  physicianNotifiedAt?: Date | string;
  physicianNotifiedBy?: string;
  physicianOrders?: string;
  stateReportingRequired?: boolean;
  stateReportedAt?: Date | string;
  stateReportedBy?: string;
  stateReportNumber?: string;
  stateAgency?: string;
  investigationRequired?: boolean;
  investigationStartedAt?: Date | string;
  investigationCompletedAt?: Date | string;
  investigationFindings?: string;
  preventativeMeasures?: string;
  policyChangesRecommended?: string;
  followUpRequired?: boolean;
  followUpCompletedAt?: Date | string;
  followUpNotes?: string;
  attachmentUrls?: unknown[][];
  resolutionNotes?: string;
  resolvedAt?: Date | string;
  resolvedBy?: string;
  closedAt?: Date | string;
  closedBy?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
}

/**
 * Input type for creating incidents
 */
export type CreateIncidents = Omit<Incidents, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating incidents
 */
export type UpdateIncidents = Partial<Omit<Incidents, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: invite_tokens
 */
export interface InviteTokens {
  /** Primary key (UUID) */
  id?: string;
  token: string;
  organizationId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles?: unknown[][];
  branchIds?: string[];
  expiresAt: Date | string;
  status?: string;
  acceptedUserId?: string;
  acceptedAt?: Date | string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
}

/**
 * Input type for creating invite_tokens
 */
export type CreateInviteTokens = Omit<InviteTokens, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating invite_tokens
 */
export type UpdateInviteTokens = Partial<Omit<InviteTokens, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: invoices
 */
export interface Invoices {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  branchId: string;
  invoiceNumber: string;
  invoiceType: string;
  payerId: string;
  payerType: string;
  payerName: string;
  payerAddress?: Record<string, unknown>;
  clientId?: string;
  clientName?: string;
  periodStart: Date | string;
  periodEnd: Date | string;
  invoiceDate: Date | string;
  dueDate: Date | string;
  billableItemIds: Record<string, unknown>;
  lineItems: Record<string, unknown>;
  subtotal: number;
  taxAmount?: number;
  taxRate?: number;
  discountAmount?: number;
  adjustmentAmount?: number;
  totalAmount: number;
  paidAmount?: number;
  balanceDue: number;
  status?: string;
  statusHistory?: Record<string, unknown>;
  submittedDate?: Date | string;
  submittedBy?: string;
  submissionMethod?: string;
  submissionConfirmation?: string;
  paymentTerms?: string;
  lateFeeRate?: number;
  payments?: Record<string, unknown>;
  pdfUrl?: string;
  documentIds?: Record<string, unknown>;
  claimIds?: Record<string, unknown>;
  claimStatus?: string;
  notes?: string;
  internalNotes?: string;
  tags?: Record<string, unknown>;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
  deletedAt?: Date | string;
  deletedBy?: string;
  /** Flag indicating this is demo/seed data */
  isDemoData?: boolean;
}

/**
 * Input type for creating invoices
 */
export type CreateInvoices = Omit<Invoices, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating invoices
 */
export type UpdateInvoices = Partial<Omit<Invoices, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: knex_migrations
 */
export interface KnexMigrations {
  /** Primary key (UUID) */
  id?: number;
  name?: string;
  batch?: number;
  migrationTime?: Date | string;
}

/**
 * Input type for creating knex_migrations
 */
export type CreateKnexMigrations = Omit<KnexMigrations, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating knex_migrations
 */
export type UpdateKnexMigrations = Partial<Omit<KnexMigrations, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: knex_migrations_lock
 */
export interface KnexMigrationsLock {
  index?: number;
  isLocked?: number;
}

/**
 * Input type for creating knex_migrations_lock
 */
export type CreateKnexMigrationsLock = Omit<KnexMigrationsLock, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating knex_migrations_lock
 */
export type UpdateKnexMigrationsLock = Partial<Omit<KnexMigrationsLock, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: match_history
 */
export interface MatchHistory {
  /** Primary key (UUID) */
  id?: string;
  openShiftId: string;
  visitId: string;
  caregiverId?: string;
  attemptNumber: number;
  matchedAt?: Date | string;
  matchedBy?: string;
  matchScore?: number;
  matchQuality?: string;
  outcome: string;
  outcomeDeterminedAt?: Date | string;
  assignmentProposalId?: string;
  assignedSuccessfully?: boolean;
  rejectionReason?: string;
  configurationId?: string;
  configurationSnapshot?: Record<string, unknown>;
  responseTimeMinutes?: number;
  notes?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
}

/**
 * Input type for creating match_history
 */
export type CreateMatchHistory = Omit<MatchHistory, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating match_history
 */
export type UpdateMatchHistory = Partial<Omit<MatchHistory, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: matching_configurations
 */
export interface MatchingConfigurations {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  branchId?: string;
  name: string;
  description?: string;
  weights?: Record<string, unknown>;
  maxTravelDistance?: number;
  maxTravelTime?: number;
  requireExactSkillMatch?: boolean;
  requireActiveCertifications?: boolean;
  respectGenderPreference?: boolean;
  respectLanguagePreference?: boolean;
  autoAssignThreshold?: number;
  minScoreForProposal?: number;
  maxProposalsPerShift?: number;
  proposalExpirationMinutes?: number;
  optimizeFor?: string;
  considerCostEfficiency?: boolean;
  balanceWorkloadAcrossCaregivers?: boolean;
  prioritizeContinuityOfCare?: boolean;
  preferSameCaregiverForRecurring?: boolean;
  penalizeFrequentRejections?: boolean;
  boostReliablePerformers?: boolean;
  isActive?: boolean;
  isDefault?: boolean;
  notes?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
  mlEnabled?: boolean;
  mlWeight?: number;
  mlModelPreference?: string;
  minMlConfidence?: number;
  abTestingEnabled?: boolean;
  abTestVariant?: string;
}

/**
 * Input type for creating matching_configurations
 */
export type CreateMatchingConfigurations = Omit<MatchingConfigurations, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating matching_configurations
 */
export type UpdateMatchingConfigurations = Partial<Omit<MatchingConfigurations, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: medication_administrations
 */
export interface MedicationAdministrations {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  medicationId: string;
  clientId: string;
  administeredBy: string;
  administeredAt: Date | string;
  scheduledFor?: Date | string;
  dosageGiven: string;
  route: string;
  status: string;
  notes?: string;
  refusalReason?: string;
  holdReason?: string;
  witnessedBy?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
}

/**
 * Input type for creating medication_administrations
 */
export type CreateMedicationAdministrations = Omit<MedicationAdministrations, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating medication_administrations
 */
export type UpdateMedicationAdministrations = Partial<Omit<MedicationAdministrations, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: medications
 */
export interface Medications {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  clientId: string;
  medicationName: string;
  genericName?: string;
  dosage: string;
  route: string;
  frequency: string;
  instructions?: string;
  prescribedBy: string;
  prescribedDate: Date | string;
  startDate: Date | string;
  endDate?: Date | string;
  status?: string;
  refillsRemaining?: number;
  sideEffects?: Record<string, unknown>;
  warnings?: Record<string, unknown>;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
}

/**
 * Input type for creating medications
 */
export type CreateMedications = Omit<Medications, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating medications
 */
export type UpdateMedications = Partial<Omit<Medications, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: message_threads
 */
export interface MessageThreads {
  /** Primary key (UUID) */
  id?: string;
  familyMemberId: string;
  clientId: string;
  subject: string;
  status?: string;
  priority?: string;
  participants: string[];
  assignedToUserId?: string;
  lastMessageAt?: Date | string;
  messageCount?: number;
  unreadCountFamily?: number;
  unreadCountStaff?: number;
  organizationId: string;
  branchId: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
}

/**
 * Input type for creating message_threads
 */
export type CreateMessageThreads = Omit<MessageThreads, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating message_threads
 */
export type UpdateMessageThreads = Partial<Omit<MessageThreads, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: messages
 */
export interface Messages {
  /** Primary key (UUID) */
  id?: string;
  threadId: string;
  familyMemberId: string;
  clientId: string;
  sentBy: string;
  senderType: string;
  senderName: string;
  messageText: string;
  attachmentUrls?: unknown[][];
  status?: string;
  readAt?: Date | string;
  readBy?: string[];
  isInternal?: boolean;
  flaggedForReview?: boolean;
  flaggedReason?: string;
  organizationId: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  /** Flag indicating this is demo/seed data */
  isDemoData?: boolean;
}

/**
 * Input type for creating messages
 */
export type CreateMessages = Omit<Messages, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating messages
 */
export type UpdateMessages = Partial<Omit<Messages, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: ml_models
 */
export interface MlModels {
  /** Primary key (UUID) */
  id?: string;
  organizationId?: string;
  modelType: string;
  modelVersion: string;
  targetVariable: string;
  modelArtifact: string;
  featureImportance?: Record<string, unknown>;
  hyperparameters?: Record<string, unknown>;
  trainingSamples: number;
  trainingStartedAt: Date | string;
  trainingCompletedAt: Date | string;
  trainingMetrics: Record<string, unknown>;
  validationMetrics?: Record<string, unknown>;
  status?: string;
  deployedAt?: Date | string;
  archivedAt?: Date | string;
  isActive?: boolean;
  replacesModelId?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
}

/**
 * Input type for creating ml_models
 */
export type CreateMlModels = Omit<MlModels, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating ml_models
 */
export type UpdateMlModels = Partial<Omit<MlModels, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: ml_predictions
 */
export interface MlPredictions {
  /** Primary key (UUID) */
  id?: string;
  modelId: string;
  openShiftId: string;
  caregiverId: string;
  assignmentProposalId?: string;
  predictedScore: number;
  predictionDetails?: Record<string, unknown>;
  ruleBasedScore: number;
  hybridScore: number;
  mlWeight: number;
  actualAccepted?: boolean;
  actualCompleted?: boolean;
  actualNoShow?: boolean;
  predictionError?: number;
  inferenceTimeMs?: number;
  predictedAt?: Date | string;
  outcomeRecordedAt?: Date | string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
}

/**
 * Input type for creating ml_predictions
 */
export type CreateMlPredictions = Omit<MlPredictions, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating ml_predictions
 */
export type UpdateMlPredictions = Partial<Omit<MlPredictions, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: ml_training_data
 */
export interface MlTrainingData {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  openShiftId?: string;
  caregiverId?: string;
  visitId?: string;
  features: Record<string, unknown>;
  wasAccepted?: boolean;
  wasCompleted?: boolean;
  wasNoShow?: boolean;
  wasLate?: boolean;
  clientSatisfactionRating?: number;
  responseTimeMinutes?: number;
  ruleBasedScore?: number;
  matchQuality?: string;
  matchedAt: Date | string;
  shiftCompletedAt?: Date | string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  deletedAt?: Date | string;
}

/**
 * Input type for creating ml_training_data
 */
export type CreateMlTrainingData = Omit<MlTrainingData, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating ml_training_data
 */
export type UpdateMlTrainingData = Partial<Omit<MlTrainingData, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: mobile_devices
 */
export interface MobileDevices {
  /** Primary key (UUID) */
  id?: string;
  userId: string;
  organizationId: string;
  deviceId: string;
  deviceName?: string;
  deviceType: string;
  osVersion?: string;
  appVersion: string;
  manufacturer?: string;
  model?: string;
  deviceCapabilities?: Record<string, unknown>;
  pushToken?: string;
  pushProvider?: string;
  pushEnabled?: boolean;
  pushTokenUpdatedAt?: Date | string;
  status?: string;
  registeredAt?: Date | string;
  lastSeenAt?: Date | string;
  lastSyncAt?: Date | string;
  isTrusted?: boolean;
  trustedAt?: Date | string;
  trustedBy?: string;
  securityFlags?: Record<string, unknown>;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
}

/**
 * Input type for creating mobile_devices
 */
export type CreateMobileDevices = Omit<MobileDevices, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating mobile_devices
 */
export type UpdateMobileDevices = Partial<Omit<MobileDevices, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: open_shifts
 */
export interface OpenShifts {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  branchId: string;
  visitId: string;
  clientId: string;
  scheduledDate: Date | string;
  startTime: unknown;
  endTime: unknown;
  duration: number;
  timezone?: string;
  serviceTypeId: string;
  serviceTypeName: string;
  taskIds?: Record<string, unknown>;
  requiredSkills?: Record<string, unknown>;
  requiredCertifications?: Record<string, unknown>;
  preferredCaregivers?: Record<string, unknown>;
  blockedCaregivers?: Record<string, unknown>;
  genderPreference?: string;
  languagePreference?: string;
  address: Record<string, unknown>;
  latitude?: number;
  longitude?: number;
  priority?: string;
  isUrgent?: boolean;
  fillByDate?: Date | string;
  matchingStatus?: string;
  lastMatchedAt?: Date | string;
  matchAttempts?: number;
  proposedAssignments?: Record<string, unknown>;
  rejectedCaregivers?: Record<string, unknown>;
  clientInstructions?: string;
  internalNotes?: string;
  tags?: unknown[][];
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
  /** Flag indicating this is demo/seed data */
  isDemoData?: boolean;
}

/**
 * Input type for creating open_shifts
 */
export type CreateOpenShifts = Omit<OpenShifts, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating open_shifts
 */
export type UpdateOpenShifts = Partial<Omit<OpenShifts, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: organization_branding
 */
export interface OrganizationBranding {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  logoUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  logoSquareUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  successColor?: string;
  warningColor?: string;
  errorColor?: string;
  infoColor?: string;
  fontFamily?: string;
  headingFontFamily?: string;
  brandName?: string;
  tagline?: string;
  customCss?: string;
  themeOverrides?: Record<string, unknown>;
  componentOverrides?: Record<string, unknown>;
  termsOfServiceUrl?: string;
  privacyPolicyUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  supportUrl?: string;
  emailHeaderHtml?: string;
  emailFooterHtml?: string;
  emailFromName?: string;
  isActive?: boolean;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
}

/**
 * Input type for creating organization_branding
 */
export type CreateOrganizationBranding = Omit<OrganizationBranding, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating organization_branding
 */
export type UpdateOrganizationBranding = Partial<Omit<OrganizationBranding, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: organizations
 */
export interface Organizations {
  /** Primary key (UUID) */
  id?: string;
  name: string;
  legalName?: string;
  taxId?: string;
  licenseNumber?: string;
  phone?: string;
  email?: string;
  website?: string;
  primaryAddress: Record<string, unknown>;
  billingAddress?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  status?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
  deletedAt?: Date | string;
  deletedBy?: string;
  stateCode?: string;
  timezone?: string;
}

/**
 * Input type for creating organizations
 */
export type CreateOrganizations = Omit<Organizations, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating organizations
 */
export type UpdateOrganizations = Partial<Omit<Organizations, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: pay_periods
 */
export interface PayPeriods {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  branchId?: string;
  periodNumber: number;
  periodYear: number;
  periodType: string;
  startDate: Date | string;
  endDate: Date | string;
  payDate: Date | string;
  status?: string;
  statusHistory?: Record<string, unknown>;
  cutoffDate?: Date | string;
  approvalDeadline?: Date | string;
  payRunId?: string;
  totalCaregivers?: number;
  totalHours?: number;
  totalGrossPay?: number;
  totalNetPay?: number;
  totalTaxWithheld?: number;
  totalDeductions?: number;
  notes?: string;
  fiscalQuarter?: number;
  fiscalYear?: number;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
}

/**
 * Input type for creating pay_periods
 */
export type CreatePayPeriods = Omit<PayPeriods, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating pay_periods
 */
export type UpdatePayPeriods = Partial<Omit<PayPeriods, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: pay_runs
 */
export interface PayRuns {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  branchId?: string;
  payPeriodId: string;
  payPeriodStartDate: Date | string;
  payPeriodEndDate: Date | string;
  payDate: Date | string;
  runNumber: string;
  runType: string;
  status?: string;
  statusHistory?: Record<string, unknown>;
  initiatedAt?: Date | string;
  initiatedBy?: string;
  calculatedAt?: Date | string;
  approvedAt?: Date | string;
  approvedBy?: string;
  processedAt?: Date | string;
  processedBy?: string;
  payStubIds?: Record<string, unknown>;
  totalPayStubs?: number;
  totalCaregivers?: number;
  totalHours?: number;
  totalGrossPay?: number;
  totalDeductions?: number;
  totalTaxWithheld?: number;
  totalNetPay?: number;
  federalIncomeTax?: number;
  stateIncomeTax?: number;
  socialSecurityTax?: number;
  medicareTax?: number;
  localTax?: number;
  benefitsDeductions?: number;
  garnishments?: number;
  otherDeductions?: number;
  directDepositCount?: number;
  directDepositAmount?: number;
  checkCount?: number;
  checkAmount?: number;
  cashCount?: number;
  cashAmount?: number;
  payrollRegisterUrl?: string;
  taxReportUrl?: string;
  exportFiles?: Record<string, unknown>;
  complianceChecks?: Record<string, unknown>;
  compliancePassed?: boolean;
  hasErrors?: boolean;
  errors?: Record<string, unknown>;
  warnings?: Record<string, unknown>;
  notes?: string;
  internalNotes?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
}

/**
 * Input type for creating pay_runs
 */
export type CreatePayRuns = Omit<PayRuns, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating pay_runs
 */
export type UpdatePayRuns = Partial<Omit<PayRuns, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: pay_stubs
 */
export interface PayStubs {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  branchId: string;
  payRunId: string;
  payPeriodId: string;
  caregiverId: string;
  timeSheetId: string;
  caregiverName: string;
  caregiverEmployeeId: string;
  caregiverAddress?: Record<string, unknown>;
  payPeriodStartDate: Date | string;
  payPeriodEndDate: Date | string;
  payDate: Date | string;
  stubNumber: string;
  regularHours?: number;
  overtimeHours?: number;
  doubleTimeHours?: number;
  ptoHours?: number;
  holidayHours?: number;
  sickHours?: number;
  otherHours?: number;
  totalHours?: number;
  regularPay?: number;
  overtimePay?: number;
  doubleTimePay?: number;
  ptoPay?: number;
  holidayPay?: number;
  sickPay?: number;
  otherPay?: number;
  bonuses?: number;
  commissions?: number;
  reimbursements?: number;
  retroactivePay?: number;
  otherEarnings?: number;
  currentGrossPay: number;
  yearToDateGrossPay: number;
  deductions?: Record<string, unknown>;
  federalIncomeTax?: number;
  stateIncomeTax?: number;
  localIncomeTax?: number;
  socialSecurityTax?: number;
  medicareTax?: number;
  additionalMedicareTax?: number;
  totalTaxWithheld?: number;
  healthInsurance?: number;
  dentalInsurance?: number;
  visionInsurance?: number;
  lifeInsurance?: number;
  retirement401k?: number;
  retirementRoth?: number;
  fsaHealthcare?: number;
  fsaDependentCare?: number;
  hsa?: number;
  garnishments?: number;
  unionDues?: number;
  otherDeductions?: number;
  totalOtherDeductions?: number;
  currentNetPay: number;
  yearToDateNetPay: number;
  ytdHours?: number;
  ytdGrossPay?: number;
  ytdFederalTax?: number;
  ytdStateTax?: number;
  ytdSocialSecurity?: number;
  ytdMedicare?: number;
  ytdDeductions?: number;
  ytdNetPay?: number;
  paymentMethod: string;
  paymentId?: string;
  bankAccountId?: string;
  bankAccountLast4?: string;
  checkNumber?: string;
  checkDate?: Date | string;
  checkStatus?: string;
  status?: string;
  statusHistory?: Record<string, unknown>;
  calculatedAt: Date | string;
  calculatedBy?: string;
  approvedAt?: Date | string;
  approvedBy?: string;
  deliveredAt?: Date | string;
  deliveryMethod?: string;
  viewedAt?: Date | string;
  pdfUrl?: string;
  pdfGeneratedAt?: Date | string;
  isVoid?: boolean;
  voidReason?: string;
  voidedAt?: Date | string;
  voidedBy?: string;
  notes?: string;
  internalNotes?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
}

/**
 * Input type for creating pay_stubs
 */
export type CreatePayStubs = Omit<PayStubs, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating pay_stubs
 */
export type UpdatePayStubs = Partial<Omit<PayStubs, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: payers
 */
export interface Payers {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  payerName: string;
  payerType: string;
  payerCode?: string;
  nationalPayerId?: string;
  medicaidProviderId?: string;
  medicareProviderId?: string;
  taxId?: string;
  address?: Record<string, unknown>;
  phone?: string;
  fax?: string;
  email?: string;
  website?: string;
  billingAddress?: Record<string, unknown>;
  billingEmail?: string;
  billingPortalUrl?: string;
  submissionMethods?: Record<string, unknown>;
  ediPayerId?: string;
  clearinghouseId?: string;
  paymentTermsDays?: number;
  requiresPreAuthorization?: boolean;
  requiresReferral?: boolean;
  claimFilingLimit?: number;
  defaultRateScheduleId?: string;
  status?: string;
  averagePaymentDays?: number;
  denialRate?: number;
  notes?: string;
  contacts?: Record<string, unknown>;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
  deletedAt?: Date | string;
  deletedBy?: string;
}

/**
 * Input type for creating payers
 */
export type CreatePayers = Omit<Payers, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating payers
 */
export type UpdatePayers = Partial<Omit<Payers, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: payment_records
 */
export interface PaymentRecords {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  branchId: string;
  payRunId: string;
  payStubId: string;
  caregiverId: string;
  paymentNumber: string;
  paymentMethod: string;
  paymentAmount: number;
  paymentDate: Date | string;
  bankAccountId?: string;
  routingNumber?: string;
  accountNumber?: string;
  accountType?: string;
  transactionId?: string;
  traceNumber?: string;
  checkNumber?: string;
  checkDate?: Date | string;
  checkStatus?: string;
  checkClearedDate?: Date | string;
  checkImageUrl?: string;
  status?: string;
  statusHistory?: Record<string, unknown>;
  initiatedAt: Date | string;
  initiatedBy: string;
  processedAt?: Date | string;
  settledAt?: Date | string;
  achBatchId?: string;
  achFileId?: string;
  hasErrors?: boolean;
  errorCode?: string;
  errorMessage?: string;
  errorDetails?: string;
  isReissue?: boolean;
  originalPaymentId?: string;
  reissueReason?: string;
  notes?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
}

/**
 * Input type for creating payment_records
 */
export type CreatePaymentRecords = Omit<PaymentRecords, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating payment_records
 */
export type UpdatePaymentRecords = Partial<Omit<PaymentRecords, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: payments
 */
export interface Payments {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  branchId: string;
  paymentNumber: string;
  paymentType: string;
  payerId: string;
  payerType: string;
  payerName: string;
  amount: number;
  currency?: string;
  paymentDate: Date | string;
  receivedDate: Date | string;
  depositedDate?: Date | string;
  paymentMethod: string;
  referenceNumber?: string;
  allocations?: Record<string, unknown>;
  unappliedAmount?: number;
  bankAccountId?: string;
  depositSlipNumber?: string;
  status?: string;
  statusHistory?: Record<string, unknown>;
  isReconciled?: boolean;
  reconciledDate?: Date | string;
  reconciledBy?: string;
  imageUrl?: string;
  documentIds?: Record<string, unknown>;
  notes?: string;
  internalNotes?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
  /** Flag indicating this is demo/seed data */
  isDemoData?: boolean;
}

/**
 * Input type for creating payments
 */
export type CreatePayments = Omit<Payments, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating payments
 */
export type UpdatePayments = Partial<Omit<Payments, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: portal_invitations
 */
export interface PortalInvitations {
  /** Primary key (UUID) */
  id?: string;
  familyMemberId: string;
  clientId: string;
  invitationCode: string;
  status?: string;
  sentAt?: Date | string;
  expiresAt: Date | string;
  acceptedAt?: Date | string;
  declinedAt?: Date | string;
  revokedAt?: Date | string;
  revokedBy?: string;
  revokedReason?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
}

/**
 * Input type for creating portal_invitations
 */
export type CreatePortalInvitations = Omit<PortalInvitations, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating portal_invitations
 */
export type UpdatePortalInvitations = Partial<Omit<PortalInvitations, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: programs
 */
export interface Programs {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  name: string;
  code?: string;
  description?: string;
  programType?: string;
  fundingSource?: string;
  eligibilityCriteria?: Record<string, unknown>;
  serviceTypes?: unknown[][];
  hourlyRate?: number;
  settings?: Record<string, unknown>;
  status?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
  deletedAt?: Date | string;
  deletedBy?: string;
}

/**
 * Input type for creating programs
 */
export type CreatePrograms = Omit<Programs, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating programs
 */
export type UpdatePrograms = Partial<Omit<Programs, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: progress_notes
 */
export interface ProgressNotes {
  /** Primary key (UUID) */
  id?: string;
  carePlanId: string;
  clientId: string;
  visitId?: string;
  noteType: string;
  noteDate: Date | string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  goalProgress?: Record<string, unknown>;
  observations?: Record<string, unknown>;
  concerns?: unknown[][];
  recommendations?: unknown[][];
  reviewedBy?: string;
  reviewedAt?: Date | string;
  approved?: boolean;
  attachments?: unknown[][];
  signature?: Record<string, unknown>;
  tags?: unknown[][];
  isPrivate?: boolean;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
  /** Flag indicating this is demo/seed data */
  isDemoData?: boolean;
}

/**
 * Input type for creating progress_notes
 */
export type CreateProgressNotes = Omit<ProgressNotes, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating progress_notes
 */
export type UpdateProgressNotes = Partial<Omit<ProgressNotes, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: push_notification_deliveries
 */
export interface PushNotificationDeliveries {
  /** Primary key (UUID) */
  id?: string;
  notificationId: string;
  pushTokenId: string;
  expoTicketId?: string;
  status?: string;
  errorMessage?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
}

/**
 * Input type for creating push_notification_deliveries
 */
export type CreatePushNotificationDeliveries = Omit<PushNotificationDeliveries, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating push_notification_deliveries
 */
export type UpdatePushNotificationDeliveries = Partial<Omit<PushNotificationDeliveries, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: push_notifications
 */
export interface PushNotifications {
  /** Primary key (UUID) */
  id?: string;
  deviceId?: string;
  userId: string;
  organizationId: string;
  notificationType: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  priority?: string;
  scheduledFor?: Date | string;
  status?: string;
  sentAt?: Date | string;
  deliveredAt?: Date | string;
  readAt?: Date | string;
  providerMessageId?: string;
  deliveryError?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
}

/**
 * Input type for creating push_notifications
 */
export type CreatePushNotifications = Omit<PushNotifications, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating push_notifications
 */
export type UpdatePushNotifications = Partial<Omit<PushNotifications, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: push_tokens
 */
export interface PushTokens {
  /** Primary key (UUID) */
  id?: string;
  userId: string;
  deviceToken: string;
  deviceType: string;
  deviceName?: string;
  isActive?: boolean;
  lastUsedAt?: Date | string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
}

/**
 * Input type for creating push_tokens
 */
export type CreatePushTokens = Omit<PushTokens, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating push_tokens
 */
export type UpdatePushTokens = Partial<Omit<PushTokens, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: rate_schedules
 */
export interface RateSchedules {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  branchId?: string;
  name: string;
  description?: string;
  scheduleType: string;
  payerId?: string;
  payerType?: string;
  payerName?: string;
  effectiveFrom: Date | string;
  effectiveTo?: Date | string;
  rates: Record<string, unknown>;
  status?: string;
  approvedBy?: string;
  approvedAt?: Date | string;
  notes?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
}

/**
 * Input type for creating rate_schedules
 */
export type CreateRateSchedules = Omit<RateSchedules, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating rate_schedules
 */
export type UpdateRateSchedules = Partial<Omit<RateSchedules, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: refresh_tokens
 */
export interface RefreshTokens {
  /** Primary key (UUID) */
  id?: string;
  userId: string;
  tokenHash: string;
  tokenVersion: number;
  issuedAt?: Date | string;
  expiresAt: Date | string;
  revokedAt?: Date | string;
  ipAddress?: string;
  userAgent?: string;
  lastUsedAt?: Date | string;
}

/**
 * Input type for creating refresh_tokens
 */
export type CreateRefreshTokens = Omit<RefreshTokens, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating refresh_tokens
 */
export type UpdateRefreshTokens = Partial<Omit<RefreshTokens, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: registry_check_results
 */
export interface RegistryCheckResults {
  /** Primary key (UUID) */
  id?: string;
  caregiverId: string;
  registryType: string;
  checkDate: Date | string;
  expirationDate?: Date | string;
  status: string;
  confirmationNumber?: string;
  performedBy: string;
  listingDetails?: Record<string, unknown>;
  documentPath?: string;
  notes?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
}

/**
 * Input type for creating registry_check_results
 */
export type CreateRegistryCheckResults = Omit<RegistryCheckResults, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating registry_check_results
 */
export type UpdateRegistryCheckResults = Partial<Omit<RegistryCheckResults, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: rn_delegations
 */
export interface RnDelegations {
  /** Primary key (UUID) */
  id?: string;
  carePlanId: string;
  clientId: string;
  organizationId: string;
  branchId?: string;
  delegatingRnId: string;
  delegatingRnName: string;
  delegatingRnLicense: string;
  delegatedToCaregiverId?: string;
  delegatedToCaregiverName: string;
  delegatedToCredentialType: string;
  delegatedToCredentialNumber?: string;
  taskCategory: string;
  taskDescription: string;
  specificSkillsDelegated: unknown[][];
  limitations?: unknown[][];
  trainingProvided?: boolean;
  trainingDate?: Date | string;
  trainingMethod?: string;
  competencyEvaluated?: boolean;
  competencyEvaluationDate?: Date | string;
  competencyEvaluatorId?: string;
  evaluationResult?: string;
  effectiveDate: Date | string;
  expirationDate?: Date | string;
  supervisionFrequency?: string;
  lastSupervisionDate?: Date | string;
  nextSupervisionDue?: Date | string;
  status?: string;
  revocationReason?: string;
  revokedBy?: string;
  revokedAt?: Date | string;
  ahcaDelegationFormNumber?: string;
  stateSpecificData?: Record<string, unknown>;
  notes?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
  deletedAt?: Date | string;
  deletedBy?: string;
}

/**
 * Input type for creating rn_delegations
 */
export type CreateRnDelegations = Omit<RnDelegations, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating rn_delegations
 */
export type UpdateRnDelegations = Partial<Omit<RnDelegations, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: schedule_optimizations
 */
export interface ScheduleOptimizations {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  branchId?: string;
  scheduleDate: Date | string;
  shiftIds: Record<string, unknown>;
  caregiverIds?: Record<string, unknown>;
  primaryGoal: string;
  constraints?: Record<string, unknown>;
  status?: string;
  assignments?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
  optimizationScore?: number;
  computationTimeMs?: number;
  iterations?: number;
  algorithmUsed?: string;
  applied?: boolean;
  appliedAt?: Date | string;
  appliedByUserId?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  completedAt?: Date | string;
}

/**
 * Input type for creating schedule_optimizations
 */
export type CreateScheduleOptimizations = Omit<ScheduleOptimizations, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating schedule_optimizations
 */
export type UpdateScheduleOptimizations = Partial<Omit<ScheduleOptimizations, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: schedules
 */
export interface Schedules {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  branchId: string;
  clientId: string;
  patternId: string;
  startDate: Date | string;
  endDate: Date | string;
  generatedAt?: Date | string;
  generatedBy: string;
  generationMethod: string;
  totalVisits?: number;
  scheduledVisits?: number;
  unassignedVisits?: number;
  completedVisits?: number;
  status?: string;
  notes?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
}

/**
 * Input type for creating schedules
 */
export type CreateSchedules = Omit<Schedules, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating schedules
 */
export type UpdateSchedules = Partial<Omit<Schedules, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: security_events
 */
export interface SecurityEvents {
  /** Primary key (UUID) */
  id?: string;
  type: string;
  severity: string;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  details?: Record<string, unknown>;
  /** Timestamp when record was created */
  createdAt?: Date | string;
}

/**
 * Input type for creating security_events
 */
export type CreateSecurityEvents = Omit<SecurityEvents, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating security_events
 */
export type UpdateSecurityEvents = Partial<Omit<SecurityEvents, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: service_authorizations
 */
export interface ServiceAuthorizations {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  branchId: string;
  clientId: string;
  authorizationNumber: string;
  authorizationType: string;
  payerId: string;
  payerType: string;
  payerName: string;
  serviceTypeId: string;
  serviceTypeCode: string;
  serviceTypeName: string;
  authorizedUnits: number;
  unitType: string;
  unitRate?: number;
  authorizedAmount?: number;
  effectiveFrom: Date | string;
  effectiveTo: Date | string;
  usedUnits?: number;
  remainingUnits: number;
  billedUnits?: number;
  requiresReferral?: boolean;
  referralNumber?: string;
  allowedProviders?: Record<string, unknown>;
  locationRestrictions?: string;
  status?: string;
  statusHistory?: Record<string, unknown>;
  reviewedBy?: string;
  reviewedAt?: Date | string;
  reviewNotes?: string;
  lowUnitsThreshold?: number;
  expirationWarningDays?: number;
  documentIds?: Record<string, unknown>;
  notes?: string;
  internalNotes?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
  deletedAt?: Date | string;
  deletedBy?: string;
  carePlanId?: string;
  stateJurisdiction?: string;
  serviceCodes?: unknown[][];
  unitsUsed?: number;
  stateSpecificData?: Record<string, unknown>;
  unitsRemaining?: number;
}

/**
 * Input type for creating service_authorizations
 */
export type CreateServiceAuthorizations = Omit<ServiceAuthorizations, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating service_authorizations
 */
export type UpdateServiceAuthorizations = Partial<Omit<ServiceAuthorizations, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: service_patterns
 */
export interface ServicePatterns {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  branchId: string;
  clientId: string;
  name: string;
  description?: string;
  patternType: string;
  serviceTypeId: string;
  serviceTypeName: string;
  taskTemplateIds?: Record<string, unknown>;
  recurrence: Record<string, unknown>;
  duration: number;
  flexibilityWindow?: number;
  requiredSkills?: Record<string, unknown>;
  requiredCertifications?: Record<string, unknown>;
  preferredCaregivers?: Record<string, unknown>;
  blockedCaregivers?: Record<string, unknown>;
  genderPreference?: string;
  languagePreference?: string;
  preferredTimeOfDay?: string;
  mustStartBy?: unknown;
  mustEndBy?: unknown;
  authorizedHoursPerWeek?: number;
  authorizedVisitsPerWeek?: number;
  authorizationStartDate?: Date | string;
  authorizationEndDate?: Date | string;
  fundingSourceId?: string;
  travelTimeBefore?: number;
  travelTimeAfter?: number;
  allowBackToBack?: boolean;
  status?: string;
  effectiveFrom: Date | string;
  effectiveTo?: Date | string;
  notes?: string;
  clientInstructions?: string;
  caregiverInstructions?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
  deletedAt?: Date | string;
  deletedBy?: string;
}

/**
 * Input type for creating service_patterns
 */
export type CreateServicePatterns = Omit<ServicePatterns, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating service_patterns
 */
export type UpdateServicePatterns = Partial<Omit<ServicePatterns, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: shift_requirements
 */
export interface ShiftRequirements {
  /** Primary key (UUID) */
  id?: string;
  clientId: string;
  visitId?: string;
  serviceType: string;
  startTime: Date | string;
  endTime: Date | string;
  requiredSkills?: unknown[][];
  requiredCertifications?: unknown[][];
  languagePreference?: string;
  genderPreference?: string;
  maxDistanceMiles?: number;
  state: string;
  status?: string;
  assignedCaregiverId?: string;
  createdBy: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  updatedBy?: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  deletedAt?: Date | string;
  version?: number;
}

/**
 * Input type for creating shift_requirements
 */
export type CreateShiftRequirements = Omit<ShiftRequirements, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating shift_requirements
 */
export type UpdateShiftRequirements = Partial<Omit<ShiftRequirements, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: state_aggregator_submissions
 */
export interface StateAggregatorSubmissions {
  /** Primary key (UUID) */
  id?: string;
  stateCode: string;
  evvRecordId: string;
  aggregatorId: string;
  aggregatorType: string;
  submissionPayload: Record<string, unknown>;
  submissionFormat: string;
  submittedAt?: Date | string;
  submittedBy: string;
  submissionStatus?: string;
  aggregatorResponse?: Record<string, unknown>;
  aggregatorConfirmationId?: string;
  aggregatorReceivedAt?: Date | string;
  errorCode?: string;
  errorMessage?: string;
  errorDetails?: Record<string, unknown>;
  retryCount?: number;
  maxRetries?: number;
  nextRetryAt?: Date | string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
}

/**
 * Input type for creating state_aggregator_submissions
 */
export type CreateStateAggregatorSubmissions = Omit<StateAggregatorSubmissions, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating state_aggregator_submissions
 */
export type UpdateStateAggregatorSubmissions = Partial<Omit<StateAggregatorSubmissions, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: subscriptions
 */
export interface Subscriptions {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId?: string;
  planName: string;
  billingInterval?: string;
  planAmount: number;
  currency?: string;
  clientLimit: number;
  caregiverLimit: number;
  visitLimit?: number;
  status: string;
  statusHistory?: Record<string, unknown>;
  currentPeriodStart: Date | string;
  currentPeriodEnd: Date | string;
  trialStart?: Date | string;
  trialEnd?: Date | string;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: Date | string;
  endedAt?: Date | string;
  paymentMethodId?: string;
  paymentMethodDetails?: Record<string, unknown>;
  lastInvoiceDate?: Date | string;
  lastInvoiceStatus?: string;
  metadata?: Record<string, unknown>;
  cancellationReason?: string;
  notes?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
}

/**
 * Input type for creating subscriptions
 */
export type CreateSubscriptions = Omit<Subscriptions, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating subscriptions
 */
export type UpdateSubscriptions = Partial<Omit<Subscriptions, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: sync_conflicts
 */
export interface SyncConflicts {
  /** Primary key (UUID) */
  id?: string;
  entityType: string;
  entityId: string;
  fieldName: string;
  localValue: Record<string, unknown>;
  localUpdatedAt: Date | string;
  remoteValue: Record<string, unknown>;
  remoteUpdatedAt: Date | string;
  clientVersion: number;
  serverVersion: number;
  resolutionStrategy?: string;
  resolutionStatus?: string;
  resolvedValue?: Record<string, unknown>;
  resolvedByType?: string;
  resolvedByUserId?: string;
  resolvedAt?: Date | string;
  resolutionNotes?: string;
  organizationId: string;
  metadata?: Record<string, unknown>;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
}

/**
 * Input type for creating sync_conflicts
 */
export type CreateSyncConflicts = Omit<SyncConflicts, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating sync_conflicts
 */
export type UpdateSyncConflicts = Partial<Omit<SyncConflicts, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: sync_metadata
 */
export interface SyncMetadata {
  /** Primary key (UUID) */
  id?: string;
  deviceId: string;
  userId: string;
  organizationId: string;
  entityType: string;
  entityId: string;
  operation: string;
  clientTimestamp: Date | string;
  serverTimestamp?: Date | string;
  changeData?: Record<string, unknown>;
  changeHash?: string;
  syncStatus?: string;
  conflictData?: Record<string, unknown>;
  syncError?: string;
  retryCount?: number;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
}

/**
 * Input type for creating sync_metadata
 */
export type CreateSyncMetadata = Omit<SyncMetadata, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating sync_metadata
 */
export type UpdateSyncMetadata = Partial<Omit<SyncMetadata, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: sync_queue
 */
export interface SyncQueue {
  /** Primary key (UUID) */
  id?: string;
  operationType: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  deviceId: string;
  userId: string;
  organizationId: string;
  retryCount?: number;
  maxRetries?: number;
  nextRetryAt?: Date | string;
  status?: string;
  errorMessage?: string;
  errorDetails?: Record<string, unknown>;
  priority?: number;
  clientVersion?: number;
  serverVersion?: number;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  syncedAt?: Date | string;
}

/**
 * Input type for creating sync_queue
 */
export type CreateSyncQueue = Omit<SyncQueue, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating sync_queue
 */
export type UpdateSyncQueue = Partial<Omit<SyncQueue, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: task_instances
 */
export interface TaskInstances {
  /** Primary key (UUID) */
  id?: string;
  carePlanId: string;
  templateId?: string;
  visitId?: string;
  clientId: string;
  assignedCaregiverId?: string;
  name: string;
  description: string;
  category: string;
  instructions: string;
  scheduledDate: Date | string;
  scheduledTime?: unknown;
  timeOfDay?: string;
  estimatedDuration?: number;
  status?: string;
  completedAt?: Date | string;
  completedBy?: string;
  completionNote?: string;
  completionSignature?: Record<string, unknown>;
  completionPhoto?: unknown[][];
  verificationData?: Record<string, unknown>;
  qualityCheckResponses?: Record<string, unknown>;
  skippedAt?: Date | string;
  skippedBy?: string;
  skipReason?: string;
  skipNote?: string;
  issueReported?: boolean;
  issueDescription?: string;
  issueReportedAt?: Date | string;
  issueReportedBy?: string;
  requiredSignature?: boolean;
  requiredNote?: boolean;
  customFieldValues?: Record<string, unknown>;
  notes?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
  requiresSupervision?: boolean;
  supervisorReviewRequired?: boolean;
  supervisorReviewedBy?: string;
  supervisorReviewedAt?: Date | string;
  delegationAuthorityId?: string;
  skillLevelRequired?: string;
  stateSpecificTaskData?: Record<string, unknown>;
  /** Flag indicating this is demo/seed data */
  isDemoData?: boolean;
}

/**
 * Input type for creating task_instances
 */
export type CreateTaskInstances = Omit<TaskInstances, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating task_instances
 */
export type UpdateTaskInstances = Partial<Omit<TaskInstances, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: tax_configurations
 */
export interface TaxConfigurations {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  caregiverId: string;
  federalFilingStatus: string;
  federalAllowances?: number;
  federalExtraWithholding?: number;
  federalExempt?: boolean;
  w4Step2?: boolean;
  w4Step3Dependents?: number;
  w4Step4aOtherIncome?: number;
  w4Step4bDeductions?: number;
  w4Step4cExtraWithholding?: number;
  stateFilingStatus: string;
  stateAllowances?: number;
  stateExtraWithholding?: number;
  stateExempt?: boolean;
  stateResidence: string;
  localTaxJurisdiction?: string;
  localExempt?: boolean;
  effectiveFrom: Date | string;
  effectiveTo?: Date | string;
  lastUpdated?: Date | string;
  updatedBy: string;
  w4OnFile?: boolean;
  w4FileDate?: Date | string;
  w4DocumentId?: string;
  stateFormOnFile?: boolean;
  stateFormDate?: Date | string;
  stateFormDocumentId?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  version?: number;
}

/**
 * Input type for creating tax_configurations
 */
export type CreateTaxConfigurations = Omit<TaxConfigurations, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating tax_configurations
 */
export type UpdateTaxConfigurations = Partial<Omit<TaxConfigurations, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: texas_vmur
 */
export interface TexasVmur {
  /** Primary key (UUID) */
  id?: string;
  evvRecordId: string;
  visitId: string;
  requestedBy: string;
  requestedByName: string;
  requestedAt?: Date | string;
  requestReason: string;
  requestReasonDetails: string;
  approvalStatus?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: Date | string;
  denialReason?: string;
  originalData: Record<string, unknown>;
  correctedData: Record<string, unknown>;
  changesSummary: Record<string, unknown>;
  submittedToAggregator?: boolean;
  aggregatorConfirmation?: string;
  submittedAt?: Date | string;
  expiresAt: Date | string;
  complianceNotes?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
}

/**
 * Input type for creating texas_vmur
 */
export type CreateTexasVmur = Omit<TexasVmur, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating texas_vmur
 */
export type UpdateTexasVmur = Partial<Omit<TexasVmur, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: time_entries
 */
export interface TimeEntries {
  /** Primary key (UUID) */
  id?: string;
  visitId: string;
  evvRecordId?: string;
  organizationId: string;
  caregiverId: string;
  clientId: string;
  entryType: string;
  entryTimestamp: Date | string;
  location: Record<string, unknown>;
  deviceId: string;
  deviceInfo: Record<string, unknown>;
  integrityHash: string;
  serverReceivedAt?: Date | string;
  syncMetadata: Record<string, unknown>;
  offlineRecorded?: boolean;
  offlineRecordedAt?: Date | string;
  status?: string;
  verificationPassed: boolean;
  verificationIssues?: Record<string, unknown>;
  manualOverride?: Record<string, unknown>;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
}

/**
 * Input type for creating time_entries
 */
export type CreateTimeEntries = Omit<TimeEntries, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating time_entries
 */
export type UpdateTimeEntries = Partial<Omit<TimeEntries, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: time_sheets
 */
export interface TimeSheets {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  branchId: string;
  payPeriodId: string;
  caregiverId: string;
  caregiverName: string;
  caregiverEmployeeId: string;
  timeEntries?: Record<string, unknown>;
  regularHours?: number;
  overtimeHours?: number;
  doubleTimeHours?: number;
  ptoHours?: number;
  holidayHours?: number;
  sickHours?: number;
  otherHours?: number;
  totalHours?: number;
  regularRate: number;
  overtimeRate: number;
  doubleTimeRate: number;
  regularEarnings?: number;
  overtimeEarnings?: number;
  doubleTimeEarnings?: number;
  ptoEarnings?: number;
  holidayEarnings?: number;
  sickEarnings?: number;
  otherEarnings?: number;
  grossEarnings?: number;
  bonuses?: Record<string, unknown>;
  reimbursements?: Record<string, unknown>;
  adjustments?: Record<string, unknown>;
  totalAdjustments?: number;
  totalGrossPay?: number;
  status?: string;
  statusHistory?: Record<string, unknown>;
  submittedAt?: Date | string;
  submittedBy?: string;
  approvedAt?: Date | string;
  approvedBy?: string;
  approvalNotes?: string;
  hasDiscrepancies?: boolean;
  discrepancyFlags?: Record<string, unknown>;
  evvRecordIds?: Record<string, unknown>;
  visitIds?: Record<string, unknown>;
  notes?: string;
  reviewNotes?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
  deletedAt?: Date | string;
  deletedBy?: string;
}

/**
 * Input type for creating time_sheets
 */
export type CreateTimeSheets = Omit<TimeSheets, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating time_sheets
 */
export type UpdateTimeSheets = Partial<Omit<TimeSheets, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: users
 */
export interface Users {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  username: string;
  email: string;
  passwordHash?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles?: unknown[][];
  permissions?: unknown[][];
  branchIds?: string[];
  status?: string;
  lastLoginAt?: Date | string;
  passwordChangedAt?: Date | string;
  failedLoginAttempts?: number;
  lockedUntil?: Date | string;
  settings?: Record<string, unknown>;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
  deletedAt?: Date | string;
  deletedBy?: string;
  oauthProvider?: string;
  oauthProviderId?: string;
  oauthEmailVerified?: string;
  oauthPictureUrl?: string;
  oauthLocale?: string;
  oauthLastVerifiedAt?: Date | string;
  tokenVersion?: number;
  lastPasswordChangeAt?: Date | string;
  lastFailedLoginAt?: Date | string;
  lastLoginIp?: string;
  lastLoginUserAgent?: string;
  mobilePreferences?: Record<string, unknown>;
  mobileAccessEnabled?: boolean;
  lastMobileLogin?: Date | string;
  timezone?: string;
  /** Flag indicating this is demo/seed data */
  isDemoData?: boolean;
  emailVerified?: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date | string;
}

/**
 * Input type for creating users
 */
export type CreateUsers = Omit<Users, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating users
 */
export type UpdateUsers = Partial<Omit<Users, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: visit_exceptions
 */
export interface VisitExceptions {
  /** Primary key (UUID) */
  id?: string;
  visitId: string;
  clientId: string;
  caregiverId?: string;
  exceptionType: string;
  severity: string;
  detectedAt?: Date | string;
  detectedBy?: string;
  automatic?: boolean;
  description: string;
  resolution?: string;
  resolvedAt?: Date | string;
  resolvedBy?: string;
  requiresFollowup?: boolean;
  followupAssignedTo?: string;
  status?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
}

/**
 * Input type for creating visit_exceptions
 */
export type CreateVisitExceptions = Omit<VisitExceptions, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating visit_exceptions
 */
export type UpdateVisitExceptions = Partial<Omit<VisitExceptions, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: visit_note_templates
 */
export interface VisitNoteTemplates {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  branchId?: string;
  name: string;
  description?: string;
  category?: string;
  templateText: string;
  templateHtml?: string;
  prompts?: Record<string, unknown>;
  defaultActivities?: Record<string, unknown>;
  requiresSignature?: boolean;
  requiresIncidentFlag?: boolean;
  requiresSupervisorReview?: boolean;
  usageCount?: number;
  lastUsedAt?: Date | string;
  isActive?: boolean;
  isSystemTemplate?: boolean;
  sortOrder?: number;
  version?: number;
  previousVersionId?: string;
  deletedAt?: Date | string;
  deletedBy?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  createdBy: string;
  updatedBy: string;
}

/**
 * Input type for creating visit_note_templates
 */
export type CreateVisitNoteTemplates = Omit<VisitNoteTemplates, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating visit_note_templates
 */
export type UpdateVisitNoteTemplates = Partial<Omit<VisitNoteTemplates, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: visit_notes
 */
export interface VisitNotes {
  /** Primary key (UUID) */
  id?: string;
  visitId: string;
  evvRecordId?: string;
  organizationId: string;
  caregiverId: string;
  noteType?: string;
  noteText: string;
  noteHtml?: string;
  templateId?: string;
  activitiesPerformed?: Record<string, unknown>;
  clientMood?: string;
  clientConditionNotes?: string;
  isIncident?: boolean;
  incidentSeverity?: string;
  incidentDescription?: string;
  incidentReportedAt?: Date | string;
  isVoiceNote?: boolean;
  audioFileUri?: string;
  transcriptionConfidence?: number;
  isLocked?: boolean;
  lockedAt?: Date | string;
  lockedBy?: string;
  lockReason?: string;
  isSynced?: boolean;
  syncPending?: boolean;
  syncedAt?: Date | string;
  deletedAt?: Date | string;
  deletedBy?: string;
  /** Timestamp when record was created */
  createdAt?: Date | string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  createdBy: string;
  updatedBy: string;
  requiresSignature?: boolean;
  caregiverSigned?: boolean;
  caregiverSignatureData?: string;
  caregiverSignatureUrl?: string;
  caregiverSignedAt?: Date | string;
  caregiverSignatureDevice?: string;
  caregiverSignatureIp?: string;
  clientSigned?: boolean;
  clientSignatureData?: string;
  clientSignatureUrl?: string;
  clientSignedAt?: Date | string;
  clientSignerName?: string;
  clientSignerRelationship?: string;
  clientSignatureDevice?: string;
  clientSignatureIp?: string;
  supervisorSigned?: boolean;
  supervisorSignedBy?: string;
  supervisorSignatureData?: string;
  supervisorSignatureUrl?: string;
  supervisorSignedAt?: Date | string;
  supervisorComments?: string;
}

/**
 * Input type for creating visit_notes
 */
export type CreateVisitNotes = Omit<VisitNotes, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating visit_notes
 */
export type UpdateVisitNotes = Partial<Omit<VisitNotes, 'id' | 'createdAt'>> & { id: string };

/**
 * Table: visits
 */
export interface Visits {
  /** Primary key (UUID) */
  id?: string;
  organizationId: string;
  branchId: string;
  clientId: string;
  patternId?: string;
  scheduleId?: string;
  visitNumber: string;
  visitType: string;
  serviceTypeId: string;
  serviceTypeName: string;
  scheduledDate: Date | string;
  scheduledStartTime: unknown;
  scheduledEndTime: unknown;
  scheduledDuration: number;
  timezone?: string;
  actualStartTime?: Date | string;
  actualEndTime?: Date | string;
  actualDuration?: number;
  assignedCaregiverId?: string;
  assignedAt?: Date | string;
  assignedBy?: string;
  assignmentMethod?: string;
  address: Record<string, unknown>;
  locationVerification?: Record<string, unknown>;
  taskIds?: Record<string, unknown>;
  requiredSkills?: Record<string, unknown>;
  requiredCertifications?: Record<string, unknown>;
  status?: string;
  statusHistory?: Record<string, unknown>;
  isUrgent?: boolean;
  isPriority?: boolean;
  requiresSupervision?: boolean;
  riskFlags?: Record<string, unknown>;
  verificationMethod?: string;
  verificationData?: Record<string, unknown>;
  completionNotes?: string;
  tasksCompleted?: number;
  tasksTotal?: number;
  incidentReported?: boolean;
  signatureRequired?: boolean;
  signatureCaptured?: boolean;
  signatureData?: Record<string, unknown>;
  billableHours?: number;
  billingStatus?: string;
  billingNotes?: string;
  clientInstructions?: string;
  caregiverInstructions?: string;
  internalNotes?: string;
  tags?: unknown[][];
  /** Timestamp when record was created */
  createdAt?: Date | string;
  createdBy: string;
  /** Timestamp when record was last updated */
  updatedAt?: Date | string;
  updatedBy: string;
  version?: number;
  deletedAt?: Date | string;
  deletedBy?: string;
  mobileDeviceId?: string;
  wasNoShow?: boolean;
  wasLate?: boolean;
  wasEarlyDeparture?: boolean;
  clientSatisfactionRating?: number;
  clientSatisfactionNotes?: string;
  satisfactionRecordedAt?: Date | string;
  /** Flag indicating this is demo/seed data */
  isDemoData?: boolean;
}

/**
 * Input type for creating visits
 */
export type CreateVisits = Omit<Visits, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating visits
 */
export type UpdateVisits = Partial<Omit<Visits, 'id' | 'createdAt'>> & { id: string };

/**
 * Database schema mapping
 */
export interface Database {
  abTestAssignments: AbTestAssignments;
  achBatches: AchBatches;
  assignmentProposals: AssignmentProposals;
  auditChecklistResponses: AuditChecklistResponses;
  auditEvents: AuditEvents;
  auditFindings: AuditFindings;
  auditRevisions: AuditRevision;
  auditTemplates: AuditTemplates;
  audits: Audits;
  authEvents: AuthEvents;
  billableItems: BillableItems;
  billingUsage: BillingUsage;
  branches: Branches;
  bulkMatchRequests: BulkMatchRequests;
  carePlanProgressReports: CarePlanProgressReports;
  carePlans: CarePlans;
  caregiverDeductions: CaregiverDeductions;
  caregiverPerformanceMetrics: CaregiverPerformanceMetrics;
  caregiverPreferenceProfiles: CaregiverPreferenceProfiles;
  caregiverServiceAuthorizations: CaregiverServiceAuthorizations;
  caregiverStateScreenings: CaregiverStateScreenings;
  caregivers: Caregivers;
  claims: Claims;
  clientAccessAudit: ClientAccessAudit;
  clientAuthorizations: ClientAuthorizations;
  clientCarePlanAccessLogs: ClientCarePlanAccessLogs;
  clientCaregiverPairings: ClientCaregiverPairings;
  clientPortalAccess: ClientPortalAccess;
  clientPortalPreferences: ClientPortalPreferences;
  clientPortalSessions: ClientPortalSessions;
  clientScheduleChangeRequests: ClientScheduleChangeRequests;
  clientVideoCallSessions: ClientVideoCallSessions;
  clientVisitRatings: ClientVisitRatings;
  clients: Clients;
  clinicalVisitNotes: ClinicalVisitNotes;
  complianceDeadlines: ComplianceDeadlines;
  correctiveActions: CorrectiveActions;
  domainMappings: DomainMappings;
  emailTemplates: EmailTemplates;
  evvAccessLog: EvvAccessLog;
  evvExceptionQueue: EvvExceptionQueue;
  evvOriginalData: EvvOriginalData;
  evvRecords: EvvRecords;
  evvRevisions: EvvRevision;
  evvStateConfig: EvvStateConfig;
  evvStateValidationRules: EvvStateValidationRules;
  familyActivityFeed: FamilyActivityFeed;
  familyConsent: FamilyConsent;
  familyMembers: FamilyMembers;
  familyNotifications: FamilyNotifications;
  familyVisitSummaries: FamilyVisitSummaries;
  featureFlags: FeatureFlags;
  geofences: Geofences;
  incidents: Incidents;
  inviteTokens: InviteTokens;
  invoices: Invoices;
  knexMigrations: KnexMigrations;
  knexMigrationsLock: KnexMigrationsLock;
  matchHistory: MatchHistory;
  matchingConfigurations: MatchingConfigurations;
  medicationAdministrations: MedicationAdministrations;
  medications: Medications;
  messageThreads: MessageThreads;
  messages: Messages;
  mlModels: MlModels;
  mlPredictions: MlPredictions;
  mlTrainingData: MlTrainingData;
  mobileDevices: MobileDevices;
  openShifts: OpenShifts;
  organizationBranding: OrganizationBranding;
  organizations: Organizations;
  payPeriods: PayPeriods;
  payRuns: PayRuns;
  payStubs: PayStubs;
  payers: Payers;
  paymentRecords: PaymentRecords;
  payments: Payments;
  portalInvitations: PortalInvitations;
  programs: Programs;
  progressNotes: ProgressNotes;
  pushNotificationDeliveries: PushNotificationDeliveries;
  pushNotifications: PushNotifications;
  pushTokens: PushTokens;
  rateSchedules: RateSchedules;
  refreshTokens: RefreshTokens;
  registryCheckResults: RegistryCheckResults;
  rnDelegations: RnDelegations;
  scheduleOptimizations: ScheduleOptimizations;
  schedules: Schedules;
  securityEvents: SecurityEvents;
  serviceAuthorizations: ServiceAuthorizations;
  servicePatterns: ServicePatterns;
  shiftRequirements: ShiftRequirements;
  stateAggregatorSubmissions: StateAggregatorSubmissions;
  subscriptions: Subscriptions;
  syncConflicts: SyncConflicts;
  syncMetadata: SyncMetadata;
  syncQueue: SyncQueue;
  taskInstances: TaskInstances;
  taxConfigurations: TaxConfigurations;
  texasVmur: TexasVmur;
  timeEntries: TimeEntries;
  timeSheets: TimeSheets;
  users: Users;
  visitExceptions: VisitExceptions;
  visitNoteTemplates: VisitNoteTemplates;
  visitNotes: VisitNotes;
  visits: Visits;
}
