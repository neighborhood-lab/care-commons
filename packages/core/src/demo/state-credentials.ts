/**
 * State-Specific Credentialing Requirements for Demo Mode
 * 
 * Comprehensive credential and compliance requirements for Texas and Florida
 * home health agencies. Used to demonstrate state-specific regulatory compliance
 * in demo environments.
 * 
 * References:
 * - Texas: 26 TAC §558 (HHSC), Employee Misconduct Registry
 * - Florida: Chapter 59A-8 FAC (AHCA), Level 2 Background Screening
 */

export interface CertificationRequirement {
  code: string;
  name: string;
  expiresAfterMonths: number;
  renewalRequired: boolean;
  issuingAuthority?: string;
}

export interface TrainingRequirement {
  code: string;
  name: string;
  hours: number;
  expiresAfterMonths: number;
  isInitialOnly?: boolean;
  description?: string;
}

export interface BackgroundScreening {
  level: number;
  includes: string[];
  validFor: number; // months
  clearanceRequired: boolean;
  registryChecks?: string[];
  exemptions?: string[];
}

export interface NurseAideRegistry {
  name: string;
  url: string;
  verificationType: string;
  renewalPeriod: number; // months
  backgroundCheckRequired: boolean;
  backgroundCheckType: string;
  verificationFrequency?: string;
}

export interface EVVRequirements {
  aggregatorRequired: boolean;
  aggregatorName?: string;
  supportedAggregators?: string[];
  gpsRequired: boolean;
  geofenceRadius: number; // meters
  clockInGracePeriod: number; // minutes
  clockOutGracePeriod: number; // minutes
  verificationMethods: string[];
  mandatoryDataElements: string[];
}

export interface RNSupervisionRequirements {
  required: boolean;
  frequency?: number; // days
  documentationRequired?: boolean;
  applicableServiceTypes?: string[];
}

export interface StateCredentials {
  stateName: string;
  stateCode: string;
  nurseAideRegistry: NurseAideRegistry;
  requiredCertifications: CertificationRequirement[];
  requiredTraining: TrainingRequirement[];
  backgroundScreening?: BackgroundScreening;
  rnSupervisionVisits?: RNSupervisionRequirements;
  evvRequirements: EVVRequirements;
  complianceNotes?: string[];
}

/**
 * Texas Home Health Credentialing Requirements
 * Reference: 26 TAC §558 (Texas Health and Human Services Commission)
 */
export const TEXAS_CREDENTIALS: StateCredentials = {
  stateName: 'Texas',
  stateCode: 'TX',
  nurseAideRegistry: {
    name: 'Texas Nurse Aide Registry',
    url: 'https://www.dads.state.tx.us/providers/nar/',
    verificationType: 'ONLINE_VERIFICATION',
    renewalPeriod: 24, // 2 years
    backgroundCheckRequired: true,
    backgroundCheckType: 'Employee Misconduct Registry (EMR)',
    verificationFrequency: 'BEFORE_HIRE_AND_ANNUALLY',
  },
  requiredCertifications: [
    {
      code: 'CNA',
      name: 'Certified Nurse Aide',
      expiresAfterMonths: 24,
      renewalRequired: true,
      issuingAuthority: 'Texas Department of Aging and Disability Services',
    },
    {
      code: 'CPR',
      name: 'CPR Certification',
      expiresAfterMonths: 24,
      renewalRequired: true,
      issuingAuthority: 'American Heart Association or American Red Cross',
    },
    {
      code: 'FIRST_AID',
      name: 'First Aid Certification',
      expiresAfterMonths: 24,
      renewalRequired: true,
      issuingAuthority: 'American Red Cross or equivalent',
    },
  ],
  requiredTraining: [
    {
      code: 'ABUSE_PREVENTION',
      name: 'Abuse, Neglect, and Exploitation Prevention',
      hours: 2,
      expiresAfterMonths: 12,
      isInitialOnly: false,
      description: 'Annual training on recognizing and reporting abuse, neglect, and exploitation of vulnerable adults.',
    },
    {
      code: 'INFECTION_CONTROL',
      name: 'Infection Control and Prevention',
      hours: 2,
      expiresAfterMonths: 12,
      isInitialOnly: false,
      description: 'Annual training on infection control practices, hand hygiene, and PPE usage.',
    },
    {
      code: 'HIPAA',
      name: 'HIPAA Privacy and Security Training',
      hours: 1,
      expiresAfterMonths: 12,
      isInitialOnly: false,
      description: 'Annual training on HIPAA privacy rules, PHI protection, and breach notification.',
    },
    {
      code: 'EMERGENCY_PREPAREDNESS',
      name: 'Emergency Preparedness',
      hours: 2,
      expiresAfterMonths: 12,
      isInitialOnly: false,
      description: 'Annual training on emergency procedures, evacuation plans, and disaster response.',
    },
  ],
  backgroundScreening: {
    level: 1,
    includes: ['Criminal History Check', 'Employee Misconduct Registry (EMR)'],
    validFor: 24, // 2 years
    clearanceRequired: true,
    registryChecks: [
      'Texas Employee Misconduct Registry',
      'Texas Nurse Aide Registry',
      'OIG List of Excluded Individuals/Entities (LEIE)',
      'SAM.gov Exclusions',
    ],
  },
  evvRequirements: {
    aggregatorRequired: true,
    aggregatorName: 'HHAeXchange',
    gpsRequired: true,
    geofenceRadius: 100, // 100 meters base + GPS accuracy
    clockInGracePeriod: 10, // minutes
    clockOutGracePeriod: 10, // minutes
    verificationMethods: ['BIOMETRIC', 'GPS', 'PHONE'],
    mandatoryDataElements: [
      'Type of service performed',
      'Individual receiving the service',
      'Date of service',
      'Location of service delivery',
      'Individual providing the service',
      'Time service begins and ends',
    ],
  },
  complianceNotes: [
    'Texas requires HHAeXchange as the mandatory EVV aggregator',
    'Mobile device GPS must be enabled for community-based services',
    '10-minute grace period for clock-in/clock-out',
    'Visit Maintenance Unlock Request (VMUR) required for visit corrections after submission',
    'Employee Misconduct Registry check required before hire and annually',
  ],
};

