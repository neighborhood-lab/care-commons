/**
 * Compliance Report Validation Service
 *
 * Validates report data against state-specific rules
 */

import type { Pool } from 'pg';
import type {
  ComplianceReportTemplate,
  ValidationResults,
  FieldValidationResult
} from '@care-commons/core/types/compliance-reporting.js';

export class ValidationService {
  constructor(private db: Pool) {}

  /**
   * Validate report data against template rules
   */
  async validateReportData(
    records: any[],
    template: ComplianceReportTemplate
  ): Promise<ValidationResults> {
    const errors: FieldValidationResult[] = [];
    const warnings: FieldValidationResult[] = [];

    // Validate required fields
    const requiredFieldsValidation = this.validateRequiredFields(records, template.requiredFields);
    errors.push(...requiredFieldsValidation.errors);
    warnings.push(...requiredFieldsValidation.warnings);

    // Validate state-specific rules
    const stateValidation = await this.validateStateRules(records, template);
    errors.push(...stateValidation.errors);
    warnings.push(...stateValidation.warnings);

    // Validate data types and formats
    const formatValidation = this.validateDataFormats(records, template);
    errors.push(...formatValidation.errors);
    warnings.push(...formatValidation.warnings);

    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      warnings,
      summary: {
        totalErrors: errors.reduce((sum, e) => sum + e.errors.length, 0),
        totalWarnings: warnings.reduce((sum, w) => sum + w.warnings.length, 0),
        validationTimestamp: new Date()
      }
    };
  }

  /**
   * Validate required fields are present
   */
  private validateRequiredFields(
    records: any[],
    requiredFields: string[]
  ): { errors: FieldValidationResult[]; warnings: FieldValidationResult[] } {
    const errors: FieldValidationResult[] = [];
    const warnings: FieldValidationResult[] = [];

    if (records.length === 0) {
      warnings.push({
        field: 'records',
        isValid: false,
        errors: [],
        warnings: ['No records found in report']
      });
      return { errors, warnings };
    }

    const missingFields: Map<string, number> = new Map();

    for (let i = 0; i < records.length; i++) {
      const record = records[i];

      for (const field of requiredFields) {
        if (record[field] === null || record[field] === undefined || record[field] === '') {
          const count = missingFields.get(field) || 0;
          missingFields.set(field, count + 1);
        }
      }
    }

    // Report missing fields
    for (const [field, count] of Array.from(missingFields.entries())) {
      errors.push({
        field,
        isValid: false,
        errors: [`Required field '${field}' is missing in ${count} records`],
        warnings: []
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate state-specific rules
   */
  private async validateStateRules(
    records: any[],
    template: ComplianceReportTemplate
  ): Promise<{ errors: FieldValidationResult[]; warnings: FieldValidationResult[] }> {
    const errors: FieldValidationResult[] = [];
    const warnings: FieldValidationResult[] = [];

    const rules = template.validationRules as Record<string, any>;

    // State-specific validation based on report type
    switch (template.reportType) {
      case 'EVV_VISIT_LOGS':
        const evvValidation = this.validateEVVRules(records, template.stateCode, rules);
        errors.push(...evvValidation.errors);
        warnings.push(...evvValidation.warnings);
        break;

      case 'CAREGIVER_TRAINING':
        const trainingValidation = this.validateTrainingRules(records, template.stateCode, rules);
        errors.push(...trainingValidation.errors);
        warnings.push(...trainingValidation.warnings);
        break;

      // Add more report types as needed
    }

    return { errors, warnings };
  }

  /**
   * Validate EVV-specific rules
   */
  private validateEVVRules(
    records: any[],
    stateCode: string,
    rules: Record<string, any>
  ): { errors: FieldValidationResult[]; warnings: FieldValidationResult[] } {
    const errors: FieldValidationResult[] = [];
    const warnings: FieldValidationResult[] = [];

    let missingCheckIn = 0;
    let missingCheckOut = 0;
    let missingLocation = 0;
    let missingSignature = 0;

    for (const record of records) {
      if (rules.check_in_required && !record.check_in_time) {
        missingCheckIn++;
      }

      if (rules.check_out_required && !record.check_out_time) {
        missingCheckOut++;
      }

      if (rules.location_verification_required && !record.location_verified) {
        missingLocation++;
      }

      if (rules.signature_required && !record.signature_captured) {
        missingSignature++;
      }
    }

    if (missingCheckIn > 0) {
      errors.push({
        field: 'check_in_time',
        isValid: false,
        errors: [`Check-in time missing for ${missingCheckIn} visits`],
        warnings: []
      });
    }

    if (missingCheckOut > 0) {
      errors.push({
        field: 'check_out_time',
        isValid: false,
        errors: [`Check-out time missing for ${missingCheckOut} visits`],
        warnings: []
      });
    }

    if (missingLocation > 0) {
      const result: FieldValidationResult = {
        field: 'location_verified',
        isValid: false,
        errors: [],
        warnings: []
      };

      // Some states require location verification, others just recommend it
      if (['TX', 'OH', 'GA'].includes(stateCode)) {
        result.errors.push(`Location verification missing for ${missingLocation} visits (required by ${stateCode})`);
        errors.push(result);
      } else {
        result.warnings.push(`Location verification missing for ${missingLocation} visits`);
        warnings.push(result);
      }
    }

    if (missingSignature > 0 && rules.signature_required) {
      warnings.push({
        field: 'signature_captured',
        isValid: true,
        errors: [],
        warnings: [`Signature missing for ${missingSignature} visits`]
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate training rules
   */
  private validateTrainingRules(
    records: any[],
    stateCode: string,
    rules: Record<string, any>
  ): { errors: FieldValidationResult[]; warnings: FieldValidationResult[] } {
    const errors: FieldValidationResult[] = [];
    const warnings: FieldValidationResult[] = [];

    let expiredCredentials = 0;
    let missingCPR = 0;

    for (const record of records) {
      if (record.expiration_date && new Date(record.expiration_date) < new Date()) {
        expiredCredentials++;
      }

      if (rules.cpr_certification_required &&
          record.credential_type === 'CPR' &&
          record.status !== 'ACTIVE') {
        missingCPR++;
      }
    }

    if (expiredCredentials > 0) {
      warnings.push({
        field: 'expiration_date',
        isValid: true,
        errors: [],
        warnings: [`${expiredCredentials} credentials are expired`]
      });
    }

    if (missingCPR > 0) {
      errors.push({
        field: 'cpr_certification',
        isValid: false,
        errors: [`${missingCPR} caregivers missing active CPR certification`],
        warnings: []
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate data formats (dates, numbers, etc.)
   */
  private validateDataFormats(
    records: any[],
    template: ComplianceReportTemplate
  ): { errors: FieldValidationResult[]; warnings: FieldValidationResult[] } {
    const errors: FieldValidationResult[] = [];
    const warnings: FieldValidationResult[] = [];

    // Check date fields
    const dateFields = ['service_date', 'issue_date', 'expiration_date', 'scheduled_date'];
    const invalidDates: Map<string, number> = new Map();

    for (const record of records) {
      for (const field of dateFields) {
        if (record[field] && isNaN(Date.parse(record[field]))) {
          const count = invalidDates.get(field) || 0;
          invalidDates.set(field, count + 1);
        }
      }
    }

    for (const [field, count] of Array.from(invalidDates.entries())) {
      errors.push({
        field,
        isValid: false,
        errors: [`Invalid date format in ${count} records`],
        warnings: []
      });
    }

    return { errors, warnings };
  }
}
