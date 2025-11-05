/**
 * Family Member Types
 *
 * Type definitions for family members and their relationships to clients
 */

export type RelationshipType =
  | 'PARENT'
  | 'CHILD'
  | 'SIBLING'
  | 'SPOUSE'
  | 'GUARDIAN'
  | 'GRANDPARENT'
  | 'GRANDCHILD'
  | 'AUNT_UNCLE'
  | 'NIECE_NEPHEW'
  | 'COUSIN'
  | 'FRIEND'
  | 'NEIGHBOR'
  | 'OTHER';

export type FamilyMemberStatus = 'ACTIVE' | 'INACTIVE' | 'DECEASED';

export type PreferredContactMethod = 'EMAIL' | 'PHONE' | 'SMS' | 'APP' | 'POSTAL';

export interface FamilyMemberPermissions {
  can_view_care_plans: boolean;
  can_view_visit_logs: boolean;
  can_view_medical_info: boolean;
  can_view_billing: boolean;
  can_receive_notifications: boolean;
  can_message_care_team: boolean;
}

export interface CommunicationPreferences {
  email_notifications?: boolean;
  sms_notifications?: boolean;
  app_notifications?: boolean;
  phone_calls?: boolean;
  quiet_hours?: {
    start: string; // HH:MM format
    end: string;
  };
  frequency?: 'IMMEDIATE' | 'DAILY_DIGEST' | 'WEEKLY_DIGEST';
  categories?: string[]; // Which notification types they want
}

export interface AccessibilityNeeds {
  screen_reader?: boolean;
  large_text?: boolean;
  high_contrast?: boolean;
  captions?: boolean;
  other?: string;
}

export interface FamilyMember {
  id: string;
  client_id: string;
  organization_id: string;

  // Identity
  first_name: string;
  last_name: string;
  preferred_name?: string;
  date_of_birth?: Date;

  // Relationship
  relationship_type: RelationshipType;
  is_primary_contact: boolean;
  is_emergency_contact: boolean;
  is_authorized_representative: boolean;
  contact_priority: number;

  // Contact information
  email?: string;
  phone_primary?: string;
  phone_secondary?: string;
  phone_type?: string;
  preferred_contact_method: PreferredContactMethod;
  communication_preferences?: CommunicationPreferences;

  // Address
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;

  // Permissions & access
  can_view_care_plans: boolean;
  can_view_visit_logs: boolean;
  can_view_medical_info: boolean;
  can_view_billing: boolean;
  can_receive_notifications: boolean;
  can_message_care_team: boolean;
  custom_permissions?: Record<string, unknown>;

  // Language & accessibility
  preferred_language: string;
  accessibility_needs?: AccessibilityNeeds;

  // Status
  status: FamilyMemberStatus;
  notes?: string;

  // Standard fields
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  version: number;
}

export interface CreateFamilyMemberInput {
  client_id: string;
  organization_id: string;

  first_name: string;
  last_name: string;
  preferred_name?: string;
  date_of_birth?: Date;

  relationship_type: RelationshipType;
  is_primary_contact?: boolean;
  is_emergency_contact?: boolean;
  is_authorized_representative?: boolean;
  contact_priority?: number;

  email?: string;
  phone_primary?: string;
  phone_secondary?: string;
  phone_type?: string;
  preferred_contact_method?: PreferredContactMethod;
  communication_preferences?: CommunicationPreferences;

  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;

  can_view_care_plans?: boolean;
  can_view_visit_logs?: boolean;
  can_view_medical_info?: boolean;
  can_view_billing?: boolean;
  can_receive_notifications?: boolean;
  can_message_care_team?: boolean;
  custom_permissions?: Record<string, unknown>;

  preferred_language?: string;
  accessibility_needs?: AccessibilityNeeds;

  notes?: string;

  created_by: string;
}

export interface UpdateFamilyMemberInput {
  first_name?: string;
  last_name?: string;
  preferred_name?: string;
  date_of_birth?: Date;

  relationship_type?: RelationshipType;
  is_primary_contact?: boolean;
  is_emergency_contact?: boolean;
  is_authorized_representative?: boolean;
  contact_priority?: number;

  email?: string;
  phone_primary?: string;
  phone_secondary?: string;
  phone_type?: string;
  preferred_contact_method?: PreferredContactMethod;
  communication_preferences?: CommunicationPreferences;

  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;

  can_view_care_plans?: boolean;
  can_view_visit_logs?: boolean;
  can_view_medical_info?: boolean;
  can_view_billing?: boolean;
  can_receive_notifications?: boolean;
  can_message_care_team?: boolean;
  custom_permissions?: Record<string, unknown>;

  preferred_language?: string;
  accessibility_needs?: AccessibilityNeeds;

  status?: FamilyMemberStatus;
  notes?: string;

  updated_by: string;
}

export interface FamilyMemberFilters {
  client_id?: string;
  organization_id?: string;
  relationship_type?: RelationshipType;
  is_primary_contact?: boolean;
  is_emergency_contact?: boolean;
  is_authorized_representative?: boolean;
  status?: FamilyMemberStatus;
  email?: string;
  phone_primary?: string;
}
