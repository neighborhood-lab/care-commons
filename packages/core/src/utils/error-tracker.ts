import logger from './logger.js';

// Dynamic import for Sentry to avoid bundling in browser environments
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Sentry: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let nodeProfilingIntegration: any = null;

// Check if we're in a Node.js environment (not browser)
const isNodeEnvironment = typeof process !== 'undefined' &&
  process.versions != null &&
  process.versions.node != null;

async function loadSentryModules(): Promise<void> {
  // Only load Sentry in Node.js environment
  if (!isNodeEnvironment) {
    return;
  }

  try {
    // Dynamically import @sentry/node
    Sentry = await import('@sentry/node');

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
      if (!Sentry) {
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const integrations: any[] = [];
      
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        beforeSend(event: any, _hint: any): any {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function captureException(error: any, context?: any): void {
  logger.error({ error, ...context }, 'Exception captured');

  if (process.env.NODE_ENV === 'production' && Sentry) {
    Sentry.captureException(error, {
      extra: context
    });
  }
}

export function setUserContext(user: { id: string; email?: string }): void {
  if (process.env.NODE_ENV === 'production' && Sentry) {
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
