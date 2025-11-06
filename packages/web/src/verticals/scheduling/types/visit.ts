/**
 * Visit Scheduling frontend types
 */

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

export interface Visit {
  id: string;
  organizationId: string;
  branchId: string;
  clientId: string;
  clientName?: string;
  patternId?: string;
  scheduleId?: string;
  visitNumber: string;
  visitType: VisitType;
  serviceTypeId: string;
  serviceTypeName: string;
  scheduledDate: Date;
  scheduledStartTime: string;
  scheduledEndTime: string;
  scheduledDuration: number;
  timezone: string;
  actualStartTime?: Date;
  actualEndTime?: Date;
  actualDuration?: number;
  assignedCaregiverId?: string;
  assignedCaregiverName?: string;
  assignedAt?: Date;
  assignedBy?: string;
  assignmentMethod: AssignmentMethod;
  address: VisitAddress;
  taskIds?: string[];
  requiredSkills?: string[];
  requiredCertifications?: string[];
  status: VisitStatus;
  isUrgent: boolean;
  isPriority: boolean;
  requiresSupervision: boolean;
  riskFlags?: string[];
  clientInstructions?: string;
  caregiverInstructions?: string;
  internalNotes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
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

export interface VisitListItem {
  id: string;
  visitNumber: string;
  clientId: string;
  clientName?: string;
  serviceTypeName: string;
  scheduledDate: Date;
  scheduledStartTime: string;
  scheduledEndTime: string;
  assignedCaregiverId?: string;
  assignedCaregiverName?: string;
  status: VisitStatus;
  isUrgent: boolean;
  isPriority: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface VisitSearchFilters {
  query?: string;
  branchId?: string;
  branchIds?: string[];
  clientId?: string;
  clientIds?: string[];
  caregiverId?: string;
  caregiverIds?: string[];
  status?: VisitStatus[];
  visitType?: VisitType[];
  dateFrom?: Date;
  dateTo?: Date;
  isUnassigned?: boolean;
  isUrgent?: boolean;
  requiresSupervision?: boolean;
}

export interface PaginatedVisits {
  items: VisitListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface CreateVisitInput {
  clientId: string;
  visitType: VisitType;
  serviceTypeId: string;
  serviceTypeName: string;
  scheduledDate: Date;
  scheduledStartTime: string;
  scheduledEndTime: string;
  address: VisitAddress;
  taskIds?: string[];
  requiredSkills?: string[];
  requiredCertifications?: string[];
  isUrgent?: boolean;
  isPriority?: boolean;
  requiresSupervision?: boolean;
  riskFlags?: string[];
  clientInstructions?: string;
  caregiverInstructions?: string;
  internalNotes?: string;
}

export interface AssignVisitInput {
  visitId: string;
  caregiverId: string;
  assignmentMethod: AssignmentMethod;
  notes?: string;
}

export interface CaregiverAvailability {
  caregiverId: string;
  caregiverName: string;
  isAvailable: boolean;
  matchScore?: number;
  matchReasons?: string[];
  conflictingVisitIds?: string[];
  reason?: string;
}
