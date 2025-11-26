/**
 * Demo Data Service
 *
 * Provides API for seeding and clearing demo data for new organizations.
 * All demo data is marked with `is_demo_data: true` for safe cleanup.
 */

import { Database } from '../db/connection.js';
import type { UUID } from '../types/base.js';
import { NotFoundError } from '../errors/app-errors.js';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export interface DemoDataStats {
  clients: number;
  caregivers: number;
  visits: number;
  carePlans: number;
  familyMembers: number;
}

export class DemoDataService {
  constructor(private db: Database) {}

  /**
   * Seed demo data for an organization
   * Uses the existing seed-demo.ts script which creates:
   * - 60 clients
   * - 35 caregivers
   * - 600+ visits
   * - 50+ care plans
   * - 40+ family members
   * All marked with is_demo_data: true
   */
  async seedDemoData(organizationId: UUID): Promise<DemoDataStats> {
    // Verify organization exists
    const orgCheck = await this.db.query(
      'SELECT id FROM organizations WHERE id = $1 AND deleted_at IS NULL',
      [organizationId]
    );

    if (orgCheck.rows.length === 0) {
      throw new NotFoundError('Organization not found');
    }

    // Check if demo data already exists
    const existingDemo = await this.db.query(
      'SELECT COUNT(*) as count FROM clients WHERE organization_id = $1 AND is_demo_data = true',
      [organizationId]
    );

    if (parseInt(String(existingDemo.rows[0]?.count ?? '0')) > 0) {
      // Clear existing demo data first
      await this.clearDemoData(organizationId);
    }

    // Run the seeding script
    // Note: The seed-demo.ts script needs to be updated to accept organization_id parameter
    try {
      const { stdout, stderr } = await execAsync(
        `DATABASE_URL="${process.env.DATABASE_URL}" ORG_ID="${organizationId}" npx tsx packages/core/scripts/seed-demo.ts`,
        { cwd: process.cwd() }
      );

      if (stderr !== '') {
        console.error('Seed script stderr:', stderr);
      }

      console.log('Seed script output:', stdout);
    } catch (error) {
      console.error('Failed to run seed script:', error);
      throw new Error('Failed to seed demo data');
    }

    // Get statistics
    return this.getDemoDataStats(organizationId);
  }

  /**
   * Clear all demo data for an organization
   * Only deletes records where is_demo_data = true
   */
  async clearDemoData(organizationId: UUID): Promise<void> {
    // Verify organization exists
    const orgCheck = await this.db.query(
      'SELECT id FROM organizations WHERE id = $1 AND deleted_at IS NULL',
      [organizationId]
    );

    if (orgCheck.rows.length === 0) {
      throw new NotFoundError('Organization not found');
    }

    // Delete in reverse dependency order
    // All with WHERE is_demo_data = true AND organization_id = $1
    const deleteQueries = [
      'DELETE FROM payments WHERE is_demo_data = true AND organization_id = $1',
      'DELETE FROM evv_records WHERE is_demo_data = true AND visit_id IN (SELECT id FROM visits WHERE organization_id = $1 AND is_demo_data = true)',
      'DELETE FROM visits WHERE is_demo_data = true AND organization_id = $1',
      'DELETE FROM task_instances WHERE is_demo_data = true AND care_plan_id IN (SELECT id FROM care_plans WHERE organization_id = $1 AND is_demo_data = true)',
      'DELETE FROM progress_notes WHERE is_demo_data = true AND care_plan_id IN (SELECT id FROM care_plans WHERE organization_id = $1 AND is_demo_data = true)',
      'DELETE FROM care_plans WHERE is_demo_data = true AND organization_id = $1',
      'DELETE FROM family_members WHERE is_demo_data = true AND client_id IN (SELECT id FROM clients WHERE organization_id = $1 AND is_demo_data = true)',
      'DELETE FROM client_documents WHERE is_demo_data = true AND client_id IN (SELECT id FROM clients WHERE organization_id = $1 AND is_demo_data = true)',
      'DELETE FROM clients WHERE is_demo_data = true AND organization_id = $1',
      'DELETE FROM caregiver_credentials WHERE is_demo_data = true AND caregiver_id IN (SELECT id FROM caregivers WHERE organization_id = $1 AND is_demo_data = true)',
      'DELETE FROM caregivers WHERE is_demo_data = true AND organization_id = $1',
    ];

    for (const query of deleteQueries) {
      try {
        await this.db.query(query, [organizationId]);
      } catch (error) {
        console.error(`Failed to execute query: ${query}`, error);
        // Continue with other deletes even if one fails
      }
    }

    console.log(`Cleared demo data for organization ${organizationId}`);
  }

  /**
   * Get statistics about demo data for an organization
   */
  async getDemoDataStats(organizationId: UUID): Promise<DemoDataStats> {
    const clientsResult = await this.db.query(
      'SELECT COUNT(*) as count FROM clients WHERE organization_id = $1 AND is_demo_data = true',
      [organizationId]
    );

    const caregiversResult = await this.db.query(
      'SELECT COUNT(*) as count FROM caregivers WHERE organization_id = $1 AND is_demo_data = true',
      [organizationId]
    );

    const visitsResult = await this.db.query(
      'SELECT COUNT(*) as count FROM visits WHERE organization_id = $1 AND is_demo_data = true',
      [organizationId]
    );

    const carePlansResult = await this.db.query(
      'SELECT COUNT(*) as count FROM care_plans WHERE organization_id = $1 AND is_demo_data = true',
      [organizationId]
    );

    const familyResult = await this.db.query(
      'SELECT COUNT(*) as count FROM family_members WHERE is_demo_data = true AND client_id IN (SELECT id FROM clients WHERE organization_id = $1 AND is_demo_data = true)',
      [organizationId]
    );

    return {
      clients: parseInt(String(clientsResult.rows[0]?.count ?? '0')),
      caregivers: parseInt(String(caregiversResult.rows[0]?.count ?? '0')),
      visits: parseInt(String(visitsResult.rows[0]?.count ?? '0')),
      carePlans: parseInt(String(carePlansResult.rows[0]?.count ?? '0')),
      familyMembers: parseInt(String(familyResult.rows[0]?.count ?? '0')),
    };
  }

  /**
   * Check if an organization has demo data
   */
  async hasDemoData(organizationId: UUID): Promise<boolean> {
    const result = await this.db.query(
      'SELECT EXISTS(SELECT 1 FROM clients WHERE organization_id = $1 AND is_demo_data = true) as has_demo',
      [organizationId]
    );

    return result.rows[0]?.has_demo === true;
  }
}
