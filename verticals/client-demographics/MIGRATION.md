# Migration Guide - Client & Demographics Management

This guide helps organizations migrate existing client data to Care Commons.

## Table of Contents

1. [Pre-Migration Checklist](#pre-migration-checklist)
2. [Data Export from Existing Systems](#data-export-from-existing-systems)
3. [Data Mapping](#data-mapping)
4. [Data Transformation](#data-transformation)
5. [Import Process](#import-process)
6. [Validation](#validation)
7. [Troubleshooting](#troubleshooting)

## Pre-Migration Checklist

Before beginning migration, ensure:

- [ ] Care Commons instance is set up and running
- [ ] Organization and branch records are created
- [ ] User accounts with appropriate permissions exist
- [ ] Database backup of existing system is complete
- [ ] Test environment is available for trial runs
- [ ] Data cleaning has been performed on source data
- [ ] Stakeholders are informed of migration schedule

## Data Export from Existing Systems

### Common Home Care Systems

#### From Spreadsheets (Excel/CSV)

Most organizations maintain client data in spreadsheets. Export to CSV format:

```
File → Save As → CSV (Comma delimited)
```

#### From AxisCare

1. Navigate to Reports → Client List
2. Select all required fields
3. Export to Excel
4. Save as CSV

#### From ClearCare/WellSky

1. Go to Reports → Custom Reports
2. Create report with client demographics
3. Export to CSV format

#### From MatrixCare

1. Access Matrix IQ Reports
2. Run Client Master List report
3. Export data to Excel/CSV

## Data Mapping

### Required Fields

Map these fields from your source system to Care Commons:

| Care Commons Field | Description | Required | Example |
|-------------------|-------------|----------|---------|
| `firstName` | Client first name | ✅ | "Margaret" |
| `lastName` | Client last name | ✅ | "Thompson" |
| `dateOfBirth` | Date of birth | ✅ | "1942-06-15" |
| `primaryAddress.line1` | Street address | ✅ | "456 Oak Avenue" |
| `primaryAddress.city` | City | ✅ | "Springfield" |
| `primaryAddress.state` | State (2-letter code) | ✅ | "IL" |
| `primaryAddress.postalCode` | ZIP code | ✅ | "62702" |
| `primaryAddress.country` | Country code | ✅ | "US" |

### Optional but Recommended Fields

| Care Commons Field | Source System Field | Example |
|-------------------|---------------------|---------|
| `middleName` | Middle Name | "Rose" |
| `preferredName` | Nickname / Preferred | "Maggie" |
| `gender` | Gender | "FEMALE" |
| `primaryPhone.number` | Phone / Primary Phone | "555-0201" |
| `email` | Email Address | "maggie@example.com" |
| `ssn` | SSN / Social Security | "123-45-6789" |
| `medicareNumber` | Medicare ID | "MCR123456789A" |
| `medicaidNumber` | Medicaid ID | "MCD123456" |
| `status` | Status / Active | "ACTIVE" |

### Emergency Contact Mapping

| Care Commons Field | Source Field | Example |
|-------------------|--------------|---------|
| `emergencyContacts[0].name` | Emergency Contact Name | "Sarah Thompson" |
| `emergencyContacts[0].relationship` | Relationship | "Daughter" |
| `emergencyContacts[0].phone.number` | Emergency Phone | "555-0210" |
| `emergencyContacts[0].isPrimary` | Primary Contact | true |

## Data Transformation

### CSV Template

Create a CSV with these columns:

```csv
firstName,middleName,lastName,preferredName,dateOfBirth,gender,phone,email,street,apt,city,state,zip,emergencyName,emergencyRelation,emergencyPhone,status,intakeDate,medicareNumber,medicaidNumber
Margaret,Rose,Thompson,Maggie,1942-06-15,FEMALE,555-0201,maggie@example.com,456 Oak Avenue,Apt 3B,Springfield,IL,62702,Sarah Thompson,Daughter,555-0210,ACTIVE,2024-01-15,MCR123456789A,
```

### Transformation Script

Use this TypeScript script to transform your CSV data:

```typescript
import * as fs from 'fs';
import * as csv from 'csv-parser';
import { CreateClientInput } from '@care-commons/client-demographics';

interface SourceRow {
  firstName: string;
  middleName?: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth: string;
  gender?: string;
  phone?: string;
  email?: string;
  street: string;
  apt?: string;
  city: string;
  state: string;
  zip: string;
  emergencyName?: string;
  emergencyRelation?: string;
  emergencyPhone?: string;
  status?: string;
  intakeDate?: string;
  medicareNumber?: string;
  medicaidNumber?: string;
}

function transformRow(row: SourceRow, organizationId: string, branchId: string): CreateClientInput {
  return {
    organizationId,
    branchId,
    firstName: row.firstName.trim(),
    middleName: row.middleName?.trim(),
    lastName: row.lastName.trim(),
    preferredName: row.preferredName?.trim(),
    dateOfBirth: new Date(row.dateOfBirth),
    gender: mapGender(row.gender),
    primaryPhone: row.phone ? {
      number: row.phone.replace(/\D/g, ''),
      type: 'HOME',
      canReceiveSMS: false,
    } : undefined,
    email: row.email?.trim(),
    primaryAddress: {
      type: 'HOME',
      line1: row.street.trim(),
      line2: row.apt?.trim(),
      city: row.city.trim(),
      state: row.state.trim().toUpperCase(),
      postalCode: row.zip.replace(/\D/g, ''),
      country: 'US',
    },
    emergencyContacts: row.emergencyName ? [{
      name: row.emergencyName.trim(),
      relationship: row.emergencyRelation?.trim() || 'Family',
      phone: {
        number: row.emergencyPhone?.replace(/\D/g, '') || '',
        type: 'MOBILE',
        canReceiveSMS: true,
      },
      isPrimary: true,
      canMakeHealthcareDecisions: true,
    }] : [],
    status: mapStatus(row.status),
    intakeDate: row.intakeDate ? new Date(row.intakeDate) : undefined,
  };
}

function mapGender(gender?: string): any {
  if (!gender) return undefined;
  
  const normalized = gender.toLowerCase().trim();
  
  if (normalized === 'm' || normalized === 'male') return 'MALE';
  if (normalized === 'f' || normalized === 'female') return 'FEMALE';
  if (normalized === 'nb' || normalized === 'non-binary') return 'NON_BINARY';
  
  return 'OTHER';
}

function mapStatus(status?: string): any {
  if (!status) return 'PENDING_INTAKE';
  
  const normalized = status.toLowerCase().trim();
  
  if (normalized === 'active') return 'ACTIVE';
  if (normalized === 'inactive') return 'INACTIVE';
  if (normalized === 'discharged') return 'DISCHARGED';
  if (normalized === 'hold' || normalized === 'on hold') return 'ON_HOLD';
  if (normalized === 'pending' || normalized === 'pending intake') return 'PENDING_INTAKE';
  if (normalized === 'inquiry') return 'INQUIRY';
  
  return 'ACTIVE';
}

async function transformCSV(inputFile: string, outputFile: string, orgId: string, branchId: string) {
  const transformed: CreateClientInput[] = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(inputFile)
      .pipe(csv())
      .on('data', (row: SourceRow) => {
        try {
          const client = transformRow(row, orgId, branchId);
          transformed.push(client);
        } catch (error) {
          console.error(`Error transforming row:`, row, error);
        }
      })
      .on('end', () => {
        fs.writeFileSync(outputFile, JSON.stringify(transformed, null, 2));
        console.log(`Transformed ${transformed.length} clients to ${outputFile}`);
        resolve(transformed);
      })
      .on('error', reject);
  });
}

// Usage:
// transformCSV('clients.csv', 'clients-transformed.json', 'org-456', 'branch-789');
```

## Import Process

### Option 1: Using the API

```typescript
import { ClientService } from '@care-commons/client-demographics';
import * as fs from 'fs';

async function importClients(jsonFile: string, clientService: ClientService, userContext: any) {
  const clients = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
  
  const results = {
    successful: [] as any[],
    failed: [] as any[],
  };
  
  for (const clientData of clients) {
    try {
      const client = await clientService.createClient(clientData, userContext);
      results.successful.push({
        clientNumber: client.clientNumber,
        name: `${client.firstName} ${client.lastName}`,
      });
      console.log(`✅ Imported: ${client.firstName} ${client.lastName}`);
    } catch (error: any) {
      results.failed.push({
        client: `${clientData.firstName} ${clientData.lastName}`,
        error: error.message,
      });
      console.error(`❌ Failed: ${clientData.firstName} ${clientData.lastName}`);
      console.error(`   Error: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Import Summary:`);
  console.log(`   Successful: ${results.successful.length}`);
  console.log(`   Failed: ${results.failed.length}`);
  
  // Write results
  fs.writeFileSync(
    'import-results.json',
    JSON.stringify(results, null, 2)
  );
  
  return results;
}
```

### Option 2: Using Bulk Import Endpoint

```bash
curl -X POST "http://localhost:3000/api/clients/bulk-import" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @clients-transformed.json
```

### Option 3: Direct Database Import

For very large datasets (10,000+ clients), use direct database import:

```sql
-- Create temporary staging table
CREATE TABLE clients_staging (
    first_name TEXT,
    last_name TEXT,
    date_of_birth DATE,
    -- ... other fields
);

-- Import from CSV
COPY clients_staging FROM '/path/to/clients.csv' 
WITH (FORMAT csv, HEADER true);

-- Transform and insert
INSERT INTO clients (
    id, organization_id, branch_id, client_number,
    first_name, last_name, date_of_birth, primary_address,
    emergency_contacts, service_eligibility, status,
    created_by, updated_by
)
SELECT 
    uuid_generate_v4(),
    'org-456',
    'branch-789',
    'CL-' || to_char(nextval('client_number_seq'), 'FM0000'),
    first_name,
    last_name,
    date_of_birth,
    jsonb_build_object(
        'type', 'HOME',
        'line1', street,
        'city', city,
        'state', state,
        'postalCode', zip,
        'country', 'US'
    ),
    '[]'::jsonb,
    '{}'::jsonb,
    'ACTIVE',
    'system-user-id',
    'system-user-id'
FROM clients_staging;

-- Clean up
DROP TABLE clients_staging;
```

## Validation

### Post-Import Checks

1. **Count Verification**
```sql
-- Total clients imported
SELECT COUNT(*) FROM clients WHERE organization_id = 'org-456';

-- By status
SELECT status, COUNT(*) 
FROM clients 
WHERE organization_id = 'org-456'
GROUP BY status;
```

2. **Data Quality Checks**
```sql
-- Clients missing emergency contacts
SELECT id, first_name, last_name, client_number
FROM clients
WHERE jsonb_array_length(emergency_contacts) = 0;

-- Invalid phone numbers
SELECT id, first_name, last_name, primary_phone
FROM clients
WHERE primary_phone IS NOT NULL
  AND length(primary_phone->>'number') < 10;

-- Invalid addresses
SELECT id, first_name, last_name
FROM clients
WHERE primary_address->>'city' IS NULL
   OR primary_address->>'state' IS NULL
   OR primary_address->>'postalCode' IS NULL;
```

3. **Duplicate Detection**
```sql
-- Potential duplicates by name and DOB
SELECT first_name, last_name, date_of_birth, COUNT(*)
FROM clients
WHERE organization_id = 'org-456'
GROUP BY first_name, last_name, date_of_birth
HAVING COUNT(*) > 1;
```

### Testing Checklist

- [ ] Search functionality works with imported data
- [ ] Client details display correctly
- [ ] Emergency contacts are accessible
- [ ] Status updates function properly
- [ ] Risk flags can be added and managed
- [ ] Reports generate correctly with new data

## Troubleshooting

### Common Issues

#### Issue: Invalid Date Format

**Error:** `Invalid date format`

**Solution:** Ensure dates are in ISO format (YYYY-MM-DD):
```typescript
// Wrong
dateOfBirth: '03/15/1945'

// Correct
dateOfBirth: '1945-03-15'
```

#### Issue: Invalid Phone Numbers

**Error:** `Invalid phone number format`

**Solution:** Strip all non-digits from phone numbers:
```typescript
phone: phoneString.replace(/\D/g, '')
```

#### Issue: Missing Required Fields

**Error:** `Validation failed: firstName is required`

**Solution:** Ensure all required fields are present and not empty:
```typescript
if (!row.firstName || row.firstName.trim() === '') {
  console.error('Skipping row: missing first name');
  continue;
}
```

#### Issue: Duplicate Client Numbers

**Error:** `Client number already exists`

**Solution:** System auto-generates client numbers. Don't provide them during import.

#### Issue: Permission Denied

**Error:** `Permission denied: clients:create`

**Solution:** Ensure user context has proper permissions:
```typescript
const userContext = {
  userId: 'admin-user-id',
  roles: ['ORG_ADMIN'],
  permissions: ['clients:create', 'clients:update'],
  organizationId: 'org-456',
  branchIds: ['branch-789'],
};
```

### Data Cleaning Best Practices

Before import:

1. **Remove duplicates** in source data
2. **Standardize phone numbers** (remove formatting)
3. **Validate dates** (ensure YYYY-MM-DD format)
4. **Normalize state codes** (use 2-letter codes)
5. **Clean ZIP codes** (remove dashes, ensure 5 digits)
6. **Trim whitespace** from all text fields
7. **Validate email addresses**
8. **Check for missing required fields**

### Rollback Procedure

If import fails or data issues are discovered:

```sql
-- Rollback recent import (be careful with this!)
DELETE FROM clients 
WHERE organization_id = 'org-456'
  AND created_at > '2024-03-15 10:00:00';

-- Or mark as deleted (soft delete - safer)
UPDATE clients
SET deleted_at = NOW(), deleted_by = 'system-admin'
WHERE organization_id = 'org-456'
  AND created_at > '2024-03-15 10:00:00';
```

## Post-Migration Tasks

After successful import:

1. [ ] Verify all clients are searchable
2. [ ] Test workflow from inquiry → active
3. [ ] Add risk flags to high-risk clients
4. [ ] Verify program enrollments
5. [ ] Set up authorized contacts for family portal access
6. [ ] Train staff on new system
7. [ ] Archive old system data per retention policy

## Support

For migration assistance:
- **Documentation:** https://docs.carecommons.org
- **Community Forum:** https://github.com/neighborhood-lab/care-commons/discussions
- **Issues:** https://github.com/neighborhood-lab/care-commons/issues

---

**Care Commons** - Shared care software, community owned.
