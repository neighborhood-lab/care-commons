import logger from './logger.js';

// Use browser performance API if available, otherwise minimal fallback
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const getPerformance = () => {
  if (typeof globalThis.performance !== 'undefined') {
    return globalThis.performance;
  }
  // Minimal fallback that works everywhere
  return {
    now: () => new Date().getTime()
  };
};

const performance = getPerformance();

export class PerformanceMonitor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static timers = new Map<string, any>();

  static start(label: string): void {
    this.timers.set(label, performance.now());
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static end(label: string, context?: any): number | undefined {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async measure<T>(label: string, fn: () => Promise<T>, context?: any): Promise<T> {
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
