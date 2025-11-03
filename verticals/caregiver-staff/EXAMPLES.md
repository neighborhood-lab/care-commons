# Caregiver & Staff Management - Usage Examples

This document provides practical examples for using the Caregiver & Staff
Management vertical.

## Table of Contents

- [Basic Setup](#basic-setup)
- [Creating Caregivers](#creating-caregivers)
- [Searching and Filtering](#searching-and-filtering)
- [Managing Credentials](#managing-credentials)
- [Availability and Scheduling](#availability-and-scheduling)
- [Compliance Management](#compliance-management)
- [Using Utility Functions](#using-utility-functions)

## Basic Setup

```typescript
import { initializeDatabase } from '@care-commons/core';
import {
  CaregiverService,
  CaregiverRepository,
} from '@care-commons/caregiver-staff';

// Initialize database connection
const db = initializeDatabase({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Create service instance
const caregiverService = new CaregiverService(db);

// User context for authorization
const userContext = {
  userId: 'user-123',
  organizationId: 'org-456',
  branchIds: ['branch-789'],
  roles: ['COORDINATOR'],
  permissions: ['caregivers:read', 'caregivers:create', 'caregivers:update'],
};
```

## Creating Caregivers

### Example 1: Create a Full-Time CNA

```typescript
import { v4 as uuidv4 } from 'uuid';

const newCaregiver = await caregiverService.createCaregiver(
  {
    organizationId: 'org-456',
    branchIds: ['branch-789'],
    primaryBranchId: 'branch-789',
    firstName: 'Sarah',
    middleName: 'Marie',
    lastName: 'Johnson',
    preferredName: 'Sarah',
    dateOfBirth: new Date('1985-04-12'),
    primaryPhone: {
      number: '555-1234',
      type: 'MOBILE',
      canReceiveSMS: true,
    },
    email: 'sarah.johnson@example.com',
    primaryAddress: {
      type: 'HOME',
      line1: '123 Main Street',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62701',
      country: 'US',
    },
    emergencyContacts: [
      {
        id: uuidv4(),
        name: 'Michael Johnson',
        relationship: 'Spouse',
        phone: {
          number: '555-5678',
          type: 'MOBILE',
          canReceiveSMS: true,
        },
        isPrimary: true,
      },
    ],
    employmentType: 'FULL_TIME',
    hireDate: new Date(),
    role: 'CERTIFIED_NURSING_ASSISTANT',
    payRate: {
      id: uuidv4(),
      rateType: 'BASE',
      amount: 18.5,
      unit: 'HOURLY',
      effectiveDate: new Date(),
      overtimeMultiplier: 1.5,
      weekendMultiplier: 1.2,
      holidayMultiplier: 1.5,
    },
  },
  userContext
);

console.log(`Created caregiver: ${newCaregiver.employeeNumber}`);
```

### Example 2: Create a Part-Time Companion

```typescript
const companionCaregiver = await caregiverService.createCaregiver(
  {
    organizationId: 'org-456',
    branchIds: ['branch-789'],
    primaryBranchId: 'branch-789',
    firstName: 'Maria',
    lastName: 'Garcia',
    dateOfBirth: new Date('1978-11-30'),
    primaryPhone: {
      number: '555-9876',
      type: 'MOBILE',
      canReceiveSMS: true,
    },
    email: 'maria.garcia@example.com',
    primaryAddress: {
      type: 'HOME',
      line1: '456 Oak Avenue',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62702',
      country: 'US',
    },
    emergencyContacts: [
      {
        id: uuidv4(),
        name: 'Roberto Garcia',
        relationship: 'Spouse',
        phone: { number: '555-4321', type: 'MOBILE', canReceiveSMS: true },
        isPrimary: true,
      },
    ],
    employmentType: 'PART_TIME',
    hireDate: new Date(),
    role: 'COMPANION',
    payRate: {
      id: uuidv4(),
      rateType: 'BASE',
      amount: 15.0,
      unit: 'HOURLY',
      effectiveDate: new Date(),
    },
    status: 'ONBOARDING',
  },
  userContext
);
```

## Searching and Filtering

### Example 3: Find Active Caregivers in a Branch

```typescript
const activeCaregivers = await caregiverService.searchCaregivers(
  {
    branchId: 'branch-789',
    status: ['ACTIVE'],
    complianceStatus: ['COMPLIANT'],
  },
  { page: 1, limit: 20 },
  userContext
);

console.log(`Found ${activeCaregivers.total} active caregivers`);
activeCaregivers.items.forEach((cg) => {
  console.log(`  - ${cg.firstName} ${cg.lastName} (${cg.employeeNumber})`);
});
```

### Example 4: Find Caregivers with Specific Skills

```typescript
const dementiaCaregivers = await caregiverService.searchCaregivers(
  {
    organizationId: 'org-456',
    status: ['ACTIVE'],
    skills: ['Dementia Care'],
    complianceStatus: ['COMPLIANT'],
  },
  { page: 1, limit: 50 },
  userContext
);
```

### Example 5: Find Bilingual Caregivers

```typescript
import { filterByLanguages } from '@care-commons/caregiver-staff';

const allCaregivers = await caregiverService.searchCaregivers(
  { organizationId: 'org-456', status: ['ACTIVE'] },
  { page: 1, limit: 100 },
  userContext
);

const spanishSpeakers = filterByLanguages(allCaregivers.items, ['Spanish']);
console.log(`Found ${spanishSpeakers.length} Spanish-speaking caregivers`);
```

### Example 6: Find Available Caregivers for Weekend Shifts

```typescript
const weekendCaregivers = await caregiverService.findAvailableForShift(
  'org-456',
  'branch-789',
  'saturday',
  '08:00',
  '16:00',
  userContext
);

console.log(
  `${weekendCaregivers.length} caregivers available for Saturday 8am-4pm`
);
```

## Managing Credentials

### Example 7: Add Credentials to a Caregiver

```typescript
import {
  getExpiredCredentials,
  getExpiringCredentials,
} from '@care-commons/caregiver-staff';

const caregiver = await caregiverService.getCaregiverById(
  'cg-123',
  userContext
);

// Add new credentials
const updatedCaregiver = await caregiverService.updateCaregiver(
  'cg-123',
  {
    credentials: [
      ...caregiver.credentials,
      {
        id: uuidv4(),
        type: 'CPR',
        name: 'CPR & AED Certification',
        number: 'CPR789012',
        issuingAuthority: 'American Heart Association',
        issueDate: new Date(),
        expirationDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000), // 2 years
        status: 'ACTIVE',
      },
    ],
  },
  userContext
);
```

### Example 8: Find Caregivers with Expiring Credentials

```typescript
const expiringCredentials =
  await caregiverService.getCaregiversWithExpiringCredentials(
    'org-456',
    30, // 30 days
    userContext
  );

console.log(
  `${expiringCredentials.length} caregivers have credentials expiring soon:`
);
expiringCredentials.forEach((cg) => {
  const expiring = getExpiringCredentials(cg, 30);
  console.log(`  - ${cg.firstName} ${cg.lastName}:`);
  expiring.forEach((cred) => {
    console.log(`    • ${cred.name} expires ${cred.expirationDate}`);
  });
});
```

## Availability and Scheduling

### Example 9: Update Caregiver Availability

```typescript
await caregiverService.updateCaregiver(
  'cg-123',
  {
    availability: {
      schedule: {
        monday: {
          available: true,
          timeSlots: [{ startTime: '08:00', endTime: '17:00' }],
        },
        tuesday: {
          available: true,
          timeSlots: [{ startTime: '08:00', endTime: '17:00' }],
        },
        wednesday: {
          available: true,
          timeSlots: [{ startTime: '08:00', endTime: '17:00' }],
        },
        thursday: {
          available: true,
          timeSlots: [{ startTime: '08:00', endTime: '17:00' }],
        },
        friday: {
          available: true,
          timeSlots: [{ startTime: '08:00', endTime: '17:00' }],
        },
        saturday: { available: false },
        sunday: { available: false },
      },
      lastUpdated: new Date(),
    },
    workPreferences: {
      preferredShiftTypes: ['MORNING', 'AFTERNOON'],
      willingToWorkWeekends: false,
      willingToWorkHolidays: true,
    },
  },
  userContext
);
```

### Example 10: Add Blackout Dates

```typescript
const caregiver = await caregiverService.getCaregiverById(
  'cg-123',
  userContext
);

await caregiverService.updateCaregiver(
  'cg-123',
  {
    availability: {
      ...caregiver.availability,
      blackoutDates: [
        {
          startDate: new Date('2024-12-20'),
          endDate: new Date('2024-12-27'),
          reason: 'Holiday vacation',
        },
      ],
    },
  },
  userContext
);
```

## Compliance Management

### Example 11: Check Assignment Eligibility

```typescript
import {
  canBeAssignedToVisits,
  getAssignmentBlockers,
} from '@care-commons/caregiver-staff';

const caregiver = await caregiverService.getCaregiverById(
  'cg-123',
  userContext
);

if (canBeAssignedToVisits(caregiver)) {
  console.log('Caregiver is eligible for assignments');
} else {
  const blockers = getAssignmentBlockers(caregiver);
  console.log('Caregiver cannot be assigned:');
  blockers.forEach((blocker) => console.log(`  - ${blocker}`));
}
```

### Example 12: Check Detailed Eligibility for Specific Assignment

```typescript
const eligibility = await caregiverService.checkEligibilityForAssignment(
  'cg-123',
  'client-456',
  new Date(),
  userContext
);

console.log(`Eligible: ${eligibility.isEligible}`);
eligibility.reasons.forEach((reason) => {
  console.log(`  [${reason.severity}] ${reason.message}`);
});
```

### Example 13: Update Compliance Status

```typescript
const updatedCaregiver = await caregiverService.updateComplianceStatus(
  'cg-123',
  userContext
);

console.log(`Compliance status: ${updatedCaregiver.complianceStatus}`);
```

## Using Utility Functions

### Example 14: Display Caregiver Information

```typescript
import {
  getFullName,
  formatPhoneNumber,
  formatYearsOfService,
  getStatusDisplay,
  getComplianceStatusDisplay,
  calculateTotalTrainingHours,
} from '@care-commons/caregiver-staff';

const caregiver = await caregiverService.getCaregiverById(
  'cg-123',
  userContext
);

console.log('Caregiver Profile:');
console.log(`  Name: ${getFullName(caregiver, { includeMiddle: true })}`);
console.log(`  Phone: ${formatPhoneNumber(caregiver.primaryPhone)}`);
console.log(`  Email: ${caregiver.email}`);
console.log(`  Employee #: ${caregiver.employeeNumber}`);
console.log(`  Years of Service: ${formatYearsOfService(caregiver.hireDate)}`);

const statusDisplay = getStatusDisplay(caregiver.status);
console.log(`  Status: ${statusDisplay.label} (${statusDisplay.description})`);

const complianceDisplay = getComplianceStatusDisplay(
  caregiver.complianceStatus
);
console.log(
  `  Compliance: ${complianceDisplay.icon} ${complianceDisplay.label}`
);

const trainingHours = calculateTotalTrainingHours(caregiver);
console.log(`  Total Training Hours: ${trainingHours}`);
```

### Example 15: Check Skills and Qualifications

```typescript
import { hasSkill, hasActiveCredentials } from '@care-commons/caregiver-staff';

const caregiver = await caregiverService.getCaregiverById(
  'cg-123',
  userContext
);

// Check for specific skills
if (hasSkill(caregiver, 'Dementia Care', 'ADVANCED')) {
  console.log('Has advanced dementia care skills');
}

// Check for required credentials
const hasCNA = hasActiveCredentials(caregiver, ['CNA']);
const hasCPR = hasActiveCredentials(caregiver, ['CPR']);

if (hasCNA && hasCPR) {
  console.log('Has all required credentials');
}
```

### Example 16: Sort and Filter Caregivers

```typescript
import {
  compareCaregivers,
  filterByShiftPreference,
} from '@care-commons/caregiver-staff';

const caregivers = await caregiverService.searchCaregivers(
  { organizationId: 'org-456', status: ['ACTIVE'] },
  { page: 1, limit: 100 },
  userContext
);

// Sort by reliability
const sorted = [...caregivers.items].sort((a, b) =>
  compareCaregivers(a, b, 'reliability')
);

console.log('Top 5 most reliable caregivers:');
sorted.slice(0, 5).forEach((cg, index) => {
  console.log(
    `  ${index + 1}. ${getFullName(cg)} - Score: ${cg.reliabilityScore}`
  );
});

// Filter by shift preference
const morningPreference = filterByShiftPreference(caregivers.items, 'MORNING');
console.log(`${morningPreference.length} prefer morning shifts`);
```

### Example 17: Generate Caregiver Report

```typescript
import {
  getFullName,
  formatYearsOfService,
  calculateTotalTrainingHours,
  getCompletedTraining,
  hasActiveCredentials,
} from '@care-commons/caregiver-staff';

const caregivers = await caregiverService.searchCaregivers(
  { organizationId: 'org-456', status: ['ACTIVE'] },
  { page: 1, limit: 100 },
  userContext
);

console.log('Caregiver Summary Report');
console.log('========================\n');

caregivers.items.forEach((cg) => {
  const trainings = getCompletedTraining(cg);
  const trainingHours = calculateTotalTrainingHours(cg);
  const activeCreds = cg.credentials.filter((c) => c.status === 'ACTIVE');

  console.log(`${getFullName(cg)} (${cg.employeeNumber})`);
  console.log(`  Role: ${cg.role}`);
  console.log(`  Service: ${formatYearsOfService(cg.hireDate)}`);
  console.log(`  Credentials: ${activeCreds.length} active`);
  console.log(
    `  Training: ${trainings.length} completed (${trainingHours} hours)`
  );
  console.log(`  Languages: ${cg.languages?.join(', ') || 'English'}`);
  console.log(`  Reliability: ${(cg.reliabilityScore || 0) * 100}%`);
  console.log();
});
```

## Integration Examples

### Example 18: Batch Import Caregivers

```typescript
import { readFile } from 'fs/promises';
import { parse } from 'csv-parse/sync';

async function importCaregiversFromCSV(filePath: string) {
  const csvContent = await readFile(filePath, 'utf-8');
  const records = parse(csvContent, { columns: true });

  for (const record of records) {
    try {
      await caregiverService.createCaregiver(
        {
          organizationId: record.organizationId,
          branchIds: [record.branchId],
          primaryBranchId: record.branchId,
          firstName: record.firstName,
          lastName: record.lastName,
          dateOfBirth: new Date(record.dateOfBirth),
          primaryPhone: {
            number: record.phone,
            type: 'MOBILE',
            canReceiveSMS: true,
          },
          email: record.email,
          primaryAddress: JSON.parse(record.address),
          emergencyContacts: JSON.parse(record.emergencyContacts),
          employmentType: record.employmentType as any,
          hireDate: new Date(record.hireDate),
          role: record.role as any,
          payRate: JSON.parse(record.payRate),
        },
        userContext
      );
      console.log(`✓ Imported ${record.firstName} ${record.lastName}`);
    } catch (error) {
      console.error(
        `✗ Failed to import ${record.firstName} ${record.lastName}:`,
        error
      );
    }
  }
}
```

### Example 19: Automated Compliance Monitoring

```typescript
async function monitorComplianceDaily() {
  // Find caregivers with expiring credentials
  const expiring = await caregiverService.getCaregiversWithExpiringCredentials(
    'org-456',
    30,
    userContext
  );

  // Send notifications
  for (const caregiver of expiring) {
    const expiringCreds = getExpiringCredentials(caregiver, 30);
    console.log(
      `Alert: ${getFullName(caregiver)} has ${expiringCreds.length} credential(s) expiring soon`
    );
    // TODO: Send email/SMS notification
  }

  // Find non-compliant caregivers
  const nonCompliant = await caregiverService.getCaregiversByComplianceStatus(
    'org-456',
    ['EXPIRED', 'NON_COMPLIANT'],
    userContext
  );

  console.log(`${nonCompliant.length} caregivers require immediate attention`);
}
```

See [README.md](./README.md) for more information about the Caregiver & Staff
Management vertical.
