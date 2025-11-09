# Task 0076: Demo Data Seeding and Showcase Enhancement

**Priority:** 🔴 CRITICAL
**Estimated Effort:** 3-5 days
**Type:** Demo / Onboarding / Developer Experience
**Vertical:** Showcase

---

## Context

Care Commons has a showcase environment, but it lacks **realistic, compelling demo data** that demonstrates the platform's capabilities. First impressions matter enormously - when prospects, evaluators, or new team members access the demo, they should immediately see the platform's value.

**Current State:**
- Minimal or no seed data in showcase
- Demo requires manual data entry to show features
- No pre-built scenarios demonstrating workflows
- Difficult to evaluate the platform without significant setup
- Poor first impression for evaluators

**Goal State:**
- One-command setup of realistic demo environment
- Pre-configured multi-persona scenarios
- Compelling data that showcases all features
- Interactive tours guiding users through workflows
- Demo environment resets daily for fresh experience

---

## Objectives

1. **Create Comprehensive Seed Data Script**
   - 50+ clients with realistic demographics
   - 30+ caregivers with varied skills and certifications
   - 500+ visits (past, current, future) showing full lifecycle
   - 30+ care plans with tasks demonstrating platform capabilities
   - Family portal data (messages, notifications, updates)
   - Billing and payroll data showing financial workflows
   - Compliance data for multiple states

2. **Build Interactive Showcase Tours**
   - Guided tours for each persona (admin, coordinator, caregiver, family)
   - Highlight key features with tooltips and walkthroughs
   - Pre-loaded scenarios (schedule visit, handle emergency, etc.)

3. **Enhance Showcase Landing Page**
   - Clear persona selection
   - Feature highlights
   - Video demonstrations
   - "Try it now" CTAs

---

## Deliverable 1: Realistic Demo Data Seed Script

### Script Architecture

**packages/showcase/seed/seed-demo-data.ts:**

