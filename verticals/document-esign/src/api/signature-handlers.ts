/**
 * HTTP/API handlers for eSignature Management
 *
 * RESTful endpoints for signature request operations
 */

import type { SignatureService } from '../service/signature-service.js'
import type { UserContext } from '../service/document-service.js'
import type {
  CreateSignatureRequestInput,
  SignDocumentInput,
  DeclineSignatureInput,
  SignatureRequestSearchFilters,
} from '../types/signature.js'

/**
 * Signature API handlers
 */
export class SignatureHandlers {
  constructor(private signatureService: SignatureService) {}

  /**
   * POST /api/signature-requests
   * Create a new signature request
   */
  async createSignatureRequest(input: CreateSignatureRequestInput, context: UserContext) {
    try {
      const request = await this.signatureService.createSignatureRequest(input, context)
      return {
        success: true,
        data: request,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create signature request',
      }
    }
  }

  /**
   * GET /api/signature-requests/:id
   * Get signature request by ID
   */
  async getSignatureRequestById(id: string, context: UserContext) {
    try {
      const request = await this.signatureService.getSignatureRequestById(id, context)
      return {
        success: true,
        data: request,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get signature request',
      }
    }
  }

  /**
   * GET /api/signature-requests
   * Search signature requests with filters
   */
  async searchSignatureRequests(filters: SignatureRequestSearchFilters, context: UserContext) {
    try {
      const result = await this.signatureService.searchSignatureRequests(filters, context)
      return {
        success: true,
        data: result,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search signature requests',
      }
    }
  }

  /**
   * POST /api/signature-requests/:id/send
   * Send signature request to signers
   */
  async sendSignatureRequest(requestId: string, context: UserContext) {
    try {
      const request = await this.signatureService.sendSignatureRequest(requestId, context)
      return {
        success: true,
        data: request,
        message: 'Signature request sent successfully',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send signature request',
      }
    }
  }

  /**
   * POST /api/signature-requests/:id/sign
   * Sign a document
   */
  async signDocument(requestId: string, input: SignDocumentInput, context: UserContext) {
    try {
      const request = await this.signatureService.signDocument(requestId, input, context)
      return {
        success: true,
        data: request,
        message: 'Document signed successfully',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sign document',
      }
    }
  }

  /**
   * POST /api/signature-requests/:id/decline
   * Decline signature request
   */
  async declineSignature(
    requestId: string,
    input: DeclineSignatureInput,
    context: UserContext,
  ) {
    try {
      const request = await this.signatureService.declineSignature(requestId, input, context)
      return {
        success: true,
        data: request,
        message: 'Signature request declined',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to decline signature',
      }
    }
  }

  /**
   * POST /api/signature-requests/:id/cancel
   * Cancel signature request
   */
  async cancelSignatureRequest(requestId: string, reason: string, context: UserContext) {
    try {
      await this.signatureService.cancelSignatureRequest(requestId, reason, context)
      return {
        success: true,
        message: 'Signature request cancelled',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel signature request',
      }
    }
  }

  /**
   * GET /api/signature-requests/pending/:email
   * Get pending signature requests for a signer
   */
  async getPendingForSigner(signerEmail: string) {
    try {
      const requests = await this.signatureService.getPendingForSigner(signerEmail)
      return {
        success: true,
        data: requests,
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to get pending signature requests',
      }
    }
  }

  /**
   * GET /api/signature-requests/expiring
   * Get expiring signature requests
   */
  async getExpiringRequests(beforeDate: Date, context: UserContext) {
    try {
      const requests = await this.signatureService.getExpiringRequests(beforeDate, context)
      return {
        success: true,
        data: requests,
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to get expiring signature requests',
      }
    }
  }
}
