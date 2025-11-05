/**
 * Base Compliance Validator
 * 
 * Abstract base class for state-specific compliance validators.
 * Provides common validation logic that all states share.
 * 
 * State-specific validators extend this class and implement state-specific rules.
 */

import { StateCode } from '../types/base.js';
import {
  StateComplianceValidator,
  ValidationResult,
  ComplianceIssue,
  CaregiverCredentials,
  VisitDetails,
  ClientDetails,
  ServiceAuthorization,
  VisitDocumentation,
  VisitDocumentationRequirements,
  PlanOfCare,
  createSuccessResult,
  createFailureResult,
  isExpired,
  isExpiringSoon,
  daysUntilExpiration,
  daysSince,
} from './types/index.js';

/**
 * Configuration for state-specific credential requirements
 */
export interface StateCredentialConfig {
  backgroundScreening: {
    required: boolean;
    type: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'FINGERPRINT';
    frequency: 'AT_HIRE' | 'ANNUAL' | 'BIENNIAL' | 'EVERY_5_YEARS';
    expirationDays: number;
    warningDays: number;
  };
  licensure: {
    required: boolean;
    roles: string[];
    verificationFrequency: 'AT_HIRE' | 'ANNUAL';
  };
  registryChecks: Array<{
    name: string;
    type: 'EMPLOYEE_MISCONDUCT' | 'NURSE_AIDE' | 'ABUSE_NEGLECT' | 'OTHER';
    frequency: 'AT_HIRE' | 'ANNUAL';
    expirationDays: number;
  }>;
}

/**
 * Configuration for state-specific authorization requirements
 */
export interface StateAuthorizationConfig {
  required: boolean;
  warningThreshold: number; // Percentage of units consumed before warning (e.g., 0.9 for 90%)
  allowOverage: boolean;
}

/**
 * Base compliance validator
 * 
 * Provides common validation logic. State-specific validators extend this.
 */
export abstract class BaseComplianceValidator implements StateComplianceValidator {
  abstract readonly state: StateCode;
  protected abstract readonly credentialConfig: StateCredentialConfig;
  protected abstract readonly authorizationConfig: StateAuthorizationConfig;
  
  /**
   * Validate if caregiver can be assigned to visit
   * 
   * Checks credentials, licensure, registry status.
   * State-specific validators can override to add state-specific checks.
   */
  async canAssignToVisit(
    caregiver: CaregiverCredentials,
    visit: VisitDetails,
    client: ClientDetails
  ): Promise<ValidationResult> {
    const issues: ComplianceIssue[] = [];
    
    // Background screening validation
    if (this.credentialConfig.backgroundScreening.required) {
      const bgIssues = this.validateBackgroundScreening(caregiver);
      issues.push(...bgIssues);
    }
    
    // Licensure validation
    if (this.credentialConfig.licensure.required) {
      const licenseIssues = this.validateLicensure(caregiver, visit);
      issues.push(...licenseIssues);
    }
    
    // Registry checks validation
    const registryIssues = this.validateRegistryChecks(caregiver);
    issues.push(...registryIssues);
    
    // State-specific validation (implemented by subclasses)
    const stateSpecificIssues = await this.validateStateSpecificCredentials(caregiver, visit, client);
    issues.push(...stateSpecificIssues);
    
    return issues.length > 0
      ? createFailureResult(issues, this.state, this.constructor.name)
      : createSuccessResult(this.state, this.constructor.name);
  }
  
  /**
   * Validate background screening
   */
  protected validateBackgroundScreening(caregiver: CaregiverCredentials): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const config = this.credentialConfig.backgroundScreening;
    const screening = caregiver.backgroundScreening;
    
    // Missing background check
    if (!screening || !screening.checkDate) {
      issues.push({
        type: `${this.state}_BACKGROUND_MISSING`,
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'No background screening on file',
        regulation: this.getBackgroundRegulation(),
        remediation: 'Complete background screening before assignment',
        canBeOverridden: false,
        requiresComplianceReview: true,
      });
      return issues;
    }
    
