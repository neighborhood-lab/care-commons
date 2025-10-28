# Caregiver & Staff Management - Quick Start

## Installation

```bash
# From project root
cd verticals/caregiver-staff
npm install
npm run build
```

## Run Database Migration

```bash
# From project root
cd packages/core
npm run db:migrate
```

This will create the `caregivers` table with all necessary indexes and triggers.

## Basic Usage

### 1. Initialize Database Connection

```typescript
import { Database, initializeDatabase } from '@care-commons/core';

const db = initializeDatabase({
  host: 'localhost',
  port: 5432,
  database: 'care_commons',
  user: 'postgres',
  password: 'your_password',
});
```

### 2. Create a Caregiver Service

```typescript
import { CaregiverService } from '@care-commons/caregiver-staff';

const caregiverService = new CaregiverService(db);
```

### 3. Create Your First Caregiver

```typescript
import { v4 as uuid } from 'uuid';

const userContext = {
  userId: 'admin-user-id',
  roles: ['ORG_ADMIN'],
  permissions: ['caregivers:create'],
  organizationId: 'org-123',
  branchIds: ['branch-1'],
};

const newCaregiver = await caregiverService.createCaregiver({
  organizationId: 'org-123',
  branchIds: ['branch-1'],
  primaryBranchId: 'branch-1',
  firstName: 'Jane',
  lastName: 'Smith',
  dateOfBirth: new Date('1985-05-15'),
  primaryPhone: {
    number: '+12065551234',
    type: 'MOBILE',
    canReceiveSMS: true,
  },
  email: 'jane.smith@example.com',
  primaryAddress: {
    type: 'HOME',
    line1: '123 Main St',
    city: 'Seattle',
    state: 'WA',
    postalCode: '98101',
    country: 'US',
  },
  emergencyContacts: [{
    id: uuid(),
    name: 'John Smith',
    relationship: 'Spouse',
    phone: {
      number: '+12065555678',
      type: 'MOBILE',
      canReceiveSMS: true,
    },
    isPrimary: true,
  }],
  employmentType: 'FULL_TIME',
  hireDate: new Date(),
  role: 'HOME_HEALTH_AIDE',
  payRate: {
    id: uuid(),
    rateType: 'BASE',
    amount: 22.50,
    unit: 'HOURLY',
    effectiveDate: new Date(),
  },
}, userContext);

console.log(`Created caregiver: ${newCaregiver.employeeNumber}`);
```

### 4. Search for Caregivers

```typescript
const results = await caregiverService.searchCaregivers({
  organizationId: 'org-123',
  status: ['ACTIVE'],
  complianceStatus: ['COMPLIANT'],
  languages: ['Spanish'],
}, {
  page: 1,
  limit: 20,
}, userContext);

console.log(`Found ${results.total} caregivers`);
```

### 5. Add Credentials

```typescript
const caregiver = await caregiverService.getCaregiverById(
  newCaregiver.id,
  userContext
);

await caregiverService.updateCaregiver(
  caregiver.id,
  {
    credentials: [
      {
        id: uuid(),
        type: 'HHA',
        name: 'Home Health Aide Certification',
        number: 'HHA-12345',
        issuingAuthority: 'State of Washington',
        issueDate: new Date('2023-01-15'),
        expirationDate: new Date('2025-01-15'),
        status: 'ACTIVE',
      },
      {
        id: uuid(),
        type: 'CPR',
        name: 'CPR Certification',
        issuingAuthority: 'American Red Cross',
        issueDate: new Date('2024-01-10'),
        expirationDate: new Date('2025-01-10'),
        status: 'ACTIVE',
      },
    ],
  },
  userContext
);
```

### 6. Set Availability

```typescript
await caregiverService.updateCaregiver(
  caregiver.id,
  {
    availability: {
      schedule: {
        monday: {
          available: true,
          timeSlots: [
            { startTime: '09:00', endTime: '17:00' }
          ],
        },
        tuesday: {
          available: true,
          timeSlots: [
            { startTime: '09:00', endTime: '17:00' }
          ],
        },
        wednesday: {
          available: true,
          timeSlots: [
            { startTime: '09:00', endTime: '17:00' }
          ],
        },
        thursday: {
          available: true,
          timeSlots: [
            { startTime: '09:00', endTime: '17:00' }
          ],
        },
        friday: {
          available: true,
          timeSlots: [
            { startTime: '09:00', endTime: '17:00' }
          ],
        },
        saturday: { available: false },
        sunday: { available: false },
      },
      lastUpdated: new Date(),
    },
  },
  userContext
);
```

### 7. Check Eligibility for Assignment

```typescript
const eligibility = await caregiverService.checkEligibilityForAssignment(
  caregiver.id,
  'client-456',
  new Date('2024-01-15'),
  userContext
);

if (eligibility.isEligible) {
  console.log('✅ Caregiver is eligible');
} else {
  console.log('❌ Caregiver is not eligible:');
  eligibility.reasons.forEach(reason => {
    console.log(`  - [${reason.severity}] ${reason.message}`);
  });
}
```

