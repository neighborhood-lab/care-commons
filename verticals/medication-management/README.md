# Medication Management Vertical

Comprehensive medication management system for tracking prescriptions, administration, and allergies in home care settings.

## Overview

The Medication Management vertical provides complete functionality for managing client medications, including:

- **Medication Records**: Track prescriptions with detailed information including dosage, frequency, route, and prescriber details
- **Administration Tracking**: Log medication administrations with status (administered, skipped, refused, missed)
- **Allergy Management**: Maintain medication allergy records with severity levels
- **Adherence Reporting**: Generate compliance reports and track adherence rates
- **Safety Checks**: Automatic validation for allergy conflicts and potential drug interactions

## Features

### Medication Management
- Create and manage medication records
- Support for scheduled and PRN (as-needed) medications
- Track prescriber information and prescription numbers
- Pharmacy details and refill tracking
- Multiple administration routes and forms
- Flexible frequency options (daily, multiple times daily, hourly, weekly, monthly, custom)

### Administration Tracking
- Record medication administrations in real-time
- Track administration status (administered, skipped, refused, missed, pending)
- Capture skip/refuse reasons for compliance tracking
- Support for witnessed administrations (controlled substances)
- Automated scheduling based on medication frequency

### Allergy Management
- Track medication allergies and reactions
- Severity classification (mild, moderate, severe, life-threatening)
- Automatic conflict detection when prescribing new medications
- Active/inactive status management

### Reporting & Analytics
- Medication adherence reports by client and medication
- Administration history and trends
- Refill alerts and expiration warnings
- Compliance metrics and statistics

## Installation

```bash
npm install
```

## Usage

### Basic Setup

```typescript
import {
  MedicationRepository,
  MedicationService,
  createMedicationRouter
} from '@care-commons/medication-management';
import type { Database } from '@care-commons/core';

// Initialize repository and service
const medicationRepository = new MedicationRepository(db);
const medicationService = new MedicationService(medicationRepository);

// Create router for Express app
const medicationRouter = createMedicationRouter(medicationService);
app.use('/api', medicationRouter);
```

### Creating a Medication

```typescript
const medication = await medicationService.createMedication({
  client_id: 'client-uuid',
  name: 'Metformin',
  generic_name: 'Metformin HCl',
  strength: '500mg',
  form: 'tablet',
  route: 'oral',
  frequency: 'twice_daily',
  dosage: '1 tablet',
  prescriber_name: 'Dr. Smith',
  indication: 'Type 2 Diabetes',
  start_date: new Date(),
  is_prn: false,
}, context);
```

### Recording Administration

```typescript
const administration = await medicationService.recordAdministration({
  medication_id: 'medication-uuid',
  scheduled_time: new Date(),
  administered_time: new Date(),
  status: 'administered',
  dosage_given: '500mg',
}, context);
```

### Adding an Allergy

```typescript
const allergy = await medicationService.createAllergy({
  client_id: 'client-uuid',
  allergen: 'Penicillin',
  reaction: 'Hives and rash',
  severity: 'moderate',
  verified_date: new Date(),
}, context);
```

### Generating Adherence Report

```typescript
const report = await medicationService.getAdministrationReport(
  'client-uuid',
  startDate,
  endDate,
  context
);

console.log(`Adherence Rate: ${report.adherence_rate}%`);
console.log(`Total Administered: ${report.total_administered}/${report.total_scheduled}`);
```

## API Endpoints

### Medications

- `GET /api/medications` - Search medications with filters
- `GET /api/medications/:id` - Get medication by ID
- `GET /api/medications/:id/details` - Get medication with related data
- `POST /api/medications` - Create new medication
- `PATCH /api/medications/:id` - Update medication
- `DELETE /api/medications/:id` - Discontinue medication
- `GET /api/clients/:clientId/medications` - Get all medications for a client

### Administration

- `GET /api/medication-administrations` - Search administration logs
- `POST /api/medication-administrations` - Record medication administration
- `GET /api/medication-administrations/report` - Get adherence report

### Allergies

- `GET /api/medication-allergies` - Search allergies
- `POST /api/medication-allergies` - Create allergy record
- `PATCH /api/medication-allergies/:id` - Update allergy
- `GET /api/clients/:clientId/medication-allergies` - Get client allergies

## Data Models

### Medication

```typescript
interface Medication {
  id: string;
  client_id: string;
  name: string;
  generic_name?: string;
  strength?: string;
  form: MedicationForm;
  route: MedicationRoute;
  frequency: MedicationFrequency;
  dosage: string;
  prescriber_name?: string;
  start_date: Date;
  end_date?: Date;
  status: MedicationStatus;
  is_prn: boolean;
  // ... additional fields
}
```

### MedicationAdministration

```typescript
interface MedicationAdministration {
  id: string;
  medication_id: string;
  client_id: string;
  scheduled_time: Date;
  administered_time?: Date;
  status: AdministrationStatus;
  dosage_given?: string;
  skip_reason?: string;
  refuse_reason?: string;
  // ... additional fields
}
```

### MedicationAllergy

```typescript
interface MedicationAllergy {
  id: string;
  client_id: string;
  allergen: string;
  reaction?: string;
  severity?: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  is_active: boolean;
  // ... additional fields
}
```

## Validation

All input is validated using Zod schemas:

- `createMedicationSchema` - Validates medication creation
- `updateMedicationSchema` - Validates medication updates
- `recordAdministrationSchema` - Validates administration records
- `createAllergySchema` - Validates allergy creation

Example validation errors:
- PRN medications require a reason
- Skip/refuse status requires corresponding reasons
- End date must be after start date
- Custom frequency requires details

## Utilities

The vertical provides utility functions for common operations:

```typescript
import {
  calculateNextAdministration,
  generateAdministrationSchedule,
  formatDosage,
  isDueForRefill,
  isExpiring,
  calculateAdherenceRate,
} from '@care-commons/medication-management';
```

## Database Schema

Required database tables:

### medications
- Stores medication records
- Includes prescription details, dosage, frequency
- Links to clients

### medication_administrations
- Logs each medication administration
- Tracks status and timing
- Links to medications and clients

### medication_allergies
- Stores allergy information
- Severity classification
- Active/inactive status

## Dependencies

- `@care-commons/core` - Core platform functionality
- `@care-commons/client-demographics` - Client information
- `@care-commons/caregiver-staff` - Caregiver administration tracking
- `date-fns` - Date manipulation
- `uuid` - ID generation
- `zod` - Runtime validation

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Building

```bash
# Build TypeScript
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Safety Features

### Allergy Checking
The service automatically checks for allergy conflicts when creating new medications and prevents prescribing medications to which a client is allergic.

### Interaction Detection
Basic drug interaction checking is implemented (can be extended with a comprehensive drug database).

### Administration Validation
- Prevents administration of inactive medications
- Requires reasons for skipped/refused doses
- Supports witness verification for controlled substances

## Integration Points

This vertical integrates with:

- **Client Demographics**: Links medications to client records
- **Caregiver Staff**: Tracks which caregivers administered medications
- **Scheduling & Visits**: Can integrate with visit scheduling for administration timing

## Future Enhancements

Potential future additions:
- Advanced drug interaction database integration
- E-prescribing integration
- Pharmacy system integration
- Medication barcode scanning
- Photo documentation of medications
- Multi-language medication instructions
- Integration with health monitoring devices
- Automated refill reminders
- Insurance formulary checking

## Support

For issues, questions, or contributions, please refer to the main Care Commons documentation.

## License

Part of the Care Commons platform.
