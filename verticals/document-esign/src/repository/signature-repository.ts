/**
 * Signature repository - data access layer
 */

import type { PaginatedResult } from '@care-commons/core'
import type {
  SignatureRequest,
  SignatureRequestSearchFilters,
  CreateSignatureRequestInput,
  AuditTrailEntry,
  Signer,
} from '../types/signature.js'

/**
 * Signature repository interface
 * Defines data access operations for signature requests
 */
export interface ISignatureRepository {
  /**
   * Create a new signature request
   */
  create(input: CreateSignatureRequestInput, createdBy: string): Promise<SignatureRequest>

  /**
   * Get signature request by ID
   */
  findById(id: string): Promise<SignatureRequest | null>

  /**
   * Get signature request by request number
   */
  findByRequestNumber(requestNumber: string): Promise<SignatureRequest | null>

  /**
   * Search signature requests with filters
   */
  search(filters: SignatureRequestSearchFilters): Promise<PaginatedResult<SignatureRequest>>

  /**
   * Update signature request status
   */
  updateStatus(
    id: string,
    status: string,
    updatedBy: string,
    auditEntry: AuditTrailEntry,
  ): Promise<SignatureRequest>

  /**
   * Update signer status
   */
  updateSignerStatus(requestId: string, signerId: string, status: string): Promise<void>

  /**
   * Add audit trail entry
   */
  addAuditTrail(requestId: string, entry: AuditTrailEntry): Promise<void>

  /**
   * Get pending signature requests for a signer
   */
  findPendingForSigner(signerEmail: string): Promise<SignatureRequest[]>

  /**
   * Get expiring signature requests
   */
  findExpiringBefore(date: Date): Promise<SignatureRequest[]>

  /**
   * Cancel signature request
   */
  cancel(id: string, reason: string, cancelledBy: string): Promise<void>
}

/**
 * In-memory signature repository implementation
 * This is a placeholder - in production, use PostgreSQL/MongoDB
 */
export class SignatureRepository implements ISignatureRepository {
  private signatureRequests: Map<string, SignatureRequest> = new Map()

  async create(
    input: CreateSignatureRequestInput,
    createdBy: string,
  ): Promise<SignatureRequest> {
    const now = new Date().toISOString()

    // Transform signers
    const signers: Signer[] = input.signers.map((s) => ({
      id: this.generateId(),
      name: s.name,
      email: s.email,
      phone: s.phone,
      role: s.role,
      signingOrder: s.signingOrder,
      status: 'PENDING',
      authenticationMethod: s.authenticationMethod,
      accessCode: s.accessCode,
      fields: s.fields.map((f) => ({
        id: this.generateId(),
        fieldType: f.fieldType,
        label: f.label,
        position: f.position,
        required: f.required,
        signerId: '', // Will be set below
      })),
      reminderCount: 0,
    }))

    // Set signerId for fields
    signers.forEach((signer) => {
      signer.fields.forEach((field) => {
        field.signerId = signer.id
      })
    })

    const request: SignatureRequest = {
      id: this.generateId(),
      organizationId: input.organizationId,
      branchId: input.branchId,
      requestNumber: this.generateRequestNumber(),
      title: input.title,
      message: input.message,
      documentId: input.documentId,
      signers,
      signingOrder: input.signingOrder || 'PARALLEL',
      expirationDate: input.expirationDate,
      reminderSchedule: input.reminderSchedule,
      status: 'DRAFT',
      allowDecline: input.allowDecline ?? true,
      allowComments: input.allowComments ?? true,
      requireAllSigners: input.requireAllSigners ?? true,
      sendCompletionEmail: true,
      authenticationRequired: input.authenticationRequired ?? false,
      auditTrail: [
        {
          id: this.generateId(),
          timestamp: now,
          action: 'CREATED',
          actorId: createdBy,
          actorName: 'System',
          details: {},
        },
      ],
      createdAt: now,
      createdBy,
      updatedAt: now,
      updatedBy: createdBy,
      version: 1,
    }

    this.signatureRequests.set(request.id, request)
    return request
  }

