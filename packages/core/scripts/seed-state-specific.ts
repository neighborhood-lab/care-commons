/**
 * Enhanced seed data for Texas and Florida state-specific scenarios
 * 
 * Creates realistic demo data for:
 * - Texas clients with STAR+PLUS, CDS, and EVV requirements
 * - Florida clients with SMMC, LTC, and RN supervision needs
 * - Texas caregivers with registry checks and mandatory training
 * - Florida caregivers with Level 2 screening and licensure
 */

import { v4 as uuidv4 } from 'uuid';
import { Database } from '../src/db/connection';

// IDs for reference
const ORG_ID = uuidv4();
const BRANCH_TX_ID = uuidv4();
const BRANCH_FL_ID = uuidv4();
const SYSTEM_USER_ID = uuidv4();

export async function seedStateSpecificData(db: Database) {
  console.log('🌱 Seeding Texas and Florida state-specific data...');

  // Create organization
  await db.query(
    `INSERT INTO organizations (id, name, type, status, created_at, created_by, updated_at, updated_by)
     VALUES ($1, $2, $3, $4, NOW(), $5, NOW(), $5)
     ON CONFLICT (id) DO NOTHING`,
    [ORG_ID, 'Care Commons Demo Agency', 'HOME_HEALTH', 'ACTIVE', SYSTEM_USER_ID]
  );

  // Create Texas branch
  await db.query(
    `INSERT INTO branches (id, organization_id, name, state, city, status, created_at, created_by, updated_at, updated_by)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, NOW(), $7)
     ON CONFLICT (id) DO NOTHING`,
    [BRANCH_TX_ID, ORG_ID, 'Houston Branch', 'TX', 'Houston', 'ACTIVE', SYSTEM_USER_ID]
  );

  // Create Florida branch
  await db.query(
    `INSERT INTO branches (id, organization_id, name, state, city, status, created_at, created_by, updated_at, updated_by)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, NOW(), $7)
     ON CONFLICT (id) DO NOTHING`,
    [BRANCH_FL_ID, ORG_ID, 'Miami Branch', 'FL', 'Miami', 'ACTIVE', SYSTEM_USER_ID]
  );

  // Seed Texas clients
  await seedTexasClients(db);

  // Seed Florida clients
  await seedFloridaClients(db);

  // Seed Texas caregivers
  await seedTexasCaregivers(db);

  // Seed Florida caregivers
  await seedFloridaCaregivers(db);

  console.log('✅ State-specific seed data complete!');
}

