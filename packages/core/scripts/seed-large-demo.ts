/**
 * Large Demo Database Seeding Script
 *
 * Seeds comprehensive demo data for development and demonstrations.
 * This provides a realistic, rich dataset that demonstrates all platform capabilities.
 *
 * Data Scale:
 * - TX clients with varied demographics and conditions
 * - Caregivers with different certifications, skills, and availability
 * - Realistic seeding for development/testing purposes
 *
 * Usage:
 *   npm run db:seed:large-demo
 *
 * PREREQUISITE: Run `npm run db:seed` first to create org, branch, and admin user.
 */

import dotenv from "dotenv";
import { v4 as uuidv4 } from 'uuid';
import { Database, DatabaseConfig } from '../src/db/connection.js';
import { Pool, PoolClient } from 'pg';
import { PasswordUtils } from '../src/utils/password-utils.js';

dotenv.config({ path: '.env', quiet: true });

// ═══════════════════════════════════════════════════════════════════════
// DATE UTILITIES
// ═══════════════════════════════════════════════════════════════════════

const daysAgo = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

// Reserved for future use when generating future dates

// ═══════════════════════════════════════════════════════════════════════
// REALISTIC DATA
// ═══════════════════════════════════════════════════════════════════════

const TX_CLIENTS = [
  {
    firstName: 'Margaret', lastName: 'Thompson', dob: '1942-03-15', gender: 'FEMALE',
    phone: '512-555-0101', email: 'margaret.thompson@email.com',
    address: { line1: '789 Oak Avenue', line2: 'Apt 4B', city: 'Austin', zip: '78701' },
    emergencyContact: { name: 'Sarah Thompson', relationship: 'Daughter', phone: '512-555-0102' },
    diagnosis: "Alzheimer's Disease", mobilityLevel: 'WALKER'
  },
  {
    firstName: 'Robert', lastName: 'Martinez', dob: '1950-11-22', gender: 'MALE',
    phone: '512-555-0201', email: 'bobby.martinez@email.com',
    address: { line1: '789 Veterans Way', city: 'Austin', zip: '78703' },
    emergencyContact: { name: 'Maria Martinez-Chen', relationship: 'Daughter', phone: '512-555-0202' },
    diagnosis: 'PTSD, Wheelchair User', mobilityLevel: 'WHEELCHAIR',
    veteranStatus: true
  },
  // Add more TX clients...
];

const CAREGIVERS = [
  {
    firstName: 'Emily', lastName: 'Rodriguez', dob: '1992-05-14',
    phone: '512-555-1001', email: 'emily.rodriguez@carecommons.com',
    hireDate: '2022-01-15',
    certifications: [
      { type: 'CNA', number: 'CNA-TX-12345', issueDate: '2021-06-01', expiryDate: '2025-06-01' },
      { type: 'CPR', number: 'CPR-2024-001', issueDate: '2024-03-01', expiryDate: '2026-03-01' },
    ],
    specializations: ['ALZHEIMERS_CARE', 'MOBILITY_ASSISTANCE'],
    hourlyRate: 22.50,
    languages: ['English', 'Spanish']
  },
  {
    firstName: 'Michael', lastName: 'Johnson', dob: '1988-09-22',
    phone: '512-555-1002', email: 'michael.johnson@carecommons.com',
    hireDate: '2021-08-01',
    certifications: [
      { type: 'HHA', number: 'HHA-TX-67890', issueDate: '2021-05-01', expiryDate: '2025-05-01' },
    ],
    specializations: ['MEDICATION_MANAGEMENT', 'DIABETIC_CARE'],
    hourlyRate: 24.00,
    languages: ['English']
  },
  // Add more caregivers...
];

// ═══════════════════════════════════════════════════════════════════════
// MAIN SEEDING FUNCTION
// ═══════════════════════════════════════════════════════════════════════

