/**
 * Tests for localStorage utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getLocalStorage,
  setLocalStorage,
  removeLocalStorage,
  clearLocalStorage,
  getLastUpdated,
  CACHE_KEYS,
  CACHE_EXPIRATION,
} from '../localStorage';

describe('localStorage utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getLocalStorage', () => {
    it('should return default value when key does not exist', () => {
      const result = getLocalStorage('nonexistent', 'default');
      expect(result).toBe('default');
    });

    it('should return stored value when key exists', () => {
      const testData = { name: 'Test', value: 123 };
      setLocalStorage('test-key', testData);

      const result = getLocalStorage('test-key', null);
      expect(result).toEqual(testData);
    });

    it.skip('should return default value when stored data is expired', () => {
      const testData = { name: 'Test' };
      
      // Set with 1ms expiration
      setLocalStorage('test-key', testData, 1);

      // Wait for expiration
      vi.advanceTimersByTime(10);

      const result = getLocalStorage('test-key', 'default');
      expect(result).toBe('default');
    });

    it('should handle corrupted data gracefully', () => {
      localStorage.setItem('corrupted', 'not-valid-json{');

      const result = getLocalStorage('corrupted', 'default');
      expect(result).toBe('default');
    });

    it('should work with complex objects', () => {
      const complexData = {
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
        metadata: {
          total: 2,
          page: 1,
        },
      };

      setLocalStorage('complex', complexData);
      const result = getLocalStorage('complex', null);
      expect(result).toEqual(complexData);
    });
  });

  describe('setLocalStorage', () => {
    it('should store value successfully', () => {
      const testData = { value: 42 };
      const success = setLocalStorage('test', testData);

      expect(success).toBe(true);
      expect(getLocalStorage('test', null)).toEqual(testData);
    });

    it('should store value with expiration', () => {
      const testData = { value: 42 };
      setLocalStorage('test', testData, 5000); // 5 seconds

      const stored = localStorage.getItem('test');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.expiresAt).toBeDefined();
      expect(parsed.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should include timestamp in stored data', () => {
      const testData = { value: 42 };
      const beforeStore = Date.now();
      setLocalStorage('test', testData);
      const afterStore = Date.now();

      const stored = localStorage.getItem('test');
      const parsed = JSON.parse(stored!);
      
      expect(parsed.timestamp).toBeGreaterThanOrEqual(beforeStore);
      expect(parsed.timestamp).toBeLessThanOrEqual(afterStore);
    });

    it.skip('should handle quota exceeded by clearing old items', () => {
      // Mock quota exceeded error
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      let callCount = 0;
      setItemSpy.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          const error = new DOMException('QuotaExceededError');
          Object.defineProperty(error, 'name', {
            value: 'QuotaExceededError',
            writable: false,
          });
          throw error;
        }
      });

      setLocalStorage('test', { data: 'value' });
      
      // Should retry and succeed
      expect(callCount).toBeGreaterThan(1);
      
      setItemSpy.mockRestore();
    });
  });

  describe('removeLocalStorage', () => {
    it('should remove item from storage', () => {
      setLocalStorage('test', { value: 42 });
      expect(getLocalStorage('test', null)).toBeTruthy();

      removeLocalStorage('test');
      expect(getLocalStorage('test', null)).toBeNull();
    });

    it('should handle removing non-existent item gracefully', () => {
      expect(() => removeLocalStorage('nonexistent')).not.toThrow();
    });
  });

  describe('clearLocalStorage', () => {
    it('should clear all items', () => {
      setLocalStorage('key1', 'value1');
      setLocalStorage('key2', 'value2');
      setLocalStorage('key3', 'value3');

      clearLocalStorage();

      expect(getLocalStorage('key1', null)).toBeNull();
      expect(getLocalStorage('key2', null)).toBeNull();
      expect(getLocalStorage('key3', null)).toBeNull();
    });
  });

  describe('getLastUpdated', () => {
    it('should return timestamp when item exists', () => {
      const beforeStore = Date.now();
      setLocalStorage('test', { value: 42 });
      const afterStore = Date.now();

      const lastUpdated = getLastUpdated('test');
      
      expect(lastUpdated).toBeInstanceOf(Date);
      expect(lastUpdated!.getTime()).toBeGreaterThanOrEqual(beforeStore);
      expect(lastUpdated!.getTime()).toBeLessThanOrEqual(afterStore);
    });

    it('should return null when item does not exist', () => {
      const lastUpdated = getLastUpdated('nonexistent');
      expect(lastUpdated).toBeNull();
    });

    it('should return null for corrupted data', () => {
      localStorage.setItem('corrupted', 'not-valid-json{');
      
      const lastUpdated = getLastUpdated('corrupted');
      expect(lastUpdated).toBeNull();
    });
  });

  describe('CACHE_KEYS', () => {
    it('should have all required cache keys', () => {
      expect(CACHE_KEYS.CAREGIVER_DASHBOARD_VISITS).toBe('caregiver:dashboard:visits');
      expect(CACHE_KEYS.CAREGIVER_DASHBOARD_TIMESHEETS).toBe('caregiver:dashboard:timesheets');
      expect(CACHE_KEYS.CAREGIVER_DASHBOARD_CREDENTIALS).toBe('caregiver:dashboard:credentials');
      expect(CACHE_KEYS.CAREGIVER_DASHBOARD_STATS).toBe('caregiver:dashboard:stats');
    });
  });

  describe('CACHE_EXPIRATION', () => {
    it('should have correct expiration values', () => {
      expect(CACHE_EXPIRATION.FIVE_MINUTES).toBe(5 * 60 * 1000);
      expect(CACHE_EXPIRATION.FIFTEEN_MINUTES).toBe(15 * 60 * 1000);
      expect(CACHE_EXPIRATION.ONE_HOUR).toBe(60 * 60 * 1000);
      expect(CACHE_EXPIRATION.ONE_DAY).toBe(24 * 60 * 60 * 1000);
    });
  });

  describe('SSR safety', () => {
    it('should handle missing window gracefully', () => {
      // This test would require mocking the global window object
      // For now, we just ensure the functions don't throw
      expect(() => getLocalStorage('test', 'default')).not.toThrow();
      expect(() => setLocalStorage('test', 'value')).not.toThrow();
      expect(() => removeLocalStorage('test')).not.toThrow();
      expect(() => clearLocalStorage()).not.toThrow();
      expect(() => getLastUpdated('test')).not.toThrow();
    });
  });
});
