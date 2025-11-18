import { type Knex } from 'knex';

/**
 * Migration: Add email verification fields to users table
 * 
 * Adds fields for email verification workflow:
 * - email_verified: boolean flag
 * - email_verification_token: secure token for verification
 * - email_verification_expires: token expiration timestamp
 */

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.boolean('email_verified').notNullable().defaultTo(false);
    table.string('email_verification_token', 255);
    table.timestamp('email_verification_expires');
  });

  // Create index for fast token lookups
  await knex.raw('CREATE INDEX idx_users_verification_token ON users(email_verification_token) WHERE email_verification_token IS NOT NULL');
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP INDEX IF EXISTS idx_users_verification_token');
  
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('email_verified');
    table.dropColumn('email_verification_token');
    table.dropColumn('email_verification_expires');
  });
}
