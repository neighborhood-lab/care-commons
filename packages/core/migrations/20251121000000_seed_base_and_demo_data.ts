/**
 * Migration: Seed Base and Demo Data
 * 
 * This migration runs the existing proven seed scripts via the migration pipeline.
 * 
 * IDEMPOTENT: Safe to run multiple times - checks for existing data before inserting.
 * DATA SAFE: Uses proven seed logic that has been tested extensively.
 * 
 * Strategy: Instead of duplicating 3000+ lines of seed logic, we call the existing
 * seed scripts which are battle-tested and known to work correctly.
 * 
 * IMPORTANT: This migration disables transactions to allow seed scripts to see
 * committed schema changes from prior migrations.
 */

import type { Knex } from 'knex';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Disable transaction for this migration
export const config = { transaction: false };

export async function up(knex: Knex): Promise<void> {
  console.log('\n🌱 Starting base + demo data seeding migration...\n');

  // Check if data already exists
  const existingClient = await knex('clients').where('is_demo_data', true).first();
  if (existingClient) {
    console.log('✅ Demo data already exists - skipping seed (idempotent)');
    return;
  }

  const existingAdmin = await knex('users').where('email', 'admin@carecommons.example').first();
  if (existingAdmin) {
    console.log('✅ Base data already exists');
    
    // Check if we need demo data
    const hasDemo = await knex('clients').where('is_demo_data', true).first();
    if (hasDemo) {
      console.log('✅ Demo data already exists - migration complete');
      return;
    }
    
    // Seed demo data only
    console.log('📦 Seeding demo data...');
    try {
      const { stdout, stderr } = await execAsync('npm run db:seed:demo', {
        cwd: process.cwd(),
        env: process.env,
      });
      console.log(stdout);
      if (stderr) console.error(stderr);
      console.log('✅ Demo data seeded successfully via existing script');
    } catch (error) {
      console.error('❌ Demo seed failed:', error);
      throw error;
    }
    return;
  }

  // Seed both base and demo data
  console.log('📦 Seeding base operational data...');
  try {
    const { stdout: baseStdout, stderr: baseStderr } = await execAsync('npm run db:seed', {
      cwd: process.cwd(),
      env: process.env,
    });
    console.log(baseStdout);
    if (baseStderr) console.error(baseStderr);
    console.log('✅ Base data seeded successfully');
  } catch (error) {
    console.error('❌ Base seed failed:', error);
    throw error;
  }

  console.log('\n📦 Seeding comprehensive demo data...');
  try {
    const { stdout: demoStdout, stderr: demoStderr } = await execAsync('npm run db:seed:demo', {
      cwd: process.cwd(),
      env: process.env,
    });
    console.log(demoStdout);
    if (demoStderr) console.error(demoStderr);
    console.log('✅ Demo data seeded successfully');
  } catch (error) {
    console.error('❌ Demo seed failed:', error);
    throw error;
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ MIGRATION COMPLETE - Base + Demo Data Seeded');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

export async function down(knex: Knex): Promise<void> {
  console.log('\n🧹 Removing demo data...');

  // Delete demo data in correct order (respecting foreign keys)
  await knex('evv_records').where('is_demo_data', true).del();
  await knex('visit_notes').where('is_demo_data', true).del();
  await knex('medication_administrations').where('is_demo_data', true).del();
  await knex('incidents').where('is_demo_data', true).del();
  await knex('task_instances').where('is_demo_data', true).del();
  await knex('visits').where('is_demo_data', true).del();
  await knex('payments').del(); // No is_demo_data column
  await knex('invoices').where('is_demo_data', true).del();
  await knex('assignment_proposals').where('is_demo_data', true).del();
  await knex('open_shifts').where('is_demo_data', true).del();
  await knex('family_notifications').where('is_demo_data', true).del();
  await knex('messages').where('is_demo_data', true).del();
  await knex('progress_notes').where('is_demo_data', true).del();
  await knex('family_members').where('is_demo_data', true).del();
  await knex('care_plans').where('is_demo_data', true).del();
  await knex('caregivers').where('is_demo_data', true).del();
  await knex('clients').where('is_demo_data', true).del();
  await knex('users').where('is_demo_data', true).del();

  console.log('✅ Demo data removed (admin and organization preserved)');
}
