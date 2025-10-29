/**
 * Care Plans & Tasks seed data
 *
 * Creates realistic care plans, task templates, task instances, and progress notes
 * for demonstration and testing purposes
 */
import { v4 as uuidv4 } from 'uuid';
import { initializeDatabase } from '../src/db/connection';
async function seedCarePlans() {
    console.log('🌱 Seeding care plans data...\n');
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
            // Get existing data
            const orgResult = await client.query(`SELECT id FROM organizations LIMIT 1`);
            if (orgResult.rows.length === 0) {
                throw new Error('No organization found. Please run seed.ts first.');
            }
            const orgId = orgResult.rows[0].id;
            const branchResult = await client.query(`SELECT id FROM branches WHERE organization_id = $1 LIMIT 1`, [orgId]);
            if (branchResult.rows.length === 0) {
                throw new Error('No branch found. Please run seed.ts first.');
            }
            const branchId = branchResult.rows[0].id;
            const userResult = await client.query(`SELECT id FROM users WHERE organization_id = $1 LIMIT 1`, [orgId]);
            if (userResult.rows.length === 0) {
                throw new Error('No user found. Please run seed.ts first.');
            }
            const systemUserId = userResult.rows[0].id;
            // Get client IDs
            const clientsResult = await client.query(`
        SELECT id, client_number FROM clients 
        WHERE organization_id = $1 AND status = 'ACTIVE' 
        ORDER BY created_at 
        LIMIT 2
      `, [orgId]);
            if (clientsResult.rows.length < 2) {
                throw new Error('Need at least 2 active clients. Please run seed.ts first.');
            }
            const client1Id = clientsResult.rows[0].id; // Margaret Thompson
            const client2Id = clientsResult.rows[1].id; // Robert Martinez
            // Get caregiver IDs
            const caregiversResult = await client.query(`
        SELECT id, employee_number FROM caregivers 
        WHERE organization_id = $1 AND status = 'ACTIVE'
        ORDER BY created_at 
        LIMIT 2
      `, [orgId]);
            if (caregiversResult.rows.length < 2) {
                throw new Error('Need at least 2 active caregivers. Please run seed.ts first.');
            }
            const cg1Id = caregiversResult.rows[0].id; // Sarah Johnson
            const cg2Id = caregiversResult.rows[1].id; // Michael Chen
            console.log('Creating care plans...');
            // Care Plan 1: Personal Care for Margaret Thompson (Fall Risk Client)
            const plan1Id = uuidv4();
            const plan1Goals = [
                {
                    id: uuidv4(),
                    name: 'Improve Mobility and Reduce Fall Risk',
                    description: 'Client will demonstrate safe ambulation with walker for distances up to 50 feet without assistance within 3 months',
                    category: 'MOBILITY',
                    status: 'IN_PROGRESS',
                    priority: 'HIGH',
                    targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
                    measurementType: 'QUANTITATIVE',
                    targetValue: 50,
                    currentValue: 20,
                    unit: 'feet',
                    progressPercentage: 40,
                    notes: 'Client making steady progress. Started at 10 feet, now at 20 feet.',
                },
                {
                    id: uuidv4(),
                    name: 'Medication Compliance',
                    description: 'Client will take all prescribed medications as scheduled without reminders 90% of the time',
                    category: 'MEDICATION_MANAGEMENT',
                    status: 'ON_TRACK',
                    priority: 'MEDIUM',
                    targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                    measurementType: 'QUANTITATIVE',
                    targetValue: 90,
                    currentValue: 75,
                    unit: 'percent',
                    progressPercentage: 75,
                },
                {
                    id: uuidv4(),
                    name: 'Maintain Independence in ADLs',
                    description: 'Client will maintain current level of independence in bathing, dressing, and grooming',
                    category: 'ADL',
                    status: 'ACHIEVED',
                    priority: 'MEDIUM',
                    measurementType: 'QUALITATIVE',
                    progressPercentage: 100,
                    achievedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    outcome: 'Client consistently completes all ADLs with minimal assistance',
                },
            ];
            const plan1Interventions = [
                {
                    id: uuidv4(),
                    name: 'Ambulation Training with Walker',
                    description: 'Assist client with walker ambulation, gradually increasing distance',
                    category: 'AMBULATION_ASSISTANCE',
                    goalIds: [plan1Goals[0].id],
                    frequency: {
                        pattern: 'DAILY',
                        timesPerDay: 2,
                    },
                    duration: 15,
                    instructions: 'Ensure walker is properly positioned. Walk alongside client for safety. Gradually increase distance by 5 feet per week.',
                    precautions: ['Watch for fatigue', 'Monitor for dizziness', 'Keep path clear of obstacles'],
                    performedBy: ['CAREGIVER', 'HHA'],
                    requiresDocumentation: true,
                    status: 'ACTIVE',
                    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                },
                {
                    id: uuidv4(),
                    name: 'Medication Reminders',
                    description: 'Provide verbal reminders for medication times and observe intake',
                    category: 'MEDICATION_REMINDER',
                    goalIds: [plan1Goals[1].id],
                    frequency: {
                        pattern: 'DAILY',
                        timesPerDay: 3,
                        specificTimes: ['09:00', '14:00', '20:00'],
                    },
                    duration: 5,
                    instructions: 'Use medication reminder app. Verbally remind client 5 minutes before scheduled time. Observe client taking medication.',
                    performedBy: ['CAREGIVER', 'CNA', 'HHA'],
                    requiresDocumentation: true,
                    status: 'ACTIVE',
                    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                },
                {
                    id: uuidv4(),
                    name: 'Personal Care Assistance',
                    description: 'Assist with bathing, dressing, and grooming as needed',
                    category: 'ASSISTANCE_WITH_ADL',
                    goalIds: [plan1Goals[2].id],
                    frequency: {
                        pattern: 'DAILY',
                        timesPerDay: 1,
                    },
                    duration: 30,
                    instructions: 'Allow client to do as much as possible independently. Provide hands-on assistance only when requested or needed for safety.',
                    performedBy: ['CAREGIVER', 'HHA'],
                    requiresDocumentation: true,
                    status: 'ACTIVE',
                    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                },
            ];
            const plan1TaskTemplates = [
                {
                    id: uuidv4(),
                    name: 'Morning Walker Ambulation',
                    description: 'Assist client with morning walker practice',
                    category: 'MOBILITY',
                    interventionIds: [plan1Interventions[0].id],
                    frequency: {
                        pattern: 'DAILY',
                    },
                    estimatedDuration: 15,
                    timeOfDay: ['MORNING'],
                    instructions: 'Help client stand safely, ensure walker is positioned correctly, walk with client for prescribed distance, document distance achieved.',
                    steps: [
                        {
                            stepNumber: 1,
                            description: 'Verify walker is in good condition and properly adjusted',
                            isRequired: true,
                            estimatedDuration: 2,
                            safetyNotes: 'Check all four legs have rubber tips',
                        },
                        {
                            stepNumber: 2,
                            description: 'Assist client to standing position',
                            isRequired: true,
                            estimatedDuration: 3,
                            safetyNotes: 'Use gait belt if available, watch for dizziness',
                        },
                        {
                            stepNumber: 3,
                            description: 'Walk with client for prescribed distance',
                            isRequired: true,
                            estimatedDuration: 8,
                            safetyNotes: 'Walk alongside, ready to assist if needed',
                        },
                        {
                            stepNumber: 4,
                            description: 'Document distance achieved and client response',
                            isRequired: true,
                            estimatedDuration: 2,
                        },
                    ],
                    requiresSignature: false,
                    requiresNote: true,
                    requiresPhoto: false,
                    isOptional: false,
                    allowSkip: false,
                    verificationType: 'CUSTOM',
                    qualityChecks: [
                        {
                            id: uuidv4(),
                            question: 'Did client complete ambulation without signs of distress?',
                            checkType: 'YES_NO',
                            required: true,
                            options: [],
                        },
                        {
                            id: uuidv4(),
                            question: 'Distance achieved (in feet)',
                            checkType: 'TEXT',
                            required: true,
                            options: [],
                        },
                    ],
                    status: 'ACTIVE',
                },
                {
                    id: uuidv4(),
                    name: 'Morning Medication Reminder',
                    description: 'Provide medication reminder and observe intake',
                    category: 'MEDICATION',
                    interventionIds: [plan1Interventions[1].id],
                    frequency: {
                        pattern: 'DAILY',
                        specificTimes: ['09:00'],
                    },
                    estimatedDuration: 5,
                    timeOfDay: ['MORNING'],
                    instructions: 'Remind client of 9 AM medications, observe client take medications with water, document compliance.',
                    requiresSignature: false,
                    requiresNote: true,
                    isOptional: false,
                    allowSkip: false,
                    skipReasons: ['Client refused', 'Client already took medication', 'Medication not available'],
                    verificationType: 'CHECKBOX',
                    status: 'ACTIVE',
                },
                {
                    id: uuidv4(),
                    name: 'Personal Care - Morning',
                    description: 'Assist with morning personal care routine',
                    category: 'PERSONAL_HYGIENE',
                    interventionIds: [plan1Interventions[2].id],
                    frequency: {
                        pattern: 'DAILY',
                    },
                    estimatedDuration: 30,
                    timeOfDay: ['MORNING'],
                    instructions: 'Assist with bathing, dressing, and grooming. Encourage independence. Ensure safety throughout.',
                    requiresSignature: false,
                    requiresNote: true,
                    isOptional: false,
                    allowSkip: false,
                    verificationType: 'CHECKBOX',
                    qualityChecks: [
                        {
                            id: uuidv4(),
                            question: 'Client appearance neat and appropriate for weather?',
                            checkType: 'YES_NO',
                            required: true,
                        },
                        {
                            id: uuidv4(),
                            question: 'Any skin concerns observed?',
                            checkType: 'YES_NO',
                            required: true,
                        },
                    ],
                    status: 'ACTIVE',
                },
                {
                    id: uuidv4(),
                    name: 'Light Housekeeping',
                    description: 'Light housekeeping in client living areas',
                    category: 'HOUSEKEEPING',
                    frequency: {
                        pattern: 'DAILY',
                    },
                    estimatedDuration: 20,
                    timeOfDay: ['MORNING', 'AFTERNOON'],
                    instructions: 'Vacuum living areas, wipe down kitchen surfaces, take out trash. Keep pathways clear for safety.',
                    requiresSignature: false,
                    requiresNote: false,
                    isOptional: true,
                    allowSkip: true,
                    skipReasons: ['Time constraints', 'Client declined', 'Already done by family'],
                    status: 'ACTIVE',
                },
            ];
            await client.query(`
        INSERT INTO care_plans (
          id, plan_number, name, client_id, organization_id, branch_id,
          plan_type, status, priority, effective_date, expiration_date, review_date,
          primary_caregiver_id, coordinator_id,
          goals, interventions, task_templates,
          service_frequency, estimated_hours_per_week,
          compliance_status, notes,
          created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      `, [
                plan1Id,
                'CP-2024-001',
                'Personal Care Plan - Fall Risk Management',
                client1Id,
                orgId,
                branchId,
                'PERSONAL_CARE',
                'ACTIVE',
                'HIGH',
                new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Started 30 days ago
                new Date(Date.now() + 150 * 24 * 60 * 60 * 1000), // Expires in 150 days
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Review in 30 days
                cg1Id,
                systemUserId,
                JSON.stringify(plan1Goals),
                JSON.stringify(plan1Interventions),
                JSON.stringify(plan1TaskTemplates),
                JSON.stringify({
                    pattern: 'DAILY',
                    timesPerWeek: 7,
                    customSchedule: 'Morning visits 7 days per week, 9 AM - 11 AM',
                }),
                14.0, // 2 hours per day * 7 days
                'COMPLIANT',
                'Client has made excellent progress. Family very satisfied with care.',
                systemUserId,
                systemUserId,
            ]);
            console.log(`  ✓ Created care plan CP-2024-001 for client ${clientsResult.rows[0].client_number}`);
            // Care Plan 2: Complex Care for Robert Martinez (Veteran with PTSD)
            const plan2Id = uuidv4();
            const plan2Goals = [
                {
                    id: uuidv4(),
                    name: 'Increase Transfer Independence',
                    description: 'Client will complete wheelchair to bed transfers with minimal assistance within 6 weeks',
                    category: 'MOBILITY',
                    status: 'IN_PROGRESS',
                    priority: 'HIGH',
                    targetDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
                    measurementType: 'QUALITATIVE',
                    progressPercentage: 30,
                    notes: 'Starting physical therapy exercises to build upper body strength.',
                },
                {
                    id: uuidv4(),
                    name: 'Manage PTSD Symptoms',
                    description: 'Reduce frequency and intensity of PTSD episodes through structured environment and service dog support',
                    category: 'EMOTIONAL_WELLBEING',
                    status: 'ON_TRACK',
                    priority: 'HIGH',
                    measurementType: 'QUALITATIVE',
                    progressPercentage: 60,
                    notes: 'Service dog Max providing excellent support. Episodes have decreased from daily to 2-3 times per week.',
                },
                {
                    id: uuidv4(),
                    name: 'Pressure Wound Prevention',
                    description: 'Prevent pressure wounds through proper positioning and skin care',
                    category: 'WOUND_CARE',
                    status: 'ON_TRACK',
                    priority: 'URGENT',
                    measurementType: 'BINARY',
                    progressPercentage: 100,
                    notes: 'No pressure wounds observed. Continuing preventive protocols.',
                },
            ];
            const plan2Interventions = [
                {
                    id: uuidv4(),
                    name: 'Transfer Training',
                    description: 'Assist with wheelchair transfers and strengthen upper body',
                    category: 'TRANSFER_ASSISTANCE',
                    goalIds: [plan2Goals[0].id],
                    frequency: {
                        pattern: 'DAILY',
                        timesPerDay: 4,
                    },
                    duration: 10,
                    instructions: 'Use slide board for transfers. Encourage client to use upper body strength. Always use proper body mechanics.',
                    precautions: ['Ensure wheelchair is locked', 'Use gait belt', 'Watch for fatigue'],
                    performedBy: ['HHA', 'CNA'],
                    requiresSupervision: true,
                    requiresDocumentation: true,
                    status: 'ACTIVE',
                    startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                },
                {
                    id: uuidv4(),
                    name: 'PTSD Support Protocol',
                    description: 'Maintain calm environment, ensure service dog present, avoid triggers',
                    category: 'SAFETY_MONITORING',
                    goalIds: [plan2Goals[1].id],
                    frequency: {
                        pattern: 'DAILY',
                    },
                    instructions: 'Announce presence before entering room. Avoid sudden loud noises. Ensure Max (service dog) is present during all care. Allow client to maintain sense of control.',
                    precautions: ['No sudden movements', 'Speak calmly and clearly', 'Respect personal space'],
                    performedBy: ['CAREGIVER', 'HHA', 'CNA'],
                    requiresDocumentation: true,
                    status: 'ACTIVE',
                    startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
                },
                {
                    id: uuidv4(),
                    name: 'Pressure Relief and Skin Care',
                    description: 'Reposition every 2 hours, inspect skin, apply barrier cream',
                    category: 'SKIN_CARE',
                    goalIds: [plan2Goals[2].id],
                    frequency: {
                        pattern: 'DAILY',
                        interval: 2,
                        unit: 'HOURS',
                    },
                    duration: 15,
                    instructions: 'Reposition client every 2 hours. Inspect pressure points. Apply barrier cream to high-risk areas. Document any changes.',
                    precautions: ['Check for redness', 'Note any skin breakdown immediately', 'Ensure sheets are wrinkle-free'],
                    performedBy: ['HHA', 'CNA'],
                    requiresDocumentation: true,
                    status: 'ACTIVE',
                    startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
                },
            ];
            const plan2TaskTemplates = [
                {
                    id: uuidv4(),
                    name: 'Morning Transfer and Personal Care',
                    description: 'Assist with transfer from bed and complete morning care routine',
                    category: 'TRANSFERRING',
                    interventionIds: [plan2Interventions[0].id, plan2Interventions[1].id],
                    frequency: {
                        pattern: 'DAILY',
                    },
                    estimatedDuration: 45,
                    timeOfDay: ['MORNING'],
                    instructions: 'Announce arrival, ensure Max is present. Assist with bed to wheelchair transfer. Complete personal care. Document transfer assistance level.',
                    requiresSignature: false,
                    requiresNote: true,
                    isOptional: false,
                    allowSkip: false,
                    verificationType: 'CUSTOM',
                    qualityChecks: [
                        {
                            id: uuidv4(),
                            question: 'Transfer completed safely?',
                            checkType: 'YES_NO',
                            required: true,
                        },
                        {
                            id: uuidv4(),
                            question: 'Level of assistance required',
                            checkType: 'SCALE',
                            required: true,
                            options: ['Total assist', 'Moderate assist', 'Minimal assist', 'Supervision only'],
                        },
                        {
                            id: uuidv4(),
                            question: 'Any signs of PTSD symptoms?',
                            checkType: 'YES_NO',
                            required: true,
                        },
                    ],
                    status: 'ACTIVE',
                },
                {
                    id: uuidv4(),
                    name: 'Skin Inspection and Repositioning',
                    description: 'Check pressure points and reposition client',
                    category: 'MONITORING',
                    interventionIds: [plan2Interventions[2].id],
                    frequency: {
                        pattern: 'DAILY',
                        timesPerDay: 4,
                    },
                    estimatedDuration: 15,
                    timeOfDay: ['MORNING', 'AFTERNOON', 'EVENING'],
                    instructions: 'Inspect all pressure points. Look for redness, warmth, or breakdown. Reposition client. Apply barrier cream as needed. Document findings.',
                    requiresSignature: false,
                    requiresNote: true,
                    requiresPhoto: true,
                    isOptional: false,
                    allowSkip: false,
                    verificationType: 'PHOTO',
                    qualityChecks: [
                        {
                            id: uuidv4(),
                            question: 'Any areas of concern noted?',
                            checkType: 'YES_NO',
                            required: true,
                        },
                        {
                            id: uuidv4(),
                            question: 'If yes, describe location and appearance',
                            checkType: 'TEXT',
                            required: false,
                        },
                    ],
                    status: 'ACTIVE',
                },
            ];
            await client.query(`
        INSERT INTO care_plans (
          id, plan_number, name, client_id, organization_id, branch_id,
          plan_type, status, priority, effective_date, expiration_date, review_date,
          primary_caregiver_id, coordinator_id,
          goals, interventions, task_templates,
          service_frequency, estimated_hours_per_week,
          compliance_status, notes,
          created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      `, [
                plan2Id,
                'CP-2024-002',
                'Complex Care Plan - Veteran Support',
                client2Id,
                orgId,
                branchId,
                'SKILLED_NURSING',
                'ACTIVE',
                'URGENT',
                new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
                new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
                new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                cg2Id,
                systemUserId,
                JSON.stringify(plan2Goals),
                JSON.stringify(plan2Interventions),
                JSON.stringify(plan2TaskTemplates),
                JSON.stringify({
                    pattern: 'DAILY',
                    timesPerWeek: 7,
                    customSchedule: 'Daily visits, morning and afternoon shifts. Evening check-in as needed.',
                }),
                28.0, // 4 hours per day * 7 days
                'COMPLIANT',
                'Complex care case. Excellent progress with PTSD management. Daughter very involved and supportive.',
                systemUserId,
                systemUserId,
            ]);
            console.log(`  ✓ Created care plan CP-2024-002 for client ${clientsResult.rows[1].client_number}`);
            // Create sample task instances for today
            console.log('\nCreating task instances for today...');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            // Create 3 tasks for plan 1 (Margaret)
            const plan1Task1Id = uuidv4();
            await client.query(`
        INSERT INTO task_instances (
          id, care_plan_id, template_id, client_id, assigned_caregiver_id,
          name, description, category, instructions,
          scheduled_date, scheduled_time, estimated_duration,
          status, required_signature, required_note,
          created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `, [
                plan1Task1Id,
                plan1Id,
                plan1TaskTemplates[0].id,
                client1Id,
                cg1Id,
                'Morning Walker Ambulation',
                'Assist client with morning walker practice',
                'MOBILITY',
                plan1TaskTemplates[0].instructions,
                today,
                '09:30',
                15,
                'COMPLETED',
                false,
                true,
                systemUserId,
                systemUserId,
            ]);
            await client.query(`
        UPDATE task_instances SET
          completed_at = $1,
          completed_by = $2,
          completion_note = $3,
          quality_check_responses = $4,
          updated_at = $1
        WHERE id = $5
      `, [
                new Date(today.getTime() + 10 * 60 * 60 * 1000), // Completed at 10 AM
                cg1Id,
                'Client ambulated 22 feet with walker. Good endurance, no signs of fatigue. Continuing to make progress.',
                JSON.stringify([
                    {
                        checkId: plan1TaskTemplates[0].qualityChecks[0].id,
                        question: 'Did client complete ambulation without signs of distress?',
                        response: true,
                    },
                    {
                        checkId: plan1TaskTemplates[0].qualityChecks[1].id,
                        question: 'Distance achieved (in feet)',
                        response: '22',
                    },
                ]),
                plan1Task1Id,
            ]);
            const plan1Task2Id = uuidv4();
            await client.query(`
        INSERT INTO task_instances (
          id, care_plan_id, template_id, client_id, assigned_caregiver_id,
          name, description, category, instructions,
          scheduled_date, scheduled_time, estimated_duration,
          status, required_signature, required_note,
          created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `, [
                plan1Task2Id,
                plan1Id,
                plan1TaskTemplates[1].id,
                client1Id,
                cg1Id,
                'Morning Medication Reminder',
                'Provide medication reminder and observe intake',
                'MEDICATION',
                plan1TaskTemplates[1].instructions,
                today,
                '09:00',
                5,
                'COMPLETED',
                false,
                true,
                systemUserId,
                systemUserId,
            ]);
            await client.query(`
        UPDATE task_instances SET
          completed_at = $1,
          completed_by = $2,
          completion_note = $3,
          updated_at = $1
        WHERE id = $4
      `, [
                new Date(today.getTime() + 9.2 * 60 * 60 * 1000),
                cg1Id,
                'Client took all morning medications as scheduled. No issues.',
                plan1Task2Id,
            ]);
            const plan1Task3Id = uuidv4();
            await client.query(`
        INSERT INTO task_instances (
          id, care_plan_id, template_id, client_id, assigned_caregiver_id,
          name, description, category, instructions,
          scheduled_date, scheduled_time, estimated_duration,
          status, required_signature, required_note,
          created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `, [
                plan1Task3Id,
                plan1Id,
                plan1TaskTemplates[2].id,
                client1Id,
                cg1Id,
                'Personal Care - Morning',
                'Assist with morning personal care routine',
                'PERSONAL_HYGIENE',
                plan1TaskTemplates[2].instructions,
                today,
                '09:45',
                30,
                'IN_PROGRESS',
                false,
                true,
                systemUserId,
                systemUserId,
            ]);
            // Create 2 tasks for plan 2 (Robert)
            const plan2Task1Id = uuidv4();
            await client.query(`
        INSERT INTO task_instances (
          id, care_plan_id, template_id, client_id, assigned_caregiver_id,
          name, description, category, instructions,
          scheduled_date, scheduled_time, estimated_duration,
          status, required_signature, required_note,
          created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `, [
                plan2Task1Id,
                plan2Id,
                plan2TaskTemplates[0].id,
                client2Id,
                cg2Id,
                'Morning Transfer and Personal Care',
                'Assist with transfer from bed and complete morning care routine',
                'TRANSFERRING',
                plan2TaskTemplates[0].instructions,
                today,
                '08:00',
                45,
                'COMPLETED',
                false,
                true,
                systemUserId,
                systemUserId,
            ]);
            await client.query(`
        UPDATE task_instances SET
          completed_at = $1,
          completed_by = $2,
          completion_note = $3,
          quality_check_responses = $4,
          updated_at = $1
        WHERE id = $5
      `, [
                new Date(today.getTime() + 8.8 * 60 * 60 * 1000),
                cg2Id,
                'Transfer completed safely with moderate assistance. Max was present and calm. No PTSD symptoms observed today. Client in good spirits.',
                JSON.stringify([
                    {
                        checkId: plan2TaskTemplates[0].qualityChecks[0].id,
                        question: 'Transfer completed safely?',
                        response: true,
                    },
                    {
                        checkId: plan2TaskTemplates[0].qualityChecks[1].id,
                        question: 'Level of assistance required',
                        response: 'Moderate assist',
                    },
                    {
                        checkId: plan2TaskTemplates[0].qualityChecks[2].id,
                        question: 'Any signs of PTSD symptoms?',
                        response: false,
                    },
                ]),
                plan2Task1Id,
            ]);
            const plan2Task2Id = uuidv4();
            await client.query(`
        INSERT INTO task_instances (
          id, care_plan_id, template_id, client_id, assigned_caregiver_id,
          name, description, category, instructions,
          scheduled_date, scheduled_time, estimated_duration,
          status, required_signature, required_note,
          created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `, [
                plan2Task2Id,
                plan2Id,
                plan2TaskTemplates[1].id,
                client2Id,
                cg2Id,
                'Skin Inspection and Repositioning',
                'Check pressure points and reposition client',
                'MONITORING',
                plan2TaskTemplates[1].instructions,
                today,
                '11:00',
                15,
                'SCHEDULED',
                false,
                true,
                systemUserId,
                systemUserId,
            ]);
            console.log(`  ✓ Created ${5} task instances for today`);
            // Create sample progress notes
            console.log('\nCreating progress notes...');
            const note1Id = uuidv4();
            await client.query(`
        INSERT INTO progress_notes (
          id, care_plan_id, client_id, note_type, note_date,
          author_id, author_name, author_role, content,
          goal_progress, observations,
          created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
                note1Id,
                plan1Id,
                client1Id,
                'VISIT_NOTE',
                today,
                cg1Id,
                'Sarah Johnson, CNA',
                'SENIOR_CAREGIVER',
                'Morning visit completed successfully. Client in good spirits and cooperative with all care activities. Ambulation distance increased to 22 feet today - excellent progress! Medication taken as scheduled. No safety concerns noted. Cat (Whiskers) present and friendly as always.',
                JSON.stringify([
                    {
                        goalId: plan1Goals[0].id,
                        goalName: 'Improve Mobility and Reduce Fall Risk',
                        status: 'IN_PROGRESS',
                        progressDescription: 'Client walked 22 feet with walker today, up from 20 feet last week. Demonstrating improved confidence and endurance.',
                        progressPercentage: 44,
                        barriers: [],
                        nextSteps: ['Continue daily ambulation practice', 'Increase distance by 5 feet next week'],
                    },
                    {
                        goalId: plan1Goals[1].id,
                        goalName: 'Medication Compliance',
                        status: 'ON_TRACK',
                        progressDescription: 'All medications taken as scheduled today without reminders needed.',
                        progressPercentage: 80,
                    },
                ]),
                JSON.stringify([
                    {
                        category: 'PHYSICAL',
                        observation: 'Good color, alert and oriented',
                        severity: 'NORMAL',
                        timestamp: new Date(today.getTime() + 9 * 60 * 60 * 1000),
                    },
                    {
                        category: 'BEHAVIORAL',
                        observation: 'Positive mood, engaged in conversation',
                        severity: 'NORMAL',
                        timestamp: new Date(today.getTime() + 9 * 60 * 60 * 1000),
                    },
                ]),
                systemUserId,
                systemUserId,
            ]);
            const note2Id = uuidv4();
            await client.query(`
        INSERT INTO progress_notes (
          id, care_plan_id, client_id, note_type, note_date,
          author_id, author_name, author_role, content,
          goal_progress, observations,
          created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
                note2Id,
                plan2Id,
                client2Id,
                'VISIT_NOTE',
                today,
                cg2Id,
                'Michael Chen, CNA',
                'CERTIFIED_NURSING_ASSISTANT',
                'Morning care completed. Transfer from bed to wheelchair accomplished with moderate assistance. Max (service dog) was present throughout visit, providing excellent support. Client remained calm and cooperative. All skin integrity checks negative - no areas of concern. Excellent preventive care maintaining results. Daughter stopped by briefly and expressed satisfaction with care.',
                JSON.stringify([
                    {
                        goalId: plan2Goals[0].id,
                        goalName: 'Increase Transfer Independence',
                        status: 'IN_PROGRESS',
                        progressDescription: 'Transfer completed with moderate assistance. Client using upper body strength well.',
                        progressPercentage: 35,
                        nextSteps: ['Continue transfer training', 'Physical therapy exercises'],
                    },
                    {
                        goalId: plan2Goals[2].id,
                        goalName: 'Pressure Wound Prevention',
                        status: 'ON_TRACK',
                        progressDescription: 'All pressure points inspected - no redness or breakdown noted. Preventive measures effective.',
                        progressPercentage: 100,
                    },
                ]),
                JSON.stringify([
                    {
                        category: 'PHYSICAL',
                        observation: 'Skin integrity excellent, no areas of concern',
                        severity: 'NORMAL',
                        timestamp: new Date(today.getTime() + 8.5 * 60 * 60 * 1000),
                    },
                    {
                        category: 'EMOTIONAL',
                        observation: 'Calm and stable, no PTSD symptoms observed',
                        severity: 'NORMAL',
                        timestamp: new Date(today.getTime() + 8.5 * 60 * 60 * 1000),
                    },
                    {
                        category: 'SOCIAL',
                        observation: 'Service dog Max present and providing support. Daughter visit positive.',
                        severity: 'NORMAL',
                        timestamp: new Date(today.getTime() + 8.5 * 60 * 60 * 1000),
                    },
                ]),
                systemUserId,
                systemUserId,
            ]);
            console.log(`  ✓ Created ${2} progress notes`);
            console.log('\n✅ Care plans data seeded successfully!');
            console.log('\n📊 Summary:');
            console.log(`  Care Plans: 2`);
            console.log(`    • CP-2024-001: Personal Care - Fall Risk Management (Margaret Thompson)`);
            console.log(`      - 3 goals, 3 interventions, 4 task templates`);
            console.log(`      - Status: ACTIVE, Priority: HIGH`);
            console.log(`    • CP-2024-002: Complex Care - Veteran Support (Robert Martinez)`);
            console.log(`      - 3 goals, 3 interventions, 2 task templates`);
            console.log(`      - Status: ACTIVE, Priority: URGENT`);
            console.log(`  Task Instances: 5 (for today)`);
            console.log(`    • 2 completed, 1 in progress, 2 scheduled`);
            console.log(`  Progress Notes: 2`);
            console.log(`    • Detailed visit documentation with goal progress tracking`);
        });
    }
    catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
    finally {
        await db.close();
    }
}
seedCarePlans().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
