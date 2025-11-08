/**
 * Quality Assurance & Audits - Validators
 *
 * Input validation for audit management operations
 */

import type {
  CreateAuditInput,
  UpdateAuditInput,
  CreateAuditFindingInput,
  CreateCorrectiveActionInput,
  UpdateCorrectiveActionProgressInput,
  CreateAuditTemplateInput,
  AuditType,
  AuditScope,
  AuditPriority,
  FindingCategory,
  FindingSeverity,
  CorrectiveActionType
} from '../types/audit.js';

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate audit type
 */
function isValidAuditType(type: string): type is AuditType {
  const validTypes: AuditType[] = [
    'COMPLIANCE',
    'QUALITY',
    'SAFETY',
    'DOCUMENTATION',
    'FINANCIAL',
    'MEDICATION',
    'INFECTION_CONTROL',
    'TRAINING',
    'INTERNAL',
    'EXTERNAL'
  ];
  return validTypes.includes(type as AuditType);
}

/**
 * Validate audit scope
 */
function isValidAuditScope(scope: string): scope is AuditScope {
  const validScopes: AuditScope[] = [
    'ORGANIZATION',
    'BRANCH',
    'DEPARTMENT',
    'CAREGIVER',
    'CLIENT',
    'PROCESS'
  ];
  return validScopes.includes(scope as AuditScope);
}

/**
 * Validate audit priority
 */
function isValidAuditPriority(priority: string): priority is AuditPriority {
  const validPriorities: AuditPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  return validPriorities.includes(priority as AuditPriority);
}

/**
 * Validate finding category
 */
function isValidFindingCategory(category: string): category is FindingCategory {
  const validCategories: FindingCategory[] = [
    'DOCUMENTATION',
    'TRAINING',
    'POLICY_PROCEDURE',
    'SAFETY',
    'QUALITY_OF_CARE',
    'INFECTION_CONTROL',
    'MEDICATION',
    'EQUIPMENT',
    'STAFFING',
    'COMMUNICATION',
    'FINANCIAL',
    'REGULATORY',
    'OTHER'
  ];
  return validCategories.includes(category as FindingCategory);
}

/**
 * Validate finding severity
 */
function isValidFindingSeverity(severity: string): severity is FindingSeverity {
  const validSeverities: FindingSeverity[] = ['CRITICAL', 'MAJOR', 'MINOR', 'OBSERVATION'];
  return validSeverities.includes(severity as FindingSeverity);
}

/**
 * Validate corrective action type
 */
function isValidCorrectiveActionType(type: string): type is CorrectiveActionType {
  const validTypes: CorrectiveActionType[] = [
    'IMMEDIATE',
    'SHORT_TERM',
    'LONG_TERM',
    'PREVENTIVE'
  ];
  return validTypes.includes(type as CorrectiveActionType);
}

/**
 * Validate create audit input
 */
