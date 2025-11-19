/**
 * Migration: Fix EVV Compliance Flags Default
 *
 * Changes the default value of compliance_flags column in evv_records table
 * from '["COMPLIANT"]' to '[]' (empty array).
 *
 * Rationale:
 * - An empty array [] means the visit is compliant (no flags raised)
 * - Any flags in the array indicate non-compliance issues
 * - The previous default of ["COMPLIANT"] was incorrect and caused
 *   analytics to show 0% compliance when it should show ~70%
 *
 * This also updates all existing records that have ["COMPLIANT"] to []
 * to fix historical data.
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Change the default value for new records
  await knex.raw(`
    ALTER TABLE evv_records
    ALTER COLUMN compliance_flags SET DEFAULT '[]'::jsonb
  `);

  // Update existing records that have ["COMPLIANT"] to []
  await knex.raw(`
    UPDATE evv_records
    SET compliance_flags = '[]'::jsonb
    WHERE compliance_flags = '["COMPLIANT"]'::jsonb
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Restore the original (incorrect) default
  await knex.raw(`
    ALTER TABLE evv_records
    ALTER COLUMN compliance_flags SET DEFAULT '["COMPLIANT"]'::jsonb
  `);

  // Restore the original (incorrect) values
  await knex.raw(`
    UPDATE evv_records
    SET compliance_flags = '["COMPLIANT"]'::jsonb
    WHERE compliance_flags = '[]'::jsonb
  `);
}