    // Pending background check
    if (screening.status === 'PENDING') {
      issues.push({
        type: `${this.state}_BACKGROUND_PENDING`,
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'Background screening results pending',
        regulation: this.getBackgroundRegulation(),
        remediation: 'Wait for background screening results',
        canBeOverridden: false,
      });
      return issues;
    }
    
    // Issues found on background check
    if (screening.status === 'ISSUES') {
      issues.push({
        type: `${this.state}_BACKGROUND_ISSUES`,
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'Background screening revealed disqualifying information',
        regulation: this.getBackgroundRegulation(),
        remediation: 'Contact compliance officer for review',
        canBeOverridden: false,
        requiresComplianceReview: true,
      });
      return issues;
    }
    
    // Expired background check
    const expirationDate = screening.expirationDate || 
      new Date(screening.checkDate.getTime() + config.expirationDays * 24 * 60 * 60 * 1000);
    
    if (isExpired(expirationDate)) {
      const days = daysSince(expirationDate);
      issues.push({
        type: `${this.state}_BACKGROUND_EXPIRED`,
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: `Background screening expired ${days} days ago`,
        regulation: this.getBackgroundRegulation(),
        remediation: 'Re-verify background screening',
        canBeOverridden: false,
        metadata: { expiredDays: days, expirationDate },
      });
    }
    // Expiring soon
    else if (isExpiringSoon(expirationDate, config.warningDays)) {
      const days = daysUntilExpiration(expirationDate);
      issues.push({
        type: `${this.state}_BACKGROUND_EXPIRING_SOON`,
        severity: 'WARNING',
        category: 'CAREGIVER_CREDENTIALS',
        message: `Background screening expires in ${days} days`,
        regulation: this.getBackgroundRegulation(),
        remediation: 'Schedule background screening renewal',
        canBeOverridden: true,
        metadata: { daysRemaining: days, expirationDate },
      });
    }
    
