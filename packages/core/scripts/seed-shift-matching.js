/**
 * Seed data for Shift Matching & Assignment vertical
 *
 * Creates realistic matching scenarios for demo and testing:
 * - Configures default matching rules
 * - Creates open shifts with diverse requirements
 * - Sets up caregiver preferences
 * - Demonstrates matching outcomes (excellent, good, fair, poor matches)
 * - Shows assignment proposals and responses
 */
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
async function seedShiftMatching(pool) {
    console.log('🎯 Seeding Shift Matching & Assignment data...\n');
    // Get existing organization and branch
    const orgResult = await pool.query('SELECT id FROM organizations LIMIT 1');
    if (orgResult.rows.length === 0) {
        throw new Error('No organization found. Please run main seed script first.');
    }
    const organizationId = orgResult.rows[0].id;
    const branchResult = await pool.query('SELECT id FROM branches WHERE organization_id = $1 LIMIT 1', [organizationId]);
    if (branchResult.rows.length === 0) {
        throw new Error('No branch found. Please run main seed script first.');
    }
    const branchId = branchResult.rows[0].id;
    // Get system user
    const userResult = await pool.query('SELECT id FROM users WHERE organization_id = $1 LIMIT 1', [organizationId]);
    const systemUserId = userResult.rows[0]?.id || uuidv4();
    // Get clients
    const clientResult = await pool.query('SELECT id FROM clients WHERE organization_id = $1 LIMIT 5', [organizationId]);
    const clientIds = clientResult.rows.map((r) => r.id);
    if (clientIds.length === 0) {
        throw new Error('No clients found. Please run main seed script first.');
    }
    // Get caregivers
    const caregiverResult = await pool.query('SELECT id FROM caregivers WHERE organization_id = $1 AND status = \'ACTIVE\' LIMIT 8', [organizationId]);
    const caregiverIds = caregiverResult.rows.map((r) => r.id);
    if (caregiverIds.length === 0) {
        throw new Error('No caregivers found. Please run main seed script first.');
    }
    // Get a service type
    const serviceTypeResult = await pool.query('SELECT id FROM service_types WHERE organization_id = $1 LIMIT 1', [organizationId]);
    const serviceTypeId = serviceTypeResult.rows[0]?.id || uuidv4();
    const context = {
        organizationId,
        branchId,
        systemUserId,
        clientIds,
        caregiverIds,
        serviceTypeId,
    };
    // 1. Create default matching configuration
    await createMatchingConfiguration(pool, context);
    // 2. Create visits to match
    const visitIds = await createVisitsForMatching(pool, context);
    // 3. Create open shifts
    const openShiftIds = await createOpenShifts(pool, context, visitIds);
    // 4. Set up caregiver preferences
    await createCaregiverPreferences(pool, context);
    // 5. Create some proposal scenarios
    await createProposalScenarios(pool, context, openShiftIds);
    console.log('\n✅ Shift Matching seed data complete!');
    console.log(`   - Created matching configuration`);
    console.log(`   - Created ${visitIds.length} visits`);
    console.log(`   - Created ${openShiftIds.length} open shifts`);
    console.log(`   - Set up ${caregiverIds.length} caregiver preferences`);
    console.log(`   - Created proposal scenarios\n`);
}
async function createMatchingConfiguration(pool, context) {
    console.log('  Creating matching configuration...');
    const configId = uuidv4();
    await pool.query(`
    INSERT INTO matching_configurations (
      id, organization_id, branch_id, name, description,
      weights, max_travel_distance, max_travel_time,
      require_exact_skill_match, require_active_certifications,
      respect_gender_preference, respect_language_preference,
      auto_assign_threshold, min_score_for_proposal,
      max_proposals_per_shift, proposal_expiration_minutes,
      optimize_for, consider_cost_efficiency,
      balance_workload_across_caregivers, prioritize_continuity_of_care,
      prefer_same_caregiver_for_recurring, penalize_frequent_rejections,
      boost_reliable_performers, is_active, is_default,
      created_at, created_by, updated_at, updated_by, version
    ) VALUES (
      $1, $2, NULL, 'Default Matching Configuration', 'Organization-wide default rules for shift matching',
      $3::jsonb, 30, 60, false, true, true, true,
      NULL, 50, 5, 120,
      'BEST_MATCH', false, false, true, true, true, true,
      true, true,
      NOW(), $4, NOW(), $4, 1
    )
    `, [
        configId,
        context.organizationId,
        JSON.stringify({
            skillMatch: 20,
            availabilityMatch: 20,
            proximityMatch: 15,
            preferenceMatch: 10,
            experienceMatch: 10,
            reliabilityMatch: 10,
            complianceMatch: 10,
            capacityMatch: 5,
        }),
        context.systemUserId,
    ]);
    return configId;
}
async function createVisitsForMatching(pool, context) {
    console.log('  Creating visits for matching...');
    const visitIds = [];
    const today = new Date();
    // Create 10 unassigned visits over the next 7 days
    for (let i = 0; i < 10; i++) {
        const visitId = uuidv4();
        const visitDate = new Date(today);
        visitDate.setDate(visitDate.getDate() + Math.floor(i / 2) + 1); // Spread over next few days
        const hour = 8 + (i % 3) * 4; // 8am, 12pm, 4pm
        const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
        const endTime = `${(hour + 2).toString().padStart(2, '0')}:00:00`;
        const clientId = context.clientIds[i % context.clientIds.length];
        await pool.query(`
      INSERT INTO visits (
        id, organization_id, branch_id, client_id,
        scheduled_date, scheduled_start_time, scheduled_end_time,
        scheduled_duration, timezone, service_type_id, service_type_name,
        status, address, created_at, created_by, updated_at, updated_by, version
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, 120, 'America/New_York', $8, 'Personal Care',
        'UNASSIGNED',
        $9::jsonb,
        NOW(), $10, NOW(), $10, 1
      )
      `, [
            visitId,
            context.organizationId,
            context.branchId,
            clientId,
            visitDate,
            startTime,
            endTime,
            context.serviceTypeId,
            JSON.stringify({
                line1: `${100 + i * 10} Main Street`,
                city: 'Boston',
                state: 'MA',
                postalCode: '02108',
                country: 'USA',
            }),
            context.systemUserId,
        ]);
        visitIds.push(visitId);
    }
    return visitIds;
}
async function createOpenShifts(pool, context, visitIds) {
    console.log('  Creating open shifts...');
    const openShiftIds = [];
    for (let i = 0; i < visitIds.length; i++) {
        const openShiftId = uuidv4();
        const visitId = visitIds[i];
        // Get visit details
        const visitResult = await pool.query('SELECT * FROM visits WHERE id = $1', [visitId]);
        const visit = visitResult.rows[0];
        // Vary requirements and priorities
        const priorities = ['NORMAL', 'HIGH', 'NORMAL', 'CRITICAL', 'NORMAL'];
        const priority = priorities[i % priorities.length];
        const isUrgent = priority === 'CRITICAL';
        // Some shifts require specific skills
        let requiredSkills = null;
        let requiredCertifications = null;
        if (i % 3 === 0) {
            requiredSkills = JSON.stringify(['Medication Administration', 'Mobility Assistance']);
        }
        if (i % 4 === 0) {
            requiredCertifications = JSON.stringify(['CNA', 'CPR']);
        }
        // Some have preferred caregivers
        let preferredCaregivers = null;
        if (i % 5 === 0 && context.caregiverIds.length > 0) {
            preferredCaregivers = JSON.stringify([context.caregiverIds[0]]);
        }
        await pool.query(`
      INSERT INTO open_shifts (
        id, organization_id, branch_id, visit_id, client_id,
        scheduled_date, start_time, end_time, duration, timezone,
        service_type_id, service_type_name,
        required_skills, required_certifications, preferred_caregivers,
        address, priority, is_urgent, fill_by_date,
        matching_status, match_attempts,
        created_at, created_by, updated_at, updated_by, version
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13::jsonb, $14::jsonb, $15::jsonb,
        $16::jsonb, $17, $18, $19,
        'NEW', 0,
        NOW(), $20, NOW(), $20, 1
      )
      `, [
            openShiftId,
            context.organizationId,
            context.branchId,
            visitId,
            visit.client_id,
            visit.scheduled_date,
            visit.scheduled_start_time,
            visit.scheduled_end_time,
            visit.scheduled_duration,
            visit.timezone,
            context.serviceTypeId,
            'Personal Care',
            requiredSkills,
            requiredCertifications,
            preferredCaregivers,
            visit.address,
            priority,
            isUrgent,
            isUrgent ? new Date(new Date(visit.scheduled_date).getTime() - 24 * 60 * 60 * 1000) : null,
            context.systemUserId,
        ]);
        openShiftIds.push(openShiftId);
    }
    return openShiftIds;
}
async function createCaregiverPreferences(pool, context) {
    console.log('  Creating caregiver preferences...');
    for (let i = 0; i < context.caregiverIds.length; i++) {
        const caregiverId = context.caregiverIds[i];
        const prefId = uuidv4();
        // Vary preferences
        const preferredDays = i % 2 === 0
            ? JSON.stringify(['MONDAY', 'WEDNESDAY', 'FRIDAY'])
            : JSON.stringify(['TUESDAY', 'THURSDAY', 'SATURDAY']);
        const maxDistance = 15 + (i * 5) % 20; // 15-35 miles
        const maxHours = 30 + (i * 5) % 20; // 30-50 hours/week
        const acceptUrgent = i % 3 !== 0; // Most accept urgent
        const acceptWeekends = i % 2 === 0; // Half accept weekends
        const autoAssign = i % 4 === 0; // Quarter accept auto-assignment
        await pool.query(`
      INSERT INTO caregiver_preference_profiles (
        id, caregiver_id, organization_id,
        preferred_days_of_week, max_travel_distance, max_hours_per_week,
        willing_to_accept_urgent_shifts, willing_to_work_weekends,
        willing_to_work_holidays, accept_auto_assignment,
        notification_methods,
        last_updated, updated_by, created_at, created_by, version
      ) VALUES (
        $1, $2, $3, $4::jsonb, $5, $6, $7, $8, false, $9,
        $10::jsonb,
        NOW(), $11, NOW(), $11, 1
      )
      `, [
            prefId,
            caregiverId,
            context.organizationId,
            preferredDays,
            maxDistance,
            maxHours,
            acceptUrgent,
            acceptWeekends,
            autoAssign,
            JSON.stringify(['PUSH', 'SMS']),
            context.systemUserId,
        ]);
    }
}
async function createProposalScenarios(pool, context, openShiftIds) {
    console.log('  Creating proposal scenarios...');
    // Scenario 1: Accepted proposal
    if (openShiftIds.length > 0 && context.caregiverIds.length > 0) {
        const proposalId = uuidv4();
        const openShiftId = openShiftIds[0];
        const caregiverId = context.caregiverIds[0];
        const shiftResult = await pool.query('SELECT * FROM open_shifts WHERE id = $1', [openShiftId]);
        const shift = shiftResult.rows[0];
        await pool.query(`
      INSERT INTO assignment_proposals (
        id, organization_id, branch_id, open_shift_id, visit_id, caregiver_id,
        match_score, match_quality, match_reasons,
        proposal_status, proposed_by, proposed_at, proposal_method,
        sent_to_caregiver, sent_at, notification_method,
        viewed_by_caregiver, viewed_at,
        accepted_at, accepted_by, responded_at, response_method,
        is_preferred, urgency_flag,
        created_at, created_by, updated_at, updated_by, version
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        92, 'EXCELLENT', $7::jsonb,
        'ACCEPTED', $8, NOW() - INTERVAL '2 hours', 'AUTOMATIC',
        true, NOW() - INTERVAL '2 hours', 'PUSH',
        true, NOW() - INTERVAL '90 minutes',
        NOW() - INTERVAL '80 minutes', $6, NOW() - INTERVAL '80 minutes', 'MOBILE',
        true, false,
        NOW(), $8, NOW(), $8, 1
      )
      `, [
            proposalId,
            context.organizationId,
            context.branchId,
            openShiftId,
            shift.visit_id,
            caregiverId,
            JSON.stringify([
                { category: 'SKILL', description: 'Has all required skills', impact: 'POSITIVE', weight: 0.2 },
                { category: 'AVAILABILITY', description: 'No schedule conflicts', impact: 'POSITIVE', weight: 0.2 },
                { category: 'PREFERENCE', description: 'Preferred by client', impact: 'POSITIVE', weight: 0.1 },
            ]),
            context.systemUserId,
        ]);
        // Update visit and shift status
        await pool.query('UPDATE visits SET assigned_caregiver_id = $1, status = \'SCHEDULED\', updated_at = NOW() WHERE id = $2', [caregiverId, shift.visit_id]);
        await pool.query('UPDATE open_shifts SET matching_status = \'ASSIGNED\', updated_at = NOW() WHERE id = $1', [openShiftId]);
    }
    // Scenario 2: Rejected proposal
    if (openShiftIds.length > 1 && context.caregiverIds.length > 1) {
        const proposalId = uuidv4();
        const openShiftId = openShiftIds[1];
        const caregiverId = context.caregiverIds[1];
        const shiftResult = await pool.query('SELECT * FROM open_shifts WHERE id = $1', [openShiftId]);
        const shift = shiftResult.rows[0];
        await pool.query(`
      INSERT INTO assignment_proposals (
        id, organization_id, branch_id, open_shift_id, visit_id, caregiver_id,
        match_score, match_quality, match_reasons,
        proposal_status, proposed_by, proposed_at, proposal_method,
        sent_to_caregiver, sent_at, notification_method,
        viewed_by_caregiver, viewed_at,
        rejected_at, rejected_by, rejection_reason, rejection_category,
        responded_at, response_method,
        is_preferred, urgency_flag,
        created_at, created_by, updated_at, updated_by, version
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        78, 'GOOD', $7::jsonb,
        'REJECTED', $8, NOW() - INTERVAL '3 hours', 'AUTOMATIC',
        true, NOW() - INTERVAL '3 hours', 'SMS',
        true, NOW() - INTERVAL '150 minutes',
        NOW() - INTERVAL '140 minutes', $6,
        'Distance too far from my location',
        'TOO_FAR',
        NOW() - INTERVAL '140 minutes', 'MOBILE',
        false, false,
        NOW(), $8, NOW(), $8, 1
      )
      `, [
            proposalId,
            context.organizationId,
            context.branchId,
            openShiftId,
            shift.visit_id,
            caregiverId,
            JSON.stringify([
                { category: 'SKILL', description: 'Has required skills', impact: 'POSITIVE', weight: 0.2 },
                { category: 'AVAILABILITY', description: 'Available for shift', impact: 'POSITIVE', weight: 0.2 },
                { category: 'PROXIMITY', description: '25 miles from client', impact: 'NEGATIVE', weight: 0.15 },
            ]),
            context.systemUserId,
        ]);
        await pool.query('UPDATE open_shifts SET matching_status = \'MATCHED\', match_attempts = 1, updated_at = NOW() WHERE id = $1', [openShiftId]);
    }
    // Scenario 3: Pending proposal
    if (openShiftIds.length > 2 && context.caregiverIds.length > 2) {
        const proposalId = uuidv4();
        const openShiftId = openShiftIds[2];
        const caregiverId = context.caregiverIds[2];
        const shiftResult = await pool.query('SELECT * FROM open_shifts WHERE id = $1', [openShiftId]);
        const shift = shiftResult.rows[0];
        await pool.query(`
      INSERT INTO assignment_proposals (
        id, organization_id, branch_id, open_shift_id, visit_id, caregiver_id,
        match_score, match_quality, match_reasons,
        proposal_status, proposed_by, proposed_at, proposal_method,
        sent_to_caregiver, sent_at, notification_method,
        viewed_by_caregiver,
        is_preferred, urgency_flag,
        created_at, created_by, updated_at, updated_by, version
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        85, 'EXCELLENT', $7::jsonb,
        'SENT', $8, NOW() - INTERVAL '30 minutes', 'AUTOMATIC',
        true, NOW() - INTERVAL '30 minutes', 'PUSH',
        false,
        false, true,
        NOW(), $8, NOW(), $8, 1
      )
      `, [
            proposalId,
            context.organizationId,
            context.branchId,
            openShiftId,
            shift.visit_id,
            caregiverId,
            JSON.stringify([
                { category: 'SKILL', description: 'Perfect skill match', impact: 'POSITIVE', weight: 0.2 },
                { category: 'AVAILABILITY', description: 'Available', impact: 'POSITIVE', weight: 0.2 },
                { category: 'PROXIMITY', description: 'Close to client (5 miles)', impact: 'POSITIVE', weight: 0.15 },
            ]),
            context.systemUserId,
        ]);
        await pool.query('UPDATE open_shifts SET matching_status = \'PROPOSED\', match_attempts = 1, last_matched_at = NOW(), updated_at = NOW() WHERE id = $1', [openShiftId]);
    }
}
// Run the seed function
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/care_commons';
const pool = new Pool({ connectionString });
seedShiftMatching(pool)
    .then(() => {
    pool.end();
    process.exit(0);
})
    .catch((error) => {
    console.error('❌ Seed failed:', error);
    pool.end();
    process.exit(1);
});