```typescript
import { Knex } from 'knex';
import { faker } from '@faker-js/faker';

interface SeedOptions {
  reset?: boolean;  // Drop existing data
  scale?: 'small' | 'medium' | 'large';  // Data volume
}

export async function seedDemoData(
  db: Knex,
  options: SeedOptions = { reset: true, scale: 'medium' }
): Promise<void> {
  console.log('🌱 Seeding Care Commons demo data...');

  // Step 1: Clear existing demo data
  if (options.reset) {
    await clearDemoData(db);
  }

  // Step 2: Create agency configuration
  const agency = await seedAgency(db);

  // Step 3: Create users and personas
  const users = await seedUsers(db, options.scale);

  // Step 4: Create clients
  const clients = await seedClients(db, options.scale);

  // Step 5: Create caregivers
  const caregivers = await seedCaregivers(db, users, options.scale);

  // Step 6: Create care plans
  const carePlans = await seedCarePlans(db, clients);

  // Step 7: Create visits (past, present, future)
  const visits = await seedVisits(db, clients, caregivers, options.scale);

  // Step 8: Create family portal data
  await seedFamilyEngagement(db, clients, users);

  // Step 9: Create billing data
  await seedBillingData(db, visits);

  // Step 10: Create analytics/reporting data
  await seedAnalyticsData(db, visits);

  console.log('✅ Demo data seeded successfully!');
  console.log(`   - ${users.admins.length} administrators`);
  console.log(`   - ${users.coordinators.length} coordinators`);
  console.log(`   - ${caregivers.length} caregivers`);
  console.log(`   - ${clients.length} clients`);
  console.log(`   - ${visits.length} visits`);
}

async function seedAgency(db: Knex) {
  return await db('agencies').insert({
    name: 'Sunshine Home Healthcare',
    address_line1: '123 Main Street',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    phone: '(512) 555-0100',
    email: 'info@sunshinehomecare.demo',
    operating_states: ['TX', 'FL', 'OH'],
    evv_providers: {
      TX: { provider: 'sandata', account_id: 'DEMO-TX-001' },
      FL: { provider: 'hhax', account_id: 'DEMO-FL-001' },
      OH: { provider: 'clearcare', account_id: 'DEMO-OH-001' }
    },
    is_demo_data: true,
  }).returning('*');
}

async function seedUsers(db: Knex, scale: string) {
  const scaleConfig = {
    small: { admins: 1, coordinators: 2, families: 10 },
    medium: { admins: 2, coordinators: 5, families: 20 },
    large: { admins: 3, coordinators: 10, families: 40 }
  };
  const config = scaleConfig[scale];

  // Create admin users
  const admins = await Promise.all([
    db('users').insert({
      email: 'admin@demo.care-commons.local',
      password_hash: await hashPassword('Demo2024!'),
      first_name: 'Sarah',
      last_name: 'Johnson',
      role: 'administrator',
      is_active: true,
      is_demo_data: true,
    }).returning('*'),
    // Add more admins based on scale
  ]);

  // Create coordinators
  const coordinatorNames = [
    { first: 'Emily', last: 'Rodriguez', email: 'emily.rodriguez@demo' },
    { first: 'Michael', last: 'Chen', email: 'michael.chen@demo' },
    { first: 'Jessica', last: 'Williams', email: 'jessica.williams@demo' },
    { first: 'David', last: 'Brown', email: 'david.brown@demo' },
    { first: 'Lisa', last: 'Garcia', email: 'lisa.garcia@demo' },
  ];

  const coordinators = await Promise.all(
    coordinatorNames.slice(0, config.coordinators).map(person =>
      db('users').insert({
        email: person.email,
        password_hash: await hashPassword('Demo2024!'),
        first_name: person.first,
        last_name: person.last,
        role: 'coordinator',
        is_active: true,
        is_demo_data: true,
      }).returning('*')
    )
  );

  return { admins, coordinators };
}

async function seedClients(db: Knex, scale: string) {
  const clientCount = scale === 'small' ? 20 : scale === 'medium' ? 50 : 100;

  const clients = [];
  for (let i = 0; i < clientCount; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const state = faker.helpers.arrayElement(['TX', 'FL', 'OH', 'PA', 'GA']);

    const client = await db('clients').insert({
      first_name: firstName,
      last_name: lastName,
      date_of_birth: faker.date.birthdate({ min: 65, max: 95, mode: 'age' }),
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      phone: faker.phone.number('###-###-####'),
      address_line1: faker.location.streetAddress(),
      city: faker.location.city(),
      state: state,
      zip: faker.location.zipCode(),
      latitude: faker.location.latitude(),
      longitude: faker.location.longitude(),

      // Health information
      diagnosis: faker.helpers.arrayElement([
        'Alzheimer\'s Disease',
        'Parkinson\'s Disease',
        'Diabetes',
        'Heart Disease',
        'Stroke Recovery',
        'COPD',
        'Arthritis',
      ]),
      mobility_level: faker.helpers.arrayElement(['independent', 'walker', 'wheelchair', 'bedbound']),

      // Care details
      care_type: faker.helpers.arrayElement(['personal-care', 'skilled-nursing', 'companion-care']),
      hours_per_week: faker.helpers.arrayElement([10, 20, 30, 40]),

      // Demographics
      preferred_language: faker.helpers.arrayElement(['English', 'Spanish', 'Mandarin', 'Vietnamese']),
      emergency_contact: faker.person.fullName(),
      emergency_phone: faker.phone.number('###-###-####'),

      is_demo_data: true,
    }).returning('*');

    clients.push(client[0]);
  }

  return clients;
}

async function seedCaregivers(db: Knex, users: any, scale: string) {
  const caregiverCount = scale === 'small' ? 15 : scale === 'medium' ? 30 : 60;

  const caregivers = [];
  for (let i = 0; i < caregiverCount; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();

    // Create user account for caregiver
    const user = await db('users').insert({
      email,
      password_hash: await hashPassword('Demo2024!'),
      first_name: firstName,
      last_name: lastName,
      role: 'caregiver',
      is_active: true,
      is_demo_data: true,
    }).returning('*');

    const caregiver = await db('caregivers').insert({
      user_id: user[0].id,
      first_name: firstName,
      last_name: lastName,
      email,
      phone: faker.phone.number('###-###-####'),
      address_line1: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.helpers.arrayElement(['TX', 'FL', 'OH']),
      zip: faker.location.zipCode(),
      latitude: faker.location.latitude(),
      longitude: faker.location.longitude(),

      // Employment
      hire_date: faker.date.past({ years: 3 }),
      employment_type: faker.helpers.arrayElement(['full-time', 'part-time', 'per-diem']),
      hourly_rate: faker.number.float({ min: 15, max: 30, precision: 0.50 }),

      // Skills and certifications
      certifications: faker.helpers.arrayElements([
        'CNA', 'HHA', 'PCA', 'CPR', 'First Aid', 'Dementia Care'
      ], { min: 2, max: 4 }),
      languages: faker.helpers.arrayElements([
        'English', 'Spanish', 'Mandarin', 'Vietnamese', 'Tagalog'
      ], { min: 1, max: 2 }),
      skills: faker.helpers.arrayElements([
        'Medication Management', 'Wound Care', 'Alzheimer\'s Care',
        'Diabetic Care', 'Physical Therapy Support', 'Meal Preparation'
      ], { min: 2, max: 5 }),

      // Preferences
      preferred_areas: faker.helpers.arrayElements([
        'North Austin', 'South Austin', 'Downtown', 'West Lake Hills'
      ], { min: 1, max: 3 }),
      max_drive_distance: faker.helpers.arrayElement([10, 15, 20, 25]),

      is_demo_data: true,
    }).returning('*');

    caregivers.push(caregiver[0]);
  }

  return caregivers;
}

async function seedVisits(db: Knex, clients: any[], caregivers: any[], scale: string) {
  const visitCount = scale === 'small' ? 200 : scale === 'medium' ? 500 : 1000;
  const visits = [];

  for (let i = 0; i < visitCount; i++) {
    const client = faker.helpers.arrayElement(clients);
    const caregiver = faker.helpers.arrayElement(caregivers);

    // Mix of past, present, and future visits
    const dayOffset = faker.number.int({ min: -30, max: 30 });
    const scheduledStart = faker.date.soon({ days: Math.abs(dayOffset) });
    if (dayOffset < 0) {
      scheduledStart.setDate(scheduledStart.getDate() - Math.abs(dayOffset));
    }

    const duration = faker.helpers.arrayElement([2, 3, 4, 6, 8]); // hours
    const scheduledEnd = new Date(scheduledStart);
    scheduledEnd.setHours(scheduledEnd.getHours() + duration);

    let status = 'scheduled';
    let actualStart = null;
    let actualEnd = null;
    let evvData = null;

    // For past visits, mark as completed with EVV data
    if (dayOffset < 0) {
      status = 'completed';
      actualStart = new Date(scheduledStart);
      actualStart.setMinutes(actualStart.getMinutes() + faker.number.int({ min: -5, max: 5 }));
      actualEnd = new Date(scheduledEnd);
      actualEnd.setMinutes(actualEnd.getMinutes() + faker.number.int({ min: -10, max: 10 }));

      evvData = {
        clock_in_gps: { lat: client.latitude, lng: client.longitude },
        clock_out_gps: { lat: client.latitude + 0.0001, lng: client.longitude + 0.0001 },
        verification_method: 'biometric',
        compliance_status: faker.helpers.weightedArrayElement([
          { weight: 90, value: 'compliant' },
          { weight: 8, value: 'flagged' },
          { weight: 2, value: 'rejected' }
        ]),
      };
    }

    // For today's visits, some in progress
    if (dayOffset === 0 && faker.datatype.boolean(0.3)) {
      status = 'in-progress';
      actualStart = new Date(scheduledStart);
      evvData = {
        clock_in_gps: { lat: client.latitude, lng: client.longitude },
        verification_method: 'biometric',
      };
    }

    const visit = await db('visits').insert({
      client_id: client.id,
      caregiver_id: caregiver.id,
      scheduled_start: scheduledStart,
      scheduled_end: scheduledEnd,
      actual_start: actualStart,
      actual_end: actualEnd,
      status,
      evv_data: evvData,
      visit_notes: status === 'completed' ? faker.helpers.arrayElement([
        'Patient in good spirits. All tasks completed as planned.',
        'Assisted with morning routine. Client requested extra help with mobility.',
        'Medication administered on schedule. Vital signs normal.',
        'Completed all ADLs. Client enjoyed conversation and socialization.',
      ]) : null,
      is_demo_data: true,
    }).returning('*');

    visits.push(visit[0]);
  }

  return visits;
}

async function seedFamilyEngagement(db: Knex, clients: any[], users: any) {
  // Create family members for 60% of clients
  for (const client of clients.slice(0, Math.floor(clients.length * 0.6))) {
    const firstName = faker.person.firstName();
    const lastName = client.last_name; // Same last name as client
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();

    const familyUser = await db('users').insert({
      email,
      password_hash: await hashPassword('Demo2024!'),
      first_name: firstName,
      last_name: lastName,
      role: 'family',
      is_active: true,
      is_demo_data: true,
    }).returning('*');

    const familyMember = await db('family_members').insert({
      user_id: familyUser[0].id,
      client_id: client.id,
      relationship: faker.helpers.arrayElement(['daughter', 'son', 'spouse', 'sibling']),
      phone: faker.phone.number('###-###-####'),
      email,
      is_primary_contact: true,
      notification_preferences: {
        email_enabled: true,
        sms_enabled: true,
        visit_updates: true,
        care_plan_changes: true,
        emergency_alerts: true,
      },
      is_demo_data: true,
    }).returning('*');

    // Create some messages
    await db('messages').insert([
      {
        sender_id: familyUser[0].id,
        recipient_id: users.coordinators[0][0].id,
        subject: 'Question about care schedule',
        body: `Hi, I was wondering if we could adjust ${client.first_name}'s care schedule for next week?`,
        created_at: faker.date.recent({ days: 5 }),
        is_demo_data: true,
      },
      {
        sender_id: users.coordinators[0][0].id,
        recipient_id: familyUser[0].id,
        subject: 'Re: Question about care schedule',
        body: 'Absolutely! I\'ll give you a call tomorrow to discuss the best times.',
        created_at: faker.date.recent({ days: 4 }),
        is_demo_data: true,
      }
    ]);
  }
}