  async findById(id: string): Promise<SignatureRequest | null> {
    return this.signatureRequests.get(id) || null
  }

  async findByRequestNumber(requestNumber: string): Promise<SignatureRequest | null> {
    for (const request of this.signatureRequests.values()) {
      if (request.requestNumber === requestNumber) {
        return request
      }
    }
    return null
  }

  async search(
    filters: SignatureRequestSearchFilters,
  ): Promise<PaginatedResult<SignatureRequest>> {
    let results = Array.from(this.signatureRequests.values())

    // Apply filters
    if (filters.organizationId) {
      results = results.filter((r) => r.organizationId === filters.organizationId)
    }
    if (filters.branchId) {
      results = results.filter((r) => r.branchId === filters.branchId)
    }
    if (filters.status) {
      results = results.filter((r) => r.status === filters.status)
    }
    if (filters.documentId) {
      results = results.filter((r) => r.documentId === filters.documentId)
    }
    if (filters.signerEmail) {
      results = results.filter((r) =>
        r.signers.some((s) => s.email === filters.signerEmail),
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

  async updateStatus(
    id: string,
    status: string,
    updatedBy: string,
    auditEntry: AuditTrailEntry,
  ): Promise<SignatureRequest> {
    const request = await this.findById(id)
    if (!request) {
      throw new Error('Signature request not found')
    }

    request.status = status as SignatureRequest['status']
    request.updatedAt = new Date().toISOString()
    request.updatedBy = updatedBy
    request.version += 1
    request.auditTrail.push(auditEntry)

    this.signatureRequests.set(id, request)
    return request
  }

  async updateSignerStatus(
    requestId: string,
    signerId: string,
    status: string,
  ): Promise<void> {
    const request = await this.findById(requestId)
    if (!request) {
      throw new Error('Signature request not found')
    }

    const signer = request.signers.find((s) => s.id === signerId)
    if (!signer) {
      throw new Error('Signer not found')
    }

    signer.status = status as Signer['status']
    this.signatureRequests.set(requestId, request)
  }

  async addAuditTrail(requestId: string, entry: AuditTrailEntry): Promise<void> {
    const request = await this.findById(requestId)
    if (!request) {
      throw new Error('Signature request not found')
    }

    request.auditTrail.push(entry)
    this.signatureRequests.set(requestId, request)
  }

  async findPendingForSigner(signerEmail: string): Promise<SignatureRequest[]> {
    return Array.from(this.signatureRequests.values()).filter((r) =>
      r.signers.some(
        (s) =>
          s.email === signerEmail &&
          (s.status === 'PENDING' || s.status === 'SENT' || s.status === 'OPENED'),
      ),
    )
  }

  async findExpiringBefore(date: Date): Promise<SignatureRequest[]> {
    return Array.from(this.signatureRequests.values()).filter(
      (r) =>
        r.expirationDate &&
        new Date(r.expirationDate) <= date &&
        r.status !== 'COMPLETED' &&
        r.status !== 'CANCELLED' &&
        r.status !== 'EXPIRED',
    )
  }

  async cancel(id: string, reason: string, cancelledBy: string): Promise<void> {
    const request = await this.findById(id)
    if (!request) {
      throw new Error('Signature request not found')
    }

    const now = new Date().toISOString()
    request.status = 'CANCELLED'
    request.cancelledAt = now
    request.cancelledBy = cancelledBy
    request.cancellationReason = reason
    request.updatedAt = now
    request.updatedBy = cancelledBy
    request.version += 1

    request.auditTrail.push({
      id: this.generateId(),
      timestamp: now,
      action: 'CANCELLED',
      actorId: cancelledBy,
      details: { reason },
    })

    this.signatureRequests.set(id, request)
  }

  // Helper methods
  private generateId(): string {
    return `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateRequestNumber(): string {
    return `SIG-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  }
}
