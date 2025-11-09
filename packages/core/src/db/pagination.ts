/**
 * Advanced Pagination Utilities
 *
 * Provides both offset-based and cursor-based pagination for optimal performance
 * with large datasets.
 */

import { Pool } from 'pg';
import { Buffer } from 'node:buffer';

/**
 * Standard offset-based pagination parameters
 */
export interface OffsetPaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Cursor-based pagination parameters
 * More efficient for large datasets and real-time updates
 */
export interface CursorPaginationParams {
  cursor?: string;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Offset-based pagination result
 */
export interface OffsetPaginationResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Cursor-based pagination result
 */
export interface CursorPaginationResult<T> {
  items: T[];
  pagination: {
    nextCursor?: string;
    previousCursor?: string;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    limit: number;
  };
}

/**
 * Decode cursor from base64
 */
export function decodeCursor(cursor: string): {
  id: string;
  timestamp: string;
} {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const [id, timestamp] = decoded.split('|');
    return { id: id!, timestamp: timestamp! };
  } catch {
    throw new Error('Invalid cursor format');
  }
}

/**
 * Encode cursor to base64
 */
export function encodeCursor(id: string, timestamp: string | Date): string {
  const ts = timestamp instanceof Date ? timestamp.toISOString() : timestamp;
  const cursor = `${id}|${ts}`;
  return Buffer.from(cursor, 'utf-8').toString('base64');
}

/**
 * Build offset-based pagination query
 */
export function buildOffsetPaginationQuery(
  baseQuery: string,
  params: OffsetPaginationParams,
  paramOffset = 0
): {
  query: string;
  params: unknown[];
  countQuery: string;
} {
  const { page, limit, sortBy = 'created_at', sortOrder = 'desc' } = params;
  const offset = (page - 1) * limit;

  // Validate sort direction
  const direction = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  // Build paginated query
  const paginatedQuery = `
    ${baseQuery}
    ORDER BY ${sortBy} ${direction}
    LIMIT $${paramOffset + 1} OFFSET $${paramOffset + 2}
  `;

  // Build count query (without ORDER BY, LIMIT, OFFSET)
  const countQuery = baseQuery.replace(/order by .*/gi, '');

  return {
    query: paginatedQuery,
    params: [limit, offset],
    countQuery,
  };
}

/**
 * Build cursor-based pagination query
 * More efficient for large datasets as it doesn't require counting total records
 */
export function buildCursorPaginationQuery(
  baseQuery: string,
  params: CursorPaginationParams,
  cursorColumn = 'created_at',
  idColumn = 'id',
  paramOffset = 0
): {
  query: string;
  params: unknown[];
} {
  const { cursor, limit, sortOrder = 'desc' } = params;
  const direction = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const operator = sortOrder.toLowerCase() === 'asc' ? '>' : '<';

  let whereClauses: string[] = [];
  const queryParams: unknown[] = [];

  // Add cursor condition if provided
  if (cursor !== undefined) {
    const { timestamp } = decodeCursor(cursor);
    whereClauses.push(`${cursorColumn} ${operator} $${paramOffset + 1}`);
    queryParams.push(timestamp);
  }

  // Combine with existing WHERE clauses
  const hasWhere = baseQuery.toLowerCase().includes('where');
  let whereClause = '';
  if (whereClauses.length > 0) {
    whereClause = hasWhere 
      ? ` AND ${whereClauses.join(' AND ')}` 
      : ` WHERE ${whereClauses.join(' AND ')}`;
  }

  // Fetch one extra record to check if there's a next page
  const fetchLimit = limit + 1;

  const paginatedQuery = `
    ${baseQuery}
    ${whereClause}
    ORDER BY ${cursorColumn} ${direction}, ${idColumn} ${direction}
    LIMIT $${paramOffset + queryParams.length + 1}
  `;

  queryParams.push(fetchLimit);

  return {
    query: paginatedQuery,
    params: queryParams,
  };
}

/**
 * Process cursor-based pagination results
 * Extracts cursor information and determines if there are more pages
 */
