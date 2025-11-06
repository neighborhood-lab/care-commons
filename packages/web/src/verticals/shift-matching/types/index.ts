export * from './shift-matching.types';

// Aliases for provider compatibility
export type { OpenShift as ShiftListing } from './shift-matching.types';
export type { AssignmentProposal as ShiftApplication } from './shift-matching.types';
export type { CreateProposalInput as CreateShiftListingInput } from './shift-matching.types';
export type { OpenShiftSearchFilters as ShiftSearchFilters } from './shift-matching.types';

// Missing update input type
export interface UpdateShiftListingInput {
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  isUrgent?: boolean;
  requiredSkills?: string[];
  requiredCertifications?: string[];
  clientInstructions?: string;
  internalNotes?: string;
}
