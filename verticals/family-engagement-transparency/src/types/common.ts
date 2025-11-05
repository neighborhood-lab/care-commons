/**
 * Common Types
 *
 * Shared types used across the family engagement vertical
 */

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * User context for operations
 */
export interface UserContext {
  userId: string;
  organizationId: string;
  permissions?: string[];
  role?: string;
}

/**
 * Audit info
 */
export interface AuditInfo {
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  version: number;
}

/**
 * Date range filter
 */
export interface DateRangeFilter {
  from?: Date;
  to?: Date;
}

/**
 * Result with success/error
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Async result
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

/**
 * Operation status
 */
export interface OperationStatus {
  success: boolean;
  message?: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Bulk operation result
 */
export interface BulkOperationResult<T> {
  successful: T[];
  failed: Array<{
    input: T;
    error: string;
  }>;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

/**
 * Service options
 */
export interface ServiceOptions {
  skipValidation?: boolean;
  skipNotification?: boolean;
  skipAudit?: boolean;
  dryRun?: boolean;
}

/**
 * Search options
 */
export interface SearchOptions extends PaginationParams {
  includeDeleted?: boolean;
  includeInactive?: boolean;
}
