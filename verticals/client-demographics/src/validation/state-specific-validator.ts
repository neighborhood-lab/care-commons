/**
 * State-specific client validation for Texas and Florida
 * 
 * Texas: 26 TAC §558, HHSC requirements
 * Florida: Chapter 59A-8, AHCA requirements
 */

import { z } from 'zod';
import {
  StateSpecificClientData,
  TexasClientData,
  FloridaClientData,
} from '../types/client';

// Texas validation schemas
const texasAuthorizedServiceSchema = z.object({
  id: z.string().uuid(),
  serviceCode: z.string().min(1, 'Service code required'),
  serviceName: z.string().min(1, 'Service name required'),
  authorizedUnits: z.number().nonnegative('Authorized units must be non-negative'),
  usedUnits: z.number().nonnegative('Used units must be non-negative'),
  unitType: z.enum(['HOURS', 'VISITS', 'DAYS']),
  authorizationNumber: z.string().min(1, 'Authorization number required'),
  effectiveDate: z.date(),
  expirationDate: z.date(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED']),
  requiresEVV: z.boolean(),
}).refine(
  (data) => data.usedUnits <= data.authorizedUnits,
  { message: 'Used units cannot exceed authorized units' }
).refine(
  (data) => data.expirationDate > data.effectiveDate,
  { message: 'Expiration date must be after effective date' }
);

const texasEVVRequirementsSchema = z.object({
  evvMandatory: z.boolean(),
  approvedClockMethods: z.array(z.enum(['MOBILE', 'TELEPHONY', 'FIXED'])).min(1),
  geoPerimeterRadius: z.number().positive().optional(),
  aggregatorSubmissionRequired: z.boolean(),
  tmhpIntegration: z.boolean(),
});

const texasClientDataSchema = z.object({
  medicaidMemberId: z.string().optional(),
  medicaidProgram: z.enum(['STAR', 'STAR_PLUS', 'STAR_KIDS', 'STAR_HEALTH', 'PHC', 'CFC']).optional(),
  hhscClientId: z.string().optional(),
  serviceDeliveryOption: z.enum(['AGENCY', 'CDS']).optional(),
  planOfCareNumber: z.string().optional(),
  authorizedServices: z.array(texasAuthorizedServiceSchema).default([]),
  currentAuthorization: z.any().optional(),
  evvEntityId: z.string().optional(),
  evvRequirements: texasEVVRequirementsSchema.optional(),
  emergencyPlanOnFile: z.boolean(),
  emergencyPlanDate: z.date().optional(),
  disasterEvacuationPlan: z.string().optional(),
  form1746Consent: z.any().optional(),
  biometricDataConsent: z.any().optional(),
  releaseOfInformation: z.array(z.any()).optional(),
  acuityLevel: z.enum(['LOW', 'MODERATE', 'HIGH', 'COMPLEX']).optional(),
  starPlusWaiverServices: z.array(z.string()).optional(),
});

// Florida validation schemas
const floridaAuthorizedServiceSchema = z.object({
  id: z.string().uuid(),
  serviceCode: z.string().min(1, 'Service code required'),
  serviceName: z.string().min(1, 'Service name required'),
  authorizedUnits: z.number().nonnegative('Authorized units must be non-negative'),
  usedUnits: z.number().nonnegative('Used units must be non-negative'),
  unitType: z.enum(['HOURS', 'VISITS', 'DAYS']),
  authorizationNumber: z.string().min(1, 'Authorization number required'),
  effectiveDate: z.date(),
  expirationDate: z.date(),
  visitFrequency: z.string().optional(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED']),
  requiresEVV: z.boolean(),
  requiresRNSupervision: z.boolean(),
}).refine(
  (data) => data.usedUnits <= data.authorizedUnits,
  { message: 'Used units cannot exceed authorized units' }
).refine(
  (data) => data.expirationDate > data.effectiveDate,
  { message: 'Expiration date must be after effective date' }
);

const floridaClientDataSchema = z.object({
  medicaidRecipientId: z.string().optional(),
  managedCarePlan: z.enum(['SMMC_LTC', 'SMMC_MMA', 'PACE', 'FFS']).optional(),
  apdWaiverEnrollment: z.any().optional(),
  doeaRiskClassification: z.enum(['LOW', 'MODERATE', 'HIGH']).optional(),
  planOfCareId: z.string().optional(),
  planOfCareReviewDate: z.date().optional(),
  nextReviewDue: z.date().optional(),
  authorizedServices: z.array(floridaAuthorizedServiceSchema).default([]),
  evvAggregatorId: z.string().optional(),
  evvSystemType: z.enum(['HHAX', 'NETSMART', 'OTHER']).optional(),
  smmcProgramEnrollment: z.boolean().optional(),
  ltcProgramEnrollment: z.boolean().optional(),
  rnSupervisorId: z.string().optional(),
  lastSupervisoryVisit: z.date().optional(),
  nextSupervisoryVisitDue: z.date().optional(),
  supervisoryVisitFrequency: z.number().positive().optional(),
  hurricaneZone: z.string().optional(),
  biomedicalWasteExposure: z.array(z.any()).optional(),
  ahcaLicenseVerification: z.date().optional(),
  backgroundScreeningStatus: z.enum(['COMPLIANT', 'PENDING', 'NON_COMPLIANT']).optional(),
});

const stateSpecificClientDataSchema = z.object({
  state: z.enum(['TX', 'FL']),
  texas: texasClientDataSchema.optional(),
  florida: floridaClientDataSchema.optional(),
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

export class StateSpecificClientValidator {
  /**
   * Validate state-specific client data
   */
  validateStateSpecific(data: StateSpecificClientData): ValidationResult {
    try {
      stateSpecificClientDataSchema.parse(data);
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.issues.map((e) => ({
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
   * Validate Texas-specific client data
   */
  validateTexasClient(data: TexasClientData): ValidationResult {
    try {
      texasClientDataSchema.parse(data);
      
      // Additional TX business rules
      const additionalErrors: Array<{ path: string; message: string }> = [];
      
      // Rule: Emergency plan required for STAR+PLUS waiver
      if (data.medicaidProgram === 'STAR_PLUS' && !data.emergencyPlanOnFile) {
        additionalErrors.push({
          path: 'emergencyPlanOnFile',
          message: 'Emergency plan required for STAR+PLUS program',
        });
      }
      
      // Rule: EVV entity ID required when EVV is mandatory
      if (data.evvRequirements?.evvMandatory && !data.evvEntityId) {
        additionalErrors.push({
          path: 'evvEntityId',
          message: 'EVV entity ID required when EVV is mandatory',
        });
      }
      
      // Rule: Check for expired authorizations
      const now = new Date();
      const hasExpiredAuth = data.authorizedServices.some(
        (svc) => svc.status === 'ACTIVE' && svc.expirationDate < now
      );
      if (hasExpiredAuth) {
        additionalErrors.push({
          path: 'authorizedServices',
          message: 'One or more authorizations have expired and need renewal',
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
          errors: error.issues.map((e) => ({
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
   * Validate Florida-specific client data
   */
  validateFloridaClient(data: FloridaClientData): ValidationResult {
    try {
      floridaClientDataSchema.parse(data);
      
      // Additional FL business rules
      const additionalErrors: Array<{ path: string; message: string }> = [];
      
      // Rule: RN supervisor required for services requiring supervision (59A-8.0095)
      const requiresRNSupervision = data.authorizedServices.some(
        (svc) => svc.status === 'ACTIVE' && svc.requiresRNSupervision
      );
      if (requiresRNSupervision && !data.rnSupervisorId) {
        additionalErrors.push({
          path: 'rnSupervisorId',
          message: 'RN supervisor required for services requiring supervision (59A-8.0095)',
        });
      }
      
      // Rule: Supervisory visit overdue check
      if (data.nextSupervisoryVisitDue && data.nextSupervisoryVisitDue < new Date()) {
        additionalErrors.push({
          path: 'nextSupervisoryVisitDue',
          message: 'Supervisory visit is overdue',
        });
      }
      
      // Rule: Plan of care review required (60/90-day intervals)
      if (data.nextReviewDue && data.nextReviewDue < new Date()) {
        additionalErrors.push({
          path: 'nextReviewDue',
          message: 'Plan of care review is overdue (Florida Statute 400.487)',
        });
      }
      
      // Rule: EVV aggregator required for SMMC or LTC programs
      if ((data.smmcProgramEnrollment || data.ltcProgramEnrollment) && !data.evvAggregatorId) {
        additionalErrors.push({
          path: 'evvAggregatorId',
          message: 'EVV aggregator ID required for SMMC/LTC programs',
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
          errors: error.issues.map((e) => ({
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
   * Validate service authorization eligibility for EVV requirements
   */
  validateEVVEligibility(
    stateData: StateSpecificClientData,
    serviceCode: string
  ): { eligible: boolean; reasons: string[] } {
    const reasons: string[] = [];
    
    if (stateData.state === 'TX' && stateData.texas) {
      const tx = stateData.texas;
      
      // Check if service requires EVV
      const service = tx.authorizedServices.find((s) => s.serviceCode === serviceCode);
      if (!service) {
        return { eligible: false, reasons: ['Service not found in authorized services'] };
      }
      
      if (!service.requiresEVV) {
        return { eligible: true, reasons: ['EVV not required for this service'] };
      }
      
      // Check EVV requirements
      if (!tx.evvEntityId) {
        reasons.push('EVV entity ID not configured');
      }
      
      if (tx.evvRequirements?.aggregatorSubmissionRequired && !tx.evvRequirements.tmhpIntegration) {
        reasons.push('TMHP integration not configured for EVV aggregator submission');
      }
      
      // Check authorization status and units
      if (service.status !== 'ACTIVE') {
        reasons.push(`Service authorization status is ${service.status}`);
      }
      
      if (service.usedUnits >= service.authorizedUnits) {
        reasons.push('Authorized units exhausted');
      }
      
      if (service.expirationDate < new Date()) {
        reasons.push('Service authorization expired');
      }
      
    } else if (stateData.state === 'FL' && stateData.florida) {
      const fl = stateData.florida;
      
      // Check if service requires EVV
      const service = fl.authorizedServices.find((s) => s.serviceCode === serviceCode);
      if (!service) {
        return { eligible: false, reasons: ['Service not found in authorized services'] };
      }
      
      if (!service.requiresEVV) {
        return { eligible: true, reasons: ['EVV not required for this service'] };
      }
      
      // Check EVV aggregator configuration
      if (!fl.evvAggregatorId) {
        reasons.push('EVV aggregator not configured');
      }
      
      if (!fl.evvSystemType) {
        reasons.push('EVV system type not specified');
      }
      
      // Check RN supervision if required
      if (service.requiresRNSupervision && !fl.rnSupervisorId) {
        reasons.push('RN supervisor not assigned (required per 59A-8.0095)');
      }
      
      // Check authorization status and units
      if (service.status !== 'ACTIVE') {
        reasons.push(`Service authorization status is ${service.status}`);
      }
      
      if (service.usedUnits >= service.authorizedUnits) {
        reasons.push('Authorized units exhausted');
      }
      
      if (service.expirationDate < new Date()) {
        reasons.push('Service authorization expired');
      }
    }
    
    return {
      eligible: reasons.length === 0,
      reasons: reasons.length === 0 ? ['Eligible for EVV service delivery'] : reasons,
    };
  }

  /**
   * Check compliance status for state requirements
   */
  calculateComplianceStatus(stateData: StateSpecificClientData): {
    compliant: boolean;
    issues: Array<{ severity: 'ERROR' | 'WARNING'; message: string }>;
  } {
    const issues: Array<{ severity: 'ERROR' | 'WARNING'; message: string }> = [];
    
    if (stateData.state === 'TX' && stateData.texas) {
      const tx = stateData.texas;
      
      // Critical issues (ERROR)
      if (!tx.emergencyPlanOnFile) {
        issues.push({
          severity: 'ERROR',
          message: 'Emergency plan not on file (26 TAC §558 requirement)',
        });
      }
      
      // Check for expired authorizations
      const expiredAuths = tx.authorizedServices.filter(
        (s) => s.status === 'ACTIVE' && s.expirationDate < new Date()
      );
      if (expiredAuths.length > 0) {
        issues.push({
          severity: 'ERROR',
          message: `${expiredAuths.length} service authorization(s) expired`,
        });
      }
      
      // Warnings
      if (tx.emergencyPlanDate) {
        const daysSincePlan = Math.floor(
          (Date.now() - tx.emergencyPlanDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSincePlan > 365) {
          issues.push({
            severity: 'WARNING',
            message: 'Emergency plan over 1 year old, review recommended',
          });
        }
      }
      
      // Check for authorizations expiring soon (within 30 days)
      const expiringSoon = tx.authorizedServices.filter((s) => {
        if (s.status !== 'ACTIVE') return false;
        const daysUntilExpiration = Math.floor(
          (s.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilExpiration > 0 && daysUntilExpiration <= 30;
      });
      if (expiringSoon.length > 0) {
        issues.push({
          severity: 'WARNING',
          message: `${expiringSoon.length} service authorization(s) expiring within 30 days`,
        });
      }
      
    } else if (stateData.state === 'FL' && stateData.florida) {
      const fl = stateData.florida;
      
      // Critical issues (ERROR)
      if (fl.backgroundScreeningStatus === 'NON_COMPLIANT') {
        issues.push({
          severity: 'ERROR',
          message: 'Background screening non-compliant',
        });
      }
      
      // Check for overdue plan of care review
      if (fl.nextReviewDue && fl.nextReviewDue < new Date()) {
        issues.push({
          severity: 'ERROR',
          message: 'Plan of care review overdue (Florida Statute 400.487)',
        });
      }
      
      // Check for overdue supervisory visit
      if (fl.nextSupervisoryVisitDue && fl.nextSupervisoryVisitDue < new Date()) {
        issues.push({
          severity: 'ERROR',
          message: 'RN supervisory visit overdue (59A-8.0095)',
        });
      }
      
      // Check for expired authorizations
      const expiredAuths = fl.authorizedServices.filter(
        (s) => s.status === 'ACTIVE' && s.expirationDate < new Date()
      );
      if (expiredAuths.length > 0) {
        issues.push({
          severity: 'ERROR',
          message: `${expiredAuths.length} service authorization(s) expired`,
        });
      }
      
      // Warnings
      if (fl.backgroundScreeningStatus === 'PENDING') {
        issues.push({
          severity: 'WARNING',
          message: 'Background screening pending',
        });
      }
      
      // Check AHCA license verification (should be within last 12 months)
      if (fl.ahcaLicenseVerification) {
        const daysSinceVerification = Math.floor(
          (Date.now() - fl.ahcaLicenseVerification.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceVerification > 365) {
          issues.push({
            severity: 'WARNING',
            message: 'AHCA license verification over 1 year old',
          });
        }
      }
    }
    
    const hasErrors = issues.some((issue) => issue.severity === 'ERROR');
    
    return {
      compliant: !hasErrors,
      issues,
    };
  }
}

interface ValidationResult {
  success: boolean;
  errors?: Array<{ path: string; message: string }>;
}
