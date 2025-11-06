/**
 * eSignature validation logic
 */

import { z } from 'zod'
import type {
  CreateSignatureRequestInput,
  SignDocumentInput,
  DeclineSignatureInput,
} from '../types/signature.js'

const signaturePositionSchema = z.object({
  pageNumber: z.number().int().positive('Page number must be positive'),
  x: z.number().min(0, 'X coordinate must be non-negative'),
  y: z.number().min(0, 'Y coordinate must be non-negative'),
  width: z.number().positive('Width must be positive'),
  height: z.number().positive('Height must be positive'),
})

const signatureFieldSchema = z.object({
  fieldType: z.enum(['SIGNATURE', 'INITIALS', 'DATE', 'TEXT', 'CHECKBOX', 'DROPDOWN']),
  label: z.string().optional(),
  position: signaturePositionSchema,
  required: z.boolean(),
})

const signerSchema = z.object({
  name: z.string().min(1, 'Signer name required').max(200),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number').optional(),
  role: z.enum([
    'SIGNER',
    'APPROVER',
    'WITNESS',
    'REVIEWER',
    'CARBON_COPY',
    'FORM_FILLER',
  ]),
  signingOrder: z.number().int().positive().optional(),
  authenticationMethod: z
    .enum(['EMAIL', 'SMS', 'ACCESS_CODE', 'PHONE_CALL', 'ID_VERIFICATION', 'TWO_FACTOR'])
    .optional(),
  accessCode: z.string().min(4).max(20).optional(),
  fields: z.array(signatureFieldSchema).min(1, 'At least one field required'),
})

const reminderScheduleSchema = z.object({
  enabled: z.boolean(),
  firstReminderAfterDays: z.number().int().positive(),
  subsequentReminderIntervalDays: z.number().int().positive(),
  maxReminders: z.number().int().positive().max(10),
})

const createSignatureRequestSchema = z.object({
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  title: z.string().min(1, 'Title required').max(255),
  message: z.string().max(1000).optional(),
  documentId: z.string().uuid(),
  signers: z.array(signerSchema).min(1, 'At least one signer required'),
  signingOrder: z.enum(['PARALLEL', 'SEQUENTIAL']).optional(),
  expirationDate: z.date().optional(),
  reminderSchedule: reminderScheduleSchema.optional(),
  allowDecline: z.boolean().optional(),
  allowComments: z.boolean().optional(),
  requireAllSigners: z.boolean().optional(),
  authenticationRequired: z.boolean().optional(),
})

const signatureDataSchema = z.object({
  signatureType: z.enum(['ELECTRONIC', 'DIGITAL', 'BIOMETRIC', 'CLICK_TO_SIGN', 'TYPED']),
  signatureImage: z.string().optional(),
  signatureText: z.string().optional(),
  biometricData: z.record(z.unknown()).optional(),
  certificateInfo: z.record(z.unknown()).optional(),
  timestamp: z.string(), // ISO 8601 timestamp
})

const geolocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive().optional(),
  timestamp: z.string(), // ISO 8601 timestamp
})

const signFieldInputSchema = z.object({
  fieldId: z.string().uuid(),
  value: z.string(),
})

const signDocumentSchema = z.object({
  signerId: z.string().uuid(),
  fields: z.array(signFieldInputSchema).min(1, 'At least one field required'),
  signature: signatureDataSchema,
  ipAddress: z.string().ip(),
  userAgent: z.string().min(1),
  geolocation: geolocationSchema.optional(),
  comments: z.string().max(500).optional(),
})

const declineSignatureSchema = z.object({
  signerId: z.string().uuid(),
  reason: z.string().min(1, 'Decline reason required').max(500),
})

export class SignatureValidator {
  validateCreateRequest(input: CreateSignatureRequestInput): ValidationResult {
    try {
      createSignatureRequestSchema.parse(input)

      // Additional validation: Sequential signing requires signingOrder on all signers
      if (input.signingOrder === 'SEQUENTIAL') {
        const hasAllOrders = input.signers.every((signer) => signer.signingOrder !== undefined)
        if (!hasAllOrders) {
          return {
            success: false,
            errors: [
              {
                path: 'signers',
                message: 'Sequential signing requires signingOrder on all signers',
              },
            ],
          }
        }

        // Check for duplicate signing orders
        const orders = input.signers.map((s) => s.signingOrder)
        const uniqueOrders = new Set(orders)
        if (orders.length !== uniqueOrders.size) {
          return {
            success: false,
            errors: [{ path: 'signers', message: 'Duplicate signing orders found' }],
          }
        }
      }

      // Validate expiration date is in the future
      if (input.expirationDate && input.expirationDate.getTime() <= Date.now()) {
        return {
          success: false,
          errors: [{ path: 'expirationDate', message: 'Expiration date must be in the future' }],
        }
      }

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

  validateSignDocument(input: SignDocumentInput): ValidationResult {
    try {
      signDocumentSchema.parse(input)

      // Validate signature data based on type
      const { signature } = input
      if (signature.signatureType === 'TYPED' && !signature.signatureText) {
        return {
          success: false,
          errors: [{ path: 'signature.signatureText', message: 'Typed signature requires text' }],
        }
      }

      if (
        ['ELECTRONIC', 'BIOMETRIC'].includes(signature.signatureType) &&
        !signature.signatureImage
      ) {
        return {
          success: false,
          errors: [
            {
              path: 'signature.signatureImage',
              message: `${signature.signatureType} signature requires an image`,
            },
          ],
        }
      }

      if (signature.signatureType === 'DIGITAL' && !signature.certificateInfo) {
        return {
          success: false,
          errors: [
            {
              path: 'signature.certificateInfo',
              message: 'Digital signature requires certificate info',
            },
          ],
        }
      }

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

  validateDecline(input: DeclineSignatureInput): ValidationResult {
    try {
      declineSignatureSchema.parse(input)
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
   * Validate email address format
   */
  validateEmail(email: string): boolean {
    // eslint-disable-next-line sonarjs/slow-regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  /**
   * Validate that signature fields don't overlap
   */
  validateFieldPositions(
    fields: Array<{ position: { pageNumber: number; x: number; y: number; width: number; height: number } }>,
  ): boolean {
    for (let i = 0; i < fields.length; i++) {
      for (let j = i + 1; j < fields.length; j++) {
        const field1 = fields[i].position
        const field2 = fields[j].position

        // Only check fields on the same page
        if (field1.pageNumber !== field2.pageNumber) continue

        // Check for overlap
        if (
          field1.x < field2.x + field2.width &&
          field1.x + field1.width > field2.x &&
          field1.y < field2.y + field2.height &&
          field1.y + field1.height > field2.y
        ) {
          return false // Overlap detected
        }
      }
    }
    return true
  }

  /**
   * Validate access code strength
   */
  validateAccessCode(code: string): boolean {
    // At least 4 characters, alphanumeric
    return /^[a-zA-Z0-9]{4,20}$/.test(code)
  }

  /**
   * Validate IP address format
   */
  validateIPAddress(ip: string): boolean {
    // IPv4 or IPv6
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    return ipv4Regex.test(ip) || ipv6Regex.test(ip)
  }
}

interface ValidationResult {
  success: boolean
  errors?: Array<{ path: string; message: string }>
}
