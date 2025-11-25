/**
 * Compliance Autopilot Types
 * 
 * Types for the proactive compliance monitoring and alerting system.
 * Tracks deadlines for credentials, authorizations, care plans, and training.
 */

import { UUID, StateCode } from '../../types/base.js';

/**
 * Priority level for compliance alerts
 */
export type AlertPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

/**
 * Status of a compliance deadline
 */
export type DeadlineStatus = 
  | 'CURRENT'        // No action needed
  | 'UPCOMING'       // Within warning period
  | 'DUE_SOON'       // Within urgent period
  | 'OVERDUE'        // Past deadline
  | 'BLOCKED';       // Action blocked due to non-compliance

/**
 * Category of compliance requirement
 */
export type ComplianceDeadlineCategory =
  | 'CAREGIVER_CREDENTIAL'
  | 'CAREGIVER_TRAINING'
  | 'CAREGIVER_BACKGROUND_CHECK'
  | 'CAREGIVER_HEALTH_SCREENING'
  | 'CLIENT_AUTHORIZATION'
  | 'CLIENT_CARE_PLAN'
  | 'CLIENT_PHYSICIAN_ORDERS'
  | 'CLIENT_ASSESSMENT'
  | 'EVV_SUBMISSION'
  | 'INCIDENT_REPORT'
  | 'RN_SUPERVISION'
  | 'HIPAA_TRAINING'
  | 'OTHER';

/**
 * Entity type that the deadline applies to
 */
export type DeadlineEntityType = 
  | 'CAREGIVER'
  | 'CLIENT'
  | 'CARE_PLAN'
  | 'VISIT'
  | 'ORGANIZATION';

/**
 * A compliance deadline that needs tracking
 */
export interface ComplianceDeadline {
  id: UUID;
  organizationId: UUID;
  
  // Entity reference
  entityType: DeadlineEntityType;
  entityId: UUID;
  entityName: string;  // Human-readable name (caregiver name, client name, etc.)
  
  // Deadline details
  category: ComplianceDeadlineCategory;
  title: string;
  description: string;
  
  // Dates
  deadlineDate: Date;
  warningDate: Date;     // When to start warning (e.g., 30 days before)
  urgentDate: Date;      // When to escalate (e.g., 7 days before)
  
  // Status
  status: DeadlineStatus;
  priority: AlertPriority;
  
  // State-specific
  stateCode?: StateCode;
  regulation?: string;   // Regulatory citation
  
  // Resolution
  resolvedAt?: Date;
  resolvedBy?: UUID;
  resolutionNote?: string;
  
  // Actions
  actionUrl?: string;    // Link to resolve the issue
  actionLabel?: string;  // Button text
  
  // Auto-blocking
  blocksScheduling: boolean;  // If true, prevents scheduling when overdue
  blocksAssignment: boolean;  // If true, prevents caregiver assignment when overdue
  
  // Notification tracking
  lastNotifiedAt?: Date;
  notificationCount: number;
  
