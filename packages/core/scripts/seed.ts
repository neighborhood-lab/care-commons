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

      // Client 1: Active senior with multiple risk flags
      const client1Id = uuidv4();
      await client.query(
        `
        INSERT INTO clients (
          id, organization_id, branch_id, client_number,
          first_name, middle_name, last_name, preferred_name,
          date_of_birth, gender, pronouns,
          primary_phone, alternate_phone, email,
          preferred_contact_method, language,
          primary_address, living_arrangement, mobility_info,
          emergency_contacts, authorized_contacts,
          primary_physician, pharmacy, insurance,
          programs, service_eligibility, funding_sources,
          risk_flags, allergies,
          special_instructions, access_instructions,
          status, intake_date, referral_source,
          created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
                 $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29,
                 $30, $31, $32, $33, $34, $35, $36)
      `,
        [
          client1Id,
          orgId,
          branchId,
          'CL-2024-001',
          'Margaret',
          'Rose',
          'Thompson',
          'Maggie',
          '1942-06-15',
          'FEMALE',
          'she/her',
          JSON.stringify({ number: '555-0201', type: 'HOME', canReceiveSMS: false }),
          JSON.stringify({ number: '555-0202', type: 'MOBILE', canReceiveSMS: true }),
          'maggie.thompson@example.com',
          'PHONE',
          'English',
          JSON.stringify({
            type: 'HOME',
            line1: '456 Oak Avenue',
            line2: 'Apt 3B',
            city: 'Springfield',
            state: 'IL',
            postalCode: '62702',
            county: 'Sangamon',
            country: 'US',
            latitude: 39.7817,
            longitude: -89.6501,
          }),
          JSON.stringify({
            type: 'ALONE',
            householdMembers: 1,
            pets: [{ type: 'cat', name: 'Whiskers', notes: 'Very friendly, indoor only' }],
            environmentalHazards: ['Stairs to second floor', 'No elevator'],
          }),
          JSON.stringify({
            requiresWheelchair: false,
            requiresWalker: true,
            requiresStairsAccess: true,
            transferAssistance: 'MINIMAL',
            notes: 'Uses walker for distances over 20 feet',
          }),
          JSON.stringify([
            {
              id: uuidv4(),
              name: 'Sarah Thompson-Martinez',
              relationship: 'Daughter',
              phone: { number: '555-0210', type: 'MOBILE', canReceiveSMS: true },
              alternatePhone: { number: '555-0211', type: 'WORK', canReceiveSMS: false },
              email: 'sarah.tm@example.com',
              address: {
                type: 'HOME',
                line1: '789 Maple Drive',
                city: 'Springfield',
                state: 'IL',
                postalCode: '62704',
                country: 'US',
              },
              isPrimary: true,
              canMakeHealthcareDecisions: true,
              notes: 'Available evenings and weekends',
            },
            {
              id: uuidv4(),
              name: 'James Thompson',
              relationship: 'Son',
              phone: { number: '555-0220', type: 'MOBILE', canReceiveSMS: true },
              email: 'james.t@example.com',
              isPrimary: false,
              canMakeHealthcareDecisions: false,
              notes: 'Lives out of state, contact for major decisions only',
            },
          ]),
          JSON.stringify([
            {
              id: uuidv4(),
              name: 'Sarah Thompson-Martinez',
              relationship: 'Daughter',
              phone: { number: '555-0210', type: 'MOBILE', canReceiveSMS: true },
              email: 'sarah.tm@example.com',
              authorizations: [
                { type: 'HIPAA', grantedAt: '2024-01-10T10:00:00Z' },
                { type: 'SCHEDULE_CHANGES', grantedAt: '2024-01-10T10:00:00Z' },
                { type: 'CARE_DECISIONS', grantedAt: '2024-01-10T10:00:00Z' },
              ],
            },
          ]),
          JSON.stringify({
            name: 'Dr. Elizabeth Chen',
            specialty: 'Internal Medicine',
            phone: { number: '555-0300', type: 'WORK', canReceiveSMS: false },
            fax: '555-0301',
            address: {
              line1: '123 Medical Plaza',
              city: 'Springfield',
              state: 'IL',
              postalCode: '62701',
              country: 'US',
            },
            npi: '1234567890',
          }),
          JSON.stringify({
            name: 'Springfield Pharmacy',
            phone: { number: '555-0400', type: 'WORK', canReceiveSMS: false },
            fax: '555-0401',
            address: {
              line1: '456 Main Street',
              city: 'Springfield',
              state: 'IL',
              postalCode: '62701',
              country: 'US',
            },
            isMailOrder: false,
          }),
          JSON.stringify([
            {
              id: uuidv4(),
              type: 'PRIMARY',
              provider: 'Medicare Part A & B',
              policyNumber: 'MCR123456789A',
              subscriberId: 'MCR123456789A',
              subscriberName: 'Margaret R Thompson',
              subscriberRelationship: 'Self',
              effectiveDate: '2007-06-01',
            },
            {
              id: uuidv4(),
              type: 'SECONDARY',
              provider: 'Blue Cross Blue Shield - Medigap',
              policyNumber: 'BCBS987654',
              groupNumber: 'GRP12345',
              subscriberId: 'BCBS987654',
              subscriberName: 'Margaret R Thompson',
              subscriberRelationship: 'Self',
              effectiveDate: '2007-06-01',
              copay: 0,
              deductible: 0,
            },
          ]),
          JSON.stringify([
            {
              id: uuidv4(),
              programId: programId,
              programName: 'Personal Care Services',
              enrollmentDate: '2024-01-15',
              status: 'ACTIVE',
              authorizedHoursPerWeek: 20,
              notes: 'Approved for personal care and light housekeeping',
            },
          ]),
          JSON.stringify({
            medicaidEligible: false,
            medicareEligible: true,
            medicareNumber: 'MCR123456789A',
            veteransBenefits: false,
            longTermCareInsurance: false,
            privatePayOnly: false,
            eligibilityVerifiedDate: '2024-01-10',
          }),
          JSON.stringify([
            {
              id: uuidv4(),
              type: 'MEDICARE',
              name: 'Medicare Part A & B',
              priority: 1,
              accountNumber: 'MCR123456789A',
              effectiveDate: '2024-01-15',
            },
            {
              id: uuidv4(),
              type: 'PRIVATE_INSURANCE',
              name: 'Blue Cross Blue Shield - Medigap',
              priority: 2,
              accountNumber: 'BCBS987654',
              effectiveDate: '2024-01-15',
            },
          ]),
          JSON.stringify([
            {
              id: uuidv4(),
              type: 'FALL_RISK',
              severity: 'HIGH',
              description: 'History of falls, uses walker, stairs in home',
              identifiedDate: '2024-01-15',
              mitigationPlan: 'Walker use enforced, fall prevention exercises, stair safety assessment completed',
              requiresAcknowledgment: true,
            },
            {
              id: uuidv4(),
              type: 'MEDICATION_COMPLIANCE',
              severity: 'MEDIUM',
              description: 'Sometimes forgets afternoon medications',
              identifiedDate: '2024-02-01',
              mitigationPlan: 'Medication reminder system, daily check-in during visits',
              requiresAcknowledgment: false,
            },
          ]),
          JSON.stringify([
            {
              id: uuidv4(),
              allergen: 'Penicillin',
              type: 'MEDICATION',
              reaction: 'Severe rash and breathing difficulty',
              severity: 'LIFE_THREATENING',
              notes: 'Use alternative antibiotics only',
            },
            {
              id: uuidv4(),
              allergen: 'Shellfish',
              type: 'FOOD',
              reaction: 'Hives and swelling',
              severity: 'MODERATE',
            },
          ]),
          'Please help with light housekeeping, meal preparation, and medication reminders. Client prefers morning visits between 9-11 AM.',
          'Use side entrance, doorbell broken - knock loudly. Cat may try to escape, please be careful.',
          'ACTIVE',
          '2024-01-15',
          'Dr. Elizabeth Chen referral',
          systemUserId,
          systemUserId,
        ]
      );

      // Client 2: Veteran with complex care needs
      const client2Id = uuidv4();
      await client.query(
        `
        INSERT INTO clients (
          id, organization_id, branch_id, client_number,
          first_name, last_name, preferred_name,
          date_of_birth, gender, pronouns,
          primary_phone, email, preferred_contact_method,
          language, marital_status, veteran_status,
          primary_address, living_arrangement, mobility_info,
          emergency_contacts, authorized_contacts,
          primary_physician,
          programs, service_eligibility, funding_sources,
          risk_flags, special_instructions, access_instructions,
          status, intake_date, referral_source,
          created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
                 $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29,
                 $30, $31, $32, $33)
      `,
        [
          client2Id,
          orgId,
          branchId,
          'CL-2024-002',
          'Robert',
          'Martinez',
          'Bobby',
          '1950-11-22',
          'MALE',
          'he/him',
          JSON.stringify({ number: '555-0350', type: 'MOBILE', canReceiveSMS: true }),
          'bobby.martinez@example.com',
          'SMS',
          'English',
          'WIDOWED',
          true,
          JSON.stringify({
            type: 'HOME',
            line1: '789 Veterans Way',
            city: 'Springfield',
            state: 'IL',
            postalCode: '62703',
            county: 'Sangamon',
            country: 'US',
            latitude: 39.7990,
            longitude: -89.6440,
          }),
          JSON.stringify({
            type: 'WITH_FAMILY',
            description: 'Lives with daughter and her family',
            householdMembers: 4,
            pets: [{ type: 'dog', name: 'Max', notes: 'Service dog for PTSD' }],
          }),
          JSON.stringify({
            requiresWheelchair: true,
            requiresWalker: false,
            requiresStairsAccess: false,
            transferAssistance: 'MODERATE',
            notes: 'Manual wheelchair, can transfer with assistance. Ramp at entrance.',
          }),
          JSON.stringify([
            {
              id: uuidv4(),
              name: 'Maria Martinez-Chen',
              relationship: 'Daughter',
              phone: { number: '555-0360', type: 'MOBILE', canReceiveSMS: true },
              email: 'maria.mc@example.com',
              isPrimary: true,
              canMakeHealthcareDecisions: true,
              notes: 'Primary caregiver, works from home most days',
            },
          ]),
          JSON.stringify([
            {
              id: uuidv4(),
              name: 'Maria Martinez-Chen',
              relationship: 'Daughter',
              phone: { number: '555-0360', type: 'MOBILE', canReceiveSMS: true },
              email: 'maria.mc@example.com',
              authorizations: [
                { type: 'HIPAA', grantedAt: '2024-02-01T14:00:00Z' },
                { type: 'SCHEDULE_CHANGES', grantedAt: '2024-02-01T14:00:00Z' },
                { type: 'CARE_DECISIONS', grantedAt: '2024-02-01T14:00:00Z' },
                { type: 'FINANCIAL', grantedAt: '2024-02-01T14:00:00Z' },
              ],
            },
          ]),
          JSON.stringify({
            name: 'Dr. Michael Anderson',
            specialty: 'Physical Medicine and Rehabilitation',
            phone: { number: '555-0500', type: 'WORK', canReceiveSMS: false },
            address: {
              line1: '789 VA Medical Center',
              city: 'Springfield',
              state: 'IL',
              postalCode: '62702',
              country: 'US',
            },
            npi: '9876543210',
          }),
          JSON.stringify([
            {
              id: uuidv4(),
              programId: programId,
              programName: 'Personal Care Services',
              enrollmentDate: '2024-02-01',
              status: 'ACTIVE',
              authorizedHoursPerWeek: 28,
              notes: 'Approved for personal care, transfers, and physical therapy assistance',
            },
          ]),
          JSON.stringify({
            medicaidEligible: false,
            medicareEligible: true,
            medicareNumber: 'MCR987654321B',
            veteransBenefits: true,
            longTermCareInsurance: false,
            privatePayOnly: false,
            eligibilityVerifiedDate: '2024-01-28',
            eligibilityNotes: 'VA benefits cover 50% of approved services',
          }),
          JSON.stringify([
            {
              id: uuidv4(),
              type: 'VETERANS_BENEFITS',
              name: 'VA Home Based Primary Care',
              priority: 1,
              accountNumber: 'VA987654',
              effectiveDate: '2024-02-01',
              authorizedAmount: 1200,
              notes: 'Covers 50% of approved personal care services',
            },
            {
              id: uuidv4(),
              type: 'MEDICARE',
              name: 'Medicare Part A & B',
              priority: 2,
              accountNumber: 'MCR987654321B',
              effectiveDate: '2024-02-01',
            },
          ]),
          JSON.stringify([
            {
              id: uuidv4(),
              type: 'SAFETY_CONCERN',
              severity: 'MEDIUM',
              description: 'Service dog must be present during care - provides PTSD support',
              identifiedDate: '2024-02-01',
              mitigationPlan: 'All caregivers briefed on service dog protocols',
              requiresAcknowledgment: true,
            },
          ]),
          'Client is a Vietnam veteran with PTSD. Please be mindful of loud noises. Service dog (Max) must be present during care. Client prefers afternoon visits after 2 PM.',
          'Single-story home with wheelchair ramp at front entrance. Doorbell works. Max (service dog) will bark but is friendly.',
          'ACTIVE',
          '2024-02-01',
          'VA Social Worker referral',
          systemUserId,
          systemUserId,
        ]
      );

      // Client 3: New intake - pending assessment
      const client3Id = uuidv4();
      await client.query(
        `
        INSERT INTO clients (
          id, organization_id, branch_id, client_number,
          first_name, middle_name, last_name,
          date_of_birth, gender,
          primary_phone, email,
          primary_address, emergency_contacts,
          service_eligibility, status, intake_date,
          referral_source, notes,
          created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      `,
        [
          client3Id,
          orgId,
          branchId,
          'CL-2024-003',
          'Dorothy',
          'Ann',
          'Williams',
          '1948-03-08',
          'FEMALE',
          JSON.stringify({ number: '555-0450', type: 'HOME', canReceiveSMS: false }),
          'dorothy.williams@example.com',
          JSON.stringify({
            type: 'HOME',
            line1: '321 Pine Street',
            city: 'Springfield',
            state: 'IL',
            postalCode: '62704',
            country: 'US',
          }),
          JSON.stringify([
            {
              id: uuidv4(),
              name: 'Patricia Williams',
              relationship: 'Sister',
              phone: { number: '555-0460', type: 'MOBILE', canReceiveSMS: true },
              email: 'patricia.w@example.com',
              isPrimary: true,
              canMakeHealthcareDecisions: true,
            },
          ]),
          JSON.stringify({
            medicaidEligible: true,
            medicaidNumber: 'MCD789012',
            medicareEligible: true,
            medicareNumber: 'MCR456789012C',
            veteransBenefits: false,
            longTermCareInsurance: false,
            privatePayOnly: false,
          }),
          'PENDING_INTAKE',
          '2024-03-01',
          'Hospital discharge planner',
          'Initial intake scheduled for 3/5/2024. Needs assessment for post-stroke care.',
          systemUserId,
          systemUserId,
        ]
      );

      // Client 4: On hold due to hospitalization
      const client4Id = uuidv4();
      await client.query(
        `
        INSERT INTO clients (
          id, organization_id, branch_id, client_number,
          first_name, last_name,
          date_of_birth, gender,
          primary_phone,
          primary_address, emergency_contacts,
          programs, service_eligibility,
          status, intake_date, notes,
          created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      `,
        [
          client4Id,
          orgId,
          branchId,
          'CL-2024-004',
          'George',
          'Patterson',
          '1941-09-15',
          'MALE',
          JSON.stringify({ number: '555-0550', type: 'HOME', canReceiveSMS: false }),
          JSON.stringify({
            type: 'HOME',
            line1: '654 Birch Lane',
            city: 'Springfield',
            state: 'IL',
            postalCode: '62701',
            country: 'US',
          }),
          JSON.stringify([
            {
              id: uuidv4(),
              name: 'Linda Patterson',
              relationship: 'Spouse',
              phone: { number: '555-0560', type: 'MOBILE', canReceiveSMS: true },
              isPrimary: true,
              canMakeHealthcareDecisions: true,
            },
          ]),
          JSON.stringify([
            {
              id: uuidv4(),
              programId: programId,
              programName: 'Personal Care Services',
              enrollmentDate: '2023-11-01',
              status: 'ACTIVE',
              authorizedHoursPerWeek: 15,
            },
          ]),
          JSON.stringify({
            medicaidEligible: false,
            medicareEligible: true,
            medicareNumber: 'MCR321654987D',
            veteransBenefits: false,
            longTermCareInsurance: true,
            privatePayOnly: false,
          }),
          'ON_HOLD',
          '2023-11-01',
          'Services on hold as of 2/28/2024 - client hospitalized. Will resume upon discharge.',
          systemUserId,
          systemUserId,
        ]
      );

      // Client 5: Inquiry stage - potential client
      const client5Id = uuidv4();
      await client.query(
        `
        INSERT INTO clients (
          id, organization_id, branch_id, client_number,
          first_name, last_name,
          date_of_birth, gender,
          primary_phone, email,
          primary_address, emergency_contacts,
          service_eligibility, status,
          referral_source, notes,
          created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      `,
        [
          client5Id,
          orgId,
          branchId,
          'CL-2024-005',
          'Eleanor',
          'Rodriguez',
          '1952-12-20',
          'FEMALE',
          JSON.stringify({ number: '555-0650', type: 'MOBILE', canReceiveSMS: true }),
          'eleanor.r@example.com',
          JSON.stringify({
            type: 'HOME',
            line1: '987 Cedar Court',
            city: 'Springfield',
            state: 'IL',
            postalCode: '62702',
            country: 'US',
          }),
          JSON.stringify([
            {
              id: uuidv4(),
              name: 'Carlos Rodriguez',
              relationship: 'Son',
              phone: { number: '555-0660', type: 'MOBILE', canReceiveSMS: true },
              email: 'carlos.r@example.com',
              isPrimary: true,
              canMakeHealthcareDecisions: false,
            },
          ]),
          JSON.stringify({
            medicaidEligible: false,
            medicareEligible: true,
            veteransBenefits: false,
            longTermCareInsurance: false,
            privatePayOnly: true,
          }),
          'INQUIRY',
          'Family self-referral',
          'Initial inquiry received 3/3/2024. Family interested in respite care 2-3 times per week. Follow-up call scheduled for 3/8/2024.',
          systemUserId,
          systemUserId,
        ]
      );

      console.log('\n✅ Database seeded successfully!');
      console.log('\n📊 Sample data created:');
      console.log(`  Organization: Care Commons Home Health`);
      console.log(`  Branch: Main Office`);
      console.log(`  Admin User: admin@carecommons.example`);
      console.log(`  Program: Personal Care Services`);
      console.log(`\n👥 Clients: 5`);
      console.log(`    • CL-2024-001: Margaret Thompson (Active) - Fall risk, uses walker`);
      console.log(`    • CL-2024-002: Robert Martinez (Active) - Veteran, wheelchair user`);
      console.log(`    • CL-2024-003: Dorothy Williams (Pending Intake) - Post-stroke assessment needed`);
      console.log(`    • CL-2024-004: George Patterson (On Hold) - Hospitalized`);
      console.log(`    • CL-2024-005: Eleanor Rodriguez (Inquiry) - Respite care inquiry`);
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
