import { Database } from '../src/db/connection';
import { v4 as uuidv4 } from 'uuid';

export async function seedStateSpecificCarePlans(db: Database) {
  console.log('Seeding TX/FL state-specific care plans...');

  // Fetch organization and users
  const orgResult = await db.query('SELECT id FROM organizations LIMIT 1');
  const org = orgResult.rows[0];
  if (!org) throw new Error('No organization found');

  const userResult = await db.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['ADMIN']);
  const adminUser = userResult.rows[0];
  if (!adminUser) throw new Error('No admin user found');

  // TX Client: Maria Rodriguez (STAR+PLUS)
  const txClientId = uuidv4();
  await db.query(
    `
    INSERT INTO clients (
      id, organization_id, client_number, first_name, last_name, 
      date_of_birth, primary_phone, primary_email, status,
      state_specific, created_by, updated_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
  `,
    [
      txClientId,
      org.id,
      'TX-001',
      'Maria',
      'Rodriguez',
      '1955-03-15',
      JSON.stringify({ number: '512-555-0101', type: 'MOBILE' }),
      'maria.rodriguez@example.com',
      'ACTIVE',
      JSON.stringify({
        state: 'TX',
        texas: {
          medicaidMemberId: 'TX-MCD-12345',
          medicaidProgram: 'STAR_PLUS',
          hhscClientId: 'HHSC-67890',
          serviceDeliveryOption: 'AGENCY',
          evvEntityId: 'HHA-TX-001',
          emergencyPlanOnFile: true,
          emergencyPlanDate: '2025-01-15',
          acuityLevel: 'MODERATE',
          authorizedServices: [
            {
              id: uuidv4(),
              serviceCode: 'S5125',
              serviceName: 'Personal Assistance Services',
              authorizedUnits: 160,
              usedUnits: 0,
              unitType: 'HOURS',
              authorizationNumber: 'AUTH-TX-2025-001',
              effectiveDate: '2025-01-01',
              expirationDate: '2025-12-31',
              status: 'ACTIVE',
              requiresEVV: true,
            },
          ],
        },
      }),
      adminUser.id,
      adminUser.id,
    ]
  );

  // FL Client: Rosa Garcia (SMMC LTC)
  const flClientId = uuidv4();
  await db.query(
    `
    INSERT INTO clients (
      id, organization_id, client_number, first_name, last_name,
      date_of_birth, primary_phone, primary_email, status,
      state_specific, created_by, updated_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
  `,
    [
      flClientId,
      org.id,
      'FL-001',
      'Rosa',
      'Garcia',
      '1948-07-22',
      JSON.stringify({ number: '305-555-0201', type: 'MOBILE' }),
      'rosa.garcia@example.com',
      'ACTIVE',
      JSON.stringify({
        state: 'FL',
        florida: {
          medicaidRecipientId: 'FL-MCD-54321',
          managedCarePlan: 'SMMC_LTC',
          doeaRiskClassification: 'HIGH',
          hurricaneZone: 'A',
          evvAggregatorId: 'HHAX-FL-001',
          smmcProgramEnrollment: true,
          ltcProgramEnrollment: true,
          authorizedServices: [
            {
              id: uuidv4(),
              serviceCode: 'S0215',
              serviceName: 'Skilled Nursing Services',
              authorizedUnits: 120,
              usedUnits: 0,
              unitType: 'HOURS',
              authorizationNumber: 'AUTH-FL-2025-001',
              effectiveDate: '2025-01-01',
              expirationDate: '2025-12-31',
              visitFrequency: 'Daily',
              status: 'ACTIVE',
              requiresEVV: true,
              requiresRNSupervision: true,
            },
          ],
        },
      }),
      adminUser.id,
      adminUser.id,
    ]
  );

  // TX Care Plan
  const txCarePlanId = uuidv4();
  await db.query(
    `
    INSERT INTO care_plans (
      id, plan_number, name, client_id, organization_id,
      plan_type, status, priority, effective_date,
      state_jurisdiction, ordering_provider_name,
      ordering_provider_license, ordering_provider_npi,
      order_date, plan_review_interval_days, next_review_due,
      disaster_plan_on_file, goals, interventions,
      created_by, updated_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
  `,
    [
      txCarePlanId,
      'CP-TX-2025-001',
      'Personal Care Services Plan - Maria Rodriguez',
      txClientId,
      org.id,
      'PERSONAL_CARE',
      'ACTIVE',
      'HIGH',
      '2025-01-01',
      'TX',
      'Dr. James Smith',
      'TX-MD-123456',
      '1234567890',
      '2024-12-28',
      60, // TX requires 60-day review
      '2025-03-01',
      true,
      JSON.stringify([
        {
          id: uuidv4(),
          goalStatement: 'Client will safely complete ADLs with minimal assistance',
          category: 'FUNCTIONAL',
          targetDate: '2025-06-01',
          status: 'IN_PROGRESS',
        },
      ]),
      JSON.stringify([
        {
          id: uuidv4(),
          description: 'Assist with bathing, dressing, grooming',
          category: 'PERSONAL_CARE',
          frequency: 'DAILY',
        },
      ]),
      adminUser.id,
      adminUser.id,
    ]
  );

  // TX Service Authorization
  await db.query(
    `
    INSERT INTO service_authorizations (
      id, care_plan_id, client_id, organization_id,
      state_jurisdiction, authorization_type, authorization_number,
      payer_name, service_codes, authorized_units, unit_type,
      effective_date, expiration_date, units_used, units_remaining,
      form_number, status, created_by, updated_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
  `,
    [
      uuidv4(),
      txCarePlanId,
      txClientId,
      org.id,
      'TX',
      'HHSC',
      'AUTH-TX-2025-001',
      'Texas Medicaid STAR+PLUS',
      ['S5125'],
      160,
      'HOURS',
      '2025-01-01',
      '2025-12-31',
      0,
      160,
      'HHSC-4100',
      'ACTIVE',
      adminUser.id,
      adminUser.id,
    ]
  );

  // FL Care Plan
  const flCarePlanId = uuidv4();
  const rnUserId = uuidv4(); // Supervisor RN

  await db.query(
    `
    INSERT INTO care_plans (
      id, plan_number, name, client_id, organization_id,
      plan_type, status, priority, effective_date,
      state_jurisdiction, ordering_provider_name,
      ordering_provider_license, ordering_provider_npi,
      order_date, rn_supervisor_id, rn_supervisor_name,
      rn_supervisor_license, last_supervisory_visit_date,
      next_supervisory_visit_due, plan_review_interval_days,
      next_review_due, goals, interventions,
      created_by, updated_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
  `,
    [
      flCarePlanId,
      'CP-FL-2025-001',
      'Skilled Nursing Plan - Rosa Garcia',
      flClientId,
      org.id,
      'SKILLED_NURSING',
      'ACTIVE',
      'HIGH',
      '2025-01-01',
      'FL',
      'Dr. Patricia Martinez',
      'FL-MD-789012',
      '9876543210',
      '2024-12-29',
      rnUserId,
      'Sarah Johnson, RN',
      'FL-RN-456789',
      '2025-01-20',
      '2025-02-03', // 14-day supervision cycle
      60, // FL requires 60-day review
      '2025-03-01',
      JSON.stringify([
        {
          id: uuidv4(),
          goalStatement: 'Wound healing progressing, no infection',
          category: 'MEDICAL',
          targetDate: '2025-03-01',
          status: 'IN_PROGRESS',
        },
      ]),
      JSON.stringify([
        {
          id: uuidv4(),
          description: 'Wound care and dressing changes',
          category: 'SKILLED_NURSING',
          frequency: 'DAILY',
        },
      ]),
      adminUser.id,
      adminUser.id,
    ]
  );

  // FL Service Authorization
  await db.query(
    `
    INSERT INTO service_authorizations (
      id, care_plan_id, client_id, organization_id,
      state_jurisdiction, authorization_type, authorization_number,
      payer_name, service_codes, authorized_units, unit_type,
      effective_date, expiration_date, units_used, units_remaining,
      ahca_provider_number, smmc_plan_name, status,
      created_by, updated_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
  `,
    [
      uuidv4(),
      flCarePlanId,
      flClientId,
      org.id,
      'FL',
      'AHCA',
      'AUTH-FL-2025-001',
      'Florida SMMC LTC',
      ['S0215'],
      120,
      'HOURS',
      '2025-01-01',
      '2025-12-31',
      0,
      120,
      'AHCA-123456',
      'Sunshine Health LTC',
      'ACTIVE',
      adminUser.id,
      adminUser.id,
    ]
  );

  // FL RN Delegation (for medication administration)
  await db.query(
    `
    INSERT INTO rn_delegations (
      id, care_plan_id, client_id, organization_id,
      delegating_rn_id, delegating_rn_name, delegating_rn_license,
      delegated_to_caregiver_name, delegated_to_credential_type,
      task_category, task_description, specific_skills_delegated,
      training_provided, training_date, training_method,
      competency_evaluated, competency_evaluation_date,
      competency_evaluator_id, evaluation_result,
      effective_date, supervision_frequency,
      last_supervision_date, next_supervision_due,
      status, ahca_delegation_form_number,
      created_by, updated_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
  `,
    [
      uuidv4(),
      flCarePlanId,
      flClientId,
      org.id,
      rnUserId,
      'Sarah Johnson',
      'FL-RN-456789',
      'Assigned CNA',
      'CNA',
      'MEDICATION',
      'Oral medication administration per physician orders',
      ['Medication administration', 'Vital signs monitoring'],
      true,
      '2025-01-10',
      'In-person demonstration',
      true,
      '2025-01-15',
      rnUserId,
      'COMPETENT',
      '2025-01-15',
      'Weekly',
      '2025-01-20',
      '2025-01-27',
      'ACTIVE',
      'AHCA-DEL-2025-001',
      adminUser.id,
      adminUser.id,
    ]
  );

  console.log('✅ TX/FL care plans seeded successfully');
  console.log(`   TX Client: ${txClientId} (Maria Rodriguez - STAR+PLUS)`);
  console.log(`   FL Client: ${flClientId} (Rosa Garcia - SMMC LTC)`);
  console.log(`   TX Care Plan: ${txCarePlanId}`);
  console.log(`   FL Care Plan: ${flCarePlanId}`);
}