  // Metadata
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Alert configuration for different deadline types
 */
export interface AlertConfiguration {
  category: ComplianceDeadlineCategory;
  warningDays: number;      // Days before deadline to start warning
  urgentDays: number;       // Days before deadline for urgent alert
  blocksScheduling: boolean;
  blocksAssignment: boolean;
  notificationFrequency: 'DAILY' | 'WEEKLY' | 'ONCE';
  emailNotification: boolean;
  smsNotification: boolean;
  dashboardAlert: boolean;
}

/**
 * Default alert configurations by category
 */
export const DEFAULT_ALERT_CONFIGS: Record<ComplianceDeadlineCategory, AlertConfiguration> = {
  CAREGIVER_CREDENTIAL: {
    category: 'CAREGIVER_CREDENTIAL',
    warningDays: 30,
    urgentDays: 7,
    blocksScheduling: true,
    blocksAssignment: true,
    notificationFrequency: 'DAILY',
    emailNotification: true,
    smsNotification: false,
    dashboardAlert: true,
  },
  CAREGIVER_TRAINING: {
    category: 'CAREGIVER_TRAINING',
    warningDays: 30,
    urgentDays: 14,
    blocksScheduling: false,
    blocksAssignment: false,
    notificationFrequency: 'WEEKLY',
    emailNotification: true,
    smsNotification: false,
    dashboardAlert: true,
  },
  CAREGIVER_BACKGROUND_CHECK: {
    category: 'CAREGIVER_BACKGROUND_CHECK',
    warningDays: 60,
    urgentDays: 30,
    blocksScheduling: true,
    blocksAssignment: true,
    notificationFrequency: 'DAILY',
    emailNotification: true,
    smsNotification: false,
    dashboardAlert: true,
  },
  CAREGIVER_HEALTH_SCREENING: {
    category: 'CAREGIVER_HEALTH_SCREENING',
    warningDays: 30,
    urgentDays: 14,
    blocksScheduling: false,
    blocksAssignment: false,
    notificationFrequency: 'WEEKLY',
    emailNotification: true,
    smsNotification: false,
    dashboardAlert: true,
  },
  CLIENT_AUTHORIZATION: {
    category: 'CLIENT_AUTHORIZATION',
    warningDays: 14,
    urgentDays: 7,
    blocksScheduling: true,
    blocksAssignment: false,
    notificationFrequency: 'DAILY',
    emailNotification: true,
    smsNotification: false,
    dashboardAlert: true,
  },
  CLIENT_CARE_PLAN: {
    category: 'CLIENT_CARE_PLAN',
    warningDays: 14,
    urgentDays: 7,
    blocksScheduling: false,
    blocksAssignment: false,
    notificationFrequency: 'DAILY',
    emailNotification: true,
    smsNotification: false,
    dashboardAlert: true,
  },
  CLIENT_PHYSICIAN_ORDERS: {
    category: 'CLIENT_PHYSICIAN_ORDERS',
    warningDays: 30,
    urgentDays: 14,
    blocksScheduling: false,
    blocksAssignment: false,
    notificationFrequency: 'WEEKLY',
    emailNotification: true,
    smsNotification: false,
    dashboardAlert: true,
  },
  CLIENT_ASSESSMENT: {
    category: 'CLIENT_ASSESSMENT',
    warningDays: 30,
    urgentDays: 14,
    blocksScheduling: false,
    blocksAssignment: false,
    notificationFrequency: 'WEEKLY',
    emailNotification: true,
    smsNotification: false,
    dashboardAlert: true,
  },
  EVV_SUBMISSION: {
    category: 'EVV_SUBMISSION',
    warningDays: 3,
    urgentDays: 1,
    blocksScheduling: false,
    blocksAssignment: false,
    notificationFrequency: 'DAILY',
    emailNotification: true,
    smsNotification: true,
    dashboardAlert: true,
  },
  INCIDENT_REPORT: {
    category: 'INCIDENT_REPORT',
    warningDays: 3,
    urgentDays: 1,
    blocksScheduling: false,
    blocksAssignment: false,
    notificationFrequency: 'DAILY',
    emailNotification: true,
    smsNotification: true,
    dashboardAlert: true,
  },
  RN_SUPERVISION: {
    category: 'RN_SUPERVISION',
    warningDays: 14,
    urgentDays: 7,
    blocksScheduling: false,
    blocksAssignment: false,
    notificationFrequency: 'DAILY',
    emailNotification: true,
    smsNotification: false,
    dashboardAlert: true,
  },
  HIPAA_TRAINING: {
    category: 'HIPAA_TRAINING',
    warningDays: 30,
    urgentDays: 14,
    blocksScheduling: false,
    blocksAssignment: false,
    notificationFrequency: 'WEEKLY',
    emailNotification: true,
    smsNotification: false,
    dashboardAlert: true,
  },
  OTHER: {
    category: 'OTHER',
    warningDays: 14,
    urgentDays: 7,
    blocksScheduling: false,
    blocksAssignment: false,
    notificationFrequency: 'WEEKLY',
    emailNotification: true,
    smsNotification: false,
    dashboardAlert: true,
  },
};

/**
 * Authorization usage tracking
 */
export interface AuthorizationUsage {
  authorizationId: UUID;
  clientId: UUID;
  clientName: string;
  authorizationNumber: string;
  
  // Units
  totalUnits: number;
  usedUnits: number;
  remainingUnits: number;
  usagePercentage: number;
  
  // Dates
  startDate: Date;
  endDate: Date;
  daysRemaining: number;
  
  // Status
  status: 'HEALTHY' | 'WARNING_80' | 'WARNING_90' | 'EXHAUSTED' | 'EXPIRED';
  
  // Projected usage
  averageUnitsPerDay: number;
  projectedExhaustionDate?: Date;
  
  // Alert
  alertMessage?: string;
}

/**
 * Credential status for a caregiver
 */
export interface CaregiverCredentialStatus {
  caregiverId: UUID;
  caregiverName: string;
  
  // Overall status
  overallStatus: 'COMPLIANT' | 'EXPIRING_SOON' | 'EXPIRED' | 'MISSING_REQUIRED';
  
  // Individual credentials
  credentials: {
    type: string;
    name: string;
    status: 'CURRENT' | 'EXPIRING_SOON' | 'EXPIRED' | 'MISSING';
    expirationDate?: Date;
    daysUntilExpiration?: number;
    required: boolean;
  }[];
  
  // Background check
  backgroundCheck?: {
    status: 'CURRENT' | 'EXPIRING_SOON' | 'EXPIRED' | 'MISSING';
    checkDate?: Date;
    expirationDate?: Date;
    daysUntilExpiration?: number;
  };
  
  // Training
  trainingStatus: {
    annualHoursRequired: number;
    annualHoursCompleted: number;
    hipaaTrainingCurrent: boolean;
    lastHipaaTrainingDate?: Date;
  };
  
