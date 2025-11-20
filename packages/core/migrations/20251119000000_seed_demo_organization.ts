import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import { PasswordUtils } from '../src/utils/password-utils.js';

export async function up(knex: Knex): Promise<void> {
  console.log('🎭 Seeding demo organization...');

  // Check if demo org already exists
  const existingOrg = await knex('organizations')
    .where('name', 'Care Commons Demo (Texas)')
    .first();

  if (existingOrg) {
    console.log('✓ Demo organization already exists, skipping...');
    return;
  }

  const orgId = uuidv4();
  const branchId = uuidv4();
  const now = new Date();
  const systemUserId = uuidv4(); // Temporary system user ID

  await knex.transaction(async (trx) => {
    // Create demo organization
    await trx('organizations').insert({
      id: orgId,
      name: 'Care Commons Demo (Texas)',
      legal_name: 'Care Commons Demo Agency LLC',
      license_number: 'DEMO-TX-2024',
      phone: '+15125551234',
      email: 'demo@carecommons.example',
      website: 'https://demo.carecommons.example',
      primary_address: {
        type: 'PRIMARY',
        line1: '123 Demo Street',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        country: 'US',
      },
      settings: {
        evv: {
          provider: 'HHAeXchange',
          required: true,
          gpsRequired: true,
        },
        timezone: 'America/Chicago',
        businessHours: {
          start: '08:00',
          end: '18:00',
        },
      },
      status: 'ACTIVE',
      created_by: systemUserId,
      updated_by: systemUserId,
      created_at: now,
      updated_at: now,
    });

    // Create demo branch
    await trx('branches').insert({
      id: branchId,
      organization_id: orgId,
      name: 'Austin Central Office',
      code: 'AUS-001',
      phone: '+15125551234',
      email: 'austin@demo.carecommons.example',
      address: {
        type: 'PRIMARY',
        line1: '123 Demo Street',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        country: 'US',
      },
      service_area: {
        states: ['TX'],
        cities: ['Austin', 'Round Rock', 'Cedar Park', 'Georgetown', 'Pflugerville'],
      },
      settings: {
        servesStates: ['TX'],
        timezone: 'America/Chicago',
      },
      status: 'ACTIVE',
      created_by: systemUserId,
      updated_by: systemUserId,
      created_at: now,
      updated_at: now,
    });

    // Create 5 demo persona users (matching Login.tsx)
    const personas = [
      {
        email: 'admin@tx.carecommons.example',
        password: 'Demo123!',
        firstName: 'Maria',
        lastName: 'Rodriguez',
        roles: ['SUPER_ADMIN'],
        permissions: [
          'organizations:*', 'users:*', 'clients:*', 'caregivers:*',
          'visits:*', 'schedules:*', 'care-plans:*', 'tasks:*', 'billing:*',
          'reports:*', 'settings:*'
        ],
      },
      {
        email: 'coordinator@tx.carecommons.example',
        password: 'Demo123!',
        firstName: 'James',
        lastName: 'Thompson',
        roles: ['COORDINATOR', 'SCHEDULER'],
        permissions: [
          'clients:create', 'clients:read', 'clients:update',
          'caregivers:read', 'caregivers:assign',
          'visits:create', 'visits:read', 'visits:update', 'visits:delete',
          'schedules:create', 'schedules:read', 'schedules:update', 'schedules:delete',
          'care-plans:create', 'care-plans:read', 'care-plans:update',
          'tasks:create', 'tasks:read', 'tasks:update',
          'reports:read', 'reports:generate'
        ],
      },
      {
        email: 'caregiver@tx.carecommons.example',
        password: 'Demo123!',
        firstName: 'Sarah',
        lastName: 'Chen',
        roles: ['CAREGIVER'],
        permissions: [
          'clients:read', 'visits:read', 'visits:clock-in', 'visits:clock-out',
          'visits:update', 'care-plans:read', 'tasks:read', 'tasks:update'
        ],
      },
      {
        email: 'nurse@tx.carecommons.example',
        password: 'Demo123!',
        firstName: 'David',
        lastName: 'Williams',
        roles: ['NURSE', 'CLINICAL'],
        permissions: [
          'clients:read', 'clients:update', 'visits:read', 'visits:create',
          'visits:update', 'care-plans:create', 'care-plans:read',
          'care-plans:update', 'tasks:create', 'tasks:read', 'tasks:update',
          'medications:*', 'clinical:*'
        ],
      },
      {
        email: 'family@tx.carecommons.example',
        password: 'Demo123!',
        firstName: 'Emily',
        lastName: 'Johnson',
        roles: ['FAMILY'],
        permissions: [
          'clients:read', 'visits:read', 'care-plans:read', 'tasks:read', 'schedules:read'
        ],
      },
    ];

    for (const persona of personas) {
      const passwordHash = await PasswordUtils.hashPassword(persona.password);
      const userId = uuidv4();

      await trx('users').insert({
        id: userId,
        organization_id: orgId,
        username: persona.email.split('@')[0],
        email: persona.email,
        password_hash: passwordHash,
        first_name: persona.firstName,
        last_name: persona.lastName,
        status: 'ACTIVE',
        roles: persona.roles,
        permissions: persona.permissions,
        email_verified: true,
        created_by: userId,
        updated_by: userId,
        created_at: now,
        updated_at: now,
      });

      // Link user to branch
      await trx('user_branches').insert({
        user_id: userId,
        branch_id: branchId,
        is_primary: true,
        created_at: now,
      });
    }

    console.log('✓ Demo organization created:');
    console.log(`  - Organization: Care Commons Demo (Texas)`);
    console.log(`  - Branch: Austin Central Office`);
    console.log(`  - Users: 5 demo personas`);
  });
}

export async function down(knex: Knex): Promise<void> {
  console.log('🗑️  Removing demo organization...');

  const demoOrg = await knex('organizations')
    .where('name', 'Care Commons Demo (Texas)')
    .first();

  if (!demoOrg) {
    console.log('✓ Demo organization does not exist, skipping...');
    return;
  }

  await knex.transaction(async (trx) => {
    // Delete in reverse order of dependencies
    await trx('user_branches').whereIn('user_id', function() {
      this.select('id').from('users').where('organization_id', demoOrg.id);
    }).delete();

    await trx('users').where('organization_id', demoOrg.id).delete();
    await trx('branches').where('organization_id', demoOrg.id).delete();
    await trx('organizations').where('id', demoOrg.id).delete();

    console.log('✓ Demo organization removed');
  });
}
