import { Repository, type Database, type UUID, type UserContext } from '@care-commons/core';
import type {
  Receipt,
  ReceiptQueryFilter,
  ReceiptStatistics,
  ReceiptStatus,
} from '../types/receipt.js';

/**
 * Repository for managing receipts in the database
 */
export class ReceiptRepository extends Repository<Receipt> {
  constructor(database: Database) {
    super({
      tableName: 'receipts',
      database,
      enableAudit: true,
      enableSoftDelete: false,
    });
  }

  /**
   * Maps a database row to a Receipt entity
   */
  protected mapRowToEntity(row: Record<string, unknown>): Receipt {
    return {
      id: row.id as UUID,
      employeeId: row.employee_id as UUID,
      expenseId: row.expense_id as UUID | undefined,
      mileageId: row.mileage_id as UUID | undefined,
      uploadDate: row.upload_date as string,
      receiptDate: row.receipt_date as string | undefined,
      merchantName: row.merchant_name as string | undefined,
      amount: row.amount as number | undefined,
      currency: row.currency as string | undefined,
      fileName: row.file_name as string,
      fileType: row.file_type as Receipt['fileType'],
      fileSize: row.file_size as number,
      filePath: row.file_path as string,
      thumbnailPath: row.thumbnail_path as string | undefined,
      ocrText: row.ocr_text as string | undefined,
      extractedData: row.extracted_data as Record<string, unknown> | undefined,
      status: row.status as ReceiptStatus,
      verifiedBy: row.verified_by as UUID | undefined,
      verifiedAt: row.verified_at as string | undefined,
      rejectionReason: row.rejection_reason as string | undefined,
      organizationId: row.organization_id as UUID,
      branchId: row.branch_id as UUID,
      notes: row.notes as string | undefined,
      tags: row.tags as string[] | undefined,
      createdBy: row.created_by as UUID,
      updatedBy: row.updated_by as UUID | undefined,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string | undefined,
      version: row.version as number,
    };
  }

