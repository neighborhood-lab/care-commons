import { performance } from 'node:perf_hooks';
import logger from './logger.js';

export class PerformanceMonitor {
  private static timers = new Map<string, number>();

  static start(label: string): void {
    this.timers.set(label, performance.now());
  }

  static end(label: string, context?: Record<string, unknown>): number | undefined {
    const start = this.timers.get(label);
    if (start === undefined) {
      logger.warn({ label }, 'Performance timer not found');
      return undefined;
    }

    const duration = performance.now() - start;
    this.timers.delete(label);

    logger.info({
      label,
      duration: `${duration.toFixed(2)}ms`,
      ...context
    }, 'Performance measurement');

    // Alert on slow operations
    if (duration > 1000) {
      logger.warn({
        label,
        duration: `${duration.toFixed(2)}ms`,
        ...context
      }, 'Slow operation detected');
    }

    return duration;
  }

  static async measure<T>(
    label: string,
    fn: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T> {
    this.start(label);
    try {
      return await fn();
    } finally {
      this.end(label, context);
    }
  }
}

// Usage:
// await PerformanceMonitor.measure('createVisit', async () => {
//   return visitService.create(data);
// }, { clientId: data.clientId });
