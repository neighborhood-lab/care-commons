import { z } from 'zod';

/**
 * Zod schemas for medication validation
 */

export const medicationRouteSchema = z.enum([
  'oral',
  'sublingual',
  'topical',
  'transdermal',
  'intravenous',
  'intramuscular',
  'subcutaneous',
  'inhalation',
  'nasal',
  'ophthalmic',
  'otic',
  'rectal',
  'other',
]);

export const medicationFormSchema = z.enum([
  'tablet',
  'capsule',
  'liquid',
  'suspension',
  'injection',
  'cream',
  'ointment',
  'patch',
  'inhaler',
  'drops',
  'spray',
  'suppository',
  'powder',
  'other',
]);

export const medicationStatusSchema = z.enum(['active', 'inactive', 'discontinued', 'on_hold']);

export const medicationFrequencySchema = z.enum([
  'once_daily',
  'twice_daily',
  'three_times_daily',
  'four_times_daily',
  'every_hour',
  'every_2_hours',
  'every_4_hours',
  'every_6_hours',
  'every_8_hours',
  'every_12_hours',
  'weekly',
  'monthly',
  'as_needed',
  'custom',
]);

export const administrationStatusSchema = z.enum([
  'administered',
  'skipped',
  'refused',
  'missed',
  'pending',
]);

export const allergySeveritySchema = z.enum(['mild', 'moderate', 'severe', 'life_threatening']);

/**
 * Schema for creating a medication
 */
export const createMedicationSchema = z
  .object({
    client_id: z.string().uuid('Invalid client ID'),
    name: z.string().min(1, 'Medication name is required').max(255),
    generic_name: z.string().max(255).optional(),
    strength: z.string().max(100).optional(),
    form: medicationFormSchema,
    route: medicationRouteSchema,
    frequency: medicationFrequencySchema,
    frequency_details: z.string().max(500).optional(),
    dosage: z.string().min(1, 'Dosage is required').max(255),
    prescriber_name: z.string().max(255).optional(),
    prescriber_npi: z.string().max(50).optional(),
    prescription_number: z.string().max(100).optional(),
    indication: z.string().max(500).optional(),
    instructions: z.string().max(1000).optional(),
    start_date: z.coerce.date(),
    end_date: z.coerce.date().optional(),
    is_prn: z.boolean().default(false),
    prn_reason: z.string().max(500).optional(),
    pharmacy_name: z.string().max(255).optional(),
    pharmacy_phone: z.string().max(50).optional(),
    refills_remaining: z.number().int().min(0).optional(),
    notes: z.string().max(2000).optional(),
  })
  .refine(
    (data) => {
      // If PRN, must have a reason
      if (data.is_prn && !data.prn_reason) {
        return false;
      }
      return true;
    },
    {
      message: 'PRN reason is required for as-needed medications',
      path: ['prn_reason'],
    }
  )
  .refine(
    (data) => {
      // End date must be after start date
      if (data.end_date && data.end_date < data.start_date) {
        return false;
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['end_date'],
    }
  )
  .refine(
    (data) => {
      // Custom frequency requires details
      if (data.frequency === 'custom' && !data.frequency_details) {
        return false;
      }
      return true;
    },
    {
      message: 'Frequency details are required for custom frequency',
      path: ['frequency_details'],
    }
  );

/**
 * Schema for updating a medication
 */
export const updateMedicationSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    generic_name: z.string().max(255).optional(),
    strength: z.string().max(100).optional(),
    form: medicationFormSchema.optional(),
    route: medicationRouteSchema.optional(),
    frequency: medicationFrequencySchema.optional(),
    frequency_details: z.string().max(500).optional(),
    dosage: z.string().min(1).max(255).optional(),
    prescriber_name: z.string().max(255).optional(),
    prescriber_npi: z.string().max(50).optional(),
    prescription_number: z.string().max(100).optional(),
    indication: z.string().max(500).optional(),
    instructions: z.string().max(1000).optional(),
    start_date: z.coerce.date().optional(),
    end_date: z.coerce.date().optional(),
    status: medicationStatusSchema.optional(),
    is_prn: z.boolean().optional(),
    prn_reason: z.string().max(500).optional(),
    pharmacy_name: z.string().max(255).optional(),
    pharmacy_phone: z.string().max(50).optional(),
    refills_remaining: z.number().int().min(0).optional(),
    notes: z.string().max(2000).optional(),
  })
  .refine(
    (data) => {
      // If updating to PRN, must have a reason
      if (data.is_prn === true && !data.prn_reason) {
        return false;
      }
      return true;
    },
    {
      message: 'PRN reason is required for as-needed medications',
      path: ['prn_reason'],
    }
  );

