/**
 * State-Specific Compliance Validator
 * 
 * Validates care plans against TX and FL regulatory requirements
 */

import {
  CarePlan,
  CreateCarePlanInput,
  UpdateCarePlanInput,
} from '../types/care-plan';
import {
  StateJurisdiction,
  StateComplianceValidation,
  StateComplianceError,
  StateComplianceWarning,
  StateSpecificCarePlanData,
  TexasCarePlanRequirements,
  FloridaCarePlanRequirements,
} from '../types/state-specific';

export class StateComplianceValidator {
  /**
   * Validate care plan for state-specific compliance
   */
  static validateCarePlanCompliance(
    carePlan: CarePlan & Partial<StateSpecificCarePlanData>,
    stateJurisdiction: StateJurisdiction
  ): StateComplianceValidation {
    const errors: StateComplianceError[] = [];
    const warnings: StateComplianceWarning[] = [];

    if (stateJurisdiction === 'TX') {
      this.validateTexasRequirements(carePlan, errors, warnings);
    } else if (stateJurisdiction === 'FL') {
      this.validateFloridaRequirements(carePlan, errors, warnings);
    }

    return {
      isCompliant: errors.filter((e) => e.severity === 'BLOCKING').length === 0,
      errors,
      warnings,
      stateJurisdiction,
    };
  }

  /**
   * Texas 26 TAC §558 requirements
   */
  private static validateTexasRequirements(
    carePlan: CarePlan & Partial<StateSpecificCarePlanData>,
    errors: StateComplianceError[],
    warnings: StateComplianceWarning[]
  ): void {
    // Physician order required (26 TAC §558.287)
    if (!carePlan.orderingProviderName || !carePlan.orderDate) {
      errors.push({
        code: 'TX_MISSING_PHYSICIAN_ORDER',
        field: 'orderingProviderName',
        message: 'Plan of care must be ordered by physician or authorized professional',
        requirement: '26 TAC §558.287',
        severity: 'BLOCKING',
      });
    }

    // Physician license/NPI required
    if (carePlan.orderingProviderName && !carePlan.orderingProviderLicense) {
      errors.push({
        code: 'TX_MISSING_PROVIDER_LICENSE',
        field: 'orderingProviderLicense',
        message: 'Ordering provider license number is required',
        requirement: '26 TAC §558.287',
        severity: 'BLOCKING',
      });
    }

    // Verbal orders must be authenticated
    if (carePlan.orderSource === 'VERBAL' && !carePlan.verbalOrderAuthenticatedAt) {
      errors.push({
        code: 'TX_VERBAL_ORDER_NOT_AUTHENTICATED',
        field: 'verbalOrderAuthenticatedAt',
        message: 'Verbal orders must be authenticated by physician within required timeframe',
        requirement: '26 TAC §558.287',
        severity: 'CRITICAL',
      });
    }

    // Service authorization required for Medicaid
    if (carePlan.medicaidProgram && !carePlan.serviceAuthorizationForm) {
      errors.push({
        code: 'TX_MISSING_SERVICE_AUTHORIZATION',
        field: 'serviceAuthorizationForm',
        message: 'Service authorization (HHSC Form 4100 series) required for Medicaid services',
        requirement: 'HHSC Medicaid Provider Agreement',
        severity: 'BLOCKING',
      });
    }

    // Review interval (typically 60 days)
    const reviewIntervalDays = carePlan.planReviewIntervalDays || 60;
    if (reviewIntervalDays > 60) {
      warnings.push({
        code: 'TX_REVIEW_INTERVAL_EXCEEDS_STANDARD',
        field: 'planReviewIntervalDays',
        message: 'Plan review interval exceeds standard 60-day requirement',
        requirement: '26 TAC §558.287',
        severity: 'WARNING',
      });
    }

    // Next review due date must be set
    if (carePlan.status === 'ACTIVE' && !carePlan.nextReviewDue) {
      warnings.push({
        code: 'TX_MISSING_NEXT_REVIEW_DATE',
        field: 'nextReviewDue',
        message: 'Next review due date should be established for active plans',
        requirement: '26 TAC §558.287',
        severity: 'WARNING',
      });
    }

    // Emergency/disaster plan required (26 TAC §558 Emergency Preparedness)
    if (!carePlan.disasterPlanOnFile) {
      warnings.push({
        code: 'TX_MISSING_DISASTER_PLAN',
        field: 'disasterPlanOnFile',
        message: 'Emergency preparedness plan should be documented',
        requirement: '26 TAC §558 Emergency Preparedness',
        severity: 'WARNING',
      });
    }

    // CDS model validation
    if (carePlan.isCdsModel) {
      if (!carePlan.employerAuthorityId) {
        errors.push({
          code: 'TX_CDS_MISSING_EMPLOYER_AUTHORITY',
          field: 'employerAuthorityId',
          message: 'Consumer Directed Services requires documented employer authority',
          requirement: 'HHSC CDS Program Requirements',
          severity: 'BLOCKING',
        });
      }

      if (!carePlan.financialManagementServiceId) {
        errors.push({
          code: 'TX_CDS_MISSING_FMS',
          field: 'financialManagementServiceId',
          message: 'Consumer Directed Services requires Financial Management Service provider',
          requirement: 'HHSC CDS Program Requirements',
          severity: 'BLOCKING',
        });
      }
    }

    // Goals must exist (basic care plan requirement)
    if (!carePlan.goals || carePlan.goals.length === 0) {
      errors.push({
        code: 'TX_MISSING_GOALS',
        field: 'goals',
        message: 'Care plan must include measurable goals',
        requirement: '26 TAC §558.287',
        severity: 'BLOCKING',
      });
    }

    // Interventions must exist
    if (!carePlan.interventions || carePlan.interventions.length === 0) {
      errors.push({
        code: 'TX_MISSING_INTERVENTIONS',
        field: 'interventions',
        message: 'Care plan must include specific interventions',
        requirement: '26 TAC §558.287',
        severity: 'BLOCKING',
      });
    }
  }

