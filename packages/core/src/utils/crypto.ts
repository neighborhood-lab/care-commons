/**
 * Platform-agnostic crypto utilities
 * Works in both Node.js and React Native environments
 */

/* eslint-disable unicorn/prefer-module */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-implied-eval */

// Platform detection
const isReactNative = typeof navigator !== 'undefined' && (navigator as any).product === 'ReactNative';

// Type definitions for expo-crypto
interface ExpoCrypto {
  getRandomBytes(byteCount: number): Uint8Array;
  randomUUID(): string;
}

type NodeCryptoModule = typeof import('node:crypto');

// Import node:crypto at module level for Node.js
// This import will be tree-shaken/ignored by Metro bundler since it's conditional
let nodeCrypto: NodeCryptoModule | null = null;
let expoCrypto: ExpoCrypto | null = null;

// Load node:crypto in Node.js context (not React Native)
if (!isReactNative) {
  // Use dynamic import at module load time
  // This works in both ESM and CommonJS when using tsx/Node.js 22+
  try {
    // In Node.js, import() is available and synchronous for built-in modules
    nodeCrypto = await import('node:crypto');
  } catch {
    // Fallback: not available (shouldn't happen in Node.js)
    nodeCrypto = null;
  }
}

/**
 * Get Node.js crypto module (lazy loaded for React Native)
 */
function getNodeCrypto(): NodeCryptoModule {
  if (nodeCrypto === null) {
    if (isReactNative) {
      // Metro bundler (React Native) - use eval to hide from static analysis
      // This prevents Metro from trying to bundle node:crypto
      const req = eval('require');
      nodeCrypto = req('node' + String.fromCharCode(58) + 'crypto') as NodeCryptoModule;
    } else {
      throw new Error('node:crypto should have been loaded at module initialization');
    }
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
