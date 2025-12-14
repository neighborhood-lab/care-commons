/**
 * FHIR R4 Type Definitions
 *
 * Simplified type definitions for FHIR R4 resources used in home care exports.
 * These are subset definitions focusing on the resources and elements needed
 * for patient data export.
 *
 * @see https://hl7.org/fhir/R4/
 */

// ============================================================================
// Type Aliases
// ============================================================================

export type FHIRGender = 'male' | 'female' | 'other' | 'unknown';

// ============================================================================
// Base Types
// ============================================================================

export interface FHIRElement {
  id?: string;
  extension?: Extension[];
}

export interface Extension {
  url: string;
  valueString?: string;
  valueBoolean?: boolean;
  valueCode?: string;
  valueDate?: string;
  valueDateTime?: string;
  valueInteger?: number;
  valueCoding?: Coding;
  valueCodeableConcept?: CodeableConcept;
  valueReference?: Reference;
}

export interface Reference {
  reference?: string;
  type?: string;
  display?: string;
}

export interface Identifier {
  use?: 'usual' | 'official' | 'temp' | 'secondary' | 'old';
  type?: CodeableConcept;
  system?: string;
  value?: string;
  period?: Period;
}

export interface Period {
  start?: string;
  end?: string;
}

export interface Coding {
  system?: string;
  version?: string;
  code?: string;
  display?: string;
  userSelected?: boolean;
}

export interface CodeableConcept {
  coding?: Coding[];
  text?: string;
}

export interface HumanName {
  use?: 'usual' | 'official' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden';
  text?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
  period?: Period;
}

export interface ContactPoint {
  system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
  value?: string;
  use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
  rank?: number;
  period?: Period;
}

export interface FHIRAddress {
  use?: 'home' | 'work' | 'temp' | 'old' | 'billing';
  type?: 'postal' | 'physical' | 'both';
  text?: string;
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  period?: Period;
}

export interface Annotation {
  authorReference?: Reference;
  authorString?: string;
  time?: string;
  text: string;
}

// ============================================================================
// Resource Types
// ============================================================================

export interface Resource {
  resourceType: string;
  id?: string;
  meta?: Meta;
  implicitRules?: string;
  language?: string;
}

export interface Meta {
  versionId?: string;
  lastUpdated?: string;
  source?: string;
  profile?: string[];
  security?: Coding[];
  tag?: Coding[];
}

// ============================================================================
// Patient Resource
// ============================================================================

export interface Patient extends Resource {
  resourceType: 'Patient';
  identifier?: Identifier[];
  active?: boolean;
  name?: HumanName[];
  telecom?: ContactPoint[];
  gender?: FHIRGender;
  birthDate?: string;
  deceasedBoolean?: boolean;
  deceasedDateTime?: string;
  address?: FHIRAddress[];
  maritalStatus?: CodeableConcept;
  multipleBirthBoolean?: boolean;
  multipleBirthInteger?: number;
  photo?: Attachment[];
  contact?: PatientContact[];
  communication?: PatientCommunication[];
  generalPractitioner?: Reference[];
  managingOrganization?: Reference;
  link?: PatientLink[];
}

export interface PatientContact {
  relationship?: CodeableConcept[];
  name?: HumanName;
  telecom?: ContactPoint[];
  address?: FHIRAddress;
  gender?: FHIRGender;
  organization?: Reference;
  period?: Period;
}

export interface PatientCommunication {
  language: CodeableConcept;
  preferred?: boolean;
}

export interface PatientLink {
  other: Reference;
  type: 'replaced-by' | 'replaces' | 'refer' | 'seealso';
}

export interface Attachment {
  contentType?: string;
  language?: string;
  data?: string; // Base64 encoded
  url?: string;
  size?: number;
  hash?: string;
  title?: string;
  creation?: string;
}

// ============================================================================
// RelatedPerson Resource (for emergency contacts)
// ============================================================================

export interface RelatedPerson extends Resource {
  resourceType: 'RelatedPerson';
  identifier?: Identifier[];
  active?: boolean;
  patient: Reference;
  relationship?: CodeableConcept[];
  name?: HumanName[];
  telecom?: ContactPoint[];
  gender?: FHIRGender;
  birthDate?: string;
  address?: FHIRAddress[];
  photo?: Attachment[];
  period?: Period;
  communication?: RelatedPersonCommunication[];
}

export interface RelatedPersonCommunication {
  language: CodeableConcept;
  preferred?: boolean;
}

// ============================================================================
// AllergyIntolerance Resource
// ============================================================================

export interface AllergyIntolerance extends Resource {
  resourceType: 'AllergyIntolerance';
  identifier?: Identifier[];
  clinicalStatus?: CodeableConcept;
  verificationStatus?: CodeableConcept;
  type?: 'allergy' | 'intolerance';
  category?: ('food' | 'medication' | 'environment' | 'biologic')[];
  criticality?: 'low' | 'high' | 'unable-to-assess';
  code?: CodeableConcept;
  patient: Reference;
  encounter?: Reference;
  onsetDateTime?: string;
  onsetAge?: Age;
  onsetPeriod?: Period;
  onsetRange?: Range;
  onsetString?: string;
  recordedDate?: string;
  recorder?: Reference;
  asserter?: Reference;
  lastOccurrence?: string;
  note?: Annotation[];
  reaction?: AllergyIntoleranceReaction[];
}

export interface AllergyIntoleranceReaction {
  substance?: CodeableConcept;
  manifestation: CodeableConcept[];
  description?: string;
  onset?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  exposureRoute?: CodeableConcept;
  note?: Annotation[];
}

