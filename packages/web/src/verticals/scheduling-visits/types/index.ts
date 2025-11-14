/**
 * Scheduling & Visits types for web application
 *
 * These types align with the backend Visit types but include
 * only the fields needed for UI display.
 */

export interface Visit {
  id: string;
  organizationId: string;
  branchId: string;
  clientId: string;
  patternId?: string;
  scheduleId?: string;

  // Visit identity
  visitNumber: string;
  visitType: VisitType;
  serviceTypeId: string;
  serviceTypeName: string;

  // Timing
  scheduledDate: Date | string;
  scheduledStartTime: string; // HH:MM format
  scheduledEndTime: string; // HH:MM format
  scheduledDuration: number; // Minutes
  timezone: string;

  // Actual timing
  actualStartTime?: Date | string;
  actualEndTime?: Date | string;
  actualDuration?: number;

  // Assignment
  assignedCaregiverId?: string;
  assignedAt?: Date | string;
  assignmentMethod?: AssignmentMethod;

  // Client info (denormalized for display)
  clientFirstName?: string;
  clientLastName?: string;
  clientPhone?: {
    number: string;
    type: string;
    canReceiveSMS: boolean;
  };

  // Location
  address: VisitAddress;

  // Status
  status: VisitStatus;

  // Flags
  isUrgent: boolean;
  isPriority: boolean;
  requiresSupervision: boolean;

  // Completion
  completionNotes?: string;
  tasksCompleted?: number;
  tasksTotal?: number;

  // Timestamps
  createdAt: Date | string;
  updatedAt: Date | string;
}

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

export type VisitType =
  | 'REGULAR'
  | 'INITIAL'
  | 'DISCHARGE'
  | 'RESPITE'
  | 'EMERGENCY'
  | 'MAKEUP'
  | 'SUPERVISION'
  | 'ASSESSMENT';

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

export type AssignmentMethod =
  | 'MANUAL'
  | 'AUTO_MATCH'
  | 'SELF_ASSIGN'
  | 'PREFERRED'
  | 'OVERFLOW';

export interface VisitSearchFilters {
  query?: string;
  organizationId?: string;
  branchId?: string;
  branchIds?: string[];
  clientId?: string;
  caregiverId?: string;
  status?: VisitStatus[];
  visitType?: VisitType[];
  dateFrom?: Date;
  dateTo?: Date;
  isUnassigned?: boolean;
  isUrgent?: boolean;
}

export const VISIT_STATUS_LABELS: Record<VisitStatus, string> = {
  DRAFT: 'Draft',
  SCHEDULED: 'Scheduled',
  UNASSIGNED: 'Unassigned',
  ASSIGNED: 'Assigned',
  CONFIRMED: 'Confirmed',
  EN_ROUTE: 'En Route',
  ARRIVED: 'Arrived',
  IN_PROGRESS: 'In Progress',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  INCOMPLETE: 'Incomplete',
  CANCELLED: 'Cancelled',
  NO_SHOW_CLIENT: 'No Show (Client)',
  NO_SHOW_CAREGIVER: 'No Show (Caregiver)',
  REJECTED: 'Rejected',
};

export const VISIT_TYPE_LABELS: Record<VisitType, string> = {
  REGULAR: 'Regular',
  INITIAL: 'Initial',
  DISCHARGE: 'Discharge',
  RESPITE: 'Respite',
  EMERGENCY: 'Emergency',
  MAKEUP: 'Makeup',
  SUPERVISION: 'Supervision',
  ASSESSMENT: 'Assessment',
};

export const VISIT_STATUS_COLORS: Record<VisitStatus, string> = {
  DRAFT: 'gray',
  SCHEDULED: 'blue',
  UNASSIGNED: 'yellow',
  ASSIGNED: 'cyan',
  CONFIRMED: 'green',
  EN_ROUTE: 'indigo',
  ARRIVED: 'purple',
  IN_PROGRESS: 'blue',
  PAUSED: 'orange',
  COMPLETED: 'green',
  INCOMPLETE: 'yellow',
  CANCELLED: 'gray',
  NO_SHOW_CLIENT: 'red',
  NO_SHOW_CAREGIVER: 'red',
  REJECTED: 'red',
};
