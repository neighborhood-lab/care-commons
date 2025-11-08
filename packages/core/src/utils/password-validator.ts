import zxcvbn from 'zxcvbn';
import bcrypt from 'bcrypt';

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
    if (!/[0-9]/.test(password)) {
      feedback.push('Password must contain at least one number');
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      feedback.push('Password must contain at least one special character');
    }

    // Check against common passwords using zxcvbn
    const result = zxcvbn(password, userInputs);

    if (result.score < this.MIN_SCORE) {
      feedback.push(
        `Password is too weak (strength: ${result.score}/4). ${
          result.feedback.warning || result.feedback.suggestions.join('. ')
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
    return bcrypt.hash(password, 12); // Cost factor 12
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
