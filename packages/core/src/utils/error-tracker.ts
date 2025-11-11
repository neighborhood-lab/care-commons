import logger from './logger';

/**
 * Minimal Sentry type definitions for dynamic imports
 */
interface SentryEvent {
  request?: {
    cookies?: unknown;
    headers?: Record<string, unknown>;
    query_string?: string;
  };
  exception?: {
    values?: Array<{
      value?: string;
      type?: string;
    }>;
  };
  breadcrumbs?: Array<{
    message?: string;
    data?: Record<string, unknown>;
  }>;
  [key: string]: unknown;
}

interface SentryScope {
  setUser(user: { id: string; email?: string } | null): void;
  setContext(key: string, context: Record<string, unknown> | null): void;
  setTag(key: string, value: string): void;
}

interface SentryModule {
  init(config: {
    dsn?: string;
    environment?: string;
    integrations?: unknown[];
    tracesSampleRate?: number;
    profilesSampleRate?: number;
    beforeSend?: (event: SentryEvent, hint: unknown) => SentryEvent | null;
    maxBreadcrumbs?: number;
  }): void;
  captureException(error: unknown, options?: { extra?: unknown }): void;
  getCurrentScope(): SentryScope;
  addBreadcrumb(breadcrumb: {
    message?: string;
    category?: string;
    level?: string;
    data?: Record<string, unknown>;
    timestamp?: number;
  }): void;
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
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, sonarjs/cognitive-complexity
      if (nodeProfilingIntegration && typeof globalThis === 'object' && 'window' in globalThis === false) {
        integrations.push(nodeProfilingIntegration());
      }

      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        integrations,
        tracesSampleRate: 0.1, // 10% of requests
        profilesSampleRate: nodeProfilingIntegration !== null ? 0.1 : 0, // Only enable profiling if available
        maxBreadcrumbs: 100, // Keep last 100 breadcrumbs for debugging

        // eslint-disable-next-line sonarjs/cognitive-complexity
        beforeSend(event: SentryEvent, _hint: unknown): SentryEvent | null {
          // Filter out sensitive data
          if (event.request !== undefined) {
            delete event.request.cookies;
            if (event.request.headers !== undefined) {
              delete event.request.headers['authorization'];
              delete event.request.headers['cookie'];
            }
            
            // Remove query parameters that might contain sensitive data
            if (event.request.query_string !== undefined) {
              event.request.query_string = '[FILTERED]';
            }
          }

          // Scrub PHI-like patterns from exception messages
          if (event.exception?.values !== undefined) {
            for (const exception of event.exception.values) {
              if (exception.value !== undefined) {
                // Redact SSN patterns (###-##-####)
                exception.value = exception.value.replace(/\d{3}-\d{2}-\d{4}/g, '[SSN-REDACTED]');
                // Redact email addresses
                exception.value = exception.value.replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, '[EMAIL-REDACTED]');
                // Redact phone numbers
                exception.value = exception.value.replace(/\b(?:\d{3}[.-]?){2}\d{4}\b/g, '[PHONE-REDACTED]');
                // Redact dates of birth (MM/DD/YYYY, MM-DD-YYYY, YYYY-MM-DD)
                exception.value = exception.value.replace(/\b(?:\d{1,2}[/-]){2}\d{2,4}\b/g, '[DOB-REDACTED]');
                exception.value = exception.value.replace(/\b\d{4}-\d{2}-\d{2}\b/g, '[DOB-REDACTED]');
              }
            }
          }

          // Scrub breadcrumbs
          if (event.breadcrumbs !== undefined) {
            for (const crumb of event.breadcrumbs) {
              if (crumb.data !== undefined) {
                // Remove sensitive fields from breadcrumb data
                const sensitiveFields = ['password', 'ssn', 'dob', 'diagnosis', 'medical_history', 'medications', 'notes'];
                for (const field of sensitiveFields) {
                  if (field in crumb.data) {
                    crumb.data[field] = '[REDACTED]';
                  }
                }
              }
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

export function setUserContext(user: { id: string; email?: string; role?: string; organization_id?: string } | null): void {
  if (process.env.NODE_ENV === 'production' && Sentry !== null) {
    try {
      const scope = Sentry.getCurrentScope();
      if (user !== null) {
        scope.setUser({
          id: user.id,
          email: user.email
        });
        // Add custom tags for filtering
        if (user.role !== undefined) {
          scope.setTag('role', user.role);
        }
        if (user.organization_id !== undefined) {
          scope.setTag('organization_id', user.organization_id);
        }
      } else {
        scope.setUser(null);
      }
    } catch {
      // Sentry not available or setUser not supported
      logger.warn({ userId: user?.id }, 'Failed to set Sentry user context');
    }
  }
}

export function setContext(key: string, context: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'production' && Sentry !== null) {
    try {
      const scope = Sentry.getCurrentScope();
      scope.setContext(key, context);
    } catch {
      logger.warn({ contextKey: key }, 'Failed to set Sentry context');
    }
  }
}

export function addBreadcrumb(message: string, data?: Record<string, unknown>, category?: string): void {
  if (process.env.NODE_ENV === 'production' && Sentry !== null) {
    Sentry.addBreadcrumb({
      message,
      category: category ?? 'custom',
      level: 'info',
      data,
      timestamp: Date.now() / 1000,
    });
  }
  
  // Also log breadcrumb for local development
  logger.debug({ breadcrumb: message, data, category }, 'Breadcrumb added');
}