async function seedTexasClients(db: Database) {
  console.log('  → Creating Texas clients...');

  // Client 1: STAR+PLUS waiver, active services
  const txClient1Id = uuidv4();
  const txClient1StateData = {
    state: 'TX',
    texas: {
      medicaidMemberId: 'TX-MED-' + Math.random().toString(36).substring(2, 11).toUpperCase(),
      medicaidProgram: 'STAR_PLUS',
      hhscClientId: 'HHSC-' + Math.random().toString(36).substring(2, 11).toUpperCase(),
      serviceDeliveryOption: 'AGENCY',
      planOfCareNumber: 'POC-TX-2024-001',
      authorizedServices: [
        {
          id: uuidv4(),
          serviceCode: 'S5125',
          serviceName: 'Personal Assistance Services',
          authorizedUnits: 160,
          usedUnits: 42,
          unitType: 'HOURS',
          authorizationNumber: 'AUTH-TX-' + Date.now(),
          effectiveDate: new Date('2024-01-01'),
          expirationDate: new Date('2025-06-30'),
          status: 'ACTIVE',
          requiresEVV: true,
        },
      ],
      evvEntityId: 'HHAX-TX-' + Math.random().toString(36).substring(2, 9),
      evvRequirements: {
        evvMandatory: true,
        approvedClockMethods: ['MOBILE', 'TELEPHONY'],
        geoPerimeterRadius: 100,
        aggregatorSubmissionRequired: true,
        tmhpIntegration: true,
      },
      emergencyPlanOnFile: true,
      emergencyPlanDate: new Date('2024-01-15'),
      form1746Consent: {
        consentDate: new Date('2024-01-10'),
        consentFormId: 'FORM-1746-001',
        signedBy: 'Maria Rodriguez',
        status: 'ACTIVE',
      },
      acuityLevel: 'MODERATE',
      starPlusWaiverServices: ['PERSONAL_CARE', 'RESPITE'],
    },
  };

  await db.query(
    `INSERT INTO clients (
      id, organization_id, branch_id, client_number, first_name, middle_name, last_name,
      date_of_birth, gender, primary_phone, primary_address, emergency_contacts,
      service_eligibility, programs, risk_flags, status, state_specific,
      created_at, created_by, updated_at, updated_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), $18, NOW(), $18)
    ON CONFLICT (id) DO NOTHING`,
    [
      txClient1Id,
      ORG_ID,
      BRANCH_TX_ID,
      'TX-CLI-001',
      'Maria',
      'Elena',
      'Rodriguez',
      new Date('1955-03-15'),
      'FEMALE',
      JSON.stringify({ number: '+1-713-555-0101', type: 'HOME', canReceiveSMS: false }),
      JSON.stringify({
        type: 'HOME',
        line1: '1234 Westheimer Rd',
        city: 'Houston',
        state: 'TX',
        postalCode: '77027',
        county: 'Harris',
        country: 'US',
      }),
      JSON.stringify([
        {
          id: uuidv4(),
          name: 'Carlos Rodriguez',
          relationship: 'Son',
          phone: { number: '+1-713-555-0102', type: 'MOBILE', canReceiveSMS: true },
          isPrimary: true,
          canMakeHealthcareDecisions: true,
        },
      ]),
      JSON.stringify({
        medicaidEligible: true,
        medicaidNumber: txClient1StateData.texas.medicaidMemberId,
        medicareEligible: false,
        veteransBenefits: false,
        longTermCareInsurance: false,
        privatePayOnly: false,
      }),
      JSON.stringify([
        {
          id: uuidv4(),
          programId: uuidv4(),
          programName: 'STAR+PLUS',
          enrollmentDate: new Date('2024-01-01'),
          status: 'ACTIVE',
          authorizedHoursPerWeek: 40,
        },
      ]),
      JSON.stringify([
        {
          id: uuidv4(),
          type: 'FALL_RISK',
          severity: 'MEDIUM',
          description: 'History of falls, uses walker',
          identifiedDate: new Date('2024-01-15'),
          requiresAcknowledgment: true,
        },
      ]),
      'ACTIVE',
      JSON.stringify(txClient1StateData),
      SYSTEM_USER_ID,
    ]
  );

  // Client 2: Consumer Directed Services (CDS)
  const txClient2Id = uuidv4();
  const txClient2StateData = {
    state: 'TX',
    texas: {
      medicaidMemberId: 'TX-MED-' + Math.random().toString(36).substring(2, 11).toUpperCase(),
      medicaidProgram: 'CFC',
      serviceDeliveryOption: 'CDS',
      planOfCareNumber: 'POC-TX-2024-002',
      authorizedServices: [
        {
          id: uuidv4(),
          serviceCode: 'T1019',
          serviceName: 'Personal Care Services (CDS)',
          authorizedUnits: 120,
          usedUnits: 28,
          unitType: 'HOURS',
          authorizationNumber: 'AUTH-CDS-' + Date.now(),
          effectiveDate: new Date('2024-02-01'),
          expirationDate: new Date('2025-07-31'),
          status: 'ACTIVE',
          requiresEVV: true,
        },
      ],
      evvEntityId: 'HHAX-CDS-' + Math.random().toString(36).substring(2, 9),
      evvRequirements: {
        evvMandatory: true,
        approvedClockMethods: ['MOBILE', 'TELEPHONY'],
        geoPerimeterRadius: 150,
        aggregatorSubmissionRequired: true,
        tmhpIntegration: true,
      },
      emergencyPlanOnFile: true,
      emergencyPlanDate: new Date('2024-02-05'),
      acuityLevel: 'LOW',
    },
  };

  await db.query(
    `INSERT INTO clients (
      id, organization_id, branch_id, client_number, first_name, last_name,
      date_of_birth, gender, primary_phone, primary_address, emergency_contacts,
      service_eligibility, programs, risk_flags, status, state_specific,
      created_at, created_by, updated_at, updated_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), $17, NOW(), $17)
    ON CONFLICT (id) DO NOTHING`,
    [
      txClient2Id,
      ORG_ID,
      BRANCH_TX_ID,
      'TX-CLI-002',
      'James',
      'Thompson',
      new Date('1948-08-22'),
      'MALE',
      JSON.stringify({ number: '+1-713-555-0201', type: 'HOME', canReceiveSMS: false }),
      JSON.stringify({
        type: 'HOME',
        line1: '5678 Memorial Dr',
        city: 'Houston',
        state: 'TX',
        postalCode: '77007',
        county: 'Harris',
        country: 'US',
      }),
      JSON.stringify([
        {
          id: uuidv4(),
          name: 'Sarah Thompson',
          relationship: 'Daughter',
          phone: { number: '+1-713-555-0202', type: 'MOBILE', canReceiveSMS: true },
          isPrimary: true,
          canMakeHealthcareDecisions: true,
        },
      ]),
      JSON.stringify({
        medicaidEligible: true,
        medicaidNumber: txClient2StateData.texas.medicaidMemberId,
        medicareEligible: true,
        medicareNumber: 'MED-' + Math.random().toString(36).substring(2, 11).toUpperCase(),
        veteransBenefits: true,
        longTermCareInsurance: false,
        privatePayOnly: false,
      }),
      JSON.stringify([
        {
          id: uuidv4(),
          programId: uuidv4(),
          programName: 'Community First Choice',
          enrollmentDate: new Date('2024-02-01'),
          status: 'ACTIVE',
          authorizedHoursPerWeek: 30,
        },
      ]),
      JSON.stringify([]),
      'ACTIVE',
      JSON.stringify(txClient2StateData),
      SYSTEM_USER_ID,
    ]
  );

  console.log(`    ✓ Created ${2} Texas clients`);
}

