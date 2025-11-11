/**
 * Medication Validation - Zod schemas for runtime validation
 *
 * Validates:
 * - Medication creation and updates
 * - Administration recording
 * - Business rules (dates, dosages, etc.)
 */

import { z } from 'zod';

/**
 * Medication route enum schema
 */
export const medicationRouteSchema = z.enum([
  'ORAL',
  'TOPICAL',
  'INJECTION',
  'INHALATION',
  'OTHER',
]);

/**
 * Medication status enum schema
 */
export const medicationStatusSchema = z.enum(['ACTIVE', 'DISCONTINUED', 'ON_HOLD']);

/**
 * Administration status enum schema
 */
export const administrationStatusSchema = z.enum(['GIVEN', 'REFUSED', 'HELD', 'MISSED']);

/**
 * Create Medication Input Schema
 */
export const createMedicationSchema = z.object({
  clientId: z.string().uuid(),
  medicationName: z.string().min(1).max(200),
  genericName: z.string().min(1).max(200).optional(),
  dosage: z.string().min(1).max(100),
  route: medicationRouteSchema,
  frequency: z.string().min(1).max(100),
  instructions: z.string().max(1000).optional(),
  prescribedBy: z.string().min(1).max(200),
  prescribedDate: z.string().datetime(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  status: medicationStatusSchema.optional(),
  refillsRemaining: z.number().int().min(0).max(99).optional(),
  sideEffects: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
});

/**
 * Update Medication Input Schema
 */
export const updateMedicationSchema = z.object({
  medicationName: z.string().min(1).max(200).optional(),
  genericName: z.string().min(1).max(200).optional(),
  dosage: z.string().min(1).max(100).optional(),
  route: medicationRouteSchema.optional(),
  frequency: z.string().min(1).max(100).optional(),
  instructions: z.string().max(1000).optional(),
  prescribedBy: z.string().min(1).max(200).optional(),
  prescribedDate: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: medicationStatusSchema.optional(),
  refillsRemaining: z.number().int().min(0).max(99).optional(),
  sideEffects: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
});

/**
 * Record Administration Input Schema
 */
export const recordAdministrationSchema = z
  .object({
    medicationId: z.string().uuid(),
    clientId: z.string().uuid(),
    administeredAt: z.string().datetime().optional(),
    scheduledFor: z.string().datetime().optional(),
    dosageGiven: z.string().min(1).max(100),
    route: medicationRouteSchema,
    status: administrationStatusSchema,
    notes: z.string().max(1000).optional(),
    refusalReason: z.string().max(500).optional(),
    holdReason: z.string().max(500).optional(),
    witnessedBy: z.string().uuid().optional(),
  })
  .refine(
    (data) => {
      // If status is REFUSED, refusalReason must be provided
      if (data.status === 'REFUSED') {
        return !!data.refusalReason;
      }
      return true;
    },
    {
      message: 'Refusal reason is required when status is REFUSED',
      path: ['refusalReason'],
    }
  )
  .refine(
    (data) => {
      // If status is HELD, holdReason must be provided
      if (data.status === 'HELD') {
        return !!data.holdReason;
      }
      return true;
    },
    {
      message: 'Hold reason is required when status is HELD',
      path: ['holdReason'],
    }
  )
  .refine(
    (data) => {
      // Validate administeredAt is not in the future
      if (data.administeredAt) {
        return new Date(data.administeredAt) <= new Date();
      }
      return true;
    },
    {
      message: 'Administration time cannot be in the future',
      path: ['administeredAt'],
    }
  );

/**
 * Export type inferences
 */
export type CreateMedicationInput = z.infer<typeof createMedicationSchema>;
export type UpdateMedicationInput = z.infer<typeof updateMedicationSchema>;
export type RecordAdministrationInput = z.infer<typeof recordAdministrationSchema>;
