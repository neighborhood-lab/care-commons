import type { Entity, UUID, Timestamp } from '@care-commons/core'

/**
 * Electronic Signature Types
 * Supports comprehensive eSignature workflows with audit trails
 */

export type SignatureRequestStatus =
  | 'DRAFT'
  | 'SENT'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'DECLINED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'VOIDED'

export type SignatureType =
  | 'ELECTRONIC' // Simple electronic signature
  | 'DIGITAL' // Certificate-based digital signature
  | 'BIOMETRIC' // Biometric signature (touchscreen, etc.)
  | 'CLICK_TO_SIGN' // Click-to-accept signature
  | 'TYPED' // Typed name signature

export type SignerRole =
  | 'SIGNER'
  | 'APPROVER'
  | 'WITNESS'
  | 'REVIEWER'
  | 'CARBON_COPY' // CC recipient (view only)
  | 'FORM_FILLER'

export type SignerStatus =
  | 'PENDING'
  | 'SENT'
  | 'OPENED'
  | 'SIGNED'
  | 'DECLINED'
  | 'EXPIRED'

export type AuthenticationMethod =
  | 'EMAIL'
  | 'SMS'
  | 'ACCESS_CODE'
  | 'PHONE_CALL'
  | 'ID_VERIFICATION'
  | 'TWO_FACTOR'

export interface SignaturePosition {
  pageNumber: number
  x: number // X coordinate (percentage or pixels)
  y: number // Y coordinate (percentage or pixels)
  width: number
  height: number
}

export interface SignatureField {
  id: UUID
  fieldType: 'SIGNATURE' | 'INITIALS' | 'DATE' | 'TEXT' | 'CHECKBOX' | 'DROPDOWN'
  label?: string
  position: SignaturePosition
  required: boolean
  signerId: UUID
  value?: string
  signedAt?: Timestamp
}

export interface Signer {
  id: UUID
  name: string
  email: string
  phone?: string
  role: SignerRole
  signingOrder?: number // For sequential signing
  status: SignerStatus

  // Authentication
  authenticationMethod?: AuthenticationMethod
  accessCode?: string

  // Fields to sign
  fields: SignatureField[]

  // Actions
  sentAt?: Timestamp
  openedAt?: Timestamp
  signedAt?: Timestamp
  declinedAt?: Timestamp
  declineReason?: string

  // Signature data
  signature?: SignatureData
  ipAddress?: string
  userAgent?: string
  geolocation?: Geolocation

  // Reminders
  lastReminderSentAt?: Timestamp
  reminderCount: number
}

export interface SignatureData {
  signatureType: SignatureType
  signatureImage?: string // Base64 encoded image
  signatureText?: string // For typed signatures
  biometricData?: BiometricData
  certificateInfo?: CertificateInfo
  timestamp: Timestamp
}

export interface BiometricData {
  pressurePoints?: number[]
  strokeSpeed?: number[]
  accelerometerData?: number[][]
  deviceInfo?: string
}

export interface CertificateInfo {
  certificateId: string
  issuer: string
  subject: string
  validFrom: Date
  validTo: Date
  serialNumber: string
  thumbprint: string
}

export interface Geolocation {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp: Timestamp
}

export interface SignatureRequest extends Entity {
  organizationId: UUID
  branchId?: UUID

  // Request identification
  requestNumber: string
  title: string
  message?: string

  // Document to sign
  documentId: UUID
  documentVersion?: number

  // Signers
  signers: Signer[]
  currentSignerIndex?: number // For sequential signing

  // Workflow settings
  signingOrder: 'PARALLEL' | 'SEQUENTIAL'
  expirationDate?: Date
  reminderSchedule?: ReminderSchedule

  // Status
  status: SignatureRequestStatus
  completedAt?: Timestamp
  cancelledAt?: Timestamp
  cancelledBy?: UUID
  cancellationReason?: string

  // Settings
  allowDecline: boolean
  allowComments: boolean
  requireAllSigners: boolean
  sendCompletionEmail: boolean
  authenticationRequired: boolean

  // Signed document
  signedDocumentId?: UUID
  certificateOfCompletionId?: UUID

  // Audit trail
  auditTrail: AuditTrailEntry[]
}

export interface ReminderSchedule {
  enabled: boolean
  firstReminderAfterDays: number
  subsequentReminderIntervalDays: number
  maxReminders: number
}

export interface AuditTrailEntry {
  id: UUID
  timestamp: Timestamp
  action:
    | 'CREATED'
    | 'SENT'
    | 'OPENED'
    | 'SIGNED'
    | 'DECLINED'
    | 'CANCELLED'
    | 'VOIDED'
    | 'REMINDED'
    | 'COMPLETED'
    | 'EXPIRED'
  actorId?: UUID
  actorName?: string
  actorEmail?: string
  ipAddress?: string
  userAgent?: string
  geolocation?: Geolocation
  details?: Record<string, unknown>
}

export interface SignatureWorkflow extends Entity {
  organizationId: UUID
  name: string
  description?: string
  documentTemplateId?: UUID
  signerRoles: SignerRoleDefinition[]
  defaultSettings: SignatureWorkflowSettings
  isActive: boolean
}

export interface SignerRoleDefinition {
  role: SignerRole
  order: number
  required: boolean
  authenticationMethod?: AuthenticationMethod
}

export interface SignatureWorkflowSettings {
  signingOrder: 'PARALLEL' | 'SEQUENTIAL'
  expirationDays?: number
  reminderSchedule?: ReminderSchedule
  allowDecline: boolean
  authenticationRequired: boolean
}

export interface CertificateOfCompletion extends Entity {
  signatureRequestId: UUID
  documentId: UUID
  organizationId: UUID
  completedAt: Timestamp
  signers: CompletedSignerInfo[]
  documentHash: string
  certificateFile: string // Base64 encoded PDF
}

export interface CompletedSignerInfo {
  name: string
  email: string
  role: SignerRole
  signedAt: Timestamp
  ipAddress?: string
  signatureType: SignatureType
}

// Input types for creating/updating signature requests
export interface CreateSignatureRequestInput {
  organizationId: UUID
  branchId?: UUID
  title: string
  message?: string
  documentId: UUID
  signers: CreateSignerInput[]
  signingOrder?: 'PARALLEL' | 'SEQUENTIAL'
  expirationDate?: Date
  reminderSchedule?: ReminderSchedule
  allowDecline?: boolean
  allowComments?: boolean
  requireAllSigners?: boolean
  authenticationRequired?: boolean
}

export interface CreateSignerInput {
  name: string
  email: string
  phone?: string
  role: SignerRole
  signingOrder?: number
  authenticationMethod?: AuthenticationMethod
  accessCode?: string
  fields: CreateSignatureFieldInput[]
}

export interface CreateSignatureFieldInput {
  fieldType: 'SIGNATURE' | 'INITIALS' | 'DATE' | 'TEXT' | 'CHECKBOX' | 'DROPDOWN'
  label?: string
  position: SignaturePosition
  required: boolean
}

export interface SignDocumentInput {
  signerId: UUID
  fields: SignFieldInput[]
  signature: SignatureData
  ipAddress: string
  userAgent: string
  geolocation?: Geolocation
  comments?: string
}

export interface SignFieldInput {
  fieldId: UUID
  value: string
}

export interface DeclineSignatureInput {
  signerId: UUID
  reason: string
}

export interface SignatureRequestSearchFilters {
  organizationId?: UUID
  branchId?: UUID
  status?: SignatureRequestStatus
  documentId?: UUID
  signerEmail?: string
  createdAfter?: Date
  createdBefore?: Date
  expiringBefore?: Date
}
