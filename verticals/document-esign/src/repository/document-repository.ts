/**
 * Document repository - data access layer
 */

import type { Repository, Database, PaginatedResult } from '@care-commons/core'
import type {
  Document,
  DocumentSearchFilters,
  CreateDocumentInput,
  UpdateDocumentInput,
} from '../types/document.js'

/**
 * Document repository interface
 * Defines data access operations for documents
 */
export interface IDocumentRepository {
  /**
   * Create a new document
   */
  create(input: CreateDocumentInput, createdBy: string): Promise<Document>

  /**
   * Get document by ID
   */
  findById(id: string): Promise<Document | null>

  /**
   * Get document by document number
   */
  findByDocumentNumber(documentNumber: string): Promise<Document | null>

  /**
   * Search documents with filters
   */
  search(filters: DocumentSearchFilters): Promise<PaginatedResult<Document>>

  /**
   * Update document
   */
  update(id: string, input: UpdateDocumentInput, updatedBy: string): Promise<Document>

  /**
   * Delete document (soft delete)
   */
  delete(id: string, deletedBy: string): Promise<void>

  /**
   * Get documents by owner
   */
  findByOwner(ownerId: string, ownerType: string): Promise<Document[]>

  /**
   * Get documents expiring before date
   */
  findExpiringBefore(date: Date): Promise<Document[]>

  /**
   * Get document versions
   */
  getVersionHistory(documentId: string): Promise<Document[]>

  /**
   * Update last accessed timestamp
   */
  updateLastAccessed(documentId: string, userId: string): Promise<void>

  /**
   * Increment download count
   */
  incrementDownloadCount(documentId: string): Promise<void>
}

/**
 * In-memory document repository implementation
 * This is a placeholder - in production, use PostgreSQL/MongoDB
 */
export class DocumentRepository implements IDocumentRepository {
  private documents: Map<string, Document> = new Map()

  async create(input: CreateDocumentInput, createdBy: string): Promise<Document> {
    const now = new Date().toISOString()
    const document: Document = {
      id: this.generateId(),
      ...input,
      documentNumber: this.generateDocumentNumber(),
      currentVersion: 1,
      versions: [
        {
          versionNumber: 1,
          storageInfo: input.storageInfo,
          uploadedAt: now,
          uploadedBy: createdBy,
          fileSize: input.fileSize,
          checksum: this.generateChecksum(input.fileName),
        },
      ],
      currentFileSize: input.fileSize,
      permissions: [],
      status: 'ACTIVE',
      isSigned: false,
      downloadCount: 0,
      storageInfo: input.storageInfo,
      metadata: input.metadata || { title: input.title },
      createdAt: now,
      createdBy,
      updatedAt: now,
      updatedBy: createdBy,
      version: 1,
    }

    this.documents.set(document.id, document)
    return document
  }

  async findById(id: string): Promise<Document | null> {
    return this.documents.get(id) || null
  }

  async findByDocumentNumber(documentNumber: string): Promise<Document | null> {
    for (const doc of this.documents.values()) {
      if (doc.documentNumber === documentNumber) {
        return doc
      }
    }
    return null
  }

  async search(filters: DocumentSearchFilters): Promise<PaginatedResult<Document>> {
    let results = Array.from(this.documents.values())

    // Apply filters
    if (filters.organizationId) {
      results = results.filter((d) => d.organizationId === filters.organizationId)
    }
    if (filters.branchId) {
      results = results.filter((d) => d.branchId === filters.branchId)
    }
    if (filters.documentType) {
      results = results.filter((d) => d.documentType === filters.documentType)
    }
    if (filters.category) {
      results = results.filter((d) => d.category === filters.category)
    }
    if (filters.status) {
      results = results.filter((d) => d.status === filters.status)
    }
    if (filters.ownerId) {
      results = results.filter((d) => d.ownerId === filters.ownerId)
    }
    if (filters.searchText) {
      const search = filters.searchText.toLowerCase()
      results = results.filter(
        (d) =>
          d.title.toLowerCase().includes(search) ||
          d.description?.toLowerCase().includes(search) ||
          d.fileName.toLowerCase().includes(search),
      )
    }

    return {
      data: results,
      total: results.length,
      page: 1,
      pageSize: results.length,
      totalPages: 1,
    }
  }

  async update(id: string, input: UpdateDocumentInput, updatedBy: string): Promise<Document> {
    const document = await this.findById(id)
    if (!document) {
      throw new Error('Document not found')
    }

    const updated: Document = {
      ...document,
      ...input,
      updatedAt: new Date().toISOString(),
      updatedBy,
      version: document.version + 1,
    }

    this.documents.set(id, updated)
    return updated
  }

  async delete(id: string, deletedBy: string): Promise<void> {
    const document = await this.findById(id)
    if (!document) {
      throw new Error('Document not found')
    }

    const updated: Document = {
      ...document,
      status: 'DELETED',
      deletedAt: new Date().toISOString(),
      deletedBy,
    }

    this.documents.set(id, updated)
  }

  async findByOwner(ownerId: string, ownerType: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (d) => d.ownerId === ownerId && d.ownerType === ownerType,
    )
  }

  async findExpiringBefore(date: Date): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (d) => d.expirationDate && new Date(d.expirationDate) <= date && d.status === 'ACTIVE',
    )
  }

  async getVersionHistory(documentId: string): Promise<Document[]> {
    const document = await this.findById(documentId)
    if (!document) return []

    // Return document instances for each version
    return document.versions.map((version, index) => ({
      ...document,
      currentVersion: version.versionNumber,
      currentFileSize: version.fileSize,
      storageInfo: version.storageInfo,
    }))
  }

  async updateLastAccessed(documentId: string, userId: string): Promise<void> {
    const document = await this.findById(documentId)
    if (!document) return

    document.lastAccessedAt = new Date().toISOString()
    document.lastAccessedBy = userId
    this.documents.set(documentId, document)
  }

  async incrementDownloadCount(documentId: string): Promise<void> {
    const document = await this.findById(documentId)
    if (!document) return

    document.downloadCount += 1
    this.documents.set(documentId, document)
  }

  // Helper methods
  private generateId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateDocumentNumber(): string {
    return `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  }

  private generateChecksum(fileName: string): string {
    // Simplified checksum - in production use actual file hash
    return `sha256_${fileName}_${Date.now()}`
  }
}
