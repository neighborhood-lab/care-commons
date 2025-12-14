/**
 * HL7 v2.x Type Definitions
 *
 * Type definitions for HL7 v2.x message generation.
 * Supports ADT (Admission, Discharge, Transfer) messages for patient data.
 *
 * @see https://www.hl7.org/implement/standards/product_brief.cfm?product_id=185
 */

// ============================================================================
// Message Types
// ============================================================================

export type HL7MessageType = 'ADT' | 'ORU' | 'ORM' | 'DFT' | 'MDM';
export type HL7EventType = 'A01' | 'A02' | 'A03' | 'A04' | 'A08' | 'A28' | 'A31';

// ============================================================================
// Segment Types
// ============================================================================

/**
 * MSH - Message Header Segment
 */
export interface MSHSegment {
  fieldSeparator: string;
  encodingCharacters: string;
  sendingApplication: string;
  sendingFacility: string;
  receivingApplication: string;
  receivingFacility: string;
  dateTimeOfMessage: string;
  security?: string;
  messageType: {
    messageCode: HL7MessageType;
    triggerEvent: HL7EventType;
    messageStructure?: string;
  };
  messageControlId: string;
  processingId: string;
  versionId: string;
  sequenceNumber?: number;
  continuationPointer?: string;
  acceptAcknowledgmentType?: string;
  applicationAcknowledgmentType?: string;
  countryCode?: string;
  characterSet?: string;
}

/**
 * PID - Patient Identification Segment
 */
export interface PIDSegment {
  setId?: number;
  patientId?: string;
  patientIdentifierList: PatientIdentifier[];
  alternatePatientId?: string;
  patientName: ExtendedPersonName[];
  mothersMaidenName?: ExtendedPersonName;
  dateOfBirth?: string;
  administrativeSex?: 'M' | 'F' | 'O' | 'U' | 'A' | 'N';
  patientAlias?: ExtendedPersonName[];
  race?: CodedElement[];
  patientAddress?: ExtendedAddress[];
  countyCode?: string;
  phoneNumberHome?: ExtendedTelecommunicationNumber[];
  phoneNumberBusiness?: ExtendedTelecommunicationNumber[];
  primaryLanguage?: CodedElement;
  maritalStatus?: CodedElement;
  religion?: CodedElement;
  patientAccountNumber?: string;
  ssn?: string;
  driversLicenseNumber?: string;
  mothersIdentifier?: PatientIdentifier[];
  ethnicGroup?: CodedElement[];
  birthPlace?: string;
  multipleBirthIndicator?: 'Y' | 'N';
  birthOrder?: number;
  citizenship?: CodedElement[];
  veteransMilitaryStatus?: CodedElement;
  nationality?: CodedElement;
  patientDeathDateAndTime?: string;
  patientDeathIndicator?: 'Y' | 'N';
  identityUnknownIndicator?: 'Y' | 'N';
  identityReliabilityCode?: string[];
  lastUpdateDateTime?: string;
  lastUpdateFacility?: string;
}

/**
 * NK1 - Next of Kin / Associated Parties Segment
 */
export interface NK1Segment {
  setId: number;
  name?: ExtendedPersonName[];
  relationship?: CodedElement;
  address?: ExtendedAddress[];
  phoneNumber?: ExtendedTelecommunicationNumber[];
  businessPhoneNumber?: ExtendedTelecommunicationNumber[];
  contactRole?: CodedElement;
  startDate?: string;
  endDate?: string;
  nextOfKinAssociatedPartiesJobTitle?: string;
  nextOfKinAssociatedPartiesJobCodeClass?: string;
  nextOfKinAssociatedPartiesEmployeeNumber?: string;
  organizationName?: string;
  maritalStatus?: CodedElement;
  administrativeSex?: 'M' | 'F' | 'O' | 'U';
  dateOfBirth?: string;
  livingDependency?: string[];
  ambulatoryStatus?: string[];
  citizenship?: CodedElement[];
  primaryLanguage?: CodedElement;
  livingArrangement?: string;
  publicityCode?: CodedElement;
  protectionIndicator?: 'Y' | 'N';
}

