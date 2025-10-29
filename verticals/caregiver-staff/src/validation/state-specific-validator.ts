/**
 * State-specific caregiver validation for Texas and Florida
 * 
 * Texas: 26 TAC §558, HHSC requirements, registry checks
 * Florida: Chapter 59A-8, AHCA requirements, Level 2 screening
 */

import { z } from 'zod';
import {
  StateSpecificCaregiverData,
  TexasCaregiverData,
  FloridaCaregiverData,
  CaregiverRole,
} from '../types/caregiver';

// Texas validation schemas
const registryCheckSchema = z.object({
  checkDate: z.date(),
  expirationDate: z.date(),
  status: z.enum(['CLEAR', 'PENDING', 'LISTED', 'EXPIRED']),
  registryType: z.enum(['EMPLOYEE_MISCONDUCT', 'NURSE_AIDE', 'OTHER']),
  confirmationNumber: z.string().optional(),
  performedBy: z.string().uuid(),
  documentPath: z.string().optional(),
  notes: z.string().optional(),
  listingDetails: z.object({
    listedDate: z.date().optional(),
    violationType: z.string().optional(),
    disposition: z.string().optional(),
    ineligibleForHire: z.boolean(),
  }).optional(),
}).refine(
  (data) => data.expirationDate > data.checkDate,
  { message: 'Expiration date must be after check date' }
);

const texasMandatoryTrainingSchema = z.object({
  abuseNeglectReporting: z.boolean(),
  abuseNeglectReportingDate: z.date().optional(),
  clientRights: z.boolean(),
  clientRightsDate: z.date().optional(),
  infectionControl: z.boolean(),
  infectionControlDate: z.date().optional(),
  emergencyProcedures: z.boolean(),
  emergencyProceduresDate: z.date().optional(),
  mandatedReporterTraining: z.boolean(),
  mandatedReporterDate: z.date().optional(),
});

const texasCaregiverDataSchema = z.object({
  employeeMisconductRegistryCheck: registryCheckSchema.optional(),
  nurseAideRegistryCheck: registryCheckSchema.optional(),
  dpsFingerprinting: z.any().optional(),
  tbScreening: z.any().optional(),
  tbScreeningRequired: z.boolean(),
  hhscOrientationComplete: z.boolean(),
  hhscOrientationDate: z.date().optional(),
  hhscOrientationTopics: z.array(z.string()).optional(),
  mandatoryTraining: texasMandatoryTrainingSchema.optional(),
  evvAttendantId: z.string().optional(),
  evvSystemEnrolled: z.boolean(),
  evvEnrollmentDate: z.date().optional(),
  delegationRecords: z.array(z.any()).optional(),
  rnDelegationSupervisor: z.string().uuid().optional(),
  eVerifyCompleted: z.boolean(),
  eVerifyDate: z.date().optional(),
  i9FormOnFile: z.boolean(),
  i9ExpirationDate: z.date().optional(),
  qualifiedForCDS: z.boolean(),
  qualifiedForPAS: z.boolean(),
  qualifiedForHAB: z.boolean(),
  registryCheckStatus: z.enum(['CLEAR', 'PENDING', 'FLAGGED', 'INELIGIBLE']),
  lastComplianceReview: z.date().optional(),
  nextComplianceReview: z.date().optional(),
});

// Florida validation schemas
const floridaBackgroundScreeningSchema = z.object({
  screeningDate: z.date(),
  screeningType: z.enum(['INITIAL', 'FIVE_YEAR_RESCREEN', 'UPDATE']),
  clearanceDate: z.date().optional(),
  expirationDate: z.date(),
  status: z.enum(['CLEARED', 'PENDING', 'CONDITIONAL', 'DISQUALIFIED']),
  clearinghouseId: z.string().optional(),
  ahcaClearanceNumber: z.string().optional(),
  exemptionGranted: z.boolean().optional(),
  exemptionReason: z.string().optional(),
  disqualifyingOffenses: z.array(z.any()).optional(),
  documentPath: z.string().optional(),
}).refine(
  (data) => data.expirationDate > data.screeningDate,
  { message: 'Expiration date must be after screening date' }
);

