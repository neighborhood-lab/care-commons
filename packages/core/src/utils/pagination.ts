/**
 * Pagination utilities for database queries
 *
 * Provides consistent pagination across all API endpoints
 */

import type { Knex } from 'knex';
import type { PaginationParams, PaginatedResult } from '../types/base.js';

/**
 * Validate and normalize pagination parameters
 *
 * @param page Page number (1-indexed)
 * @param limit Items per page
 * @returns Validated pagination parameters
 */
export function validatePaginationParams(
  page?: number | string,
  limit?: number | string
): PaginationParams {
  const pageValue = parseInt(String(page ?? 1), 10);
  const normalizedPage = Math.max(1, Number.isNaN(pageValue) ? 1 : pageValue);

  const limitValue = parseInt(String(limit ?? 50), 10);
  const normalizedLimit = Math.min(
    Math.max(1, Number.isNaN(limitValue) ? 50 : limitValue),
    100 // Max limit to prevent abuse
  );

  return {
    page: normalizedPage,
    limit: normalizedLimit
  };
}

/**
 * Paginate a Knex query
 *
 * @param query Knex query builder
 * @param params Pagination parameters
 * @returns Paginated result with data and metadata
 *
 * @example
 * ```typescript
 * const query = knex('clients').where('deleted_at', null);
 * const result = await paginate(query, { page: 1, limit: 50 });
 * ```
 */
export async function paginate<T>(
  query: Knex.QueryBuilder,
  params: PaginationParams
): Promise<PaginatedResult<T>> {
  const { page, limit } = params;
  const offset = (page - 1) * limit;

  // Clone query for count to avoid modifying original
  const countQuery = query
    .clone()
    .clearSelect()
    .clearOrder()
    .clearGroup()
    .count('* as count')
    .first();

  // Get total count
  const countResult = await countQuery;
  const total = parseInt(String(countResult?.count ?? 0), 10);
  const totalPages = Math.ceil(total / limit);

  // Get paginated data
  const items = await query.limit(limit).offset(offset);

  return {
    items: items as T[],
    total,
    page,
    limit,
    totalPages
  };
}

/**
 * Paginate raw data array (in-memory pagination)
 * Use only for small datasets that are already loaded
 *
 * @param data Array of data
 * @param params Pagination parameters
 * @returns Paginated result
 */
export function paginateArray<T>(
  data: T[],
  params: PaginationParams
): PaginatedResult<T> {
  const { page, limit } = params;
  const total = data.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  const items = data.slice(offset, offset + limit);

  return {
    items,
    total,
    page,
    limit,
    totalPages
  };
}

/**
 * Generate pagination links for API responses
 *
 * @param baseUrl Base URL for the endpoint
 * @param params Current pagination parameters
 * @param total Total number of items
 * @returns Pagination links object
 */
export function generatePaginationLinks(
  baseUrl: string,
  params: PaginationParams,
  total: number
): {
  first: string;
  last: string;
  next: string | null;
  previous: string | null;
} {
  const { page, limit } = params;
  const totalPages = Math.ceil(total / limit);

  const buildUrl = (p: number): string => {
    // Parse URL to add query parameters
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}page=${p}&limit=${limit}`;
  };

  return {
    first: buildUrl(1),
    last: buildUrl(totalPages),
    next: page < totalPages ? buildUrl(page + 1) : null,
    previous: page > 1 ? buildUrl(page - 1) : null
  };
}

/**
 * Calculate offset from page and limit
 *
 * @param page Page number (1-indexed)
 * @param limit Items per page
 * @returns Offset for database query
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Calculate page from offset and limit
 *
 * @param offset Offset
 * @param limit Items per page
 * @returns Page number (1-indexed)
 */
export function calculatePage(offset: number, limit: number): number {
  return Math.floor(offset / limit) + 1;
}

/**
 * Cursor-based pagination helper
 * More efficient for large datasets and real-time data
 */
export interface CursorPaginationParams {
  cursor?: string;
  limit: number;
}

export interface CursorPaginatedResult<T> {
  data: T[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
    limit: number;
  };
}

/**
 * Apply cursor-based pagination to a query
 *
 * @param query Knex query builder
 * @param cursorField Field to use for cursor (e.g., 'created_at')
 * @param params Cursor pagination parameters
 * @returns Cursor paginated result
 */
export async function paginateWithCursor<T extends Record<string, unknown>>(
  query: Knex.QueryBuilder,
  cursorField: string,
  params: CursorPaginationParams
): Promise<CursorPaginatedResult<T>> {
  const { cursor, limit } = params;

  // Apply cursor filter if provided
  if (cursor !== undefined && cursor !== '' && cursor.length > 0) {
    const decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8');
    query = query.where(cursorField, '>', decodedCursor);
  }

  // Fetch one extra item to determine if there are more results
  const data = (await query
    .orderBy(cursorField, 'asc')
    .limit(limit + 1)) as T[];

  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;

  // Generate next cursor from the last item
  const lastItem = items[items.length - 1];
  const nextCursor = hasMore && items.length > 0 && lastItem !== undefined
    ? Buffer.from(String(lastItem[cursorField])).toString('base64')
    : null;

  return {
    data: items,
    pagination: {
      nextCursor,
      hasMore,
      limit
    }
  };
}
