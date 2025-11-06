import type { Entity, UUID, Timestamp } from '@care-commons/core'

/**
 * Document Management Types
 * Supports secure document storage, versioning, and lifecycle management
 */

export type DocumentStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'ARCHIVED'
  | 'DELETED'
  | 'EXPIRED'

export type DocumentType =
  | 'CARE_PLAN'
  | 'ASSESSMENT'
  | 'CONTRACT'
  | 'CONSENT_FORM'
  | 'INVOICE'
  | 'MEDICAL_RECORD'
  | 'POLICY'
  | 'PROCEDURE'
  | 'REPORT'
  | 'TRAINING_MATERIAL'
  | 'TIMESHEET'
  | 'CERTIFICATION'
  | 'OTHER'

export type DocumentCategory =
  | 'CLIENT'
  | 'CAREGIVER'
  | 'ADMINISTRATIVE'
  | 'COMPLIANCE'
  | 'FINANCIAL'
  | 'TRAINING'
  | 'LEGAL'
  | 'OPERATIONAL'

export type AccessLevel =
  | 'PUBLIC'
  | 'INTERNAL'
  | 'CONFIDENTIAL'
  | 'RESTRICTED'

export interface DocumentMetadata {
  title: string
  description?: string
  keywords?: string[]
  author?: string
  department?: string
  customFields?: Record<string, unknown>
}

export interface StorageInfo {
  storageProvider: 'LOCAL' | 'S3' | 'AZURE_BLOB' | 'GCS'
  storagePath: string
  bucket?: string
  region?: string
  url?: string
  cdnUrl?: string
}

export interface DocumentVersion {
  versionNumber: number
  versionLabel?: string
  storageInfo: StorageInfo
  uploadedAt: Timestamp
  uploadedBy: UUID
  fileSize: number
  checksum: string
  changeNotes?: string
}

export interface Document extends Entity {
  organizationId: UUID
  branchId?: UUID

  // Document identification
  documentNumber: string
  title: string
  description?: string

  // Classification
  documentType: DocumentType
  category: DocumentCategory
  tags?: string[]

  // File information
  fileName: string
  mimeType: string
  fileExtension: string
  currentFileSize: number

  // Versioning
  currentVersion: number
  versions: DocumentVersion[]

  // Access control
  accessLevel: AccessLevel
  ownerId: UUID
  ownerType: 'USER' | 'CLIENT' | 'CAREGIVER' | 'ORGANIZATION'

  // Permissions
  permissions: DocumentPermission[]

  // Status and lifecycle
  status: DocumentStatus
  expirationDate?: Date
  retentionDate?: Date
  archivedAt?: Timestamp
  archivedBy?: UUID

  // Metadata
  metadata: DocumentMetadata

  // eSignature association
  signatureRequestId?: UUID
  isSigned: boolean
  signedAt?: Timestamp

  // Storage
  storageInfo: StorageInfo

  // Audit
  lastAccessedAt?: Timestamp
  lastAccessedBy?: UUID
  downloadCount: number

  // Relationships
  relatedDocuments?: UUID[]
  parentDocumentId?: UUID
  templateId?: UUID
}

export interface DocumentPermission {
  id: UUID
  userId?: UUID
  roleId?: UUID
  teamId?: UUID
  permissionType: 'VIEW' | 'DOWNLOAD' | 'EDIT' | 'DELETE' | 'SHARE' | 'SIGN'
  grantedAt: Timestamp
  grantedBy: UUID
  expiresAt?: Timestamp
}

export interface DocumentTemplate extends Entity {
  organizationId: UUID
  name: string
  description?: string
  documentType: DocumentType
  category: DocumentCategory
  templateFile: StorageInfo
  variables?: TemplateVariable[]
  isActive: boolean
}

export interface TemplateVariable {
  name: string
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'LIST'
  label: string
  description?: string
  required: boolean
  defaultValue?: string
  validationRules?: Record<string, unknown>
}

export interface DocumentSearchFilters {
  organizationId?: UUID
  branchId?: UUID
  documentType?: DocumentType
  category?: DocumentCategory
  status?: DocumentStatus
  ownerId?: UUID
  tags?: string[]
  createdAfter?: Date
  createdBefore?: Date
  expiringBefore?: Date
  searchText?: string
}

export interface CreateDocumentInput {
  organizationId: UUID
  branchId?: UUID
  title: string
  description?: string
  documentType: DocumentType
  category: DocumentCategory
  tags?: string[]
  fileName: string
  mimeType: string
  fileExtension: string
  fileSize: number
  storageInfo: StorageInfo
  accessLevel: AccessLevel
  ownerId: UUID
  ownerType: 'USER' | 'CLIENT' | 'CAREGIVER' | 'ORGANIZATION'
  metadata?: DocumentMetadata
  expirationDate?: Date
  retentionDate?: Date
  templateId?: UUID
}

export interface UpdateDocumentInput {
  title?: string
  description?: string
  documentType?: DocumentType
  category?: DocumentCategory
  tags?: string[]
  accessLevel?: AccessLevel
  status?: DocumentStatus
  metadata?: DocumentMetadata
  expirationDate?: Date
  retentionDate?: Date
}

export interface UploadDocumentVersionInput {
  fileName: string
  fileSize: number
  storageInfo: StorageInfo
  checksum: string
  versionLabel?: string
  changeNotes?: string
}