async function seedLargeDemo() {
  console.log('🎭 Seeding large demo data...\n');

  const env = process.env.NODE_ENV || 'development';
  const dbName = process.env.DB_NAME || 'care_commons';

  let db: Database | { transaction: (callback: (client: PoolClient) => Promise<void>) => Promise<void>; close: () => Promise<void> };

  // Use DATABASE_URL if provided (for CI/CD and production)
  if (process.env.DATABASE_URL) {
    console.log('📝 Using DATABASE_URL for seeding\n');
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    db = {
      transaction: async (callback: (client: PoolClient) => Promise<void>) => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await callback(client);
          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      },
      close: async () => await pool.end(),
    };
  } else {
    const database = env === 'test' ? `${dbName}_test` : dbName;
    
    const config: DatabaseConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: process.env.DB_SSL === 'true',
    };
    
    db = new Database(config);
  }

  try {
    await db.transaction(async (client) => {
      // Fetch existing organization and user
      console.log('Fetching existing organization...');
      const orgResult = await client.query(
        'SELECT id FROM organizations ORDER BY created_at ASC LIMIT 1'
      );
      
      if (orgResult.rows.length === 0) {
        throw new Error('No organization found. Please run "npm run db:seed" first.');
      }
      
      const orgId = orgResult.rows[0].id;
      
      console.log('Fetching existing branch...');
      const branchResult = await client.query(
        'SELECT id FROM branches WHERE organization_id = $1 ORDER BY created_at ASC LIMIT 1',
        [orgId]
      );
      
      if (branchResult.rows.length === 0) {
        throw new Error('No branch found. Please run "npm run db:seed" first.');
      }
      
      const branchId = branchResult.rows[0].id;
      
      console.log('Fetching existing admin user...');
      const userResult = await client.query(
        'SELECT id FROM users WHERE organization_id = $1 ORDER BY created_at ASC LIMIT 1',
        [orgId]
      );
      
      if (userResult.rows.length === 0) {
        throw new Error('No user found. Please run "npm run db:seed" first.');
      }
      
      const systemUserId = userResult.rows[0].id;
      
      console.log(`Using org: ${orgId}, branch: ${branchId}, user: ${systemUserId}\n`);

      // Clear existing large demo data if it exists
      console.log('Clearing existing large demo data...');
      await client.query(`
        DELETE FROM visits WHERE caregiver_id IN (
          SELECT id FROM caregivers WHERE email LIKE '%carecommons.com'
        )
      `);
      await client.query(`DELETE FROM caregivers WHERE email LIKE '%carecommons.com'`);
      await client.query(`DELETE FROM clients WHERE email LIKE '%@email.com'`);

      // Seed Texas clients (20)
      console.log('Creating Texas clients...');
      const clientIds: string[] = [];
      
      for (const clientData of TX_CLIENTS as Array<{
        firstName: string;
        lastName: string;
        dob: string;
        gender: string;
        phone: string;
        email: string;
        address: { line1: string; line2?: string; city: string; zip: string };
        emergencyContact: { name: string; relationship: string; phone: string };
        diagnosis: string;
        mobilityLevel: string;
        veteranStatus?: boolean;
      }>) {
        const clientId = uuidv4();
        clientIds.push(clientId);
        
        await client.query(
          `
          INSERT INTO clients (
            id, organization_id, branch_id, client_number,
            first_name, last_name, date_of_birth, gender,
            primary_phone, email, primary_address,
            emergency_contacts, status, intake_date,
            created_by, updated_by, is_demo_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        `,
          [
            clientId,
            orgId,
            branchId,
            `LARGE-DEMO-${String(clientIds.length).padStart(3, '0')}`,
            clientData.firstName,
            clientData.lastName,
            clientData.dob,
            clientData.gender,
            JSON.stringify({ number: clientData.phone, type: 'HOME', canReceiveSMS: false }),
            clientData.email,
            JSON.stringify({
              type: 'HOME',
              line1: clientData.address.line1,
              line2: clientData.address.line2 || null,
              city: clientData.address.city,
              state: 'TX',
              postalCode: clientData.address.zip,
              country: 'US',
            }),
            JSON.stringify([
              {
                id: uuidv4(),
                name: clientData.emergencyContact.name,
                relationship: clientData.emergencyContact.relationship,
                phone: { number: clientData.emergencyContact.phone, type: 'MOBILE', canReceiveSMS: true },
                isPrimary: true,
                canMakeHealthcareDecisions: true,
              },
            ]),
            'ACTIVE',
            daysAgo(60).toISOString(),
            systemUserId,
            systemUserId,
            true,
          ]
        );
      }

      // Seed caregivers
      console.log('Creating caregivers...');
      const caregiverIds: string[] = [];
      
      for (const cgData of CAREGIVERS) {
        const caregiverId = uuidv4();
        caregiverIds.push(caregiverId);
        
        // Create user account for caregiver
        const cgPassword = PasswordUtils.hashPassword('Demo2024!');
        await client.query(
          `
          INSERT INTO users (
            id, organization_id, email, password_hash,
            first_name, last_name, role, is_active, is_demo_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id
        `,
          [
            uuidv4(),
            orgId,
            cgData.email,
            cgPassword,
            cgData.firstName,
            cgData.lastName,
            'caregiver',
            true,
            true,
          ]
        );
        
        await client.query(
          `
          INSERT INTO caregivers (
            id, organization_id, branch_ids, primary_branch_id,
            employee_number, first_name, last_name,
            date_of_birth, primary_phone, email,
            employment_type, employment_status, hire_date,
            role, permissions, credentials, skills, languages,
            pay_rate, compliance_status, status,
            created_by, updated_by, is_demo_data
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
            $19, $20, $21, $22, $23, $24
          )
        `,
          [
            caregiverId,
            orgId,
            [branchId],
            branchId,
            `LGDEMO-CG${String(caregiverIds.length).padStart(3, '0')}`,
            cgData.firstName,
            cgData.lastName,
            cgData.dob,
            JSON.stringify({ number: cgData.phone, type: 'MOBILE', canReceiveSMS: true, isPrimary: true }),
            cgData.email,
            'FULL_TIME',
            'ACTIVE',
            cgData.hireDate,
            'CAREGIVER',
            ['visits:create', 'visits:read', 'visits:update', 'clients:read'],
            JSON.stringify(cgData.certifications.map(cert => ({
              id: uuidv4(),
              type: cert.type,
              number: cert.number,
              issueDate: cert.issueDate,
              expirationDate: cert.expiryDate,
              issuingAuthority: cert.type === 'CNA' ? 'Texas Department of Aging' : 'American Red Cross',
              status: 'ACTIVE',
            }))),
            JSON.stringify(cgData.specializations.map(spec => ({
              id: uuidv4(),
              name: spec,
              category: 'Clinical',
              proficiencyLevel: 'ADVANCED',
            }))),
            cgData.languages,
            JSON.stringify({
              id: uuidv4(),
              rateType: 'BASE',
              amount: cgData.hourlyRate,
              unit: 'HOURLY',
              effectiveDate: cgData.hireDate,
              overtimeMultiplier: 1.5,
            }),
            'COMPLIANT',
            'ACTIVE',
            systemUserId,
            systemUserId,
            true,
          ]
        );
      }

      console.log('\n✅ Large demo data seeded successfully!');
      console.log(`\n📊 Created:`);
      console.log(`  Clients: ${clientIds.length}`);
      console.log(`  Caregivers: ${caregiverIds.length}`);
      console.log(`\nDemo data ready! 🎉`);
    });
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

seedLargeDemo().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
