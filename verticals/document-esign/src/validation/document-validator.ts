/**
 * Document validation logic
 */

import { z } from 'zod'
import type {
  CreateDocumentInput,
  UpdateDocumentInput,
  UploadDocumentVersionInput,
} from '../types/document.js'

const storageInfoSchema = z.object({
  storageProvider: z.enum(['LOCAL', 'S3', 'AZURE_BLOB', 'GCS']),
  storagePath: z.string().min(1, 'Storage path required'),
  bucket: z.string().optional(),
  region: z.string().optional(),
  url: z.string().url().optional(),
  cdnUrl: z.string().url().optional(),
})

const documentMetadataSchema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  author: z.string().optional(),
  department: z.string().optional(),
  customFields: z.record(z.unknown()).optional(),
})

const createDocumentSchema = z.object({
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  title: z.string().min(1, 'Title required').max(255),
  description: z.string().max(1000).optional(),
  documentType: z.enum([
    'CARE_PLAN',
    'ASSESSMENT',
    'CONTRACT',
    'CONSENT_FORM',
    'INVOICE',
    'MEDICAL_RECORD',
    'POLICY',
    'PROCEDURE',
    'REPORT',
    'TRAINING_MATERIAL',
    'TIMESHEET',
    'CERTIFICATION',
    'OTHER',
  ]),
  category: z.enum([
    'CLIENT',
    'CAREGIVER',
    'ADMINISTRATIVE',
    'COMPLIANCE',
    'FINANCIAL',
    'TRAINING',
    'LEGAL',
    'OPERATIONAL',
  ]),
  tags: z.array(z.string()).optional(),
  fileName: z.string().min(1, 'File name required').max(255),
  mimeType: z.string().min(1, 'MIME type required'),
  fileExtension: z.string().min(1, 'File extension required'),
  fileSize: z.number().positive('File size must be positive'),
  storageInfo: storageInfoSchema,
  accessLevel: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']),
  ownerId: z.string().uuid(),
  ownerType: z.enum(['USER', 'CLIENT', 'CAREGIVER', 'ORGANIZATION']),
  metadata: documentMetadataSchema.optional(),
  expirationDate: z.date().optional(),
  retentionDate: z.date().optional(),
  templateId: z.string().uuid().optional(),
})

const updateDocumentSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional(),
    documentType: z
      .enum([
        'CARE_PLAN',
        'ASSESSMENT',
        'CONTRACT',
        'CONSENT_FORM',
        'INVOICE',
        'MEDICAL_RECORD',
        'POLICY',
        'PROCEDURE',
        'REPORT',
        'TRAINING_MATERIAL',
        'TIMESHEET',
        'CERTIFICATION',
        'OTHER',
      ])
      .optional(),
    category: z
      .enum([
        'CLIENT',
        'CAREGIVER',
        'ADMINISTRATIVE',
        'COMPLIANCE',
        'FINANCIAL',
        'TRAINING',
        'LEGAL',
        'OPERATIONAL',
      ])
      .optional(),
    tags: z.array(z.string()).optional(),
    accessLevel: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']).optional(),
    status: z
      .enum(['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'ARCHIVED', 'DELETED', 'EXPIRED'])
      .optional(),
    metadata: documentMetadataSchema.optional(),
    expirationDate: z.date().optional(),
    retentionDate: z.date().optional(),
  })
  .partial()

const uploadVersionSchema = z.object({
  fileName: z.string().min(1, 'File name required').max(255),
  fileSize: z.number().positive('File size must be positive'),
  storageInfo: storageInfoSchema,
  checksum: z.string().min(1, 'Checksum required'),
  versionLabel: z.string().max(50).optional(),
  changeNotes: z.string().max(500).optional(),
})

export class DocumentValidator {
  validateCreate(input: CreateDocumentInput): ValidationResult {
    try {
      createDocumentSchema.parse(input)
      return { success: true }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        }
      }
      return {
        success: false,
        errors: [{ path: 'unknown', message: 'Validation failed' }],
      }
    }
  }

  validateUpdate(input: UpdateDocumentInput): ValidationResult {
    try {
      updateDocumentSchema.parse(input)
      return { success: true }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        }
      }
      return {
        success: false,
        errors: [{ path: 'unknown', message: 'Validation failed' }],
      }
    }
  }

  validateUploadVersion(input: UploadDocumentVersionInput): ValidationResult {
    try {
      uploadVersionSchema.parse(input)
      return { success: true }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        }
      }
      return {
        success: false,
        errors: [{ path: 'unknown', message: 'Validation failed' }],
      }
    }
  }

  /**
   * Validate file extension against MIME type
   */
  validateFileExtension(fileName: string, mimeType: string): boolean {
    const extension = fileName.split('.').pop()?.toLowerCase()
    if (!extension) return false

    const mimeTypeMap: Record<string, string[]> = {
      'application/pdf': ['pdf'],
      'application/msword': ['doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
      'application/vnd.ms-excel': ['xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/gif': ['gif'],
      'text/plain': ['txt'],
      'text/csv': ['csv'],
    }

    const validExtensions = mimeTypeMap[mimeType]
    return validExtensions ? validExtensions.includes(extension) : true
  }

  /**
   * Validate file size against limits
   */
  validateFileSize(fileSize: number, maxSizeMB: number = 100): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    return fileSize > 0 && fileSize <= maxSizeBytes
  }

  /**
   * Validate document title format
   */
  validateDocumentTitle(title: string): boolean {
    // No special characters except spaces, hyphens, underscores, and parentheses
    return /^[a-zA-Z0-9\s\-_()]+$/.test(title)
  }

  /**
   * Validate retention date is after expiration date
   */
  validateRetentionAfterExpiration(expirationDate?: Date, retentionDate?: Date): boolean {
    if (!expirationDate || !retentionDate) return true
    return retentionDate.getTime() >= expirationDate.getTime()
  }
}

interface ValidationResult {
  success: boolean
  errors?: Array<{ path: string; message: string }>
}
