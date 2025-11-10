/**
 * Password Utilities Tests
 */

/* eslint-disable sonarjs/no-hardcoded-passwords */
import { describe, it, expect } from 'vitest';
import { PasswordUtils } from '../../utils/password-utils';
import { ValidationError } from '../../types/base';

describe('PasswordUtils', () => {
  describe('hashPassword', () => {
    it('should hash a valid password', () => {
      const password = 'SecurePass123';
      const hash = PasswordUtils.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).toContain(':'); // Should contain salt:hash format
      expect(hash.split(':').length).toBe(2);
    });

    it('should create unique salts for same password', () => {
      const password = 'SecurePass123';
      const hash1 = PasswordUtils.hashPassword(password);
      const hash2 = PasswordUtils.hashPassword(password);

      expect(hash1).not.toBe(hash2); // Different salts = different hashes
    });

    it('should reject password without uppercase', () => {
      expect(() => {
        PasswordUtils.hashPassword('weakpass123');
      }).toThrow(ValidationError);
    });

    it('should reject password without lowercase', () => {
      expect(() => {
        PasswordUtils.hashPassword('WEAKPASS123');
      }).toThrow(ValidationError);
    });

    it('should reject password without numbers', () => {
      expect(() => {
        PasswordUtils.hashPassword('WeakPassword');
      }).toThrow(ValidationError);
    });

    it('should reject password that is too short', () => {
      expect(() => {
        PasswordUtils.hashPassword('Pass1');
      }).toThrow(ValidationError);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', () => {
      const password = 'SecurePass123';
      const hash = PasswordUtils.hashPassword(password);
      const isValid = PasswordUtils.verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', () => {
      const password = 'SecurePass123';
      const hash = PasswordUtils.hashPassword(password);
      const isValid = PasswordUtils.verifyPassword('WrongPass123', hash);

      expect(isValid).toBe(false);
    });

    it('should throw error for invalid hash format', () => {
      expect(() => {
        PasswordUtils.verifyPassword('password', 'invalid-hash');
      }).toThrow(ValidationError);
    });

    it('should throw error for hash with empty salt', () => {
      expect(() => {
        PasswordUtils.verifyPassword('password', ':hash');
      }).toThrow(ValidationError);
      expect(() => {
        PasswordUtils.verifyPassword('password', ':hash');
      }).toThrow('Invalid password hash - missing salt or hash');
    });

    it('should throw error for hash with empty hash part', () => {
      expect(() => {
        PasswordUtils.verifyPassword('password', 'salt:');
      }).toThrow(ValidationError);
      expect(() => {
        PasswordUtils.verifyPassword('password', 'salt:');
      }).toThrow('Invalid password hash - missing salt or hash');
    });
  });

  describe('needsRehash', () => {
    it('should return false for valid hash format', () => {
      const password = 'SecurePass123';
      const hash = PasswordUtils.hashPassword(password);
      const needsRehash = PasswordUtils.needsRehash(hash);

      expect(needsRehash).toBe(false);
    });

    it('should return true for invalid hash format', () => {
      const needsRehash = PasswordUtils.needsRehash('old-format-hash');

      expect(needsRehash).toBe(true);
    });
  });

  describe('generateSecurePassword', () => {
    it('should generate password with default length', () => {
      const password = PasswordUtils.generateSecurePassword();

      expect(password.length).toBe(16);
    });

    it('should generate password with custom length', () => {
      const password = PasswordUtils.generateSecurePassword(24);

      expect(password.length).toBe(24);
    });

    it('should generate password meeting complexity requirements', () => {
      const password = PasswordUtils.generateSecurePassword();

      expect(/[A-Z]/.test(password)).toBe(true); // Has uppercase
      expect(/[a-z]/.test(password)).toBe(true); // Has lowercase
      expect(/\d/.test(password)).toBe(true); // Has number
    });

    it('should generate unique passwords', () => {
      const password1 = PasswordUtils.generateSecurePassword();
      const password2 = PasswordUtils.generateSecurePassword();

      expect(password1).not.toBe(password2);
    });
  });
});