/**
 * PV1 - Patient Visit Segment
 */
export interface PV1Segment {
  setId?: number;
  patientClass: 'E' | 'I' | 'O' | 'P' | 'R' | 'B' | 'C' | 'N' | 'U';
  assignedPatientLocation?: string;
  admissionType?: string;
  preadmitNumber?: string;
  priorPatientLocation?: string;
  attendingDoctor?: ExtendedCompositeIdWithCheckDigit[];
  referringDoctor?: ExtendedCompositeIdWithCheckDigit[];
  consultingDoctor?: ExtendedCompositeIdWithCheckDigit[];
  hospitalService?: string;
  temporaryLocation?: string;
  preadmitTestIndicator?: string;
  readmissionIndicator?: string;
  admitSource?: string;
  ambulatoryStatus?: string[];
  vipIndicator?: string;
  admittingDoctor?: ExtendedCompositeIdWithCheckDigit[];
  patientType?: string;
  visitNumber?: string;
  financialClass?: string[];
  chargePriceIndicator?: string;
  courtesyCode?: string;
  creditRating?: string;
  contractCode?: string[];
  contractEffectiveDate?: string[];
  contractAmount?: number[];
  contractPeriod?: number[];
  interestCode?: string;
  transferToBadDebtCode?: string;
  transferToBadDebtDate?: string;
  badDebtAgencyCode?: string;
  badDebtTransferAmount?: number;
  badDebtRecoveryAmount?: number;
  deleteAccountIndicator?: string;
  deleteAccountDate?: string;
  dischargeDisposition?: string;
  dischargedToLocation?: string;
  dietType?: CodedElement;
  servicingFacility?: string;
  bedStatus?: string;
  accountStatus?: string;
  pendingLocation?: string;
  priorTemporaryLocation?: string;
  admitDateTime?: string;
  dischargeDateTime?: string[];
  currentPatientBalance?: number;
  totalCharges?: number;
  totalAdjustments?: number;
  totalPayments?: number;
  alternateVisitId?: string;
  visitIndicator?: 'A' | 'P';
  otherHealthcareProvider?: ExtendedCompositeIdWithCheckDigit[];
}

/**
 * AL1 - Patient Allergy Information Segment
 */
export interface AL1Segment {
  setId: number;
  allergenTypeCode?: CodedElement;
  allergenCodeDescription: CodedElement;
  allergySeverityCode?: CodedElement;
  allergyReactionCode?: string[];
  identificationDate?: string;
}

/**
 * IN1 - Insurance Segment
 */
export interface IN1Segment {
  setId: number;
  insurancePlanId: CodedElement;
  insuranceCompanyId: string[];
  insuranceCompanyName?: string[];
  insuranceCompanyAddress?: ExtendedAddress[];
  insuranceCompanyContactPerson?: ExtendedPersonName[];
  insuranceCompanyPhoneNumber?: ExtendedTelecommunicationNumber[];
  groupNumber?: string;
  groupName?: string[];
  insuredGroupEmployerId?: string[];
  insuredGroupEmployerName?: string[];
  planEffectiveDate?: string;
  planExpirationDate?: string;
  authorizationInformation?: string;
  planType?: string;
  nameOfInsured?: ExtendedPersonName[];
  insuredRelationshipToPatient?: CodedElement;
  insuredDateOfBirth?: string;
  insuredAddress?: ExtendedAddress[];
  assignmentOfBenefits?: string;
  coordinationOfBenefits?: string;
  coordinationOfBenefitsPriority?: string;
  noticeOfAdmissionFlag?: 'Y' | 'N';
  noticeOfAdmissionDate?: string;
  reportOfEligibilityFlag?: 'Y' | 'N';
  reportOfEligibilityDate?: string;
  releaseInformationCode?: string;
  preAdmitCertification?: string;
  verificationDateTime?: string;
  verificationBy?: ExtendedCompositeIdWithCheckDigit[];
  typeOfAgreementCode?: string;
  billingStatus?: string;
  lifetimeReserveDays?: number;
  delayBeforeLifetimeReserveDays?: number;
  companyPlanCode?: string;
  policyNumber?: string;
  policyDeductible?: number;
  policyLimitAmount?: number;
  policyLimitDays?: number;
  roomRateSemiPrivate?: number;
  roomRatePrivate?: number;
  insuredEmploymentStatus?: CodedElement;
  insuredAdministrativeSex?: 'M' | 'F' | 'O' | 'U';
  insuredEmployerAddress?: ExtendedAddress[];
  verificationStatus?: string;
  priorInsurancePlanId?: string;
  coverageType?: string;
  handicap?: string;
  insuredIdNumber?: string[];
}

