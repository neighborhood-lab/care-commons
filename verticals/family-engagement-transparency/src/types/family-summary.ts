/**
 * Family Progress Summary Types
 *
 * Types for family-friendly progress summaries and updates
 */

/**
 * Summary types for different time periods and events
 */
export type SummaryType =
  | 'DAILY'     // Daily update
  | 'WEEKLY'    // Weekly summary
  | 'MONTHLY'   // Monthly report
  | 'INCIDENT'  // Incident report
  | 'MILESTONE' // Milestone achievement
  | 'AD_HOC';   // Special update

/**
 * Overall status indicator
 */
export type OverallStatus =
  | 'EXCELLENT'        // Client doing exceptionally well
  | 'GOOD'            // Good progress
  | 'STABLE'          // Maintaining current status
  | 'NEEDS_ATTENTION' // Some concerns
  | 'CONCERNING';     // Significant concerns

/**
 * Delivery status of summary
 */
export type SummaryDeliveryStatus =
  | 'DRAFT'          // Being prepared
  | 'PENDING_REVIEW' // Awaiting coordinator review
  | 'APPROVED'       // Approved for sending
  | 'SENT'          // Sent to family
  | 'READ';         // Read by at least one family member

/**
 * Activity completed during the period
 */
export interface CompletedActivity {
  name: string;
  description: string;
  completedAt: Date;
  duration?: number; // Minutes
  notes?: string;
  caregiverName?: string;
}

/**
 * Goal progress update in family-friendly language
 */
export interface GoalUpdate {
  goalId: string;
  goalName: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'ON_TRACK' | 'AT_RISK' | 'ACHIEVED';
  progressDescription: string; // Plain language description
  progressPercentage?: number;
  achievements?: string[]; // Specific achievements
  challenges?: string[];    // Any challenges encountered
  nextSteps?: string[];     // What comes next
}

/**
 * Health observation in non-clinical terms
 */
export interface HealthObservation {
  category: 'PHYSICAL' | 'COGNITIVE' | 'EMOTIONAL' | 'SOCIAL' | 'NUTRITION' | 'SLEEP';
  observation: string;
  severity?: 'POSITIVE' | 'NORMAL' | 'MINOR_CONCERN' | 'CONCERN';
  date: Date;
  notes?: string;
}

/**
 * Safety note or update
 */
export interface SafetyNote {
  category: 'FALL_RISK' | 'MEDICATION' | 'MOBILITY' | 'ENVIRONMENT' | 'GENERAL';
  note: string;
  severity: 'INFO' | 'MINOR' | 'MODERATE' | 'SERIOUS';
  actionTaken?: string;
  date: Date;
}

/**
 * Mood and behavior observation
 */
export interface MoodBehaviorObservation {
  mood: 'EXCELLENT' | 'GOOD' | 'NEUTRAL' | 'LOW' | 'CONCERNING';
  behavior: 'ENGAGED' | 'COOPERATIVE' | 'WITHDRAWN' | 'AGITATED' | 'VARIABLE';
  description: string;
  triggers?: string[];
  positiveFactors?: string[];
  date: Date;
}

/**
 * Photo attachment with metadata
 */
export interface PhotoAttachment {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  takenAt: Date;
  takenBy?: string;
  category?: 'ACTIVITY' | 'MILESTONE' | 'SOCIAL' | 'ENVIRONMENT' | 'OTHER';
  consentObtained: boolean;
}

/**
 * Document or file attachment
 */
export interface DocumentAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  description?: string;
  uploadedAt: Date;
  uploadedBy?: string;
}

/**
 * Read status tracking
 */
export interface ReadStatus {
  contactId: string;
  contactName: string;
  readAt: Date;
}

/**
 * Family Progress Summary entity
 */
export interface FamilyProgressSummary {
  // Identity
  id: string;
  clientId: string;
  organizationId: string;
  carePlanId?: string;
  progressNoteId?: string;

  // Summary details
  summaryType: SummaryType;
  summaryDate: Date;
  dateRange?: {
    start: Date;
    end: Date;
  };

  // Content
  title: string;
  summary: string;
  highlights?: string;
  areasOfFocus?: string;
  activitiesCompleted?: CompletedActivity[];

