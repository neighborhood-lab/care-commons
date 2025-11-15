/**
 * EVV Aggregator Submission Worker
 *
 * Background worker that automatically retries failed EVV aggregator submissions.
 * Runs periodically to check for pending submissions and retry them according
 * to their retry schedule.
 *
 * Features:
 * - Exponential backoff retry logic
 * - Configurable retry intervals
 * - Error logging and tracking
 * - Graceful shutdown support
 */

import { EVVAggregatorService } from '../service/evv-aggregator-service.js';
import { createLogger } from '@care-commons/core';

const log = createLogger('SubmissionWorker');

export interface SubmissionWorkerConfig {
  /**
   * How often to check for pending submissions (in milliseconds)
   * Default: 5 minutes (300000ms)
   */
  checkIntervalMs: number;

  /**
   * Whether the worker is enabled
   * Default: true
   */
  enabled: boolean;

  /**
   * Maximum number of submissions to process in one batch
   * Default: 100
   */
  batchSize: number;
}

const DEFAULT_CONFIG: SubmissionWorkerConfig = {
  checkIntervalMs: 300000, // 5 minutes
  enabled: true,
  batchSize: 100,
};

/**
 * Submission Worker
 *
 * Automatically retries failed EVV aggregator submissions.
 */
export class SubmissionWorker {
  // eslint-disable-next-line no-undef
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private config: SubmissionWorkerConfig;

  constructor(
    private aggregatorService: EVVAggregatorService,
    config?: Partial<SubmissionWorkerConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start the submission worker
   *
   * Begins periodic checking and retrying of failed submissions.
   */
  start(): void {
    if (!this.config.enabled) {
      log.info('SubmissionWorker is disabled');
      return;
    }

    if (this.isRunning) {
      log.warn('SubmissionWorker is already running');
      return;
    }

    log.info({ checkIntervalMs: this.config.checkIntervalMs }, 'SubmissionWorker starting');

    this.isRunning = true;

    // Run immediately on start
    this.processRetries().catch(error => {
      log.error({ error }, 'Error in initial submission retry processing');
    });

    // Then run periodically
    this.intervalId = setInterval(() => {
      this.processRetries().catch(error => {
        log.error({ error }, 'Error in submission retry processing');
      });
    }, this.config.checkIntervalMs) as unknown as NodeJS.Timeout;
  }

  /**
   * Stop the submission worker
   *
   * Gracefully shuts down the worker.
   */
  stop(): void {
    if (!this.isRunning) {
      log.warn('SubmissionWorker is not running');
      return;
    }

    log.info('SubmissionWorker stopping...');

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;

    log.info('SubmissionWorker stopped');
  }

  /**
   * Process pending retries
   *
   * Checks for submissions that need to be retried and processes them.
   */
  private async processRetries(): Promise<void> {
    try {
      log.debug('Processing pending submission retries...');

      const startTime = Date.now();

      // Retry pending submissions
      await this.aggregatorService.retryPendingSubmissions();

      const duration = Date.now() - startTime;

      log.info({ duration }, 'Finished processing submission retries');
    } catch (error) {
      log.error({ error }, 'Error processing submission retries');
      // Don't throw - let the worker continue running
    }
  }

  /**
   * Check if the worker is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get current configuration
   */
  getConfig(): SubmissionWorkerConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   *
   * Note: Requires restart to take effect
   */
  updateConfig(config: Partial<SubmissionWorkerConfig>): void {
    this.config = { ...this.config, ...config };
    log.info('SubmissionWorker configuration updated. Restart required for changes to take effect.');
  }
}

/**
 * Singleton instance for application-wide use
 */
let workerInstance: SubmissionWorker | null = null;

/**
 * Initialize and start the submission worker
 *
 * Should be called once during application startup.
 */
export function initializeSubmissionWorker(
  aggregatorService: EVVAggregatorService,
  config?: Partial<SubmissionWorkerConfig>
): SubmissionWorker {
  if (workerInstance) {
    log.warn('SubmissionWorker already initialized');
    return workerInstance;
  }

  workerInstance = new SubmissionWorker(aggregatorService, config);
  workerInstance.start();

  // Graceful shutdown on process termination
  process.on('SIGTERM', () => {
    log.info('SIGTERM received, shutting down SubmissionWorker...');
    workerInstance?.stop();
  });

  process.on('SIGINT', () => {
    log.info('SIGINT received, shutting down SubmissionWorker...');
    workerInstance?.stop();
  });

  return workerInstance;
}

/**
 * Get the submission worker instance
 *
 * Returns null if not initialized.
 */
export function getSubmissionWorker(): SubmissionWorker | null {
  return workerInstance;
}

/**
 * Stop and cleanup the submission worker
 */
export function shutdownSubmissionWorker(): void {
  if (workerInstance) {
    workerInstance.stop();
    workerInstance = null;
  }
}
