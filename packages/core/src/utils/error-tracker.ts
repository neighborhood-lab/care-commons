import * as Sentry from '@sentry/node';
import logger from './logger.js';

// Dynamic import for profiling integration to avoid bundling issues in browser
let nodeProfilingIntegration: any = null;

async function loadProfilingIntegration() {
  try {
    const module = await import('@sentry/profiling-node');
    nodeProfilingIntegration = module.nodeProfilingIntegration;
  } catch {
    // Profiling integration not available (browser environment)
    nodeProfilingIntegration = null;
  }
}

export function initializeErrorTracking(): void {
  if (process.env.NODE_ENV === 'production') {
    // Load profiling integration asynchronously
    loadProfilingIntegration().then(() => {
      const integrations: any[] = [];
      
      // Only add profiling integration if available (server-side)
      if (nodeProfilingIntegration && typeof globalThis === 'object' && 'window' in globalThis === false) {
        integrations.push(nodeProfilingIntegration());
      }

      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        integrations,
        tracesSampleRate: 0.1, // 10% of requests
        profilesSampleRate: nodeProfilingIntegration ? 0.1 : 0, // Only enable profiling if available

        beforeSend(event, _hint) {
          // Filter out sensitive data
          // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
          if (event.request) {
            delete event.request.cookies;
            // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
            if (event.request.headers) {
              delete event.request.headers['authorization'];
            }
          }
          return event;
        }
      });
    }).catch(() => {
      // Initialize Sentry without profiling if loading fails
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate: 0.1,

        beforeSend(event, _hint) {
          // Filter out sensitive data
          // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
          if (event.request) {
            delete event.request.cookies;
            // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
            if (event.request.headers) {
              delete event.request.headers['authorization'];
            }
          }
          return event;
        }
      });
    });
  }
}

export function captureException(error: Error, context?: Record<string, unknown>): void {
  logger.error({ error, ...context }, 'Exception captured');

  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      extra: context
    });
  }
}

export function setUserContext(user: { id: string; email?: string }): void {
  if (process.env.NODE_ENV === 'production') {
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
