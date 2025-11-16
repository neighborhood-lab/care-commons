/**
 * Organization-Scoped Database Query Helpers
 * 
 * Provides utility functions that automatically enforce organization-level
 * multi-tenancy isolation. All queries through these helpers MUST include
 * organization_id filtering to prevent data leaks.
 * 
 * CRITICAL SECURITY: These helpers are designed to prevent cross-organization
 * data access in multi-tenant deployments.
 */

import { Database } from './connection.js';
import { UUID } from '../types/base.js';
import { QueryResult } from 'pg';

export interface OrganizationContext {
  organizationId: UUID;
  userId: UUID;
}

/**
 * Execute a SELECT query with automatic organization scoping
 * 
 * SECURITY: Automatically appends organization_id filter to WHERE clause
 * to prevent cross-organization data leaks.
 * 
 * @param db - Database instance
 * @param context - Organization context from authenticated user
 * @param baseQuery - SQL query (must include WHERE clause or end with WHERE 1=1)
 * @param params - Query parameters
 * @returns Query result
 * 
 * @example
 * ```typescript
 * const result = await scopedSelect(
 *   db,
 *   { organizationId: user.organizationId, userId: user.userId },
 *   'SELECT * FROM clients WHERE status = $1',
 *   ['ACTIVE']
 * );
 * ```
 */
export async function scopedSelect<T extends Record<string, unknown> = Record<string, unknown>>(
  db: Database,
  context: OrganizationContext,
  baseQuery: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  // Validate query has WHERE clause
  const upperQuery = baseQuery.toUpperCase();
  if (!upperQuery.includes('WHERE')) {
    throw new Error('Scoped queries must include a WHERE clause. Use "WHERE 1=1" if no other conditions.');
  }

  // Append organization_id filter
  const scopedQuery = `${baseQuery} AND organization_id = $${params.length + 1}`;
  const scopedParams = [...params, context.organizationId];

  return await db.query<T>(scopedQuery, scopedParams);
}

/**
 * Execute an UPDATE query with automatic organization scoping
 * 
 * SECURITY: Automatically appends organization_id filter to WHERE clause
 * and sets updated_by field to current user.
 * 
 * @param db - Database instance
 * @param context - Organization context from authenticated user
 * @param tableName - Name of table to update
 * @param updates - Column-value pairs to update
 * @param whereClause - WHERE conditions (WITHOUT organization_id)
 * @param whereParams - Parameters for WHERE clause
 * @returns Query result
 * 
 * @example
 * ```typescript
 * await scopedUpdate(
 *   db,
 *   context,
 *   'clients',
 *   { status: 'INACTIVE' },
 *   'id = $1',
 *   [clientId]
 * );
 * ```
 */
export async function scopedUpdate(
  db: Database,
  context: OrganizationContext,
  tableName: string,
  updates: Record<string, unknown>,
  whereClause: string,
  whereParams: unknown[] = []
): Promise<QueryResult> {
  // Build SET clause
  const updateEntries = Object.entries(updates);
  const setClause = updateEntries
    .map(([key, _], index) => `${key} = $${index + 1}`)
    .join(', ');

  // Add updated_at and updated_by
  const allUpdates = [...Object.values(updates), new Date(), context.userId];
  const finalSetClause = `${setClause}, updated_at = $${allUpdates.length - 1}, updated_by = $${allUpdates.length}`;

  // Build WHERE clause with organization scoping
  const orgIdParam = allUpdates.length + 1;
  const finalWhereClause = `${whereClause} AND organization_id = $${orgIdParam}`;
  const finalParams = [...allUpdates, ...whereParams, context.organizationId];

  // eslint-disable-next-line sonarjs/sql-queries
  const query = `UPDATE ${tableName} SET ${finalSetClause} WHERE ${finalWhereClause}`;

  return await db.query(query, finalParams);
}

/**
 * Execute a DELETE query with automatic organization scoping (soft delete)
 * 
 * SECURITY: Automatically appends organization_id filter to WHERE clause.
 * Performs soft delete by setting deleted_at and deleted_by fields.
 * 
 * @param db - Database instance
 * @param context - Organization context from authenticated user
 * @param tableName - Name of table to delete from
 * @param whereClause - WHERE conditions (WITHOUT organization_id)
 * @param whereParams - Parameters for WHERE clause
 * @returns Query result
 * 
 * @example
 * ```typescript
 * await scopedDelete(
 *   db,
 *   context,
 *   'clients',
 *   'id = $1',
 *   [clientId]
 * );
 * ```
 */
export async function scopedDelete(
  db: Database,
  context: OrganizationContext,
  tableName: string,
  whereClause: string,
  whereParams: unknown[] = []
): Promise<QueryResult> {
  const now = new Date();
  const params = [now, context.userId, ...whereParams, context.organizationId];
  
  // eslint-disable-next-line sonarjs/sql-queries
  const query = `
    UPDATE ${tableName}
    SET deleted_at = $1, deleted_by = $2
    WHERE ${whereClause} AND organization_id = $${params.length} AND deleted_at IS NULL
  `;

  return await db.query(query, params);
}

