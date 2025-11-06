import type { UUID, UserContext } from '@care-commons/core';
import { PermissionService } from '@care-commons/core';
import type {
  Receipt,
  UploadReceiptInput,
  UpdateReceiptInput,
  VerifyReceiptInput,
  RejectReceiptInput,
  ReceiptQueryFilter,
  ReceiptStatistics,
} from '../types/receipt.js';
import { ReceiptRepository } from '../repository/receipt-repository.js';

/**
 * Service for managing receipts
 */
export class ReceiptService {
  constructor(
    private repository: ReceiptRepository,
    private permissions: PermissionService
  ) {}

  /**
   * Upload a new receipt
   */
  async uploadReceipt(
    input: UploadReceiptInput,
    context: UserContext
  ): Promise<Receipt> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'receipts:create')) {
      throw new Error('Insufficient permissions to upload receipts');
    }

    // Business validation
    if (!input.fileName || input.fileName.trim().length === 0) {
      throw new Error('File name is required');
    }

    if (!input.filePath || input.filePath.trim().length === 0) {
      throw new Error('File path is required');
    }

    if (input.fileSize <= 0) {
      throw new Error('File size must be positive');
    }

    // Validate file size (max 10MB)
    const maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
    if (input.fileSize > maxFileSize) {
      throw new Error('File size exceeds maximum allowed size of 10MB');
    }

    // Validate amount if provided
    if (input.amount !== undefined && input.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    // Create receipt with uploaded status
    const receipt: Partial<Receipt> = {
      employeeId: input.employeeId,
      expenseId: input.expenseId,
      mileageId: input.mileageId,
      uploadDate: new Date().toISOString(),
      receiptDate: input.receiptDate,
      merchantName: input.merchantName?.trim(),
      amount: input.amount,
      currency: input.currency || 'USD',
      fileName: input.fileName.trim(),
      fileType: input.fileType,
      fileSize: input.fileSize,
      filePath: input.filePath.trim(),
      thumbnailPath: input.thumbnailPath?.trim(),
      status: 'UPLOADED',
      organizationId: context.organizationId,
      branchId: context.branchIds[0],
      notes: input.notes?.trim(),
      tags: input.tags,
    };

    return await this.repository.create(receipt, context);
  }

  /**
   * Update receipt metadata
   */
  async updateReceipt(
    receiptId: UUID,
    input: UpdateReceiptInput,
    context: UserContext
  ): Promise<Receipt> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'receipts:update')) {
      throw new Error('Insufficient permissions to update receipts');
    }

    // Get existing receipt
    const existing = await this.repository.findById(receiptId, context);
    if (!existing) {
      throw new Error('Receipt not found');
    }

    // Can only update uploaded or rejected receipts
    if (existing.status !== 'UPLOADED' && existing.status !== 'REJECTED') {
      throw new Error('Can only update receipts with UPLOADED or REJECTED status');
    }

    // Validate updated values
    if (input.amount !== undefined && input.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    // Build update object
    const updates: Partial<Receipt> = {};
    if (input.receiptDate !== undefined) updates.receiptDate = input.receiptDate;
    if (input.merchantName !== undefined) updates.merchantName = input.merchantName.trim();
    if (input.amount !== undefined) updates.amount = input.amount;
    if (input.currency !== undefined) updates.currency = input.currency;
    if (input.expenseId !== undefined) updates.expenseId = input.expenseId;
    if (input.mileageId !== undefined) updates.mileageId = input.mileageId;
    if (input.notes !== undefined) updates.notes = input.notes.trim();
    if (input.tags !== undefined) updates.tags = input.tags;

    return await this.repository.update(receiptId, updates, context);
  }

  /**
   * Verify receipts
   */
  async verifyReceipts(
    input: VerifyReceiptInput,
    context: UserContext
  ): Promise<Receipt[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'receipts:verify')) {
      throw new Error('Insufficient permissions to verify receipts');
    }

    if (input.receiptIds.length === 0) {
      throw new Error('At least one receipt must be selected');
    }

    // Validate all receipts are in UPLOADED status
    const receipts = await Promise.all(
      input.receiptIds.map((id) => this.repository.findById(id, context))
    );

    for (const receipt of receipts) {
      if (!receipt) {
        throw new Error('One or more receipts not found');
      }
      if (receipt.status !== 'UPLOADED') {
        throw new Error(`Receipt ${receipt.id} is not in UPLOADED status`);
      }
    }

    // Update status to VERIFIED
    const now = new Date().toISOString();
    for (const receiptId of input.receiptIds) {
      await this.repository.update(
        receiptId,
        {
          status: 'VERIFIED',
          verifiedBy: context.userId,
          verifiedAt: now,
          notes: input.notes,
        },
        context
      );
    }

    // Fetch and return updated receipts
    return await Promise.all(
      input.receiptIds.map((id) => this.repository.findById(id, context))
    ) as Receipt[];
  }

  /**
   * Reject receipts
   */
  async rejectReceipts(
    input: RejectReceiptInput,
    context: UserContext
  ): Promise<Receipt[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'receipts:verify')) {
      throw new Error('Insufficient permissions to reject receipts');
    }

    if (input.receiptIds.length === 0) {
      throw new Error('At least one receipt must be selected');
    }

    if (!input.rejectionReason || input.rejectionReason.trim().length === 0) {
      throw new Error('Rejection reason is required');
    }

    // Validate all receipts are in UPLOADED status
    const receipts = await Promise.all(
      input.receiptIds.map((id) => this.repository.findById(id, context))
    );

    for (const receipt of receipts) {
      if (!receipt) {
        throw new Error('One or more receipts not found');
      }
      if (receipt.status !== 'UPLOADED') {
        throw new Error(`Receipt ${receipt.id} is not in UPLOADED status`);
      }
    }

    // Update status to REJECTED
    for (const receiptId of input.receiptIds) {
      await this.repository.update(
        receiptId,
        {
          status: 'REJECTED',
          rejectionReason: input.rejectionReason.trim(),
        },
        context
      );
    }

    // Fetch and return updated receipts
    return await Promise.all(
      input.receiptIds.map((id) => this.repository.findById(id, context))
    ) as Receipt[];
  }

  /**
   * Archive receipts
   */
  async archiveReceipts(receiptIds: UUID[], context: UserContext): Promise<Receipt[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'receipts:archive')) {
      throw new Error('Insufficient permissions to archive receipts');
    }

    if (receiptIds.length === 0) {
      throw new Error('At least one receipt must be selected');
    }

    // Update status to ARCHIVED
    for (const receiptId of receiptIds) {
      await this.repository.update(receiptId, { status: 'ARCHIVED' }, context);
    }

    // Fetch and return updated receipts
    return await Promise.all(
      receiptIds.map((id) => this.repository.findById(id, context))
    ) as Receipt[];
  }

  /**
   * Get receipt by ID
   */
  async getReceiptById(receiptId: UUID, context: UserContext): Promise<Receipt | null> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'receipts:view')) {
      throw new Error('Insufficient permissions to view receipts');
    }

    return await this.repository.findById(receiptId, context);
  }

  /**
   * Get receipts for an employee
   */
  async getEmployeeReceipts(employeeId: UUID, context: UserContext): Promise<Receipt[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'receipts:view')) {
      throw new Error('Insufficient permissions to view receipts');
    }

    return await this.repository.findByEmployee(employeeId, context);
  }

  /**
   * Get receipts for an expense
   */
  async getExpenseReceipts(expenseId: UUID, context: UserContext): Promise<Receipt[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'receipts:view')) {
      throw new Error('Insufficient permissions to view receipts');
    }

    return await this.repository.findByExpense(expenseId, context);
  }

  /**
   * Get receipts for a mileage entry
   */
  async getMileageReceipts(mileageId: UUID, context: UserContext): Promise<Receipt[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'receipts:view')) {
      throw new Error('Insufficient permissions to view receipts');
    }

    return await this.repository.findByMileage(mileageId, context);
  }

  /**
   * Get unlinked receipts
   */
  async getUnlinkedReceipts(context: UserContext): Promise<Receipt[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'receipts:view')) {
      throw new Error('Insufficient permissions to view receipts');
    }

    return await this.repository.findUnlinked(context);
  }

  /**
   * Query receipts with filters
   */
  async queryReceipts(
    filter: ReceiptQueryFilter,
    context: UserContext
  ): Promise<Receipt[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'receipts:view')) {
      throw new Error('Insufficient permissions to view receipts');
    }

    return await this.repository.findWithFilters(filter, context);
  }

  /**
   * Get receipt statistics
   */
  async getReceiptStatistics(
    filter: ReceiptQueryFilter,
    context: UserContext
  ): Promise<ReceiptStatistics> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'receipts:view')) {
      throw new Error('Insufficient permissions to view receipts');
    }

    return await this.repository.getStatistics(filter, context);
  }

  /**
   * Link receipt to expense
   */
  async linkToExpense(
    receiptId: UUID,
    expenseId: UUID,
    context: UserContext
  ): Promise<Receipt> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'receipts:update')) {
      throw new Error('Insufficient permissions to link receipts');
    }

    // Get existing receipt
    const existing = await this.repository.findById(receiptId, context);
    if (!existing) {
      throw new Error('Receipt not found');
    }

    // Link receipt to expense
    await this.repository.linkToExpense(receiptId, expenseId, context);

    // Fetch and return updated receipt
    const updated = await this.repository.findById(receiptId, context);
    if (!updated) {
      throw new Error('Failed to fetch updated receipt');
    }

    return updated;
  }

  /**
   * Link receipt to mileage
   */
  async linkToMileage(
    receiptId: UUID,
    mileageId: UUID,
    context: UserContext
  ): Promise<Receipt> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'receipts:update')) {
      throw new Error('Insufficient permissions to link receipts');
    }

    // Get existing receipt
    const existing = await this.repository.findById(receiptId, context);
    if (!existing) {
      throw new Error('Receipt not found');
    }

    // Link receipt to mileage
    await this.repository.linkToMileage(receiptId, mileageId, context);

    // Fetch and return updated receipt
    const updated = await this.repository.findById(receiptId, context);
    if (!updated) {
      throw new Error('Failed to fetch updated receipt');
    }

    return updated;
  }

  /**
   * Delete a receipt
   */
  async deleteReceipt(receiptId: UUID, context: UserContext): Promise<void> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'receipts:delete')) {
      throw new Error('Insufficient permissions to delete receipts');
    }

    // Get existing receipt
    const existing = await this.repository.findById(receiptId, context);
    if (!existing) {
      throw new Error('Receipt not found');
    }

    // Can only delete uploaded or rejected receipts
    if (existing.status !== 'UPLOADED' && existing.status !== 'REJECTED') {
      throw new Error('Can only delete receipts with UPLOADED or REJECTED status');
    }

    await this.repository.delete(receiptId, context);
  }
}
