/**
 * Authentication and user context middleware
 */

import { Request, Response, NextFunction } from 'express';
import { UserContext } from '@care-commons/core';

/**
 * Extend Express Request to include userContext
 */
declare global {
  namespace Express {
    interface Request {
      userContext?: UserContext;
    }
  }
}

/**
 * Mock authentication middleware
 * In production, this would validate JWT tokens and populate context
 */
export function authContextMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  // Extract from headers (set by frontend or API gateway)
  const userId = req.header('X-User-Id') || 'system';
  const organizationId = req.header('X-Organization-Id') || '';
  const branchId = req.header('X-Branch-Id');
  const roles = (req.header('X-User-Roles') || 'CAREGIVER').split(',') as any[];
  const permissions = (req.header('X-User-Permissions') || '').split(',').filter(Boolean);

  // Set user context on request
  req.userContext = {
    userId,
    organizationId,
    branchIds: branchId ? [branchId] : [],
    roles,
    permissions,
  };

  next();
}

/**
 * Require authentication middleware
 * Returns 401 if no valid user context
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.userContext || !req.userContext.userId) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }
  next();
}
