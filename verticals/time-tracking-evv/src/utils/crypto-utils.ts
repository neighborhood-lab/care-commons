/**
 * Cryptographic utility functions for EVV integrity and security
 */

import { createHash, createHmac, randomBytes } from 'crypto';

export class CryptoUtils {
  /**
   * Generate a cryptographically secure SHA-256 hash
   */
  static generateHash(data: string | object): string {
    const input = typeof data === 'string' ? data : JSON.stringify(data);
    return createHash('sha256').update(input).digest('hex');
  }

  /**
   * Generate integrity hash for EVV records
   * Uses HMAC with a secret key for additional security
   */
  static generateIntegrityHash(data: object, secret?: string): string {
    const input = JSON.stringify(data);

    if (secret) {
      return createHmac('sha256', secret).update(input).digest('hex');
    }

    return this.generateHash(input);
  }

  /**
   * Generate a checksum for data integrity verification
   */
  static generateChecksum(data: string | object): string {
    const input = typeof data === 'string' ? data : JSON.stringify(data);
    return createHash('sha256').update(input).digest('hex');
  }

  /**
   * Verify integrity hash
   */
  static verifyIntegrityHash(data: object, expectedHash: string, secret?: string): boolean {
    const computedHash = this.generateIntegrityHash(data, secret);
    return computedHash === expectedHash;
  }

  /**
   * Generate a secure random UUID-like string
   */
  static generateSecureId(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Hash sensitive data for storage (one-way)
   */
  static hashSensitiveData(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate a signature for data
   */
  static signData(data: object, secret: string): string {
    const input = JSON.stringify(data);
    return createHmac('sha256', secret).update(input).digest('base64');
  }

  /**
   * Verify a data signature
   */
  static verifySignature(data: object, signature: string, secret: string): boolean {
    const expectedSignature = this.signData(data, secret);
    return signature === expectedSignature;
  }
}
