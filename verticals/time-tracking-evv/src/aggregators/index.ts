/**
 * EVV Aggregators - Multi-State Support
 * 
 * This module provides aggregator implementations for all supported states.
 * 
 * Aggregator Coverage:
 * - Sandata: OH, PA, NC, AZ (4 states, single implementation)
 * - Tellus: GA (1 state)
 * - HHAeXchange: TX, FL (2 states, existing implementations)
 * 
 * Total: 7 states supported
 */

export type {
  IAggregator,
  StateEVVConfig,
  AggregatorSubmissionResult,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  RetryPolicy,
  SubmissionStatus,
} from './base-aggregator';

export {
  EXPONENTIAL_BACKOFF,
  LINEAR_BACKOFF,
  calculateRetryDelay,
} from './base-aggregator';

export { SandataAggregator } from './sandata-aggregator';
export { TellusAggregator } from './tellus-aggregator';
export { AggregatorRouter, getAggregatorRouter } from './aggregator-router';
