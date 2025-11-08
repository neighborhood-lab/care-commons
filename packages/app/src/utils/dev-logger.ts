/**
 * Development logging utilities for better debugging experience
 * Enhanced logging with colors, timestamps, and structured output
 */

import chalk from 'chalk';
import { performance } from 'node:perf_hooks';
import { randomUUID } from 'node:crypto';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  SUCCESS = 'success',
}

interface LogContext {
  requestId?: string;
  userId?: string;
  method?: string;
  path?: string;
  duration?: number;
  [key: string]: unknown;
}

/**
 * Check if we're in development mode
 */
const isDevelopment = process.env['NODE_ENV'] === 'development';

/**
 * Format timestamp
 */
function formatTimestamp(): string {
  const now = new Date();
  const timePart = now.toISOString().split('T')[1];
  return timePart !== undefined ? timePart.replace('Z', '') : now.toISOString();
}

/**
 * Format duration in human-readable format
 */
function formatDuration(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Get color based on log level
 */
function getColor(level: LogLevel): typeof chalk {
  switch (level) {
    case LogLevel.DEBUG:
      return chalk.gray;
    case LogLevel.INFO:
      return chalk.blue;
    case LogLevel.WARN:
      return chalk.yellow;
    case LogLevel.ERROR:
      return chalk.red;
    case LogLevel.SUCCESS:
      return chalk.green;
    default:
      return chalk.white;
  }
}

/**
 * Get emoji based on log level
 */
function getEmoji(level: LogLevel): string {
  switch (level) {
    case LogLevel.DEBUG:
      return '🔍';
    case LogLevel.INFO:
      return 'ℹ️ ';
    case LogLevel.WARN:
      return '⚠️ ';
    case LogLevel.ERROR:
      return '❌';
    case LogLevel.SUCCESS:
      return '✅';
    default:
      return '  ';
  }
}

/**
 * Enhanced logger class
 */
class DevLogger {
  private context: LogContext = {};

  /**
   * Set global context for all logs
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear global context
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * Log a message with context
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!isDevelopment && level === LogLevel.DEBUG) {
      return; // Skip debug logs in production
    }

    const timestamp = formatTimestamp();
    const color = getColor(level);
    const emoji = getEmoji(level);
    const mergedContext = { ...this.context, ...context };

    // Format the message
    let output = `${chalk.gray(timestamp)} ${emoji} ${color(message)}`;

    // Add context if present
    if (Object.keys(mergedContext).length > 0) {
      const contextStr = this.formatContext(mergedContext);
      output += chalk.gray(` ${contextStr}`);
    }

    console.log(output);
  }

  /**
   * Format context object for display
   */
  private formatContext(context: LogContext): string {
    const parts: string[] = [];

    if (context.requestId !== undefined) {
      parts.push(`reqId=${context.requestId.slice(0, 8)}`);
    }

    if (context.userId !== undefined) {
      parts.push(`userId=${context.userId}`);
    }

    if (context.method !== undefined && context.path !== undefined) {
      parts.push(`${context.method} ${context.path}`);
    }

    if (context.duration !== undefined) {
      const duration = formatDuration(context.duration);
      parts.push(`${duration}`);
    }

    // Add other context fields
    for (const [key, value] of Object.entries(context)) {
      if (!['requestId', 'userId', 'method', 'path', 'duration'].includes(key)) {
        parts.push(`${key}=${JSON.stringify(value)}`);
      }
    }

    return parts.length > 0 ? `[${parts.join(' ')}]` : '';
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context);

    if (error !== undefined && isDevelopment) {
      console.error(chalk.red('  ↳ Error:'), error.message);
      if (error.stack !== undefined) {
        console.error(chalk.gray(error.stack.split('\n').slice(1).join('\n')));
      }
    }
  }

  /**
   * Log success message
   */
  success(message: string, context?: LogContext): void {
    this.log(LogLevel.SUCCESS, message, context);
  }

  /**
   * Create a timer for measuring operation duration
   */
  startTimer(): () => number {
    const start = performance.now();
    return () => performance.now() - start;
  }

  /**
   * Log database query (development only)
   */
  query(sql: string, duration?: number): void {
    if (!isDevelopment) return;

    // Truncate long queries
    const truncated = sql.length > 100 ? `${sql.slice(0, 100)}...` : sql;
    const context = duration !== undefined ? { duration } : undefined;

    this.debug(`SQL: ${truncated}`, context);
  }

  /**
   * Log HTTP request
   */
  request(method: string, path: string, context?: LogContext): void {
    this.info(`${method} ${path}`, context);
  }

  /**
   * Log HTTP response
   */
  response(method: string, path: string, statusCode: number, duration: number): void {
    let color: typeof chalk.green;
    if (statusCode < 300) {
      color = chalk.green;
    } else if (statusCode < 400) {
      color = chalk.yellow;
    } else {
      color = chalk.red;
    }

    const message = `${method} ${path} ${color(statusCode.toString())}`;
    this.info(message, { duration });
  }

  /**
   * Create a pretty table from data
   */
  table(data: Record<string, unknown>[]): void {
    if (!isDevelopment) return;
    console.table(data);
  }

  /**
   * Create a section divider
   */
  divider(title?: string): void {
    if (!isDevelopment) return;

    const line = '─'.repeat(80);
    if (title !== undefined) {
      const paddedTitle = ` ${title} `;
      const titleLen = paddedTitle.length;
      const leftLen = Math.floor((80 - titleLen) / 2);
      const rightLen = 80 - titleLen - leftLen;
      console.log(
        chalk.gray('─'.repeat(leftLen) + paddedTitle + '─'.repeat(rightLen))
      );
    } else {
      console.log(chalk.gray(line));
    }
  }
}

/**
 * Global logger instance
 */
export const logger = new DevLogger();

/**
 * Request logger middleware for Express
 */
export function requestLoggerMiddleware(
  req: { method: string; path: string; get: (header: string) => string | undefined },
  _res: unknown,
  next: () => void
): void {
  if (!isDevelopment) {
    next();
    return;
  }

  const timer = logger.startTimer();
  const requestId = randomUUID().slice(0, 8);

  logger.request(req.method, req.path, {
    requestId,
    userAgent: req.get('user-agent'),
  });

  // Log response when finished
  const originalNext = next;
  next = () => {
    const duration = timer();
    logger.debug(`Request completed in ${formatDuration(duration)}`);
    originalNext();
  };

  next();
}

/**
 * Query logger for database operations
 */
export function createQueryLogger(): { log: (sql: string, duration?: number) => void } {
  return {
    log: (sql: string, duration?: number) => {
      logger.query(sql, duration);
    },
  };
}
