/**
 * Re-export validation helpers from core package to avoid duplication
 * @deprecated Import directly from '@folkcare/core/browser' instead
 */
import { validationHelpers } from '@folkcare/core/browser';

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
