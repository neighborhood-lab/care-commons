/**
 * Caregiver frontend types
 */

export interface Caregiver {
  id: string;
  organizationId: string;
  branchIds: string[];
  primaryBranchId: string;
  employeeNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth: Date;
  email: string;
  primaryPhone: {
    number: string;
    type: 'MOBILE' | 'HOME' | 'WORK';
    canReceiveSMS: boolean;
  };
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'PER_DIEM' | 'CONTRACT' | 'TEMPORARY' | 'SEASONAL';
  employmentStatus: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED' | 'RETIRED';
  hireDate: Date;
  role: string;
  status: 'APPLICATION' | 'INTERVIEWING' | 'PENDING_ONBOARDING' | 'ONBOARDING' | 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED' | 'RETIRED';
  complianceStatus: 'COMPLIANT' | 'PENDING_VERIFICATION' | 'EXPIRING_SOON' | 'EXPIRED' | 'NON_COMPLIANT';
  credentials: Credential[];
  training: TrainingRecord[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Credential {
  id: string;
  type: string;
  name: string;
  number?: string;
  issueDate: Date;
  expirationDate?: Date;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING_VERIFICATION' | 'REVOKED';
}

export interface TrainingRecord {
  id: string;
  name: string;
  category: string;
  completionDate: Date;
  expirationDate?: Date;
  status: 'COMPLETED' | 'EXPIRED' | 'IN_PROGRESS';
}

export interface CaregiverListItem {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  complianceStatus: string;
  employmentType: string;
}

export interface CaregiverSearchFilters {
  query?: string;
  status?: string[];
  role?: string[];
  employmentType?: string[];
  complianceStatus?: string[];
  branchId?: string;
  credentialExpiring?: boolean;
}

export interface PaginatedCaregivers {
  items: CaregiverListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
