/**
 * Re-export validation helpers from core package to avoid duplication
 * @deprecated Import directly from '@care-commons/core/browser' instead
 */
import { validationHelpers } from '@care-commons/core/browser';

// Maintain backward compatibility with existing imports
export const {
  isEmail,
  isPhone,
  isZipCode,
  isSSN,
  isEmpty,
  isValidDate,
  minLength,
  maxLength,
} = validationHelpers;
