/**
 * Express Middleware for Feature Flags
 *
 * Provides request-scoped feature flag evaluation context and utilities.
 */

import type { Request, Response, NextFunction } from 'express';
import { getFeatureFlagService } from './service.js';
import type { FlagEvaluationContext, FeatureFlagKey } from './types.js';

/**
 * Extended Request with feature flag utilities
 */
export interface RequestWithFeatureFlags extends Request {
  featureFlags: {
    /** Evaluation context for this request */
    context: FlagEvaluationContext;
    /** Check if a flag is enabled */
    isEnabled: (key: FeatureFlagKey | string, defaultValue?: boolean) => Promise<boolean>;
    /** Get string flag value */
    getString: (key: FeatureFlagKey | string, defaultValue?: string) => Promise<string>;
    /** Get number flag value */
    getNumber: (key: FeatureFlagKey | string, defaultValue?: number) => Promise<number>;
    /** Get object flag value */
    getObject: <T extends Record<string, unknown>>(
      key: FeatureFlagKey | string,
      defaultValue: T
    ) => Promise<T>;
    /** Get all flag values */
    getAllValues: () => Promise<Record<string, unknown>>;
  };
}

/**
 * Build evaluation context from request
 */
function buildContextFromRequest(req: Request): FlagEvaluationContext {
  const user = (req as any).user; // Assuming auth middleware sets req.user

  return {
    // User context
    userId: user?.id,
    email: user?.email,
    role: user?.role,

    // Organization context
    organizationId: user?.organizationId || (req as any).organizationId,
    branchId: user?.branchId || (req as any).branchId,
    stateCode: (req as any).stateCode,

    // Request context
    platform: 'api',
    appVersion: req.headers['x-app-version'] as string,
    deviceType: req.headers['x-device-type'] as string,

    // IP and geolocation (if needed)
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],

    // Timestamp
    timestamp: new Date().toISOString(),
  };
}

/**
 * Feature flag middleware
 *
 * Attaches feature flag utilities to the request object.
 *
 * Usage:
 * ```typescript
 * app.use(featureFlagMiddleware);
 *
 * app.get('/api/endpoint', async (req: RequestWithFeatureFlags, res) => {
 *   if (await req.featureFlags.isEnabled('new-feature')) {
 *     // New feature logic
 *   } else {
 *     // Old feature logic
 *   }
 * });
 * ```
 */
export function featureFlagMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const service = getFeatureFlagService();
    const context = buildContextFromRequest(req);

    // Attach feature flag utilities to request
    (req as RequestWithFeatureFlags).featureFlags = {
      context,

      isEnabled: async (key: FeatureFlagKey | string, defaultValue = false) => {
        return service.isFlagEnabled(key, context, defaultValue);
      },

      getString: async (key: FeatureFlagKey | string, defaultValue = '') => {
        return service.getStringFlag(key, context, defaultValue);
      },

      getNumber: async (key: FeatureFlagKey | string, defaultValue = 0) => {
        return service.getNumberFlag(key, context, defaultValue);
      },

      getObject: async <T extends Record<string, unknown>>(
        key: FeatureFlagKey | string,
        defaultValue: T
      ) => {
        return service.getObjectFlag(key, context, defaultValue);
      },

      getAllValues: async () => {
        return service.getAllFlagValues(context);
      },
    };

    next();
  } catch (error) {
    console.error('Feature flag middleware error:', error);
    // Continue without feature flags
    next();
  }
}

/**
 * Guard middleware to check if a flag is enabled
 *
 * Returns 404 if flag is disabled.
 *
 * Usage:
 * ```typescript
 * app.get('/api/new-feature',
 *   requireFlag('new-feature'),
 *   async (req, res) => {
 *     // Handler only runs if flag is enabled
 *   }
 * );
 * ```
 */
export function requireFlag(flagKey: FeatureFlagKey | string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqWithFlags = req as RequestWithFeatureFlags;

      if (!reqWithFlags.featureFlags) {
        // Feature flags not initialized
        res.status(500).json({ error: 'Feature flag system not initialized' });
        return;
      }

      const enabled = await reqWithFlags.featureFlags.isEnabled(flagKey);

      if (enabled) {
        next();
      } else {
        res.status(404).json({ error: 'Feature not available' });
      }
    } catch (error) {
      console.error(`Error checking flag '${flagKey}':`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Conditional middleware based on flag
 *
 * Usage:
 * ```typescript
 * app.get('/api/endpoint',
 *   conditionalMiddleware(
 *     'use-rate-limiting',
 *     rateLimitMiddleware, // Applied if flag is enabled
 *     noOpMiddleware       // Applied if flag is disabled
 *   ),
 *   handler
 * );
 * ```
 */
export function conditionalMiddleware(
  flagKey: FeatureFlagKey | string,
  enabledMiddleware: (req: Request, res: Response, next: NextFunction) => void,
  disabledMiddleware?: (req: Request, res: Response, next: NextFunction) => void
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqWithFlags = req as RequestWithFeatureFlags;

      if (!reqWithFlags.featureFlags) {
        next();
        return;
      }

      const enabled = await reqWithFlags.featureFlags.isEnabled(flagKey);

      if (enabled) {
        enabledMiddleware(req, res, next);
      } else if (disabledMiddleware) {
        disabledMiddleware(req, res, next);
      } else {
        next();
      }
    } catch (error) {
      console.error(`Error in conditional middleware for flag '${flagKey}':`, error);
      next();
    }
  };
}