  // Progress indicators
  goalUpdates?: GoalUpdate[];
  overallStatus?: OverallStatus;
  engagementScore?: number; // 1-10
  wellbeingScore?: number;  // 1-10

  // Health & safety
  healthObservations?: HealthObservation[];
  safetyNotes?: SafetyNote[];
  moodBehavior?: MoodBehaviorObservation[];

  // Care team insights
  caregiverNotes?: string;
  coordinatorNotes?: string;
  recommendations?: string[];

  // Multimedia
  photos?: PhotoAttachment[];
  attachments?: DocumentAttachment[];

  // Visibility & approval
  visibleToFamily: boolean;
  requiresReview: boolean;
  reviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;

  // Delivery tracking
  deliveryStatus: SummaryDeliveryStatus;
  sentAt?: Date;
  sentTo?: string[]; // Array of family contact IDs
  readBy?: ReadStatus[];

  // Audit fields
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  version: number;
}

/**
 * Create family progress summary input
 */
export interface CreateFamilySummaryInput {
  clientId: string;
  organizationId: string;
  carePlanId?: string;
  progressNoteId?: string;

  // Summary details
  summaryType: SummaryType;
  summaryDate: Date;
  dateRange?: {
    start: Date;
    end: Date;
  };

  // Content
  title: string;
  summary: string;
  highlights?: string;
  areasOfFocus?: string;
  activitiesCompleted?: CompletedActivity[];

  // Progress indicators
  goalUpdates?: GoalUpdate[];
  overallStatus?: OverallStatus;
  engagementScore?: number;
  wellbeingScore?: number;

  // Health & safety
  healthObservations?: HealthObservation[];
  safetyNotes?: SafetyNote[];
  moodBehavior?: MoodBehaviorObservation[];

  // Care team insights
  caregiverNotes?: string;
  coordinatorNotes?: string;
  recommendations?: string[];

  // Multimedia
  photos?: PhotoAttachment[];
  attachments?: DocumentAttachment[];

  // Visibility
  visibleToFamily?: boolean;
  requiresReview?: boolean;
}

/**
 * Update family progress summary input
 */
export interface UpdateFamilySummaryInput {
  // Content updates
  title?: string;
  summary?: string;
  highlights?: string;
  areasOfFocus?: string;
  activitiesCompleted?: CompletedActivity[];

  // Progress updates
  goalUpdates?: GoalUpdate[];
  overallStatus?: OverallStatus;
  engagementScore?: number;
  wellbeingScore?: number;

  // Health & safety
  healthObservations?: HealthObservation[];
  safetyNotes?: SafetyNote[];
  moodBehavior?: MoodBehaviorObservation[];

  // Care team insights
  caregiverNotes?: string;
  coordinatorNotes?: string;
  recommendations?: string[];

  // Multimedia
  photos?: PhotoAttachment[];
  attachments?: DocumentAttachment[];

  // Visibility & approval
  visibleToFamily?: boolean;
  requiresReview?: boolean;
  reviewNotes?: string;

  // Delivery
  deliveryStatus?: SummaryDeliveryStatus;
}

/**
 * Search criteria for family summaries
 */
export interface FamilySummarySearchCriteria {
  organizationId?: string;
  clientId?: string;
  carePlanId?: string;
  summaryType?: SummaryType[];
  overallStatus?: OverallStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  visibleToFamily?: boolean;
  deliveryStatus?: SummaryDeliveryStatus[];
  requiresReview?: boolean;
  reviewed?: boolean;
  searchText?: string;
}

/**
 * Summary statistics for a client
 */
export interface SummaryStatistics {
  clientId: string;
  totalSummaries: number;
  summariesByType: Record<SummaryType, number>;
  averageEngagementScore?: number;
  averageWellbeingScore?: number;
  lastSummaryDate?: Date;
  nextSummaryDue?: Date;
  unreadCount: number;
  pendingReviewCount: number;
}

/**
 * Family summary with related data
 */
export interface FamilySummaryWithDetails extends FamilyProgressSummary {
  client: {
    id: string;
    firstName: string;
    lastName: string;
  };
  carePlan?: {
    id: string;
    name: string;
  };
  reviewedByUser?: {
    id: string;
    name: string;
  };
}
