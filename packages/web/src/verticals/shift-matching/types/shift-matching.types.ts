export type ShiftPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export type MatchingStatus =
  | 'NEW'
  | 'MATCHING'
  | 'MATCHED'
  | 'PROPOSED'
  | 'ASSIGNED'
  | 'NO_MATCH'
  | 'EXPIRED';

export type ProposalStatus =
  | 'PENDING'
  | 'SENT'
  | 'VIEWED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'SUPERSEDED'
  | 'WITHDRAWN';

export type MatchQuality = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'INELIGIBLE';

export interface OpenShift {
  id: string;
  visitId: string;
  clientId: string;
  clientName?: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  timezone: string;
  serviceTypeId: string;
  serviceTypeName: string;
  requiredSkills?: string[];
  requiredCertifications?: string[];
  address: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
  };
  priority: ShiftPriority;
  isUrgent: boolean;
  fillByDate?: string;
  matchingStatus: MatchingStatus;
  matchAttempts: number;
  proposedAssignments?: string[];
  clientInstructions?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MatchCandidate {
  caregiverId: string;
  openShiftId: string;
  caregiverName: string;
  caregiverPhone: string;
  overallScore: number;
  matchQuality: MatchQuality;
  scores: {
    skillMatch: number;
    availabilityMatch: number;
    proximityMatch: number;
    preferenceMatch: number;
    experienceMatch: number;
    reliabilityMatch: number;
  };
  isEligible: boolean;
  eligibilityIssues: Array<{
    type: string;
    severity: 'BLOCKING' | 'WARNING';
    message: string;
  }>;
  distanceFromShift?: number;
  estimatedTravelTime?: number;
  hasConflict: boolean;
  previousVisitsWithClient?: number;
  clientRating?: number;
  matchReasons: Array<{
    category: string;
    description: string;
    impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  }>;
}

export interface AssignmentProposal {
  id: string;
  openShiftId: string;
  visitId: string;
  caregiverId: string;
  caregiverName?: string;
  matchScore: number;
  matchQuality: MatchQuality;
  proposalStatus: ProposalStatus;
  proposedBy: string;
  proposedAt: string;
  sentToCaregiver: boolean;
  sentAt?: string;
  viewedByCaregiver: boolean;
  viewedAt?: string;
  respondedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  expiredAt?: string;
  isPreferred: boolean;
  urgencyFlag: boolean;
  shiftDetails?: {
    scheduledDate: string;
    startTime: string;
    endTime: string;
    clientName: string;
    serviceTypeName: string;
  };
  notes?: string;
  createdAt: string;
}

export interface MatchingMetrics {
  periodStart: string;
  periodEnd: string;
  totalOpenShifts: number;
  shiftsMatched: number;
  shiftsUnmatched: number;
  matchRate: number;
  averageMatchScore: number;
  averageCandidatesPerShift: number;
  proposalAcceptanceRate: number;
  proposalRejectionRate: number;
}

export interface OpenShiftSearchFilters {
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  priority?: ShiftPriority;
  matchingStatus?: MatchingStatus;
  isUrgent?: boolean;
  serviceTypeId?: string;
}

export interface ProposalSearchFilters {
  caregiverId?: string;
  openShiftId?: string;
  proposalStatus?: ProposalStatus;
  dateFrom?: string;
  dateTo?: string;
  matchQuality?: MatchQuality;
}

export interface OpenShiftListResponse {
  items: OpenShift[];
  total: number;
  hasMore: boolean;
}

export interface MatchCandidateListResponse {
  items: MatchCandidate[];
  total: number;
}

export interface ProposalListResponse {
  items: AssignmentProposal[];
  total: number;
  hasMore: boolean;
}

export interface MatchShiftInput {
  openShiftId: string;
  maxCandidates?: number;
  autoPropose?: boolean;
}

export interface CreateProposalInput {
  openShiftId: string;
  caregiverId: string;
  sendNotification?: boolean;
  urgencyFlag?: boolean;
  notes?: string;
}

export interface RespondToProposalInput {
  accept: boolean;
  rejectionReason?: string;
  notes?: string;
}
