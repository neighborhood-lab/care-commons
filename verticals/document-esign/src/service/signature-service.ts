/**
 * Signature service - business logic layer
 */

import type {
  SignatureRequest,
  CreateSignatureRequestInput,
  SignDocumentInput,
  DeclineSignatureInput,
  SignatureRequestSearchFilters,
  AuditTrailEntry,
} from '../types/signature.js'
import type { ISignatureRepository } from '../repository/signature-repository.js'
import { SignatureValidator } from '../validation/signature-validator.js'
import type { UserContext } from './document-service.js'

export class SignatureService {
  constructor(
    private repository: ISignatureRepository,
    private validator: SignatureValidator = new SignatureValidator(),
  ) {}

  /**
   * Create a new signature request
   */
  async createSignatureRequest(
    input: CreateSignatureRequestInput,
    context: UserContext,
  ): Promise<SignatureRequest> {
    // Validate input
    const validation = this.validator.validateCreateRequest(input)
    if (!validation.success) {
      throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`)
    }

    // Check organizational access
    if (input.organizationId !== context.organizationId) {
      throw new Error('Access denied: Cannot create signature request for different organization')
    }

    // Validate field positions don't overlap
    for (const signer of input.signers) {
      if (!this.validator.validateFieldPositions(signer.fields)) {
        throw new Error(`Overlapping signature fields detected for signer: ${signer.email}`)
      }
    }

    return this.repository.create(input, context.userId)
  }

  /**
   * Get signature request by ID
   */
  async getSignatureRequestById(id: string, context: UserContext): Promise<SignatureRequest> {
    const request = await this.repository.findById(id)
    if (!request) {
      throw new Error('Signature request not found')
    }

    // Check organizational access
    if (request.organizationId !== context.organizationId) {
      throw new Error('Access denied')
    }

    return request
  }

  /**
   * Get signature request by request number
   */
  async getSignatureRequestByNumber(requestNumber: string): Promise<SignatureRequest | null> {
    return this.repository.findByRequestNumber(requestNumber)
  }

  /**
   * Search signature requests
   */
  async searchSignatureRequests(
    filters: SignatureRequestSearchFilters,
    context: UserContext,
  ) {
    // Enforce organizational filtering
    const enforcedFilters = {
      ...filters,
      organizationId: context.organizationId,
    }

    return this.repository.search(enforcedFilters)
  }

  /**
   * Send signature request to signers
   */
  async sendSignatureRequest(
    requestId: string,
    context: UserContext,
  ): Promise<SignatureRequest> {
    const request = await this.getSignatureRequestById(requestId, context)

    if (request.status !== 'DRAFT') {
      throw new Error('Can only send signature requests in DRAFT status')
    }

    // Update status to SENT
    const auditEntry: AuditTrailEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      action: 'SENT',
      actorId: context.userId,
      actorName: 'User',
      details: {},
    }

    const updated = await this.repository.updateStatus(requestId, 'SENT', context.userId, auditEntry)

    // Update all signers to SENT status
    for (const signer of updated.signers) {
      await this.repository.updateSignerStatus(requestId, signer.id, 'SENT')
    }

    // In production, this would trigger email notifications to signers
    return updated
  }

  /**
   * Sign a document
   */
  async signDocument(
    requestId: string,
    input: SignDocumentInput,
    context: UserContext,
  ): Promise<SignatureRequest> {
    const request = await this.repository.findById(requestId)
    if (!request) {
      throw new Error('Signature request not found')
    }

    // Validate input
    const validation = this.validator.validateSignDocument(input)
    if (!validation.success) {
      throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`)
    }

    // Find signer
    const signer = request.signers.find((s) => s.id === input.signerId)
    if (!signer) {
      throw new Error('Signer not found')
    }

    // Check if signer already signed
    if (signer.status === 'SIGNED') {
      throw new Error('Document already signed by this signer')
    }

    // Verify all required fields are signed
    const requiredFields = signer.fields.filter((f) => f.required)
    const signedFieldIds = input.fields.map((f) => f.fieldId)
    const allRequiredSigned = requiredFields.every((f) => signedFieldIds.includes(f.id))

    if (!allRequiredSigned) {
      throw new Error('Not all required fields are signed')
    }

    // Update field values
    for (const fieldInput of input.fields) {
      const field = signer.fields.find((f) => f.id === fieldInput.fieldId)
      if (field) {
        field.value = fieldInput.value
        field.signedAt = new Date().toISOString()
      }
    }

