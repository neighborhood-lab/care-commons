/**
 * Base entity with audit fields
 */
export interface BaseEntity {
  created_at: Date;
  updated_at: Date;
}

/**
 * Medication administration routes
 */
export type MedicationRoute =
  | 'oral'
  | 'sublingual'
  | 'topical'
  | 'transdermal'
  | 'intravenous'
  | 'intramuscular'
  | 'subcutaneous'
  | 'inhalation'
  | 'nasal'
  | 'ophthalmic'
  | 'otic'
  | 'rectal'
  | 'other';

/**
 * Medication forms
 */
export type MedicationForm =
  | 'tablet'
  | 'capsule'
  | 'liquid'
  | 'suspension'
  | 'injection'
  | 'cream'
  | 'ointment'
  | 'patch'
  | 'inhaler'
  | 'drops'
  | 'spray'
  | 'suppository'
  | 'powder'
  | 'other';

/**
 * Medication status in the system
 */
export type MedicationStatus = 'active' | 'inactive' | 'discontinued' | 'on_hold';

/**
 * Frequency of medication administration
 */
export type MedicationFrequency =
  | 'once_daily'
  | 'twice_daily'
  | 'three_times_daily'
  | 'four_times_daily'
  | 'every_hour'
  | 'every_2_hours'
  | 'every_4_hours'
  | 'every_6_hours'
  | 'every_8_hours'
  | 'every_12_hours'
  | 'weekly'
  | 'monthly'
  | 'as_needed'
  | 'custom';

/**
 * Administration log status
 */
export type AdministrationStatus = 'administered' | 'skipped' | 'refused' | 'missed' | 'pending';

/**
 * Core medication record
 */
export interface Medication extends BaseEntity {
  id: string;
  client_id: string;
  name: string;
  generic_name?: string;
  strength?: string;
  form: MedicationForm;
  route: MedicationRoute;
  frequency: MedicationFrequency;
  frequency_details?: string; // Custom frequency description
  dosage: string;
  prescriber_name?: string;
  prescriber_npi?: string;
  prescription_number?: string;
  indication?: string; // Reason for medication
  instructions?: string; // Special instructions
  start_date: Date;
  end_date?: Date;
  status: MedicationStatus;
  is_prn: boolean; // PRN (as needed) medication
  prn_reason?: string;
  pharmacy_name?: string;
  pharmacy_phone?: string;
  refills_remaining?: number;
  last_refill_date?: Date;
  notes?: string;
  created_by: string;
  updated_by?: string;
}

/**
 * Medication administration log entry
 */
export interface MedicationAdministration extends BaseEntity {
  id: string;
  medication_id: string;
  client_id: string;
  scheduled_time: Date;
  administered_time?: Date;
  administered_by?: string; // Caregiver ID
  status: AdministrationStatus;
  dosage_given?: string;
  skip_reason?: string;
  refuse_reason?: string;
  notes?: string;
  witnessed_by?: string; // For controlled substances
  created_by: string;
  updated_by?: string;
}

/**
 * Medication allergy record
 */
export interface MedicationAllergy extends BaseEntity {
  id: string;
  client_id: string;
  allergen: string;
  reaction?: string;
  severity?: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  notes?: string;
  verified_date?: Date;
  verified_by?: string;
  is_active: boolean;
  created_by: string;
  updated_by?: string;
}

/**
 * Medication interaction warning
 */
export interface MedicationInteraction {
  medication_id_1: string;
  medication_id_2: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  description: string;
  recommendation?: string;
}

/**
 * Filters for searching medications
 */
export interface MedicationSearchFilters {
  client_id?: string;
  status?: MedicationStatus;
  is_prn?: boolean;
  form?: MedicationForm;
  route?: MedicationRoute;
  search?: string; // Search by name or generic name
  start_date_from?: Date;
  start_date_to?: Date;
  prescriber_name?: string;
}

/**
 * Filters for searching medication administration logs
 */
export interface AdministrationSearchFilters {
  client_id?: string;
  medication_id?: string;
  status?: AdministrationStatus;
  scheduled_time_from?: Date;
  scheduled_time_to?: Date;
  administered_by?: string;
}

/**
 * Filters for searching medication allergies
 */
export interface AllergySearchFilters {
  client_id?: string;
  is_active?: boolean;
  severity?: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  allergen?: string;
}

/**
 * Medication with related data
 */
export interface MedicationWithDetails extends Medication {
  client_name?: string;
  upcoming_administrations?: MedicationAdministration[];
  recent_administrations?: MedicationAdministration[];
}

/**
 * Input data for creating a medication
 */
export interface CreateMedicationInput {
  client_id: string;
  name: string;
  generic_name?: string;
  strength?: string;
  form: MedicationForm;
  route: MedicationRoute;
  frequency: MedicationFrequency;
  frequency_details?: string;
  dosage: string;
  prescriber_name?: string;
  prescriber_npi?: string;
  prescription_number?: string;
  indication?: string;
  instructions?: string;
  start_date: Date;
  end_date?: Date;
  is_prn?: boolean;
  prn_reason?: string;
  pharmacy_name?: string;
  pharmacy_phone?: string;
  refills_remaining?: number;
  notes?: string;
}

/**
 * Input data for updating a medication
 */
export interface UpdateMedicationInput extends Partial<CreateMedicationInput> {
  status?: MedicationStatus;
}

/**
 * Input data for recording medication administration
 */
export interface RecordAdministrationInput {
  medication_id: string;
  scheduled_time: Date;
  administered_time?: Date;
  status: AdministrationStatus;
  dosage_given?: string;
  skip_reason?: string;
  refuse_reason?: string;
  notes?: string;
  witnessed_by?: string;
}

/**
 * Input data for creating a medication allergy
 */
export interface CreateAllergyInput {
  client_id: string;
  allergen: string;
  reaction?: string;
  severity?: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  notes?: string;
  verified_date?: Date;
  verified_by?: string;
}

/**
 * Input data for updating a medication allergy
 */
export interface UpdateAllergyInput extends Partial<CreateAllergyInput> {
  is_active?: boolean;
}

/**
 * Medication administration report
 */
export interface AdministrationReport {
  period_start: Date;
  period_end: Date;
  total_scheduled: number;
  total_administered: number;
  total_skipped: number;
  total_refused: number;
  total_missed: number;
  adherence_rate: number; // Percentage
  by_medication: Array<{
    medication_id: string;
    medication_name: string;
    scheduled: number;
    administered: number;
    adherence_rate: number;
  }>;
}
