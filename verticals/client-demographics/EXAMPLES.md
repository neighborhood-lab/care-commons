# Client & Demographics - Usage Examples

This document provides practical examples for common operations in the Client & Demographics Management vertical.

## Table of Contents

1. [Setup](#setup)
2. [Creating Clients](#creating-clients)
3. [Searching & Filtering](#searching--filtering)
4. [Managing Contacts](#managing-contacts)
5. [Risk Management](#risk-management)
6. [Status Management](#status-management)
7. [Utility Functions](#utility-functions)
8. [API Usage](#api-usage)
9. [Real-World Scenarios](#real-world-scenarios)

## Setup

```typescript
import {
  ClientService,
  ClientRepository,
  ClientValidator,
  createClientRouter,
} from '@care-commons/client-demographics';
import { getDatabase, UserContext } from '@care-commons/core';

// Initialize database and services
const db = getDatabase();
const clientRepository = new ClientRepository(db);
const clientService = new ClientService(clientRepository);

// Create user context (typically from auth middleware)
const userContext: UserContext = {
  userId: 'user-123',
  roles: ['COORDINATOR'],
  permissions: ['clients:read', 'clients:create', 'clients:update'],
  organizationId: 'org-456',
  branchIds: ['branch-789'],
};
```

## Creating Clients

### Example 1: Simple Client Creation

```typescript
const simpleClient = await clientService.createClient(
  {
    organizationId: 'org-456',
    branchId: 'branch-789',
    firstName: 'Mary',
    lastName: 'Johnson',
    dateOfBirth: new Date('1955-08-20'),
    primaryAddress: {
      type: 'HOME',
      line1: '123 Main Street',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62701',
      country: 'US',
    },
  },
  userContext
);

console.log(`Created client: ${simpleClient.clientNumber}`);
```

### Example 2: Complete Client with All Details

```typescript
const completeClient = await clientService.createClient(
  {
    organizationId: 'org-456',
    branchId: 'branch-789',
    
    // Identity
    firstName: 'Robert',
    middleName: 'James',
    lastName: 'Anderson',
    preferredName: 'Bob',
    dateOfBirth: new Date('1948-03-15'),
    gender: 'MALE',
    
    // Contact
    primaryPhone: {
      number: '555-123-4567',
      type: 'MOBILE',
      canReceiveSMS: true,
    },
    email: 'bob.anderson@example.com',
    
    // Address
    primaryAddress: {
      type: 'HOME',
      line1: '456 Oak Avenue',
      line2: 'Apartment 3B',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62702',
      county: 'Sangamon',
      country: 'US',
    },
    
    // Emergency contacts
    emergencyContacts: [
      {
        name: 'Susan Anderson',
        relationship: 'Spouse',
        phone: {
          number: '555-234-5678',
          type: 'MOBILE',
          canReceiveSMS: true,
        },
        email: 'susan.anderson@example.com',
        isPrimary: true,
        canMakeHealthcareDecisions: true,
        notes: 'Available 24/7',
      },
      {
        name: 'Michael Anderson',
        relationship: 'Son',
        phone: {
          number: '555-345-6789',
          type: 'WORK',
          canReceiveSMS: false,
        },
        email: 'michael.anderson@example.com',
        isPrimary: false,
        canMakeHealthcareDecisions: false,
        notes: 'Contact only if Susan unavailable',
      },
    ],
    
    // Intake details
    intakeDate: new Date(),
    status: 'PENDING_INTAKE',
    referralSource: 'Hospital discharge planner',
  },
  userContext
);

console.log(`Created client with full details: ${completeClient.clientNumber}`);
```

## Searching & Filtering

### Example 3: Search by Name

```typescript
const searchResults = await clientService.searchClients(
  {
    query: 'Johnson',
  },
  { page: 1, limit: 20 },
  userContext
);

console.log(`Found ${searchResults.total} clients matching "Johnson"`);
searchResults.items.forEach((client) => {
  console.log(`  - ${client.firstName} ${client.lastName} (${client.clientNumber})`);
});
```

### Example 4: Filter Active Clients in a City

```typescript
const activeInSpringfield = await clientService.searchClients(
  {
    status: ['ACTIVE'],
    city: 'Springfield',
    state: 'IL',
  },
  { page: 1, limit: 50 },
  userContext
);

console.log(`Active clients in Springfield: ${activeInSpringfield.total}`);
```

### Example 5: Find High-Risk Clients

```typescript
const highRiskClients = await clientService.searchClients(
  {
    riskType: ['FALL_RISK', 'WANDERING'],
    status: ['ACTIVE'],
  },
  { page: 1, limit: 100 },
  userContext
);

console.log(`Clients with fall or wandering risk: ${highRiskClients.total}`);
```

### Example 6: Find Elderly Clients (Age-Based Filter)

```typescript
const elderlyClients = await clientService.searchClients(
  {
    minAge: 80,
    status: ['ACTIVE'],
  },
  { page: 1, limit: 50 },
  userContext
);

console.log(`Active clients aged 80+: ${elderlyClients.total}`);
```

## Managing Contacts

### Example 7: Add Emergency Contact

```typescript
const updatedClient = await clientService.addEmergencyContact(
  clientId,
  {
    name: 'Jennifer Smith',
    relationship: 'Niece',
    phone: {
      number: '555-456-7890',
      type: 'MOBILE',
      canReceiveSMS: true,
    },
    email: 'jennifer.smith@example.com',
    isPrimary: false,
    canMakeHealthcareDecisions: false,
    notes: 'Lives nearby, available for emergencies',
  },
  userContext
);

console.log('Emergency contact added successfully');
```

### Example 8: Update Emergency Contact

```typescript
await clientService.updateEmergencyContact(
  clientId,
  contactId,
  {
    phone: {
      number: '555-999-8888',
      type: 'MOBILE',
      canReceiveSMS: true,
    },
    notes: 'Updated phone number as of 2024-03-15',
  },
  userContext
);

console.log('Emergency contact updated');
```

### Example 9: Set Primary Emergency Contact

```typescript
const client = await clientService.getClientById(clientId, userContext);

// Find the contact to make primary
const contactToMakePrimary = client.emergencyContacts.find(
  (c) => c.name === 'Jennifer Smith'
);

if (contactToMakePrimary) {
  // First, unset all other primary contacts
  const updatedContacts = client.emergencyContacts.map((contact) => ({
    ...contact,
    isPrimary: contact.id === contactToMakePrimary.id,
  }));

  await clientService.updateClient(
    clientId,
    { emergencyContacts: updatedContacts },
    userContext
  );

  console.log('Primary contact updated');
}
```

## Risk Management

### Example 10: Add Multiple Risk Flags

```typescript
// Add fall risk
await clientService.addRiskFlag(
  clientId,
  {
    type: 'FALL_RISK',
    severity: 'HIGH',
    description: 'History of 3 falls in past 6 months, uses walker',
    mitigationPlan: 'Fall prevention mat installed, walker required, PT exercises',
    requiresAcknowledgment: true,
  },
  userContext
);

// Add medication compliance concern
await clientService.addRiskFlag(
  clientId,
  {
    type: 'MEDICATION_COMPLIANCE',
    severity: 'MEDIUM',
    description: 'Sometimes forgets afternoon medications',
    mitigationPlan: 'Medication reminder system, daily check-in during visits',
    requiresAcknowledgment: false,
  },
  userContext
);

console.log('Risk flags added');
```

### Example 11: Monitor and Resolve Risk Flags

```typescript
import { getActiveRiskFlags, getCriticalRiskFlags } from '@care-commons/client-demographics';

const client = await clientService.getClientById(clientId, userContext);

// Check active risks
const activeRisks = getActiveRiskFlags(client);
console.log(`Client has ${activeRisks.length} active risk flags`);

activeRisks.forEach((risk) => {
  console.log(`  ⚠️  ${risk.type} (${risk.severity}): ${risk.description}`);
});

// Check critical risks
const criticalRisks = getCriticalRiskFlags(client);
if (criticalRisks.length > 0) {
  console.log('🚨 CRITICAL RISKS PRESENT:');
  criticalRisks.forEach((risk) => {
    console.log(`  - ${risk.description}`);
  });
}

// Resolve a risk flag
if (activeRisks.length > 0) {
  await clientService.resolveRiskFlag(clientId, activeRisks[0].id, userContext);
  console.log('Risk flag resolved');
}
```

## Status Management

### Example 12: Client Status Lifecycle

```typescript
// New inquiry
const newClient = await clientService.createClient(
  {
    organizationId: 'org-456',
    branchId: 'branch-789',
    firstName: 'Alice',
    lastName: 'Williams',
    dateOfBirth: new Date('1960-10-05'),
    primaryAddress: { /* ... */ },
    status: 'INQUIRY',
  },
  userContext
);

// Progress to pending intake
await clientService.updateClientStatus(
  newClient.id,
  'PENDING_INTAKE',
  'Initial assessment scheduled',
  userContext
);

// Complete intake and activate
await clientService.updateClientStatus(
  newClient.id,
  'ACTIVE',
  'Assessment complete, care plan established',
  userContext
);

// Temporarily put on hold
await clientService.updateClientStatus(
  newClient.id,
  'ON_HOLD',
  'Client hospitalized - services paused',
  userContext
);

// Resume services
await clientService.updateClientStatus(
  newClient.id,
  'ACTIVE',
  'Returned home, services resumed',
  userContext
);

// Discharge
await clientService.updateClientStatus(
  newClient.id,
  'DISCHARGED',
  'Moved to assisted living facility',
  userContext
);
```

## Utility Functions

### Example 13: Display Client Information

```typescript
import {
  getFullName,
  getDisplayName,
  calculateAge,
  formatPhoneNumber,
  formatAddressSingleLine,
  getPrimaryEmergencyContact,
} from '@care-commons/client-demographics';

const client = await clientService.getClientById(clientId, userContext);

// Display name variations
console.log(`Full name: ${getFullName(client)}`);
console.log(`Full name with middle: ${getFullName(client, true)}`);
console.log(`Display name: ${getDisplayName(client)}`);

// Age
console.log(`Age: ${calculateAge(client.dateOfBirth)}`);

// Contact info
if (client.primaryPhone) {
  console.log(`Phone: ${formatPhoneNumber(client.primaryPhone.number)}`);
}

// Address
console.log(`Address: ${formatAddressSingleLine(client.primaryAddress)}`);

// Emergency contact
const primaryContact = getPrimaryEmergencyContact(client);
if (primaryContact) {
  console.log(`Emergency: ${primaryContact.name} (${primaryContact.relationship})`);
  console.log(`  Phone: ${formatPhoneNumber(primaryContact.phone.number)}`);
}
```

### Example 14: Check Client Eligibility and Safety

```typescript
import {
  isEligibleForServices,
  hasAllergies,
  hasLifeThreateningAllergies,
  hasCriticalRisks,
  requiresWheelchairAccess,
  getActivePrograms,
  getTotalAuthorizedHours,
} from '@care-commons/client-demographics';

const client = await clientService.getClientById(clientId, userContext);

// Eligibility check
if (!isEligibleForServices(client)) {
  console.log('⚠️  Client needs funding source verification');
}

// Safety checks
if (hasLifeThreateningAllergies(client)) {
  console.log('🚨 LIFE-THREATENING ALLERGIES PRESENT');
  client.allergies
    ?.filter((a) => a.severity === 'LIFE_THREATENING')
    .forEach((allergy) => {
      console.log(`  - ${allergy.allergen}: ${allergy.reaction}`);
    });
}

if (hasCriticalRisks(client)) {
  console.log('🚨 CRITICAL RISK FLAGS ACTIVE');
}

// Accessibility
if (requiresWheelchairAccess(client)) {
  console.log('♿ Wheelchair access required');
}

// Service authorization
const activePrograms = getActivePrograms(client);
const totalHours = getTotalAuthorizedHours(client);
console.log(`Active programs: ${activePrograms.length}`);
console.log(`Total authorized hours/week: ${totalHours}`);
```

### Example 15: Export Client Data

```typescript
import { exportClientToCSV, generateClientSummary } from '@care-commons/client-demographics';

const client = await clientService.getClientById(clientId, userContext);

// Generate summary
const summary = generateClientSummary(client);
console.log('Client Summary:');
console.log(summary.basicInfo);
console.log(summary.contactInfo);
console.log(summary.careInfo);
console.log(summary.riskInfo);

// Export to CSV format
const csvRow = exportClientToCSV(client);
console.log('CSV Export:', csvRow);

// Bulk export example
const allClients = await clientService.searchClients(
  { status: ['ACTIVE'] },
  { page: 1, limit: 1000 },
  userContext
);

const csvData = allClients.items.map(exportClientToCSV);
// csvData can now be written to a CSV file
```

## API Usage

### Example 16: Express.js Router Setup

```typescript
import express from 'express';
import { createClientRouter } from '@care-commons/client-demographics';

const app = express();
app.use(express.json());

// Auth middleware to populate userContext
app.use((req, res, next) => {
  // In production, extract from JWT or session
  req.userContext = {
    userId: 'user-123',
    roles: ['COORDINATOR'],
    permissions: ['clients:read', 'clients:create', 'clients:update'],
    organizationId: 'org-456',
    branchIds: ['branch-789'],
  };
  next();
});

// Mount client routes
const clientRouter = createClientRouter(clientService);
app.use('/api', clientRouter);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Example 17: HTTP API Calls

```bash
# Search clients
curl -X GET "http://localhost:3000/api/clients?q=Johnson&status=ACTIVE&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get client by ID
curl -X GET "http://localhost:3000/api/clients/client-uuid-here" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create client
curl -X POST "http://localhost:3000/api/clients" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "organizationId": "org-456",
    "branchId": "branch-789",
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1950-01-01",
    "primaryAddress": {
      "type": "HOME",
      "line1": "123 Main St",
      "city": "Springfield",
      "state": "IL",
      "postalCode": "62701",
      "country": "US"
    }
  }'

# Update client status
curl -X PATCH "http://localhost:3000/api/clients/client-uuid-here/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "status": "ACTIVE",
    "reason": "Assessment complete"
  }'

# Add risk flag
curl -X POST "http://localhost:3000/api/clients/client-uuid-here/risk-flags" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "FALL_RISK",
    "severity": "HIGH",
    "description": "History of falls",
    "mitigationPlan": "Walker use required",
    "requiresAcknowledgment": true
  }'

# Get dashboard stats
curl -X GET "http://localhost:3000/api/clients/dashboard/stats?branchId=branch-789" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Real-World Scenarios

### Example 18: Intake Workflow

```typescript
// Step 1: Create inquiry from phone call
const inquiry = await clientService.createClient(
  {
    organizationId: 'org-456',
    branchId: 'branch-789',
    firstName: 'Patricia',
    lastName: 'Martinez',
    dateOfBirth: new Date('1952-07-12'),
    primaryPhone: {
      number: '555-777-8888',
      type: 'HOME',
      canReceiveSMS: false,
    },
    primaryAddress: {
      type: 'HOME',
      line1: '789 Elm Street',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62703',
      country: 'US',
    },
    status: 'INQUIRY',
    referralSource: 'Family member called',
  },
  userContext
);

console.log(`Inquiry created: ${inquiry.clientNumber}`);

// Step 2: Schedule intake assessment
await clientService.updateClientStatus(
  inquiry.id,
  'PENDING_INTAKE',
  'Initial assessment scheduled for 3/15/2024',
  userContext
);

// Step 3: Complete intake and add details
await clientService.updateClient(
  inquiry.id,
  {
    email: 'patricia.martinez@example.com',
    emergencyContacts: [
      {
        name: 'Carlos Martinez',
        relationship: 'Son',
        phone: {
          number: '555-888-9999',
          type: 'MOBILE',
          canReceiveSMS: true,
        },
        email: 'carlos.martinez@example.com',
        isPrimary: true,
        canMakeHealthcareDecisions: true,
      },
    ],
  },
  userContext
);

// Step 4: Add identified risk flags
await clientService.addRiskFlag(
  inquiry.id,
  {
    type: 'MEDICATION_COMPLIANCE',
    severity: 'MEDIUM',
    description: 'Takes multiple medications, occasionally forgets doses',
    mitigationPlan: 'Medication organizer provided, daily reminder calls',
    requiresAcknowledgment: false,
  },
  userContext
);

// Step 5: Activate client
await clientService.updateClientStatus(
  inquiry.id,
  'ACTIVE',
  'Intake complete, care plan approved, services beginning 3/18/2024',
  userContext
);

console.log('Client intake workflow completed');
```

### Example 19: Daily Dashboard Report

```typescript
import {
  getActiveRiskFlags,
  getCriticalRiskFlags,
  isNewClient,
  compareClients,
} from '@care-commons/client-demographics';

async function generateDailyReport(branchId: string) {
  // Get all active clients
  const activeClients = await clientService.searchClients(
    {
      branchId,
      status: ['ACTIVE'],
    },
    { page: 1, limit: 1000 },
    userContext
  );

  console.log('\n📊 Daily Client Report');
  console.log(`Branch: ${branchId}`);
  console.log(`Date: ${new Date().toLocaleDateString()}`);
  console.log(`\nTotal Active Clients: ${activeClients.total}`);

  // New clients this month
  const newClients = activeClients.items.filter((c) => isNewClient(c, 30));
  console.log(`New Clients (Last 30 Days): ${newClients.length}`);

  // High-risk clients
  const highRiskClients = activeClients.items.filter((c) => {
    const active = getActiveRiskFlags(c);
    return active.some((r) => r.severity === 'HIGH' || r.severity === 'CRITICAL');
  });
  console.log(`High-Risk Clients: ${highRiskClients.length}`);

  // Critical alerts
  const criticalAlerts = activeClients.items.filter((c) => {
    return getCriticalRiskFlags(c).length > 0;
  });

  if (criticalAlerts.length > 0) {
    console.log(`\n🚨 CRITICAL ALERTS: ${criticalAlerts.length}`);
    criticalAlerts.forEach((client) => {
      console.log(`  - ${client.firstName} ${client.lastName} (${client.clientNumber})`);
      getCriticalRiskFlags(client).forEach((risk) => {
        console.log(`    ⚠️  ${risk.type}: ${risk.description}`);
      });
    });
  }

  // Clients by status
  const allClients = await clientService.searchClients(
    { branchId },
    { page: 1, limit: 1000 },
    userContext
  );

  const statusCounts = {
    INQUIRY: 0,
    PENDING_INTAKE: 0,
    ACTIVE: 0,
    ON_HOLD: 0,
    INACTIVE: 0,
    DISCHARGED: 0,
  };

  allClients.items.forEach((c) => {
    if (c.status in statusCounts) {
      statusCounts[c.status as keyof typeof statusCounts]++;
    }
  });

  console.log('\nClients by Status:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    if (count > 0) {
      console.log(`  ${status}: ${count}`);
    }
  });
}

// Run the report
generateDailyReport('branch-789');
```

### Example 20: Bulk Import from Spreadsheet

```typescript
interface SpreadsheetRow {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
}

async function importClientsFromSpreadsheet(rows: SpreadsheetRow[]) {
  const results = {
    successful: [] as string[],
    failed: [] as { row: SpreadsheetRow; error: string }[],
  };

  for (const row of rows) {
    try {
      const client = await clientService.createClient(
        {
          organizationId: 'org-456',
          branchId: 'branch-789',
          firstName: row.firstName.trim(),
          lastName: row.lastName.trim(),
          dateOfBirth: new Date(row.dateOfBirth),
          primaryPhone: {
            number: row.phone.replace(/\D/g, ''),
            type: 'HOME',
            canReceiveSMS: false,
          },
          primaryAddress: {
            type: 'HOME',
            line1: row.street.trim(),
            city: row.city.trim(),
            state: row.state.trim(),
            postalCode: row.zip.replace(/\D/g, ''),
            country: 'US',
          },
          emergencyContacts: [
            {
              name: row.emergencyName.trim(),
              relationship: row.emergencyRelation.trim(),
              phone: {
                number: row.emergencyPhone.replace(/\D/g, ''),
                type: 'MOBILE',
                canReceiveSMS: true,
              },
              isPrimary: true,
              canMakeHealthcareDecisions: true,
            },
          ],
          status: 'PENDING_INTAKE',
        },
        userContext
      );

      results.successful.push(client.clientNumber);
      console.log(`✅ Imported: ${client.firstName} ${client.lastName}`);
    } catch (error: any) {
      results.failed.push({
        row,
        error: error.message,
      });
      console.log(`❌ Failed: ${row.firstName} ${row.lastName} - ${error.message}`);
    }
  }

  console.log(`\nImport complete:`);
  console.log(`  Successful: ${results.successful.length}`);
  console.log(`  Failed: ${results.failed.length}`);

  return results;
}
```

---

For more information, see the [main README](./README.md) or visit the [Care Commons documentation](https://docs.carecommons.org).
