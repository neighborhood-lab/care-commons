# Client & Demographics Management

> Foundational record system for individuals receiving care — identity, contact
> structure, authorized contacts, program enrollment, service eligibility, risk
> flags, residence location(s), basic documentation, and lifecycle status.

## Features

### Core Capabilities

- **Client Identity Management** - Comprehensive demographic and identity
  information
- **Contact Management** - Emergency contacts and authorized contacts with
  granular permissions
- **Address Management** - Primary and secondary addresses with geolocation
  support
- **Healthcare Information** - Primary physician, pharmacy, insurance details
- **Program Enrollment** - Track multiple program enrollments and service
  eligibility
- **Risk & Safety Flags** - Document and track safety concerns and risk factors
- **Lifecycle Management** - Track client status from inquiry through discharge
- **Full Audit Trail** - Complete history of all changes with user attribution

### Data Security

- **Encryption** - Sensitive data (SSN) encrypted at rest
- **Role-Based Access** - Granular permissions based on user role and
  organizational scope
- **Audit Logging** - All access and modifications tracked for compliance
- **Soft Deletes** - Data never truly deleted, can be recovered if needed

### Compliance Features

- **HIPAA Compliant** - Designed with healthcare privacy requirements in mind
- **Audit Trail** - Complete revision history for compliance reporting
- **Consent Management** - Track authorized contacts and their permissions
- **Data Validation** - Comprehensive input validation to ensure data quality

## Data Model

### Client Entity

```typescript
interface Client {
  // Identity
  id: UUID;
  organizationId: UUID;
  branchId: UUID;
  clientNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;

  // Contact
  primaryPhone?: Phone;
  email?: string;
  primaryAddress: Address;

  // Healthcare
  primaryPhysician?: HealthcareProvider;
  pharmacy?: Pharmacy;
  insurance?: Insurance[];

  // Service
  programs: ProgramEnrollment[];
  serviceEligibility: ServiceEligibility;
  riskFlags: RiskFlag[];

  // Status
  status: ClientStatus;
  intakeDate?: Date;

  // Audit
  createdAt: Timestamp;
  createdBy: UUID;
  updatedAt: Timestamp;
  updatedBy: UUID;
  version: number;
}
```

### Client Statuses

- `INQUIRY` - Initial contact, not yet client
- `PENDING_INTAKE` - Intake process in progress
- `ACTIVE` - Actively receiving services
- `INACTIVE` - Temporarily not receiving services
- `ON_HOLD` - Services paused
- `DISCHARGED` - No longer receiving services
- `DECEASED` - Client deceased

### Risk Flags

Track safety and care concerns:

- `FALL_RISK` - High risk of falling
- `WANDERING` - Risk of wandering/elopement
- `AGGRESSIVE_BEHAVIOR` - May exhibit aggressive behavior
- `INFECTION` - Active or recurring infections
- `MEDICATION_COMPLIANCE` - Difficulty with medication adherence
- `DIETARY_RESTRICTION` - Special dietary requirements
- `ENVIRONMENTAL_HAZARD` - Hazards in living environment
- `SAFETY_CONCERN` - General safety concern
- `ABUSE_NEGLECT_CONCERN` - Suspected abuse or neglect
- `OTHER` - Other documented risk

## Usage

### Creating a Client

```typescript
import {
  ClientService,
  CreateClientInput,
} from '@care-commons/client-demographics';
import { UserContext } from '@care-commons/core';

const clientService = new ClientService(clientRepository);

const input: CreateClientInput = {
  organizationId: 'org-uuid',
  branchId: 'branch-uuid',
  firstName: 'Jane',
  lastName: 'Smith',
  dateOfBirth: new Date('1945-03-15'),
  primaryAddress: {
    type: 'HOME',
    line1: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    postalCode: '62701',
    country: 'US',
  },
  emergencyContacts: [
    {
      name: 'John Smith',
      relationship: 'Son',
      phone: { number: '555-0100', type: 'MOBILE', canReceiveSMS: true },
      isPrimary: true,
      canMakeHealthcareDecisions: true,
    },
  ],
  status: 'PENDING_INTAKE',
};

const context: UserContext = {
  userId: 'user-uuid',
  roles: ['COORDINATOR'],
  permissions: ['clients:create'],
  organizationId: 'org-uuid',
  branchIds: ['branch-uuid'],
};

const client = await clientService.createClient(input, context);
```

### Searching Clients