const floridaCaregiverDataSchema = z.object({
  level2BackgroundScreening: floridaBackgroundScreeningSchema.optional(),
  ahcaClearinghouseId: z.string().optional(),
  screeningStatus: z.enum(['CLEARED', 'PENDING', 'CONDITIONAL', 'DISQUALIFIED']),
  flLicenseNumber: z.string().optional(),
  flLicenseType: z.enum(['RN', 'LPN', 'ARNP', 'CNA', 'HHA', 'PT', 'OT', 'ST', 'NONE']).optional(),
  flLicenseStatus: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'REVOKED']).optional(),
  flLicenseExpiration: z.date().optional(),
  mqaVerificationDate: z.date().optional(),
  cnaRegistrationNumber: z.string().optional(),
  hhaRegistrationNumber: z.string().optional(),
  registrationExpiration: z.date().optional(),
  requiresRNSupervision: z.boolean(),
  assignedRNSupervisor: z.string().uuid().optional(),
  supervisoryRelationship: z.any().optional(),
  hivAidsTrainingComplete: z.boolean(),
  hivAidsTrainingDate: z.date().optional(),
  oshaBloodbornePathogenTraining: z.date().optional(),
  tbScreening: z.any().optional(),
  scopeOfPractice: z.array(z.string()).optional(),
  delegatedTasks: z.array(z.any()).optional(),
  rnDelegationAuthorization: z.array(z.any()).optional(),
  medicaidProviderId: z.string().optional(),
  ahcaProviderId: z.string().optional(),
  evvSystemIds: z.array(z.any()).optional(),
  hurricaneRedeploymentZone: z.string().optional(),
  emergencyCredentialing: z.array(z.any()).optional(),
  ahcaComplianceStatus: z.enum(['COMPLIANT', 'PENDING', 'NON_COMPLIANT']),
  lastAHCAVerification: z.date().optional(),
  nextRescreenDue: z.date().optional(),
});

const stateSpecificCaregiverDataSchema = z.object({
  state: z.enum(['TX', 'FL']),
  texas: texasCaregiverDataSchema.optional(),
  florida: floridaCaregiverDataSchema.optional(),
}).refine(
  (data) => {
    if (data.state === 'TX') {
      return data.texas !== undefined;
    }
    if (data.state === 'FL') {
      return data.florida !== undefined;
    }
    return true;
  },
  { message: 'State-specific data must be provided for the selected state' }
);