/**
 * Florida Home Health Credentialing Requirements
 * Reference: Chapter 59A-8 FAC (Agency for Health Care Administration)
 */
export const FLORIDA_CREDENTIALS: StateCredentials = {
  stateName: 'Florida',
  stateCode: 'FL',
  nurseAideRegistry: {
    name: 'Florida Nurse Aide Registry',
    url: 'https://ahca.myflorida.com/MCHQ/Health_Facility_Regulation/Nurse_Aide/nurse_aide.shtml',
    verificationType: 'ONLINE_VERIFICATION',
    renewalPeriod: 24, // 2 years
    backgroundCheckRequired: true,
    backgroundCheckType: 'Level 2 Background Screening (AHCA)',
    verificationFrequency: 'BEFORE_HIRE_AND_EVERY_5_YEARS',
  },
  requiredCertifications: [
    {
      code: 'CNA',
      name: 'Certified Nurse Aide',
      expiresAfterMonths: 24,
      renewalRequired: true,
      issuingAuthority: 'Florida Agency for Health Care Administration',
    },
    {
      code: 'HHA',
      name: 'Home Health Aide',
      expiresAfterMonths: 24,
      renewalRequired: true,
      issuingAuthority: 'Florida Agency for Health Care Administration',
    },
    {
      code: 'CPR',
      name: 'CPR Certification',
      expiresAfterMonths: 24,
      renewalRequired: true,
      issuingAuthority: 'American Heart Association or American Red Cross',
    },
    {
      code: 'FIRST_AID',
      name: 'First Aid Certification',
      expiresAfterMonths: 24,
      renewalRequired: true,
      issuingAuthority: 'American Red Cross or equivalent',
    },
  ],
  requiredTraining: [
    {
      code: 'ABUSE_PREVENTION',
      name: 'Abuse, Neglect, and Exploitation Prevention',
      hours: 4, // Florida requires 4 hours vs Texas 2 hours
      expiresAfterMonths: 12,
      isInitialOnly: false,
      description: 'Annual training on recognizing and reporting abuse, neglect, and exploitation. Florida mandates 4 hours.',
    },
    {
      code: 'INFECTION_CONTROL',
      name: 'Infection Control and Prevention',
      hours: 2,
      expiresAfterMonths: 12,
      isInitialOnly: false,
      description: 'Annual training on infection control, including bloodborne pathogens and COVID-19 protocols.',
    },
    {
      code: 'HIPAA',
      name: 'HIPAA Privacy and Security Training',
      hours: 1,
      expiresAfterMonths: 12,
      isInitialOnly: false,
      description: 'Annual HIPAA training on privacy rules and protected health information.',
    },
    {
      code: 'DCFS_TRAINING',
      name: 'DCF Background Screening Training',
      hours: 1,
      expiresAfterMonths: 60, // 5 years - only required initially
      isInitialOnly: true,
      description: 'Initial training on Florida Department of Children and Families background screening requirements.',
    },
    {
      code: 'EMERGENCY_PREPAREDNESS',
      name: 'Emergency Preparedness and Hurricane Response',
      hours: 2,
      expiresAfterMonths: 12,
      isInitialOnly: false,
      description: 'Annual training on emergency preparedness, including hurricane evacuation and sheltering procedures.',
    },
  ],
  backgroundScreening: {
    level: 2, // Florida requires Level 2 (FBI fingerprinting)
    includes: [
      'FBI National Criminal History Check',
      'Florida Department of Law Enforcement (FDLE) Criminal History',
      'Local Criminal History Check',
      'Florida Abuse Registry Check',
      'Florida Sexual Predator/Offender Registry',
    ],
    validFor: 60, // 5 years
    clearanceRequired: true,
    registryChecks: [
      'Florida Nurse Aide Registry',
      'Florida Abuse Hotline Information System',
      'OIG List of Excluded Individuals/Entities (LEIE)',
      'SAM.gov Exclusions',
      'Florida Sexual Predator and Sexual Offender Registry',
    ],
    exemptions: [
      'Individuals with disqualifying offenses may request exemption review',
      'Offenses more than 3 years old may be eligible for exemption (case-by-case)',
    ],
  },
  rnSupervisionVisits: {
    required: true,
    frequency: 60, // Every 60 days for skilled nursing clients
    documentationRequired: true,
    applicableServiceTypes: ['SKILLED_NURSING', 'PERSONAL_CARE_SKILLED'],
  },
  evvRequirements: {
    aggregatorRequired: false, // Florida allows provider choice
    supportedAggregators: ['HHAeXchange', 'Netsmart', 'Sandata', 'CareConnect', 'WellSky'],
    gpsRequired: true,
    geofenceRadius: 150, // 150 meters base (Florida is more lenient than Texas)
    clockInGracePeriod: 15, // 15-minute grace period
    clockOutGracePeriod: 15, // 15-minute grace period
    verificationMethods: ['BIOMETRIC', 'GPS', 'PHONE', 'LANDLINE'],
    mandatoryDataElements: [
      'Type of service performed',
      'Individual receiving the service',
      'Date of service',
      'Location of service delivery',
      'Individual providing the service',
      'Time service begins and ends',
    ],
  },
  complianceNotes: [
    'Florida allows providers to choose EVV aggregator (not mandated to one vendor)',
    'Level 2 background screening required every 5 years (includes FBI fingerprinting)',
    'RN supervision visit required every 60 days for skilled nursing clients',
    'Florida requires 4 hours of abuse prevention training (vs 2 hours in Texas)',
    '15-minute grace period for clock-in/clock-out (vs 10 minutes in Texas)',
    'Geofence radius of 150 meters (vs 100 meters in Texas)',
  ],
};