```typescript
const results = await clientService.searchClients(
  {
    query: 'Smith',
    status: ['ACTIVE', 'PENDING_INTAKE'],
    branchId: 'branch-uuid',
  },
  { page: 1, limit: 20 },
  context
);

console.log(`Found ${results.total} clients`);
results.items.forEach((client) => {
  console.log(`${client.firstName} ${client.lastName} - ${client.status}`);
});
```

### Managing Emergency Contacts

```typescript
// Add emergency contact
await clientService.addEmergencyContact(
  clientId,
  {
    name: 'Mary Smith',
    relationship: 'Daughter',
    phone: { number: '555-0200', type: 'MOBILE', canReceiveSMS: true },
    isPrimary: false,
    canMakeHealthcareDecisions: true,
  },
  context
);

// Remove emergency contact
await clientService.removeEmergencyContact(clientId, contactId, context);
```

### Managing Risk Flags

```typescript
// Add risk flag
await clientService.addRiskFlag(
  clientId,
  {
    type: 'FALL_RISK',
    severity: 'HIGH',
    description: 'Client has history of falls, uses walker',
    mitigationPlan:
      'Non-slip mats installed, walker required for all ambulation',
    requiresAcknowledgment: true,
  },
  context
);

// Resolve risk flag
await clientService.resolveRiskFlag(clientId, flagId, context);
```

### Updating Client Status

```typescript
// Discharge client
await clientService.updateClientStatus(
  clientId,
  'DISCHARGED',
  'Moved to assisted living facility',
  context
);
```

## Permissions

### Required Permissions

- `clients:create` - Create new clients
- `clients:read` - View client information
- `clients:update` - Modify client information
- `clients:delete` - Soft delete clients

### Role-Based Access

- **SUPER_ADMIN** - Full access to all clients across all organizations
- **ORG_ADMIN** - Full access to clients within their organization
- **BRANCH_ADMIN** - Full access to clients within their assigned branches
- **COORDINATOR** - Read/write access to clients for scheduling and care
  coordination
- **SCHEDULER** - Read-only access for scheduling purposes
- **CAREGIVER** - Read-only access to assigned clients
- **FAMILY** - Read-only access to specific client (their family member)
- **BILLING** - Read access for billing purposes
- **AUDITOR** - Read-only access for compliance audits

## API Endpoints

See the [API Documentation](./docs/api.md) for complete endpoint reference.

### REST Endpoints

```
POST   /api/clients                  Create client
GET    /api/clients/:id              Get client by ID
GET    /api/clients/number/:number   Get client by client number
PUT    /api/clients/:id              Update client
DELETE /api/clients/:id              Soft delete client
GET    /api/clients/search           Search clients
GET    /api/clients/branch/:id       Get clients by branch

POST   /api/clients/:id/contacts/emergency    Add emergency contact
PUT    /api/clients/:id/contacts/emergency/:contactId    Update emergency contact
DELETE /api/clients/:id/contacts/emergency/:contactId    Remove emergency contact

POST   /api/clients/:id/risk-flags            Add risk flag
PUT    /api/clients/:id/risk-flags/:flagId    Resolve risk flag

PUT    /api/clients/:id/status                Update client status
```

## Database Schema

### clients table

```sql
CREATE TABLE clients (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    client_number VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,

    -- Contact information (JSONB)
    primary_phone JSONB,
    email VARCHAR(255),
    primary_address JSONB NOT NULL,

    -- Healthcare (JSONB)
    primary_physician JSONB,
    pharmacy JSONB,
    insurance JSONB,

    -- Service information (JSONB arrays)
    emergency_contacts JSONB NOT NULL DEFAULT '[]',
    programs JSONB NOT NULL DEFAULT '[]',
    risk_flags JSONB NOT NULL DEFAULT '[]',

    -- Service eligibility (JSONB)
    service_eligibility JSONB NOT NULL,

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_INTAKE',
    intake_date DATE,

    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMP,
    deleted_by UUID,

    CONSTRAINT unique_client_number UNIQUE (organization_id, client_number)
);
```

## Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage
```

## Migration

Migrations are located in `packages/core/migrations/`.

```bash
# Run migrations
npm run db:migrate

# Seed sample data
npm run db:seed
```

## Related Verticals

- **Caregiver & Staff Management** - Assign caregivers to clients
- **Scheduling & Visit Management** - Schedule visits for clients
- **Care Plans & Tasks** - Create care plans based on client needs
- **Billing & Invoicing** - Generate invoices based on client programs

## License

See [LICENSE](../../LICENSE) for details.