  // Scheduling eligibility
  canBeScheduled: boolean;
  blockingIssues: string[];
}

/**
 * Compliance dashboard summary
 */
export interface ComplianceDashboardSummary {
  organizationId: UUID;
  generatedAt: Date;
  
  // Overall health
  overallScore: number;  // 0-100
  overallStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  
  // Deadline counts by status
  deadlineCounts: {
    overdue: number;
    dueSoon: number;
    upcoming: number;
    current: number;
  };
  
  // By category
  categoryBreakdown: {
    category: ComplianceDeadlineCategory;
    total: number;
    overdue: number;
    dueSoon: number;
    upcoming: number;
  }[];
  
  // Critical items requiring immediate attention
  criticalItems: ComplianceDeadline[];
  
  // Caregiver compliance
  caregiverCompliance: {
    total: number;
    compliant: number;
    expiringSoon: number;
    expired: number;
    blocked: number;
  };
  
  // Authorization usage
  authorizationAlerts: AuthorizationUsage[];
  
  // Upcoming deadlines (next 7 days)
  upcomingDeadlines: ComplianceDeadline[];
}

/**
 * Request to create/update a compliance deadline
 */
export interface CreateDeadlineRequest {
  entityType: DeadlineEntityType;
  entityId: UUID;
  entityName: string;
  category: ComplianceDeadlineCategory;
  title: string;
  description: string;
  deadlineDate: Date;
  stateCode?: StateCode;
  regulation?: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Request to resolve a compliance deadline
 */
export interface ResolveDeadlineRequest {
  deadlineId: UUID;
  resolutionNote?: string;
  newDeadlineDate?: Date;  // For recurring deadlines, set the next deadline
}

/**
 * Audit report for compliance review
 */
export interface ComplianceAuditReport {
  organizationId: UUID;
  generatedAt: Date;
  reportPeriod: {
    startDate: Date;
    endDate: Date;
  };
  
  // Caregiver credentials
  caregiverCredentialReport: {
    totalCaregivers: number;
    compliantCaregivers: number;
    credentialExpirations: {
      caregiverId: UUID;
      caregiverName: string;
      credentialType: string;
      expirationDate: Date;
      status: string;
    }[];
    backgroundCheckExpirations: {
      caregiverId: UUID;
      caregiverName: string;
      expirationDate: Date;
      status: string;
    }[];
  };
  
  // Client authorizations
  authorizationReport: {
    totalClients: number;
    authorizationsExpired: number;
    authorizationsExhausted: number;
    authorizationDetails: AuthorizationUsage[];
  };
  
  // Care plan reviews
  carePlanReport: {
    totalCarePlans: number;
    reviewsOverdue: number;
    reviewsDueSoon: number;
    overdueDetails: {
      clientId: UUID;
      clientName: string;
      carePlanId: UUID;
      lastReviewDate: Date;
      dueDate: Date;
    }[];
  };
  
  // EVV compliance
  evvReport: {
    totalVisits: number;
    compliantVisits: number;
    complianceRate: number;
    submissionsPending: number;
    submissionsOverdue: number;
  };
  
  // Historical compliance
  complianceHistory: {
    date: Date;
    overallScore: number;
    overdueCount: number;
  }[];
}

/**
 * Category labels for display
 */
export const DEADLINE_CATEGORY_LABELS: Record<ComplianceDeadlineCategory, string> = {
  CAREGIVER_CREDENTIAL: 'Caregiver Credential',
  CAREGIVER_TRAINING: 'Caregiver Training',
  CAREGIVER_BACKGROUND_CHECK: 'Background Check',
  CAREGIVER_HEALTH_SCREENING: 'Health Screening',
  CLIENT_AUTHORIZATION: 'Service Authorization',
  CLIENT_CARE_PLAN: 'Care Plan Review',
  CLIENT_PHYSICIAN_ORDERS: 'Physician Orders',
  CLIENT_ASSESSMENT: 'Client Assessment',
  EVV_SUBMISSION: 'EVV Submission',
  INCIDENT_REPORT: 'Incident Report',
  RN_SUPERVISION: 'RN Supervision Visit',
  HIPAA_TRAINING: 'HIPAA Training',
  OTHER: 'Other',
};

/**
 * Priority labels and colors
 */
export const PRIORITY_CONFIG: Record<AlertPriority, { label: string; color: string }> = {
  CRITICAL: { label: 'Critical', color: 'red' },
  HIGH: { label: 'High', color: 'orange' },
  MEDIUM: { label: 'Medium', color: 'yellow' },
  LOW: { label: 'Low', color: 'blue' },
  INFO: { label: 'Info', color: 'gray' },
};

/**
 * Status labels and colors
 */
export const STATUS_CONFIG: Record<DeadlineStatus, { label: string; color: string }> = {
  CURRENT: { label: 'Current', color: 'green' },
  UPCOMING: { label: 'Upcoming', color: 'blue' },
  DUE_SOON: { label: 'Due Soon', color: 'yellow' },
  OVERDUE: { label: 'Overdue', color: 'red' },
  BLOCKED: { label: 'Blocked', color: 'red' },
};