async function seedFloridaClients(db: Database) {
  console.log('  → Creating Florida clients...');

  // Client 1: SMMC LTC with RN supervision
  const flClient1Id = uuidv4();
  const flClient1StateData = {
    state: 'FL',
    florida: {
      medicaidRecipientId: 'FL-MED-' + Math.random().toString(36).substring(2, 11).toUpperCase(),
      managedCarePlan: 'SMMC_LTC',
      doeaRiskClassification: 'HIGH',
      planOfCareId: 'POC-FL-2024-001',
      planOfCareReviewDate: new Date('2024-01-10'),
      nextReviewDue: new Date('2024-07-10'),
      authorizedServices: [
        {
          id: uuidv4(),
          serviceCode: 'S0215',
          serviceName: 'Skilled Nursing Services',
          authorizedUnits: 80,
          usedUnits: 18,
          unitType: 'HOURS',
          authorizationNumber: 'AUTH-FL-' + Date.now(),
          effectiveDate: new Date('2024-01-01'),
          expirationDate: new Date('2025-06-30'),
          visitFrequency: '2x weekly',
          status: 'ACTIVE',
          requiresEVV: true,
          requiresRNSupervision: true,
        },
      ],
      evvAggregatorId: 'HHAX-FL-' + Math.random().toString(36).substring(2, 9),
      evvSystemType: 'HHAX',
      smmcProgramEnrollment: true,
      ltcProgramEnrollment: true,
      rnSupervisorId: uuidv4().toString(),
      lastSupervisoryVisit: new Date('2024-09-15'),
      nextSupervisoryVisitDue: new Date('2024-12-15'),
      supervisoryVisitFrequency: 90,
      hurricaneZone: 'Zone A - Miami-Dade',
      ahcaLicenseVerification: new Date('2024-01-05'),
      backgroundScreeningStatus: 'COMPLIANT',
    },
  };

  await db.query(
    `INSERT INTO clients (
      id, organization_id, branch_id, client_number, first_name, middle_name, last_name,
      date_of_birth, gender, primary_phone, primary_address, emergency_contacts,
      service_eligibility, programs, risk_flags, status, state_specific,
      created_at, created_by, updated_at, updated_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), $18, NOW(), $18)
    ON CONFLICT (id) DO NOTHING`,
    [
      flClient1Id,
      ORG_ID,
      BRANCH_FL_ID,
      'FL-CLI-001',
      'Rosa',
      'Maria',
      'Garcia',
      new Date('1950-11-08'),
      'FEMALE',
      JSON.stringify({ number: '+1-305-555-0301', type: 'HOME', canReceiveSMS: false }),
      JSON.stringify({
        type: 'HOME',
        line1: '789 Brickell Ave',
        city: 'Miami',
        state: 'FL',
        postalCode: '33131',
        county: 'Miami-Dade',
        country: 'US',
      }),
      JSON.stringify([
        {
          id: uuidv4(),
          name: 'Miguel Garcia',
          relationship: 'Son',
          phone: { number: '+1-305-555-0302', type: 'MOBILE', canReceiveSMS: true },
          isPrimary: true,
          canMakeHealthcareDecisions: true,
        },
      ]),
      JSON.stringify({
        medicaidEligible: true,
        medicaidNumber: flClient1StateData.florida.medicaidRecipientId,
        medicareEligible: true,
        medicareNumber: 'MED-' + Math.random().toString(36).substring(2, 11).toUpperCase(),
        veteransBenefits: false,
        longTermCareInsurance: false,
        privatePayOnly: false,
      }),
      JSON.stringify([
        {
          id: uuidv4(),
          programId: uuidv4(),
          programName: 'SMMC Long-Term Care',
          enrollmentDate: new Date('2024-01-01'),
          status: 'ACTIVE',
          authorizedHoursPerWeek: 20,
        },
      ]),
      JSON.stringify([
        {
          id: uuidv4(),
          type: 'MEDICATION_COMPLIANCE',
          severity: 'HIGH',
          description: 'Multiple medications, requires monitoring',
          identifiedDate: new Date('2024-01-10'),
          requiresAcknowledgment: true,
        },
      ]),
      'ACTIVE',
      JSON.stringify(flClient1StateData),
      SYSTEM_USER_ID,
    ]
  );

  // Client 2: APD Waiver
  const flClient2Id = uuidv4();
  const flClient2StateData = {
    state: 'FL',
    florida: {
      medicaidRecipientId: 'FL-MED-' + Math.random().toString(36).substring(2, 11).toUpperCase(),
      managedCarePlan: 'SMMC_MMA',
      apdWaiverEnrollment: {
        waiverType: 'Developmental Disabilities',
        enrollmentDate: new Date('2023-06-01'),
        supportPlanDate: new Date('2024-01-01'),
        supportCoordinator: 'Jane Smith, LCSW',
      },
      doeaRiskClassification: 'MODERATE',
      planOfCareId: 'POC-FL-2024-002',
      planOfCareReviewDate: new Date('2024-02-01'),
      nextReviewDue: new Date('2024-08-01'),
      authorizedServices: [
        {
          id: uuidv4(),
          serviceCode: 'T2020',
          serviceName: 'Personal Care - APD',
          authorizedUnits: 100,
          usedUnits: 23,
          unitType: 'HOURS',
          authorizationNumber: 'AUTH-APD-' + Date.now(),
          effectiveDate: new Date('2024-02-01'),
          expirationDate: new Date('2025-07-31'),
          visitFrequency: 'Daily',
          status: 'ACTIVE',
          requiresEVV: true,
          requiresRNSupervision: false,
        },
      ],
      evvAggregatorId: 'HHAX-APD-' + Math.random().toString(36).substring(2, 9),
      evvSystemType: 'HHAX',
      smmcProgramEnrollment: true,
      ltcProgramEnrollment: false,
      hurricaneZone: 'Zone B - Broward',
      ahcaLicenseVerification: new Date('2024-02-01'),
      backgroundScreeningStatus: 'COMPLIANT',
    },
  };

  await db.query(
    `INSERT INTO clients (
      id, organization_id, branch_id, client_number, first_name, last_name,
      date_of_birth, gender, primary_phone, primary_address, emergency_contacts,
      service_eligibility, programs, risk_flags, status, state_specific,
      created_at, created_by, updated_at, updated_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), $17, NOW(), $17)
    ON CONFLICT (id) DO NOTHING`,
    [
      flClient2Id,
      ORG_ID,
      BRANCH_FL_ID,
      'FL-CLI-002',
      'David',
      'Martinez',
      new Date('1990-04-12'),
      'MALE',
      JSON.stringify({ number: '+1-954-555-0401', type: 'MOBILE', canReceiveSMS: true }),
      JSON.stringify({
        type: 'HOME',
        line1: '456 Ocean Blvd',
        city: 'Fort Lauderdale',
        state: 'FL',
        postalCode: '33301',
        county: 'Broward',
        country: 'US',
      }),
      JSON.stringify([
        {
          id: uuidv4(),
          name: 'Ana Martinez',
          relationship: 'Mother',
          phone: { number: '+1-954-555-0402', type: 'MOBILE', canReceiveSMS: true },
          isPrimary: true,
          canMakeHealthcareDecisions: true,
        },
      ]),
      JSON.stringify({
        medicaidEligible: true,
        medicaidNumber: flClient2StateData.florida.medicaidRecipientId,
        medicareEligible: false,
        veteransBenefits: false,
        longTermCareInsurance: false,
        privatePayOnly: false,
      }),
      JSON.stringify([
        {
          id: uuidv4(),
          programId: uuidv4(),
          programName: 'APD Developmental Disabilities Waiver',
          enrollmentDate: new Date('2023-06-01'),
          status: 'ACTIVE',
          authorizedHoursPerWeek: 25,
        },
      ]),
      JSON.stringify([]),
      'ACTIVE',
      JSON.stringify(flClient2StateData),
      SYSTEM_USER_ID,
    ]
  );

  console.log(`    ✓ Created ${2} Florida clients`);
}

