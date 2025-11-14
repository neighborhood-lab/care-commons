/**
 * Six Required EVV Elements Validator
 *
 * Validates compliance with the federal 21st Century Cures Act requirement
 * for Electronic Visit Verification (EVV).
 *
 * The six required data elements are:
 * 1. WHO - Type of service performed (service code)
 * 2. WHAT - Individual receiving the service (client/member)
 * 3. WHO - Individual providing the service (caregiver/provider)
 * 4. WHEN - Date of service
 * 5. WHERE - Location of service delivery (with verification)
 * 6. WHEN - Time service begins and ends (duration = "How Long")
 *
 * Per 42 CFR §440.387 and Texas HHSC EVV requirements.
 *
 * References:
 * - 21st Century Cures Act § 12006
 * - 42 CFR § 440.387 (Federal EVV Requirements)
 * - 26 TAC § 558.453 (Texas EVV Requirements)
 */

import { ValidationError } from '@care-commons/core';

/**
 * Six elements validation result
 */
export interface SixElementsValidationResult {
  isValid: boolean;
  allElementsPresent: boolean;
  missingElements: EVVElement[];
  elementResults: ElementValidationResult[];
  complianceLevel: 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT';
  message: string;
  federalCompliant: boolean; // Meets federal minimum
  texasCompliant: boolean; // Meets Texas enhanced requirements
}

/**
 * Individual element validation result
 */
export interface ElementValidationResult {
  element: EVVElement;
  isPresent: boolean;
  isValid: boolean;
  value?: string | number | Date;
  validationMessage: string;
  required: boolean;
  texasEnhanced?: boolean; // Texas has additional requirements
}

/**
 * EVV element identifier
 */
export type EVVElement =
  | 'SERVICE_TYPE' // Element 1: Type of service (WHAT)
  | 'CLIENT' // Element 2: Individual receiving service (WHO receives)
  | 'CAREGIVER' // Element 3: Individual providing service (WHO provides)
  | 'SERVICE_DATE' // Element 4: Date of service (WHEN - date)
  | 'SERVICE_LOCATION' // Element 5: Location of service (WHERE)
  | 'SERVICE_TIME'; // Element 6: Time begins and ends (WHEN - time & HOW LONG)

/**
 * EVV data input for validation
 */
export interface EVVDataInput {
  // Element 1: Service Type
  serviceTypeCode?: string;
  serviceTypeName?: string;

  // Element 2: Client (Individual receiving service)
  clientId?: string;
  clientName?: string;
  clientMedicaidId?: string;

  // Element 3: Caregiver (Individual providing service)
  caregiverId?: string;
  caregiverName?: string;
  caregiverEmployeeId?: string;
  caregiverNPI?: string; // Texas enhanced requirement

  // Element 4: Service Date
  serviceDate?: Date;

  // Element 5: Location
  serviceLocationLatitude?: number;
  serviceLocationLongitude?: number;
  serviceLocationAddress?: string;
  locationVerificationMethod?: string; // Texas enhanced requirement

  // Element 6: Time (begins and ends)
  clockInTime?: Date;
  clockOutTime?: Date;
  totalDuration?: number; // Calculated minutes
}

/**
 * Validation configuration
 */
export interface ValidationConfig {
  requireTexasEnhancements: boolean; // Require Texas-specific enhancements
  requireNPI: boolean; // Require NPI for caregivers
  requireMedicaidId: boolean; // Require Medicaid ID for clients
  requireGPSVerification: boolean; // Require GPS location verification
  requireCompletedVisit: boolean; // Require clock-out time (completed visit)
}

/**
 * Default federal-only configuration
 */
const FEDERAL_CONFIG: ValidationConfig = {
  requireTexasEnhancements: false,
  requireNPI: false,
  requireMedicaidId: false,
  requireGPSVerification: false,
  requireCompletedVisit: false,
};

/**
 * Texas HHSC enhanced configuration
 */
const TEXAS_CONFIG: ValidationConfig = {
  requireTexasEnhancements: true,
  requireNPI: true, // Texas requires NPI for provider identification
  requireMedicaidId: true, // Texas requires Medicaid ID for billing
  requireGPSVerification: true, // Texas mandates GPS verification
  requireCompletedVisit: false, // Can validate in-progress visits
};

/**
 * Six Elements Validator
 *
 * Validates all six federally-required EVV elements with optional
 * state-specific enhancements (e.g., Texas HHSC requirements)
 */
export class SixElementsValidator {
  private config: ValidationConfig;

  constructor(config?: Partial<ValidationConfig>) {
    this.config = { ...FEDERAL_CONFIG, ...config };
  }

