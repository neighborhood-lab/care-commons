import type { Entity, UUID, Timestamp } from '@care-commons/core';

/**
 * Receipt file types
 */
export type ReceiptFileType =
  | 'IMAGE_JPEG'
  | 'IMAGE_PNG'
  | 'IMAGE_GIF'
  | 'PDF'
  | 'OTHER';

/**
 * Receipt status types
 */
export type ReceiptStatus =
  | 'UPLOADED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'ARCHIVED';

/**
 * Receipt entity representing proof of expense
 */
export interface Receipt extends Entity {
  // Employee and expense information
  employeeId: UUID;
  expenseId?: UUID; // Linked to expense entry
  mileageId?: UUID; // Linked to mileage entry

  // Receipt details
  uploadDate: Timestamp;
  receiptDate?: Timestamp;
  merchantName?: string;
  amount?: number; // In cents, extracted from receipt
  currency?: string;

  // File information
  fileName: string;
  fileType: ReceiptFileType;
  fileSize: number; // In bytes
  filePath: string; // Storage path or URL
  thumbnailPath?: string;

  // OCR and extracted data
  ocrText?: string;
  extractedData?: Record<string, unknown>; // JSON object with extracted fields

  // Status and verification
  status: ReceiptStatus;
  verifiedBy?: UUID;
  verifiedAt?: Timestamp;
  rejectionReason?: string;

  // Metadata
  organizationId: UUID;
  branchId: UUID;
  notes?: string;
  tags?: string[];
}

/**
 * Input for uploading a new receipt
 */
export interface UploadReceiptInput {
  employeeId: UUID;
  expenseId?: UUID;
  mileageId?: UUID;
  receiptDate?: Timestamp;
  merchantName?: string;
  amount?: number;
  currency?: string;
  fileName: string;
  fileType: ReceiptFileType;
  fileSize: number;
  filePath: string;
  thumbnailPath?: string;
  notes?: string;
  tags?: string[];
}

/**
 * Input for updating receipt metadata
 */
export interface UpdateReceiptInput {
  receiptDate?: Timestamp;
  merchantName?: string;
  amount?: number;
  currency?: string;
  expenseId?: UUID;
  mileageId?: UUID;
  notes?: string;
  tags?: string[];
}

/**
 * Input for verifying a receipt
 */
export interface VerifyReceiptInput {
  receiptIds: UUID[];
  notes?: string;
}

/**
 * Input for rejecting a receipt
 */
export interface RejectReceiptInput {
  receiptIds: UUID[];
  rejectionReason: string;
}

/**
 * Filter criteria for querying receipts
 */
export interface ReceiptQueryFilter {
  employeeId?: UUID;
  expenseId?: UUID;
  mileageId?: UUID;
  status?: ReceiptStatus;
  startDate?: Timestamp;
  endDate?: Timestamp;
  fileType?: ReceiptFileType;
  organizationId?: UUID;
  branchId?: UUID;
}

/**
 * Receipt statistics
 */
export interface ReceiptStatistics {
  totalCount: number;
  totalSize: number; // In bytes
  byFileType: Record<ReceiptFileType, number>;
  byStatus: Record<ReceiptStatus, number>;
  linkedToExpense: number;
  linkedToMileage: number;
  unlinked: number;
}
