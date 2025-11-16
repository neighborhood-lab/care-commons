/**
 * Authentication Middleware
 * 
 * Express middleware for protecting routes and enforcing authentication.
 * Integrates with JWT tokens and role-based access control.
 */

import { Request, Response, NextFunction } from 'express';
import { JWTUtils, TokenPayload } from '../utils/jwt-utils';
import { Database } from '../db/connection';
import { AuditService } from '../audit/audit-service';

/**
 * Extend Express Request type to include authenticated user
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * User status from database
 */
interface UserStatus {
  status: string;
  token_version: number;
}

export class AuthMiddleware {
  private auditService: AuditService;

  constructor(private db: Database) {
    this.auditService = new AuditService(db);
  }

  /**
   * Require valid JWT token
   * Validates token, checks user status, and attaches user to request
   * 
   * Usage:
   *   router.get('/protected', authMiddleware.requireAuth, handler)
   */
  requireAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers['authorization'];
      
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/prefer-optional-chain
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: 'No authentication token provided',
          code: 'NO_TOKEN'
        });
        return;
      }

      const token = authHeader.slice(7); // Remove 'Bearer ' prefix

      // Verify and decode token
      let payload: TokenPayload;
      try {
        payload = JWTUtils.verifyAccessToken(token);
      } catch (error) {
        res.status(401).json({
          success: false,
          error: error instanceof Error ? error.message : 'Invalid token',
          code: 'INVALID_TOKEN'
        });
        return;
      }

      // Verify user still exists and is active
      const result = await this.db.query(
        'SELECT status, token_version FROM users WHERE id = $1 AND deleted_at IS NULL',
        [payload.userId]
      );

      const user = result.rows[0] as unknown as UserStatus | undefined;

      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'User account not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      if (user.status !== 'ACTIVE') {
        res.status(401).json({
          success: false,
          error: 'User account is inactive',
          code: 'ACCOUNT_INACTIVE'
        });
        return;
      }

      // Verify token version matches (for logout invalidation)
      if (user.token_version !== payload.tokenVersion) {
        res.status(401).json({
          success: false,
          error: 'Token has been revoked - please login again',
          code: 'TOKEN_REVOKED'
        });
        return;
      }

      // Attach user to request
      req.user = payload;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Authentication error',
        code: 'AUTH_ERROR'
      });
    }
  };

  /**
   * Require specific role(s)
   * Must be used after requireAuth middleware
   * 
   * Usage:
   *   router.post('/admin', 
   *     authMiddleware.requireAuth,
   *     authMiddleware.requireRole(['ORG_ADMIN', 'SUPER_ADMIN']),
   *     handler
   *   )
   * 
   * @param roles - Array of roles, user must have at least one
   */
  requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'NOT_AUTHENTICATED'
        });
        return;
      }

      const hasRole = roles.some(role => req.user!.roles.includes(role));

      if (!hasRole) {
        // Log unauthorized access attempt
        void this.auditService.logEvent(
          {
            userId: req.user.userId,
            organizationId: req.user.organizationId,
            roles: req.user.roles,
            permissions: req.user.permissions,
            branchIds: []
          },
          {
            eventType: 'AUTHORIZATION',
            resource: req.path,
            resourceId: req.user.userId,
            action: 'UNAUTHORIZED_ROLE_ACCESS_ATTEMPT',
            result: 'FAILURE',
            metadata: {
              requiredRoles: roles,
              userRoles: req.user.roles,
              method: req.method,
              path: req.path
            },
            ipAddress: req.ip ?? req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
          }
        ).catch((error: unknown) => {
          console.error('Failed to log unauthorized role access attempt:', error);
        });

        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRoles: roles,
          userRoles: req.user.roles
        });
        return;
      }

      next();
    };
  };

  /**
   * Require specific permission(s)
   * Must be used after requireAuth middleware
   * 
   * Usage:
   *   router.delete('/clients/:id',
   *     authMiddleware.requireAuth,
   *     authMiddleware.requirePermission(['clients:delete']),
   *     handler
   *   )
   * 
   * @param permissions - Array of permissions, user must have at least one
   */
  requirePermission = (permissions: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'NOT_AUTHENTICATED'
        });
        return;
      }

      const hasPermission = permissions.some(permission =>
        req.user!.permissions.includes(permission)
      );

      if (!hasPermission) {
        // Log unauthorized access attempt
        void this.auditService.logEvent(
          {
            userId: req.user.userId,
            organizationId: req.user.organizationId,
            roles: req.user.roles,
            permissions: req.user.permissions,
            branchIds: []
          },
          {
            eventType: 'AUTHORIZATION',
            resource: req.path,
            resourceId: req.user.userId,
            action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
            result: 'FAILURE',
            metadata: {
              requiredPermissions: permissions,
              userPermissions: req.user.permissions,
              method: req.method,
              path: req.path
            },
            ipAddress: req.ip ?? req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
          }
        ).catch((error: unknown) => {
          console.error('Failed to log unauthorized access attempt:', error);
        });

        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredPermissions: permissions,
          userPermissions: req.user.permissions
        });
        return;
      }

      next();
    };
  };

  /**
   * Optional authentication
   * Attaches user to request if valid token provided, but doesn't require it
   * Useful for endpoints that behave differently for authenticated vs anonymous users
   * 
   * Usage:
   *   router.get('/public-data', authMiddleware.optionalAuth, handler)
   */
  optionalAuth = async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers['authorization'];
      
      // No token provided - continue without authentication
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/prefer-optional-chain
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next();
        return;
      }

      const token = authHeader.slice(7);

      // Try to verify token
      try {
        const payload = JWTUtils.verifyAccessToken(token);

        // Verify user still exists and is active
        const result = await this.db.query(
          'SELECT status, token_version FROM users WHERE id = $1 AND deleted_at IS NULL',
          [payload.userId]
        );

        const user = result.rows[0] as unknown as UserStatus | undefined;

        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/prefer-optional-chain
        if (user && user.status === 'ACTIVE' && user.token_version === payload.tokenVersion) {
          req.user = payload;
        }
      } catch {
        // Invalid token - continue without authentication
        // Don't send error response, just proceed
      }

      next();
    } catch (error) {
      console.error('Optional auth middleware error:', error);
      next(); // Continue even on error
    }
  };

  /**
   * Require same organization
   * Ensures user can only access resources from their organization
   * Must be used after requireAuth middleware
   * 
   * Usage:
   *   router.get('/organizations/:orgId/clients',
   *     authMiddleware.requireAuth,
   *     authMiddleware.requireSameOrganization('orgId'),
   *     handler
   *   )
   * 
   * @param paramName - Name of route parameter containing organization ID
   */
  requireSameOrganization = (paramName: string = 'organizationId') => {
    return (req: Request, res: Response, next: NextFunction): void => {
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'NOT_AUTHENTICATED'
        });
        return;
      }

      const orgIdFromParam = req.params[paramName];

      if (orgIdFromParam === undefined || orgIdFromParam === '') {
        res.status(400).json({
          success: false,
          error: `Missing ${paramName} parameter`,
          code: 'MISSING_PARAMETER'
        });
        return;
      }

      if (orgIdFromParam !== req.user.organizationId) {
        // Log unauthorized cross-org access attempt
        void this.auditService.logEvent(
          {
            userId: req.user.userId,
            organizationId: req.user.organizationId,
            roles: req.user.roles,
            permissions: req.user.permissions,
            branchIds: []
          },
          {
            eventType: 'AUTHORIZATION',
            resource: req.path,
            resourceId: orgIdFromParam,
            action: 'CROSS_ORG_ACCESS_ATTEMPT',
            result: 'FAILURE',
            metadata: {
              requestedOrganizationId: orgIdFromParam,
              userOrganizationId: req.user.organizationId,
              method: req.method,
              path: req.path
            },
            ipAddress: req.ip ?? req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
          }
        ).catch((error: unknown) => {
          console.error('Failed to log cross-org access attempt:', error);
        });

        res.status(403).json({
          success: false,
          error: 'Access denied to resources from different organization',
          code: 'ORGANIZATION_MISMATCH'
        });
        return;
      }

      next();
    };
  };

  /**
   * Enforce organization scoping on all requests
   * Sets organization context from JWT and validates query/body parameters
   * Must be used after requireAuth middleware
   * 
   * This middleware ensures that:
   * - All database queries are scoped to user's organization
   * - Query parameters cannot override organization_id
   * - Request body cannot specify different organization_id
   * 
   * Usage:
   *   router.use(authMiddleware.requireAuth);
   *   router.use(authMiddleware.enforceOrganizationScoping);
   */
  enforceOrganizationScoping = (req: Request, res: Response, next: NextFunction): void => {
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const userOrgId = req.user.organizationId;

    // Check query parameters for organization_id
    if (req.query['organizationId'] !== undefined) {
      const queryOrgId = req.query['organizationId'] as string;
      if (queryOrgId !== userOrgId) {
        // Log unauthorized attempt
        void this.auditService.logEvent(
          {
            userId: req.user.userId,
            organizationId: userOrgId,
            roles: req.user.roles,
            permissions: req.user.permissions,
            branchIds: []
          },
          {
            eventType: 'AUTHORIZATION',
            resource: req.path,
            resourceId: queryOrgId,
            action: 'ORG_ID_OVERRIDE_ATTEMPT_QUERY',
            result: 'FAILURE',
            metadata: {
              requestedOrganizationId: queryOrgId,
              userOrganizationId: userOrgId,
              method: req.method,
              path: req.path
            },
            ipAddress: req.ip ?? req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
          }
        ).catch((error: unknown) => {
          console.error('Failed to log org override attempt:', error);
        });

        res.status(403).json({
          success: false,
          error: 'Cannot access resources from different organization',
          code: 'ORGANIZATION_MISMATCH'
        });
        return;
      }
    }

    // Check request body for organization_id (for POST/PUT/PATCH)
    if (req.body !== null && typeof req.body === 'object' && 'organizationId' in req.body) {
      const bodyOrgId = req.body['organizationId'] as string;
      if (bodyOrgId !== userOrgId) {
        // Log unauthorized attempt
        void this.auditService.logEvent(
          {
            userId: req.user.userId,
            organizationId: userOrgId,
            roles: req.user.roles,
            permissions: req.user.permissions,
            branchIds: []
          },
          {
            eventType: 'AUTHORIZATION',
            resource: req.path,
            resourceId: bodyOrgId,
            action: 'ORG_ID_OVERRIDE_ATTEMPT_BODY',
            result: 'FAILURE',
            metadata: {
              requestedOrganizationId: bodyOrgId,
              userOrganizationId: userOrgId,
              method: req.method,
              path: req.path
            },
            ipAddress: req.ip ?? req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
          }
        ).catch((error: unknown) => {
          console.error('Failed to log org override attempt:', error);
        });

        res.status(403).json({
          success: false,
          error: 'Cannot create/update resources for different organization',
          code: 'ORGANIZATION_MISMATCH'
        });
        return;
      }
    }

    // Ensure organizationId is set on body for create/update operations
    // This prevents accidental omission of org scoping
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      if (req.body !== null && typeof req.body === 'object') {
        // Force the organization ID to match the authenticated user
        req.body['organizationId'] = userOrgId;
      }
    }

    next();
  };
}
