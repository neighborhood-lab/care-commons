/**
 * Database seeding script
 * 
 * Seeds initial data for development and testing
 */

import { v4 as uuidv4 } from 'uuid';
import { Database, initializeDatabase } from '../src/db/connection';

async function seedDatabase() {
  console.log('🌱 Seeding database...\n');

  const db = initializeDatabase({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'care_commons',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true',
  });

  try {
    await db.transaction(async (client) => {
      // Create sample organization
      const orgId = uuidv4();
      const systemUserId = uuidv4();

      console.log('Creating organization...');
      await client.query(
        `
        INSERT INTO organizations (
          id, name, legal_name, phone, email, primary_address, 
          status, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
        [
          orgId,
          'Care Commons Home Health',
          'Care Commons Home Health Services, Inc.',
          '555-0100',
          'info@carecommons.example',
          JSON.stringify({
            line1: '123 Main Street',
            city: 'Springfield',
            state: 'IL',
            postalCode: '62701',
            country: 'US',
          }),
          'ACTIVE',
          systemUserId,
          systemUserId,
        ]
      );

      // Create branch
      const branchId = uuidv4();
      console.log('Creating branch...');
      await client.query(
        `
        INSERT INTO branches (
          id, organization_id, name, code, phone, address, 
          status, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
        [
          branchId,
          orgId,
          'Main Office',
          'MAIN',
          '555-0101',
          JSON.stringify({
            line1: '123 Main Street',
            city: 'Springfield',
            state: 'IL',
            postalCode: '62701',
            country: 'US',
          }),
          'ACTIVE',
          systemUserId,
          systemUserId,
        ]
      );

      // Create admin user
      console.log('Creating admin user...');
      await client.query(
        `
        INSERT INTO users (
          id, organization_id, username, email, password_hash,
          first_name, last_name, roles, branch_ids, status,
          created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `,
        [
          systemUserId,
          orgId,
          'admin',
          'admin@carecommons.example',
          '$2a$10$dummyhashdummyhashdummyhashdummyhashdummyhash', // Placeholder
          'System',
          'Administrator',
          ['SUPER_ADMIN'],
          [branchId],
          'ACTIVE',
          systemUserId,
          systemUserId,
        ]
      );

      // Create sample program
      const programId = uuidv4();
      console.log('Creating sample program...');
      await client.query(
        `
        INSERT INTO programs (
          id, organization_id, name, code, description,
          program_type, funding_source, status, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
        [
          programId,
          orgId,
          'Personal Care Services',
          'PCS',
          'In-home personal care assistance',
          'HOME_CARE',
          'MEDICAID',
          'ACTIVE',
          systemUserId,
          systemUserId,
        ]
      );

      // Create sample clients
      console.log('Creating sample clients...');
      
      const client1Id = uuidv4();
      await client.query(
        `
        INSERT INTO clients (
          id, organization_id, branch_id, client_number,
          first_name, last_name, date_of_birth, gender,
          primary_address, emergency_contacts, service_eligibility,
          status, intake_date, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `,
        [
          client1Id,
          orgId,
          branchId,
          'CL-001',
          'Jane',
          'Smith',
          '1945-03-15',
          'FEMALE',
          JSON.stringify({
            type: 'HOME',
            line1: '456 Oak Avenue',
            city: 'Springfield',
            state: 'IL',
            postalCode: '62702',
            country: 'US',
          }),
          JSON.stringify([
            {
              id: uuidv4(),
              name: 'John Smith',
              relationship: 'Son',
              phone: { number: '555-0200', type: 'MOBILE', canReceiveSMS: true },
              isPrimary: true,
              canMakeHealthcareDecisions: true,
            },
          ]),
          JSON.stringify({
            medicaidEligible: true,
            medicaidNumber: 'MCD123456',
            medicareEligible: true,
            medicareNumber: 'MCR987654',
            veteransBenefits: false,
            longTermCareInsurance: false,
            privatePayOnly: false,
          }),
          'ACTIVE',
          '2024-01-15',
          systemUserId,
          systemUserId,
        ]
      );

      const client2Id = uuidv4();
      await client.query(
        `
        INSERT INTO clients (
          id, organization_id, branch_id, client_number,
          first_name, last_name, date_of_birth, gender,
          primary_address, emergency_contacts, service_eligibility,
          status, intake_date, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `,
        [
          client2Id,
          orgId,
          branchId,
          'CL-002',
          'Robert',
          'Johnson',
          '1938-07-22',
          'MALE',
          JSON.stringify({
            type: 'HOME',
            line1: '789 Elm Street',
            city: 'Springfield',
            state: 'IL',
            postalCode: '62703',
            country: 'US',
          }),
          JSON.stringify([
            {
              id: uuidv4(),
              name: 'Mary Johnson',
              relationship: 'Daughter',
              phone: { number: '555-0300', type: 'MOBILE', canReceiveSMS: true },
              isPrimary: true,
              canMakeHealthcareDecisions: true,
            },
          ]),
          JSON.stringify({
            medicaidEligible: false,
            medicareEligible: true,
            medicareNumber: 'MCR555444',
            veteransBenefits: true,
            longTermCareInsurance: true,
            privatePayOnly: false,
          }),
          'ACTIVE',
          '2024-02-01',
          systemUserId,
          systemUserId,
        ]
      );

      console.log('\n✅ Database seeded successfully!');
      console.log('\nSample data created:');
      console.log(`  Organization: ${orgId}`);
      console.log(`  Branch: ${branchId}`);
      console.log(`  Admin User: admin@carecommons.example`);
      console.log(`  Clients: 2`);
    });
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

seedDatabase().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
