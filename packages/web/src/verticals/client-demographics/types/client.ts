// Frontend types for client demographics (simplified from backend)
export type Gender = 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER' | 'PREFER_NOT_TO_SAY';
export type ClientStatus =
  | 'INQUIRY'
  | 'PENDING_INTAKE'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'ON_HOLD'
  | 'DISCHARGED'
  | 'DECEASED';
export type ContactMethod = 'PHONE' | 'EMAIL' | 'SMS' | 'MAIL' | 'IN_PERSON';

export interface Phone {
  number: string;
  type: 'MOBILE' | 'HOME' | 'WORK';
  canReceiveSMS: boolean;
}

export interface Address {
  type: 'HOME' | 'BILLING' | 'TEMPORARY';
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  county?: string;
  country: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: Phone;
  alternatePhone?: Phone;
  email?: string;
  isPrimary: boolean;
  canMakeHealthcareDecisions: boolean;
  notes?: string;
}

export interface Client {
  id: string;
  clientNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth: string;
  gender?: Gender;
  primaryPhone?: Phone;
  alternatePhone?: Phone;
  email?: string;
  preferredContactMethod?: ContactMethod;
  primaryAddress: Address;
  emergencyContacts: EmergencyContact[];
  status: ClientStatus;
  intakeDate?: string;
  dischargeDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientInput {
  firstName: string;
  middleName?: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth: string;
  gender?: Gender;
  primaryPhone?: Phone;
  email?: string;
  primaryAddress: Address;
  emergencyContacts?: EmergencyContact[];
  status?: ClientStatus;
}

export interface UpdateClientInput {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  preferredName?: string;
  dateOfBirth?: string;
  gender?: Gender;
  primaryPhone?: Phone;
  alternatePhone?: Phone;
  email?: string;
  primaryAddress?: Address;
  emergencyContacts?: EmergencyContact[];
  status?: ClientStatus;
}

export interface ClientSearchFilters {
  query?: string;
  status?: ClientStatus[];
  city?: string;
  state?: string;
}
