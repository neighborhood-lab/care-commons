import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import logger from './logger.js';

export function initializeErrorTracking(): void {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      integrations: [
        nodeProfilingIntegration(),
      ],
      tracesSampleRate: 0.1, // 10% of requests
      profilesSampleRate: 0.1,

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
  Sentry.setUser({
    id: user.id,
    email: user.email
  });
}