/**
 * Schema for recording medication administration
 */
export const recordAdministrationSchema = z
  .object({
    medication_id: z.string().uuid('Invalid medication ID'),
    scheduled_time: z.coerce.date(),
    administered_time: z.coerce.date().optional(),
    status: administrationStatusSchema,
    dosage_given: z.string().max(255).optional(),
    skip_reason: z.string().max(500).optional(),
    refuse_reason: z.string().max(500).optional(),
    notes: z.string().max(2000).optional(),
    witnessed_by: z.string().uuid().optional(),
  })
  .refine(
    (data) => {
      // If skipped, must have skip reason
      if (data.status === 'skipped' && !data.skip_reason) {
        return false;
      }
      return true;
    },
    {
      message: 'Skip reason is required when medication is skipped',
      path: ['skip_reason'],
    }
  )
  .refine(
    (data) => {
      // If refused, must have refuse reason
      if (data.status === 'refused' && !data.refuse_reason) {
        return false;
      }
      return true;
    },
    {
      message: 'Refuse reason is required when medication is refused',
      path: ['refuse_reason'],
    }
  );

/**
 * Schema for creating a medication allergy
 */
export const createAllergySchema = z.object({
  client_id: z.string().uuid('Invalid client ID'),
  allergen: z.string().min(1, 'Allergen is required').max(255),
  reaction: z.string().max(500).optional(),
  severity: allergySeveritySchema.optional(),
  notes: z.string().max(2000).optional(),
  verified_date: z.coerce.date().optional(),
  verified_by: z.string().uuid().optional(),
});

/**
 * Schema for updating a medication allergy
 */
export const updateAllergySchema = z.object({
  allergen: z.string().min(1).max(255).optional(),
  reaction: z.string().max(500).optional(),
  severity: allergySeveritySchema.optional(),
  notes: z.string().max(2000).optional(),
  verified_date: z.coerce.date().optional(),
  verified_by: z.string().uuid().optional(),
  is_active: z.boolean().optional(),
});

/**
 * Schema for search filters
 */
export const medicationSearchFiltersSchema = z.object({
  client_id: z.string().uuid().optional(),
  status: medicationStatusSchema.optional(),
  is_prn: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  form: medicationFormSchema.optional(),
  route: medicationRouteSchema.optional(),
  search: z.string().optional(),
  start_date_from: z.coerce.date().optional(),
  start_date_to: z.coerce.date().optional(),
  prescriber_name: z.string().optional(),
});

export const administrationSearchFiltersSchema = z.object({
  client_id: z.string().uuid().optional(),
  medication_id: z.string().uuid().optional(),
  status: administrationStatusSchema.optional(),
  scheduled_time_from: z.coerce.date().optional(),
  scheduled_time_to: z.coerce.date().optional(),
  administered_by: z.string().uuid().optional(),
});

export const allergySearchFiltersSchema = z.object({
  client_id: z.string().uuid().optional(),
  is_active: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  severity: allergySeveritySchema.optional(),
  allergen: z.string().optional(),
});

/**
 * Schema for pagination
 */
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100)),
});

/**
 * Schema for administration report parameters
 */
export const administrationReportSchema = z.object({
  client_id: z.string().uuid('Invalid client ID'),
  period_start: z.coerce.date(),
  period_end: z.coerce.date(),
});

/**
 * Type exports for the schemas
 * Note: These types are also available from ./types/medication.ts
 */
