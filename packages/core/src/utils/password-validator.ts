/* eslint-disable unicorn/prefer-module */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-implied-eval */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-undef */

import zxcvbn from 'zxcvbn';

// Platform detection
const isReactNative = typeof navigator !== 'undefined' && (navigator as any).product === 'ReactNative';

type BcryptModule = typeof import('bcrypt');

// Lazy-loaded bcrypt (Node.js only)
let bcrypt: BcryptModule | null = null;

/**
 * Get bcrypt module (lazy loaded, Node.js only)
 */
function getBcrypt(): BcryptModule {
  if (bcrypt === null) {
    if (isReactNative) {
      throw new Error('bcrypt is not supported in React Native. Password hashing should be done server-side.');
    }
    // Use eval to hide from Metro bundler
    const req = eval('require');
    bcrypt = req('bcrypt') as BcryptModule;
  }
  return bcrypt;
}

export interface PasswordValidationResult {
  valid: boolean;
  score: number;
  feedback: string[];
  warning?: string;
}

export class PasswordValidator {
  private static MIN_LENGTH = 12;
  private static MIN_SCORE = 3; // 0-4 scale (zxcvbn)

  static validate(password: string, userInputs: string[] = []): PasswordValidationResult {
    const feedback: string[] = [];

    // Check minimum length
    if (password.length < this.MIN_LENGTH) {
      feedback.push(`Password must be at least ${this.MIN_LENGTH} characters long`);
    }

    // Check for required character types
    if (!/[a-z]/.test(password)) {
      feedback.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
      feedback.push('Password must contain at least one uppercase letter');
    }
    if (!/\d/.test(password)) {
      feedback.push('Password must contain at least one number');
    }
    if (!/[^\dA-Za-z]/.test(password)) {
      feedback.push('Password must contain at least one special character');
    }

    // Check against common passwords using zxcvbn
    const result = zxcvbn(password, userInputs);

    if (result.score < this.MIN_SCORE) {
      const warning = result.feedback.warning;
      feedback.push(
        `Password is too weak (strength: ${result.score}/4). ${
          (warning != null && warning !== '') 
            ? warning 
            : result.feedback.suggestions.join('. ')
        }`
      );
    }

    return {
      valid: feedback.length === 0,
      score: result.score,
      feedback,
      warning: result.feedback.warning,
    };
  }

  static async hash(password: string): Promise<string> {
    const bcryptModule = getBcrypt();
    return bcryptModule.hash(password, 12); // Cost factor 12
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    const bcryptModule = getBcrypt();
    return bcryptModule.compare(password, hash);
  }
}
