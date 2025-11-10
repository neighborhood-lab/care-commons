/**
 * Cryptographic utility functions for EVV integrity and security
 * React Native implementation using expo-crypto
 */

// Dynamic imports to avoid TypeScript errors during build
// These will be available at runtime in React Native
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const require: (module: string) => any;
const Crypto = require('expo-crypto');
require('react-native-get-random-values');

export class CryptoUtils {
  /**
   * Generate a cryptographically secure SHA-256 hash
   */
  static async generateHash(data: string | object): Promise<string> {
    const input = typeof data === 'string' ? data : JSON.stringify(data);
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      input
    );
  }

  /**
   * Generate integrity hash for EVV records
   * Uses HMAC with a secret key for additional security
   * Note: Basic HMAC implementation (concatenate secret + data)
   */
  static async generateIntegrityHash(data: object, secret?: string): Promise<string> {
    const input = JSON.stringify(data);
    
    if (secret) {
      // Simple HMAC-like approach: hash(secret + data)
      const combined = secret + input;
      return await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        combined
      );
    }
    
    return this.generateHash(input);
  }

  /**
   * Generate a checksum for data integrity verification
   * Alias for generateHash for API compatibility
   */
  static async generateChecksum(data: string | object): Promise<string> {
    return this.generateHash(data);
  }

  /**
   * Verify integrity hash
   */
  static async verifyIntegrityHash(
    data: object,
    expectedHash: string,
    secret?: string
  ): Promise<boolean> {
    const computedHash = await this.generateIntegrityHash(data, secret);
    return computedHash === expectedHash;
  }

  /**
   * Generate a secure random UUID-like string
   */
  static generateSecureId(): string {
    const bytes = new Uint8Array(16);
    // react-native-get-random-values polyfills global.crypto.getRandomValues
    global.crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Hash sensitive data for storage (one-way)
   */
  static async hashSensitiveData(data: string): Promise<string> {
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data
    );
  }

  /**
   * Generate a signature for data
   */
  static async signData(data: object, secret: string): Promise<string> {
    const input = JSON.stringify(data);
    const combined = secret + input;
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      combined
    );
    // Return hash as-is (hex format instead of base64)
    // This differs slightly from Node.js version but maintains security
    return hash;
  }

  /**
   * Verify a data signature
   */
  static async verifySignature(
    data: object,
    signature: string,
    secret: string
  ): Promise<boolean> {
    const expectedSignature = await this.signData(data, secret);
    return signature === expectedSignature;
  }
}