    return issues;
  }
  
  /**
   * Validate professional licensure
   */
  protected validateLicensure(
    caregiver: CaregiverCredentials,
    visit: VisitDetails
  ): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const licenses = caregiver.licenses || [];
    
    // Check if caregiver has required license for visit state
    const validLicense = licenses.find(
      (license) =>
        license.state === visit.state &&
        license.status === 'ACTIVE' &&
        !isExpired(license.expirationDate)
    );
    
    if (!validLicense && this.credentialConfig.licensure.required) {
      issues.push({
        type: `${this.state}_LICENSE_MISSING`,
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: `No active license for ${visit.state}`,
        regulation: this.getLicensureRegulation(),
        remediation: `Obtain ${visit.state} license or reciprocity`,
        canBeOverridden: false,
      });
      return issues;
    }
    
    // Check for expired licenses
    const expiredLicenses = licenses.filter(
      (license) => license.state === visit.state && isExpired(license.expirationDate)
    );
    
    for (const license of expiredLicenses) {
      const days = daysSince(license.expirationDate);
      issues.push({
        type: `${this.state}_LICENSE_EXPIRED`,
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: `${license.type} license expired ${days} days ago`,
        regulation: this.getLicensureRegulation(),
        remediation: 'Renew license',
        canBeOverridden: false,
        metadata: { licenseType: license.type, expiredDays: days },
      });
    }
    
    // Check for licenses expiring soon
    if (validLicense && isExpiringSoon(validLicense.expirationDate, 30)) {
      const days = daysUntilExpiration(validLicense.expirationDate);
      issues.push({
        type: `${this.state}_LICENSE_EXPIRING_SOON`,
        severity: 'WARNING',
        category: 'CAREGIVER_CREDENTIALS',
        message: `${validLicense.type} license expires in ${days} days`,
        regulation: this.getLicensureRegulation(),
        remediation: 'Renew license before expiration',
        canBeOverridden: true,
        metadata: { licenseType: validLicense.type, daysRemaining: days },
      });
    }
    
    return issues;
  }
  
  /**
   * Validate registry checks
   */
  protected validateRegistryChecks(caregiver: CaregiverCredentials): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const checks = caregiver.registryChecks || [];
    
    for (const requiredCheck of this.credentialConfig.registryChecks) {
      const check = checks.find((c) => c.name === requiredCheck.name);
      
      // Missing registry check
      if (!check) {
        issues.push({
          type: `${this.state}_REGISTRY_MISSING_${requiredCheck.type}`,
          severity: 'BLOCKING',
          category: 'CAREGIVER_CREDENTIALS',
          message: `No ${requiredCheck.name} check on file`,
          regulation: this.getRegistryRegulation(requiredCheck.type),
          remediation: `Perform ${requiredCheck.name} verification`,
          canBeOverridden: false,
        });
        continue;
      }
      
      // Listed on registry (disqualifying)
      if (check.status === 'LISTED') {
        issues.push({
          type: `${this.state}_REGISTRY_LISTED_${requiredCheck.type}`,
          severity: 'BLOCKING',
          category: 'CAREGIVER_CREDENTIALS',
          message: `Caregiver listed on ${requiredCheck.name}`,
          regulation: this.getRegistryRegulation(requiredCheck.type),
          remediation: 'Contact compliance officer - permanent disqualification',
          canBeOverridden: false,
          requiresComplianceReview: true,
        });
        continue;
      }
      
      // Pending registry check
      if (check.status === 'PENDING') {
        issues.push({
          type: `${this.state}_REGISTRY_PENDING_${requiredCheck.type}`,
          severity: 'BLOCKING',
          category: 'CAREGIVER_CREDENTIALS',
          message: `${requiredCheck.name} check pending`,
          regulation: this.getRegistryRegulation(requiredCheck.type),
          remediation: 'Wait for registry check results',
          canBeOverridden: false,
        });
        continue;
      }
      
      // Expired registry check
      const expirationDate = new Date(
        check.checkDate.getTime() + requiredCheck.expirationDays * 24 * 60 * 60 * 1000
      );
      
      if (isExpired(expirationDate)) {
        const days = daysSince(expirationDate);
        issues.push({
          type: `${this.state}_REGISTRY_EXPIRED_${requiredCheck.type}`,
          severity: 'BLOCKING',
          category: 'CAREGIVER_CREDENTIALS',
          message: `${requiredCheck.name} check expired ${days} days ago`,
          regulation: this.getRegistryRegulation(requiredCheck.type),
          remediation: `Re-verify ${requiredCheck.name} status`,
          canBeOverridden: false,
          metadata: { expiredDays: days },
        });
      }
    }
    
    return issues;
  }
  
  /**
   * Validate client authorization
   */
  async validateAuthorization(
    authorization: ServiceAuthorization,
    serviceType: string,
    scheduledDate: Date,
    units: number
  ): Promise<ValidationResult> {
    const issues: ComplianceIssue[] = [];
    
    if (!this.authorizationConfig.required) {
      return createSuccessResult(this.state, this.constructor.name);
    }
    
    // Authorization expired
    if (isExpired(authorization.endDate)) {
      const days = daysSince(authorization.endDate);
      issues.push({
        type: `${this.state}_AUTHORIZATION_EXPIRED`,
        severity: 'BLOCKING',
        category: 'CLIENT_AUTHORIZATION',
        message: `Authorization expired ${days} days ago`,
        regulation: this.getAuthorizationRegulation(),
        remediation: 'Request authorization renewal from payor',
        canBeOverridden: false,
        metadata: { expiredDays: days, authNumber: authorization.authorizationNumber },
      });
    }
    
    // Authorization not yet active
    if (scheduledDate < authorization.startDate) {
      issues.push({
        type: `${this.state}_AUTHORIZATION_NOT_ACTIVE`,
        severity: 'BLOCKING',
        category: 'CLIENT_AUTHORIZATION',
        message: 'Authorization not yet active for scheduled date',
        regulation: this.getAuthorizationRegulation(),
        remediation: 'Schedule visit after authorization start date',
        canBeOverridden: false,
        metadata: { authStartDate: authorization.startDate, scheduledDate },
      });
    }
    
    // Exceeding authorized units
    const totalUnitsAfter = authorization.unitsConsumed + units;
    if (totalUnitsAfter > authorization.authorizedUnits && !this.authorizationConfig.allowOverage) {
      const overage = totalUnitsAfter - authorization.authorizedUnits;
      issues.push({
        type: `${this.state}_AUTHORIZATION_EXCEEDED`,
        severity: 'BLOCKING',
        category: 'CLIENT_AUTHORIZATION',
        message: `Would exceed authorized units by ${overage}`,
        regulation: this.getAuthorizationRegulation(),
        remediation: 'Request additional authorization or reduce visit duration',
        canBeOverridden: false,
        metadata: {
          authorizedUnits: authorization.authorizedUnits,
          currentlyConsumed: authorization.unitsConsumed,
          requestedUnits: units,
          overage,
        },
      });
    }
    
    // Service type not authorized
    if (!authorization.authorizedServices.includes(serviceType)) {
      issues.push({
        type: `${this.state}_SERVICE_NOT_AUTHORIZED`,
        severity: 'BLOCKING',
        category: 'CLIENT_AUTHORIZATION',
        message: `Service type '${serviceType}' not authorized`,
        regulation: this.getAuthorizationRegulation(),
        remediation: 'Request authorization for this service type',
        canBeOverridden: false,
        metadata: {
          requestedService: serviceType,
          authorizedServices: authorization.authorizedServices,
        },
      });
    }
    
    // Warning: Nearing authorized units
    const utilizationPercent = totalUnitsAfter / authorization.authorizedUnits;
    if (utilizationPercent >= this.authorizationConfig.warningThreshold && utilizationPercent < 1) {
      issues.push({
        type: `${this.state}_AUTHORIZATION_NEARING_LIMIT`,
        severity: 'WARNING',
        category: 'CLIENT_AUTHORIZATION',
        message: `Authorization ${Math.round(utilizationPercent * 100)}% consumed`,
        regulation: this.getAuthorizationRegulation(),
        remediation: 'Consider requesting authorization renewal',
        canBeOverridden: true,
        metadata: {
          utilizationPercent,
          unitsRemaining: authorization.authorizedUnits - totalUnitsAfter,
        },
      });
    }
    
    return issues.length > 0
      ? createFailureResult(issues, this.state, this.constructor.name)
      : createSuccessResult(this.state, this.constructor.name);
  }
  
  /**
   * Validate visit documentation
   */
  async validateVisitDocumentation(
    documentation: VisitDocumentation,
    requirements: VisitDocumentationRequirements
  ): Promise<ValidationResult> {
    const issues: ComplianceIssue[] = [];
    
    // Check required fields
    if (requirements.servicesProvided && !documentation.servicesProvided) {
      issues.push(this.createDocumentationIssue('SERVICES_MISSING', 'Services provided must be documented'));
    }
    
    if (requirements.clientCondition && !documentation.clientCondition) {
      issues.push(this.createDocumentationIssue('CONDITION_MISSING', 'Client condition must be documented'));
    }
    
    if (requirements.vitalSigns && !documentation.vitalSigns) {
      issues.push(this.createDocumentationIssue('VITALS_MISSING', 'Vital signs must be documented'));
    }
    
    if (requirements.medications && !documentation.medications) {
      issues.push(this.createDocumentationIssue('MEDICATIONS_MISSING', 'Medications must be documented'));
    }
    
    // Check signatures
    if (requirements.signatures.caregiver && !documentation.caregiverSignature) {
      issues.push(this.createDocumentationIssue('CAREGIVER_SIGNATURE_MISSING', 'Caregiver signature required'));
    }
    
    if (requirements.signatures.client && !documentation.clientSignature && !documentation.representativeSignature) {
      issues.push(this.createDocumentationIssue('CLIENT_SIGNATURE_MISSING', 'Client or representative signature required'));
    }
    
    // Check timeliness
    if (documentation.completedAt && requirements.timelinessHours) {
      // Would need visit end time to check properly - this is simplified
      // Production would check: completedAt - visitEndTime <= timelinessHours
    }
    
    // Check note quality (if minimum length specified)
    if (requirements.minimumNoteLength && documentation.observations) {
      if (documentation.observations.length < requirements.minimumNoteLength) {
        issues.push({
          type: `${this.state}_NOTE_TOO_SHORT`,
          severity: 'WARNING',
          category: 'VISIT_DOCUMENTATION',
          message: `Visit notes should be at least ${requirements.minimumNoteLength} characters`,
          regulation: this.getDocumentationRegulation(),
          remediation: 'Provide more detailed observations',
          canBeOverridden: true,
        });
      }
    }
    
    // Check for blocked phrases
    if (requirements.blockedPhrases && documentation.observations) {
      for (const phrase of requirements.blockedPhrases) {
        if (documentation.observations.toLowerCase().includes(phrase.toLowerCase())) {
          issues.push({
            type: `${this.state}_VAGUE_DOCUMENTATION`,
            severity: 'WARNING',
            category: 'VISIT_DOCUMENTATION',
            message: `Avoid vague phrases like "${phrase}" - be more specific`,
            regulation: this.getDocumentationRegulation(),
            remediation: 'Use specific, objective observations',
            canBeOverridden: true,
            metadata: { blockedPhrase: phrase },
          });
        }
      }
    }
    
    return issues.length > 0
      ? createFailureResult(issues, this.state, this.constructor.name)
      : createSuccessResult(this.state, this.constructor.name);
  }
  
  /**
   * Validate plan of care
   */
  async validatePlanOfCare(planOfCare: PlanOfCare): Promise<ValidationResult> {
    const issues: ComplianceIssue[] = [];
    
    // Review overdue
    if (planOfCare.nextReviewDue && isExpired(planOfCare.nextReviewDue)) {
      const days = daysSince(planOfCare.nextReviewDue);
      issues.push({
        type: `${this.state}_POC_REVIEW_OVERDUE`,
        severity: 'BLOCKING',
        category: 'CLIENT_AUTHORIZATION',
        message: `Plan of care review overdue by ${days} days`,
        regulation: this.getPlanOfCareRegulation(),
        remediation: 'Complete plan of care review',
        canBeOverridden: false,
        metadata: { overduedays: days },
      });
    }
    // Review due soon
    else if (planOfCare.nextReviewDue && isExpiringSoon(planOfCare.nextReviewDue, 7)) {
      const days = daysUntilExpiration(planOfCare.nextReviewDue);
      issues.push({
        type: `${this.state}_POC_REVIEW_DUE_SOON`,
        severity: 'WARNING',
        category: 'CLIENT_AUTHORIZATION',
        message: `Plan of care review due in ${days} days`,
        regulation: this.getPlanOfCareRegulation(),
        remediation: 'Schedule plan of care review',
        canBeOverridden: true,
        metadata: { daysRemaining: days },
      });
    }
    
    // Physician orders expired
    if (planOfCare.ordersExpiration && isExpired(planOfCare.ordersExpiration)) {
      issues.push({
        type: `${this.state}_PHYSICIAN_ORDERS_EXPIRED`,
        severity: 'BLOCKING',
        category: 'CLIENT_AUTHORIZATION',
        message: 'Physician orders expired',
        regulation: this.getPlanOfCareRegulation(),
        remediation: 'Obtain new physician orders',
        canBeOverridden: false,
      });
    }
    
    return issues.length > 0
      ? createFailureResult(issues, this.state, this.constructor.name)
      : createSuccessResult(this.state, this.constructor.name);
  }
  
  /**
   * State-specific credential validation (override in subclasses)
   */
  protected async validateStateSpecificCredentials(
    _caregiver: CaregiverCredentials,
    _visit: VisitDetails,
    _client: ClientDetails
  ): Promise<ComplianceIssue[]> {
    // Override in state-specific validators
    return [];
  }
  
  /**
   * Helper to create documentation issue
   */
  protected createDocumentationIssue(type: string, message: string): ComplianceIssue {
    return {
      type: `${this.state}_DOC_${type}`,
      severity: 'BLOCKING',
      category: 'VISIT_DOCUMENTATION',
      message,
      regulation: this.getDocumentationRegulation(),
      remediation: 'Complete required documentation',
      canBeOverridden: false,
    };
  }
  
  /**
   * Abstract methods for state-specific regulations (override in subclasses)
   */
  protected abstract getBackgroundRegulation(): string;
  protected abstract getLicensureRegulation(): string;
  protected abstract getRegistryRegulation(type: string): string;
  protected abstract getAuthorizationRegulation(): string;
  protected abstract getDocumentationRegulation(): string;
  protected abstract getPlanOfCareRegulation(): string;
}
