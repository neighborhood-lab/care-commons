/**
 * CSV parsing utility
 * 
 * Provides robust CSV parsing with error handling and validation
 */

import Papa from 'papaparse';
import { ParseResult, ImportError } from './types.js';

export interface CsvParserOptions {
  /**
   * Expected column headers (for validation)
   */
  expectedHeaders?: string[];

  /**
   * If true, allow additional columns beyond expectedHeaders
   */
  allowExtraColumns?: boolean;

  /**
   * If true, skip empty rows
   */
  skipEmptyRows?: boolean;

  /**
   * Maximum file size in bytes (default: 10MB)
   */
  maxFileSize?: number;

  /**
   * Transform function for normalizing column names
   */
  headerTransform?: (header: string) => string;
}

const DEFAULT_OPTIONS: CsvParserOptions = {
  skipEmptyRows: true,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  headerTransform: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
};

/**
 * Parse CSV file buffer to typed records
 */
// eslint-disable-next-line sonarjs/cognitive-complexity, max-lines-per-function, complexity
export function parseCsv<T>(
  fileBuffer: Buffer,
  _fileName: string,
  options: CsvParserOptions = {}
): ParseResult<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errors: ImportError[] = [];

  // Validate file size
  if (opts.maxFileSize !== undefined && fileBuffer.length > opts.maxFileSize) {
    return {
      records: [],
      errors: [
        {
          row: 0,
          message: `File size ${fileBuffer.length} bytes exceeds maximum ${opts.maxFileSize} bytes`,
          severity: 'ERROR',
        },
      ],
      headers: [],
      totalRows: 0,
    };
  }

  // Parse CSV with papaparse
  const csvContent = fileBuffer.toString('utf-8');
  const parseResult = Papa.parse<T>(csvContent, {
    header: true,
    skipEmptyLines: opts.skipEmptyRows === true ? 'greedy' : false,
    transformHeader: opts.headerTransform ?? ((h: string) => h),
    dynamicTyping: false, // Keep all values as strings for custom parsing
  });

  // Check for parsing errors
  if (parseResult.errors.length > 0) {
    for (const error of parseResult.errors) {
      errors.push({
        row: typeof error.row === 'number' ? error.row + 1 : 0,
        message: `CSV parsing error: ${error.message}`,
        severity: 'ERROR',
        data: error as unknown as Record<string, unknown>,
      });
    }
  }

  const headers = parseResult.meta.fields !== undefined ? parseResult.meta.fields : [];
  const records = parseResult.data as T[];

  // Validate headers if expectedHeaders provided
  if (opts.expectedHeaders !== undefined && opts.expectedHeaders.length > 0) {
    const normalizedExpected = opts.expectedHeaders.map((h: string) =>
      opts.headerTransform !== undefined ? opts.headerTransform(h) : h
    );
    const normalizedActual = headers.map((h: string) =>
      opts.headerTransform !== undefined ? opts.headerTransform(h) : h
    );

    // Check for missing required headers
    const missingHeaders = normalizedExpected.filter((h) => !normalizedActual.includes(h));
    if (missingHeaders.length > 0) {
      errors.push({
        row: 0,
        message: `Missing required columns: ${missingHeaders.join(', ')}`,
        severity: 'ERROR',
      });
    }

    // Check for unexpected headers (if not allowed)
    if (opts.allowExtraColumns !== true) {
      const extraHeaders = normalizedActual.filter((h) => !normalizedExpected.includes(h));
      if (extraHeaders.length > 0) {
        errors.push({
          row: 0,
          message: `Unexpected columns: ${extraHeaders.join(', ')}`,
          severity: 'WARNING',
        });
      }
    }
  }

  return {
    records,
    errors,
    headers,
    totalRows: records.length + 1, // +1 for header row
  };
}

/**
 * Convert array of objects to CSV string
 */
export function toCsv<T extends Record<string, unknown>>(
  records: T[],
  headers?: string[]
): string {
  if (records.length === 0) {
    return headers !== undefined ? headers.join(',') + '\n' : '';
  }

  const firstRecord = records[0];
  const actualHeaders = headers ?? (firstRecord !== undefined ? Object.keys(firstRecord) : []);

  const csvContent = Papa.unparse(records, {
    columns: actualHeaders,
    header: true,
  });

  return csvContent;
}
