/**
 * State-Specific Compliance Configuration Types
 *
 * Comprehensive configuration for all 50 US states covering:
 * - EVV (Electronic Visit Verification) requirements
 * - Background screening requirements
 * - Caregiver credentialing rules
 * - Plan of care review frequencies
 * - RN supervision requirements
 * - State-specific regulations
 */

/**
 * US State codes for compliance (50 states + DC)
 * Note: Excludes territories (PR, VI, GU, AS, MP) - to be added later
 */
export type StateCode =
  | 'AL' | 'AK' | 'AZ' | 'AR' | 'CA' | 'CO' | 'CT' | 'DE' | 'FL' | 'GA'
  | 'HI' | 'ID' | 'IL' | 'IN' | 'IA' | 'KS' | 'KY' | 'LA' | 'ME' | 'MD'
  | 'MA' | 'MI' | 'MN' | 'MS' | 'MO' | 'MT' | 'NE' | 'NV' | 'NH' | 'NJ'
  | 'NM' | 'NY' | 'NC' | 'ND' | 'OH' | 'OK' | 'OR' | 'PA' | 'RI' | 'SC'
  | 'SD' | 'TN' | 'TX' | 'UT' | 'VT' | 'VA' | 'WA' | 'WV' | 'WI' | 'WY'
  | 'DC';

/**
 * EVV Aggregator options
 */
export type EVVAggregator =
  | 'HHAeXchange'
  | 'Netsmart'
  | 'Sandata'
  | 'CareSmartz'
  | 'Telligen'
  | 'ModivCare'
  | 'State_Portal'
  | 'Multiple'
  | 'None';

/**
 * Background screening types
 */
export type BackgroundScreeningType =
  | 'FBI_Fingerprint'
  | 'State_Criminal'
  | 'State_Registry'
  | 'Abuse_Neglect_Registry'
  | 'Sex_Offender_Registry'
  | 'OIG_Exclusion'
  | 'Level_1'
  | 'Level_2';

/**
 * EVV Configuration for a state
 */
export interface EVVConfig {
  /** Is EVV mandated by the state? */
  mandated: boolean;
  
  /** Mandate effective date */
  mandateEffectiveDate?: string;
  
  /** Required aggregator(s) */
  aggregators: EVVAggregator[];
  
  /** Geofencing requirements */
  geofencing: {
    /** Is geofencing required? */
    required: boolean;
    
    /** Base radius in meters */
    baseRadiusMeters: number;
    
    /** Additional GPS accuracy tolerance */
    gpsAccuracyTolerance: number;
    
    /** Allow manual override? */
    allowManualOverride: boolean;
  };
  
  /** Clock-in/out grace periods */
  gracePeriods: {
    /** Early clock-in minutes allowed */
    earlyClockInMinutes: number;
    
    /** Late clock-out minutes allowed */
    lateClockOutMinutes: number;
  };
  
  /** Required data elements (beyond federal 6) */
  additionalDataElements: string[];
  
  /** Visit correction process */
  visitCorrection: {
    /** Can caregivers self-correct? */
    caregiverCanCorrect: boolean;
    
    /** Time window for corrections (hours) */
    correctionWindowHours: number;
    
    /** Requires supervisor approval? */
    requiresSupervisorApproval: boolean;
  };
}

/**
 * Background Screening Configuration
 */
export interface BackgroundScreeningConfig {
  /** Required screening types */
  requiredScreenings: BackgroundScreeningType[];
  
  /** Screening validity period (months) */
  validityMonths: number;
  
  /** Rescreening frequency (months) */
  rescreeningFrequencyMonths: number;
  
  /** State-specific registries to check */
  stateRegistries: string[];
  
  /** Disqualifying offenses */
  disqualifyingOffenses: string[];
  
  /** Requires live scan fingerprinting? */
  requiresLiveScan: boolean;
}

/**
 * Caregiver Credentialing Configuration
 */
export interface CaregiverCredentialingConfig {
  /** Nurse aide registry required? */
  nurseAideRegistryRequired: boolean;
  
  /** Minimum training hours */
  minimumTrainingHours: number;
  
  /** Competency evaluation required? */
  competencyEvaluationRequired: boolean;
  
  /** Annual training requirements (hours) */
  annualTrainingHours: number;
  
  /** Required certifications */
  requiredCertifications: string[];
  
  /** Medication administration delegation allowed? */
  medicationDelegationAllowed: boolean;
  
  /** Medication delegation requirements */
  medicationDelegationRequirements?: {
    /** Training hours required */
    trainingHours: number;
    
    /** RN assessment required? */
    rnAssessmentRequired: boolean;
    
    /** Competency demonstration required? */
    competencyRequired: boolean;
  };
}

/**
 * Plan of Care Configuration
 */
export interface PlanOfCareConfig {
  /** Review frequency for skilled nursing (days) */
  skilledNursingReviewDays: number;
  
  /** Review frequency for personal care (days) */
  personalCareReviewDays: number;
  
  /** RN supervision visit frequency (days) */
  rnSupervisionVisitDays?: number;
  
  /** Physician order renewal frequency (days) */
  physicianOrderRenewalDays: number;
  
  /** Face-to-face requirement */
  faceToFaceRequired: boolean;
  
  /** Telehealth allowed for supervision? */
  telehealthSupervisionAllowed: boolean;
}

/**
 * State-Specific Regulatory Requirements
 */
export interface RegulatoryRequirements {
  /** Primary regulatory agency */
  primaryAgency: string;
  
  /** Agency website */
  agencyWebsite: string;
  
  /** License types */
  licenseTypes: string[];
  
  /** Key regulations (citations) */
  keyRegulations: string[];
  
  /** Audit frequency (months) */
  auditFrequencyMonths: number;
  
  /** Incident reporting timeframe (hours) */
  incidentReportingHours: number;
  
  /** Serious incident reporting (hours) */
  seriousIncidentReportingHours: number;
  
  /** Client rights posting required? */
  clientRightsPostingRequired: boolean;
  
  /** Medicaid waiver programs */
  medicaidWaiverPrograms: string[];
}

/**
 * Complete State Compliance Configuration
 */
export interface StateComplianceConfig {
  /** State code */
  state: StateCode;
  
  /** State full name */
  stateName: string;
  
  /** EVV configuration */
  evv: EVVConfig;
  
  /** Background screening configuration */
  backgroundScreening: BackgroundScreeningConfig;
  
  /** Caregiver credentialing configuration */
  caregiverCredentialing: CaregiverCredentialingConfig;
  
  /** Plan of care configuration */
  planOfCare: PlanOfCareConfig;
  
  /** Regulatory requirements */
  regulatory: RegulatoryRequirements;
  
  /** Last updated date */
  lastUpdated: string;
  
  /** Notes and special considerations */
  notes?: string;
}