export interface Age {
  value?: number;
  comparator?: '<' | '<=' | '>=' | '>';
  unit?: string;
  system?: string;
  code?: string;
}

export interface Range {
  low?: SimpleQuantity;
  high?: SimpleQuantity;
}

export interface SimpleQuantity {
  value?: number;
  unit?: string;
  system?: string;
  code?: string;
}

// ============================================================================
// Coverage Resource (for insurance)
// ============================================================================

export interface Coverage extends Resource {
  resourceType: 'Coverage';
  identifier?: Identifier[];
  status: 'active' | 'cancelled' | 'draft' | 'entered-in-error';
  type?: CodeableConcept;
  policyHolder?: Reference;
  subscriber?: Reference;
  subscriberId?: string;
  beneficiary: Reference;
  dependent?: string;
  relationship?: CodeableConcept;
  period?: Period;
  payor: Reference[];
  class?: CoverageClass[];
  order?: number;
  network?: string;
  costToBeneficiary?: CoverageCostToBeneficiary[];
  subrogation?: boolean;
  contract?: Reference[];
}

export interface CoverageClass {
  type: CodeableConcept;
  value: string;
  name?: string;
}

export interface CoverageCostToBeneficiary {
  type?: CodeableConcept;
  valueQuantity?: SimpleQuantity;
  valueMoney?: Money;
  exception?: CoverageException[];
}

export interface CoverageException {
  type: CodeableConcept;
  period?: Period;
}

export interface Money {
  value?: number;
  currency?: string;
}

// ============================================================================
// Practitioner Resource (for physicians)
// ============================================================================

export interface Practitioner extends Resource {
  resourceType: 'Practitioner';
  identifier?: Identifier[];
  active?: boolean;
  name?: HumanName[];
  telecom?: ContactPoint[];
  address?: FHIRAddress[];
  gender?: FHIRGender;
  birthDate?: string;
  photo?: Attachment[];
  qualification?: PractitionerQualification[];
  communication?: CodeableConcept[];
}

export interface PractitionerQualification {
  identifier?: Identifier[];
  code: CodeableConcept;
  period?: Period;
  issuer?: Reference;
}

// ============================================================================
// Organization Resource
// ============================================================================

export interface FHIROrganization extends Resource {
  resourceType: 'Organization';
  identifier?: Identifier[];
  active?: boolean;
  type?: CodeableConcept[];
  name?: string;
  alias?: string[];
  telecom?: ContactPoint[];
  address?: FHIRAddress[];
  partOf?: Reference;
  contact?: OrganizationContact[];
  endpoint?: Reference[];
}

export interface OrganizationContact {
  purpose?: CodeableConcept;
  name?: HumanName;
  telecom?: ContactPoint[];
  address?: FHIRAddress;
}

// ============================================================================
// Condition Resource (for diagnoses/risk flags)
// ============================================================================

export interface Condition extends Resource {
  resourceType: 'Condition';
  identifier?: Identifier[];
  clinicalStatus?: CodeableConcept;
  verificationStatus?: CodeableConcept;
  category?: CodeableConcept[];
  severity?: CodeableConcept;
  code?: CodeableConcept;
  bodySite?: CodeableConcept[];
  subject: Reference;
  encounter?: Reference;
  onsetDateTime?: string;
  onsetAge?: Age;
  onsetPeriod?: Period;
  onsetRange?: Range;
  onsetString?: string;
  abatementDateTime?: string;
  abatementAge?: Age;
  abatementPeriod?: Period;
  abatementRange?: Range;
  abatementString?: string;
  recordedDate?: string;
  recorder?: Reference;
  asserter?: Reference;
  stage?: ConditionStage[];
  evidence?: ConditionEvidence[];
  note?: Annotation[];
}

export interface ConditionStage {
  summary?: CodeableConcept;
  assessment?: Reference[];
  type?: CodeableConcept;
}

export interface ConditionEvidence {
  code?: CodeableConcept[];
  detail?: Reference[];
}

// ============================================================================
// Bundle Resource (for exporting multiple resources)
// ============================================================================

export interface Bundle extends Resource {
  resourceType: 'Bundle';
  identifier?: Identifier;
  type:
    | 'document'
    | 'message'
    | 'transaction'
    | 'transaction-response'
    | 'batch'
    | 'batch-response'
    | 'history'
    | 'searchset'
    | 'collection';
  timestamp?: string;
  total?: number;
  link?: BundleLink[];
  entry?: BundleEntry[];
  signature?: Signature;
}

export interface BundleLink {
  relation: string;
  url: string;
}

export interface BundleEntry {
  link?: BundleLink[];
  fullUrl?: string;
  resource?: Resource;
  search?: BundleEntrySearch;
  request?: BundleEntryRequest;
  response?: BundleEntryResponse;
}

export interface BundleEntrySearch {
  mode?: 'match' | 'include' | 'outcome';
  score?: number;
}

export interface BundleEntryRequest {
  method: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  ifNoneMatch?: string;
  ifModifiedSince?: string;
  ifMatch?: string;
  ifNoneExist?: string;
}

export interface BundleEntryResponse {
  status: string;
  location?: string;
  etag?: string;
  lastModified?: string;
  outcome?: Resource;
}

export interface Signature {
  type: Coding[];
  when: string;
  who: Reference;
  onBehalfOf?: Reference;
  targetFormat?: string;
  sigFormat?: string;
  data?: string;
}