async function seedBillingData(db: Knex, visits: any[]) {
  // Generate invoices for completed visits
  const completedVisits = visits.filter(v => v.status === 'completed');

  // Group by client and create invoices
  const visitsByClient = {};
  for (const visit of completedVisits) {
    if (!visitsByClient[visit.client_id]) {
      visitsByClient[visit.client_id] = [];
    }
    visitsByClient[visit.client_id].push(visit);
  }

  for (const [clientId, clientVisits] of Object.entries(visitsByClient)) {
    const totalHours = clientVisits.reduce((sum, v) => {
      const hours = (new Date(v.actual_end) - new Date(v.actual_start)) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    const ratePerHour = 25.00;
    const totalAmount = totalHours * ratePerHour;

    await db('invoices').insert({
      client_id: clientId,
      invoice_date: faker.date.recent({ days: 7 }),
      due_date: faker.date.soon({ days: 30 }),
      total_amount: totalAmount,
      status: faker.helpers.arrayElement(['draft', 'sent', 'paid']),
      line_items: clientVisits.map(v => ({
        visit_id: v.id,
        description: 'Personal Care Services',
        hours: (new Date(v.actual_end) - new Date(v.actual_start)) / (1000 * 60 * 60),
        rate: ratePerHour,
        amount: ((new Date(v.actual_end) - new Date(v.actual_start)) / (1000 * 60 * 60)) * ratePerHour,
      })),
      is_demo_data: true,
    });
  }
}
```

### One-Command Execution

**package.json:**
```json
{
  "scripts": {
    "showcase:seed": "ts-node packages/showcase/seed/seed-demo-data.ts",
    "showcase:reset": "ts-node packages/showcase/seed/seed-demo-data.ts --reset --scale=medium"
  }
}
```

---

## Deliverable 2: Interactive Showcase Tours

### Guided Tour Implementation

Use a library like **Intro.js** or **Shepherd.js** for interactive tours.

**packages/web/src/showcase/tours/coordinator-tour.ts:**

```typescript
import Shepherd from 'shepherd.js';

export function startCoordinatorTour() {
  const tour = new Shepherd.Tour({
    useModalOverlay: true,
    defaultStepOptions: {
      classes: 'shadow-md bg-purple-dark',
      scrollTo: true
    }
  });

  tour.addStep({
    id: 'welcome',
    text: '<h3>Welcome to Care Commons!</h3><p>Let\'s take a quick tour of the coordinator dashboard.</p>',
    buttons: [
      { text: 'Start Tour', action: tour.next },
      { text: 'Skip', action: tour.cancel }
    ]
  });

  tour.addStep({
    id: 'dashboard',
    text: '<p>This is your daily dashboard. You can see today\'s visits at a glance.</p>',
    attachTo: { element: '.dashboard-overview', on: 'bottom' },
    buttons: [
      { text: 'Back', action: tour.back },
      { text: 'Next', action: tour.next }
    ]
  });

  tour.addStep({
    id: 'scheduling',
    text: '<p>Use the shift matching feature to find the best caregiver for each visit.</p>',
    attachTo: { element: '.shift-matching-button', on: 'right' },
    buttons: [
      { text: 'Back', action: tour.back },
      { text: 'Next', action: tour.next }
    ]
  });

  tour.addStep({
    id: 'complete',
    text: '<p>You\'re all set! Explore the platform and try scheduling a visit.</p>',
    buttons: [
      { text: 'Finish', action: tour.complete }
    ]
  });

  tour.start();
}
```

---

## Deliverable 3: Enhanced Showcase Landing Page

**packages/showcase/src/pages/index.tsx:**

```tsx
export default function ShowcaseLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="py-8">
        <h1 className="text-5xl font-bold text-center text-gray-900">
          Care Commons Interactive Demo
        </h1>
        <p className="mt-4 text-xl text-center text-gray-600">
          Explore the platform from different user perspectives
        </p>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-semibold mb-8">Choose Your Role:</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PersonaCard
            title="Administrator"
            description="Manage agency operations, compliance, and finances"
            icon={<AdminIcon />}
            loginEmail="admin@demo.care-commons.local"
            password="Demo2024!"
            features={[
              'Dashboard analytics',
              'Compliance reporting',
              'User management',
              'Billing overview'
            ]}
          />

          <PersonaCard
            title="Coordinator"
            description="Schedule visits, manage caregivers and clients"
            icon={<CoordinatorIcon />}
            loginEmail="emily.rodriguez@demo"
            password="Demo2024!"
            features={[
              'Shift matching',
              'Daily scheduling',
              'Care plan management',
              'Family communication'
            ]}
          />

          <PersonaCard
            title="Caregiver"
            description="Complete visits, document care via mobile app"
            icon={<CaregiverIcon />}
            mobileOnly={true}
            qrCode="<QR code for mobile app>"
            features={[
              'Today\'s schedule',
              'GPS clock-in/out',
              'Task completion',
              'Visit documentation'
            ]}
          />

          <PersonaCard
            title="Family"
            description="Monitor loved one's care and communicate"
            icon={<FamilyIcon />}
            loginEmail="family-demo@care-commons.local"
            password="Demo2024!"
            features={[
              'Visit updates',
              'Care progress',
              'Messaging',
              'Notifications'
            ]}
          />
        </div>
      </section>

      <section className="bg-blue-600 text-white py-16 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Deploy Your Own?</h2>
          <p className="text-xl mb-8">
            Care Commons is self-hostable and production-ready.
          </p>
          <a
            href="/docs/deployment"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100"
          >
            View Deployment Guide
          </a>
        </div>
      </section>
    </div>
  );
}
```

---

## Success Criteria

- [ ] Seed script creates realistic demo data in <2 minutes
- [ ] Demo includes 50+ clients, 30+ caregivers, 500+ visits
- [ ] All personas have pre-configured accounts
- [ ] Interactive tours guide new users through key workflows
- [ ] Showcase landing page clearly explains each persona
- [ ] Demo data showcases all major features
- [ ] Data resets daily for fresh demo experience
- [ ] First-time users can evaluate platform without manual setup

---

## Related Tasks

- Task 0074: End-to-End User Journey Validation (uses this demo data)
- Task 0062: Showcase Demo Enhancement (related)
- Task 0079: Administrator Quick Start Guide
- Task 0080: Coordinator Quick Start Guide