  /**
   * Validate all six required EVV elements
   *
   * @param data - EVV data to validate
   * @returns Validation result with detailed element-by-element breakdown
   */
  validate(data: EVVDataInput): SixElementsValidationResult {
    const elementResults: ElementValidationResult[] = [];

    // Element 1: Service Type (WHAT service was performed)
    elementResults.push(this.validateServiceType(data));

    // Element 2: Client (WHO received the service)
    elementResults.push(this.validateClient(data));

    // Element 3: Caregiver (WHO provided the service)
    elementResults.push(this.validateCaregiver(data));

    // Element 4: Service Date (WHEN - date)
    elementResults.push(this.validateServiceDate(data));

    // Element 5: Service Location (WHERE)
    elementResults.push(this.validateServiceLocation(data));

    // Element 6: Service Time (WHEN - time begins/ends, HOW LONG)
    elementResults.push(this.validateServiceTime(data));

    // Determine overall compliance
    const missingElements = elementResults
      .filter(r => !r.isPresent)
      .map(r => r.element);

    const invalidElements = elementResults
      .filter(r => r.isPresent && !r.isValid)
      .map(r => r.element);

    const allElementsPresent = missingElements.length === 0;
    const allElementsValid = invalidElements.length === 0;
    const isValid = allElementsPresent && allElementsValid;

    // Federal compliance (basic six elements)
    const federalCompliant = elementResults
      .filter(r => r.required && !r.texasEnhanced)
      .every(r => r.isPresent && r.isValid);

    // Texas compliance (includes enhancements)
    const texasCompliant = this.config.requireTexasEnhancements
      ? elementResults.every(r => r.isPresent && r.isValid)
      : federalCompliant;

    // Determine compliance level
    let complianceLevel: 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT';
    if (isValid) {
      complianceLevel = 'COMPLIANT';
    } else if (allElementsPresent && invalidElements.length > 0) {
      complianceLevel = 'PARTIAL';
    } else {
      complianceLevel = 'NON_COMPLIANT';
    }

    // Generate message
    const message = this.generateMessage(
      isValid,
      missingElements,
      invalidElements,
      federalCompliant,
      texasCompliant
    );

    return {
      isValid,
      allElementsPresent,
      missingElements,
      elementResults,
      complianceLevel,
      message,
      federalCompliant,
      texasCompliant,
    };
  }

  /**
   * Element 1: Service Type
   */
  private validateServiceType(data: EVVDataInput): ElementValidationResult {
    const isPresent = Boolean(data.serviceTypeCode);
    const isValid = isPresent && data.serviceTypeCode!.length > 0;

    return {
      element: 'SERVICE_TYPE',
      isPresent,
      isValid,
      value: data.serviceTypeCode,
      validationMessage: isValid
        ? `Service type code: ${data.serviceTypeCode}${data.serviceTypeName ? ` (${data.serviceTypeName})` : ''}`
        : 'Service type code is required',
      required: true,
    };
  }

  /**
   * Element 2: Client (Individual receiving service)
   */
  private validateClient(data: EVVDataInput): ElementValidationResult {
    const isPresent = Boolean(data.clientId);
    const hasMedicaidId = Boolean(data.clientMedicaidId);

    let isValid = isPresent;
    if (this.config.requireMedicaidId && !hasMedicaidId) {
      isValid = false;
    }

    let message = '';
    if (!isPresent) {
      message = 'Client ID is required';
    } else if (this.config.requireMedicaidId && !hasMedicaidId) {
      message = 'Client Medicaid ID is required for Texas compliance';
    } else {
      message = `Client: ${data.clientName || data.clientId}${hasMedicaidId ? ' (Medicaid ID present)' : ''}`;
    }

    return {
      element: 'CLIENT',
      isPresent,
      isValid,
      value: data.clientId,
      validationMessage: message,
      required: true,
      texasEnhanced: this.config.requireMedicaidId,
    };
  }

  /**
   * Element 3: Caregiver (Individual providing service)
   */
  private validateCaregiver(data: EVVDataInput): ElementValidationResult {
    const isPresent = Boolean(data.caregiverId);
    const hasEmployeeId = Boolean(data.caregiverEmployeeId);
    const hasNPI = Boolean(data.caregiverNPI);

    let isValid = isPresent && hasEmployeeId;
    if (this.config.requireNPI && !hasNPI) {
      isValid = false;
    }

    let message = '';
    if (!isPresent) {
      message = 'Caregiver ID is required';
    } else if (!hasEmployeeId) {
      message = 'Caregiver employee ID is required';
    } else if (this.config.requireNPI && !hasNPI) {
      message = 'Caregiver NPI (National Provider Identifier) is required for Texas compliance';
    } else {
      message = `Caregiver: ${data.caregiverName || data.caregiverId} (Employee ID: ${data.caregiverEmployeeId})${hasNPI ? ` (NPI: ${data.caregiverNPI})` : ''}`;
    }

    return {
      element: 'CAREGIVER',
      isPresent,
      isValid,
      value: data.caregiverId,
      validationMessage: message,
      required: true,
      texasEnhanced: this.config.requireNPI,
    };
  }