  /**
   * Florida AHCA Chapter 59A-8 requirements
   */
  private static validateFloridaRequirements(
    carePlan: CarePlan & Partial<StateSpecificCarePlanData>,
    errors: StateComplianceError[],
    warnings: StateComplianceWarning[]
  ): void {
    // Physician orders required (Florida Statute 400.487)
    if (!carePlan.orderingProviderName || !carePlan.orderDate) {
      errors.push({
        code: 'FL_MISSING_PHYSICIAN_ORDERS',
        field: 'orderingProviderName',
        message: 'Physician orders required for home health services',
        requirement: 'Florida Statute 400.487',
        severity: 'BLOCKING',
      });
    }

    // RN supervision required for certain service types (59A-8.0095)
    const requiresRnSupervision = ['SKILLED_NURSING', 'THERAPY'].includes(carePlan.planType);
    if (requiresRnSupervision && !carePlan.rnSupervisorId) {
      errors.push({
        code: 'FL_MISSING_RN_SUPERVISOR',
        field: 'rnSupervisorId',
        message: 'RN supervisor required for skilled nursing and therapy services',
        requirement: 'AHCA 59A-8.0095',
        severity: 'BLOCKING',
      });
    }

    // RN supervisory visits (typically every 14-30 days depending on service)
    if (requiresRnSupervision && carePlan.status === 'ACTIVE') {
      if (!carePlan.lastSupervisoryVisitDate) {
        warnings.push({
          code: 'FL_MISSING_SUPERVISORY_VISIT_DATE',
          field: 'lastSupervisoryVisitDate',
          message: 'RN supervisory visit date should be documented for active plans',
          requirement: 'AHCA 59A-8.0095',
          severity: 'WARNING',
        });
      }

      if (!carePlan.nextSupervisoryVisitDue) {
        warnings.push({
          code: 'FL_MISSING_NEXT_SUPERVISORY_VISIT',
          field: 'nextSupervisoryVisitDue',
          message: 'Next RN supervisory visit due date should be established',
          requirement: 'AHCA 59A-8.0095',
          severity: 'WARNING',
        });
      }

      // Check if supervisory visit is overdue
      if (
        carePlan.nextSupervisoryVisitDue &&
        new Date(carePlan.nextSupervisoryVisitDue) < new Date()
      ) {
        errors.push({
          code: 'FL_SUPERVISORY_VISIT_OVERDUE',
          field: 'nextSupervisoryVisitDue',
          message: 'RN supervisory visit is overdue',
          requirement: 'AHCA 59A-8.0095',
          severity: 'CRITICAL',
        });
      }
    }

    // RN delegation for delegated nursing tasks (59A-8.0216)
    const hasDelegatedTasks = carePlan.interventions?.some((intervention: any) =>
      ['MEDICATION_ADMINISTRATION', 'WOUND_CARE', 'VITAL_SIGNS_MONITORING'].includes(
        intervention.category
      )
    );

    if (hasDelegatedTasks && !carePlan.rnDelegationId) {
      errors.push({
        code: 'FL_MISSING_RN_DELEGATION',
        field: 'rnDelegationId',
        message:
          'RN delegation required for nursing tasks performed by non-licensed personnel',
        requirement: 'AHCA 59A-8.0216',
        severity: 'BLOCKING',
      });
    }

    // Plan review interval (59A-8.0215 - typically 60 days)
    const reviewIntervalDays = carePlan.planReviewIntervalDays || 60;
    if (reviewIntervalDays > 60) {
      warnings.push({
        code: 'FL_REVIEW_INTERVAL_EXCEEDS_STANDARD',
        field: 'planReviewIntervalDays',
        message: 'Plan review interval exceeds standard 60-day requirement',
        requirement: 'AHCA 59A-8.0215',
        severity: 'WARNING',
      });
    }

    // Comprehensive assessment required
    if (!carePlan.assessmentSummary || carePlan.assessmentSummary.trim().length < 50) {
      errors.push({
        code: 'FL_INCOMPLETE_ASSESSMENT',
        field: 'assessmentSummary',
        message: 'Comprehensive assessment summary required',
        requirement: 'AHCA 59A-8.0215',
        severity: 'BLOCKING',
      });
    }

    // Goals and interventions
    if (!carePlan.goals || carePlan.goals.length === 0) {
      errors.push({
        code: 'FL_MISSING_GOALS',
        field: 'goals',
        message: 'Care plan must include specific, measurable goals',
        requirement: 'AHCA 59A-8.0215',
        severity: 'BLOCKING',
      });
    }

    if (!carePlan.interventions || carePlan.interventions.length === 0) {
      errors.push({
        code: 'FL_MISSING_INTERVENTIONS',
        field: 'interventions',
        message: 'Care plan must include planned interventions',
        requirement: 'AHCA 59A-8.0215',
        severity: 'BLOCKING',
      });
    }

    // AHCA form documentation
    if (!carePlan.planOfCareFormNumber) {
      warnings.push({
        code: 'FL_MISSING_FORM_NUMBER',
        field: 'planOfCareFormNumber',
        message: 'AHCA Form 484 or equivalent plan of care form number should be documented',
        requirement: 'AHCA 59A-8.0215',
        severity: 'WARNING',
      });
    }

    // Infection control
    if (!carePlan.infectionControlPlanReviewed) {
      warnings.push({
        code: 'FL_INFECTION_CONTROL_NOT_REVIEWED',
        field: 'infectionControlPlanReviewed',
        message: 'Infection control plan review should be documented',
        requirement: 'AHCA 59A-8',
        severity: 'INFO',
      });
    }
  }

