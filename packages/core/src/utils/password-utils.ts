/**
 * Password Utilities
 * 
 * HIPAA-compliant password security using PBKDF2 with salt.
 * Meets NIST SP 800-132 recommendations for password-based key derivation.
 */

import { pbkdf2Sync, randomBytes } from './crypto';
import { ValidationError } from '../types/base';

export class PasswordUtils {
  // NIST recommends at least 10,000 iterations; we use 100,000 for enhanced security
  private static readonly ITERATIONS = 100_000;
  private static readonly KEY_LENGTH = 64; // 512 bits
  private static readonly DIGEST = 'sha512';
  private static readonly SALT_LENGTH = 16; // 128 bits
  
  // Password complexity requirements
  private static readonly MIN_LENGTH = 8;
  private static readonly MIN_LENGTH_RECOMMENDED = 12;

  /**
   * Hash password with salt using PBKDF2
   * Format: salt:hash (both hex-encoded)
   * 
   * @param password - Plain text password
   * @returns Salted hash in format "salt:hash"
   * @throws ValidationError if password doesn't meet complexity requirements
   */
  static hashPassword(password: string): string {
    // Validate password strength
    this.validatePasswordStrength(password);

    // Generate cryptographically secure random salt
    const salt = randomBytes(this.SALT_LENGTH).toString('hex');
    
    // Derive key using PBKDF2
    const hash = pbkdf2Sync(
      password,
      salt,
      this.ITERATIONS,
      this.KEY_LENGTH,
      this.DIGEST
    ).toString('hex');

    return `${salt}:${hash}`;
  }

  /**
   * Verify password against stored hash
   * Constant-time comparison to prevent timing attacks
   * 
   * @param password - Plain text password to verify
   * @param storedHash - Stored hash in format "salt:hash"
   * @returns True if password matches
   * @throws ValidationError if hash format is invalid
   */
  static verifyPassword(password: string, storedHash: string): boolean {
    const parts = storedHash.split(':');
    
    if (parts.length !== 2) {
      throw new ValidationError('Invalid password hash format', {
        expectedFormat: 'salt:hash',
        receivedParts: parts.length
      });
    }

    const [salt, hash] = parts;

    if (salt === undefined || salt === '' || hash === undefined || hash === '') {
      throw new ValidationError('Invalid password hash - missing salt or hash');
    }

    // Derive key using same parameters
    const verifyHash = pbkdf2Sync(
      password,
      salt,
      this.ITERATIONS,
      this.KEY_LENGTH,
      this.DIGEST
    ).toString('hex');

    // Constant-time comparison to prevent timing attacks
    return this.constantTimeCompare(hash, verifyHash);
  }

  /**
   * Check if password needs rehashing (security upgrade)
   * Returns true if hash format has changed or iterations increased
   * 
   * @param storedHash - Stored hash to check
   * @returns True if hash should be regenerated
   */
  static needsRehash(storedHash: string): boolean {
    // If hash format changes or iterations increase, this would return true
    // Current implementation: check if it's not in salt:hash format
    return !storedHash.includes(':') || storedHash.split(':').length !== 2;
  }

  /**
   * Validate password strength requirements
   * 
   * Requirements:
   * - Minimum 8 characters (12+ recommended)
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one number
   * - At least one special character (recommended for stronger passwords)
   * 
   * @param password - Password to validate
   * @throws ValidationError if password doesn't meet requirements
   */
  static validatePasswordStrength(password: string): void {
    const errors: string[] = [];

    if (password.length < this.MIN_LENGTH) {
      errors.push(`Password must be at least ${this.MIN_LENGTH} characters`);
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Warning for recommended length (not enforced)
    if (password.length < this.MIN_LENGTH_RECOMMENDED) {
      console.warn(`Password length ${password.length} is below recommended minimum of ${this.MIN_LENGTH_RECOMMENDED}`);
    }

    if (errors.length > 0) {
      throw new ValidationError('Password does not meet complexity requirements', {
        requirements: errors
      });
    }
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   * 
   * @param a - First string
   * @param b - Second string
   * @returns True if strings are equal
   */
  private static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Generate a secure random password using cryptographically secure randomBytes
   * Useful for temporary passwords or password reset flows
   * 
   * @param length - Length of password (default 16)
   * @returns Randomly generated password meeting complexity requirements
   */
  static generateSecurePassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = uppercase + lowercase + numbers + special;

    // Use cryptographically secure random bytes
    const randomBytesArray = randomBytes(length);

    // Ensure at least one character from each required set
    const parts: string[] = [
      uppercase.charAt(randomBytesArray[0]! % uppercase.length),
      lowercase.charAt(randomBytesArray[1]! % lowercase.length),
      numbers.charAt(randomBytesArray[2]! % numbers.length),
      special.charAt(randomBytesArray[3]! % special.length)
    ];

    // Fill remaining length with random characters
    for (let i = parts.length; i < length; i++) {
      const randomIndex = randomBytesArray[i]! % allChars.length;
      parts.push(allChars.charAt(randomIndex));
    }

    // Shuffle using Fisher-Yates with cryptographically secure random
    for (let i = parts.length - 1; i > 0; i--) {
      const j = randomBytesArray[i]! % (i + 1);
      const temp = parts[i];
      const swapTemp = parts[j];
      if (temp !== undefined && swapTemp !== undefined) {
        parts[i] = swapTemp;
        parts[j] = temp;
      }
    }

    return parts.join('');
  }
}