    // Update signer status
    signer.status = 'SIGNED'
    signer.signedAt = new Date().toISOString()
    signer.signature = input.signature
    signer.ipAddress = input.ipAddress
    signer.userAgent = input.userAgent
    signer.geolocation = input.geolocation

    await this.repository.updateSignerStatus(requestId, input.signerId, 'SIGNED')

    // Add audit trail entry
    const auditEntry: AuditTrailEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      action: 'SIGNED',
      actorEmail: signer.email,
      actorName: signer.name,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      geolocation: input.geolocation,
      details: {
        signerId: input.signerId,
        signatureType: input.signature.signatureType,
      },
    }

    await this.repository.addAuditTrail(requestId, auditEntry)

    // Check if all required signers have signed
    const allSigned = this.checkAllSignersSigned(request)
    if (allSigned) {
      const completionAudit: AuditTrailEntry = {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        action: 'COMPLETED',
        details: {},
      }

      await this.repository.updateStatus(requestId, 'COMPLETED', 'SYSTEM', completionAudit)
    } else {
      // Update to IN_PROGRESS if not all signed yet
      if (request.status === 'SENT') {
        const progressAudit: AuditTrailEntry = {
          id: this.generateId(),
          timestamp: new Date().toISOString(),
          action: 'SIGNED',
          details: { progress: 'in_progress' },
        }
        await this.repository.updateStatus(requestId, 'IN_PROGRESS', 'SYSTEM', progressAudit)
      }
    }

    return this.repository.findById(requestId) as Promise<SignatureRequest>
  }

  /**
   * Decline signature request
   */
  async declineSignature(
    requestId: string,
    input: DeclineSignatureInput,
    context: UserContext,
  ): Promise<SignatureRequest> {
    const request = await this.repository.findById(requestId)
    if (!request) {
      throw new Error('Signature request not found')
    }

    if (!request.allowDecline) {
      throw new Error('This signature request does not allow declining')
    }

    // Validate input
    const validation = this.validator.validateDecline(input)
    if (!validation.success) {
      throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`)
    }

    // Find signer
    const signer = request.signers.find((s) => s.id === input.signerId)
    if (!signer) {
      throw new Error('Signer not found')
    }

    // Update signer status
    signer.status = 'DECLINED'
    signer.declinedAt = new Date().toISOString()
    signer.declineReason = input.reason

    await this.repository.updateSignerStatus(requestId, input.signerId, 'DECLINED')

    // Add audit trail entry
    const auditEntry: AuditTrailEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      action: 'DECLINED',
      actorEmail: signer.email,
      actorName: signer.name,
      details: {
        signerId: input.signerId,
        reason: input.reason,
      },
    }

    await this.repository.addAuditTrail(requestId, auditEntry)

    // Update request status to DECLINED
    const declinedAudit: AuditTrailEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      action: 'DECLINED',
      details: {},
    }

    await this.repository.updateStatus(requestId, 'DECLINED', 'SYSTEM', declinedAudit)

    return this.repository.findById(requestId) as Promise<SignatureRequest>
  }

  /**
   * Cancel signature request
   */
  async cancelSignatureRequest(
    requestId: string,
    reason: string,
    context: UserContext,
  ): Promise<void> {
    const request = await this.getSignatureRequestById(requestId, context)

    if (request.status === 'COMPLETED') {
      throw new Error('Cannot cancel completed signature request')
    }

    await this.repository.cancel(requestId, reason, context.userId)
  }

  /**
   * Get pending signature requests for a signer
   */
  async getPendingForSigner(signerEmail: string): Promise<SignatureRequest[]> {
    return this.repository.findPendingForSigner(signerEmail)
  }

  /**
   * Get expiring signature requests
   */
  async getExpiringRequests(beforeDate: Date, context: UserContext): Promise<SignatureRequest[]> {
    const requests = await this.repository.findExpiringBefore(beforeDate)

    // Filter by organization
    return requests.filter((req) => req.organizationId === context.organizationId)
  }

  /**
   * Check if all required signers have signed
   */
  private checkAllSignersSigned(request: SignatureRequest): boolean {
    if (request.requireAllSigners) {
      return request.signers.every((s) => s.status === 'SIGNED')
    }

    // If not all signers required, check if at least one signed
    return request.signers.some((s) => s.status === 'SIGNED')
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
