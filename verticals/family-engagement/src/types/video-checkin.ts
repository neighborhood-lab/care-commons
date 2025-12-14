/**
 * @folkcare/family-engagement - Video Check-in Types
 *
 * Video Check-in Capability
 *
 * Types for optional video calls between families and patients during visits,
 * allowing remote family members to connect with their loved ones.
 */

import type { Entity, UUID } from '@folkcare/core';

// ============================================================================
// Video Call Types
// ============================================================================

/**
 * Status of a video call session
 */
export type VideoCallStatus =
  | 'SCHEDULED'      // Call is scheduled for future
  | 'WAITING'        // Host is waiting for participants
  | 'IN_PROGRESS'    // Call is active
  | 'COMPLETED'      // Call ended normally
  | 'CANCELLED'      // Call was cancelled before starting
  | 'MISSED'         // Scheduled call was not answered
  | 'FAILED';        // Technical failure

/**
 * Type of video call
 */
export type VideoCallType =
  | 'SCHEDULED_CHECKIN'  // Pre-scheduled family check-in during visit
  | 'ON_DEMAND'          // Spontaneous call during visit
  | 'RECURRING'          // Part of a recurring schedule
  | 'EMERGENCY';         // Urgent family communication

/**
 * Participant role in video call
 */
export type ParticipantRole =
  | 'HOST'           // Initiator (usually caregiver)
  | 'FAMILY'         // Family member
  | 'CLIENT'         // Patient/client
  | 'CAREGIVER'      // Professional caregiver
  | 'COORDINATOR';   // Care coordinator

/**
 * Participant status in video call
 */
export type ParticipantStatus =
  | 'INVITED'        // Received invite, not yet joined
  | 'JOINING'        // Currently connecting
  | 'CONNECTED'      // In the call
  | 'DISCONNECTED'   // Left or dropped
  | 'DECLINED'       // Declined to join
  | 'NO_SHOW';       // Never joined scheduled call

/**
 * Quality rating for a video call
 */
export type CallQualityRating =
  | 'EXCELLENT'
  | 'GOOD'
  | 'FAIR'
  | 'POOR';

/**
 * Video call session
 */
export interface VideoCall extends Entity {
  // Call identification
  sessionId: string;         // Unique session ID for video provider

  // Context
  clientId: UUID;            // Patient being visited
  visitId?: UUID;            // Associated visit (if during scheduled visit)

  // Call details
  callType: VideoCallType;
  status: VideoCallStatus;
  title?: string;            // Optional title (e.g., "Weekly Family Check-in")

  // Scheduling
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  durationMinutes?: number;

  // Recurrence (for recurring calls)
  isRecurring: boolean;
  recurringScheduleId?: UUID;
  recurrenceRule?: string;   // RRULE format

  // Host info
  hostUserId: UUID;
  hostRole: ParticipantRole;

  // Connection details
  roomUrl?: string;          // Video room URL
  joinCode?: string;         // Easy join code
  passwordProtected: boolean;
  roomPassword?: string;

  // Technical info
  provider: string;          // Video provider (e.g., "daily", "twilio")
  maxParticipants: number;
  recordingEnabled: boolean;
  recordingUrl?: string;

  // Quality metrics
  qualityRating?: CallQualityRating;
  averageLatency?: number;   // In milliseconds
  packetLoss?: number;       // Percentage

  // Notes
  notes?: string;            // Caregiver notes about the call
  familyVisibleNotes?: string; // Notes visible to family

  // Organization context
  organizationId: UUID;
  branchId: UUID;
}

/**
 * Participant in a video call
 */
export interface VideoCallParticipant extends Entity {
  videoCallId: UUID;
  userId: UUID;
  role: ParticipantRole;
  status: ParticipantStatus;

  // Family member link (if role is FAMILY)
  familyMemberId?: UUID;

  // Connection
  invitedAt: string;
  joinedAt?: string;
  leftAt?: string;
  connectionDurationSeconds?: number;

  // Device info
  deviceType?: 'MOBILE' | 'TABLET' | 'DESKTOP' | 'UNKNOWN';
  browserType?: string;

  // Quality feedback from participant
  qualityRating?: CallQualityRating;
  feedbackNotes?: string;

  // Technical issues
  hadTechnicalIssues: boolean;
  technicalIssueNotes?: string;
}

/**
 * Recurring video call schedule
 */
export interface RecurringVideoSchedule extends Entity {
  clientId: UUID;

  // Schedule details
  title: string;
  description?: string;
  recurrenceRule: string;    // RRULE format (e.g., "FREQ=WEEKLY;BYDAY=SU;BYHOUR=14")
  duration: number;          // Duration in minutes

  // Active dates
  startDate: string;         // ISO date YYYY-MM-DD
  endDate?: string;          // End date for recurring schedule
  isActive: boolean;

  // Default participants
  defaultParticipants: Array<{
    userId?: UUID;
    familyMemberId?: UUID;
    role: ParticipantRole;
    email?: string;
  }>;

  // Settings
  autoCreateSession: boolean; // Auto-create video session before scheduled time
  reminderMinutesBefore: number[];
  maxParticipants: number;
  recordingEnabled: boolean;

  // Created by
  createdByUserId: UUID;

  // Organization context
  organizationId: UUID;
  branchId: UUID;
}

/**
 * Video call invitation
 */
export interface VideoCallInvitation extends Entity {
  videoCallId: UUID;
  participantId: UUID;

  // Recipient info
  recipientUserId?: UUID;
  recipientEmail: string;
  recipientPhone?: string;
  recipientName: string;

  // Invitation details
  invitationType: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  sentAt: string;
  openedAt?: string;
  respondedAt?: string;
  response?: 'ACCEPTED' | 'DECLINED' | 'TENTATIVE';

