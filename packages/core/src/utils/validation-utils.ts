import { NotFoundError, ValidationError } from '../types/base.js';

/**
 * Validation Utilities
 * 
 * Consolidates duplicate validation patterns across the codebase.
 * Reduces ~300+ lines of repetitive validation logic.
 * 
 * SOLID Principles:
 * - Single Responsibility: Each function has one validation purpose
 * - Open/Closed: Extensible via ValidationBuilder, closed to modification
 * - Dependency Inversion: Depends on error interfaces, not implementations
 */

/**
 * Asserts entity exists from async repository call
 * 
 * Eliminates the repeated pattern:
 * ```typescript
 * const entity = await repo.findById(id);
 * if (!entity) throw new NotFoundError(...);
 * ```
 * 
 * @example
 * const caregiver = await assertExists(
 *   this.repository.findById(id),
 *   'Caregiver',
 *   { id }
 * );
 * 
 * @param promise - Promise that may return null/undefined
 * @param entityName - Human-readable entity name for error message
 * @param context - Additional context for error (e.g., { id, filters })
 * @returns The entity if found
 * @throws NotFoundError if entity is null/undefined
 */
export async function assertExists<T>(
  promise: Promise<T | null | undefined>,
  entityName: string,
  context?: Record<string, unknown>
): Promise<T> {
  const result = await promise;
  if (result == null) {
    throw new NotFoundError(`${entityName} not found`, context);
  }
  return result;
}

/**
 * Asserts entity exists (synchronous version)
 * 
 * @example
 * const visit = requireExists(visitData, 'Visit', { visitId });
 * 
 * @param value - Value that may be null/undefined
 * @param entityName - Human-readable entity name for error message
 * @param context - Additional context for error
 * @returns The value if not null/undefined
 * @throws NotFoundError if value is null/undefined
 */
export function requireExists<T>(
  value: T | null | undefined,
  entityName: string,
  context?: Record<string, unknown>
): T {
  if (value == null) {
    throw new NotFoundError(`${entityName} not found`, context);
  }
  return value;
}

/**
 * Validates required field is present and non-empty
 * 
 * @example
 * const email = requireField(input.email, 'email', 'CreateUserRequest');
 * 
 * @param value - Value to validate
 * @param fieldName - Field name for error message
 * @param parentEntity - Optional parent entity name for context
 * @returns The value if valid
 * @throws ValidationError if value is null/undefined/empty string
 */
export function requireField<T>(
  value: T | null | undefined,
  fieldName: string,
  parentEntity?: string
): T {
  if (value == null || value === '') {
    throw new ValidationError(
      `${fieldName} is required${parentEntity ? ` for ${parentEntity}` : ''}`,
      { field: fieldName, value }
    );
  }
  return value;
}

/**
 * Fluent validation builder for complex validation scenarios
 * 
 * Eliminates patterns like:
 * ```typescript
 * if (!input.field1) errors.push('field1 is required');
 * if (!input.field2) errors.push('field2 is required');
 * // ... repeated 50+ times
 * ```
 * 
 * @example
 * new ValidationBuilder()
 *   .requiredFields(input, ['organizationId', 'branchId', 'clientId'])
 *   .positive('units', input.units)
 *   .oneOf('status', input.status, ['ACTIVE', 'PENDING', 'INACTIVE'])
 *   .validate('Invalid input data');
 */
export class ValidationBuilder {
  private errors: string[] = [];
  private warnings: string[] = [];

  /**
   * Validate required field
   * 
   * @param field - Field name
   * @param value - Field value
   * @param message - Optional custom error message
   * @returns this for chaining
   */
  required(field: string, value: unknown, message?: string): this {
    if (value == null || value === '') {
      this.errors.push(message || `${field} is required`);
    }
    return this;
  }

  /**
   * Validate multiple required fields at once
   * 
   * @param obj - Object containing fields
   * @param fields - Array of field names to validate
   * @returns this for chaining
   */
  requiredFields(obj: Record<string, unknown>, fields: string[]): this {
    fields.forEach((field) => {
      this.required(field, obj[field]);
    });
    return this;
  }