// ============================================================================
// Data Types
// ============================================================================

export interface PatientIdentifier {
  idNumber: string;
  checkDigit?: string;
  checkDigitScheme?: string;
  assigningAuthority?: string;
  identifierTypeCode?: string;
  assigningFacility?: string;
}

export interface ExtendedPersonName {
  familyName: string;
  givenName?: string;
  secondAndFurtherGivenNames?: string;
  suffix?: string;
  prefix?: string;
  degree?: string;
  nameTypeCode?: 'A' | 'B' | 'C' | 'D' | 'L' | 'M' | 'N' | 'S' | 'T' | 'U';
  nameRepresentationCode?: 'A' | 'I' | 'P';
  nameContext?: CodedElement;
  nameValidityRange?: string;
  nameAssemblyOrder?: 'G' | 'F';
}

export interface ExtendedAddress {
  streetAddress?: string;
  otherDesignation?: string;
  city?: string;
  stateOrProvince?: string;
  zipOrPostalCode?: string;
  country?: string;
  addressType?: 'B' | 'C' | 'H' | 'L' | 'M' | 'O' | 'P' | 'RH' | 'S' | 'SH' | 'TM' | 'V';
  otherGeographicDesignation?: string;
  countyOrParishCode?: string;
  censusTract?: string;
  addressRepresentationCode?: 'A' | 'I' | 'P';
}

export interface ExtendedTelecommunicationNumber {
  telephoneNumber?: string;
  telecommunicationUseCode?: 'ASN' | 'BPN' | 'EMR' | 'NET' | 'ORN' | 'PRN' | 'VHN' | 'WPN';
  telecommunicationEquipmentType?: 'BP' | 'CP' | 'FX' | 'Internet' | 'MD' | 'PH' | 'SAT' | 'TDD' | 'TTY' | 'X.400';
  emailAddress?: string;
  countryCode?: string;
  areaCityCode?: string;
  localNumber?: string;
  extension?: string;
  anyText?: string;
  extensionPrefix?: string;
  speedDialCode?: string;
  unformattedTelephoneNumber?: string;
}

export interface CodedElement {
  identifier?: string;
  text?: string;
  nameOfCodingSystem?: string;
  alternateIdentifier?: string;
  alternateText?: string;
  nameOfAlternateCodingSystem?: string;
}

export interface ExtendedCompositeIdWithCheckDigit {
  idNumber: string;
  familyName?: string;
  givenName?: string;
  secondAndFurtherGivenNames?: string;
  suffix?: string;
  prefix?: string;
  degree?: string;
  sourceTable?: string;
  assigningAuthority?: string;
  nameTypeCode?: string;
  identifierCheckDigit?: string;
  checkDigitScheme?: string;
  identifierTypeCode?: string;
  assigningFacility?: string;
}

// ============================================================================
// Message Structure
// ============================================================================

export interface HL7Message {
  msh: MSHSegment;
  pid?: PIDSegment;
  pv1?: PV1Segment;
  nk1?: NK1Segment[];
  al1?: AL1Segment[];
  in1?: IN1Segment[];
  rawSegments?: string[];
}

export interface HL7ExportOptions {
  messageType?: HL7MessageType;
  eventType?: HL7EventType;
  sendingApplication?: string;
  sendingFacility?: string;
  receivingApplication?: string;
  receivingFacility?: string;
  includeAllergies?: boolean;
  includeInsurance?: boolean;
  includeNextOfKin?: boolean;
}

export interface HL7ExportResult {
  messageControlId: string;
  rawMessage: string;
  segments: string[];
  timestamp: string;
}
