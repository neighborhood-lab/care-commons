/**
 * Crypto Utilities - React Native Implementation
 * 
 * React Native-compatible cryptographic utilities using expo-crypto and react-native-get-random-values.
 * This file is used when the time-tracking-evv package is imported in React Native/Expo.
 */

// Dynamic imports to avoid TypeScript errors during build
// These will be available at runtime in React Native
declare const require: (module: string) => any;
const Crypto = require('expo-crypto');
require('react-native-get-random-values');

export class CryptoUtils {
  /**
   * Generate SHA-256 hash of data
   */
  static async sha256(data: string): Promise<string> {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data
    );
    return hash;
  }

  /**
   * Generate HMAC-SHA256 signature
   * Note: expo-crypto doesn't have built-in HMAC, so we use a simpler approach
   */
  static async hmacSha256(data: string, secret: string): Promise<string> {
    // Concatenate secret and data for basic HMAC-like behavior
    // For production, consider using a dedicated HMAC library
    const combined = secret + data;
    return await this.sha256(combined);
  }

  /**
   * Generate cryptographically secure random bytes
   */
  static randomBytes(size: number): Uint8Array {
    // react-native-get-random-values polyfills crypto.getRandomValues
    const array = new Uint8Array(size);
    crypto.getRandomValues(array);
    return array;
  }

  /**
   * Generate random hex string
   */
  static randomHex(byteLength: number): string {
    const bytes = this.randomBytes(byteLength);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Generate integrity hash for EVV audit trail
   */
  static async generateIntegrityHash(data: Record<string, unknown>): Promise<string> {
    const sortedKeys = Object.keys(data).sort();
    const dataString = sortedKeys
      .map(key => `${key}=${JSON.stringify(data[key])}`)
      .join('&');
    
    return await this.sha256(dataString);
  }

  /**
   * Verify integrity hash
   */
  static async verifyIntegrityHash(
    data: Record<string, unknown>,
    expectedHash: string
  ): Promise<boolean> {
    const calculatedHash = await this.generateIntegrityHash(data);
    return calculatedHash === expectedHash;
  }
}
