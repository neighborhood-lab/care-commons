/**
 * HL7 v2.x Export Service
 *
 * Service for exporting client data in HL7 v2.x format.
 * Supports ADT (Admission, Discharge, Transfer) messages for legacy system integration.
 *
 * @see https://www.hl7.org/implement/standards/product_brief.cfm?product_id=185
 */

/* eslint-disable max-lines -- HL7 message generation requires comprehensive segment handling */
/* eslint-disable @typescript-eslint/strict-boolean-expressions -- HL7 mapping uses standard truthy/falsy checks */
/* eslint-disable complexity -- HL7 segment serialization requires many conditional field mappings */
/* eslint-disable sonarjs/no-nested-conditional -- HL7 field mappings require nested ternary for value transformations */

import type { UUID } from '../types/base.js';
import type {
  HL7Message,
  HL7ExportOptions,
  HL7ExportResult,
  MSHSegment,
  PIDSegment,
  NK1Segment,
  AL1Segment,
  IN1Segment,
  PV1Segment,
  ExtendedPersonName,
  ExtendedAddress,
  ExtendedTelecommunicationNumber,
  CodedElement,
  PatientIdentifier,
  HL7MessageType,
  HL7EventType
} from './types.js';
import { getDatabase } from '../db/connection.js';

// ============================================================================
// Input Types (from client-demographics)
// ============================================================================

type GenderType = 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER' | 'PREFER_NOT_TO_SAY';
type PhoneType = 'MOBILE' | 'HOME' | 'WORK';
type MaritalStatusType = 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'SEPARATED' | 'DOMESTIC_PARTNERSHIP';
type AddressType = 'HOME' | 'BILLING' | 'TEMPORARY';
type InsuranceType = 'PRIMARY' | 'SECONDARY' | 'TERTIARY';
type AllergyTypeInternal = 'MEDICATION' | 'FOOD' | 'ENVIRONMENTAL' | 'OTHER';
type AllergySeverity = 'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING';

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
  type: AllergyTypeInternal;
  reaction: string;
  severity: AllergySeverity;
}

// ============================================================================
// HL7 Export Service
// ============================================================================

export interface HL7ExportMetadata {
  patientCount: number;
  supportedMessageTypes: HL7MessageType[];
  supportedEventTypes: HL7EventType[];
  hl7Version: string;
}

export class HL7ExportService {
  private readonly fieldSeparator = '|';
  private readonly encodingChars = '^~\\&';
  private readonly componentSeparator = '^';
  private readonly repetitionSeparator = '~';
  private readonly hl7Version = '2.5.1';

  // ============================================================================
  // Database-Aware Export Methods
  // ============================================================================

  /**
   * Export a patient as HL7 ADT message (fetches from database)
   */
  async exportPatientMessage(
    clientId: UUID,
    organizationId: UUID,
    options: HL7ExportOptions = {}
  ): Promise<HL7ExportResult> {
    const db = getDatabase();

    const clientResult = await db.query<Record<string, unknown>>(
      `SELECT * FROM clients WHERE id = $1 AND organization_id = $2 AND is_deleted = false`,
      [clientId, organizationId]
    );

    if (clientResult.rows.length === 0) {
      throw new Error(`Client not found: ${clientId}`);
    }

    const client = this.mapDatabaseRowToClientData(clientResult.rows[0]!);

    return this.createPatientMessage(client, options);
  }

  /**
   * Export multiple patients as HL7 messages (fetches from database)
   */
  async exportPatientBatch(
    clientIds: UUID[],
    organizationId: UUID,
    options: HL7ExportOptions = {}
  ): Promise<HL7ExportResult[]> {
    const db = getDatabase();

    const placeholders = clientIds.map((_, i) => `$${i + 1}`).join(', ');
    const clientResult = await db.query<Record<string, unknown>>(
      `SELECT * FROM clients WHERE id IN (${placeholders}) AND organization_id = $${clientIds.length + 1} AND is_deleted = false`,
      [...clientIds, organizationId]
    );

    const clients = clientResult.rows.map((row) => this.mapDatabaseRowToClientData(row));

    return clients.map(client => this.createPatientMessage(client, options));
  }

