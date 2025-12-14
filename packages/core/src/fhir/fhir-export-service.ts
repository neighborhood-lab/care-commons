/**
 * FHIR R4 Export Service
 *
 * Service for exporting client data in FHIR R4 format.
 * Supports exporting individual resources or complete patient bundles.
 *
 * @see https://hl7.org/fhir/R4/
 */

/* eslint-disable sonarjs/no-clear-text-protocols -- FHIR terminology URIs use http:// by spec */
/* eslint-disable @typescript-eslint/strict-boolean-expressions -- FHIR mapping uses standard truthy/falsy checks */
/* eslint-disable @typescript-eslint/no-unnecessary-condition -- Optional chaining on potentially nullish values */
/* eslint-disable max-lines -- FHIR mapping requires comprehensive type definitions */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing -- Standard || usage for fallbacks */
/* eslint-disable security/detect-object-injection -- Safe object lookups with known keys */
/* eslint-disable unicorn/prefer-string-slice -- substring is equivalent here */

import type { UUID } from '../types/base.js';
import type {
  Patient,
  RelatedPerson,
  AllergyIntolerance,
  Coverage,
  Practitioner,
  Condition,
  Bundle,
  BundleEntry,
  Resource,
  HumanName,
  ContactPoint,
  FHIRAddress,
  Identifier,
  CodeableConcept,
  PatientContact,
  FHIRGender
} from './types.js';
import { getDatabase } from '../db/connection.js';

// ============================================================================
// Input Types (from client-demographics)
// ============================================================================

// Type aliases to satisfy lint rules
type GenderType = 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER' | 'PREFER_NOT_TO_SAY';
type PhoneType = 'MOBILE' | 'HOME' | 'WORK';
type MaritalStatusType = 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'SEPARATED' | 'DOMESTIC_PARTNERSHIP';
type AddressType = 'HOME' | 'BILLING' | 'TEMPORARY';
type InsuranceType = 'PRIMARY' | 'SECONDARY' | 'TERTIARY';
type AllergyType = 'MEDICATION' | 'FOOD' | 'ENVIRONMENTAL' | 'OTHER';
type AllergySeverity = 'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING';
type RiskSeverityType = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface PhoneData {
  number: string;
  type: PhoneType;
  canReceiveSMS?: boolean;
}

interface AddressData {
  type: AddressType;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  county?: string;
  country: string;
}

