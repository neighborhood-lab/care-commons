/**
 * Family Consent Types
 *
 * Type definitions for family member consents and permissions
 */

export type ConsentType =
  | 'VIEW_CARE_PLANS'
  | 'VIEW_VISIT_LOGS'
  | 'VIEW_MEDICAL_INFO'
  | 'VIEW_BILLING'
  | 'RECEIVE_NOTIFICATIONS'
  | 'MESSAGE_CARE_TEAM'
  | 'SHARE_DATA'
  | 'EMERGENCY_CONTACT'
  | 'MEDICAL_DECISIONS'
  | 'HIPAA_ACCESS';

export type ConsentCategory = 'MEDICAL' | 'COMMUNICATION' | 'DATA_SHARING' | 'LEGAL' | 'MARKETING';

export type ConsentStatus = 'PENDING' | 'GRANTED' | 'DENIED' | 'REVOKED' | 'EXPIRED';

export type SignatureMethod = 'DIGITAL' | 'ELECTRONIC' | 'VERBAL' | 'WRITTEN' | 'SMS' | 'EMAIL';

export interface ConsentMetadata {
  device_info?: string;
  location?: string;
  user_agent?: string;
  timestamp?: string;
}

export interface FamilyConsent {
  id: string;
  family_member_id: string;
  client_id: string;
  organization_id: string;

  // Consent details
  consent_type: ConsentType;
  consent_category: ConsentCategory;
  consent_status: ConsentStatus;

  // Consent text
  consent_text: string;
  consent_version: string;

  // Response
  is_granted: boolean;
  granted_at?: Date;
  revoked_at?: Date;
  revocation_reason?: string;
  revoked_by?: string;

  // Digital signature
  signature_data?: string;
  signature_method?: SignatureMethod;
  ip_address?: string;
  metadata?: ConsentMetadata;

  // Expiration & renewal
  expires_at?: Date;
  requires_renewal: boolean;
  renewed_at?: Date;
  supersedes_consent_id?: string;

  // Standard fields
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  version: number;
}

export interface CreateFamilyConsentInput {
  family_member_id: string;
  client_id: string;
  organization_id: string;

  consent_type: ConsentType;
  consent_category: ConsentCategory;
  consent_text: string;
  consent_version: string;

  is_granted?: boolean;
  signature_data?: string;
  signature_method?: SignatureMethod;
  ip_address?: string;
  metadata?: ConsentMetadata;

  expires_at?: Date;
  requires_renewal?: boolean;

  created_by: string;
}

export interface UpdateFamilyConsentInput {
  consent_status?: ConsentStatus;
  is_granted?: boolean;
  granted_at?: Date;
  revoked_at?: Date;
  revocation_reason?: string;
  revoked_by?: string;
  signature_data?: string;
  signature_method?: SignatureMethod;
  renewed_at?: Date;
  updated_by: string;
}

export interface FamilyConsentFilters {
  family_member_id?: string;
  client_id?: string;
  organization_id?: string;
  consent_type?: ConsentType;
  consent_category?: ConsentCategory;
  consent_status?: ConsentStatus;
  is_granted?: boolean;
  expires_before?: Date;
}