  /**
   * Get export metadata for an organization
   */
  async getExportMetadata(organizationId: UUID): Promise<HL7ExportMetadata> {
    const db = getDatabase();

    const result = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM clients WHERE organization_id = $1 AND is_deleted = false`,
      [organizationId]
    );

    const patientCount = parseInt(result.rows[0]?.count ?? '0', 10);

    return {
      patientCount,
      supportedMessageTypes: ['ADT'],
      supportedEventTypes: ['A01', 'A04', 'A08', 'A28', 'A31'],
      hl7Version: this.hl7Version
    };
  }

  // ============================================================================
  // Message Creation
  // ============================================================================

  /**
   * Create an HL7 ADT message from client data
   */
  createPatientMessage(
    client: ClientData,
    options: HL7ExportOptions = {}
  ): HL7ExportResult {
    const messageControlId = this.generateMessageControlId();
    const timestamp = this.formatDateTime(new Date());

    const message: HL7Message = {
      msh: this.createMSHSegment(options, messageControlId, timestamp),
      pid: this.createPIDSegment(client),
      pv1: this.createPV1Segment(client)
    };

    // Add NK1 segments for emergency contacts
    if (options.includeNextOfKin !== false && client.emergencyContacts.length > 0) {
      message.nk1 = client.emergencyContacts.map((contact, index) =>
        this.createNK1Segment(contact, index + 1)
      );
    }

    // Add AL1 segments for allergies
    if (options.includeAllergies !== false && client.allergies && client.allergies.length > 0) {
      message.al1 = client.allergies.map((allergy, index) =>
        this.createAL1Segment(allergy, index + 1)
      );
    }

    // Add IN1 segments for insurance
    if (options.includeInsurance !== false && client.insurance && client.insurance.length > 0) {
      message.in1 = client.insurance.map((insurance, index) =>
        this.createIN1Segment(insurance, index + 1)
      );
    }

    // Build raw message
    const segments = this.buildMessageSegments(message);
    const rawMessage = segments.join('\r');

    return {
      messageControlId,
      rawMessage,
      segments,
      timestamp
    };
  }

  // ============================================================================
  // Segment Creation
  // ============================================================================

  private createMSHSegment(
    options: HL7ExportOptions,
    messageControlId: string,
    timestamp: string
  ): MSHSegment {
    return {
      fieldSeparator: this.fieldSeparator,
      encodingCharacters: this.encodingChars,
      sendingApplication: options.sendingApplication ?? 'FOLKCARE',
      sendingFacility: options.sendingFacility ?? 'FOLKCARE_HHA',
      receivingApplication: options.receivingApplication ?? '',
      receivingFacility: options.receivingFacility ?? '',
      dateTimeOfMessage: timestamp,
      messageType: {
        messageCode: options.messageType ?? 'ADT',
        triggerEvent: options.eventType ?? 'A08',
        messageStructure: 'ADT_A01'
      },
      messageControlId,
      processingId: 'P',
      versionId: this.hl7Version
    };
  }

  private createPIDSegment(client: ClientData): PIDSegment {
    const pid: PIDSegment = {
      setId: 1,
      patientIdentifierList: [
        {
          idNumber: client.clientNumber,
          assigningAuthority: 'FOLKCARE',
          identifierTypeCode: 'MR'
        },
        {
          idNumber: client.id,
          assigningAuthority: 'FOLKCARE',
          identifierTypeCode: 'PI'
        }
      ],
      patientName: [{
        familyName: client.lastName,
        givenName: client.firstName,
        secondAndFurtherGivenNames: client.middleName,
        nameTypeCode: 'L'
      }],
      dateOfBirth: this.formatDate(client.dateOfBirth),
      administrativeSex: this.mapGender(client.gender),
      patientAddress: [this.mapAddress(client.primaryAddress)],
      phoneNumberHome: client.primaryPhone ? [this.mapPhone(client.primaryPhone)] : undefined,
      phoneNumberBusiness: client.alternatePhone ? [this.mapPhone(client.alternatePhone)] : undefined,
      primaryLanguage: client.language ? { text: client.language } : undefined,
      maritalStatus: client.maritalStatus ? this.mapMaritalStatus(client.maritalStatus) : undefined,
      ssn: client.ssn,
      ethnicGroup: client.ethnicity ? [{ text: client.ethnicity }] : undefined,
      race: client.race?.map(r => ({ text: r }))
    };

    if (client.preferredName) {
      pid.patientAlias = [{
        familyName: client.lastName,
        givenName: client.preferredName,
        nameTypeCode: 'N'
      }];
    }

    return pid;
  }

  private createPV1Segment(client: ClientData): PV1Segment {
    return {
      setId: 1,
      patientClass: 'O', // Outpatient (home health)
      admitDateTime: this.formatDateTime(client.createdAt),
      attendingDoctor: client.primaryPhysician ? [{
        idNumber: client.primaryPhysician.npi ?? '',
        familyName: this.parseLastName(client.primaryPhysician.name),
        givenName: this.parseFirstName(client.primaryPhysician.name)
      }] : undefined
    };
  }

  private createNK1Segment(contact: EmergencyContactData, setId: number): NK1Segment {
    return {
      setId,
      name: [{
        familyName: this.parseLastName(contact.name),
        givenName: this.parseFirstName(contact.name)
      }],
      relationship: { text: contact.relationship },
      phoneNumber: [this.mapPhone(contact.phone)],
      businessPhoneNumber: contact.alternatePhone ? [this.mapPhone(contact.alternatePhone)] : undefined,
      contactRole: contact.canMakeHealthcareDecisions
        ? { identifier: 'E', text: 'Emergency Contact' }
        : { identifier: 'N', text: 'Next of Kin' }
    };
  }

  private createAL1Segment(allergy: AllergyData, setId: number): AL1Segment {
    return {
      setId,
      allergenTypeCode: this.mapAllergyType(allergy.type),
      allergenCodeDescription: { text: allergy.allergen },
      allergySeverityCode: this.mapAllergySeverity(allergy.severity),
      allergyReactionCode: [allergy.reaction]
    };
  }

  private createIN1Segment(insurance: InsuranceData, setId: number): IN1Segment {
    return {
      setId,
      insurancePlanId: { text: insurance.provider },
      insuranceCompanyId: [insurance.provider],
      insuranceCompanyName: [insurance.provider],
      groupNumber: insurance.groupNumber,
      planEffectiveDate: insurance.effectiveDate
        ? this.formatDate(insurance.effectiveDate)
        : undefined,
      planExpirationDate: insurance.terminationDate
        ? this.formatDate(insurance.terminationDate)
        : undefined,
      policyNumber: insurance.policyNumber,
      coordinationOfBenefitsPriority: this.mapInsurancePriority(insurance.type),
      insuredIdNumber: insurance.subscriberId ? [insurance.subscriberId] : undefined
    };
  }

  // ============================================================================
  // Segment Serialization
  // ============================================================================

  private buildMessageSegments(message: HL7Message): string[] {
    const segments: string[] = [];

    // MSH
    segments.push(this.serializeMSH(message.msh));

    // PID
    if (message.pid) {
      segments.push(this.serializePID(message.pid));
    }

    // PV1
    if (message.pv1) {
      segments.push(this.serializePV1(message.pv1));
    }

    // NK1 segments
    if (message.nk1) {
      for (const nk1 of message.nk1) {
        segments.push(this.serializeNK1(nk1));
      }
    }

    // AL1 segments
    if (message.al1) {
      for (const al1 of message.al1) {
        segments.push(this.serializeAL1(al1));
      }
    }

    // IN1 segments
    if (message.in1) {
      for (const in1 of message.in1) {
        segments.push(this.serializeIN1(in1));
      }
    }

    return segments;
  }

  private serializeMSH(msh: MSHSegment): string {
    const fields = [
      'MSH',
      msh.encodingCharacters,
      msh.sendingApplication,
      msh.sendingFacility,
      msh.receivingApplication,
      msh.receivingFacility,
      msh.dateTimeOfMessage,
      msh.security ?? '',
      `${msh.messageType.messageCode}${this.componentSeparator}${msh.messageType.triggerEvent}${this.componentSeparator}${msh.messageType.messageStructure ?? ''}`,
      msh.messageControlId,
      msh.processingId,
      msh.versionId
    ];
    return fields.join(this.fieldSeparator);
  }

  private serializePID(pid: PIDSegment): string {
    const fields: string[] = [
      'PID',
      String(pid.setId ?? 1),
      pid.patientId ?? '',
      this.serializePatientIdentifiers(pid.patientIdentifierList),
      pid.alternatePatientId ?? '',
      this.serializePersonNames(pid.patientName),
      pid.mothersMaidenName ? this.serializePersonName(pid.mothersMaidenName) : '',
      pid.dateOfBirth ?? '',
      pid.administrativeSex ?? '',
      pid.patientAlias ? this.serializePersonNames(pid.patientAlias) : '',
      pid.race ? this.serializeCodedElements(pid.race) : '',
      pid.patientAddress ? this.serializeAddresses(pid.patientAddress) : '',
      pid.countyCode ?? '',
      pid.phoneNumberHome ? this.serializePhones(pid.phoneNumberHome) : '',
      pid.phoneNumberBusiness ? this.serializePhones(pid.phoneNumberBusiness) : '',
      pid.primaryLanguage ? this.serializeCodedElement(pid.primaryLanguage) : '',
      pid.maritalStatus ? this.serializeCodedElement(pid.maritalStatus) : '',
      pid.religion ? this.serializeCodedElement(pid.religion) : '',
      pid.patientAccountNumber ?? '',
      pid.ssn ?? '',
      pid.driversLicenseNumber ?? '',
      '', // mothersIdentifier
      pid.ethnicGroup ? this.serializeCodedElements(pid.ethnicGroup) : ''
    ];
    return fields.join(this.fieldSeparator);
  }

  private serializePV1(pv1: PV1Segment): string {
    const fields: string[] = [
      'PV1',
      String(pv1.setId ?? 1),
      pv1.patientClass,
      pv1.assignedPatientLocation ?? '',
      pv1.admissionType ?? '',
      pv1.preadmitNumber ?? '',
      pv1.priorPatientLocation ?? '',
      pv1.attendingDoctor ? this.serializeProviders(pv1.attendingDoctor) : '',
      pv1.referringDoctor ? this.serializeProviders(pv1.referringDoctor) : '',
      pv1.consultingDoctor ? this.serializeProviders(pv1.consultingDoctor) : '',
      pv1.hospitalService ?? ''
    ];

    // Pad to field 44 (admitDateTime) and 45 (dischargeDateTime)
    while (fields.length < 44) {
      fields.push('');
    }
    fields.push(pv1.admitDateTime ?? '');
    fields.push(pv1.dischargeDateTime?.join(this.repetitionSeparator) ?? '');

    return fields.join(this.fieldSeparator);
  }

  private serializeNK1(nk1: NK1Segment): string {
    const fields: string[] = [
      'NK1',
      String(nk1.setId),
      nk1.name ? this.serializePersonNames(nk1.name) : '',
      nk1.relationship ? this.serializeCodedElement(nk1.relationship) : '',
      nk1.address ? this.serializeAddresses(nk1.address) : '',
      nk1.phoneNumber ? this.serializePhones(nk1.phoneNumber) : '',
      nk1.businessPhoneNumber ? this.serializePhones(nk1.businessPhoneNumber) : '',
      nk1.contactRole ? this.serializeCodedElement(nk1.contactRole) : ''
    ];
    return fields.join(this.fieldSeparator);
  }

  private serializeAL1(al1: AL1Segment): string {
    const fields: string[] = [
      'AL1',
      String(al1.setId),
      al1.allergenTypeCode ? this.serializeCodedElement(al1.allergenTypeCode) : '',
      this.serializeCodedElement(al1.allergenCodeDescription),
      al1.allergySeverityCode ? this.serializeCodedElement(al1.allergySeverityCode) : '',
      al1.allergyReactionCode?.join(this.repetitionSeparator) ?? '',
      al1.identificationDate ?? ''
    ];
    return fields.join(this.fieldSeparator);
  }

  private serializeIN1(in1: IN1Segment): string {
    const fields: string[] = [
      'IN1',
      String(in1.setId),
      this.serializeCodedElement(in1.insurancePlanId),
      in1.insuranceCompanyId.join(this.repetitionSeparator),
      in1.insuranceCompanyName?.join(this.repetitionSeparator) ?? '',
      '', // insuranceCompanyAddress
      '', // insuranceCompanyContactPerson
      '', // insuranceCompanyPhoneNumber
      in1.groupNumber ?? '',
      in1.groupName?.join(this.repetitionSeparator) ?? '',
      '', // insuredGroupEmployerId
      '', // insuredGroupEmployerName
      in1.planEffectiveDate ?? '',
      in1.planExpirationDate ?? ''
    ];

    // Pad to field 36 (policyNumber)
    while (fields.length < 36) {
      fields.push('');
    }
    fields.push(in1.policyNumber ?? '');

    return fields.join(this.fieldSeparator);
  }

  // ============================================================================
  // Serialization Helpers
  // ============================================================================

  private serializePatientIdentifiers(identifiers: PatientIdentifier[]): string {
    return identifiers.map(id => {
      const components = [
        id.idNumber,
        id.checkDigit ?? '',
        id.checkDigitScheme ?? '',
        id.assigningAuthority ?? '',
        id.identifierTypeCode ?? '',
        id.assigningFacility ?? ''
      ];
      return components.join(this.componentSeparator);
    }).join(this.repetitionSeparator);
  }

  private serializePersonNames(names: ExtendedPersonName[]): string {
    return names.map(name => this.serializePersonName(name)).join(this.repetitionSeparator);
  }

  private serializePersonName(name: ExtendedPersonName): string {
    const components = [
      name.familyName,
      name.givenName ?? '',
      name.secondAndFurtherGivenNames ?? '',
      name.suffix ?? '',
      name.prefix ?? '',
      name.degree ?? '',
      name.nameTypeCode ?? ''
    ];
    return components.join(this.componentSeparator);
  }

  private serializeAddresses(addresses: ExtendedAddress[]): string {
    return addresses.map(addr => {
      const components = [
        addr.streetAddress ?? '',
        addr.otherDesignation ?? '',
        addr.city ?? '',
        addr.stateOrProvince ?? '',
        addr.zipOrPostalCode ?? '',
        addr.country ?? '',
        addr.addressType ?? ''
      ];
      return components.join(this.componentSeparator);
    }).join(this.repetitionSeparator);
  }

  private serializePhones(phones: ExtendedTelecommunicationNumber[]): string {
    return phones.map(phone => {
      const components = [
        phone.telephoneNumber ?? '',
        phone.telecommunicationUseCode ?? '',
        phone.telecommunicationEquipmentType ?? '',
        phone.emailAddress ?? '',
        phone.countryCode ?? '',
        phone.areaCityCode ?? '',
        phone.localNumber ?? '',
        phone.extension ?? ''
      ];
      return components.join(this.componentSeparator);
    }).join(this.repetitionSeparator);
  }

  private serializeCodedElements(elements: CodedElement[]): string {
    return elements.map(el => this.serializeCodedElement(el)).join(this.repetitionSeparator);
  }

  private serializeCodedElement(element: CodedElement): string {
    const components = [
      element.identifier ?? '',
      element.text ?? '',
      element.nameOfCodingSystem ?? ''
    ];
    return components.join(this.componentSeparator);
  }

  private serializeProviders(providers: { idNumber: string; familyName?: string; givenName?: string }[]): string {
    return providers.map(p => {
      const components = [
        p.idNumber,
        p.familyName ?? '',
        p.givenName ?? ''
      ];
      return components.join(this.componentSeparator);
    }).join(this.repetitionSeparator);
  }

  // ============================================================================
  // Mapping Helpers
  // ============================================================================

  private mapGender(gender?: GenderType): 'M' | 'F' | 'O' | 'U' {
    switch (gender) {
      case 'MALE':
        return 'M';
      case 'FEMALE':
        return 'F';
      case 'NON_BINARY':
      case 'OTHER':
        return 'O';
      default:
        return 'U';
    }
  }

  private mapMaritalStatus(status: MaritalStatusType): CodedElement {
    const codeMap: Record<MaritalStatusType, { code: string; text: string }> = {
      SINGLE: { code: 'S', text: 'Single' },
      MARRIED: { code: 'M', text: 'Married' },
      DIVORCED: { code: 'D', text: 'Divorced' },
      WIDOWED: { code: 'W', text: 'Widowed' },
      SEPARATED: { code: 'E', text: 'Separated' },
      DOMESTIC_PARTNERSHIP: { code: 'T', text: 'Domestic Partner' }
    };
    const mapping = codeMap[status];
    return { identifier: mapping.code, text: mapping.text };
  }

  private mapAddress(addr: AddressData): ExtendedAddress {
    return {
      streetAddress: addr.line1 + (addr.line2 ? ` ${addr.line2}` : ''),
      city: addr.city,
      stateOrProvince: addr.state,
      zipOrPostalCode: addr.postalCode,
      country: addr.country,
      addressType: addr.type === 'HOME' ? 'H' : addr.type === 'BILLING' ? 'B' : 'C',
      countyOrParishCode: addr.county
    };
  }

  private mapPhone(phone: PhoneData): ExtendedTelecommunicationNumber {
    const useCode = phone.type === 'HOME' ? 'PRN' : phone.type === 'WORK' ? 'WPN' : 'ORN';
    return {
      telephoneNumber: phone.number,
      telecommunicationUseCode: useCode as ExtendedTelecommunicationNumber['telecommunicationUseCode'],
      telecommunicationEquipmentType: 'PH'
    };
  }

  private mapAllergyType(type: AllergyTypeInternal): CodedElement {
    const codeMap: Record<AllergyTypeInternal, { code: string; text: string }> = {
      MEDICATION: { code: 'DA', text: 'Drug Allergy' },
      FOOD: { code: 'FA', text: 'Food Allergy' },
      ENVIRONMENTAL: { code: 'EA', text: 'Environmental Allergy' },
      OTHER: { code: 'MA', text: 'Miscellaneous Allergy' }
    };
    const mapping = codeMap[type];
    return { identifier: mapping.code, text: mapping.text };
  }

  private mapAllergySeverity(severity: AllergySeverity): CodedElement {
    const codeMap: Record<AllergySeverity, { code: string; text: string }> = {
      MILD: { code: 'MI', text: 'Mild' },
      MODERATE: { code: 'MO', text: 'Moderate' },
      SEVERE: { code: 'SV', text: 'Severe' },
      LIFE_THREATENING: { code: 'U', text: 'Unknown/Life Threatening' }
    };
    const mapping = codeMap[severity];
    return { identifier: mapping.code, text: mapping.text };
  }

  private mapInsurancePriority(type: InsuranceType): string {
    switch (type) {
      case 'PRIMARY':
        return '1';
      case 'SECONDARY':
        return '2';
      case 'TERTIARY':
        return '3';
      default:
        return '1';
    }
  }

  // ============================================================================
  // Utility Helpers
  // ============================================================================

  private generateMessageControlId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    // eslint-disable-next-line sonarjs/pseudo-random -- Safe for non-cryptographic message IDs
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `FC${timestamp}${random}`;
  }

  private formatDateTime(date: Date): string {
    return date.toISOString()
      .replace(/[.:TZ-]/g, '')
      .slice(0, 14);
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]!.replace(/-/g, '');
  }

  private parseFirstName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    return parts[0] ?? '';
  }

  private parseLastName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    return parts.length > 1 ? parts[parts.length - 1]! : '';
  }

  // ============================================================================
  // Database Row Mapper
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
      gender: row.gender as GenderType | undefined,
      pronouns: row.pronouns as string | undefined,
      primaryPhone: row.primary_phone as PhoneData | undefined,
      alternatePhone: row.alternate_phone as PhoneData | undefined,
      email: row.email as string | undefined,
      language: row.language as string | undefined,
      ethnicity: row.ethnicity as string | undefined,
      race: row.race as string[] | undefined,
      maritalStatus: row.marital_status as MaritalStatusType | undefined,
      primaryAddress: (row.primary_address as AddressData | null) ?? {
        type: 'HOME' as const,
        line1: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'USA'
      },
      emergencyContacts: (row.emergency_contacts as EmergencyContactData[] | null) ?? [],
      primaryPhysician: row.primary_physician as ClientData['primaryPhysician'],
      insurance: row.insurance as InsuranceData[] | undefined,
      allergies: row.allergies as AllergyData[] | undefined,
      status: row.status as string,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string)
    };
  }
}
