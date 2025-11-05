/**
 * Transparency and Activity domain models
 *
 * Activity tracking and audit logging:
 * - Activity feed for family visibility
 * - Access logs for HIPAA compliance
 * - Audit trail for accountability
 * - Change tracking
 */

import {
  Entity,
  UUID,
} from '@care-commons/core';

/**
 * Actor types for activity tracking
 */
export type ActorType = 'USER' | 'SYSTEM' | 'INTEGRATION' | 'MOBILE_APP';

/**
 * Action categories
 */
export type ActionCategory =
  | 'CARE'
  | 'VISIT'
  | 'TASK'
  | 'MESSAGE'
  | 'ACCESS'
  | 'DOCUMENT'
  | 'FAMILY'
  | 'SCHEDULE'
  | 'MEDICATION'
  | 'INCIDENT'
  | 'SYSTEM';

/**
 * Visibility levels for activity feed
 */
export type VisibilityLevel = 'INTERNAL' | 'STAFF' | 'FAMILY' | 'PUBLIC';

/**
 * User types for access logging
 */
export type UserType = 'STAFF' | 'CAREGIVER' | 'FAMILY' | 'ADMIN' | 'SYSTEM';

/**
 * Access methods
 */
export type AccessMethod = 'WEB' | 'MOBILE' | 'API' | 'EXPORT' | 'PRINT' | 'INTEGRATION';

/**
 * Authorization types for access logging
 */
export type AuthorizationType =
  | 'HIPAA_AUTHORIZATION'
  | 'EMERGENCY_ACCESS'
  | 'ADMINISTRATIVE'
  | 'PATIENT_CONSENT'
  | 'LEGAL_GUARDIAN';

/**
 * Activity feed entry entity
 */
export interface ActivityFeedEntry extends Entity {
  organizationId: UUID;

  // Activity details
  actorId?: UUID; // User who performed the action (nullable for system actions)
  actorType: ActorType;
  action: string; // CREATED, UPDATED, DELETED, VIEWED, etc.
  actionCategory: ActionCategory;

  // Resource affected
  resourceType: string;
  resourceId: UUID;
  resourceDisplayName?: string;

  // Context
  careRecipientId?: UUID; // Link to care recipient for family visibility
  details: Record<string, any>; // Action-specific details
  changes?: Record<string, any>; // Before/after for updates

  // Visibility control
  visibleToFamily: boolean;
  visibilityLevel: VisibilityLevel;

  // Metadata
  ipAddress?: string;
  userAgent?: string;
  metadata: Record<string, any>;
}

/**
 * Access log entry entity (HIPAA §164.528 compliance)
 */
export interface AccessLogEntry extends Entity {
  organizationId: UUID;

  // WHO accessed
  userId: UUID;
  userType: UserType;
  userDisplayName?: string;

  // WHAT was accessed
  resourceType: string;
  resourceId: UUID;
  resourceDisplayName?: string;

  // WHEN accessed
  accessedAt: Date;

  // HOW accessed
  accessMethod: AccessMethod;
  action: string; // VIEW, DOWNLOAD, PRINT, EXPORT, MODIFY

  // WHY accessed (optional)
  purpose?: string;
  authorizationType?: AuthorizationType;

  // Context
  careRecipientId?: UUID; // Link to care recipient
  ipAddress?: string;
  userAgent?: string;
  metadata: Record<string, any>;

  // Compliance flags
  isPatientAccess: boolean; // Patient accessing their own data
  isEmergencyAccess: boolean;
  requiresDisclosure: boolean; // HIPAA §164.528
}

/**
 * Activity feed creation request
 */
export interface CreateActivityFeedEntryRequest {
  organizationId: UUID;
  actorId?: UUID;
  actorType?: ActorType;
  action: string;
  actionCategory: ActionCategory;
  resourceType: string;
  resourceId: UUID;
  resourceDisplayName?: string;
  careRecipientId?: UUID;
  details?: Record<string, any>;
  changes?: Record<string, any>;
  visibleToFamily?: boolean;
  visibilityLevel?: VisibilityLevel;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Access log creation request
 */
export interface CreateAccessLogEntryRequest {
  organizationId: UUID;
  userId: UUID;
  userType: UserType;
  userDisplayName?: string;
  resourceType: string;
  resourceId: UUID;
  resourceDisplayName?: string;
  accessMethod: AccessMethod;
  action: string;
  purpose?: string;
  authorizationType?: AuthorizationType;
  careRecipientId?: UUID;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  isPatientAccess?: boolean;
  isEmergencyAccess?: boolean;
  requiresDisclosure?: boolean;
}

/**
 * Activity feed filter options
 */
export interface ActivityFeedFilterOptions {
  organizationId?: UUID;
  actorId?: UUID;
  careRecipientId?: UUID;
  actionCategory?: ActionCategory;
  resourceType?: string;
  resourceId?: UUID;
  visibilityLevel?: VisibilityLevel;
  visibleToFamilyOnly?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Access log filter options
 */
export interface AccessLogFilterOptions {
  organizationId?: UUID;
  userId?: UUID;
  careRecipientId?: UUID;
  userType?: UserType;
  resourceType?: string;
  resourceId?: UUID;
  accessMethod?: AccessMethod;
  requiresDisclosure?: boolean;
  isEmergencyAccess?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Activity feed entry with actor details
 */
export interface ActivityFeedEntryWithDetails extends ActivityFeedEntry {
  actorName?: string;
  actorRole?: string;
  careRecipientName?: string;
}

/**
 * Activity summary for dashboard
 */
export interface ActivitySummary {
  totalActivities: number;
  activitiesByCategory: Record<ActionCategory, number>;
  recentActivities: ActivityFeedEntryWithDetails[];
  topActors: Array<{
    actorId: UUID;
    actorName: string;
    activityCount: number;
  }>;
}

/**
 * HIPAA disclosure report (§164.528)
 */
export interface HipaaDisclosureReport {
  careRecipientId: UUID;
  careRecipientName: string;
  reportPeriodStart: Date;
  reportPeriodEnd: Date;
  disclosures: Array<{
    accessedAt: Date;
    accessedBy: string;
    userType: UserType;
    resourceType: string;
    resourceName: string;
    action: string;
    purpose?: string;
    authorizationType?: AuthorizationType;
  }>;
  totalDisclosures: number;
}

/**
 * Audit trail entry
 */
export interface AuditTrailEntry {
  timestamp: Date;
  action: string;
  actor: string;
  actorType: ActorType;
  resource: string;
  resourceType: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Change tracking record
 */
export interface ChangeRecord {
  entityType: string;
  entityId: UUID;
  field: string;
  oldValue: any;
  newValue: any;
  changedBy: UUID;
  changedAt: Date;
  reason?: string;
}

/**
 * Family transparency dashboard
 */
export interface FamilyTransparencyDashboard {
  careRecipientId: UUID;
  careRecipientName: string;
  recentActivities: ActivityFeedEntryWithDetails[];
  visitSummary: {
    totalVisits: number;
    completedVisits: number;
    upcomingVisits: number;
    lastVisitDate?: Date;
  };
  taskSummary: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
  };
  unreadMessages: number;
  recentIncidents: number;
}
