/**
 * @care-commons/core - Organization Types
 *
 * Multi-tenant organization and team invitation types
 */

import { UUID, Entity, SoftDeletable, Role } from './base';

/**
 * US State codes for regulatory compliance
 */
export type USStateCode =
  | 'AL'
  | 'AK'
  | 'AZ'
  | 'AR'
  | 'CA'
  | 'CO'
  | 'CT'
  | 'DE'
  | 'FL'
  | 'GA'
  | 'HI'
  | 'ID'
  | 'IL'
  | 'IN'
  | 'IA'
  | 'KS'
  | 'KY'
  | 'LA'
  | 'ME'
  | 'MD'
  | 'MA'
  | 'MI'
  | 'MN'
  | 'MS'
  | 'MO'
  | 'MT'
  | 'NE'
  | 'NV'
  | 'NH'
  | 'NJ'
  | 'NM'
  | 'NY'
  | 'NC'
  | 'ND'
  | 'OH'
  | 'OK'
  | 'OR'
  | 'PA'
  | 'RI'
  | 'SC'
  | 'SD'
  | 'TN'
  | 'TX'
  | 'UT'
  | 'VT'
  | 'VA'
  | 'WA'
  | 'WV'
  | 'WI'
  | 'WY'
  | 'DC'
  | 'PR'
  | 'VI'
  | 'GU'
  | 'AS'
  | 'MP';

/**
 * Organization status
 */
export type OrganizationStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';

/**
 * Organization entity with state-based tenant isolation
 */
export interface Organization extends Entity, SoftDeletable {
  name: string;
  legalName: string | null;
  stateCode: USStateCode;
  taxId: string | null;
  licenseNumber: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  primaryAddress: Address;
  billingAddress: Address | null;
  settings: OrganizationSettings;
  status: OrganizationStatus;
}

/**
 * Address structure
 */
export interface Address {
  street1: string;
  street2?: string | null;
  city: string;
  state: USStateCode;
  zipCode: string;
  country: string;
}

/**
 * Organization settings
 */
export interface OrganizationSettings {
  timezone?: string;
  dateFormat?: string;
  currency?: string;
  features?: string[];
  [key: string]: unknown;
}

/**
 * Organization registration request
 */
export interface CreateOrganizationRequest {
  name: string;
  legalName?: string;
  stateCode: USStateCode;
  taxId?: string;
  licenseNumber?: string;
  phone?: string;
  email: string;
  website?: string;
  primaryAddress: Address;
  billingAddress?: Address;

  // First admin user
  adminUser: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
  };
}

/**
 * Invitation token status
 */
export type InviteTokenStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

/**
 * Invitation token for team member registration
 */
export interface InviteToken extends Entity {
  token: string;
  organizationId: UUID;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roles: Role[];
  branchIds: UUID[];
  expiresAt: Date;
  status: InviteTokenStatus;
  acceptedUserId: UUID | null;
  acceptedAt: Date | null;
}

/**
 * Create invitation request
 */
export interface CreateInviteRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  roles: Role[];
  branchIds?: UUID[];
  expiresInDays?: number; // Default 7 days
}

/**
 * Accept invitation request
 */
export interface AcceptInviteRequest {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
  phone?: string;
}

/**
 * Invitation details for validation
 */
export interface InviteDetails {
  token: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  organizationName: string;
  organizationId: UUID;
  roles: Role[];
  expiresAt: Date;
  isValid: boolean;
}
