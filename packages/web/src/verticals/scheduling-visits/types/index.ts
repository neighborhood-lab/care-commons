/**
 * Frontend types for Scheduling & Visit Management
 */

import type { UUID, Timestamp } from '@care-commons/core';

export type VisitStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'UNASSIGNED'
  | 'ASSIGNED'
  | 'CONFIRMED'
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'PAUSED'
  | 'COMPLETED'
  | 'INCOMPLETE'
  | 'CANCELLED'
  | 'NO_SHOW_CLIENT'
  | 'NO_SHOW_CAREGIVER'
  | 'REJECTED';

export type VisitType =
  | 'REGULAR'
  | 'INITIAL'
  | 'DISCHARGE'
  | 'RESPITE'
  | 'EMERGENCY'
  | 'MAKEUP'
  | 'SUPERVISION'
  | 'ASSESSMENT';

export type AssignmentMethod =
  | 'MANUAL'
  | 'AUTO_MATCH'
  | 'SELF_ASSIGN'
  | 'PREFERRED'
  | 'OVERFLOW';

export interface VisitAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  accessInstructions?: string;
}

export interface Visit {
  id: UUID;
  organizationId: UUID;
  branchId: UUID;
  clientId: UUID;
  patternId?: UUID;
  scheduleId?: UUID;
  visitNumber: string;
  visitType: VisitType;
  serviceTypeId: UUID;
  serviceTypeName: string;
  scheduledDate: Date;
  scheduledStartTime: string;
  scheduledEndTime: string;
  scheduledDuration: number;
  timezone: string;
  actualStartTime?: Timestamp;
  actualEndTime?: Timestamp;
  actualDuration?: number;
  assignedCaregiverId?: UUID;
  assignedAt?: Timestamp;
  assignedBy?: UUID;
  assignmentMethod: AssignmentMethod;
  address: VisitAddress;
  taskIds?: UUID[];
  requiredSkills?: string[];
  requiredCertifications?: string[];
  status: VisitStatus;
  isUrgent: boolean;
  isPriority: boolean;
  requiresSupervision: boolean;
  riskFlags?: string[];
  completionNotes?: string;
  tasksCompleted?: number;
  tasksTotal?: number;
  incidentReported?: boolean;
  signatureRequired: boolean;
  signatureCaptured?: boolean;
  clientInstructions?: string;
  caregiverInstructions?: string;
  internalNotes?: string;
  tags?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt?: Timestamp;
}

export interface VisitWithDetails extends Visit {
  clientName?: string;
  caregiverName?: string;
  conflicts?: VisitConflict[];
}

export interface VisitConflict {
  type: 'CAREGIVER_UNAVAILABLE' | 'CLIENT_CONFLICT' | 'SKILL_MISMATCH' | 'TRAVEL_TIME';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  conflictingVisitId?: UUID;
}

export interface CaregiverAvailability {
  caregiverId: UUID;
  caregiverName: string;
  isAvailable: boolean;
  conflicts?: string[];
  matchScore?: number;
  skills?: string[];
  certifications?: string[];
  distanceFromClient?: number;
  preferredCaregiver?: boolean;
}

export interface VisitSearchFilters {
  query?: string;
  branchIds?: UUID[];
  clientIds?: UUID[];
  caregiverIds?: UUID[];
  status?: VisitStatus[];
  visitType?: VisitType[];
  dateFrom?: Date;
  dateTo?: Date;
  isUnassigned?: boolean;
  isUrgent?: boolean;
  requiresSupervision?: boolean;
}

export interface AssignCaregiverInput {
  visitId: UUID;
  caregiverId: UUID;
  notes?: string;
}

export interface UpdateVisitStatusInput {
  visitId: UUID;
  newStatus: VisitStatus;
  notes?: string;
  reason?: string;
}

export type CalendarView = 'day' | 'week' | 'list';

export interface CalendarDateRange {
  start: Date;
  end: Date;
}

export interface SchedulingStats {
  totalVisits: number;
  unassignedVisits: number;
  completedToday: number;
  inProgress: number;
  upcomingToday: number;
  conflicts: number;
}
