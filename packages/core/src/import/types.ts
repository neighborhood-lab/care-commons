/**
 * Core import types and interfaces
 * 
 * Provides shared infrastructure for bulk data import operations
 * across all verticals, with validation, error handling, and audit trail
 */

export interface ImportOptions {
  /**
   * If true, perform validation and return preview without persisting
   */
  dryRun?: boolean;

  /**
   * If true, update existing records on conflict (based on natural key)
   * If false, skip records that already exist
   */
  updateExisting?: boolean;

  /**
   * Organization context for multi-tenant isolation
   */
  organizationId: string;

  /**
   * User performing the import (for audit trail)
   */
  userId: string;

  /**
   * Optional batch size for processing (default: 100)
   */
  batchSize?: number;
}

export interface ImportResult<T = unknown> {
  /**
   * Overall success status
   */
  success: boolean;

  /**
   * Number of records successfully imported
   */
  imported: number;

  /**
   * Number of existing records updated
   */
  updated: number;

  /**
   * Number of records skipped (duplicates or validation failures)
   */
  skipped: number;

  /**
   * Total number of records processed
   */
  total: number;

  /**
   * Validation and processing errors by row
   */
  errors: ImportError[];

  /**
   * Successfully imported entity IDs (for dry-run preview)
   */
  importedIds?: string[];

  /**
   * Preview of data to be imported (dry-run mode)
   */
  preview?: T[];

  /**
   * Import execution metadata
   */
  metadata: ImportMetadata;
}

export interface ImportError {
  /**
   * Row number in source file (1-indexed)
   */
  row: number;

  /**
   * Field name that failed validation
   */
  field?: string;

  /**
   * Human-readable error message
   */
  message: string;

  /**
   * Error severity
   */
  severity: 'ERROR' | 'WARNING';

  /**
   * Raw row data for debugging
   */
  data?: Record<string, unknown>;
}

export interface ImportMetadata {
  /**
   * Import start timestamp
   */
  startedAt: Date;

  /**
   * Import completion timestamp
   */
  completedAt: Date;

  /**
   * Total processing time in milliseconds
   */
  durationMs: number;

  /**
   * Source file information
   */
  sourceFile: {
    name: string;
    size: number;
    mimeType: string;
  };

  /**
   * Import configuration used
   */
  options: ImportOptions;
}

/**
 * Base interface for import services
 */
export interface ImportService<TInput, TEntity> {
  /**
   * Import records from parsed CSV data
   */
  import(records: TInput[], options: ImportOptions): Promise<ImportResult<TEntity>>;

  /**
   * Validate a single record without importing
   */
  validateRecord(record: TInput, rowNumber: number): Promise<ImportError[]>;

  /**
   * Parse CSV file to typed records
   */
  parseFile(fileBuffer: Buffer, fileName: string): Promise<ParseResult<TInput>>;
}

export interface ParseResult<T> {
  /**
   * Successfully parsed records
   */
  records: T[];

  /**
   * Parsing errors (malformed CSV, invalid columns)
   */
  errors: ImportError[];

  /**
   * Detected column headers
   */
  headers: string[];

  /**
   * Total rows in file (including header)
   */
  totalRows: number;
}