/**
 * Get credentials for a specific state
 */
export function getStateCredentials(stateCode: string): StateCredentials | null {
  const normalizedCode = stateCode.toUpperCase();
  
  switch (normalizedCode) {
    case 'TX':
      return TEXAS_CREDENTIALS;
    case 'FL':
      return FLORIDA_CREDENTIALS;
    default:
      return null;
  }
}

/**
 * Get all supported states for demo mode
 */
export function getSupportedDemoStates(): string[] {
  return ['TX', 'FL'];
}

/**
 * Compare credentialing requirements between two states
 */
export function compareStateCredentials(
  stateCode1: string,
  stateCode2: string
): {
  state1: StateCredentials;
  state2: StateCredentials;
  differences: {
    category: string;
    difference: string;
  }[];
} | null {
  const creds1 = getStateCredentials(stateCode1);
  const creds2 = getStateCredentials(stateCode2);
  
  if (!creds1 || !creds2) {
    return null;
  }
  
  const differences: { category: string; difference: string }[] = [];
  
  // Compare background screening levels
  if (creds1.backgroundScreening && creds2.backgroundScreening) {
    if (creds1.backgroundScreening.level !== creds2.backgroundScreening.level) {
      differences.push({
        category: 'Background Screening',
        difference: `${creds1.stateName} requires Level ${creds1.backgroundScreening.level}, ${creds2.stateName} requires Level ${creds2.backgroundScreening.level}`,
      });
    }
  }
  
  // Compare EVV aggregator requirements
  if (creds1.evvRequirements.aggregatorRequired !== creds2.evvRequirements.aggregatorRequired) {
    differences.push({
      category: 'EVV Aggregator',
      difference: creds1.evvRequirements.aggregatorRequired
        ? `${creds1.stateName} mandates specific aggregator (${creds1.evvRequirements.aggregatorName}), ${creds2.stateName} allows provider choice`
        : `${creds2.stateName} mandates specific aggregator (${creds2.evvRequirements.aggregatorName}), ${creds1.stateName} allows provider choice`,
    });
  }
  
  // Compare geofence requirements
  if (creds1.evvRequirements.geofenceRadius !== creds2.evvRequirements.geofenceRadius) {
    differences.push({
      category: 'EVV Geofence',
      difference: `${creds1.stateName}: ${creds1.evvRequirements.geofenceRadius}m, ${creds2.stateName}: ${creds2.evvRequirements.geofenceRadius}m`,
    });
  }
  
  // Compare RN supervision requirements
  const rn1 = creds1.rnSupervisionVisits?.required || false;
  const rn2 = creds2.rnSupervisionVisits?.required || false;
  if (rn1 !== rn2) {
    differences.push({
      category: 'RN Supervision',
      difference: rn1
        ? `${creds1.stateName} requires RN supervision visits, ${creds2.stateName} does not`
        : `${creds2.stateName} requires RN supervision visits, ${creds1.stateName} does not`,
    });
  }
  
  return {
    state1: creds1,
    state2: creds2,
    differences,
  };
}
