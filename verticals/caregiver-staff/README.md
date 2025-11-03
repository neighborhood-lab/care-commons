# Caregiver & Staff Management

> Secure directory of personnel providing care services

The **Caregiver & Staff Management** vertical provides comprehensive
functionality for managing caregivers, field staff, and administrative personnel
within home-based care organizations. It tracks credentials, availability,
compliance, and performance while enabling intelligent matching for shift
assignments.

## Features

### Core Functionality

- **Personnel Directory** - Centralized database of all caregivers and staff
  members
- **Credential Management** - Track certifications, licenses, and expiration
  dates
- **Compliance Tracking** - Background checks, drug screenings, health
  screenings
- **Training Records** - Document orientation, mandatory training, and
  continuing education
- **Availability Management** - Weekly schedules, blackout dates, and shift
  preferences
- **Skills & Specializations** - Track clinical skills, language proficiency,
  and specialized care capabilities
- **Performance Management** - Ratings, reviews, and reliability scoring
- **Compensation** - Pay rates, overtime rules, and payroll integration
- **Branch Assignment** - Multi-branch support with primary and secondary
  assignments

### Compliance & Safety

- **Automated Expiration Tracking** - Alerts for credentials expiring within 30
  days
- **Compliance Status Calculation** - Real-time assessment based on credentials
  and checks
- **Restricted Assignments** - Prevent assignment to specific clients when
  necessary
- **Document Management** - Secure storage of licenses, certificates, and
  training records
- **Audit Trail** - Complete history of all changes for regulatory compliance

### Workforce Intelligence

- **Eligibility Checking** - Validate caregiver suitability for specific
  assignments
- **Reliability Scoring** - Calculated metric based on shift history
- **Skills Matching** - Match caregivers to client needs based on certifications
  and experience
- **Language Matching** - Connect clients with caregivers who speak their
  language
- **Distance Calculation** - Consider travel distance for scheduling efficiency

## Data Model

### Caregiver Entity

```typescript
interface Caregiver {
  // Identity
  id: UUID;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;

  // Organization
  organizationId: UUID;
  branchIds: UUID[];
  primaryBranchId: UUID;

  // Employment
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  hireDate: Date;
  role: CaregiverRole;

  // Credentials & Compliance
  credentials: Credential[];
  backgroundCheck: BackgroundCheck;
  drugScreening: DrugScreening;
  healthScreening: HealthScreening;
  complianceStatus: ComplianceStatus;

  // Training & Skills
  training: TrainingRecord[];
  skills: Skill[];
  specializations: string[];
  languages: string[];

  // Availability
  availability: WeeklyAvailability;
  workPreferences: WorkPreferences;

  // Compensation
  payRate: PayRate;
  alternatePayRates: PayRate[];

  // Performance
  performanceRating: number;
  reliabilityScore: number;

  // Status
  status: CaregiverStatus;

  // Audit fields
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number;
}
```

### Credential Types

- **CNA** - Certified Nursing Assistant
- **HHA** - Home Health Aide
- **PCA** - Personal Care Aide
- **RN** - Registered Nurse
- **LPN** - Licensed Practical Nurse
- **CPR** - CPR Certification
- **First Aid** - First Aid Certification
- **Driver's License** - Valid driver's license
- **Vehicle Insurance** - Auto insurance
- **TB Test** - Tuberculosis test
- **Immunizations** - Vaccination records
- **Medication Administration** - Medication management certification
- **Dementia Care** - Specialized dementia training

### Employment Types

- **Full-Time** - 40+ hours/week
- **Part-Time** - Less than 40 hours/week
- **Per Diem** - On-call, as-needed
- **Contract** - Fixed-term contract
- **Temporary** - Short-term assignment
- **Seasonal** - Seasonal employment

### Caregiver Roles

- **Caregiver** - Basic personal care
- **Senior Caregiver** - Experienced caregiver with additional responsibilities
- **Certified Nursing Assistant (CNA)** - State-certified nursing assistant
- **Home Health Aide (HHA)** - Certified home health aide
- **Personal Care Aide (PCA)** - Personal care provider
- **Companion** - Companionship services
- **Registered Nurse (RN)** - Licensed RN
- **Licensed Practical Nurse (LPN)** - Licensed LPN
- **Therapist** - PT, OT, ST
- **Coordinator** - Care coordination
- **Supervisor** - Field supervisor
- **Scheduler** - Scheduling staff
- **Administrative** - Office staff

### Status Lifecycle

```
APPLICATION → INTERVIEWING → PENDING_ONBOARDING → ONBOARDING → ACTIVE
                                                                  ↓
                                     RETIRED ← TERMINATED ← SUSPENDED
                                                   ↓
                                              INACTIVE
                                                   ↓
                                              ON_LEAVE
```

## Usage

### Creating a Caregiver

