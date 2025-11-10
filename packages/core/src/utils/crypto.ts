/**
 * Platform-agnostic crypto utilities
 * Works in both Node.js and React Native environments
 */

/* eslint-disable unicorn/prefer-module */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-undef */

// Platform detection
const isReactNative = typeof navigator !== 'undefined' && (navigator as any).product === 'ReactNative';

// Type definitions for expo-crypto
interface ExpoCrypto {
  getRandomBytes(byteCount: number): Uint8Array;
  randomUUID(): string;
}

type NodeCryptoModule = typeof import('node:crypto');

// Lazy-loaded modules
let nodeCrypto: NodeCryptoModule | null = null;
let expoCrypto: ExpoCrypto | null = null;

/**
 * Get Node.js crypto module (lazy loaded)
 */
function getNodeCrypto(): NodeCryptoModule {
  if (nodeCrypto === null) {
    nodeCrypto = require('node:crypto') as NodeCryptoModule;
  }
  return nodeCrypto;
}

/**
 * Get expo-crypto module (lazy loaded)
 */
function getExpoCrypto(): ExpoCrypto {
  if (expoCrypto === null) {
    try {
      expoCrypto = require('expo-crypto') as ExpoCrypto;
    } catch {
      throw new Error('expo-crypto is required for React Native. Install with: npx expo install expo-crypto');
    }
  }
  return expoCrypto;
}

/**
 * Generate cryptographically secure random bytes
 */
export function randomBytes(size: number): Buffer {
  if (isReactNative) {
    // Use expo-crypto in React Native
    const crypto = getExpoCrypto();
    const bytes = crypto.getRandomBytes(size);
    return Buffer.from(bytes);
  } else {
    // Use Node.js crypto
    const crypto = getNodeCrypto();
    return crypto.randomBytes(size);
  }
}

/**
 * Generate a random UUID
 */
export function randomUUID(): string {
  if (isReactNative) {
    const crypto = getExpoCrypto();
    return crypto.randomUUID();
  } else {
    const crypto = getNodeCrypto();
    return crypto.randomUUID();
  }
}

/**
 * PBKDF2 key derivation
 * 
 * eslint-disable-next-line max-params -- crypto standard requires these parameters
 */
export function pbkdf2Sync(
  password: string | Buffer,
  salt: string | Buffer,
  iterations: number,
  keylen: number,
  digest: string
): Buffer {
  if (isReactNative) {
    // PBKDF2 is not available in expo-crypto, must use Node.js crypto polyfill
    // This is typically only needed on the server side for password hashing
    throw new Error('pbkdf2Sync is not supported in React Native. Password hashing should be done server-side.');
  } else {
    const crypto = getNodeCrypto();
    return crypto.pbkdf2Sync(password, salt, iterations, keylen, digest);
  }
}

/**
 * Create HMAC hash
 */
export function createHmac(algorithm: string, key: string | Buffer): ReturnType<NodeCryptoModule['createHmac']> {
  if (isReactNative) {
    throw new Error('createHmac is not supported in React Native. Use server-side APIs for HMAC operations.');
  } else {
    const crypto = getNodeCrypto();
    return crypto.createHmac(algorithm, key);
  }
}

/**
 * Create hash
 */
export function createHash(algorithm: string): ReturnType<NodeCryptoModule['createHash']> {
  if (isReactNative) {
    throw new Error('createHash is not supported in React Native. Use server-side APIs for hash operations.');
  } else {
    const crypto = getNodeCrypto();
    return crypto.createHash(algorithm);
  }
}

export default {
  randomBytes,
  randomUUID,
  pbkdf2Sync,
  createHmac,
  createHash,
};
