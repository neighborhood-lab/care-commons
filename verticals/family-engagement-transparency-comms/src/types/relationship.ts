/**
 * Family-Client Relationship domain model
 *
 * Defines the relationship between family members and clients,
 * including legal authority, consent, and involvement level.
 */

import { Entity, SoftDeletable, UUID } from '@care-commons/core';

/**
 * Family-client relationship entity
 */
export interface FamilyClientRelationship extends Entity, SoftDeletable {
  id: UUID;
  organizationId: UUID;
  familyMemberId: UUID;
  clientId: UUID;

  // Relationship details
  relationshipType: RelationshipType;
  relationshipDescription?: string; // Free text for OTHER type
  isPrimaryContact: boolean;
  isEmergencyContact: boolean;

  // Legal authority
  hasLegalAuthority: boolean;
  legalAuthorityType: LegalAuthorityType;
  legalDocuments?: LegalDocument[];
  legalAuthorityVerifiedDate?: Date;
  legalAuthorityVerifiedBy?: UUID;

  // Consent and permissions
  hipaaAuthorized: boolean;
  hipaaAuthorizationDate?: Date;
  hipaaAuthorizationScope?: HipaaAuthorizationScope;
  hipaaConsentDocumentId?: UUID;

  // Involvement level
  involvementLevel: InvolvementLevel;
  notes?: string; // Staff notes about the family member's role

  // Status
  status: RelationshipStatus;
  effectiveDate: Date;
  expirationDate?: Date; // For temporary relationships
  statusReason?: string; // Why suspended/revoked

  // Audit fields
  createdAt: Date;
  createdBy: UUID;
  updatedAt: Date;
  updatedBy: UUID;
  deletedAt?: Date;
  deletedBy?: UUID;
}

/**
 * Types of family relationships
 */
export type RelationshipType =
  | 'PARENT'
  | 'CHILD'
  | 'SPOUSE'
  | 'PARTNER'
  | 'SIBLING'
  | 'GRANDPARENT'
  | 'GRANDCHILD'
  | 'AUNT_UNCLE'
  | 'NIECE_NEPHEW'
  | 'COUSIN'
  | 'GUARDIAN'
  | 'POA' // Power of Attorney
  | 'AUTHORIZED_REP' // Authorized Representative
  | 'FRIEND'
  | 'NEIGHBOR'
  | 'OTHER';

/**
 * Types of legal authority
 */
export type LegalAuthorityType =
  | 'NONE'
  | 'POA_HEALTHCARE' // Healthcare Power of Attorney
  | 'POA_FINANCIAL' // Financial Power of Attorney
  | 'POA_DURABLE' // Durable Power of Attorney (both)
  | 'GUARDIAN' // Court-appointed guardian
  | 'CONSERVATOR' // Financial conservator
  | 'HEALTHCARE_PROXY' // Healthcare proxy
  | 'AUTHORIZED_REP'; // Medicaid/Medicare authorized representative

/**
 * Legal document reference
 */
export interface LegalDocument {
  type: LegalAuthorityType;
  documentId: UUID; // Reference to stored document
  effectiveDate: Date;
  expirationDate?: Date;
  scope?: string; // What decisions/actions this covers
  issuingCourt?: string; // For court orders
  verifiedBy?: UUID; // Staff who verified
  verifiedDate?: Date;
}

/**
 * HIPAA authorization scope
 */
export interface HipaaAuthorizationScope {
  fullAccess?: boolean; // Full access to all PHI
  careInformation?: boolean; // Care plans, schedules, notes
  medicalRecords?: boolean; // Medical history, diagnoses
  medications?: boolean; // Medication information
  assessments?: boolean; // Clinical assessments
  billing?: boolean; // Billing and payment information
  specificConditions?: string[]; // Limit to specific conditions
  excludedInformation?: string[]; // Specific exclusions
  expirationDate?: Date;
}

/**
 * Level of family involvement in care
 */
export type InvolvementLevel =
  | 'OBSERVER' // Can view information only
  | 'ACTIVE' // Actively involved in care discussions
  | 'PRIMARY_DECISION_MAKER' // Makes care decisions
  | 'EMERGENCY_ONLY'; // Only contacted for emergencies

/**
 * Relationship status
 */
export type RelationshipStatus =
  | 'ACTIVE' // Active relationship
  | 'PENDING' // Pending approval/verification
  | 'SUSPENDED' // Temporarily suspended
  | 'REVOKED' // Permanently revoked
  | 'EXPIRED'; // Temporary relationship expired

/**
 * Input for creating a new relationship
 */
export interface CreateRelationshipInput {
  organizationId: UUID;
  familyMemberId: UUID;
  clientId: UUID;
  relationshipType: RelationshipType;
  relationshipDescription?: string;
  isPrimaryContact?: boolean;
  isEmergencyContact?: boolean;
  hasLegalAuthority?: boolean;
  legalAuthorityType?: LegalAuthorityType;
  legalDocuments?: LegalDocument[];
  hipaaAuthorized?: boolean;
  hipaaAuthorizationDate?: Date;
  hipaaAuthorizationScope?: HipaaAuthorizationScope;
  involvementLevel?: InvolvementLevel;
  notes?: string;
  effectiveDate?: Date;
  expirationDate?: Date;
}

/**
 * Input for updating an existing relationship
 */
export interface UpdateRelationshipInput {
  relationshipType?: RelationshipType;
  relationshipDescription?: string;
  isPrimaryContact?: boolean;
  isEmergencyContact?: boolean;
  hasLegalAuthority?: boolean;
  legalAuthorityType?: LegalAuthorityType;
  legalDocuments?: LegalDocument[];
  legalAuthorityVerifiedDate?: Date;
  legalAuthorityVerifiedBy?: UUID;
  hipaaAuthorized?: boolean;
  hipaaAuthorizationDate?: Date;
  hipaaAuthorizationScope?: HipaaAuthorizationScope;
  hipaaConsentDocumentId?: UUID;
  involvementLevel?: InvolvementLevel;
  notes?: string;
  status?: RelationshipStatus;
  expirationDate?: Date;
  statusReason?: string;
}

/**
 * Relationship search filters
 */
export interface RelationshipSearchFilters {
  organizationId: UUID;
  familyMemberId?: UUID;
  clientId?: UUID;
  relationshipType?: RelationshipType;
  status?: RelationshipStatus;
  isPrimaryContact?: boolean;
  hasLegalAuthority?: boolean;
}

/**
 * Relationship with expanded details
 */
export interface RelationshipWithDetails extends FamilyClientRelationship {
  familyMember: {
    id: UUID;
    firstName: string;
    lastName: string;
    email: string;
    preferredContactMethod: string;
  };
  client: {
    id: UUID;
    firstName: string;
    lastName: string;
    clientNumber: string;
  };
}

/**
 * Relationship verification request
 */
export interface VerifyRelationshipInput {
  relationshipId: UUID;
  legalAuthorityVerified: boolean;
  legalAuthorityType?: LegalAuthorityType;
  legalDocuments?: LegalDocument[];
  notes?: string;
}
