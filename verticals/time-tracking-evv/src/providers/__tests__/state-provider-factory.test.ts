/**
 * StateProviderFactory Tests
 *
 * Tests for the state provider factory pattern implementation.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { StateProviderFactory } from '../state-provider-factory';
import type { Database } from '@care-commons/core';

describe('StateProviderFactory', () => {
  let mockDatabase: Database;

  beforeEach(() => {
    mockDatabase = {
      query: vi.fn(),
    } as unknown as Database;
    StateProviderFactory.initialize(mockDatabase);
  });

  afterEach(() => {
    StateProviderFactory.clearCache();
  });

  describe('getProvider', () => {
    it('should return Texas provider for TX state', () => {
      const provider = StateProviderFactory.getProvider('TX');
      expect(provider.constructor.name).toBe('TexasEVVProvider');
    });

    it('should return Florida provider for FL state', () => {
      const provider = StateProviderFactory.getProvider('FL');
      expect(provider.constructor.name).toBe('FloridaEVVProvider');
    });

    it('should return Ohio provider for OH state', () => {
      const provider = StateProviderFactory.getProvider('OH');
      expect(provider.constructor.name).toBe('OhioEVVProvider');
    });

    it('should return Pennsylvania provider for PA state', () => {
      const provider = StateProviderFactory.getProvider('PA');
      expect(provider.constructor.name).toBe('PennsylvaniaEVVProvider');
    });

    it('should return Georgia provider for GA state', () => {
      const provider = StateProviderFactory.getProvider('GA');
      expect(provider.constructor.name).toBe('GeorgiaEVVProvider');
    });

    it('should return North Carolina provider for NC state', () => {
      const provider = StateProviderFactory.getProvider('NC');
      expect(provider.constructor.name).toBe('NorthCarolinaEVVProvider');
    });

    it('should return Arizona provider for AZ state', () => {
      const provider = StateProviderFactory.getProvider('AZ');
      expect(provider.constructor.name).toBe('ArizonaEVVProvider');
    });

    it('should cache provider instances', () => {
      const provider1 = StateProviderFactory.getProvider('TX');
      const provider2 = StateProviderFactory.getProvider('TX');
      expect(provider1).toBe(provider2); // Same instance
    });

    it('should throw error for unsupported state', () => {
      expect(() => {
        StateProviderFactory.getProvider('CA' as any);
      }).toThrow('Unsupported state: CA');
    });

    it('should throw error when not initialized', () => {
      StateProviderFactory.clearCache();
      // Create new factory without initialization
      const newFactory = StateProviderFactory;
      (newFactory as any).database = undefined;

      expect(() => {
        newFactory.getProvider('TX');
      }).toThrow('StateProviderFactory not initialized');

      // Re-initialize for other tests
      StateProviderFactory.initialize(mockDatabase);
    });
  });

  describe('getSupportedStates', () => {
    it('should return all 7 supported states', () => {
      const states = StateProviderFactory.getSupportedStates();
      expect(states).toHaveLength(7);
      expect(states).toEqual(['TX', 'FL', 'OH', 'PA', 'GA', 'NC', 'AZ']);
    });
  });

  describe('isSupported', () => {
    it('should return true for supported states', () => {
      expect(StateProviderFactory.isSupported('TX')).toBe(true);
      expect(StateProviderFactory.isSupported('FL')).toBe(true);
      expect(StateProviderFactory.isSupported('OH')).toBe(true);
      expect(StateProviderFactory.isSupported('PA')).toBe(true);
      expect(StateProviderFactory.isSupported('GA')).toBe(true);
      expect(StateProviderFactory.isSupported('NC')).toBe(true);
      expect(StateProviderFactory.isSupported('AZ')).toBe(true);
    });

    it('should return false for unsupported states', () => {
      expect(StateProviderFactory.isSupported('CA')).toBe(false);
      expect(StateProviderFactory.isSupported('NY')).toBe(false);
      expect(StateProviderFactory.isSupported('IL')).toBe(false);
    });
  });

  describe('getAggregatorType', () => {
    it('should return correct aggregator for each state', () => {
      expect(StateProviderFactory.getAggregatorType('TX')).toBe('HHAEEXCHANGE');
      expect(StateProviderFactory.getAggregatorType('FL')).toBe('MULTI');
      expect(StateProviderFactory.getAggregatorType('OH')).toBe('SANDATA');
      expect(StateProviderFactory.getAggregatorType('PA')).toBe('SANDATA');
      expect(StateProviderFactory.getAggregatorType('GA')).toBe('TELLUS');
      expect(StateProviderFactory.getAggregatorType('NC')).toBe('SANDATA');
      expect(StateProviderFactory.getAggregatorType('AZ')).toBe('SANDATA');
    });
  });

  describe('getStatesByAggregator', () => {
    it('should return all Sandata states', () => {
      const states = StateProviderFactory.getStatesByAggregator('SANDATA');
      expect(states).toHaveLength(4);
      expect(states).toEqual(['OH', 'PA', 'NC', 'AZ']);
    });

    it('should return Tellus state', () => {
      const states = StateProviderFactory.getStatesByAggregator('TELLUS');
      expect(states).toEqual(['GA']);
    });

    it('should return HHAeXchange state', () => {
      const states = StateProviderFactory.getStatesByAggregator('HHAEEXCHANGE');
      expect(states).toEqual(['TX']);
    });

    it('should return multi-aggregator state', () => {
      const states = StateProviderFactory.getStatesByAggregator('MULTI');
      expect(states).toEqual(['FL']);
    });

    it('should return empty array for unknown aggregator', () => {
      const states = StateProviderFactory.getStatesByAggregator('UNKNOWN');
      expect(states).toEqual([]);
    });
  });

  describe('clearCache', () => {
    it('should clear all cached instances', () => {
      const provider1 = StateProviderFactory.getProvider('TX');
      StateProviderFactory.clearCache();
      const provider2 = StateProviderFactory.getProvider('TX');
      expect(provider1).not.toBe(provider2); // Different instances
    });
  });
});