### 8. Find Caregivers with Expiring Credentials

```typescript
const expiring = await caregiverService.getCaregiversWithExpiringCredentials(
  'org-123',
  30, // days
  userContext
);

console.log(`${expiring.length} caregivers have credentials expiring soon`);

expiring.forEach(cg => {
  console.log(`\n${cg.employeeNumber}: ${cg.firstName} ${cg.lastName}`);
  
  const expiringCreds = cg.credentials.filter(c => 
    c.expirationDate && 
    new Date(c.expirationDate) <= new Date(Date.now() + 30*24*60*60*1000) &&
    new Date(c.expirationDate) >= new Date()
  );
  
  expiringCreds.forEach(cred => {
    console.log(`  ⚠️  ${cred.name} expires ${cred.expirationDate}`);
  });
});
```

## Common Operations

### Update Caregiver Status

```typescript
await caregiverService.updateCaregiver(
  caregiverId,
  { status: 'ON_LEAVE', statusReason: 'Medical leave' },
  userContext
);
```

### Add Skills

```typescript
await caregiverService.updateCaregiver(
  caregiverId,
  {
    skills: [
      {
        id: uuid(),
        name: 'Dementia Care',
        category: 'Specialized Care',
        proficiencyLevel: 'ADVANCED',
        certifiedDate: new Date(),
      },
      {
        id: uuid(),
        name: 'Medication Management',
        category: 'Clinical Skills',
        proficiencyLevel: 'INTERMEDIATE',
      },
    ],
  },
  userContext
);
```

### Find Available Caregivers for a Shift

```typescript
const available = await caregiverService.findAvailableForShift(
  'org-123',
  'branch-1',
  'monday',
  '09:00',
  '17:00',
  userContext
);

console.log(`${available.length} caregivers available`);
available.forEach(cg => {
  console.log(`- ${cg.employeeNumber}: ${cg.firstName} ${cg.lastName} (Reliability: ${cg.reliabilityScore})`);
});
```

## Permission Examples

### Org Admin (Full Access)

```typescript
const adminContext = {
  userId: 'admin-id',
  roles: ['ORG_ADMIN'],
  permissions: ['caregivers:*'],
  organizationId: 'org-123',
  branchIds: ['branch-1', 'branch-2'],
};

// Can do everything
const caregiver = await caregiverService.createCaregiver(data, adminContext);
```

### Coordinator (Read/Write, No Delete)

```typescript
const coordinatorContext = {
  userId: 'coord-id',
  roles: ['COORDINATOR'],
  permissions: ['caregivers:read', 'caregivers:update'],
  organizationId: 'org-123',
  branchIds: ['branch-1'],
};

// Can read and update, but not delete
```

### Scheduler (Read-Only)

```typescript
const schedulerContext = {
  userId: 'scheduler-id',
  roles: ['SCHEDULER'],
  permissions: ['caregivers:read'],
  organizationId: 'org-123',
  branchIds: ['branch-1'],
};

// Can search and view, but not modify
// Sensitive data (SSN, pay rate) is automatically filtered
```

## Error Handling

```typescript
import { 
  ValidationError, 
  PermissionError, 
  NotFoundError,
  ConflictError 
} from '@care-commons/core';

try {
  await caregiverService.createCaregiver(data, userContext);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.context);
  } else if (error instanceof PermissionError) {
    console.error('Permission denied:', error.message);
  } else if (error instanceof ConflictError) {
    console.error('Conflict:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Environment Variables

```env
# .env file
DB_HOST=localhost
DB_PORT=5432
DB_NAME=care_commons
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false
```

## Running Tests (When Available)

```bash
npm test
```

## TypeScript Support

The vertical is fully typed. Your IDE will provide:

- ✅ Auto-completion for all methods
- ✅ Type checking for all inputs
- ✅ Inline documentation
- ✅ Error detection

```typescript
// Your IDE will suggest all available fields
const caregiver = await caregiverService.createCaregiver({
  // Type-safe auto-completion here
  firstName: 'Jane',
  // ...
}, userContext);

// Access with confidence
console.log(caregiver.employeeNumber); // Type: string
console.log(caregiver.credentials);    // Type: Credential[]
console.log(caregiver.complianceStatus); // Type: ComplianceStatus
```

## Next Steps

1. ✅ Complete this quick start
2. 📖 Read the full [README](./README.md)
3. 🎯 Integrate with Scheduling vertical
4. 🔧 Build API endpoints
5. 🎨 Create admin UI
6. 📱 Build mobile app

## Support

- 📚 [Full Documentation](./README.md)
- 🏗️ [Implementation Details](./IMPLEMENTATION.md)
- 🐛 [Report Issues](https://github.com/neighborhood-lab/care-commons/issues)

---

**Happy Coding!** 🎉

Built with ❤️ by Neighborhood Lab
