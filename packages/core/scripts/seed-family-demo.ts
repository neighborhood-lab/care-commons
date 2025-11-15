#!/usr/bin/env node
/**
 * Seed Family Portal Demo Data
 *
 * Creates comprehensive demo data for family portal testing:
 * - Margaret Johnson (client) - elderly mother receiving care
 * - Emily Johnson (family member/daughter) - portal user
 * - Sarah Chen (caregiver) - primary caregiver
 * - Visits, care plans, and activities
 *
 * Usage:
 *   npm run db:seed:family-demo
 */

import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../src/db/connection.js';
import { hashPassword } from '../src/utils/password-utils.js';

interface SeedResult {
  margaretId: string;
  emilyUserId: string;
  emilyFamilyMemberId: string;
  sarahId: string;
  organizationId: string;
  branchId: string;
}

async function seedFamilyDemo(): Promise<void> {
  const db = getDatabase();

  try {
    console.log('\n🏥 Care Commons - Family Portal Demo Seed');
    console.log('==========================================\n');

    await db.transaction(async (trx) => {
      // Get Texas organization and branch
      const orgResult = await trx.query(
        `SELECT id FROM organizations WHERE state = 'TX' LIMIT 1`
      );

      if (orgResult.rows.length === 0) {
        throw new Error('Texas organization not found. Please run base seed first.');
      }

      const organizationId = orgResult.rows[0].id as string;

      const branchResult = await trx.query(
        `SELECT id FROM branches WHERE organization_id = $1 LIMIT 1`,
        [organizationId]
      );

      if (branchResult.rows.length === 0) {
        throw new Error('Texas branch not found. Please run base seed first.');
      }

      const branchId = branchResult.rows[0].id as string;

      // Get system user for created_by fields
      const systemUserResult = await trx.query(
        `SELECT id FROM users WHERE email = 'admin@carecommons.example' LIMIT 1`
      );

      if (systemUserResult.rows.length === 0) {
        throw new Error('System admin user not found. Please run base seed first.');
      }

      const systemUserId = systemUserResult.rows[0].id as string;

      console.log('📍 Using Texas organization and branch');
      console.log('');

      // ====================================================================
      // STEP 1: Create Margaret Johnson (Client)
      // ====================================================================

      console.log('👵 Creating Margaret Johnson (client)...');

      const margaretId = uuidv4();
      const margaretDOB = new Date('1945-03-15');

      await trx.query(
        `
        INSERT INTO clients (
          id, organization_id, branch_id,
          client_number, first_name, last_name, preferred_name,
          date_of_birth, gender, status, risk_flags,
          primary_address, emergency_contacts,
          created_by, updated_by, is_demo_data
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true
        )
        `,
        [
          margaretId,
          organizationId,
          branchId,
          'TX-CLIENT-001',
          'Margaret',
          'Johnson',
          'Maggie',
          margaretDOB,
          'FEMALE',
          'ACTIVE',
          JSON.stringify(['FALL_RISK', 'MEDICATION_ASSISTANCE_NEEDED']),
          JSON.stringify({
            street: '456 Oak Avenue',
            city: 'Austin',
            state: 'TX',
            zipCode: '78701',
            isPrimary: true
          }),
          JSON.stringify([
            {
              name: 'Emily Johnson',
              relationship: 'DAUGHTER',
              phone: '512-555-0123',
              isPrimary: true
            }
          ]),
          systemUserId,
          systemUserId
        ]
      );

      console.log(`   ✅ Created client: Margaret Johnson (ID: ${margaretId})`);
      console.log('');

      // ====================================================================
      // STEP 2: Create Sarah Chen (Caregiver)
      // ====================================================================

      console.log('👩‍⚕️ Creating Sarah Chen (caregiver)...');

      // Check if Sarah Chen already exists
      const existingSarah = await trx.query(
        `SELECT id FROM users WHERE email = 'sarah.chen@tx.carecommons.example'`
      );

      let sarahUserId: string;

      if (existingSarah.rows.length > 0) {
        sarahUserId = existingSarah.rows[0].id as string;
        console.log(`   ℹ️  Sarah Chen already exists (ID: ${sarahUserId})`);
      } else {
        sarahUserId = uuidv4();
        const sarahPasswordHash = await hashPassword('DemoTXCAREGIVER123!');

        await trx.query(
          `
          INSERT INTO users (
            id, organization_id, email, username, password_hash,
            first_name, last_name, roles, permissions, status,
            branch_ids, created_by, updated_by
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
          )
          `,
          [
            sarahUserId,
            organizationId,
            'sarah.chen@tx.carecommons.example',
            'sarah.chen',
            sarahPasswordHash,
            'Sarah',
            'Chen',
            ['CAREGIVER'],
            [
              'clients:read',
              'schedules:read',
              'visits:update',
              'care-plans:read',
              'tasks:read',
              'tasks:update',
              'tasks:complete',
              'notes:create'
            ],
            'ACTIVE',
            [branchId],
            systemUserId,
            systemUserId
          ]
        );

        console.log(`   ✅ Created caregiver user: Sarah Chen (ID: ${sarahUserId})`);
      }

      // Create caregiver profile
      const existingCaregiverProfile = await trx.query(
        `SELECT id FROM caregivers WHERE user_id = $1`,
        [sarahUserId]
      );

      if (existingCaregiverProfile.rows.length === 0) {
        const caregiverId = uuidv4();

        await trx.query(
          `
          INSERT INTO caregivers (
            id, organization_id, branch_id, user_id,
            first_name, last_name, email, phone_number,
            employee_number, employment_type, status,
            certifications, skills, max_hours_per_week,
            created_by, updated_by, is_demo_data
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, true
          )
          `,
          [
            caregiverId,
            organizationId,
            branchId,
            sarahUserId,
            'Sarah',
            'Chen',
            'sarah.chen@tx.carecommons.example',
            '512-555-0456',
            'CG-TX-001',
            'FULL_TIME',
            'ACTIVE',
            JSON.stringify(['CNA', 'CPR', 'FIRST_AID']),
            JSON.stringify(['PERSONAL_CARE', 'MEDICATION_MANAGEMENT', 'COMPANIONSHIP']),
            40,
            systemUserId,
            systemUserId
          ]
        );

        console.log(`   ✅ Created caregiver profile (ID: ${caregiverId})`);
      }

      console.log('');

      // ====================================================================
      // STEP 3: Create Emily Johnson (Family Member User)
      // ====================================================================

      console.log('👩 Creating Emily Johnson (family member user)...');

      // IMPORTANT: Use a specific UUID that will be shared between users and family_members tables
      const emilyUserId = uuidv4();
      const emilyPasswordHash = await hashPassword('DemoTXFAMILY123!');

      // Check if Emily already exists
      const existingEmily = await trx.query(
        `SELECT id FROM users WHERE email = 'family@tx.carecommons.example'`
      );

      if (existingEmily.rows.length > 0) {
        // Update existing user
        await trx.query(
          `
          UPDATE users SET
            first_name = $1,
            last_name = $2,
            roles = $3,
            permissions = $4,
            status = 'ACTIVE',
            branch_ids = $5,
            updated_at = NOW()
          WHERE email = $6
          `,
          [
            'Emily',
            'Johnson',
            ['FAMILY'],
            [
              'clients:read',
              'care-plans:read',
              'notes:read',
              'visits:read',
              'family-portal:view',
              'family-portal:invite',
              'activity-feed:view',
              'notifications:view',
              'notifications:send',
              'messages:view',
              'messages:send',
              'messages:create'
            ],
            [branchId],
            'family@tx.carecommons.example'
          ]
        );

        // Get the existing user ID
        const userId = existingEmily.rows[0].id as string;
        console.log(`   ℹ️  Updated existing user: Emily Johnson (ID: ${userId})`);

        // Delete old family_member record if it doesn't match user ID
        await trx.query(
          `DELETE FROM family_members WHERE client_id = $1 AND id != $2`,
          [margaretId, userId]
        );
      } else {
        // Create new user
        await trx.query(
          `
          INSERT INTO users (
            id, organization_id, email, username, password_hash,
            first_name, last_name, roles, permissions, status,
            branch_ids, created_by, updated_by
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
          )
          `,
          [
            emilyUserId,
            organizationId,
            'family@tx.carecommons.example',
            'emily.johnson',
            emilyPasswordHash,
            'Emily',
            'Johnson',
            ['FAMILY'],
            [
              'clients:read',
              'care-plans:read',
              'notes:read',
              'visits:read',
              'family-portal:view',
              'family-portal:invite',
              'activity-feed:view',
              'notifications:view',
              'notifications:send',
              'messages:view',
              'messages:send',
              'messages:create'
            ],
            'ACTIVE',
            [branchId],
            systemUserId,
            systemUserId
          ]
        );

        console.log(`   ✅ Created family user: Emily Johnson (ID: ${emilyUserId})`);
      }

      // Get the actual user ID (either existing or new)
      const finalEmilyResult = await trx.query(
        `SELECT id FROM users WHERE email = 'family@tx.carecommons.example'`
      );
      const finalEmilyUserId = finalEmilyResult.rows[0].id as string;

      // ====================================================================
      // STEP 4: Create Family Member Record (with same ID as user!)
      // ====================================================================

      console.log('👨‍👩‍👧 Creating family member portal access...');

      // CRITICAL: Use the same ID for family_members as users table
      // This allows the frontend to use user.id directly as familyMemberId
      await trx.query(
        `
        INSERT INTO family_members (
          id, organization_id, branch_id, client_id,
          first_name, last_name, email, phone_number,
          relationship, is_primary_contact,
          preferred_contact_method, portal_access_level,
          status, invitation_status, receive_notifications,
          notification_preferences,
          access_granted_by, created_by, updated_by, is_demo_data
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, true
        )
        ON CONFLICT (id) DO UPDATE SET
          client_id = EXCLUDED.client_id,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          email = EXCLUDED.email,
          relationship = EXCLUDED.relationship,
          is_primary_contact = EXCLUDED.is_primary_contact,
          status = EXCLUDED.status,
          invitation_status = EXCLUDED.invitation_status,
          updated_at = NOW()
        `,
        [
          finalEmilyUserId, // IMPORTANT: Same ID as user!
          organizationId,
          branchId,
          margaretId,
          'Emily',
          'Johnson',
          'family@tx.carecommons.example',
          '512-555-0123',
          'CHILD',
          true,
          'EMAIL',
          'VIEW_DETAILED',
          'ACTIVE',
          'ACCEPTED',
          true,
          JSON.stringify({
            emailEnabled: true,
            smsEnabled: true,
            pushEnabled: true,
            visitReminders: true,
            visitCompletedUpdates: true,
            careplanUpdates: true,
            incidentAlerts: true,
            appointmentReminders: true,
            messageNotifications: true,
            digestFrequency: 'IMMEDIATE'
          }),
          systemUserId,
          systemUserId,
          systemUserId
        ]
      );

      console.log(`   ✅ Created family member record (ID: ${finalEmilyUserId})`);
      console.log(`      ⚠️  IMPORTANT: family_members.id matches users.id!`);
      console.log('');

      // ====================================================================
      // STEP 5: Create Care Plan for Margaret
      // ====================================================================

      console.log('📋 Creating care plan for Margaret...');

      const carePlanId = uuidv4();
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 6);

      await trx.query(
        `
        INSERT INTO care_plans (
          id, organization_id, branch_id, client_id,
          name, description, status, start_date, end_date,
          goals, created_by, updated_by, is_demo_data
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true
        )
        `,
        [
          carePlanId,
          organizationId,
          branchId,
          margaretId,
          'Personal Care & Safety Plan',
          'Comprehensive care plan focusing on daily living assistance, medication management, and fall prevention',
          'ACTIVE',
          startDate,
          endDate,
          JSON.stringify([
            {
              id: uuidv4(),
              name: 'Medication Management',
              category: 'Medical',
              description: 'Ensure all medications are taken correctly and on schedule',
              status: 'IN_PROGRESS',
              targetDate: endDate.toISOString(),
              progress: 75
            },
            {
              id: uuidv4(),
              name: 'Fall Prevention',
              category: 'Safety',
              description: 'Reduce fall risk through environmental modifications and mobility support',
              status: 'IN_PROGRESS',
              targetDate: endDate.toISOString(),
              progress: 60
            },
            {
              id: uuidv4(),
              name: 'Social Engagement',
              category: 'Wellness',
              description: 'Maintain social connections and mental stimulation',
              status: 'ACHIEVED',
              targetDate: new Date().toISOString(),
              progress: 100
            }
          ]),
          systemUserId,
          systemUserId
        ]
      );

      console.log(`   ✅ Created care plan (ID: ${carePlanId})`);
      console.log('');

      // ====================================================================
      // STEP 6: Create Sample Visits
      // ====================================================================

      console.log('📅 Creating sample visits...');

      const now = new Date();
      const visits = [];

      // Past visit (completed today)
      const pastVisit = {
        id: uuidv4(),
        scheduledStart: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
        scheduledEnd: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        status: 'COMPLETED'
      };
      visits.push(pastVisit);

      // Upcoming visit (in 2 hours)
      const upcomingVisit1 = {
        id: uuidv4(),
        scheduledStart: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 4 * 60 * 60 * 1000),
        status: 'SCHEDULED'
      };
      visits.push(upcomingVisit1);

      // Tomorrow morning visit
      const tomorrowMorning = new Date(now);
      tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
      tomorrowMorning.setHours(9, 0, 0, 0);

      const upcomingVisit2 = {
        id: uuidv4(),
        scheduledStart: tomorrowMorning,
        scheduledEnd: new Date(tomorrowMorning.getTime() + 2 * 60 * 60 * 1000),
        status: 'SCHEDULED'
      };
      visits.push(upcomingVisit2);

      for (const visit of visits) {
        await trx.query(
          `
          INSERT INTO visits (
            id, organization_id, branch_id, client_id, caregiver_id,
            scheduled_start_time, scheduled_end_time, status,
            visit_type, created_by, updated_by, is_demo_data
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true
          )
          `,
          [
            visit.id,
            organizationId,
            branchId,
            margaretId,
            sarahUserId,
            visit.scheduledStart,
            visit.scheduledEnd,
            visit.status,
            'PERSONAL_CARE',
            systemUserId,
            systemUserId
          ]
        );

        console.log(`   ✅ Created ${visit.status.toLowerCase()} visit`);
      }

      console.log('');

      // ====================================================================
      // Summary
      // ====================================================================

      const result: SeedResult = {
        margaretId,
        emilyUserId: finalEmilyUserId,
        emilyFamilyMemberId: finalEmilyUserId, // Same ID!
        sarahId: sarahUserId,
        organizationId,
        branchId
      };

      console.log('✅ Family portal demo data created successfully!\n');
      console.log('📊 Summary:');
      console.log('───────────────────────────────────────────────────────');
      console.log(`Client:        Margaret Johnson (ID: ${result.margaretId})`);
      console.log(`Family Member: Emily Johnson (ID: ${result.emilyUserId})`);
      console.log(`               ⚠️  User ID = Family Member ID`);
      console.log(`Caregiver:     Sarah Chen (ID: ${result.sarahId})`);
      console.log(`Organization:  ${result.organizationId}`);
      console.log(`Branch:        ${result.branchId}`);
      console.log('───────────────────────────────────────────────────────');
      console.log('');
      console.log('🔐 Login Credentials:');
      console.log('───────────────────────────────────────────────────────');
      console.log('Family Portal:  family@tx.carecommons.example / DemoTXFAMILY123!');
      console.log('Caregiver:      sarah.chen@tx.carecommons.example / DemoTXCAREGIVER123!');
      console.log('───────────────────────────────────────────────────────');
      console.log('');
    });

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await db.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedFamilyDemo()
    .then(() => {
      console.log('✨ Done!\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { seedFamilyDemo };
