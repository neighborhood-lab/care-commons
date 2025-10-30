"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Repository = void 0;
const uuid_1 = require("uuid");
const base_1 = require("../types/base");
class Repository {
    constructor(config) {
        this.tableName = config.tableName;
        this.database = config.database;
        this.enableAudit = config.enableAudit ?? true;
        this.enableSoftDelete = config.enableSoftDelete ?? true;
    }
    async create(entity, context) {
        const id = (0, uuid_1.v4)();
        const now = new Date();
        const row = this.mapEntityToRow(entity);
        const fullRow = {
            ...row,
            id,
            created_at: now,
            created_by: context.userId,
            updated_at: now,
            updated_by: context.userId,
            version: 1,
        };
        if (this.enableSoftDelete) {
            fullRow.deleted_at = null;
            fullRow.deleted_by = null;
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
        const created = this.mapRowToEntity(result.rows[0]);
        if (this.enableAudit) {
            await this.createRevision(id, 'CREATE', {}, fullRow, context);
        }
        return created;
    }
    async findById(id) {
        const whereClause = this.enableSoftDelete
            ? 'WHERE id = $1 AND deleted_at IS NULL'
            : 'WHERE id = $1';
        const query = `SELECT * FROM ${this.tableName} ${whereClause}`;
        const result = await this.database.query(query, [id]);
        if (result.rows.length === 0) {
            return null;
        }
        return this.mapRowToEntity(result.rows[0]);
    }
    async findAll(params) {
        const { page, limit, sortBy = 'created_at', sortOrder = 'desc' } = params;
        const offset = (page - 1) * limit;
        const whereClause = this.enableSoftDelete ? 'WHERE deleted_at IS NULL' : '';
        const countQuery = `SELECT COUNT(*) FROM ${this.tableName} ${whereClause}`;
        const countResult = await this.database.query(countQuery);
        const total = parseInt(countResult.rows[0].count);
        const query = `
      SELECT * FROM ${this.tableName}
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $1 OFFSET $2
    `;
        const result = await this.database.query(query, [limit, offset]);
        const items = result.rows.map((row) => this.mapRowToEntity(row));
        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async update(id, updates, context) {
        const existing = await this.findById(id);
        if (!existing) {
            throw new base_1.NotFoundError(`Entity not found: ${id}`);
        }
        if (updates.version && updates.version !== existing.version) {
            throw new base_1.ConflictError(`Version conflict: expected ${existing.version}, got ${updates.version}`);
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
            throw new base_1.ConflictError('Update failed due to version conflict');
        }
        const updated = this.mapRowToEntity(result.rows[0]);
        if (this.enableAudit) {
            const changes = this.computeChanges(this.mapEntityToRow(existing), row);
            await this.createRevision(id, 'UPDATE', changes, row, context);
        }
        return updated;
    }
    async delete(id, context) {
        if (!this.enableSoftDelete) {
            throw new Error('Hard delete not supported. Use deleteHard() instead.');
        }
        const existing = await this.findById(id);
        if (!existing) {
            throw new base_1.NotFoundError(`Entity not found: ${id}`);
        }
        const now = new Date();
        const query = `
      UPDATE ${this.tableName}
      SET deleted_at = $1, deleted_by = $2
      WHERE id = $3
    `;
        await this.database.query(query, [now, context.userId, id]);
        if (this.enableAudit) {
            await this.createRevision(id, 'DELETE', {}, { deleted_at: now }, context);
        }
    }
    async createRevision(entityId, operation, changes, newData, context) {
        const revisionId = (0, uuid_1.v4)();
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
            null,
            null,
        ]);
    }
    computeChanges(oldRow, newRow) {
        const changes = {};
        for (const key of Object.keys(newRow)) {
            if (oldRow[key] !== newRow[key]) {
                changes[key] = { from: oldRow[key], to: newRow[key] };
            }
        }
        return changes;
    }
    async getRevisionHistory(entityId) {
        if (!this.enableAudit) {
            return [];
        }
        const query = `
      SELECT * FROM audit_revisions
      WHERE entity_id = $1 AND entity_type = $2
      ORDER BY timestamp DESC
    `;
        const result = await this.database.query(query, [entityId, this.tableName]);
        return result.rows.map((row) => ({
            revisionId: row.revision_id,
            timestamp: row.timestamp,
            userId: row.user_id,
            operation: row.operation,
            changes: JSON.parse(row.changes),
            ipAddress: row.ip_address,
            userAgent: row.user_agent,
        }));
    }
}
exports.Repository = Repository;
//# sourceMappingURL=repository.js.map