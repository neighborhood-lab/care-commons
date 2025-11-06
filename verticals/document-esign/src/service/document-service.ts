/**
 * Document service - business logic layer
 */

import type {
  Document,
  CreateDocumentInput,
  UpdateDocumentInput,
  DocumentSearchFilters,
  UploadDocumentVersionInput,
} from '../types/document.js'
import type { IDocumentRepository } from '../repository/document-repository.js'
import { DocumentValidator } from '../validation/document-validator.js'

export interface UserContext {
  userId: string
  organizationId: string
  branchId?: string
  permissions: string[]
}

export class DocumentService {
  constructor(
    private repository: IDocumentRepository,
    private validator: DocumentValidator = new DocumentValidator(),
  ) {}

  /**
   * Create a new document
   */
  async createDocument(input: CreateDocumentInput, context: UserContext): Promise<Document> {
    // Validate input
    const validation = this.validator.validateCreate(input)
    if (!validation.success) {
      throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`)
    }

    // Validate file extension matches MIME type
    if (!this.validator.validateFileExtension(input.fileName, input.mimeType)) {
      throw new Error('File extension does not match MIME type')
    }

    // Validate file size
    if (!this.validator.validateFileSize(input.fileSize)) {
      throw new Error('File size exceeds maximum allowed size')
    }

    // Validate retention date is after expiration date
    if (
      !this.validator.validateRetentionAfterExpiration(
        input.expirationDate,
        input.retentionDate,
      )
    ) {
      throw new Error('Retention date must be after expiration date')
    }

    // Check organizational access
    if (input.organizationId !== context.organizationId) {
      throw new Error('Access denied: Cannot create document for different organization')
    }

    return this.repository.create(input, context.userId)
  }

  /**
   * Get document by ID
   */
  async getDocumentById(id: string, context: UserContext): Promise<Document> {
    const document = await this.repository.findById(id)
    if (!document) {
      throw new Error('Document not found')
    }

    // Check organizational access
    if (document.organizationId !== context.organizationId) {
      throw new Error('Access denied')
    }

    // Update last accessed
    await this.repository.updateLastAccessed(id, context.userId)

    return document
  }

  /**
   * Get document by document number
   */
  async getDocumentByNumber(documentNumber: string): Promise<Document | null> {
    return this.repository.findByDocumentNumber(documentNumber)
  }

  /**
   * Search documents
   */
  async searchDocuments(filters: DocumentSearchFilters, context: UserContext) {
    // Enforce organizational filtering
    const enforcedFilters = {
      ...filters,
      organizationId: context.organizationId,
    }

    return this.repository.search(enforcedFilters)
  }

  /**
   * Update document
   */
  async updateDocument(
    id: string,
    input: UpdateDocumentInput,
    context: UserContext,
  ): Promise<Document> {
    const document = await this.repository.findById(id)
    if (!document) {
      throw new Error('Document not found')
    }

    // Check organizational access
    if (document.organizationId !== context.organizationId) {
      throw new Error('Access denied')
    }

    // Validate input
    const validation = this.validator.validateUpdate(input)
    if (!validation.success) {
      throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`)
    }

    return this.repository.update(id, input, context.userId)
  }

  /**
   * Delete document (soft delete)
   */
  async deleteDocument(id: string, context: UserContext): Promise<void> {
    const document = await this.repository.findById(id)
    if (!document) {
      throw new Error('Document not found')
    }

    // Check organizational access
    if (document.organizationId !== context.organizationId) {
      throw new Error('Access denied')
    }

    await this.repository.delete(id, context.userId)
  }

  /**
   * Upload a new version of a document
   */
  async uploadVersion(
    documentId: string,
    input: UploadDocumentVersionInput,
    context: UserContext,
  ): Promise<Document> {
    const document = await this.repository.findById(documentId)
    if (!document) {
      throw new Error('Document not found')
    }

    // Check organizational access
    if (document.organizationId !== context.organizationId) {
      throw new Error('Access denied')
    }

    // Validate input
    const validation = this.validator.validateUploadVersion(input)
    if (!validation.success) {
      throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`)
    }

    // Add new version to document
    const newVersionNumber = document.currentVersion + 1
    const newVersion = {
      versionNumber: newVersionNumber,
      versionLabel: input.versionLabel,
      storageInfo: input.storageInfo,
      uploadedAt: new Date().toISOString(),
      uploadedBy: context.userId,
      fileSize: input.fileSize,
      checksum: input.checksum,
      changeNotes: input.changeNotes,
    }

    document.versions.push(newVersion)
    document.currentVersion = newVersionNumber
    document.currentFileSize = input.fileSize
    document.storageInfo = input.storageInfo

    return this.repository.update(
      documentId,
      {
        // Update will be handled by repository
      },
      context.userId,
    )
  }

  /**
   * Get version history for a document
   */
  async getVersionHistory(documentId: string, context: UserContext): Promise<Document[]> {
    const document = await this.repository.findById(documentId)
    if (!document) {
      throw new Error('Document not found')
    }

    // Check organizational access
    if (document.organizationId !== context.organizationId) {
      throw new Error('Access denied')
    }

    return this.repository.getVersionHistory(documentId)
  }

  /**
   * Download document
   */
  async downloadDocument(documentId: string, context: UserContext): Promise<Document> {
    const document = await this.getDocumentById(documentId, context)

    // Increment download count
    await this.repository.incrementDownloadCount(documentId)

    return document
  }

  /**
   * Get documents by owner
   */
  async getDocumentsByOwner(
    ownerId: string,
    ownerType: string,
    context: UserContext,
  ): Promise<Document[]> {
    const documents = await this.repository.findByOwner(ownerId, ownerType)

    // Filter by organization
    return documents.filter((doc) => doc.organizationId === context.organizationId)
  }

  /**
   * Get expiring documents
   */
  async getExpiringDocuments(beforeDate: Date, context: UserContext): Promise<Document[]> {
    const documents = await this.repository.findExpiringBefore(beforeDate)

    // Filter by organization
    return documents.filter((doc) => doc.organizationId === context.organizationId)
  }

  /**
   * Archive document
   */
  async archiveDocument(documentId: string, context: UserContext): Promise<Document> {
    return this.updateDocument(
      documentId,
      {
        status: 'ARCHIVED',
      },
      context,
    )
  }

  /**
   * Check if user has permission to access document
   */
  private hasDocumentAccess(document: Document, context: UserContext): boolean {
    // Check organizational access
    if (document.organizationId !== context.organizationId) {
      return false
    }

    // Check if user is owner
    if (document.ownerId === context.userId) {
      return true
    }

    // Check permissions
    const userPermission = document.permissions.find(
      (p) => p.userId === context.userId && (!p.expiresAt || new Date(p.expiresAt) > new Date()),
    )

    return !!userPermission
  }
}