export class StateSpecificCaregiverValidator {
  /**
   * Validate state-specific caregiver data
   */
  validateStateSpecific(data: StateSpecificCaregiverData): ValidationResult {
    try {
      stateSpecificCaregiverDataSchema.parse(data);
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        };
      }
      return {
        success: false,
        errors: [{ path: 'unknown', message: 'Validation failed' }],
      };
    }
  }

  /**
   * Validate Texas-specific caregiver data
   */
  validateTexasCaregiver(data: TexasCaregiverData, role: CaregiverRole): ValidationResult {
    try {
      texasCaregiverDataSchema.parse(data);
      
      // Additional TX business rules
      const additionalErrors: Array<{ path: string; message: string }> = [];
      
      // Rule: Registry checks required for all caregiving staff
      if (this.isDirectCareRole(role)) {
        if (!data.employeeMisconductRegistryCheck) {
          additionalErrors.push({
            path: 'employeeMisconductRegistryCheck',
            message: 'Employee Misconduct Registry check required for direct care roles (26 TAC §558)',
          });
        } else if (data.employeeMisconductRegistryCheck.status === 'EXPIRED') {
          additionalErrors.push({
            path: 'employeeMisconductRegistryCheck',
            message: 'Employee Misconduct Registry check expired',
          });
        } else if (data.employeeMisconductRegistryCheck.listingDetails?.ineligibleForHire) {
          additionalErrors.push({
            path: 'employeeMisconductRegistryCheck',
            message: 'Caregiver listed on Employee Misconduct Registry - ineligible for hire',
          });
        }
      }
      
      // Rule: Nurse Aide Registry check required for CNAs
      if (role === 'CERTIFIED_NURSING_ASSISTANT') {
        if (!data.nurseAideRegistryCheck) {
          additionalErrors.push({
            path: 'nurseAideRegistryCheck',
            message: 'Nurse Aide Registry check required for CNA role',
          });
        } else if (data.nurseAideRegistryCheck.status === 'EXPIRED') {
          additionalErrors.push({
            path: 'nurseAideRegistryCheck',
            message: 'Nurse Aide Registry check expired',
          });
        }
      }
      
      // Rule: HHSC orientation required (26 TAC §558.259)
      if (!data.hhscOrientationComplete) {
        additionalErrors.push({
          path: 'hhscOrientationComplete',
          message: 'HHSC orientation required per 26 TAC §558.259',
        });
      }
      
      // Rule: Mandatory training requirements
      if (data.mandatoryTraining) {
        const training = data.mandatoryTraining;
        if (!training.abuseNeglectReporting) {
          additionalErrors.push({
            path: 'mandatoryTraining.abuseNeglectReporting',
            message: 'Abuse/neglect reporting training required',
          });
        }
        if (!training.clientRights) {
          additionalErrors.push({
            path: 'mandatoryTraining.clientRights',
            message: 'Client rights training required',
          });
        }
      }
      
      // Rule: E-Verify and I-9 required
      if (!data.eVerifyCompleted) {
        additionalErrors.push({
          path: 'eVerifyCompleted',
          message: 'E-Verify completion required',
        });
      }
      if (!data.i9FormOnFile) {
        additionalErrors.push({
          path: 'i9FormOnFile',
          message: 'I-9 form must be on file',
        });
      }
      
      // Rule: TB screening required if applicable
      if (data.tbScreeningRequired && !data.tbScreening) {
        additionalErrors.push({
          path: 'tbScreening',
          message: 'TB screening required per DSHS requirements',
        });
      }
      
      // Rule: EVV enrollment for direct care
      if (this.isDirectCareRole(role) && !data.evvSystemEnrolled) {
        additionalErrors.push({
          path: 'evvSystemEnrolled',
          message: 'EVV system enrollment required for direct care roles',
        });
      }
      
      // Rule: Check registry status
      if (data.registryCheckStatus === 'FLAGGED' || data.registryCheckStatus === 'INELIGIBLE') {
        additionalErrors.push({
          path: 'registryCheckStatus',
          message: `Registry check status is ${data.registryCheckStatus} - further review required`,
        });
      }
      
      if (additionalErrors.length > 0) {
        return { success: false, errors: additionalErrors };
      }
      
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        };
      }
      return {
        success: false,
        errors: [{ path: 'unknown', message: 'Validation failed' }],
      };
    }
  }

  /**
   * Validate Florida-specific caregiver data
   */
  validateFloridaCaregiver(data: FloridaCaregiverData, role: CaregiverRole): ValidationResult {
    try {
      floridaCaregiverDataSchema.parse(data);
      
      // Additional FL business rules
      const additionalErrors: Array<{ path: string; message: string }> = [];
      
      // Rule: Level 2 background screening required (AHCA Clearinghouse)
      if (this.isDirectCareRole(role)) {
        if (!data.level2BackgroundScreening) {
          additionalErrors.push({
            path: 'level2BackgroundScreening',
            message: 'Level 2 background screening required (AHCA requirement)',
          });
        } else {
          const screening = data.level2BackgroundScreening;
          
          if (screening.status === 'DISQUALIFIED') {
            additionalErrors.push({
              path: 'level2BackgroundScreening.status',
              message: 'Caregiver disqualified from Level 2 background screening',
            });
          }
          
          if (screening.status === 'PENDING') {
            additionalErrors.push({
              path: 'level2BackgroundScreening.status',
              message: 'Level 2 background screening pending clearance',
            });
          }
          
          // Check for expiration
          if (screening.expirationDate < new Date()) {
            additionalErrors.push({
              path: 'level2BackgroundScreening.expirationDate',
              message: 'Level 2 background screening expired - 5-year rescreen required',
            });
          }
          
          // Warn if expiring within 90 days
          const daysUntilExpiration = Math.floor(
            (screening.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          if (daysUntilExpiration > 0 && daysUntilExpiration <= 90) {
            additionalErrors.push({
              path: 'level2BackgroundScreening.expirationDate',
              message: `Level 2 background screening expiring in ${daysUntilExpiration} days - initiate rescreen`,
            });
          }
        }
      }
      
      // Rule: Professional license validation (MQA Portal)
      if (this.requiresFloridaLicense(role)) {
        if (!data.flLicenseNumber) {
          additionalErrors.push({
            path: 'flLicenseNumber',
            message: `Florida professional license required for ${role}`,
          });
        } else {
          if (data.flLicenseStatus === 'INACTIVE') {
            additionalErrors.push({
              path: 'flLicenseStatus',
              message: `Florida license status is ${data.flLicenseStatus}`,
            });
          }
          
          if (data.flLicenseStatus === 'SUSPENDED' || data.flLicenseStatus === 'REVOKED') {
            additionalErrors.push({
              path: 'flLicenseStatus',
              message: `Florida license ${data.flLicenseStatus} - ineligible to practice`,
            });
          }
          
          if (data.flLicenseExpiration && data.flLicenseExpiration < new Date()) {
            additionalErrors.push({
              path: 'flLicenseExpiration',
              message: 'Florida professional license expired',
            });
          }
        }
      }
      
      // Rule: CNA/HHA registration (59A-8.0095)
      if (role === 'CERTIFIED_NURSING_ASSISTANT' && !data.cnaRegistrationNumber) {
        additionalErrors.push({
          path: 'cnaRegistrationNumber',
          message: 'CNA registration number required (59A-8.0095)',
        });
      }
      
      if (role === 'HOME_HEALTH_AIDE' && !data.hhaRegistrationNumber) {
        additionalErrors.push({
          path: 'hhaRegistrationNumber',
          message: 'HHA registration number required (59A-8.0095)',
        });
      }
      
      // Rule: RN supervision requirements (59A-8.0095)
      if (data.requiresRNSupervision && !data.assignedRNSupervisor) {
        additionalErrors.push({
          path: 'assignedRNSupervisor',
          message: 'RN supervisor assignment required per 59A-8.0095',
        });
      }
      
      // Rule: HIV/AIDS training mandatory (59A-8.0095)
      if (!data.hivAidsTrainingComplete) {
        additionalErrors.push({
          path: 'hivAidsTrainingComplete',
          message: 'HIV/AIDS training required per 59A-8.0095',
        });
      }
      
      // Rule: OSHA bloodborne pathogen training
      if (!data.oshaBloodbornePathogenTraining) {
        additionalErrors.push({
          path: 'oshaBloodbornePathogenTraining',
          message: 'OSHA bloodborne pathogen training required',
        });
      }
      
      // Rule: Medicaid provider ID for billing
      if (this.isDirectCareRole(role) && !data.medicaidProviderId) {
        additionalErrors.push({
          path: 'medicaidProviderId',
          message: 'Medicaid provider ID required for service billing',
        });
      }
      
      // Rule: Check next rescreen due date
      if (data.nextRescreenDue && data.nextRescreenDue < new Date()) {
        additionalErrors.push({
          path: 'nextRescreenDue',
          message: '5-year background rescreen overdue',
        });
      }
      
      // Rule: AHCA compliance status
      if (data.ahcaComplianceStatus === 'NON_COMPLIANT') {
        additionalErrors.push({
          path: 'ahcaComplianceStatus',
          message: 'AHCA compliance status is non-compliant - resolve issues before assignment',
        });
      }
      
      if (additionalErrors.length > 0) {
        return { success: false, errors: additionalErrors };
      }
      
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        };
      }
      return {
        success: false,
        errors: [{ path: 'unknown', message: 'Validation failed' }],
      };
    }
  }

  /**
   * Validate credential with state-specific rules
   */
  validateCredentialCompliance(
    stateData: StateSpecificCaregiverData,
    role: CaregiverRole
  ): {
    compliant: boolean;
    eligibleForAssignment: boolean;
    issues: Array<{ severity: 'CRITICAL' | 'ERROR' | 'WARNING'; message: string }>;
  } {
    const issues: Array<{ severity: 'CRITICAL' | 'ERROR' | 'WARNING'; message: string }> = [];
    
    if (stateData.state === 'TX' && stateData.texas) {
      const tx = stateData.texas;
      
      // Critical issues (prevent assignment)
      if (tx.registryCheckStatus === 'INELIGIBLE') {
        issues.push({
          severity: 'CRITICAL',
          message: 'Listed on registry - INELIGIBLE FOR HIRE',
        });
      }
      
      if (tx.employeeMisconductRegistryCheck?.listingDetails?.ineligibleForHire) {
        issues.push({
          severity: 'CRITICAL',
          message: 'Listed on Employee Misconduct Registry - cannot be assigned',
        });
      }
      
      // Errors (missing required items)
      if (!tx.hhscOrientationComplete) {
        issues.push({
          severity: 'ERROR',
          message: 'HHSC orientation not complete (26 TAC §558.259)',
        });
      }
      
      if (!tx.eVerifyCompleted || !tx.i9FormOnFile) {
        issues.push({
          severity: 'ERROR',
          message: 'E-Verify and I-9 requirements not complete',
        });
      }
      
      if (this.isDirectCareRole(role) && !tx.evvSystemEnrolled) {
        issues.push({
          severity: 'ERROR',
          message: 'Not enrolled in EVV system - required for direct care',
        });
      }
      
      // Warnings (expiring or needing attention)
      if (tx.employeeMisconductRegistryCheck?.status === 'EXPIRED') {
        issues.push({
          severity: 'WARNING',
          message: 'Employee Misconduct Registry check expired - renewal needed',
        });
      }
      
      if (tx.nextComplianceReview && tx.nextComplianceReview < new Date()) {
        issues.push({
          severity: 'WARNING',
          message: 'Compliance review overdue',
        });
      }
      
    } else if (stateData.state === 'FL' && stateData.florida) {
      const fl = stateData.florida;
      
      // Critical issues (prevent assignment)
      if (fl.screeningStatus === 'DISQUALIFIED') {
        issues.push({
          severity: 'CRITICAL',
          message: 'Disqualified from Level 2 background screening - INELIGIBLE',
        });
      }
      
      if (fl.flLicenseStatus === 'REVOKED' || fl.flLicenseStatus === 'SUSPENDED') {
        issues.push({
          severity: 'CRITICAL',
          message: `Professional license ${fl.flLicenseStatus} - cannot practice`,
        });
      }
      
      // Errors (missing required items)
      if (fl.screeningStatus !== 'CLEARED') {
        issues.push({
          severity: 'ERROR',
          message: `Level 2 background screening status: ${fl.screeningStatus}`,
        });
      }
      
      if (!fl.hivAidsTrainingComplete) {
        issues.push({
          severity: 'ERROR',
          message: 'HIV/AIDS training not complete (59A-8.0095 requirement)',
        });
      }
      
      if (fl.requiresRNSupervision && !fl.assignedRNSupervisor) {
        issues.push({
          severity: 'ERROR',
          message: 'RN supervisor not assigned (59A-8.0095 requirement)',
        });
      }
      
      if (this.requiresFloridaLicense(role) && (!fl.flLicenseNumber || fl.flLicenseStatus !== 'ACTIVE')) {
        issues.push({
          severity: 'ERROR',
          message: 'Valid Florida professional license required',
        });
      }
      
      // Warnings (expiring or needing attention)
      if (fl.nextRescreenDue && fl.nextRescreenDue < new Date()) {
        issues.push({
          severity: 'WARNING',
          message: '5-year background rescreen overdue',
        });
      }
      
      if (fl.level2BackgroundScreening) {
        const daysUntilExpiration = Math.floor(
          (fl.level2BackgroundScreening.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilExpiration > 0 && daysUntilExpiration <= 90) {
          issues.push({
            severity: 'WARNING',
            message: `Level 2 screening expiring in ${daysUntilExpiration} days`,
          });
        }
      }
      
      if (fl.ahcaComplianceStatus !== 'COMPLIANT') {
        issues.push({
          severity: 'WARNING',
          message: `AHCA compliance status: ${fl.ahcaComplianceStatus}`,
        });
      }
    }
    
    const hasCritical = issues.some((i) => i.severity === 'CRITICAL');
    const hasErrors = issues.some((i) => i.severity === 'ERROR');
    
    return {
      compliant: !hasErrors && !hasCritical,
      eligibleForAssignment: !hasCritical,
      issues,
    };
  }

  /**
   * Helper: Check if role is direct care
   */
  private isDirectCareRole(role: CaregiverRole): boolean {
    return [
      'CAREGIVER',
      'SENIOR_CAREGIVER',
      'CERTIFIED_NURSING_ASSISTANT',
      'HOME_HEALTH_AIDE',
      'PERSONAL_CARE_AIDE',
      'COMPANION',
      'NURSE_RN',
      'NURSE_LPN',
    ].includes(role);
  }

  /**
   * Helper: Check if role requires FL professional license
   */
  private requiresFloridaLicense(role: CaregiverRole): boolean {
    return [
      'NURSE_RN',
      'NURSE_LPN',
      'THERAPIST',
      'CERTIFIED_NURSING_ASSISTANT',
    ].includes(role);
  }
}

interface ValidationResult {
  success: boolean;
  errors?: Array<{ path: string; message: string }>;
}