  // Join info
  joinUrl: string;
  joinCode: string;
  expiresAt: string;

  // Reminders
  remindersSent: number;
  lastReminderAt?: string;
}

// ============================================================================
// Input Types
// ============================================================================

/**
 * Input for scheduling a video call
 */
export interface ScheduleVideoCallInput {
  clientId: UUID;
  visitId?: UUID;
  callType: VideoCallType;
  title?: string;
  scheduledStartTime: string;  // ISO timestamp
  durationMinutes: number;
  participants: Array<{
    userId?: UUID;
    familyMemberId?: UUID;
    email: string;
    role: ParticipantRole;
  }>;
  recordingEnabled?: boolean;
  notes?: string;
  organizationId: UUID;
  branchId: UUID;
}

/**
 * Input for starting an on-demand video call
 */
export interface StartVideoCallInput {
  clientId: UUID;
  visitId?: UUID;
  title?: string;
  participants: Array<{
    userId?: UUID;
    familyMemberId?: UUID;
    email: string;
    role: ParticipantRole;
  }>;
  recordingEnabled?: boolean;
  organizationId: UUID;
  branchId: UUID;
}

/**
 * Input for creating recurring video schedule
 */
export interface CreateRecurringScheduleInput {
  clientId: UUID;
  title: string;
  description?: string;
  recurrenceRule: string;
  duration: number;
  startDate: string;
  endDate?: string;
  defaultParticipants: Array<{
    userId?: UUID;
    familyMemberId?: UUID;
    role: ParticipantRole;
    email?: string;
  }>;
  reminderMinutesBefore?: number[];
  maxParticipants?: number;
  recordingEnabled?: boolean;
  organizationId: UUID;
  branchId: UUID;
}

/**
 * Input for updating a video call
 */
export interface UpdateVideoCallInput {
  title?: string;
  scheduledStartTime?: string;
  durationMinutes?: number;
  recordingEnabled?: boolean;
  notes?: string;
  familyVisibleNotes?: string;
}

/**
 * Input for ending a video call
 */
export interface EndVideoCallInput {
  notes?: string;
  qualityRating?: CallQualityRating;
}

/**
 * Input for participant feedback
 */
export interface ParticipantFeedbackInput {
  qualityRating?: CallQualityRating;
  feedbackNotes?: string;
  hadTechnicalIssues?: boolean;
  technicalIssueNotes?: string;
}

/**
 * Input for sending invitation
 */
export interface SendInvitationInput {
  videoCallId: UUID;
  recipientUserId?: UUID;
  recipientFamilyMemberId?: UUID;
  recipientEmail: string;
  recipientPhone?: string;
  recipientName: string;
  invitationType: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
}

// ============================================================================
// Query Types
// ============================================================================

/**
 * Filters for querying video calls
 */
export interface VideoCallFilters {
  clientId?: UUID;
  visitId?: UUID;
  hostUserId?: UUID;
  status?: VideoCallStatus | VideoCallStatus[];
  callType?: VideoCallType | VideoCallType[];
  scheduledFrom?: string;
  scheduledTo?: string;
  organizationId?: UUID;
  branchId?: UUID;
}

/**
 * Filters for querying recurring schedules
 */
export interface RecurringScheduleFilters {
  clientId?: UUID;
  isActive?: boolean;
  createdByUserId?: UUID;
  organizationId?: UUID;
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Video call with participant details
 */
export interface VideoCallWithParticipants extends VideoCall {
  participants: Array<VideoCallParticipant & {
    userName?: string;
    familyMemberName?: string;
  }>;
}

/**
 * Join info for a video call
 */
export interface VideoCallJoinInfo {
  videoCallId: UUID;
  sessionId: string;
  roomUrl: string;
  joinCode: string;
  token?: string;           // Auth token for video provider
  expiresAt: string;
}

/**
 * Video call history for a client
 */
export interface ClientVideoHistory {
  clientId: UUID;
  totalCalls: number;
  completedCalls: number;
  missedCalls: number;
  averageDuration: number;
  lastCallDate?: string;
  upcomingCalls: VideoCall[];
  recentCalls: VideoCall[];
}

/**
 * Dashboard data for video calls
 */
export interface VideoCallDashboard {
  // Today's schedule
  todayScheduled: number;
  todayCompleted: number;
  todayInProgress: number;

  // Upcoming calls
  upcomingCalls: Array<{
    videoCallId: UUID;
    clientName: string;
    scheduledStartTime: string;
    participantCount: number;
  }>;

  // Recent calls needing follow-up
  recentMissedCalls: Array<{
    videoCallId: UUID;
    clientName: string;
    scheduledStartTime: string;
    reason: string;
  }>;

  // Statistics
  statistics: {
    thisWeekCalls: number;
    thisWeekMinutes: number;
    averageQualityRating: number;
    participantSatisfaction: number;
  };
}

/**
 * Family view of video calls for a client
 */
export interface FamilyVideoView {
  clientId: UUID;

  // Upcoming scheduled calls
  upcomingCalls: Array<{
    videoCallId: UUID;
    title?: string;
    scheduledStartTime: string;
    durationMinutes: number;
    hostName: string;
    joinUrl?: string;
    joinCode?: string;
  }>;

  // Recurring schedules
  recurringSchedules: Array<{
    scheduleId: UUID;
    title: string;
    recurrenceRule: string;
    nextOccurrence?: string;
  }>;

  // Recent call history
  recentCalls: Array<{
    videoCallId: UUID;
    title?: string;
    actualStartTime: string;
    durationMinutes: number;
    status: VideoCallStatus;
    notes?: string;
  }>;

  // Pending invitations
  pendingInvitations: VideoCallInvitation[];
}
