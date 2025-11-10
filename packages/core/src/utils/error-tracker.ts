import logger from './logger';

/**
 * Minimal Sentry type definitions for dynamic imports
 */
interface SentryEvent {
  request?: {
    cookies?: unknown;
    headers?: Record<string, unknown>;
  };
  [key: string]: unknown;
}

interface SentryScope {
  setUser(user: { id: string; email?: string }): void;
}

interface SentryModule {
  init(config: {
    dsn?: string;
    environment?: string;
    integrations?: unknown[];
    tracesSampleRate?: number;
    profilesSampleRate?: number;
    beforeSend?: (event: SentryEvent, hint: unknown) => SentryEvent | null;
  }): void;
  captureException(error: unknown, options?: { extra?: unknown }): void;
  getCurrentScope(): SentryScope;
}

// Dynamic import for Sentry to avoid bundling in browser environments
let Sentry: SentryModule | null = null;
let nodeProfilingIntegration: (() => unknown) | null = null;

// Check if we're in a Node.js environment (not browser)
const isNodeEnvironment = typeof process !== 'undefined' &&
  process.versions?.node != null;

async function loadSentryModules(): Promise<void> {
  // Only load Sentry in Node.js environment
  if (!isNodeEnvironment) {
    return;
  }

  try {
    // Dynamically import @sentry/node
    Sentry = (await import('@sentry/node')) as SentryModule;

    // Try to load profiling integration
    try {
      const profilingModule = await import('@sentry/profiling-node');
      nodeProfilingIntegration = profilingModule.nodeProfilingIntegration;
    } catch {
      // Profiling integration not available
      nodeProfilingIntegration = null;
    }
  } catch {
    // Sentry not available
    Sentry = null;
  }
}

export function initializeErrorTracking(): void {
  if (process.env.NODE_ENV === 'production' && isNodeEnvironment) {
    // Load Sentry modules asynchronously
    loadSentryModules().then(() => {
      if (Sentry === null) {
        return;
      }
      const integrations: unknown[] = [];
      
      // Only add profiling integration if available (server-side)
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (nodeProfilingIntegration && typeof globalThis === 'object' && 'window' in globalThis === false) {
        integrations.push(nodeProfilingIntegration());
      }

      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        integrations,
        tracesSampleRate: 0.1, // 10% of requests
        profilesSampleRate: nodeProfilingIntegration !== null ? 0.1 : 0, // Only enable profiling if available

        beforeSend(event: SentryEvent, _hint: unknown): SentryEvent | null {
          // Filter out sensitive data
          if (event.request !== undefined) {
            delete event.request.cookies;
            if (event.request.headers !== undefined) {
              delete event.request.headers['authorization'];
            }
          }
          return event;
        }
      });
      return true;
    }).catch(() => {
      // Failed to load Sentry modules - silently skip initialization
      logger.warn('Failed to initialize Sentry error tracking');
    });
  }
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  logger.error({ error, ...context }, 'Exception captured');

  if (process.env.NODE_ENV === 'production' && Sentry !== null) {
    Sentry.captureException(error, {
      extra: context
    });
  }
}

export function setUserContext(user: { id: string; email?: string }): void {
  if (process.env.NODE_ENV === 'production' && Sentry !== null) {
    try {
      // Use getCurrentScope to access setUser
      const scope = Sentry.getCurrentScope();
      scope.setUser({
        id: user.id,
        email: user.email
      });
    } catch {
      // Sentry not available or setUser not supported
      logger.warn({ userId: user.id }, 'Failed to set Sentry user context');
    }
  }
}