/**
 * Execute a hard DELETE query with automatic organization scoping
 * 
 * SECURITY: Automatically appends organization_id filter to WHERE clause.
 * WARNING: This performs a hard delete. Only use when soft delete is not appropriate.
 * 
 * @param db - Database instance
 * @param context - Organization context from authenticated user
 * @param tableName - Name of table to delete from
 * @param whereClause - WHERE conditions (WITHOUT organization_id)
 * @param whereParams - Parameters for WHERE clause
 * @returns Query result
 */
export async function scopedHardDelete(
  db: Database,
  context: OrganizationContext,
  tableName: string,
  whereClause: string,
  whereParams: unknown[] = []
): Promise<QueryResult> {
  const params = [...whereParams, context.organizationId];
  // eslint-disable-next-line sonarjs/sql-queries
  const query = `DELETE FROM ${tableName} WHERE ${whereClause} AND organization_id = $${params.length}`;

  return await db.query(query, params);
}

/**
 * Execute an INSERT query with automatic organization scoping
 * 
 * SECURITY: Automatically sets organization_id, created_by, and updated_by fields.
 * 
 * @param db - Database instance
 * @param context - Organization context from authenticated user
 * @param tableName - Name of table to insert into
 * @param data - Data to insert
 * @returns Query result
 * 
 * @example
 * ```typescript
 * const result = await scopedInsert(
 *   db,
 *   context,
 *   'clients',
 *   { first_name: 'John', last_name: 'Doe', ... }
 * );
 * ```
 */
export async function scopedInsert<T extends Record<string, unknown> = Record<string, unknown>>(
  db: Database,
  context: OrganizationContext,
  tableName: string,
  data: Record<string, unknown>
): Promise<QueryResult<T>> {
  const now = new Date();
  
  // Merge organization context with data
  const fullData = {
    ...data,
    organization_id: context.organizationId,
    created_by: context.userId,
    updated_by: context.userId,
    created_at: now,
    updated_at: now,
  };

  // Build INSERT query
  const columns = Object.keys(fullData);
  const values = Object.values(fullData);
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

  // eslint-disable-next-line sonarjs/sql-queries
  const query = `
    INSERT INTO ${tableName} (${columns.join(', ')})
    VALUES (${placeholders})
    RETURNING *
  `;

  return await db.query<T>(query, values);
}

/**
 * Validate that a resource belongs to the user's organization
 * 
 * SECURITY: Throws error if resource is not found or belongs to different organization.
 * Use this before performing operations on resources to prevent cross-org access.
 * 
 * @param db - Database instance
 * @param context - Organization context from authenticated user
 * @param tableName - Name of table
 * @param resourceId - ID of resource to validate
 * @throws Error if resource not found or belongs to different organization
 * 
 * @example
 * ```typescript
 * await validateOrganizationOwnership(db, context, 'clients', clientId);
 * // Now safe to perform operations on client
 * ```
 */
export async function validateOrganizationOwnership(
  db: Database,
  context: OrganizationContext,
  tableName: string,
  resourceId: UUID
): Promise<void> {
  // eslint-disable-next-line sonarjs/sql-queries
  const result = await db.query(
    `SELECT organization_id FROM ${tableName} WHERE id = $1 AND deleted_at IS NULL`,
    [resourceId]
  );

  if (result.rows.length === 0) {
    throw new Error(`Resource not found in ${tableName}: ${resourceId}`);
  }

  const row = result.rows[0] as { organization_id: string };
  if (row.organization_id !== context.organizationId) {
    throw new Error(`Access denied: Resource belongs to different organization`);
  }
}

/**
 * Count records with organization scoping
 * 
 * @param db - Database instance
 * @param context - Organization context from authenticated user
 * @param tableName - Name of table to count
 * @param whereClause - Optional WHERE conditions (WITHOUT organization_id)
 * @param whereParams - Parameters for WHERE clause
 * @returns Count of records
 */
export async function scopedCount(
  db: Database,
  context: OrganizationContext,
  tableName: string,
  whereClause?: string,
  whereParams: unknown[] = []
): Promise<number> {
  const params = [...whereParams, context.organizationId];
  const where = whereClause !== undefined 
    ? `WHERE ${whereClause} AND organization_id = $${params.length} AND deleted_at IS NULL`
    : `WHERE organization_id = $${params.length} AND deleted_at IS NULL`;

  // eslint-disable-next-line sonarjs/sql-queries
  const query = `SELECT COUNT(*) as count FROM ${tableName} ${where}`;
  const result = await db.query<{ count: string }>(query, params);
  
  return parseInt(result.rows[0]?.count ?? '0', 10);
}

/**
 * Check if a record exists with organization scoping
 * 
 * @param db - Database instance
 * @param context - Organization context from authenticated user
 * @param tableName - Name of table
 * @param whereClause - WHERE conditions (WITHOUT organization_id)
 * @param whereParams - Parameters for WHERE clause
 * @returns True if record exists
 */
export async function scopedExists(
  db: Database,
  context: OrganizationContext,
  tableName: string,
  whereClause: string,
  whereParams: unknown[] = []
): Promise<boolean> {
  const params = [...whereParams, context.organizationId];
  // eslint-disable-next-line sonarjs/sql-queries
  const query = `
    SELECT EXISTS(
      SELECT 1 FROM ${tableName} 
      WHERE ${whereClause} AND organization_id = $${params.length} AND deleted_at IS NULL
    ) as exists
  `;
  
  const result = await db.query<{ exists: boolean }>(query, params);
  return result.rows[0]?.exists ?? false;
}
