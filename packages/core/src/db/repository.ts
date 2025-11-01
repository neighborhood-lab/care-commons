/**
 * Base repository pattern with audit and sync support
 */

// import { PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import {
  Entity,
  // SoftDeletable,
  // Auditable,
  Revision,
  UserContext,
  PaginationParams,
  PaginatedResult,
  // SyncMetadata,
  NotFoundError,
  ConflictError,
} from '../types/base';
import { Database } from './connection';

export interface RepositoryConfig {
  tableName: string;
  database: Database;
  enableAudit?: boolean;
  enableSoftDelete?: boolean;
}

/**
 * Base repository with CRUD operations, audit trail, and sync support
 */
export abstract class Repository<T extends Entity> {
  protected tableName: string;
  protected database: Database;
  protected enableAudit: boolean;
  protected enableSoftDelete: boolean;

  constructor(config: RepositoryConfig) {
    this.tableName = config.tableName;
    this.database = config.database;
    this.enableAudit = config.enableAudit ?? true;
    this.enableSoftDelete = config.enableSoftDelete ?? true;
  }

  /**
   * Map database row to domain entity
   */
  protected abstract mapRowToEntity(row: Record<string, unknown>): T;

  /**
   * Map domain entity to database row
   */
  protected abstract mapEntityToRow(entity: Partial<T>): Record<string, unknown>;

  /**
   * Create a new entity
   */
  async create(entity: Partial<T>, context: UserContext): Promise<T> {
    const id = uuidv4();
    const now = new Date();

    const row = this.mapEntityToRow(entity);
    const fullRow: Record<string, unknown> = {
      ...row,
      id,
      created_at: now,
      created_by: context.userId,
      updated_at: now,
      updated_by: context.userId,
      version: 1,
    };

    if (this.enableSoftDelete) {
      fullRow['deleted_at'] = null;
      fullRow['deleted_by'] = null;
    }

    const columns = Object.keys(fullRow);
    const values = Object.values(fullRow);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    const query = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await this.database.query(query, values);
    const createdRow = result.rows[0] as Record<string, unknown> | undefined;
    if (!createdRow) {
      throw new Error('Create failed - no row returned');
    }
    const created = this.mapRowToEntity(createdRow);

    if (this.enableAudit) {
      await this.createRevision(id, 'CREATE', {}, fullRow, context);
    }

    return created;
  }

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<T | null> {
    const whereClause = this.enableSoftDelete
      ? 'WHERE id = $1 AND deleted_at IS NULL'
      : 'WHERE id = $1';

    const query = `SELECT * FROM ${this.tableName} ${whereClause}`;
    const result = await this.database.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const foundRow = result.rows[0] as Record<string, unknown> | undefined;
    if (!foundRow) {
      return null;
    }

    return this.mapRowToEntity(foundRow);
  }