// Simplified types that match the client-demographics model
interface ClientData {
  id: UUID;
  organizationId: UUID;
  clientNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth: Date;
  ssn?: string;
  gender?: GenderType;
  pronouns?: string;
  primaryPhone?: PhoneData;
  alternatePhone?: PhoneData;
  email?: string;
  language?: string;
  ethnicity?: string;
  race?: string[];
  maritalStatus?: MaritalStatusType;
  primaryAddress: AddressData;
  emergencyContacts: EmergencyContactData[];
  primaryPhysician?: {
    name: string;
    specialty?: string;
    phone: { number: string; type: PhoneType };
    npi?: string;
  };
  insurance?: InsuranceData[];
  allergies?: AllergyData[];
  riskFlags: RiskFlagData[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface EmergencyContactData {
  id: UUID;
  name: string;
  relationship: string;
  phone: { number: string; type: PhoneType };
  alternatePhone?: { number: string; type: PhoneType };
  email?: string;
  isPrimary: boolean;
  canMakeHealthcareDecisions: boolean;
}

interface InsuranceData {
  id: UUID;
  type: InsuranceType;
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  subscriberId?: string;
  subscriberName?: string;
  subscriberRelationship?: string;
  effectiveDate?: Date;
  terminationDate?: Date;
}

interface AllergyData {
  id: UUID;
  allergen: string;
  type: AllergyType;
  reaction: string;
  severity: AllergySeverity;
}

interface RiskFlagData {
  id: UUID;
  type: string;
  severity: RiskSeverityType;
  description: string;
  identifiedDate: Date;
  resolvedDate?: Date;
}

interface OrganizationData {
  id: UUID;
  name: string;
  npi?: string;
  phone?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

// ============================================================================
// FHIR Export Service
// ============================================================================

export interface FHIRExportOptions {
  includeOrganization?: boolean;
}

export interface FHIRExportMetadata {
  patientCount: number;
  estimatedBundleSize: number;
  availablePatientIds: UUID[];
}

export class FHIRExportService {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://folkcare.health/fhir') {
    this.baseUrl = baseUrl;
  }

  // ============================================================================
  // Database-Aware Export Methods
  // ============================================================================

  /**
   * Export a patient bundle by client ID (fetches from database)
   */
  async exportPatientBundle(
    clientId: UUID,
    organizationId: UUID,
    options: FHIRExportOptions = {}
  ): Promise<Bundle> {
    const db = getDatabase();

    // Fetch client data
    const clientResult = await db.query<Record<string, unknown>>(
      `SELECT * FROM clients WHERE id = $1 AND organization_id = $2 AND is_deleted = false`,
      [clientId, organizationId]
    );

    if (clientResult.rows.length === 0) {
      throw new Error(`Client not found: ${clientId}`);
    }

    // Transform database row to ClientData
    const client = this.mapDatabaseRowToClientData(clientResult.rows[0]!);

    // Optionally fetch organization
    let organization: OrganizationData | undefined;
    if (options.includeOrganization === true) {
      const orgResult = await db.query<Record<string, unknown>>(
        `SELECT * FROM organizations WHERE id = $1`,
        [organizationId]
      );
      if (orgResult.rows.length > 0) {
        organization = this.mapDatabaseRowToOrganizationData(orgResult.rows[0]!);
      }
    }

    return this.createPatientBundle(client, organization);
  }

  /**
   * Export multiple patients as a searchset bundle (fetches from database)
   */
  async exportPatientSearchSet(
    clientIds: UUID[],
    organizationId: UUID,
    _options: FHIRExportOptions = {}
  ): Promise<Bundle> {
    const db = getDatabase();

    // Build parameterized query for array of IDs
    const placeholders = clientIds.map((_, i) => `$${i + 1}`).join(', ');
    const clientResult = await db.query<Record<string, unknown>>(
      `SELECT * FROM clients WHERE id IN (${placeholders}) AND organization_id = $${clientIds.length + 1} AND is_deleted = false`,
      [...clientIds, organizationId]
    );

    const clients = clientResult.rows.map((row) => this.mapDatabaseRowToClientData(row));

    return this.createPatientSearchSet(clients);
  }

  /**
   * Get export metadata for an organization
   */
  async getExportMetadata(organizationId: UUID): Promise<FHIRExportMetadata> {
    const db = getDatabase();

    const result = await db.query<{ id: UUID }>(
      `SELECT id FROM clients WHERE organization_id = $1 AND is_deleted = false`,
      [organizationId]
    );

    const patientCount = result.rows.length;
    // Rough estimate: ~2KB per patient bundle
    const estimatedBundleSize = patientCount * 2048;

    return {
      patientCount,
      estimatedBundleSize,
      availablePatientIds: result.rows.map((c) => c.id)
    };
  }

  // ============================================================================
  // Database Row Mappers
  // ============================================================================

  private mapDatabaseRowToClientData(row: Record<string, unknown>): ClientData {
    return {
      id: row.id as UUID,
      organizationId: row.organization_id as UUID,
      clientNumber: (row.client_number as string) || '',
      firstName: row.first_name as string,
      middleName: row.middle_name as string | undefined,
      lastName: row.last_name as string,
      preferredName: row.preferred_name as string | undefined,
      dateOfBirth: new Date(row.date_of_birth as string),
      ssn: row.ssn as string | undefined,
      gender: row.gender as ClientData['gender'],
      pronouns: row.pronouns as string | undefined,
      primaryPhone: row.primary_phone as ClientData['primaryPhone'],
      alternatePhone: row.alternate_phone as ClientData['alternatePhone'],
      email: row.email as string | undefined,
      language: row.language as string | undefined,
      ethnicity: row.ethnicity as string | undefined,
      race: row.race as string[] | undefined,
      maritalStatus: row.marital_status as ClientData['maritalStatus'],
      primaryAddress: row.primary_address as ClientData['primaryAddress'] || {
        type: 'HOME' as const,
        line1: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'USA'
      },
      emergencyContacts: (row.emergency_contacts as EmergencyContactData[]) || [],
      primaryPhysician: row.primary_physician as ClientData['primaryPhysician'],
      insurance: row.insurance as InsuranceData[] | undefined,
      allergies: row.allergies as AllergyData[] | undefined,
      riskFlags: (row.risk_flags as RiskFlagData[]) || [],
      status: row.status as string,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string)
    };
  }

  private mapDatabaseRowToOrganizationData(row: Record<string, unknown>): OrganizationData {
    const address = row.primary_address as OrganizationData['address'];
    return {
      id: row.id as UUID,
      name: row.name as string,
      npi: row.npi as string | undefined,
      phone: row.phone as string | undefined,
      address
    };
  }

  // ============================================================================
  // Bundle Creation (from ClientData objects)
  // ============================================================================

  /**
   * Create a complete patient bundle with all related resources
   */
  createPatientBundle(
    client: ClientData,
    organization?: OrganizationData
  ): Bundle {
    const entries: BundleEntry[] = [];
    const timestamp = new Date().toISOString();

    // Add Patient resource
    const patient = this.mapClientToPatient(client);
    entries.push(this.createBundleEntry(patient));

    // Add RelatedPerson resources (emergency contacts)
    for (const contact of client.emergencyContacts) {
      const relatedPerson = this.mapEmergencyContactToRelatedPerson(contact, client.id);
      entries.push(this.createBundleEntry(relatedPerson));
    }

    // Add AllergyIntolerance resources
    if (client.allergies) {
      for (const allergy of client.allergies) {
        const allergyIntolerance = this.mapAllergyToAllergyIntolerance(allergy, client.id);
        entries.push(this.createBundleEntry(allergyIntolerance));
      }
    }

    // Add Coverage resources (insurance)
    if (client.insurance) {
      for (const insurance of client.insurance) {
        const coverage = this.mapInsuranceToCoverage(insurance, client.id, organization?.id);
        entries.push(this.createBundleEntry(coverage));
      }
    }

    // Add Condition resources (risk flags)
    for (const riskFlag of client.riskFlags) {
      const condition = this.mapRiskFlagToCondition(riskFlag, client.id);
      entries.push(this.createBundleEntry(condition));
    }

    // Add Practitioner resource (primary physician)
    if (client.primaryPhysician) {
      const practitioner = this.mapPhysicianToPractitioner(client.primaryPhysician);
      entries.push(this.createBundleEntry(practitioner));
    }

    const bundle: Bundle = {
      resourceType: 'Bundle',
      id: `bundle-${client.id}`,
      type: 'collection',
      timestamp,
      total: entries.length,
      entry: entries,
      meta: {
        lastUpdated: timestamp,
        profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient']
      }
    };

    return bundle;
  }

  /**
   * Create a searchset bundle from ClientData objects
   */
  createPatientSearchSet(clients: ClientData[]): Bundle {
    const entries: BundleEntry[] = clients.map(client => {
      const patient = this.mapClientToPatient(client);
      return this.createBundleEntry(patient);
    });

    const bundle: Bundle = {
      resourceType: 'Bundle',
      id: `searchset-${Date.now()}`,
      type: 'searchset',
      timestamp: new Date().toISOString(),
      total: entries.length,
      entry: entries
    };

    return bundle;
  }

  // ============================================================================
  // Individual Resource Mappers
  // ============================================================================

  /**
   * Map client to FHIR Patient resource
   */
  mapClientToPatient(client: ClientData): Patient {
    const patient: Patient = {
      resourceType: 'Patient',
      id: client.id,
      meta: {
        lastUpdated: client.updatedAt.toISOString(),
        profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient']
      },
      identifier: this.buildPatientIdentifiers(client),
      active: client.status === 'ACTIVE',
      name: this.buildPatientNames(client),
      telecom: this.buildContactPoints(client),
      gender: this.mapGender(client.gender),
      birthDate: this.formatDate(client.dateOfBirth),
      address: this.buildAddresses(client),
      maritalStatus: this.mapMaritalStatus(client.maritalStatus),
      contact: this.buildPatientContacts(client.emergencyContacts),
      communication: client.language ? [{
        language: {
          coding: [{
            system: 'urn:ietf:bcp:47',
            code: this.mapLanguageCode(client.language)
          }],
          text: client.language
        },
        preferred: true
      }] : undefined
    };

    // Add deceased indicator if discharged
    if (client.status === 'DECEASED') {
      patient.deceasedBoolean = true;
    }

    return patient;
  }

  /**
   * Map emergency contact to FHIR RelatedPerson resource
   */
  mapEmergencyContactToRelatedPerson(
    contact: EmergencyContactData,
    patientId: UUID
  ): RelatedPerson {
    const relatedPerson: RelatedPerson = {
      resourceType: 'RelatedPerson',
      id: contact.id,
      active: true,
      patient: {
        reference: `Patient/${patientId}`
      },
      relationship: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-RoleCode',
          code: this.mapRelationshipCode(contact.relationship),
          display: contact.relationship
        }],
        text: contact.relationship
      }],
      name: [this.parseContactName(contact.name)],
      telecom: this.buildRelatedPersonTelecom(contact)
    };

    return relatedPerson;
  }

  /**
   * Map allergy to FHIR AllergyIntolerance resource
   */
  mapAllergyToAllergyIntolerance(
    allergy: AllergyData,
    patientId: UUID
  ): AllergyIntolerance {
    const allergyIntolerance: AllergyIntolerance = {
      resourceType: 'AllergyIntolerance',
      id: allergy.id,
      clinicalStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
          code: 'active',
          display: 'Active'
        }]
      },
      verificationStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
          code: 'confirmed',
          display: 'Confirmed'
        }]
      },
      type: 'allergy',
      category: [this.mapAllergyCategory(allergy.type)],
      criticality: this.mapAllergyCriticality(allergy.severity),
      code: {
        text: allergy.allergen
      },
      patient: {
        reference: `Patient/${patientId}`
      },
      reaction: [{
        manifestation: [{
          text: allergy.reaction
        }],
        severity: this.mapReactionSeverity(allergy.severity)
      }]
    };

    return allergyIntolerance;
  }

  /**
   * Map insurance to FHIR Coverage resource
   */
  mapInsuranceToCoverage(
    insurance: InsuranceData,
    patientId: UUID,
    _organizationId?: UUID
  ): Coverage {
    const coverage: Coverage = {
      resourceType: 'Coverage',
      id: insurance.id,
      status: this.getCoverageStatus(insurance),
      type: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'HIP',
          display: 'Health Insurance Plan'
        }]
      },
      subscriberId: insurance.subscriberId || insurance.policyNumber,
      beneficiary: {
        reference: `Patient/${patientId}`
      },
      period: {
        start: insurance.effectiveDate?.toISOString().split('T')[0],
        end: insurance.terminationDate?.toISOString().split('T')[0]
      },
      payor: [{
        display: insurance.provider
      }],
      class: insurance.groupNumber ? [{
        type: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/coverage-class',
            code: 'group'
          }]
        },
        value: insurance.groupNumber,
        name: 'Group'
      }] : undefined,
      order: this.getCoverageOrder(insurance.type)
    };

    return coverage;
  }

  /**
   * Map risk flag to FHIR Condition resource
   */
  mapRiskFlagToCondition(
    riskFlag: RiskFlagData,
    patientId: UUID
  ): Condition {
    const condition: Condition = {
      resourceType: 'Condition',
      id: riskFlag.id,
      clinicalStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: riskFlag.resolvedDate ? 'resolved' : 'active',
          display: riskFlag.resolvedDate ? 'Resolved' : 'Active'
        }]
      },
      verificationStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
          code: 'confirmed',
          display: 'Confirmed'
        }]
      },
      category: [{
        coding: [{
          system: 'http://folkcare.health/CodeSystem/risk-category',
          code: 'risk-flag',
          display: 'Risk Flag'
        }]
      }],
      severity: this.mapRiskSeverity(riskFlag.severity),
      code: {
        coding: [{
          system: 'http://folkcare.health/CodeSystem/risk-type',
          code: riskFlag.type,
          display: riskFlag.type.replace(/_/g, ' ')
        }],
        text: riskFlag.description
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      onsetDateTime: riskFlag.identifiedDate.toISOString(),
      abatementDateTime: riskFlag.resolvedDate?.toISOString()
    };

    return condition;
  }

  /**
   * Map physician to FHIR Practitioner resource
   */
  mapPhysicianToPractitioner(physician: {
    name: string;
    specialty?: string;
    phone: { number: string; type: 'MOBILE' | 'HOME' | 'WORK' };
    npi?: string;
  }): Practitioner {
    const practitioner: Practitioner = {
      resourceType: 'Practitioner',
      id: `practitioner-${Date.now()}`,
      identifier: physician.npi ? [{
        system: 'http://hl7.org/fhir/sid/us-npi',
        value: physician.npi
      }] : undefined,
      active: true,
      name: [this.parseContactName(physician.name)],
      telecom: [{
        system: 'phone',
        value: physician.phone.number,
        use: this.mapPhoneType(physician.phone.type)
      }],
      qualification: physician.specialty ? [{
        code: {
          text: physician.specialty
        }
      }] : undefined
    };

    return practitioner;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private createBundleEntry(resource: Resource): BundleEntry {
    return {
      fullUrl: `${this.baseUrl}/${resource.resourceType}/${resource.id}`,
      resource
    };
  }

  private buildPatientIdentifiers(client: ClientData): Identifier[] {
    const identifiers: Identifier[] = [
      {
        use: 'usual',
        system: `${this.baseUrl}/client-number`,
        value: client.clientNumber
      },
      {
        use: 'official',
        system: `${this.baseUrl}/client-id`,
        value: client.id
      }
    ];

    if (client.ssn) {
      identifiers.push({
        use: 'official',
        type: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
            code: 'SS',
            display: 'Social Security Number'
          }]
        },
        system: 'http://hl7.org/fhir/sid/us-ssn',
        value: client.ssn
      });
    }

    return identifiers;
  }

  private buildPatientNames(client: ClientData): HumanName[] {
    const names: HumanName[] = [{
      use: 'official',
      family: client.lastName,
      given: client.middleName
        ? [client.firstName, client.middleName]
        : [client.firstName]
    }];

    if (client.preferredName) {
      names.push({
        use: 'nickname',
        given: [client.preferredName]
      });
    }

    return names;
  }

  private buildContactPoints(client: ClientData): ContactPoint[] {
    const telecom: ContactPoint[] = [];

    if (client.primaryPhone) {
      telecom.push({
        system: 'phone',
        value: client.primaryPhone.number,
        use: this.mapPhoneType(client.primaryPhone.type),
        rank: 1
      });

      if (client.primaryPhone.canReceiveSMS) {
        telecom.push({
          system: 'sms',
          value: client.primaryPhone.number,
          use: this.mapPhoneType(client.primaryPhone.type)
        });
      }
    }

    if (client.alternatePhone) {
      telecom.push({
        system: 'phone',
        value: client.alternatePhone.number,
        use: this.mapPhoneType(client.alternatePhone.type),
        rank: 2
      });
    }

    if (client.email) {
      telecom.push({
        system: 'email',
        value: client.email,
        use: 'home'
      });
    }

    return telecom;
  }

  private buildAddresses(client: ClientData): FHIRAddress[] {
    const addr = client.primaryAddress;
    return [{
      use: this.mapAddressType(addr.type),
      type: 'both',
      line: addr.line2 ? [addr.line1, addr.line2] : [addr.line1],
      city: addr.city,
      district: addr.county,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country
    }];
  }

  private buildPatientContacts(emergencyContacts: EmergencyContactData[]): PatientContact[] {
    return emergencyContacts.map(contact => ({
      relationship: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v2-0131',
          code: contact.canMakeHealthcareDecisions ? 'C' : 'N',
          display: contact.canMakeHealthcareDecisions ? 'Emergency Contact' : 'Next-of-Kin'
        }],
        text: contact.relationship
      }],
      name: this.parseContactName(contact.name),
      telecom: [{
        system: 'phone',
        value: contact.phone.number,
        use: this.mapPhoneType(contact.phone.type)
      }]
    }));
  }

  private buildRelatedPersonTelecom(contact: EmergencyContactData): ContactPoint[] {
    const telecom: ContactPoint[] = [{
      system: 'phone',
      value: contact.phone.number,
      use: this.mapPhoneType(contact.phone.type)
    }];

    if (contact.alternatePhone) {
      telecom.push({
        system: 'phone',
        value: contact.alternatePhone.number,
        use: this.mapPhoneType(contact.alternatePhone.type)
      });
    }

    if (contact.email) {
      telecom.push({
        system: 'email',
        value: contact.email
      });
    }

    return telecom;
  }

  private parseContactName(fullName: string): HumanName {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0) {
      return { given: [fullName || 'Unknown'] };
    }
    if (parts.length === 1) {
      return { given: [parts[0]!] };
    }
    return {
      family: parts[parts.length - 1],
      given: parts.slice(0, -1)
    };
  }

  private mapGender(
    gender?: GenderType
  ): FHIRGender {
    switch (gender) {
      case 'MALE':
        return 'male';
      case 'FEMALE':
        return 'female';
      case 'NON_BINARY':
      case 'OTHER':
        return 'other';
      default:
        return 'unknown';
    }
  }

  private mapMaritalStatus(
    status?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'SEPARATED' | 'DOMESTIC_PARTNERSHIP'
  ): CodeableConcept | undefined {
    if (!status) return undefined;

    const codeMap: Record<string, { code: string; display: string }> = {
      'SINGLE': { code: 'S', display: 'Never Married' },
      'MARRIED': { code: 'M', display: 'Married' },
      'DIVORCED': { code: 'D', display: 'Divorced' },
      'WIDOWED': { code: 'W', display: 'Widowed' },
      'SEPARATED': { code: 'L', display: 'Legally Separated' },
      'DOMESTIC_PARTNERSHIP': { code: 'T', display: 'Domestic Partner' }
    };

    const mapping = codeMap[status]!;
    return {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus',
        code: mapping.code,
        display: mapping.display
      }],
      text: status.replace(/_/g, ' ')
    };
  }

  private mapPhoneType(type: 'MOBILE' | 'HOME' | 'WORK'): 'mobile' | 'home' | 'work' {
    return type.toLowerCase() as 'mobile' | 'home' | 'work';
  }

  private mapAddressType(type: 'HOME' | 'BILLING' | 'TEMPORARY'): 'home' | 'billing' | 'temp' {
    switch (type) {
      case 'HOME':
        return 'home';
      case 'BILLING':
        return 'billing';
      case 'TEMPORARY':
        return 'temp';
      default:
        return 'home';
    }
  }

  private mapRelationshipCode(relationship: string): string {
    const codeMap: Record<string, string> = {
      'SPOUSE': 'SPS',
      'PARENT': 'PRN',
      'CHILD': 'CHILD',
      'SIBLING': 'SIB',
      'GUARDIAN': 'GUARD',
      'FRIEND': 'FRND',
      'OTHER': 'O'
    };
    return codeMap[relationship.toUpperCase()] || 'O';
  }

  private mapAllergyCategory(
    type: 'MEDICATION' | 'FOOD' | 'ENVIRONMENTAL' | 'OTHER'
  ): 'food' | 'medication' | 'environment' | 'biologic' {
    switch (type) {
      case 'MEDICATION':
        return 'medication';
      case 'FOOD':
        return 'food';
      case 'ENVIRONMENTAL':
        return 'environment';
      default:
        return 'environment';
    }
  }

  private mapAllergyCriticality(
    severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING'
  ): 'low' | 'high' | 'unable-to-assess' {
    switch (severity) {
      case 'MILD':
      case 'MODERATE':
        return 'low';
      case 'SEVERE':
      case 'LIFE_THREATENING':
        return 'high';
      default:
        return 'unable-to-assess';
    }
  }

  private mapReactionSeverity(
    severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING'
  ): 'mild' | 'moderate' | 'severe' {
    switch (severity) {
      case 'MILD':
        return 'mild';
      case 'MODERATE':
        return 'moderate';
      case 'SEVERE':
      case 'LIFE_THREATENING':
        return 'severe';
      default:
        return 'moderate';
    }
  }

  private mapRiskSeverity(
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ): CodeableConcept {
    const severityMap: Record<string, { code: string; display: string }> = {
      'LOW': { code: '255604002', display: 'Mild' },
      'MEDIUM': { code: '6736007', display: 'Moderate' },
      'HIGH': { code: '24484000', display: 'Severe' },
      'CRITICAL': { code: '442452003', display: 'Life-threatening severity' }
    };

    const mapping = severityMap[severity]!;
    return {
      coding: [{
        system: 'http://snomed.info/sct',
        code: mapping.code,
        display: mapping.display
      }]
    };
  }

  private getCoverageStatus(insurance: InsuranceData): 'active' | 'cancelled' {
    if (insurance.terminationDate && new Date(insurance.terminationDate) < new Date()) {
      return 'cancelled';
    }
    return 'active';
  }

  private getCoverageOrder(type: 'PRIMARY' | 'SECONDARY' | 'TERTIARY'): number {
    switch (type) {
      case 'PRIMARY':
        return 1;
      case 'SECONDARY':
        return 2;
      case 'TERTIARY':
        return 3;
      default:
        return 1;
    }
  }

  private mapLanguageCode(language: string): string {
    const languageMap: Record<string, string> = {
      'english': 'en',
      'spanish': 'es',
      'chinese': 'zh',
      'vietnamese': 'vi',
      'tagalog': 'tl',
      'korean': 'ko',
      'french': 'fr',
      'german': 'de',
      'arabic': 'ar',
      'russian': 'ru',
      'portuguese': 'pt',
      'japanese': 'ja',
      'haitian creole': 'ht',
      'hindi': 'hi',
      'bengali': 'bn',
      'polish': 'pl'
    };
    return languageMap[language.toLowerCase()] || language.toLowerCase().substring(0, 2);
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]!;
  }
}
