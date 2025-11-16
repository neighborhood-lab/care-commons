/**
 * @care-commons/core - Base Types
 * 
 * Fundamental types shared across all verticals:
 * - Entity identity and lifecycle
 * - Audit metadata
 * - User context and permissions
 * - Error handling
 */

// eslint-disable-next-line sonarjs/redundant-type-aliases -- UUID provides semantic meaning
export type UUID = string;
export type Timestamp = Date;

/**
 * Base entity with lifecycle tracking
 */
export interface Entity {
  id: UUID;
  createdAt: Timestamp;
  createdBy: UUID;
  updatedAt: Timestamp;
  updatedBy: UUID;
  version: number; // Optimistic locking
}

/**
 * Soft-deletable entity
 */
export interface SoftDeletable {
  deletedAt: Timestamp | null;
  deletedBy: UUID | null;
}

/**
 * Full audit metadata for entities requiring compliance tracking
 */
export interface Auditable extends Entity {
  revisionHistory: Revision[];
}

/**
 * Revision record for audit trail
 */
export interface Revision {
  revisionId: UUID;
  timestamp: Timestamp;
  userId: UUID;
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';
  changes: Record<string, { from: unknown; to: unknown }>;
  reason?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Lifecycle states common across entities
 */
export type LifecycleStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'ARCHIVED';

/**
 * User context for permission and audit
 */
export interface UserContext {
  userId: UUID;
  roles: string[];  // Accepting string[] instead of Role[] for flexibility
  permissions: string[];  // Accepting string[] instead of Permission[] for flexibility
  organizationId?: UUID; // Optional - system users and super admins may not have an organization
  branchIds: UUID[];
}

/**
 * Role-based access control
 */
export type Role =
  | 'SUPER_ADMIN'
  | 'ORG_ADMIN'
  | 'BRANCH_ADMIN'
  | 'COORDINATOR'
  | 'SCHEDULER'
  | 'CAREGIVER'
  | 'FAMILY'
  | 'CLIENT'
  | 'BILLING'
  | 'HR'
  | 'AUDITOR'
  | 'READ_ONLY';

/**
 * Fine-grained permissions
 */
// eslint-disable-next-line sonarjs/redundant-type-aliases -- Permission provides semantic meaning
export type Permission = string; // e.g., "clients:read", "clients:write", "clients:delete"

/**
 * Standard error types
 */
export class DomainError extends Error {
  public statusCode: number;

  constructor(
    message: string,
    public code: string,
    statusCode: number = 500,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DomainError';
    this.statusCode = statusCode;
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, context);
    this.name = 'ValidationError';
  }
}

export class PermissionError extends DomainError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'PERMISSION_DENIED', 403, context);
    this.name = 'PermissionError';
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'NOT_FOUND', 404, context);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFLICT', 409, context);
    this.name = 'ConflictError';
  }
}

export class AuthenticationError extends DomainError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'AUTHENTICATION_FAILED', 401, context);
    this.name = 'AuthenticationError';
  }
}

/**
 * Result type for operations that may fail
 */
export type Result<T, E = DomainError> =
  | { success: true; value: T }
  | { success: false; error: E };

/**
 * Pagination
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Sync metadata for offline-first architecture
 */
export interface SyncMetadata {
  syncId: UUID;
  lastSyncedAt: Timestamp | null;
  syncStatus: 'SYNCED' | 'PENDING' | 'CONFLICT';
  conflictData?: unknown;
}

/**
 * US State Codes
 * 
 * Two-letter postal abbreviations for all 50 states + DC + territories.
 * Used for state-specific compliance validation and regulatory requirements.
 */
export type StateCode =
  | 'AL' | 'AK' | 'AZ' | 'AR' | 'CA' | 'CO' | 'CT' | 'DE' | 'FL' | 'GA'
  | 'HI' | 'ID' | 'IL' | 'IN' | 'IA' | 'KS' | 'KY' | 'LA' | 'ME' | 'MD'
  | 'MA' | 'MI' | 'MN' | 'MS' | 'MO' | 'MT' | 'NE' | 'NV' | 'NH' | 'NJ'
  | 'NM' | 'NY' | 'NC' | 'ND' | 'OH' | 'OK' | 'OR' | 'PA' | 'RI' | 'SC'
  | 'SD' | 'TN' | 'TX' | 'UT' | 'VT' | 'VA' | 'WA' | 'WV' | 'WI' | 'WY'
  | 'DC' | 'PR' | 'VI' | 'GU' | 'AS' | 'MP';

/**
 * UUID validation utilities
 */
export const UUID_REGEX = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i;

/**
 * Validates if a string is a valid UUID v4
 */
export function isValidUUID(value: unknown): value is UUID {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

/**
 * Validates and returns a UUID, throwing ValidationError if invalid
 */
export function requireValidUUID(value: unknown, fieldName: string): UUID {
  if (!isValidUUID(value)) {
    throw new ValidationError(`${fieldName} must be a valid UUID`, { value });
  }
  return value;
}