  /**
   * Maps a Receipt entity to a database row
   */
  protected mapEntityToRow(entity: Partial<Receipt>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.employeeId !== undefined) row.employee_id = entity.employeeId;
    if (entity.expenseId !== undefined) row.expense_id = entity.expenseId;
    if (entity.mileageId !== undefined) row.mileage_id = entity.mileageId;
    if (entity.uploadDate !== undefined) row.upload_date = entity.uploadDate;
    if (entity.receiptDate !== undefined) row.receipt_date = entity.receiptDate;
    if (entity.merchantName !== undefined) row.merchant_name = entity.merchantName;
    if (entity.amount !== undefined) row.amount = entity.amount;
    if (entity.currency !== undefined) row.currency = entity.currency;
    if (entity.fileName !== undefined) row.file_name = entity.fileName;
    if (entity.fileType !== undefined) row.file_type = entity.fileType;
    if (entity.fileSize !== undefined) row.file_size = entity.fileSize;
    if (entity.filePath !== undefined) row.file_path = entity.filePath;
    if (entity.thumbnailPath !== undefined) row.thumbnail_path = entity.thumbnailPath;
    if (entity.ocrText !== undefined) row.ocr_text = entity.ocrText;
    if (entity.extractedData !== undefined) row.extracted_data = entity.extractedData;
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.verifiedBy !== undefined) row.verified_by = entity.verifiedBy;
    if (entity.verifiedAt !== undefined) row.verified_at = entity.verifiedAt;
    if (entity.rejectionReason !== undefined) row.rejection_reason = entity.rejectionReason;
    if (entity.organizationId !== undefined) row.organization_id = entity.organizationId;
    if (entity.branchId !== undefined) row.branch_id = entity.branchId;
    if (entity.notes !== undefined) row.notes = entity.notes;
    if (entity.tags !== undefined) row.tags = entity.tags;

    return row;
  }

  /**
   * Find receipts by employee ID
   */
  async findByEmployee(employeeId: UUID, context: UserContext): Promise<Receipt[]> {
    const query = `
      SELECT * FROM receipts
      WHERE employee_id = $1
        AND organization_id = $2
      ORDER BY upload_date DESC, created_at DESC
    `;
    const result = await this.database.query(query, [employeeId, context.organizationId]);
    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Find receipts by expense ID
   */
  async findByExpense(expenseId: UUID, context: UserContext): Promise<Receipt[]> {
    const query = `
      SELECT * FROM receipts
      WHERE expense_id = $1
        AND organization_id = $2
      ORDER BY upload_date DESC, created_at DESC
    `;
    const result = await this.database.query(query, [expenseId, context.organizationId]);
    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Find receipts by mileage ID
   */
  async findByMileage(mileageId: UUID, context: UserContext): Promise<Receipt[]> {
    const query = `
      SELECT * FROM receipts
      WHERE mileage_id = $1
        AND organization_id = $2
      ORDER BY upload_date DESC, created_at DESC
    `;
    const result = await this.database.query(query, [mileageId, context.organizationId]);
    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Find unlinked receipts (not attached to any expense or mileage)
   */
  async findUnlinked(context: UserContext): Promise<Receipt[]> {
    const query = `
      SELECT * FROM receipts
      WHERE expense_id IS NULL
        AND mileage_id IS NULL
        AND organization_id = $1
      ORDER BY upload_date DESC, created_at DESC
    `;
    const result = await this.database.query(query, [context.organizationId]);
    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Find receipts with advanced filtering
   */
  async findWithFilters(filter: ReceiptQueryFilter, context: UserContext): Promise<Receipt[]> {
    const conditions: string[] = ['organization_id = $1'];
    const parameters: unknown[] = [context.organizationId];
    let paramIndex = 2;

    if (filter.employeeId) {
      conditions.push(`employee_id = $${paramIndex++}`);
      parameters.push(filter.employeeId);
    }

    if (filter.expenseId) {
      conditions.push(`expense_id = $${paramIndex++}`);
      parameters.push(filter.expenseId);
    }

    if (filter.mileageId) {
      conditions.push(`mileage_id = $${paramIndex++}`);
      parameters.push(filter.mileageId);
    }

    if (filter.status) {
      conditions.push(`status = $${paramIndex++}`);
      parameters.push(filter.status);
    }

    if (filter.fileType) {
      conditions.push(`file_type = $${paramIndex++}`);
      parameters.push(filter.fileType);
    }

    if (filter.startDate) {
      conditions.push(`upload_date >= $${paramIndex++}`);
      parameters.push(filter.startDate);
    }

    if (filter.endDate) {
      conditions.push(`upload_date <= $${paramIndex++}`);
      parameters.push(filter.endDate);
    }

    if (filter.branchId) {
      conditions.push(`branch_id = $${paramIndex++}`);
      parameters.push(filter.branchId);
    }

    const query = `
      SELECT * FROM receipts
      WHERE ${conditions.join(' AND ')}
      ORDER BY upload_date DESC, created_at DESC
    `;

    const result = await this.database.query(query, parameters);
    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Get receipt statistics
   */
  async getStatistics(filter: ReceiptQueryFilter, context: UserContext): Promise<ReceiptStatistics> {
    const conditions: string[] = ['organization_id = $1'];
    const parameters: unknown[] = [context.organizationId];
    let paramIndex = 2;

    if (filter.employeeId) {
      conditions.push(`employee_id = $${paramIndex++}`);
      parameters.push(filter.employeeId);
    }

    if (filter.startDate) {
      conditions.push(`upload_date >= $${paramIndex++}`);
      parameters.push(filter.startDate);
    }

    if (filter.endDate) {
      conditions.push(`upload_date <= $${paramIndex++}`);
      parameters.push(filter.endDate);
    }

    if (filter.branchId) {
      conditions.push(`branch_id = $${paramIndex++}`);
      parameters.push(filter.branchId);
    }

    const query = `
      SELECT
        COUNT(*) as total_count,
        SUM(file_size) as total_size,
        file_type,
        status,
        COUNT(*) FILTER (WHERE expense_id IS NOT NULL) as linked_to_expense,
        COUNT(*) FILTER (WHERE mileage_id IS NOT NULL) as linked_to_mileage,
        COUNT(*) FILTER (WHERE expense_id IS NULL AND mileage_id IS NULL) as unlinked
      FROM receipts
      WHERE ${conditions.join(' AND ')}
      GROUP BY file_type, status
    `;

    const result = await this.database.query(query, parameters);

    const statistics: ReceiptStatistics = {
      totalCount: 0,
      totalSize: 0,
      byFileType: {} as ReceiptStatistics['byFileType'],
      byStatus: {} as ReceiptStatistics['byStatus'],
      linkedToExpense: 0,
      linkedToMileage: 0,
      unlinked: 0,
    };

    for (const row of result.rows) {
      const fileType = row.file_type as Receipt['fileType'];
      const status = row.status as ReceiptStatus;
      const count = Number.parseInt(row.total_count as string, 10);
      const size = Number.parseInt(row.total_size as string, 10) || 0;

      if (!statistics.byFileType[fileType]) {
        statistics.byFileType[fileType] = 0;
      }
      if (!statistics.byStatus[status]) {
        statistics.byStatus[status] = 0;
      }

      statistics.byFileType[fileType] += count;
      statistics.byStatus[status] += count;
      statistics.totalCount += count;
      statistics.totalSize += size;

      if (row.linked_to_expense) {
        statistics.linkedToExpense += Number.parseInt(row.linked_to_expense as string, 10);
      }
      if (row.linked_to_mileage) {
        statistics.linkedToMileage += Number.parseInt(row.linked_to_mileage as string, 10);
      }
      if (row.unlinked) {
        statistics.unlinked += Number.parseInt(row.unlinked as string, 10);
      }
    }

    return statistics;
  }

  /**
   * Link receipt to expense
   */
  async linkToExpense(receiptId: UUID, expenseId: UUID, context: UserContext): Promise<void> {
    const query = `
      UPDATE receipts
      SET expense_id = $1,
          updated_by = $2,
          updated_at = NOW(),
          version = version + 1
      WHERE id = $3
        AND organization_id = $4
    `;
    await this.database.query(query, [expenseId, context.userId, receiptId, context.organizationId]);
  }

  /**
   * Link receipt to mileage
   */
  async linkToMileage(receiptId: UUID, mileageId: UUID, context: UserContext): Promise<void> {
    const query = `
      UPDATE receipts
      SET mileage_id = $1,
          updated_by = $2,
          updated_at = NOW(),
          version = version + 1
      WHERE id = $3
        AND organization_id = $4
    `;
    await this.database.query(query, [mileageId, context.userId, receiptId, context.organizationId]);
  }
}