  /**
   * Find all entities with pagination
   */
  async findAll(params: PaginationParams): Promise<PaginatedResult<T>> {
    const { page, limit, sortBy = 'created_at', sortOrder = 'desc' } = params;
    const offset = (page - 1) * limit;

    const whereClause = this.enableSoftDelete ? 'WHERE deleted_at IS NULL' : '';

    const countQuery = `SELECT COUNT(*) FROM ${this.tableName} ${whereClause}`;
    const countResult = await this.database.query(countQuery);
    const firstRow = countResult.rows[0] as Record<string, unknown> | undefined;
    if (!firstRow) {
      throw new Error('Count query returned no rows');
    }
    const total = parseInt(firstRow['count'] as string);

    const query = `
      SELECT * FROM ${this.tableName}
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $1 OFFSET $2
    `;

    const result = await this.database.query(query, [limit, offset]);

    return {
      items: result.rows.map((row) => this.mapRowToEntity(row as Record<string, unknown>)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update an entity with optimistic locking
   */
  async update(
    id: string,
    updates: Partial<T>,
    context: UserContext
  ): Promise<T> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Entity not found: ${id}`);
    }

    // Optimistic locking check
    if (updates.version && updates.version !== existing.version) {
      throw new ConflictError(
        `Version conflict: expected ${existing.version}, got ${updates.version}`
      );
    }

    const now = new Date();
    const row = this.mapEntityToRow(updates);

    const updateFields = Object.keys(row)
      .filter((key) => key !== 'id')
      .map((key, i) => `${key} = $${i + 1}`)
      .join(', ');

    const values = [
      ...Object.values(row),
      now,
      context.userId,
      existing.version + 1,
      id,
      existing.version,
    ];

    const query = `
      UPDATE ${this.tableName}
      SET ${updateFields}, updated_at = $${Object.keys(row).length + 1}, 
          updated_by = $${Object.keys(row).length + 2},
          version = $${Object.keys(row).length + 3}
      WHERE id = $${Object.keys(row).length + 4}
        AND version = $${Object.keys(row).length + 5}
      RETURNING *
    `;

    const result = await this.database.query(query, values);

    if (result.rows.length === 0) {
      throw new ConflictError('Update failed due to version conflict');
    }

    const updatedRow = result.rows[0] as Record<string, unknown> | undefined;
    if (!updatedRow) {
      throw new ConflictError('Update failed - no row returned');
    }

    const updated = this.mapRowToEntity(updatedRow);

    if (this.enableAudit) {
      const changes = this.computeChanges(
        this.mapEntityToRow(existing),
        row
      );
      await this.createRevision(id, 'UPDATE', changes, row, context);
    }

    return updated;
  }

  /**
   * Soft delete an entity
   */
  async delete(id: string, context: UserContext): Promise<void> {
    if (!this.enableSoftDelete) {
      throw new Error('Hard delete not supported. Use deleteHard() instead.');
    }

    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Entity not found: ${id}`);
    }

    const now = new Date();
    const query = `
      UPDATE ${this.tableName}
      SET deleted_at = $1, deleted_by = $2
      WHERE id = $3
    `;

    await this.database.query(query, [now, context.userId, id]);

    if (this.enableAudit) {
      await this.createRevision(
        id,
        'DELETE',
        {},
        { deleted_at: now },
        context
      );
    }
  }

  /**
   * Create audit revision
   */
  private async createRevision(
    entityId: string,
    operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE',
    changes: Record<string, { from: unknown; to: unknown }>,
    newData: Record<string, unknown>,
    context: UserContext
  ): Promise<void> {
    const revisionId = uuidv4();
    const now = new Date();

    const query = `
      INSERT INTO audit_revisions (
        revision_id, entity_id, entity_type, timestamp, user_id,
        operation, changes, snapshot, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;

    await this.database.query(query, [
      revisionId,
      entityId,
      this.tableName,
      now,
      context.userId,
      operation,
      JSON.stringify(changes),
      JSON.stringify(newData),
      null, // IP address would come from HTTP context
      null, // User agent would come from HTTP context
    ]);
  }

  /**
   * Compute changes between old and new entity
   */
  private computeChanges(
    oldRow: Record<string, unknown>,
    newRow: Record<string, unknown>
  ): Record<string, { from: unknown; to: unknown }> {
    const changes: Record<string, { from: unknown; to: unknown }> = {};

    for (const key of Object.keys(newRow)) {
      if (oldRow[key] !== newRow[key]) {
        changes[key] = { from: oldRow[key], to: newRow[key] };
      }
    }

    return changes;
  }

  /**
   * Get revision history for an entity
   */
  async getRevisionHistory(entityId: string): Promise<Revision[]> {
    if (!this.enableAudit) {
      return [];
    }

    const query = `
      SELECT * FROM audit_revisions
      WHERE entity_id = $1 AND entity_type = $2
      ORDER BY timestamp DESC
    `;

    const result = await this.database.query(query, [entityId, this.tableName]);

    return result.rows.map((row): Revision => {
      const revision: Revision = {
        revisionId: row['revision_id'] as string,
        timestamp: row['timestamp'] as Date,
        userId: row['user_id'] as string,
        operation: row['operation'] as 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE',
        changes: JSON.parse(row['changes'] as string),
        ipAddress: row['ip_address'] as string | null,
        userAgent: row['user_agent'] as string | null,
      };
      return revision;
    });
  }
}
