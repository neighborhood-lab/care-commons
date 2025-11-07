import { Database } from '@care-commons/core';
import { StateCode } from '../types/state-specific';
import { TexasEVVProvider } from './texas-evv-provider';
import { FloridaEVVProvider } from './florida-evv-provider';
import { OhioEVVProvider } from './ohio-evv-provider';
import { PennsylvaniaEVVProvider } from './pennsylvania-evv-provider';
import { GeorgiaEVVProvider } from './georgia-evv-provider';
import { NorthCarolinaEVVProvider } from './north-carolina-evv-provider';
import { ArizonaEVVProvider } from './arizona-evv-provider';

/**
 * State Provider Factory
 *
 * Provides state-specific EVV providers using the Factory pattern.
 * This enables polymorphic handling of state-specific compliance rules
 * while maintaining a clean, scalable architecture.
 *
 * SOLID Principles:
 * - Single Responsibility: Factory only creates providers
 * - Open/Closed: Adding new states requires minimal changes
 * - Liskov Substitution: All providers are interchangeable
 * - Interface Segregation: Each provider implements its own interface
 * - Dependency Inversion: Depends on abstractions, not concretions
 *
 * APIE Principles:
 * - Abstraction: Factory hides provider creation details
 * - Polymorphism: All providers can be used interchangeably
 * - Inheritance: Providers share common patterns
 * - Encapsulation: Provider instances cached internally
 *
 * Usage:
 * ```typescript
 * const provider = StateProviderFactory.getProvider('TX', database);
 * await provider.submitToAggregator(evvRecord);
 * ```
 */

/**
 * Union type of all state-specific provider types
 */
export type StateEVVProvider =
  | TexasEVVProvider
  | FloridaEVVProvider
  | OhioEVVProvider
  | PennsylvaniaEVVProvider
  | GeorgiaEVVProvider
  | NorthCarolinaEVVProvider
  | ArizonaEVVProvider;

/**
 * State Provider Factory
 *
 * Singleton factory that creates and caches state-specific EVV providers.
 */
export class StateProviderFactory {
  /**
   * Cache of provider instances (singleton per state)
   * Key: StateCode, Value: Provider instance
   */
  private static instances = new Map<StateCode, StateEVVProvider>();

  /**
   * Database instance cache
   */
  private static database: Database;

  /**
   * Initialize factory with database instance
   *
   * Must be called once before using getProvider().
   */
  static initialize(database: Database): void {
    StateProviderFactory.database = database;
  }

  /**
   * Get state-specific EVV provider
   *
   * Returns cached instance if available, otherwise creates new instance.
   *
   * @param state - State code (TX, FL, OH, PA, GA, NC, AZ)
   * @param database - Optional database instance (uses initialized if not provided)
   * @returns State-specific EVV provider
   * @throws Error if state is not supported or factory not initialized
   */
  static getProvider(state: StateCode, database?: Database): StateEVVProvider {
    const db = database || StateProviderFactory.database;

    if (!db) {
      throw new Error('StateProviderFactory not initialized. Call initialize() first.');
    }

    // Return cached instance if available
    if (StateProviderFactory.instances.has(state)) {
      return StateProviderFactory.instances.get(state)!;
    }

    // Create new instance
    const provider = StateProviderFactory.createProvider(state, db);

    // Cache instance
    StateProviderFactory.instances.set(state, provider);

    return provider;
  }

  /**
   * Create new provider instance for state
   *
   * @param state - State code
   * @param database - Database instance
   * @returns State-specific EVV provider
   * @throws Error if state is not supported
   */
  private static createProvider(state: StateCode, database: Database): StateEVVProvider {
    switch (state) {
      case 'TX':
        return new TexasEVVProvider(database);

      case 'FL':
        return new FloridaEVVProvider(database);

      case 'OH':
        return new OhioEVVProvider(database);

      case 'PA':
        return new PennsylvaniaEVVProvider(database);

      case 'GA':
        return new GeorgiaEVVProvider(database);

      case 'NC':
        return new NorthCarolinaEVVProvider(database);

      case 'AZ':
        return new ArizonaEVVProvider(database);

      default:
        throw new Error(`Unsupported state: ${state}. Supported states: TX, FL, OH, PA, GA, NC, AZ`);
    }
  }

  /**
   * Clear provider cache
   *
   * Useful for testing or when database connection changes.
   */
  static clearCache(): void {
    StateProviderFactory.instances.clear();
  }

  /**
   * Get all supported states
   *
   * @returns Array of supported state codes
   */
  static getSupportedStates(): StateCode[] {
    return ['TX', 'FL', 'OH', 'PA', 'GA', 'NC', 'AZ'];
  }

  /**
   * Check if state is supported
   *
   * @param state - State code to check
   * @returns true if state is supported
   */
  static isSupported(state: string): state is StateCode {
    return StateProviderFactory.getSupportedStates().includes(state as StateCode);
  }

  /**
   * Get aggregator type for state
   *
   * @param state - State code
   * @returns Aggregator type (SANDATA, TELLUS, HHAEEXCHANGE, MULTI)
   */
  static getAggregatorType(state: StateCode): string {
    const aggregatorMap: Record<StateCode, string> = {
      TX: 'HHAEEXCHANGE',
      FL: 'MULTI',
      OH: 'SANDATA',
      PA: 'SANDATA',
      GA: 'TELLUS',
      NC: 'SANDATA',
      AZ: 'SANDATA',
    };

    return aggregatorMap[state];
  }

  /**
   * Get states using specific aggregator
   *
   * @param aggregatorType - Aggregator type
   * @returns Array of state codes using this aggregator
   */
  static getStatesByAggregator(aggregatorType: string): StateCode[] {
    const stateAggregatorMap: Record<string, StateCode[]> = {
      SANDATA: ['OH', 'PA', 'NC', 'AZ'],
      TELLUS: ['GA'],
      HHAEEXCHANGE: ['TX'],
      MULTI: ['FL'],
    };

    return stateAggregatorMap[aggregatorType] || [];
  }
}
