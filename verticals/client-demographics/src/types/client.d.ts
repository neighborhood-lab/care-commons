import { Entity, SoftDeletable, UUID } from '@care-commons/core';
export interface StateSpecificClientData {
    state: 'TX' | 'FL';
    texas?: TexasClientData;
    florida?: FloridaClientData;
}
export interface TexasClientData {
    medicaidMemberId?: string;
    medicaidProgram?: TexasMedicaidProgram;
    hhscClientId?: string;
    serviceDeliveryOption?: 'AGENCY' | 'CDS';
    planOfCareNumber?: string;
    authorizedServices: TexasAuthorizedService[];
    currentAuthorization?: TexasServiceAuthorization;
    evvEntityId?: string;
    evvRequirements?: TexasEVVRequirements;
    emergencyPlanOnFile: boolean;
    emergencyPlanDate?: Date;
    disasterEvacuationPlan?: string;
    form1746Consent?: ConsentRecord;
    biometricDataConsent?: ConsentRecord;
    releaseOfInformation?: ReleaseRecord[];
    acuityLevel?: 'LOW' | 'MODERATE' | 'HIGH' | 'COMPLEX';
    starPlusWaiverServices?: string[];
}
export interface FloridaClientData {
    medicaidRecipientId?: string;
    managedCarePlan?: FloridaManagedCarePlan;
    apdWaiverEnrollment?: APDWaiverInfo;
    doeaRiskClassification?: 'LOW' | 'MODERATE' | 'HIGH';
    planOfCareId?: string;
    planOfCareReviewDate?: Date;
    nextReviewDue?: Date;
    authorizedServices: FloridaAuthorizedService[];
    evvAggregatorId?: string;
    evvSystemType?: 'HHAX' | 'NETSMART' | 'OTHER';
    smmcProgramEnrollment?: boolean;
    ltcProgramEnrollment?: boolean;
    rnSupervisorId?: string;
    lastSupervisoryVisit?: Date;
    nextSupervisoryVisitDue?: Date;
    supervisoryVisitFrequency?: number;
    hurricaneZone?: string;
    biomedicalWasteExposure?: BiomedicalWasteRecord[];
    ahcaLicenseVerification?: Date;
    backgroundScreeningStatus?: 'COMPLIANT' | 'PENDING' | 'NON_COMPLIANT';
}
export type TexasMedicaidProgram = 'STAR' | 'STAR_PLUS' | 'STAR_KIDS' | 'STAR_HEALTH' | 'PHC' | 'CFC';
export type FloridaManagedCarePlan = 'SMMC_LTC' | 'SMMC_MMA' | 'PACE' | 'FFS';
export interface TexasAuthorizedService {
    id: UUID;
    serviceCode: string;
    serviceName: string;
    authorizedUnits: number;
    usedUnits: number;
    unitType: 'HOURS' | 'VISITS' | 'DAYS';
    authorizationNumber: string;
    effectiveDate: Date;
    expirationDate: Date;
    status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED';
    requiresEVV: boolean;
}
export interface FloridaAuthorizedService {
    id: UUID;
    serviceCode: string;
    serviceName: string;
    authorizedUnits: number;
    usedUnits: number;
    unitType: 'HOURS' | 'VISITS' | 'DAYS';
    authorizationNumber: string;
    effectiveDate: Date;
    expirationDate: Date;
    visitFrequency?: string;
    status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED';
    requiresEVV: boolean;
    requiresRNSupervision: boolean;
}
export interface TexasServiceAuthorization {
    authorizationId: string;
    authorizationDate: Date;
    authorizingProvider: string;
    effectiveDate: Date;
    expirationDate: Date;
    totalAuthorizedHours?: number;
    servicesAuthorized: string[];
    restrictions?: string[];
    formNumber?: string;
}
export interface TexasEVVRequirements {
    evvMandatory: boolean;
    approvedClockMethods: ('MOBILE' | 'TELEPHONY' | 'FIXED')[];
    geoPerimeterRadius?: number;
    aggregatorSubmissionRequired: boolean;
    tmhpIntegration: boolean;
}
export interface APDWaiverInfo {
    waiverType: string;
    enrollmentDate: Date;
    supportPlanDate?: Date;
    supportCoordinator?: string;
}
export interface ConsentRecord {
    consentDate: Date;
    consentFormId: string;
    documentPath?: string;
    signedBy: string;
    witnessedBy?: string;
    expirationDate?: Date;
    status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
}
export interface ReleaseRecord {
    id: UUID;
    releaseType: 'HIPAA' | 'RECORDS' | 'BILLING' | 'OTHER';
    recipientName: string;
    recipientOrganization?: string;
    purpose: string;
    dateGranted: Date;
    expirationDate?: Date;
    documentPath?: string;
    disclosureLog?: DisclosureEntry[];
}
export interface DisclosureEntry {
    id: UUID;
    disclosureDate: Date;
    disclosedTo: string;
    disclosedBy: UUID;
    purpose: string;
    informationDisclosed: string;
    method: 'VERBAL' | 'WRITTEN' | 'ELECTRONIC' | 'FAX';
    authorizationRef?: string;
}
export interface BiomedicalWasteRecord {
    id: UUID;
    exposureDate: Date;
    exposureType: string;
    reportedTo?: string;
    actionTaken?: string;
    followUpDate?: Date;
}
export interface Client extends Entity, SoftDeletable {
    organizationId: UUID;
    branchId: UUID;
    clientNumber: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    preferredName?: string;
    dateOfBirth: Date;
    ssn?: string;
    gender?: Gender;
    pronouns?: string;
    primaryPhone?: Phone;
    alternatePhone?: Phone;
    email?: string;
    preferredContactMethod?: ContactMethod;
    communicationPreferences?: CommunicationPreferences;
    language?: string;
    ethnicity?: string;
    race?: string[];
    maritalStatus?: MaritalStatus;
    veteranStatus?: boolean;
    primaryAddress: Address;
    secondaryAddresses?: Address[];
    livingArrangement?: LivingArrangement;
    mobilityInfo?: MobilityInfo;
    emergencyContacts: EmergencyContact[];
    authorizedContacts: AuthorizedContact[];
    primaryPhysician?: HealthcareProvider;
    pharmacy?: Pharmacy;
    insurance?: Insurance[];
    medicalRecordNumber?: string;
    programs: ProgramEnrollment[];
    serviceEligibility: ServiceEligibility;
    fundingSources?: FundingSource[];
    riskFlags: RiskFlag[];
    allergies?: Allergy[];
    specialInstructions?: string;
    accessInstructions?: string;
    status: ClientStatus;
    intakeDate?: Date;
    dischargeDate?: Date;
    dischargeReason?: string;
    stateSpecific?: StateSpecificClientData;
    referralSource?: string;
    notes?: string;
    customFields?: Record<string, unknown>;
}
export type Gender = 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER' | 'PREFER_NOT_TO_SAY';
export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'SEPARATED' | 'DOMESTIC_PARTNERSHIP';
export type ContactMethod = 'PHONE' | 'EMAIL' | 'SMS' | 'MAIL' | 'IN_PERSON';
export type ClientStatus = 'INQUIRY' | 'PENDING_INTAKE' | 'ACTIVE' | 'INACTIVE' | 'ON_HOLD' | 'DISCHARGED' | 'DECEASED';
export interface Phone {
    number: string;
    type: 'MOBILE' | 'HOME' | 'WORK';
    canReceiveSMS: boolean;
}
export interface CommunicationPreferences {
    method: ContactMethod;
    bestTimeToCall?: string;
    doNotContact?: boolean;
    languagePreference?: string;
    needsInterpreter?: boolean;
    hearingImpaired?: boolean;
    visuallyImpaired?: boolean;
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
    latitude?: number;
    longitude?: number;
    validFrom?: Date;
    validTo?: Date;
}
export interface LivingArrangement {
    type: 'ALONE' | 'WITH_FAMILY' | 'WITH_CAREGIVER' | 'ASSISTED_LIVING' | 'OTHER';
    description?: string;
    householdMembers?: number;
    pets?: Pet[];
    environmentalHazards?: string[];
}
export interface Pet {
    type: string;
    name?: string;
    notes?: string;
}
export interface MobilityInfo {
    requiresWheelchair: boolean;
    requiresWalker: boolean;
    requiresStairsAccess: boolean;
    transferAssistance?: 'NONE' | 'MINIMAL' | 'MODERATE' | 'TOTAL';
    notes?: string;
}
export interface EmergencyContact {
    id: UUID;
    name: string;
    relationship: string;
    phone: Phone;
    alternatePhone?: Phone;
    email?: string;
    address?: Address;
    isPrimary: boolean;
    canMakeHealthcareDecisions: boolean;
    notes?: string;
}
export interface AuthorizedContact {
    id: UUID;
    name: string;
    relationship: string;
    phone: Phone;
    email?: string;
    authorizations: Authorization[];
    validFrom?: Date;
    validTo?: Date;
    notes?: string;
}
export interface Authorization {
    type: 'HIPAA' | 'FINANCIAL' | 'SCHEDULE_CHANGES' | 'CARE_DECISIONS' | 'EMERGENCY';
    grantedAt: Date;
    documentPath?: string;
}
export interface HealthcareProvider {
    name: string;
    specialty?: string;
    phone: Phone;
    fax?: string;
    address?: Address;
    npi?: string;
}
export interface Pharmacy {
    name: string;
    phone: Phone;
    fax?: string;
    address?: Address;
    isMailOrder: boolean;
}
export interface Insurance {
    id: UUID;
    type: 'PRIMARY' | 'SECONDARY' | 'TERTIARY';
    provider: string;
    policyNumber: string;
    groupNumber?: string;
    subscriberId?: string;
    subscriberName?: string;
    subscriberRelationship?: string;
    subscriberDOB?: Date;
    effectiveDate?: Date;
    terminationDate?: Date;
    copay?: number;
    deductible?: number;
    notes?: string;
}
export interface ProgramEnrollment {
    id: UUID;
    programId: UUID;
    programName: string;
    enrollmentDate: Date;
    endDate?: Date;
    status: 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'TERMINATED';
    authorizedHoursPerWeek?: number;
    notes?: string;
}
export interface ServiceEligibility {
    medicaidEligible: boolean;
    medicaidNumber?: string;
    medicareEligible: boolean;
    medicareNumber?: string;
    veteransBenefits: boolean;
    longTermCareInsurance: boolean;
    privatePayOnly: boolean;
    eligibilityVerifiedDate?: Date;
    eligibilityNotes?: string;
}
export interface FundingSource {
    id: UUID;
    type: 'MEDICAID' | 'MEDICARE' | 'PRIVATE_INSURANCE' | 'PRIVATE_PAY' | 'VETERANS_BENEFITS' | 'OTHER';
    name: string;
    priority: number;
    accountNumber?: string;
    effectiveDate?: Date;
    terminationDate?: Date;
    authorizedAmount?: number;
    authorizedUnits?: number;
    notes?: string;
}
export interface RiskFlag {
    id: UUID;
    type: RiskType;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    identifiedDate: Date;
    resolvedDate?: Date;
    mitigationPlan?: string;
    requiresAcknowledgment: boolean;
}
export type RiskType = 'FALL_RISK' | 'WANDERING' | 'AGGRESSIVE_BEHAVIOR' | 'INFECTION' | 'MEDICATION_COMPLIANCE' | 'DIETARY_RESTRICTION' | 'ENVIRONMENTAL_HAZARD' | 'SAFETY_CONCERN' | 'ABUSE_NEGLECT_CONCERN' | 'OTHER';
export interface Allergy {
    id: UUID;
    allergen: string;
    type: 'MEDICATION' | 'FOOD' | 'ENVIRONMENTAL' | 'OTHER';
    reaction: string;
    severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING';
    notes?: string;
}
export interface CreateClientInput {
    organizationId: UUID;
    branchId: UUID;
    firstName: string;
    middleName?: string;
    lastName: string;
    preferredName?: string;
    dateOfBirth: Date;
    gender?: Gender;
    primaryPhone?: Phone;
    email?: string;
    primaryAddress: Address;
    emergencyContacts?: EmergencyContact[];
    referralSource?: string;
    intakeDate?: Date;
    status?: ClientStatus;
}
export interface UpdateClientInput {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    preferredName?: string;
    dateOfBirth?: Date;
    gender?: Gender;
    primaryPhone?: Phone;
    alternatePhone?: Phone;
    email?: string;
    primaryAddress?: Address;
    emergencyContacts?: EmergencyContact[];
    authorizedContacts?: AuthorizedContact[];
    riskFlags?: RiskFlag[];
    status?: ClientStatus;
    notes?: string;
}
export interface ClientSearchFilters {
    query?: string;
    organizationId?: UUID;
    branchId?: UUID;
    status?: ClientStatus[];
    programId?: UUID;
    assignedCaregiver?: UUID;
    riskType?: RiskType[];
    minAge?: number;
    maxAge?: number;
    city?: string;
    state?: string;
    hasActiveServices?: boolean;
}
//# sourceMappingURL=client.d.ts.map