  /**
   * Validate minimum length for strings or arrays
   * 
   * @param field - Field name
   * @param value - String or array value
   * @param min - Minimum length
   * @returns this for chaining
   */
  minLength(field: string, value: string | unknown[] | null | undefined, min: number): this {
    if (value && value.length < min) {
      this.errors.push(`${field} must have at least ${min} ${typeof value === 'string' ? 'characters' : 'items'}`);
    }
    return this;
  }

  /**
   * Validate maximum length for strings or arrays
   * 
   * @param field - Field name
   * @param value - String or array value
   * @param max - Maximum length
   * @returns this for chaining
   */
  maxLength(field: string, value: string | unknown[] | null | undefined, max: number): this {
    if (value && value.length > max) {
      this.errors.push(`${field} must have at most ${max} ${typeof value === 'string' ? 'characters' : 'items'}`);
    }
    return this;
  }

  /**
   * Validate value is one of allowed options
   * 
   * @param field - Field name
   * @param value - Value to check
   * @param allowed - Array of allowed values
   * @returns this for chaining
   */
  oneOf<T>(field: string, value: T | null | undefined, allowed: T[]): this {
    if (value != null && !allowed.includes(value)) {
      this.errors.push(`${field} must be one of: ${allowed.join(', ')}`);
    }
    return this;
  }

  /**
   * Validate number is positive (> 0)
   * 
   * @param field - Field name
   * @param value - Number value
   * @returns this for chaining
   */
  positive(field: string, value: number | null | undefined): this {
    if (value != null && value <= 0) {
      this.errors.push(`${field} must be greater than zero`);
    }
    return this;
  }

  /**
   * Validate number is non-negative (>= 0)
   * 
   * @param field - Field name
   * @param value - Number value
   * @returns this for chaining
   */
  nonNegative(field: string, value: number | null | undefined): this {
    if (value != null && value < 0) {
      this.errors.push(`${field} cannot be negative`);
    }
    return this;
  }

  /**
   * Validate number is within range (inclusive)
   * 
   * @param field - Field name
   * @param value - Number value
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (inclusive)
   * @returns this for chaining
   */
  range(field: string, value: number | null | undefined, min: number, max: number): this {
    if (value != null && (value < min || value > max)) {
      this.errors.push(`${field} must be between ${min} and ${max}`);
    }
    return this;
  }

  /**
   * Validate date is not in the future
   * 
   * @param field - Field name
   * @param value - Date value
   * @returns this for chaining
   */
  notFutureDate(field: string, value: Date | string | null | undefined): this {
    if (value) {
      const date = typeof value === 'string' ? new Date(value) : value;
      if (date > new Date()) {
        this.errors.push(`${field} cannot be in the future`);
      }
    }
    return this;
  }

  /**
   * Validate date is not in the past
   * 
   * @param field - Field name
   * @param value - Date value
   * @returns this for chaining
   */
  notPastDate(field: string, value: Date | string | null | undefined): this {
    if (value) {
      const date = typeof value === 'string' ? new Date(value) : value;
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Start of today
      if (date < now) {
        this.errors.push(`${field} cannot be in the past`);
      }
    }
    return this;
  }

  /**
   * Custom validation with boolean condition
   * 
   * @param condition - If false, adds error/warning
   * @param message - Error/warning message
   * @param isWarning - If true, adds as warning instead of error
   * @returns this for chaining
   */
  custom(condition: boolean, message: string, isWarning = false): this {
    if (!condition) {
      if (isWarning) {
        this.warnings.push(message);
      } else {
        this.errors.push(message);
      }
    }
    return this;
  }

  /**
   * Validate and throw if errors exist
   * 
   * @param errorMessage - Main error message
   * @throws ValidationError if any validation errors accumulated
   */
  validate(errorMessage = 'Validation failed'): void {
    if (this.errors.length > 0) {
      throw new ValidationError(errorMessage, {
        errors: this.errors,
        warnings: this.warnings.length > 0 ? this.warnings : undefined,
      });
    }
  }

  /**
   * Get validation result without throwing
   * 
   * @returns Validation result with errors and warnings
   */
  getResult(): { valid: boolean; errors: string[]; warnings: string[] } {
    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }
}