export function processCursorResults<T extends { id: string; [key: string]: unknown }>(
  results: T[],
  limit: number,
  cursorColumn = 'created_at'
): CursorPaginationResult<T> {
  const hasNextPage = results.length > limit;

  // Remove the extra record we fetched for pagination detection
  const items = hasNextPage ? results.slice(0, limit) : results;

  const firstItem = items[0];
  const lastItem = items[items.length - 1];

  return {
    items,
    pagination: {
      nextCursor: hasNextPage && lastItem !== undefined
        ? encodeCursor(lastItem.id, String(lastItem[cursorColumn]))
        : undefined,
      previousCursor: firstItem !== undefined
        ? encodeCursor(firstItem.id, String(firstItem[cursorColumn]))
        : undefined,
      hasNextPage,
      hasPreviousPage: false, // Would need cursor history to determine this
      limit,
    },
  };
}

/**
 * Execute offset-based paginated query
 */
export async function executeOffsetPaginatedQuery<T>(
  pool: Pool,
  baseQuery: string,
  baseParams: unknown[],
  pagination: OffsetPaginationParams,
  rowMapper: (row: unknown) => T
): Promise<OffsetPaginationResult<T>> {
  // Build queries
  const { query, params, countQuery } = buildOffsetPaginationQuery(
    baseQuery,
    pagination,
    baseParams.length
  );

  // Execute count query
  // eslint-disable-next-line sonarjs/sql-queries -- Safe: countQuery is generated from validated base query, baseParams are parameterized
  const countResult = await pool.query(`SELECT COUNT(*) as total FROM (${countQuery}) as count_query`, baseParams);
  const total = parseInt(countResult.rows[0].total, 10);

  // Execute data query
  const dataResult = await pool.query(query, [...baseParams, ...params]);
  const items = dataResult.rows.map(rowMapper);

  const totalPages = Math.ceil(total / pagination.limit);

  return {
    items,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages,
      hasNextPage: pagination.page < totalPages,
      hasPreviousPage: pagination.page > 1,
    },
  };
}

/**
 * Execute cursor-based paginated query
 */
export async function executeCursorPaginatedQuery<T extends { id: string; [key: string]: unknown }>(
  pool: Pool,
  baseQuery: string,
  baseParams: unknown[],
  pagination: CursorPaginationParams,
  rowMapper: (row: unknown) => T,
  cursorColumn = 'created_at'
): Promise<CursorPaginationResult<T>> {
  // Build query
  const { query, params } = buildCursorPaginationQuery(
    baseQuery,
    pagination,
    cursorColumn,
    'id',
    baseParams.length
  );

  // Execute query
  const result = await pool.query(query, [...baseParams, ...params]);
  const items = result.rows.map(rowMapper);

  // Process results and extract cursor info
  return processCursorResults(items, pagination.limit, cursorColumn);
}

/**
 * Pagination helper class for repositories
 */
export class PaginationHelper {
  constructor(private pool: Pool) {}

  /**
   * Execute offset-based paginated query with automatic row mapping
   */
  async executeOffsetQuery<T>(
    baseQuery: string,
    baseParams: unknown[],
    pagination: OffsetPaginationParams,
    rowMapper: (row: unknown) => T
  ): Promise<OffsetPaginationResult<T>> {
    return executeOffsetPaginatedQuery(
      this.pool,
      baseQuery,
      baseParams,
      pagination,
      rowMapper
    );
  }

  /**
   * Execute cursor-based paginated query with automatic row mapping
   */
  async executeCursorQuery<T extends { id: string; [key: string]: unknown }>(
    baseQuery: string,
    baseParams: unknown[],
    pagination: CursorPaginationParams,
    rowMapper: (row: unknown) => T,
    cursorColumn = 'created_at'
  ): Promise<CursorPaginationResult<T>> {
    return executeCursorPaginatedQuery(
      this.pool,
      baseQuery,
      baseParams,
      pagination,
      rowMapper,
      cursorColumn
    );
  }
}

/**
 * Parse pagination params from query string
 */
export function parseOffsetPaginationParams(query: Record<string, unknown>): OffsetPaginationParams {
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? '20'), 10))); // Cap at 100
  const sortBy = String(query.sortBy ?? 'created_at');
  const sortOrder = String(query.sortOrder ?? 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

  return { page, limit, sortBy, sortOrder };
}

/**
 * Parse cursor pagination params from query string
 */
export function parseCursorPaginationParams(query: Record<string, unknown>): CursorPaginationParams {
  const cursor = query.cursor !== undefined ? String(query.cursor) : undefined;
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? '20'), 10))); // Cap at 100
  const sortBy = String(query.sortBy ?? 'created_at');
  const sortOrder = String(query.sortOrder ?? 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

  return { cursor, limit, sortBy, sortOrder };
}
