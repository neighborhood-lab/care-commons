/**
 * Tests for Crypto Utils - Cryptographic utility functions for EVV integrity and security
 */

import { describe, it, expect } from 'vitest';
import { CryptoUtils } from '../utils/crypto-utils';

describe('CryptoUtils', () => {
  describe('generateHash', () => {
    it('should generate consistent hash for same input', () => {
      const input = 'test data';
      const hash1 = CryptoUtils.generateHash(input);
      const hash2 = CryptoUtils.generateHash(input);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex pattern
    });

    it('should generate different hashes for different inputs', () => {
      const hash1 = CryptoUtils.generateHash('data1');
      const hash2 = CryptoUtils.generateHash('data2');

      expect(hash1).not.toBe(hash2);
    });

    it('should handle object input', () => {
      const input = { key: 'value', number: 42 };
      const hash = CryptoUtils.generateHash(input);

      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('generateIntegrityHash', () => {
    it('should generate hash without secret', () => {
      const data = { test: 'data' };
      const hash = CryptoUtils.generateIntegrityHash(data);

      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate different hash with secret', () => {
      const data = { test: 'data' };
      const secret = 'secret-key';
      const hash = CryptoUtils.generateIntegrityHash(data, secret);

      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate different hashes with and without secret', () => {
      const data = { test: 'data' };
      const hashWithoutSecret = CryptoUtils.generateIntegrityHash(data);
      const hashWithSecret = CryptoUtils.generateIntegrityHash(data, 'secret');

      expect(hashWithoutSecret).not.toBe(hashWithSecret);
    });
  });

  describe('generateChecksum', () => {
    it('should generate checksum for string input', () => {
      const input = 'test data';
      const checksum = CryptoUtils.generateChecksum(input);

      expect(checksum).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate checksum for object input', () => {
      const input = { key: 'value' };
      const checksum = CryptoUtils.generateChecksum(input);

      expect(checksum).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate consistent checksum for same input', () => {
      const input = 'consistent data';
      const checksum1 = CryptoUtils.generateChecksum(input);
      const checksum2 = CryptoUtils.generateChecksum(input);

      expect(checksum1).toBe(checksum2);
    });
  });

  describe('verifyIntegrityHash', () => {
    it('should verify correct hash', () => {
      const data = { test: 'data' };
      const hash = CryptoUtils.generateIntegrityHash(data);

      const isValid = CryptoUtils.verifyIntegrityHash(data, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect hash', () => {
      const data = { test: 'data' };
      const wrongHash = 'wrong-hash-value';

      const isValid = CryptoUtils.verifyIntegrityHash(data, wrongHash);

      expect(isValid).toBe(false);
    });

    it('should verify with secret', () => {
      const data = { test: 'data' };
      const secret = 'secret-key';
      const hash = CryptoUtils.generateIntegrityHash(data, secret);

      const isValid = CryptoUtils.verifyIntegrityHash(data, hash, secret);

      expect(isValid).toBe(true);
    });

    it('should reject with wrong secret', () => {
      const data = { test: 'data' };
      const hash = CryptoUtils.generateIntegrityHash(data, 'secret1');

      const isValid = CryptoUtils.verifyIntegrityHash(data, hash, 'secret2');

      expect(isValid).toBe(false);
    });
  });

  describe('generateSecureId', () => {
    it('should generate unique IDs', () => {
      const id1 = CryptoUtils.generateSecureId();
      const id2 = CryptoUtils.generateSecureId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^[a-f0-9]{32}$/); // 16 bytes = 32 hex chars
      expect(id2).toMatch(/^[a-f0-9]{32}$/);
    });

    it('should generate IDs of correct length', () => {
      const id = CryptoUtils.generateSecureId();

      expect(id).toHaveLength(32);
    });
  });

  describe('hashSensitiveData', () => {
    it('should hash sensitive data', () => {
      const sensitiveData = 'social-security-number';
      const hash = CryptoUtils.hashSensitiveData(sensitiveData);

      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      expect(hash).not.toBe(sensitiveData);
    });

    it('should generate consistent hash for same data', () => {
      const data = 'sensitive-info';
      const hash1 = CryptoUtils.hashSensitiveData(data);
      const hash2 = CryptoUtils.hashSensitiveData(data);

      expect(hash1).toBe(hash2);
    });
  });

  describe('signData', () => {
    it('should sign data with secret', () => {
      const data = { message: 'important data' };
      const secret = 'signing-secret';
      const signature = CryptoUtils.signData(data, secret);

      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
    });

    it('should generate different signatures with different secrets', () => {
      const data = { message: 'data' };
      const signature1 = CryptoUtils.signData(data, 'secret1');
      const signature2 = CryptoUtils.signData(data, 'secret2');

      expect(signature1).not.toBe(signature2);
    });
  });

  describe('verifySignature', () => {
    it('should verify correct signature', () => {
      const data = { message: 'authenticated data' };
      const secret = 'verification-secret';
      const signature = CryptoUtils.signData(data, secret);

      const isValid = CryptoUtils.verifySignature(data, signature, secret);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect signature', () => {
      const data = { message: 'data' };
      const wrongSignature = 'invalid-signature';

      const isValid = CryptoUtils.verifySignature(data, wrongSignature, 'secret');

      expect(isValid).toBe(false);
    });

    it('should reject signature with wrong secret', () => {
      const data = { message: 'data' };
      const signature = CryptoUtils.signData(data, 'secret1');

      const isValid = CryptoUtils.verifySignature(data, signature, 'secret2');

      expect(isValid).toBe(false);
    });

    it('should reject signature for modified data', () => {
      const originalData = { message: 'original' };
      const modifiedData = { message: 'modified' };
      const secret = 'secret';
      const signature = CryptoUtils.signData(originalData, secret);

      const isValid = CryptoUtils.verifySignature(modifiedData, signature, secret);

      expect(isValid).toBe(false);
    });
  });
});