  /**
   * Validate care plan before activation
   */
  static validateActivation(
    carePlan: CarePlan & Partial<StateSpecificCarePlanData>,
    stateJurisdiction?: StateJurisdiction
  ): StateComplianceValidation {
    const errors: StateComplianceError[] = [];
    const warnings: StateComplianceWarning[] = [];
    const jurisdiction = stateJurisdiction || (carePlan.stateJurisdiction as StateJurisdiction) || 'OTHER';

    // Run state-specific validation
    const stateValidation = this.validateCarePlanCompliance(carePlan, jurisdiction);
    errors.push(...stateValidation.errors);
    warnings.push(...stateValidation.warnings);

    // Additional activation checks
    if (!carePlan.coordinatorId) {
      errors.push({
        code: 'MISSING_COORDINATOR',
        field: 'coordinatorId',
        message: 'Care coordinator must be assigned before activation',
        requirement: 'General Requirement',
        severity: 'BLOCKING',
      });
    }

    if (!carePlan.effectiveDate) {
      errors.push({
        code: 'MISSING_EFFECTIVE_DATE',
        field: 'effectiveDate',
        message: 'Effective date must be set before activation',
        requirement: 'General Requirement',
        severity: 'BLOCKING',
      });
    }

    if (carePlan.effectiveDate && carePlan.effectiveDate > new Date()) {
      errors.push({
        code: 'FUTURE_EFFECTIVE_DATE',
        field: 'effectiveDate',
        message: 'Cannot activate plan with future effective date',
        requirement: 'General Requirement',
        severity: 'BLOCKING',
      });
    }

    return {
      isCompliant: errors.filter((e) => e.severity === 'BLOCKING').length === 0,
      errors,
      warnings,
      stateJurisdiction: jurisdiction,
    };
  }

  /**
   * Get state-specific requirements
   */
  static getTexasRequirements(): TexasCarePlanRequirements {
    return {
      requiresPhysicianOrder: true,
      requiresRnAssessment: true,
      requiresEmergencyPlan: true,
      maxDaysBetweenReviews: 60,
      requiredForms: ['Form 485', 'HHSC Form 1746', 'HHSC Form 8606'],
      requiresServiceAuthorization: true,
      authorizationForm: 'HHSC Form 4100 series',
      isCdsModel: false,
    };
  }

  static getFloridaRequirements(): FloridaCarePlanRequirements {
    return {
      requiresPhysicianOrders: true,
      requiresComprehensiveAssessment: true,
      requiresRnSupervision: true,
      maxDaysBetweenReviews: 60,
      maxDaysBetweenSupervisoryVisits: 30,
      requiredForms: ['AHCA Form 484', 'AHCA Form 1823'],
      requiresRnDelegation: true,
      requiresCompetencyEvaluation: true,
      requiresOngoingSupervision: true,
      minimumStaffingRatios: {
        RN: 1,
        LPN: 0,
        HHA: 2,
      },
      requiredTraining: [
        'OSHA Bloodborne Pathogens',
        'TB Screening',
        'HIV/AIDS (4 hours)',
        'Infection Control',
        'Client Rights',
      ],
    };
  }
}
