/**
 * Sentry Error Tracking - Web Frontend
 * 
 * Initializes Sentry for error monitoring and performance tracking
 * in the React web application.
 */

import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry error tracking for web frontend
 * 
 * Features:
 * - Automatic error capture
 * - Performance monitoring (10% sample rate)
 * - User context tracking
 * - Breadcrumbs for debugging
 * - PII scrubbing (PHI, passwords, SSNs)
 */
export function initializeSentry(): void {
  // Only initialize in production or staging
  if (import.meta.env.MODE === 'development' || import.meta.env.MODE === 'test') {
    return;
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.warn('VITE_SENTRY_DSN not configured - Sentry error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    
    // Performance Monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Session replay for debugging
        maskAllText: true,  // Mask all text to protect PHI
        blockAllMedia: true, // Block all media to protect PHI
      }),
    ],

    // Sample rates
    tracesSampleRate: 0.1, // 10% of transactions
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // PII Scrubbing
    beforeSend(event, _hint) {
      // Remove sensitive data before sending to Sentry
      if (event.request) {
        // Remove authorization headers
        if (event.request.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }
        
        // Remove query parameters that might contain sensitive data
        if (event.request.query_string) {
          event.request.query_string = '[FILTERED]';
        }
      }

      // Scrub PHI-like patterns from exception messages
      if (event.exception) {
        for (const exception of event.exception.values || []) {
          if (exception.value) {
            // Redact SSN patterns (###-##-####)
            exception.value = exception.value.replace(/\d{3}-\d{2}-\d{4}/g, '[SSN-REDACTED]');
            // Redact email addresses
            exception.value = exception.value.replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, '[EMAIL-REDACTED]');
            // Redact phone numbers
            exception.value = exception.value.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE-REDACTED]');
          }
        }
      }

      // Scrub breadcrumbs
      if (event.breadcrumbs) {
        for (const crumb of event.breadcrumbs) {
          if (crumb.data) {
            // Remove sensitive fields from breadcrumb data
            const sensitiveFields = ['password', 'ssn', 'dob', 'diagnosis', 'medical_history'];
            for (const field of sensitiveFields) {
              if (field in crumb.data) {
                crumb.data[field] = '[REDACTED]';
              }
            }
          }
        }
      }

      return event;
    },

    // Ignore common non-critical errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'chrome-extension://',
      'moz-extension://',
      // Network errors (user offline)
      'NetworkError',
      'Network request failed',
      // ResizeObserver loop errors (benign)
      'ResizeObserver loop limit exceeded',
    ],
  });
}

/**
 * Set user context for error tracking
 * 
 * @param user - User information (id, email, role)
 */
export function setUser(user: { id: string; email?: string; role?: string; organization_id?: string } | null): void {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      // Custom tags for filtering
      role: user.role,
      organization_id: user.organization_id,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add custom context to error reports
 * 
 * @param context - Key-value pairs of context data
 */
export function setContext(key: string, context: Record<string, unknown>): void {
  Sentry.setContext(key, context);
}

/**
 * Manually capture an exception
 * 
 * @param error - Error to capture
 * @param context - Additional context
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  if (context) {
    Sentry.captureException(error, { extra: context });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Add a breadcrumb for debugging
 * 
 * @param message - Breadcrumb message
 * @param data - Additional data
 */
export function addBreadcrumb(message: string, data?: Record<string, unknown>): void {
  Sentry.addBreadcrumb({
    message,
    data,
    timestamp: Date.now() / 1000,
  });
}
