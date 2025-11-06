import type { Database } from './connection.js';
import type { PaginationParams, PaginatedResult } from '../types/base.js';

/**
 * Fluent SQL query builder for search operations with pagination
 * 
 * Eliminates duplicate query building logic across repositories.
 * Provides type-safe, declarative interface for building complex WHERE clauses.
 * 
 * @example
 * ```typescript
 * const query = new SearchQueryBuilder<Client>('clients')
 *   .whereLike(['first_name', 'last_name'], 'Smith')
 *   .where('organization_id', '=', orgId)
 *   .whereIn('status', ['active', 'pending'])
 *   .orderBy('last_name')
 *   .orderBy('first_name');
 * 
 * const result = await query.executePaginated(
 *   database,
 *   { page: 1, limit: 20 },
 *   (row) => mapRowToEntity(row)
 * );
 * ```
 */
export class SearchQueryBuilder<T> {
  private whereClauses: string[] = [];
  private params: unknown[] = [];
  private paramIndex = 1;
  private orderByClauses: string[] = [];

  constructor(
    private tableName: string,
    includeDeletedFilter = true
  ) {
    if (includeDeletedFilter) {
      this.whereClauses.push('deleted_at IS NULL');
    }
  }

  /**
   * Add a WHERE clause with a parameterized value
   * 
   * @param column - Database column name
   * @param operator - SQL comparison operator (=, !=, >, <, >=, <=, LIKE, ILIKE, etc.)
   * @param value - Value to compare (skipped if undefined/null)
   * @returns this for chaining
   */
  where(column: string, operator: string, value: unknown): this {
    if (value === undefined || value === null) return this;

    this.whereClauses.push(`${column} ${operator} $${this.paramIndex++}`);
    this.params.push(value);
    return this;
  }

  /**
   * Add a WHERE IN clause for array values
   * 
   * @param column - Database column name
   * @param values - Array of values (skipped if empty)
   * @returns this for chaining
   */
  whereIn(column: string, values: unknown[] | undefined): this {
    if (!values || values.length === 0) return this;

    this.whereClauses.push(`${column} = ANY($${this.paramIndex++})`);
    this.params.push(values);
    return this;
  }

  /**
   * Add a LIKE/ILIKE search across multiple columns (OR condition)
   * 
   * @param columns - Array of column names to search
   * @param searchTerm - Search term (adds % wildcards automatically)
   * @param caseSensitive - Use LIKE (true) or ILIKE (false, default)
   * @returns this for chaining
   */
  whereLike(
    columns: string[],
    searchTerm: string | undefined,
    caseSensitive = false
  ): this {
    if (!searchTerm || searchTerm.trim() === '') return this;

    const operator = caseSensitive ? 'LIKE' : 'ILIKE';
    const conditions = columns.map((col) => `${col} ${operator} $${this.paramIndex}`);
    this.whereClauses.push(`(${conditions.join(' OR ')})`);
    this.params.push(`%${searchTerm}%`);
    this.paramIndex++;
    return this;
  }

  /**
   * Add a WHERE clause for JSONB path extraction
   * 
   * @param column - JSONB column name
   * @param jsonPath - JSON path to extract (e.g., 'address.city')
   * @param operator - SQL comparison operator
   * @param value - Value to compare (skipped if undefined)
   * @returns this for chaining
   */
  whereJsonPath(
    column: string,
    jsonPath: string,
    operator: string,
    value: unknown
  ): this {
    if (value === undefined) return this;

    // Convert dot notation to PostgreSQL path syntax
    const pathParts = jsonPath.split('.');
    let pathExpression: string;

    if (pathParts.length === 1) {
      // Simple path: column->>'field'
      pathExpression = `${column}->>'${pathParts[0]}'`;
    } else {
      // Nested path: column->'level1'->'level2'->>'field'
      const nestedPath = pathParts
        .slice(0, -1)
        .map((part) => `'${part}'`)
        .join('->');
      pathExpression = `${column}->${nestedPath}->>'${pathParts[pathParts.length - 1]}'`;
    }

    this.whereClauses.push(`${pathExpression} ${operator} $${this.paramIndex++}`);
    this.params.push(value);
    return this;
  }

  /**
   * Add a date range filter
   * 
   * @param column - Date column name
   * @param startDate - Start date (inclusive, skipped if undefined)
   * @param endDate - End date (inclusive, skipped if undefined)
   * @returns this for chaining
   */
  whereDateRange(column: string, startDate?: Date, endDate?: Date): this {
    if (startDate) {
      this.where(column, '>=', startDate);
    }
    if (endDate) {
      this.where(column, '<=', endDate);
    }
    return this;
  }

  /**
   * Add an ORDER BY clause
   * 
   * @param column - Column name to sort by
   * @param direction - Sort direction (ASC or DESC)
   * @returns this for chaining
   */
  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderByClauses.push(`${column} ${direction}`);
    return this;
  }

  /**
   * Add standard name sorting (last_name, first_name)
   * 
   * @returns this for chaining
   */
  orderByName(): this {
    return this.orderBy('last_name').orderBy('first_name');
  }

  /**
   * Execute the query with pagination
   * 
   * @param database - Database instance
   * @param pagination - Page and limit parameters
   * @param mapper - Function to map database rows to entities
   * @returns Paginated result with items, total, and page metadata
   */
  async executePaginated<TEntity = T>(
    database: Database,
    pagination: PaginationParams,
    mapper: (row: unknown) => TEntity
  ): Promise<PaginatedResult<TEntity>> {
    const whereClause = this.buildWhereClause();
    const orderClause = this.buildOrderClause();

    // Count total matching records
    const countQuery = `SELECT COUNT(*) FROM ${this.tableName} ${whereClause}`;
    const countResult = await database.query(countQuery, this.params);
    const total = parseInt(String(countResult.rows[0]?.['count'] ?? '0'), 10);

    // Fetch paginated data
    const offset = (pagination.page - 1) * pagination.limit;
    const dataQuery = `
      SELECT * FROM ${this.tableName}
      ${whereClause}
      ${orderClause}
      LIMIT $${this.paramIndex++} OFFSET $${this.paramIndex++}
    `;

    const result = await database.query(dataQuery, [
      ...this.params,
      pagination.limit,
      offset,
    ]);

    return {
      items: result.rows.map((row) => mapper(row)),
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  /**
   * Execute the query and return all results (no pagination)
   * 
   * @param database - Database instance
   * @param mapper - Function to map database rows to entities
   * @returns Array of mapped entities
   */
  async executeAll<TEntity = T>(
    database: Database,
    mapper: (row: unknown) => TEntity
  ): Promise<TEntity[]> {
    const whereClause = this.buildWhereClause();
    const orderClause = this.buildOrderClause();

    const query = `
      SELECT * FROM ${this.tableName}
      ${whereClause}
      ${orderClause}
    `;

    const result = await database.query(query, this.params);
    return result.rows.map((row) => mapper(row));
  }

  private buildWhereClause(): string {
    return this.whereClauses.length > 0
      ? `WHERE ${this.whereClauses.join(' AND ')}`
      : '';
  }

  private buildOrderClause(): string {
    return this.orderByClauses.length > 0
      ? `ORDER BY ${this.orderByClauses.join(', ')}`
      : '';
  }
}
