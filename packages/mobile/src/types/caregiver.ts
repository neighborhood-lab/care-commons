/**
 * Caregiver types for mobile app
 * Subset of full caregiver types needed for profile display
 */

export interface Phone {
  number: string;
  type: 'MOBILE' | 'HOME' | 'WORK';
  canReceiveSMS: boolean;
  isPrimary?: boolean;
}

export interface Credential {
  id: string;
  type: string;
  name: string;
  number?: string;
  issuingAuthority?: string;
  issueDate: Date;
  expirationDate?: Date;
  verifiedDate?: Date;
  verifiedBy?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING_VERIFICATION' | 'REVOKED';
  documentPath?: string;
  notes?: string;
}

export type CaregiverStatus =
  | 'APPLICATION'
  | 'INTERVIEWING'
  | 'PENDING_ONBOARDING'
  | 'ONBOARDING'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'ON_LEAVE'
  | 'SUSPENDED'
  | 'TERMINATED'
  | 'RETIRED';

export interface Caregiver {
  id: string;
  organizationId: string;
  employeeNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  preferredName?: string;
  email: string;
  primaryPhone: Phone;
  alternatePhone?: Phone;
  role: string;
  status: CaregiverStatus;
  credentials: Credential[];
}
