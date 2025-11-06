/**
 * HTTP/API handlers for Document Management
 *
 * RESTful endpoints for document CRUD operations
 */

import type { DocumentService, UserContext } from '../service/document-service.js'
import type {
  CreateDocumentInput,
  UpdateDocumentInput,
  DocumentSearchFilters,
  UploadDocumentVersionInput,
} from '../types/document.js'

/**
 * Document API handlers
 */
export class DocumentHandlers {
  constructor(private documentService: DocumentService) {}

  /**
   * POST /api/documents
   * Create a new document
   */
  async createDocument(input: CreateDocumentInput, context: UserContext) {
    try {
      const document = await this.documentService.createDocument(input, context)
      return {
        success: true,
        data: document,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create document',
      }
    }
  }

  /**
   * GET /api/documents/:id
   * Get document by ID
   */
  async getDocumentById(id: string, context: UserContext) {
    try {
      const document = await this.documentService.getDocumentById(id, context)
      return {
        success: true,
        data: document,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get document',
      }
    }
  }

  /**
   * GET /api/documents
   * Search documents with filters
   */
  async searchDocuments(filters: DocumentSearchFilters, context: UserContext) {
    try {
      const result = await this.documentService.searchDocuments(filters, context)
      return {
        success: true,
        data: result,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search documents',
      }
    }
  }

  /**
   * PUT /api/documents/:id
   * Update document
   */
  async updateDocument(id: string, input: UpdateDocumentInput, context: UserContext) {
    try {
      const document = await this.documentService.updateDocument(id, input, context)
      return {
        success: true,
        data: document,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update document',
      }
    }
  }

  /**
   * DELETE /api/documents/:id
   * Delete document (soft delete)
   */
  async deleteDocument(id: string, context: UserContext) {
    try {
      await this.documentService.deleteDocument(id, context)
      return {
        success: true,
        message: 'Document deleted successfully',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete document',
      }
    }
  }

  /**
   * POST /api/documents/:id/versions
   * Upload a new version of a document
   */
  async uploadVersion(
    documentId: string,
    input: UploadDocumentVersionInput,
    context: UserContext,
  ) {
    try {
      const document = await this.documentService.uploadVersion(documentId, input, context)
      return {
        success: true,
        data: document,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload version',
      }
    }
  }

  /**
   * GET /api/documents/:id/versions
   * Get version history for a document
   */
  async getVersionHistory(documentId: string, context: UserContext) {
    try {
      const versions = await this.documentService.getVersionHistory(documentId, context)
      return {
        success: true,
        data: versions,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get version history',
      }
    }
  }

  /**
   * GET /api/documents/:id/download
   * Download document
   */
  async downloadDocument(documentId: string, context: UserContext) {
    try {
      const document = await this.documentService.downloadDocument(documentId, context)
      return {
        success: true,
        data: document,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to download document',
      }
    }
  }

  /**
   * GET /api/documents/owner/:ownerId
   * Get documents by owner
   */
  async getDocumentsByOwner(ownerId: string, ownerType: string, context: UserContext) {
    try {
      const documents = await this.documentService.getDocumentsByOwner(
        ownerId,
        ownerType,
        context,
      )
      return {
        success: true,
        data: documents,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get documents by owner',
      }
    }
  }

  /**
   * POST /api/documents/:id/archive
   * Archive document
   */
  async archiveDocument(documentId: string, context: UserContext) {
    try {
      const document = await this.documentService.archiveDocument(documentId, context)
      return {
        success: true,
        data: document,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to archive document',
      }
    }
  }
}
