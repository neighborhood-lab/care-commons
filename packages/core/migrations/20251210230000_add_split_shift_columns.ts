/**
 * Add split shift columns to visits table
 *
 * Enables tracking of split shifts where caregivers work
 * multiple segments within the same day.
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('visits', (table) => {
    // Group ID to link parts of the same split shift
    table.uuid('split_shift_group_id').nullable();

    // Part number within the split shift (1, 2, or 3)
    table.integer('split_shift_part').nullable();

    // Index for querying split shifts
    table.index(['split_shift_group_id']);
    table.index(['assigned_caregiver_id', 'scheduled_date', 'split_shift_group_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('visits', (table) => {
    table.dropIndex(['assigned_caregiver_id', 'scheduled_date', 'split_shift_group_id']);
    table.dropIndex(['split_shift_group_id']);
    table.dropColumn('split_shift_part');
    table.dropColumn('split_shift_group_id');
  });
}
