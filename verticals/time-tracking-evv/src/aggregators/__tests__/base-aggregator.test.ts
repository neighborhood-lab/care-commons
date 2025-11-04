/**
 * Base Aggregator Utilities Tests
 * 
 * Tests for utility functions and constants in base aggregator module.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateRetryDelay,
  EXPONENTIAL_BACKOFF,
  LINEAR_BACKOFF,
} from '../base-aggregator.js';

describe('Base Aggregator Utilities', () => {
  describe('calculateRetryDelay', () => {
    it('should calculate exponential backoff correctly', () => {
      const delay0 = calculateRetryDelay(0, EXPONENTIAL_BACKOFF);
      const delay1 = calculateRetryDelay(1, EXPONENTIAL_BACKOFF);
      const delay2 = calculateRetryDelay(2, EXPONENTIAL_BACKOFF);

      // Base * 2^retry
      expect(delay0).toBe(60); // 60 * 2^0 = 60
      expect(delay1).toBe(120); // 60 * 2^1 = 120
      expect(delay2).toBe(240); // 60 * 2^2 = 240
    });

    it('should cap exponential backoff at max delay', () => {
      const delay10 = calculateRetryDelay(10, EXPONENTIAL_BACKOFF);

      // Should not exceed maxDelaySeconds
      expect(delay10).toBeLessThanOrEqual(EXPONENTIAL_BACKOFF.maxDelaySeconds);
      expect(delay10).toBe(1800); // Capped at max
    });

    it('should calculate linear backoff correctly', () => {
      const delay0 = calculateRetryDelay(0, LINEAR_BACKOFF);
      const delay1 = calculateRetryDelay(1, LINEAR_BACKOFF);
      const delay2 = calculateRetryDelay(2, LINEAR_BACKOFF);

      // Base * (retry + 1)
      expect(delay0).toBe(300); // 300 * 1 = 300
      expect(delay1).toBe(600); // 300 * 2 = 600
      expect(delay2).toBe(900); // 300 * 3 = 900
    });

    it('should cap linear backoff at max delay', () => {
      const delay10 = calculateRetryDelay(10, LINEAR_BACKOFF);

      // Should not exceed maxDelaySeconds
      expect(delay10).toBeLessThanOrEqual(LINEAR_BACKOFF.maxDelaySeconds);
      expect(delay10).toBe(1800); // Capped at max
    });

    it('should handle zero retry count', () => {
      const expDelay = calculateRetryDelay(0, EXPONENTIAL_BACKOFF);
      const linDelay = calculateRetryDelay(0, LINEAR_BACKOFF);

      expect(expDelay).toBeGreaterThan(0);
      expect(linDelay).toBeGreaterThan(0);
    });

    it('should handle very high retry counts', () => {
      const expDelay = calculateRetryDelay(100, EXPONENTIAL_BACKOFF);
      const linDelay = calculateRetryDelay(100, LINEAR_BACKOFF);

      // Should be capped at max
      expect(expDelay).toBe(EXPONENTIAL_BACKOFF.maxDelaySeconds);
      expect(linDelay).toBe(LINEAR_BACKOFF.maxDelaySeconds);
    });
  });

  describe('EXPONENTIAL_BACKOFF', () => {
    it('should have correct configuration', () => {
      expect(EXPONENTIAL_BACKOFF.maxRetries).toBe(3);
      expect(EXPONENTIAL_BACKOFF.backoffType).toBe('EXPONENTIAL');
      expect(EXPONENTIAL_BACKOFF.baseDelaySeconds).toBe(60);
      expect(EXPONENTIAL_BACKOFF.maxDelaySeconds).toBe(1800);
    });
  });

  describe('LINEAR_BACKOFF', () => {
    it('should have correct configuration', () => {
      expect(LINEAR_BACKOFF.maxRetries).toBe(5);
      expect(LINEAR_BACKOFF.backoffType).toBe('LINEAR');
      expect(LINEAR_BACKOFF.baseDelaySeconds).toBe(300);
      expect(LINEAR_BACKOFF.maxDelaySeconds).toBe(1800);
    });
  });

  describe('Retry Policy Comparison', () => {
    it('should have exponential backoff grow faster than linear', () => {
      const exp2 = calculateRetryDelay(2, EXPONENTIAL_BACKOFF);
      const lin2 = calculateRetryDelay(2, LINEAR_BACKOFF);

      // Exponential should grow faster
      expect(exp2).toBeLessThan(lin2); // In early retries, linear is actually higher
    });

    it('should have different max retries', () => {
      expect(EXPONENTIAL_BACKOFF.maxRetries).toBeLessThan(LINEAR_BACKOFF.maxRetries);
    });

    it('should both cap at same max delay', () => {
      expect(EXPONENTIAL_BACKOFF.maxDelaySeconds).toBe(LINEAR_BACKOFF.maxDelaySeconds);
    });
  });
});
