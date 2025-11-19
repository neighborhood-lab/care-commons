/**
 * Sentry Error Tracking - Mobile (React Native / Expo)
 * 
 * Initializes Sentry for error monitoring and performance tracking
 * in the React Native mobile application.
 * 
 * Gracefully handles Sentry load failures to prevent app crashes.
 */

import Constants from 'expo-constants';

// Dynamically import Sentry with error handling for compatibility issues
let SentryModule: typeof import('@sentry/react-native') | undefined;
try {
  SentryModule = require('@sentry/react-native');
} catch (error) {
  console.warn('Sentry module failed to load - error tracking disabled:', error);
}

/**
 * Initialize Sentry error tracking for mobile app
 * 
 * Features:
 * - Automatic error capture
 * - Performance monitoring (10% sample rate)
 * - User context tracking
 * - Breadcrumbs for debugging
 * - PII scrubbing (PHI, passwords, SSNs)
 * - Native crash reporting
 */
export function initializeSentry(): void {
  // Skip if Sentry failed to load
  if (!SentryModule) {
    console.log('Sentry not available - skipping initialization');
    return;
  }

  // Only initialize in production or staging
  if (__DEV__) {
    console.log('DEV mode - Sentry disabled');
    return;
  }

  const dsn = Constants.expoConfig?.extra?.sentryDsn;
  
  if (!dsn) {
    console.warn('SENTRY_DSN not configured - Sentry error tracking disabled');
    return;
  }

  SentryModule.init({
    dsn,
    environment: Constants.expoConfig?.extra?.environment ?? 'production',
    
    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% of transactions
    
    // Enable native crash reporting
    enableNative: true,
    enableNativeCrashHandling: true,
    
    // Enable automatic session tracking
    enableAutoSessionTracking: true,
    
    // PII Scrubbing
    beforeSend(event, _hint) {
      // Remove sensitive data before sending to Sentry
      if (event.request) {
        // Remove authorization headers
        if (event.request.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
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
      // Network errors (user offline)
      'NetworkError',
      'Network request failed',
      'TypeError: Network request failed',
      // Expo common errors
      'Invariant Violation',
    ],
  });
}

/**
 * Set user context for error tracking
 * 
 * @param user - User information (id, email, role)
 */
export function setUser(user: { id: string; email?: string; role?: string; organization_id?: string } | null): void {
  if (!SentryModule) return;
  
  if (user) {
    SentryModule.setUser({
      id: user.id,
      email: user.email,
      // Custom tags for filtering
      role: user.role,
      organization_id: user.organization_id,
    });
  } else {
    SentryModule.setUser(null);
  }
}

/**
 * Add custom context to error reports
 * 
 * @param context - Key-value pairs of context data
 */
export function setContext(key: string, context: Record<string, unknown>): void {
  if (!SentryModule) return;
  SentryModule.setContext(key, context);
}

/**
 * Manually capture an exception
 * 
 * @param error - Error to capture
 * @param context - Additional context
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  if (!SentryModule) return;
  if (context) {
    SentryModule.captureException(error, { extra: context });
  } else {
    SentryModule.captureException(error);
  }
}

/**
 * Add a breadcrumb for debugging
 * 
 * @param message - Breadcrumb message
 * @param data - Additional data
 */
export function addBreadcrumb(message: string, data?: Record<string, unknown>): void {
  if (!SentryModule) return;
  SentryModule.addBreadcrumb({
    message,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Wrap the root component with Sentry profiler
 * 
 * Usage:
 * export default wrapWithSentry(App);
 */
export const wrapWithSentry = SentryModule?.wrap ?? ((component: any) => component);