  /**
   * Element 4: Service Date
   */
  private validateServiceDate(data: EVVDataInput): ElementValidationResult {
    const isPresent = Boolean(data.serviceDate);
    const isValid = isPresent && data.serviceDate instanceof Date && !isNaN(data.serviceDate.getTime());

    return {
      element: 'SERVICE_DATE',
      isPresent,
      isValid,
      value: data.serviceDate,
      validationMessage: isValid
        ? `Service date: ${data.serviceDate!.toISOString().split('T')[0]}`
        : 'Valid service date is required',
      required: true,
    };
  }

  /**
   * Element 5: Service Location
   */
  private validateServiceLocation(data: EVVDataInput): ElementValidationResult {
    const hasLatitude = typeof data.serviceLocationLatitude === 'number';
    const hasLongitude = typeof data.serviceLocationLongitude === 'number';
    const hasAddress = Boolean(data.serviceLocationAddress);
    const hasGPSVerification = Boolean(data.locationVerificationMethod);

    const isPresent = hasAddress || (hasLatitude && hasLongitude);
    let isValid = isPresent;

    if (this.config.requireGPSVerification && (!hasLatitude || !hasLongitude || !hasGPSVerification)) {
      isValid = false;
    }

    let message = '';
    if (!isPresent) {
      message = 'Service location (address or coordinates) is required';
    } else if (this.config.requireGPSVerification && (!hasLatitude || !hasLongitude)) {
      message = 'GPS coordinates are required for Texas compliance';
    } else if (this.config.requireGPSVerification && !hasGPSVerification) {
      message = 'Location verification method (GPS) is required for Texas compliance';
    } else {
      const location = hasAddress
        ? data.serviceLocationAddress
        : `${data.serviceLocationLatitude}, ${data.serviceLocationLongitude}`;
      message = `Service location: ${location}${hasGPSVerification ? ` (Verified: ${data.locationVerificationMethod})` : ''}`;
    }

    return {
      element: 'SERVICE_LOCATION',
      isPresent,
      isValid,
      value: data.serviceLocationAddress,
      validationMessage: message,
      required: true,
      texasEnhanced: this.config.requireGPSVerification,
    };
  }

  /**
   * Element 6: Service Time (begins and ends)
   */
  private validateServiceTime(data: EVVDataInput): ElementValidationResult {
    const hasClockIn = Boolean(data.clockInTime);
    const hasClockOut = Boolean(data.clockOutTime);
    const hasDuration = typeof data.totalDuration === 'number';

    const isPresent = hasClockIn;
    let isValid = hasClockIn && data.clockInTime instanceof Date && !isNaN(data.clockInTime.getTime());

    if (this.config.requireCompletedVisit && !hasClockOut) {
      isValid = false;
    }

    let message = '';
    if (!hasClockIn) {
      message = 'Clock-in time is required';
    } else if (this.config.requireCompletedVisit && !hasClockOut) {
      message = 'Clock-out time is required for completed visits';
    } else if (hasClockOut) {
      message = `Service time: ${data.clockInTime!.toISOString()} to ${data.clockOutTime!.toISOString()}${hasDuration ? ` (${data.totalDuration} minutes)` : ''}`;
    } else {
      message = `Service started: ${data.clockInTime!.toISOString()} (in progress)`;
    }

    return {
      element: 'SERVICE_TIME',
      isPresent,
      isValid,
      value: data.clockInTime,
      validationMessage: message,
      required: true,
    };
  }

  /**
   * Generate overall validation message
   */
  private generateMessage(
    isValid: boolean,
    missingElements: EVVElement[],
    invalidElements: EVVElement[],
    federalCompliant: boolean,
    texasCompliant: boolean
  ): string {
    if (isValid) {
      return `All six required EVV elements are present and valid. ${federalCompliant ? 'Federal compliant.' : ''} ${texasCompliant ? 'Texas HHSC compliant.' : ''}`;
    }

    const parts: string[] = [];

    if (missingElements.length > 0) {
      parts.push(`Missing elements: ${missingElements.join(', ')}`);
    }

    if (invalidElements.length > 0) {
      parts.push(`Invalid elements: ${invalidElements.join(', ')}`);
    }

    if (!federalCompliant) {
      parts.push('Does not meet federal EVV requirements');
    }

    if (this.config.requireTexasEnhancements && !texasCompliant) {
      parts.push('Does not meet Texas HHSC enhanced requirements');
    }

    return parts.join('. ') + '.';
  }

  /**
   * Get configuration (for testing/debugging)
   */
  getConfig(): ValidationConfig {
    return { ...this.config };
  }
}

/**
 * Create a federal-compliant six elements validator
 */
export function createFederalValidator(): SixElementsValidator {
  return new SixElementsValidator(FEDERAL_CONFIG);
}

/**
 * Create a Texas HHSC-compliant six elements validator
 */
export function createTexasValidator(config?: Partial<ValidationConfig>): SixElementsValidator {
  return new SixElementsValidator({ ...TEXAS_CONFIG, ...config });
}