export function validateCreateAuditInput(input: CreateAuditInput): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!input.title || input.title.trim().length === 0) {
    errors.push('Title is required');
  } else if (input.title.length > 200) {
    errors.push('Title must be 200 characters or less');
  }

  if (!input.description || input.description.trim().length === 0) {
    errors.push('Description is required');
  } else if (input.description.length > 2000) {
    errors.push('Description must be 2000 characters or less');
  }

  if (!input.auditType) {
    errors.push('Audit type is required');
  } else if (!isValidAuditType(input.auditType)) {
    errors.push('Invalid audit type');
  }

  if (!input.priority) {
    errors.push('Priority is required');
  } else if (!isValidAuditPriority(input.priority)) {
    errors.push('Invalid priority');
  }

  if (!input.scope) {
    errors.push('Scope is required');
  } else if (!isValidAuditScope(input.scope)) {
    errors.push('Invalid scope');
  }

  if (!input.scheduledStartDate) {
    errors.push('Scheduled start date is required');
  }

  if (!input.scheduledEndDate) {
    errors.push('Scheduled end date is required');
  }

  // Date validation
  if (input.scheduledStartDate && input.scheduledEndDate) {
    const startDate = new Date(input.scheduledStartDate);
    const endDate = new Date(input.scheduledEndDate);

    if (isNaN(startDate.getTime())) {
      errors.push('Invalid scheduled start date');
    }

    if (isNaN(endDate.getTime())) {
      errors.push('Invalid scheduled end date');
    }

    if (startDate >= endDate) {
      errors.push('Scheduled end date must be after start date');
    }
  }

  if (!input.leadAuditorId) {
    errors.push('Lead auditor is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate update audit input
 */
export function validateUpdateAuditInput(input: UpdateAuditInput): ValidationResult {
  const errors: string[] = [];

  // Optional fields validation
  if (input.title !== undefined) {
    if (typeof input.title !== 'string' || input.title.trim().length === 0) {
      errors.push('Title must be a non-empty string');
    } else if (input.title.length > 200) {
      errors.push('Title must be 200 characters or less');
    }
  }

  if (input.description !== undefined) {
    if (typeof input.description !== 'string' || input.description.trim().length === 0) {
      errors.push('Description must be a non-empty string');
    } else if (input.description.length > 2000) {
      errors.push('Description must be 2000 characters or less');
    }
  }

  if (input.scheduledStartDate && input.scheduledEndDate) {
    const startDate = new Date(input.scheduledStartDate);
    const endDate = new Date(input.scheduledEndDate);

    if (startDate >= endDate) {
      errors.push('Scheduled end date must be after start date');
    }
  }

  if (input.complianceScore !== undefined) {
    if (typeof input.complianceScore !== 'number' || input.complianceScore < 0 || input.complianceScore > 100) {
      errors.push('Compliance score must be between 0 and 100');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate create finding input
 */
export function validateCreateFindingInput(input: CreateAuditFindingInput): ValidationResult {
  const errors: string[] = [];

  if (!input.auditId) {
    errors.push('Audit ID is required');
  }

  if (!input.title || input.title.trim().length === 0) {
    errors.push('Title is required');
  } else if (input.title.length > 200) {
    errors.push('Title must be 200 characters or less');
  }

  if (!input.description || input.description.trim().length === 0) {
    errors.push('Description is required');
  } else if (input.description.length > 2000) {
    errors.push('Description must be 2000 characters or less');
  }

  if (!input.category) {
    errors.push('Category is required');
  } else if (!isValidFindingCategory(input.category)) {
    errors.push('Invalid finding category');
  }

  if (!input.severity) {
    errors.push('Severity is required');
  } else if (!isValidFindingSeverity(input.severity)) {
    errors.push('Invalid severity level');
  }

  if (!input.requiredCorrectiveAction || input.requiredCorrectiveAction.trim().length === 0) {
    errors.push('Required corrective action is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate create corrective action input
 */
export function validateCreateCorrectiveActionInput(
  input: CreateCorrectiveActionInput
): ValidationResult {
  const errors: string[] = [];

  if (!input.findingId) {
    errors.push('Finding ID is required');
  }

  if (!input.auditId) {
    errors.push('Audit ID is required');
  }

  if (!input.title || input.title.trim().length === 0) {
    errors.push('Title is required');
  } else if (input.title.length > 200) {
    errors.push('Title must be 200 characters or less');
  }

  if (!input.description || input.description.trim().length === 0) {
    errors.push('Description is required');
  } else if (input.description.length > 2000) {
    errors.push('Description must be 2000 characters or less');
  }

  if (!input.actionType) {
    errors.push('Action type is required');
  } else if (!isValidCorrectiveActionType(input.actionType)) {
    errors.push('Invalid action type');
  }

  if (!input.specificActions || input.specificActions.length === 0) {
    errors.push('At least one specific action is required');
  }

  if (!input.responsiblePersonId) {
    errors.push('Responsible person is required');
  }

  if (!input.targetCompletionDate) {
    errors.push('Target completion date is required');
  } else {
    const targetDate = new Date(input.targetCompletionDate);
    if (isNaN(targetDate.getTime())) {
      errors.push('Invalid target completion date');
    }
  }

  if (input.estimatedCost !== undefined && input.estimatedCost < 0) {
    errors.push('Estimated cost cannot be negative');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate update corrective action progress input
 */
export function validateUpdateCorrectiveActionProgressInput(
  input: UpdateCorrectiveActionProgressInput
): ValidationResult {
  const errors: string[] = [];

  if (!input.progressNote || input.progressNote.trim().length === 0) {
    errors.push('Progress note is required');
  } else if (input.progressNote.length > 1000) {
    errors.push('Progress note must be 1000 characters or less');
  }

  if (input.completionPercentage === undefined || input.completionPercentage === null) {
    errors.push('Completion percentage is required');
  } else if (
    typeof input.completionPercentage !== 'number' ||
    input.completionPercentage < 0 ||
    input.completionPercentage > 100
  ) {
    errors.push('Completion percentage must be between 0 and 100');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate create audit template input
 */
export function validateCreateAuditTemplateInput(
  input: CreateAuditTemplateInput
): ValidationResult {
  const errors: string[] = [];

  if (!input.templateName || input.templateName.trim().length === 0) {
    errors.push('Template name is required');
  } else if (input.templateName.length > 100) {
    errors.push('Template name must be 100 characters or less');
  }

  if (!input.description || input.description.trim().length === 0) {
    errors.push('Description is required');
  }

  if (!input.auditType) {
    errors.push('Audit type is required');
  } else if (!isValidAuditType(input.auditType)) {
    errors.push('Invalid audit type');
  }

  if (!input.applicableScope || input.applicableScope.length === 0) {
    errors.push('At least one applicable scope is required');
  }

  if (!input.templateVersion || input.templateVersion.trim().length === 0) {
    errors.push('Template version is required');
  }

  if (!input.effectiveDate) {
    errors.push('Effective date is required');
  }

  if (!input.checklistSections || input.checklistSections.length === 0) {
    errors.push('At least one checklist section is required');
  } else {
    // Validate checklist sections
    input.checklistSections.forEach((section, sectionIndex) => {
      if (!section.title || section.title.trim().length === 0) {
        errors.push(`Section ${sectionIndex + 1}: Title is required`);
      }

      if (!section.items || section.items.length === 0) {
        errors.push(`Section ${sectionIndex + 1}: At least one checklist item is required`);
      } else {
        // Validate checklist items
        section.items.forEach((item, itemIndex) => {
          if (!item.question || item.question.trim().length === 0) {
            errors.push(
              `Section ${sectionIndex + 1}, Item ${itemIndex + 1}: Question is required`
            );
          }

          if (!item.responseType) {
            errors.push(
              `Section ${sectionIndex + 1}, Item ${itemIndex + 1}: Response type is required`
            );
          }
        });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