async function seedTexasCaregivers(db: Database) {
  console.log('  → Creating Texas caregivers...');

  // Caregiver 1: CNA with all checks complete
  const txCaregiver1Id = uuidv4();
  const txCaregiver1StateData = {
    state: 'TX',
    texas: {
      employeeMisconductRegistryCheck: {
        checkDate: new Date('2024-01-05'),
        expirationDate: new Date('2025-01-05'),
        status: 'CLEAR',
        registryType: 'EMPLOYEE_MISCONDUCT',
        confirmationNumber: 'EMR-' + Math.random().toString(36).substring(2, 11).toUpperCase(),
        performedBy: SYSTEM_USER_ID,
      },
      nurseAideRegistryCheck: {
        checkDate: new Date('2024-01-05'),
        expirationDate: new Date('2025-01-05'),
        status: 'CLEAR',
        registryType: 'NURSE_AIDE',
        confirmationNumber: 'NAR-' + Math.random().toString(36).substring(2, 11).toUpperCase(),
        performedBy: SYSTEM_USER_ID,
      },
      tbScreeningRequired: true,
      tbScreening: {
        screeningDate: new Date('2024-01-03'),
        screeningType: 'CHEST_XRAY',
        result: 'NEGATIVE',
        expirationDate: new Date('2025-01-03'),
        followUpRequired: false,
      },
      hhscOrientationComplete: true,
      hhscOrientationDate: new Date('2024-01-08'),
      hhscOrientationTopics: [
        'Client Rights',
        'Abuse/Neglect Reporting',
        'Infection Control',
        'Emergency Procedures',
      ],
      mandatoryTraining: {
        abuseNeglectReporting: true,
        abuseNeglectReportingDate: new Date('2024-01-08'),
        clientRights: true,
        clientRightsDate: new Date('2024-01-08'),
        infectionControl: true,
        infectionControlDate: new Date('2024-01-08'),
        emergencyProcedures: true,
        emergencyProceduresDate: new Date('2024-01-08'),
        mandatedReporterTraining: true,
        mandatedReporterDate: new Date('2024-01-08'),
      },
      evvAttendantId: 'HHAX-ATT-' + Math.random().toString(36).substring(2, 9),
      evvSystemEnrolled: true,
      evvEnrollmentDate: new Date('2024-01-10'),
      eVerifyCompleted: true,
      eVerifyDate: new Date('2024-01-02'),
      i9FormOnFile: true,
      i9ExpirationDate: new Date('2027-01-02'),
      qualifiedForCDS: false,
      qualifiedForPAS: true,
      qualifiedForHAB: false,
      registryCheckStatus: 'CLEAR',
      lastComplianceReview: new Date('2024-01-15'),
      nextComplianceReview: new Date('2025-01-15'),
    },
  };

  await db.query(
    `INSERT INTO caregivers (
      id, organization_id, branch_ids, primary_branch_id, employee_number,
      first_name, last_name, date_of_birth, gender, primary_phone, email,
      primary_address, emergency_contacts, employment_type, employment_status,
      hire_date, role, credentials, training, skills, availability, pay_rate,
      compliance_status, status, state_specific,
      created_at, created_by, updated_at, updated_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, NOW(), $26, NOW(), $26)
    ON CONFLICT (id) DO NOTHING`,
    [
      txCaregiver1Id,
      ORG_ID,
      `{${BRANCH_TX_ID}}`,
      BRANCH_TX_ID,
      'TX-CG-001',
      'Jennifer',
      'Williams',
      new Date('1985-06-15'),
      'FEMALE',
      JSON.stringify({ number: '+1-713-555-0501', type: 'MOBILE', canReceiveSMS: true, isPrimary: true }),
      'jennifer.williams@example.com',
      JSON.stringify({
        type: 'HOME',
        line1: '123 Main St',
        city: 'Houston',
        state: 'TX',
        postalCode: '77002',
        country: 'US',
      }),
      JSON.stringify([
        {
          id: uuidv4(),
          name: 'Robert Williams',
          relationship: 'Spouse',
          phone: { number: '+1-713-555-0502', type: 'MOBILE', canReceiveSMS: true },
          isPrimary: true,
        },
      ]),
      'FULL_TIME',
      'ACTIVE',
      new Date('2024-01-01'),
      'CERTIFIED_NURSING_ASSISTANT',
      JSON.stringify([
        {
          id: uuidv4(),
          type: 'CNA',
          name: 'Certified Nursing Assistant',
          number: 'TX-CNA-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
          issuingAuthority: 'Texas HHSC',
          issueDate: new Date('2020-03-15'),
          expirationDate: new Date('2026-03-15'),
          status: 'ACTIVE',
        },
        {
          id: uuidv4(),
          type: 'CPR',
          name: 'CPR Certification',
          issueDate: new Date('2023-11-01'),
          expirationDate: new Date('2025-11-01'),
          status: 'ACTIVE',
        },
      ]),
      JSON.stringify([
        {
          id: uuidv4(),
          name: 'HHSC Orientation',
          category: 'ORIENTATION',
          completionDate: new Date('2024-01-08'),
          status: 'COMPLETED',
        },
      ]),
      JSON.stringify([
        { id: uuidv4(), name: 'Personal Care', category: 'ADL', proficiencyLevel: 'EXPERT' },
        { id: uuidv4(), name: 'Medication Reminders', category: 'Clinical', proficiencyLevel: 'ADVANCED' },
      ]),
      JSON.stringify({
        schedule: {
          monday: { available: true, timeSlots: [{ startTime: '08:00', endTime: '17:00' }] },
          tuesday: { available: true, timeSlots: [{ startTime: '08:00', endTime: '17:00' }] },
          wednesday: { available: true, timeSlots: [{ startTime: '08:00', endTime: '17:00' }] },
          thursday: { available: true, timeSlots: [{ startTime: '08:00', endTime: '17:00' }] },
          friday: { available: true, timeSlots: [{ startTime: '08:00', endTime: '17:00' }] },
          saturday: { available: false },
          sunday: { available: false },
        },
        lastUpdated: new Date(),
      }),
      JSON.stringify({
        id: uuidv4(),
        rateType: 'BASE',
        amount: 18.50,
        unit: 'HOURLY',
        effectiveDate: new Date('2024-01-01'),
      }),
      'COMPLIANT',
      'ACTIVE',
      JSON.stringify(txCaregiver1StateData),
      SYSTEM_USER_ID,
    ]
  );

  console.log(`    ✓ Created ${1} Texas caregiver`);
}