```typescript
import { CaregiverService } from '@care-commons/caregiver-staff';
import { Database } from '@care-commons/core';

const db = new Database(config);
const caregiverService = new CaregiverService(db);

const caregiver = await caregiverService.createCaregiver(
  {
    organizationId: 'org-123',
    branchIds: ['branch-1', 'branch-2'],
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
    emergencyContacts: [
      {
        id: uuid(),
        name: 'John Smith',
        relationship: 'Spouse',
        phone: {
          number: '+12065555678',
          type: 'MOBILE',
          canReceiveSMS: true,
        },
        isPrimary: true,
      },
    ],
    employmentType: 'FULL_TIME',
    hireDate: new Date(),
    role: 'HOME_HEALTH_AIDE',
    payRate: {
      id: uuid(),
      rateType: 'BASE',
      amount: 22.5,
      unit: 'HOURLY',
      effectiveDate: new Date(),
    },
  },
  userContext
);
```

### Searching Caregivers

```typescript
const results = await caregiverService.searchCaregivers(
  {
    query: 'smith',
    organizationId: 'org-123',
    branchId: 'branch-1',
    status: ['ACTIVE'],
    complianceStatus: ['COMPLIANT'],
    languages: ['Spanish'],
    skills: ['Dementia Care'],
  },
  {
    page: 1,
    limit: 20,
  },
  userContext
);

console.log(`Found ${results.total} caregivers`);
results.items.forEach((caregiver) => {
  console.log(
    `${caregiver.employeeNumber}: ${caregiver.firstName} ${caregiver.lastName}`
  );
});
```

### Checking Assignment Eligibility

```typescript
const eligibility = await caregiverService.checkEligibilityForAssignment(
  'caregiver-123',
  'client-456',
  new Date('2024-01-15'),
  userContext
);

if (!eligibility.isEligible) {
  console.log('Cannot assign caregiver:');
  eligibility.reasons.forEach((reason) => {
    console.log(`- [${reason.severity}] ${reason.message}`);
  });
}
```

### Finding Expiring Credentials

```typescript
const caregivers = await caregiverService.getCaregiversWithExpiringCredentials(
  'org-123',
  30, // days until expiration
  userContext
);

caregivers.forEach((caregiver) => {
  const expiringCreds = caregiver.credentials.filter(
    (c) =>
      c.expirationDate &&
      new Date(c.expirationDate) <=
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  );

  console.log(
    `${caregiver.employeeNumber}: ${caregiver.firstName} ${caregiver.lastName}`
  );
  expiringCreds.forEach((cred) => {
    console.log(`  - ${cred.name} expires ${cred.expirationDate}`);
  });
});
```

### Finding Available Caregivers

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
```

## Database Schema

The vertical uses a single `caregivers` table with JSONB columns for flexible
nested data:

- **credentials** - Array of credential objects with expiration tracking
- **training** - Array of training records
- **skills** - Array of skill objects with proficiency levels
- **availability** - Weekly schedule with time slots
- **work_preferences** - Shift and location preferences
- **pay_rate** - Current pay rate details
- **alternate_pay_rates** - Service-specific rates

### Key Indexes

- Full-text search on name and employee number
- GIN indexes on JSONB columns for efficient queries
- Partial indexes for common filters (active, compliant)
- Array indexes for languages, specializations

### Triggers

- **update_updated_at** - Automatically updates timestamp on modification
- **check_credential_expiration** - Updates compliance status when credentials
  change

## Permissions

The vertical respects role-based access control:

- **caregivers:create** - Create new caregiver records
- **caregivers:read** - View caregiver information
- **caregivers:update** - Modify caregiver records
- **caregivers:delete** - Soft-delete caregivers
- **caregivers:read:sensitive** - View SSN, DOB, pay rates (HR only)

## Integration Points

This vertical integrates with:

- **Client & Demographics** - Match caregivers to client needs
- **Scheduling & Visit Management** - Assign caregivers to shifts
- **Time Tracking & EVV** - Record worked hours
- **Payroll Processing** - Calculate compensation
- **Training & Certification Tracking** - Manage training requirements
- **Compliance & Documentation** - Regulatory reporting

## Compliance Features

- **Automated credential expiration tracking**
- **Background check status monitoring**
- **Drug screening verification**
- **Health screening and immunization tracking**
- **TB test compliance**
- **Complete audit trail for all changes**
- **Document retention and versioning**

## Best Practices

1. **Keep credentials current** - Set up automated alerts for expiring
   credentials
2. **Regular compliance checks** - Run weekly reports on compliance status
3. **Document everything** - Upload copies of all certificates and licenses
4. **Update availability** - Keep caregiver schedules current for accurate
   matching
5. **Performance reviews** - Conduct regular reviews and update ratings
6. **Training documentation** - Record all orientation and continuing education
7. **Restrict thoughtfully** - Use client restrictions only when necessary and
   document reasons

## Future Enhancements

- [ ] Mobile app for caregivers to update availability
- [ ] Automated credential renewal reminders via SMS/email
- [ ] Integration with background check providers
- [ ] Skills gap analysis and training recommendations
- [ ] Predictive availability based on historical patterns
- [ ] Geographic clustering for efficient scheduling
- [ ] Integration with payroll providers (ADP, Gusto, etc.)
- [ ] Digital signature capture for onboarding documents
- [ ] Video interview scheduling and recording
- [ ] Reference check workflow

## Support

For questions or issues with the Caregiver & Staff Management vertical:

- Open an issue on GitHub
- Check the [documentation](https://docs.care-commons.org)
- Join our community discussions

---

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
