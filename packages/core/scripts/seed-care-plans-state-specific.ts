import { v4 as uuidv4 } from 'uuid';
import { Database } from '../src/db/connection';

export async function seedStateSpecificCarePlans(db: Database) {
  const systemUserId = uuidv4();
  const orgId = uuidv4();
  
  // Create TX client with STAR+PLUS authorization
  const txClientId = uuidv4();
  await db.query(`
    INSERT INTO clients (id, first_name, last_name, organization_id, created_by, updated_by)
    VALUES ($1, 'Carlos', 'Mendez', $2, $3, $3)
  `, [txClientId, orgId, systemUserId]);

  // TX Care Plan: Personal Assistance Services (PAS)
  const txCarePlanId = uuidv4();
  await db.query(`
    INSERT INTO care_plans (
      id, plan_number, name, client_id, organization_id, plan_type, status,
      effective_date, expiration_date, state_jurisdiction,
      ordering_provider_name, ordering_provider_license, ordering_provider_npi,
      order_date, medicaid_program, service_authorization_form,
      plan_review_interval_days, next_review_due, disaster_plan_on_file,
      goals, interventions, created_by, updated_by
    ) VALUES (
      $1, 'TX-PAS-001', 'Carlos Mendez - Personal Assistance', $2, $3,
      'PERSONAL_CARE', 'ACTIVE', '2025-01-01', '2025-12-31', 'TX',
      'Dr. Sarah Johnson', 'TX-MED-12345', '1234567890',
      '2024-12-15', 'STAR_PLUS', 'HHSC Form 4100',
      60, '2025-03-01', true,
      $4::jsonb, $5::jsonb, $6, $6
    )
  `, [
    txCarePlanId, txClientId, orgId,
    JSON.stringify([{
      id: uuidv4(),
      name: 'Maintain independence in mobility',
      category: 'MOBILITY',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      progressPercentage: 65
    }]),
    JSON.stringify([{
      id: uuidv4(),
      name: 'Walker-assisted ambulation training',
      category: 'ASSISTANCE_WITH_ADL',
      frequency: { pattern: 'DAILY', timesPerDay: 2 },
      status: 'ACTIVE'
    }]),
    systemUserId
  ]);

  // TX Service Authorization
  await db.query(`
    INSERT INTO service_authorizations (
      id, client_id, care_plan_id, authorization_number, payer, payer_type,
      service_code, service_name, units_authorized, unit_type,
      authorization_start_date, authorization_end_date, status,
      created_by, updated_by
    ) VALUES (
      $1, $2, $3, 'TX-AUTH-2025-001', 'HHSC STAR+PLUS', 'MEDICAID_MCO',
      'S5125', 'Personal Assistance Services', 160, 'HOURS',
      '2025-01-01', '2025-03-31', 'ACTIVE', $4, $4
    )
  `, [uuidv4(), txClientId, txCarePlanId, systemUserId]);

  // Create FL client with SMMC LTC
  const flClientId = uuidv4();
  await db.query(`
    INSERT INTO clients (id, first_name, last_name, organization_id, created_by, updated_by)
    VALUES ($1, 'Elena', 'Rodriguez', $2, $3, $3)
  `, [flClientId, orgId, systemUserId]);

  // FL Care Plan: Skilled Nursing with RN supervision
  const flCarePlanId = uuidv4();
  const rnSupervisorId = uuidv4();
  await db.query(`
    INSERT INTO care_plans (
      id, plan_number, name, client_id, organization_id, plan_type, status,
      effective_date, expiration_date, state_jurisdiction,
      rn_supervisor_id, rn_supervisor_name, rn_supervisor_license,
      last_supervisory_visit_date, next_supervisory_visit_due,
      medicaid_program, plan_review_interval_days, next_review_due,
      infection_control_plan_reviewed, goals, interventions,
      created_by, updated_by
    ) VALUES (
      $1, 'FL-SN-001', 'Elena Rodriguez - Skilled Nursing', $2, $3,
      'SKILLED_NURSING', 'ACTIVE', '2025-01-01', '2025-06-30', 'FL',
      $4, 'RN Patricia Johnson', 'FL-RN-98765',
      '2025-01-15', '2025-03-15',
      'SMMC_LTC', 90, '2025-04-01', true,
      $5::jsonb, $6::jsonb, $7, $7
    )
  `, [
    flCarePlanId, flClientId, orgId, rnSupervisorId,
    JSON.stringify([{
      id: uuidv4(),
      name: 'Wound healing progression',
      category: 'WOUND_CARE',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      progressPercentage: 40
    }]),
    JSON.stringify([{
      id: uuidv4(),
      name: 'Stage 2 pressure ulcer wound care',
      category: 'WOUND_CARE',
      frequency: { pattern: 'DAILY', timesPerDay: 2 },
      status: 'ACTIVE',
      requiresSupervision: true
    }]),
    systemUserId
  ]);

  // FL Service Authorization
  await db.query(`
    INSERT INTO service_authorizations (
      id, client_id, care_plan_id, authorization_number, payer, payer_type,
      service_code, service_name, units_authorized, unit_type,
      authorization_start_date, authorization_end_date, status,
      created_by, updated_by
    ) VALUES (
      $1, $2, $3, 'FL-AUTH-2025-001', 'AHCA SMMC', 'MEDICAID_MANAGED',
      'S0215', 'Skilled Nursing Visit', 60, 'VISITS',
      '2025-01-01', '2025-06-30', 'ACTIVE', $4, $4
    )
  `, [uuidv4(), flClientId, flCarePlanId, systemUserId]);

  console.log('✅ TX/FL care plans seed data complete');
}