async function seedFloridaCaregivers(db: Database) {
  console.log('  → Creating Florida caregivers...');

  // Caregiver 1: RN with Level 2 screening
  const flCaregiver1Id = uuidv4();
  const flCaregiver1StateData = {
    state: 'FL',
    florida: {
      level2BackgroundScreening: {
        screeningDate: new Date('2024-01-03'),
        screeningType: 'INITIAL',
        clearanceDate: new Date('2024-01-10'),
        expirationDate: new Date('2029-01-10'),
        status: 'CLEARED',
        clearinghouseId: 'AHCA-' + Math.random().toString(36).substring(2, 11).toUpperCase(),
        ahcaClearanceNumber: 'CLR-' + Math.random().toString(36).substring(2, 11).toUpperCase(),
      },
      ahcaClearinghouseId: 'AHCA-' + Math.random().toString(36).substring(2, 11).toUpperCase(),
      screeningStatus: 'CLEARED',
      flLicenseNumber: 'RN-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      flLicenseType: 'RN',
      flLicenseStatus: 'ACTIVE',
      flLicenseExpiration: new Date('2026-08-31'),
      mqaVerificationDate: new Date('2024-01-05'),
      requiresRNSupervision: false,
      hivAidsTrainingComplete: true,
      hivAidsTrainingDate: new Date('2024-01-08'),
      oshaBloodbornePathogenTraining: new Date('2024-01-08'),
      tbScreening: {
        screeningDate: new Date('2024-01-03'),
        screeningType: 'BLOOD_TEST',
        result: 'NEGATIVE',
        expirationDate: new Date('2025-01-03'),
        followUpRequired: false,
      },
      scopeOfPractice: [
        'Assessment',
        'Medication Administration',
        'Wound Care',
        'IV Therapy',
        'Patient Education',
      ],
      medicaidProviderId: 'FL-MED-PROV-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      ahcaProviderId: 'FL-AHCA-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      evvSystemIds: [
        {
          systemName: 'HHAX',
          providerId: 'HHAX-RN-' + Math.random().toString(36).substring(2, 9),
          enrollmentDate: new Date('2024-01-10'),
          status: 'ACTIVE',
        },
      ],
      hurricaneRedeploymentZone: 'Zone A - Miami-Dade',
      ahcaComplianceStatus: 'COMPLIANT',
      lastAHCAVerification: new Date('2024-01-15'),
      nextRescreenDue: new Date('2029-01-10'),
    },
  };

  await db.query(
    `INSERT INTO caregivers (
      id, organization_id, branch_ids, primary_branch_id, employee_number,
      first_name, last_name, date_of_birth, gender, primary_phone, email,
      primary_address, emergency_contacts, employment_type, employment_status,
      hire_date, role, credentials, training, skills, availability, pay_rate,
      compliance_status, status, state_specific,
      created_at, created_by, updated_at, updated_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, NOW(), $26, NOW(), $26)
    ON CONFLICT (id) DO NOTHING`,
    [
      flCaregiver1Id,
      ORG_ID,
      `{${BRANCH_FL_ID}}`,
      BRANCH_FL_ID,
      'FL-CG-001',
      'Patricia',
      'Johnson',
      new Date('1980-09-22'),
      'FEMALE',
      JSON.stringify({ number: '+1-305-555-0601', type: 'MOBILE', canReceiveSMS: true, isPrimary: true }),
      'patricia.johnson@example.com',
      JSON.stringify({
        type: 'HOME',
        line1: '456 Collins Ave',
        city: 'Miami Beach',
        state: 'FL',
        postalCode: '33139',
        country: 'US',
      }),
      JSON.stringify([
        {
          id: uuidv4(),
          name: 'Michael Johnson',
          relationship: 'Spouse',
          phone: { number: '+1-305-555-0602', type: 'MOBILE', canReceiveSMS: true },
          isPrimary: true,
        },
      ]),
      'FULL_TIME',
      'ACTIVE',
      new Date('2024-01-01'),
      'NURSE_RN',
      JSON.stringify([
        {
          id: uuidv4(),
          type: 'RN',
          name: 'Registered Nurse',
          number: flCaregiver1StateData.florida.flLicenseNumber,
          issuingAuthority: 'Florida Board of Nursing',
          issueDate: new Date('2018-08-15'),
          expirationDate: new Date('2026-08-31'),
          status: 'ACTIVE',
        },
        {
          id: uuidv4(),
          type: 'CPR',
          name: 'BLS for Healthcare Providers',
          issueDate: new Date('2023-10-01'),
          expirationDate: new Date('2025-10-01'),
          status: 'ACTIVE',
        },
      ]),
      JSON.stringify([
        {
          id: uuidv4(),
          name: 'HIV/AIDS Training',
          category: 'MANDATORY_COMPLIANCE',
          completionDate: new Date('2024-01-08'),
          status: 'COMPLETED',
        },
        {
          id: uuidv4(),
          name: 'OSHA Bloodborne Pathogens',
          category: 'SAFETY',
          completionDate: new Date('2024-01-08'),
          status: 'COMPLETED',
        },
      ]),
      JSON.stringify([
        { id: uuidv4(), name: 'Patient Assessment', category: 'Clinical', proficiencyLevel: 'EXPERT' },
        { id: uuidv4(), name: 'Wound Care', category: 'Clinical', proficiencyLevel: 'EXPERT' },
        { id: uuidv4(), name: 'IV Therapy', category: 'Clinical', proficiencyLevel: 'ADVANCED' },
      ]),
      JSON.stringify({
        schedule: {
          monday: { available: true, timeSlots: [{ startTime: '07:00', endTime: '19:00' }] },
          tuesday: { available: true, timeSlots: [{ startTime: '07:00', endTime: '19:00' }] },
          wednesday: { available: true, timeSlots: [{ startTime: '07:00', endTime: '19:00' }] },
          thursday: { available: true, timeSlots: [{ startTime: '07:00', endTime: '19:00' }] },
          friday: { available: false },
          saturday: { available: false },
          sunday: { available: false },
        },
        lastUpdated: new Date(),
      }),
      JSON.stringify({
        id: uuidv4(),
        rateType: 'BASE',
        amount: 42.00,
        unit: 'HOURLY',
        effectiveDate: new Date('2024-01-01'),
      }),
      'COMPLIANT',
      'ACTIVE',
      JSON.stringify(flCaregiver1StateData),
      SYSTEM_USER_ID,
    ]
  );

  console.log(`    ✓ Created ${1} Florida caregiver`);
}

// CLI execution
if (require.main === module) {
  const { database } = require('../src/db/connection');
  
  seedStateSpecificData(database)
    .then(() => {
      console.log('✅ Seed complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    });
}
