# Time Tracking & Electronic Visit Verification (EVV)

> Accurate timing and location evidence of visits — clock-in/out, geofenced verification, offline capture with sync, integrity measures against falsification, and compliance-grade retention.

The **Time Tracking & EVV** vertical provides comprehensive Electronic Visit Verification capabilities that meet federal and state requirements under the 21st Century Cures Act. It ensures accurate documentation of when and where home care services are delivered, with robust integrity checks to prevent fraud and maintain regulatory compliance.

## Multi-State Support

**7 States Supported**: TX, FL, OH, PA, GA, NC, AZ

- **Massive Code Reuse**: Single Sandata aggregator serves OH, PA, NC, AZ (4 states)
- **State-Specific Configurations**: Geofence rules, grace periods, retention policies
- **Aggregator Integration**: HHAeXchange (TX), Multi-aggregator (FL), Sandata (OH, PA, NC, AZ), Tellus (GA)
- **28,000+ Potential Customers**: Expanded from 2 states to 7 states (3x+ market expansion)

## Features

### Core EVV Compliance

- **Six Required Data Elements** - Captures all federally mandated EVV data:
  1. Type of service performed
  2. Individual receiving the service
  3. Individual providing the service
  4. Date of service
  5. Location of service delivery
  6. Time service begins and ends

- **GPS-Based Location Verification** - Real-time location capture with accuracy tracking
- **Geofencing** - Virtual boundaries around client addresses with configurable radius
- **Mock Location Detection** - Identifies GPS spoofing and location manipulation attempts
- **Device Security Checks** - Detects rooted/jailbroken devices that compromise integrity
- **Biometric Verification** - Optional fingerprint, facial recognition, or voice verification
- **Photo Documentation** - Optional photo capture at clock-in/out for additional proof
- **Digital Signatures** - Client and caregiver attestation with cryptographic integrity

### Integrity & Anti-Fraud

- **Cryptographic Hashing** - Tamper-evident records with SHA-256 hashing
- **Integrity Checksums** - Additional validation of record completeness
- **Audit Trail** - Complete history of all verification events and changes
- **Anomaly Detection** - Automated flagging of suspicious patterns:
  - Impossible location jumps
  - Time anomalies
  - Duplicate clock-ins
  - Device switching mid-visit
  - Excessive pause time
  - Visits too short or too long
- **Manual Override Workflow** - Supervisor review and approval for flagged visits

### Offline & Sync

- **Offline-First Design** - Caregivers can clock in/out without internet connection
- **Durable Local Storage** - Time entries stored securely on device until synced
- **Conflict Resolution** - Intelligent handling of sync conflicts with server
- **Background Sync** - Automatic sync when connectivity restored
- **Retry Logic** - Failed sync attempts automatically retried

### Verification Methods

Multiple verification methods supported for different scenarios:

- **GPS** - Standard satellite-based GPS (primary method)
- **Network** - Cell tower and WiFi triangulation (fallback)
- **Phone** - Telephone verification for rural/low-signal areas
- **Facial** - Facial recognition verification
- **Biometric** - Fingerprint or other biometric
- **Manual** - Supervisor manual verification (exception process)

### Geofence Management

- **Auto-Generated Geofences** - Automatically create geofences from client addresses
- **Configurable Radius** - Standard (50m), expanded (100m), or custom radius
- **Polygon Geofences** - Complex shapes for multi-building properties
- **GPS Accuracy Tolerance** - Accounts for GPS accuracy in verification
- **Performance Tracking** - Monitor geofence success rates and GPS accuracy
- **Auto-Calibration** - Learns optimal radius based on verification history

### Compliance Reporting

- **EVV Compliance Reports** - Summary reports for regulatory submission
- **State-Specific Fields** - Extensible data model for state requirements
- **Payor Submission** - Track submission and approval status
- **Exception Tracking** - Detailed logging of all compliance exceptions
- **Audit-Ready Exports** - PDF, CSV, XML, and HL7 export formats

### Visit Lifecycle Integration

- **Clock-In** - Start visit with location verification
- **Mid-Visit Check-Ins** - Optional periodic location verification
- **Pause/Resume** - Track breaks and interruptions
- **Clock-Out** - End visit with location verification
- **Auto-Clock-Out** - Automatic clock-out if caregiver forgets (with flagging)
- **Visit Status Updates** - Real-time status updates to scheduling vertical

## Data Model

### EVV Record

Complete compliance record capturing all required EVV data elements:

```typescript
interface EVVRecord {
  // Required federal EVV elements
  serviceTypeCode: string;          // 1. Type of service
  clientName: string;                // 2. Individual receiving service
  caregiverName: string;             // 3. Individual providing service
  serviceDate: Date;                 // 4. Date of service
  serviceAddress: ServiceAddress;    // 5. Location of service
  clockInTime: Timestamp;            // 6. Time service begins
  clockOutTime: Timestamp;           // 6. Time service ends
  
  // Location verification
  clockInVerification: LocationVerification;
  clockOutVerification: LocationVerification;
  midVisitChecks?: LocationVerification[];
  
  // Integrity and compliance
  recordStatus: EVVRecordStatus;
  verificationLevel: VerificationLevel;
  complianceFlags: ComplianceFlag[];
  integrityHash: string;
  integrityChecksum: string;
  
  // Sync and audit
  syncMetadata: SyncMetadata;
  submittedToPayor?: Timestamp;
  payorApprovalStatus?: PayorApprovalStatus;
}
```

### Location Verification

Detailed location proof with integrity checks:

```typescript
interface LocationVerification {
  // GPS data
  latitude: number;
  longitude: number;
  accuracy: number;          // meters
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: Timestamp;
  
  // Geofence verification
  isWithinGeofence: boolean;
  distanceFromAddress: number;
  geofencePassed: boolean;
  
  // Device information
  deviceId: string;
  deviceModel: string;
  deviceOS: string;
  appVersion: string;
  
  // Integrity checks
  method: VerificationMethod;
  locationSource: LocationSource;
  mockLocationDetected: boolean;
  vpnDetected?: boolean;
  
  // Additional verification
  photoUrl?: string;
  photoHash?: string;
  biometricVerified?: boolean;
  biometricMethod?: 'FINGERPRINT' | 'FACE' | 'VOICE';
  
  // Results
  verificationPassed: boolean;
  verificationFailureReasons?: string[];
  manualOverride?: ManualOverride;
}
```

### Geofence

Virtual boundary for location verification:

```typescript
interface Geofence {
  organizationId: UUID;
  clientId: UUID;
  addressId: UUID;
  
  // Location
  centerLatitude: number;
  centerLongitude: number;
  radiusMeters: number;
  shape: 'CIRCLE' | 'POLYGON';
  polygonPoints?: GeoPoint[];
  
  // Performance tracking
  verificationCount: number;
  successfulVerifications: number;
  failedVerifications: number;
  averageAccuracy: number;
  
  status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
}
```

## Usage

### Clock In to Start Visit

```typescript
import { EVVService } from '@care-commons/time-tracking-evv';
import { UserContext } from '@care-commons/core';

const evvService = new EVVService(repository);

const result = await evvService.clockIn({
  visitId: 'visit-123',
  caregiverId: 'caregiver-456',
  location: {
    latitude: 39.7817,
    longitude: -89.6501,
    accuracy: 12.5,
    timestamp: new Date(),
    method: 'GPS',
    mockLocationDetected: false,
  },
  deviceInfo: {
    deviceId: 'device-abc',
    deviceModel: 'iPhone 13',
    deviceOS: 'iOS',
    osVersion: '17.2',
    appVersion: '1.0.0',
    batteryLevel: 85,
    networkType: 'WIFI',
    isRooted: false,
    isJailbroken: false,
  },
  clientPresent: true,
  notes: 'Client ready for visit',
}, userContext);

console.log('Clock-in successful:', result.evvRecord.id);
console.log('Verification passed:', result.verification.passed);
console.log('Verification level:', result.verification.verificationLevel);

if (!result.verification.passed) {
  console.log('Issues found:', result.verification.issues);
  if (result.verification.requiresSupervisorReview) {
    console.log('⚠️ Requires supervisor review');
  }
}
```

### Clock Out to End Visit

```typescript
const result = await evvService.clockOut({
  visitId: 'visit-123',
  evvRecordId: 'evv-789',
  caregiverId: 'caregiver-456',
  location: {
    latitude: 39.7817,
    longitude: -89.6501,
    accuracy: 15.2,
    timestamp: new Date(),
    method: 'GPS',
    mockLocationDetected: false,
  },
  deviceInfo: {
    // ... device info
  },
  completionNotes: 'All tasks completed successfully',
  tasksCompleted: 8,
  tasksTotal: 8,
  clientSignature: {
    attestedByName: 'John Doe',
    attestationType: 'SIGNATURE',
    signatureData: 'data:image/png;base64,...',
    statement: 'I confirm services were provided as documented',
  },
}, userContext);

console.log('Clock-out successful');
console.log('Visit duration:', result.evvRecord.totalDuration, 'minutes');
console.log('Billable hours:', result.evvRecord.totalDuration / 60);
```

### Handle Verification Issues with Manual Override

```typescript
// When a visit is flagged for geofence violation or other issues,
// a supervisor can review and apply a manual override

await evvService.applyManualOverride({
  timeEntryId: 'time-entry-123',
  reason: 'Client moved to neighbor\'s house for visit due to home repairs',
  reasonCode: 'CLIENT_LOCATION_CHANGE',
  supervisorName: 'Sarah Johnson',
  supervisorTitle: 'Care Coordinator',
  approvalAuthority: 'Manual Override Policy Section 4.2',
  notes: 'Confirmed with client and family. Temporary location change documented.',
}, supervisorUserContext);

console.log('Manual override applied - visit approved');
```

### Create Custom Geofence

```typescript
// Create a larger geofence for a rural property
const geofence = await evvService.createGeofence({
  organizationId: 'org-123',
  clientId: 'client-456',
  addressId: 'address-789',
  centerLatitude: 40.7128,
  centerLongitude: -74.0060,
  radiusMeters: 150, // 150 meter radius
  radiusType: 'EXPANDED',
}, userContext);

console.log('Geofence created:', geofence.id);
```

### Get EVV Record and Time Entries

```typescript
// Get complete EVV record for a visit
const evvRecord = await evvService.getEVVRecordByVisit(
  'visit-123',
  userContext
);

if (evvRecord) {
  console.log('Service date:', evvRecord.serviceDate);
  console.log('Duration:', evvRecord.totalDuration, 'minutes');
  console.log('Status:', evvRecord.recordStatus);
  console.log('Compliance flags:', evvRecord.complianceFlags);
  console.log('Submitted to payor:', evvRecord.submittedToPayor ? 'Yes' : 'No');
}

// Get all time entries (clock-in, clock-out, pauses, etc.)
const timeEntries = await evvService.getTimeEntriesByVisit(
  'visit-123',
  userContext
);

timeEntries.forEach(entry => {
  console.log(`${entry.entryType} at ${entry.entryTimestamp}`);
  console.log(`  Location: ${entry.location.latitude}, ${entry.location.longitude}`);
  console.log(`  Accuracy: ${entry.location.accuracy}m`);
  console.log(`  In geofence: ${entry.location.isWithinGeofence}`);
  console.log(`  Verification: ${entry.verificationPassed ? 'PASSED' : 'FAILED'}`);
});
```

### Offline Clock-In (Mobile App)

```typescript
// When mobile device is offline, store clock-in locally
// and sync when connectivity restored

const offlineClockIn = {
  visitId: 'visit-123',
  caregiverId: 'caregiver-456',
  location: {
    // ... GPS coordinates captured offline
  },
  deviceInfo: {
    // ... device info
    networkType: 'OFFLINE',
  },
  offlineRecorded: true,
  offlineRecordedAt: new Date(),
  syncMetadata: {
    syncId: generateUUID(),
    lastSyncedAt: null,
    syncStatus: 'PENDING',
  },
};

// Store in local SQLite/IndexedDB
await localDB.storeTimeEntry(offlineClockIn);

// Later, when connectivity restored:
const pendingEntries = await localDB.getPendingTimeEntries();
for (const entry of pendingEntries) {
  try {
    await evvService.clockIn(entry, userContext);
    await localDB.markAsSynced(entry.id);
  } catch (error) {
    console.error('Sync failed:', error);
    // Will retry on next sync attempt
  }
}
```

## Database Schema

### evv_records table

```sql
CREATE TABLE evv_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL UNIQUE,
    organization_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    client_id UUID NOT NULL,
    caregiver_id UUID NOT NULL,
    
    -- Required EVV elements
    service_type_code VARCHAR(50) NOT NULL,
    service_type_name VARCHAR(200) NOT NULL,
    client_name VARCHAR(200) NOT NULL, -- Encrypted
    client_medicaid_id VARCHAR(50), -- Encrypted
    caregiver_name VARCHAR(200) NOT NULL,
    caregiver_employee_id VARCHAR(50) NOT NULL,
    caregiver_npi VARCHAR(20),
    service_date DATE NOT NULL,
    service_address JSONB NOT NULL,
    clock_in_time TIMESTAMP NOT NULL,
    clock_out_time TIMESTAMP,
    total_duration INTEGER, -- minutes
    
    -- Location verification
    clock_in_verification JSONB NOT NULL,
    clock_out_verification JSONB,
    mid_visit_checks JSONB,
    
    -- Events
    pause_events JSONB,
    exception_events JSONB,
    
    -- Compliance and integrity
    record_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    verification_level VARCHAR(50) NOT NULL,
    compliance_flags JSONB NOT NULL DEFAULT '[]',
    integrity_hash VARCHAR(64) NOT NULL,
    integrity_checksum VARCHAR(64) NOT NULL,
    
    -- Audit and sync
    recorded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    recorded_by UUID NOT NULL,
    sync_metadata JSONB NOT NULL,
    submitted_to_payor TIMESTAMP,
    payor_approval_status VARCHAR(50),
    
    -- State-specific
    state_specific_data JSONB,
    
    -- Attestations
    caregiver_attestation JSONB,
    client_attestation JSONB,
    supervisor_review JSONB,
    
    -- Standard entity fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    
    CONSTRAINT fk_visit FOREIGN KEY (visit_id) 
        REFERENCES visits(id),
    CONSTRAINT fk_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id),
    CONSTRAINT fk_branch FOREIGN KEY (branch_id) 
        REFERENCES branches(id),
    CONSTRAINT fk_client FOREIGN KEY (client_id) 
        REFERENCES clients(id),
    CONSTRAINT fk_caregiver FOREIGN KEY (caregiver_id) 
        REFERENCES caregivers(id)
);

CREATE INDEX idx_evv_visit ON evv_records(visit_id);
CREATE INDEX idx_evv_client ON evv_records(client_id, service_date);
CREATE INDEX idx_evv_caregiver ON evv_records(caregiver_id, service_date);
CREATE INDEX idx_evv_service_date ON evv_records(service_date);
CREATE INDEX idx_evv_status ON evv_records(record_status);
CREATE INDEX idx_evv_compliance ON evv_records 
    USING gin(compliance_flags);
CREATE INDEX idx_evv_submission ON evv_records(submitted_to_payor) 
    WHERE submitted_to_payor IS NOT NULL;
```

### time_entries table

```sql
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL,
    evv_record_id UUID,
    organization_id UUID NOT NULL,
    caregiver_id UUID NOT NULL,
    client_id UUID NOT NULL,
    
    -- Entry details
    entry_type VARCHAR(50) NOT NULL, -- CLOCK_IN, CLOCK_OUT, PAUSE, RESUME, CHECK_IN
    entry_timestamp TIMESTAMP NOT NULL,
    
    -- Location
    location JSONB NOT NULL,
    
    -- Device
    device_id VARCHAR(100) NOT NULL,
    device_info JSONB NOT NULL,
    
    -- Integrity
    integrity_hash VARCHAR(64) NOT NULL,
    server_received_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Sync
    sync_metadata JSONB NOT NULL,
    offline_recorded BOOLEAN DEFAULT false,
    offline_recorded_at TIMESTAMP,
    
    -- Verification
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    verification_passed BOOLEAN NOT NULL,
    verification_issues JSONB,
    manual_override JSONB,
    
    -- Standard entity fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    
    CONSTRAINT fk_visit FOREIGN KEY (visit_id) 
        REFERENCES visits(id),
    CONSTRAINT fk_evv_record FOREIGN KEY (evv_record_id) 
        REFERENCES evv_records(id),
    CONSTRAINT fk_caregiver FOREIGN KEY (caregiver_id) 
        REFERENCES caregivers(id)
);

CREATE INDEX idx_time_entries_visit ON time_entries(visit_id, entry_timestamp);
CREATE INDEX idx_time_entries_caregiver ON time_entries(caregiver_id, entry_timestamp);
CREATE INDEX idx_time_entries_status ON time_entries(status);
CREATE INDEX idx_time_entries_offline ON time_entries(offline_recorded) 
    WHERE offline_recorded = true;
CREATE INDEX idx_time_entries_pending ON time_entries(status) 
    WHERE status = 'PENDING';
```

### geofences table

```sql
CREATE TABLE geofences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    client_id UUID NOT NULL,
    address_id UUID NOT NULL,
    
    -- Location
    center_latitude DECIMAL(10, 8) NOT NULL,
    center_longitude DECIMAL(11, 8) NOT NULL,
    radius_meters INTEGER NOT NULL,
    radius_type VARCHAR(50) NOT NULL DEFAULT 'STANDARD',
    shape VARCHAR(50) NOT NULL DEFAULT 'CIRCLE',
    polygon_points JSONB,
    
    -- Settings
    is_active BOOLEAN DEFAULT true,
    allowed_variance INTEGER, -- Additional meters
    
    -- Calibration
    calibrated_at TIMESTAMP,
    calibrated_by UUID,
    calibration_method VARCHAR(50),
    calibration_notes TEXT,
    
    -- Performance metrics
    verification_count INTEGER DEFAULT 0,
    successful_verifications INTEGER DEFAULT 0,
    failed_verifications INTEGER DEFAULT 0,
    average_accuracy DECIMAL(8, 2), -- meters
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    
    -- Standard entity fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    
    CONSTRAINT fk_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id),
    CONSTRAINT fk_client FOREIGN KEY (client_id) 
        REFERENCES clients(id)
);

CREATE INDEX idx_geofences_address ON geofences(address_id) 
    WHERE is_active = true AND status = 'ACTIVE';
CREATE INDEX idx_geofences_client ON geofences(client_id);
CREATE INDEX idx_geofences_location ON geofences(center_latitude, center_longitude);
```

## Permissions

### Required Permissions

- `evv:clock_in` - Clock in to start visit
- `evv:clock_out` - Clock out to end visit
- `evv:read` - View EVV records and time entries
- `evv:override` - Apply manual overrides (supervisor only)
- `geofences:create` - Create geofences
- `geofences:read` - View geofences
- `geofences:update` - Modify geofences
- `evv:reports` - Generate compliance reports
- `evv:submit` - Submit to payor/billing

### Role-Based Access

- **SUPER_ADMIN** - Full access to all EVV functions
- **ORG_ADMIN** - Full access within organization
- **BRANCH_ADMIN** - Full access within branches, apply overrides
- **COORDINATOR** - Apply manual overrides, generate reports
- **CAREGIVER** - Clock in/out for own visits only
- **BILLING** - View EVV records, generate reports, submit to payor
- **AUDITOR** - Read-only access for compliance audits

## Integration Points

This vertical integrates with:

- **Scheduling & Visit Management** - Links to visit records, updates visit status
- **Client & Demographics** - Client information and addresses
- **Caregiver & Staff Management** - Caregiver information and credentials
- **Billing & Invoicing** - Provides verified hours for billing
- **Payroll Processing** - Provides worked hours for payroll
- **Compliance & Documentation** - EVV documentation and audit trails
- **Mobile App** - Primary interface for caregivers to clock in/out

## Compliance Features

### Federal Requirements (21st Century Cures Act)

✅ All six required data elements captured  
✅ Secure, tamper-evident records  
✅ Electronic capture and transmission  
✅ Retention of records per federal guidelines  
✅ Accessibility for audits and reviews  

### State-Specific Requirements

- **Extensible Data Model** - State-specific fields supported
- **Configurable Verification** - Adjust requirements per state rules
- **Custom Reporting** - State-specific report formats
- **Flexible Geofencing** - Adjust radius requirements per state

### Security & Privacy

- **Encryption at Rest** - Client PII and Medicaid IDs encrypted
- **Encryption in Transit** - TLS 1.3 for all API communication
- **Access Control** - Role-based permissions enforced
- **Audit Logging** - Complete audit trail of all access
- **Data Retention** - Configurable retention policies
- **HIPAA Compliance** - Protected health information safeguarded

## Future Enhancements

- [ ] Bluetooth beacon verification (for indoor/basement locations)
- [ ] Voice recognition for hands-free clock-in/out
- [ ] NFC tag verification at client location
- [ ] QR code verification
- [ ] Real-time location tracking during visit
- [ ] Predictive geofence optimization using ML
- [ ] Automated fraud detection patterns
- [ ] Integration with state EVV aggregators
- [ ] Batch submission to multiple payors
- [ ] Advanced analytics and anomaly detection
- [ ] Caregiver route optimization based on geofences
- [ ] Family notification on clock-in/out
- [ ] Video verification option
- [ ] Wearable device support (smartwatch clock-in)

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

### EVV Compliance Tests

```bash
npm run test:compliance
```

## Provider Integrations

The EVV vertical integrates with other verticals through clean provider interfaces that maintain decoupling while enabling real-time data access for compliance operations.

### Client Provider

The `ClientProvider` fetches real client demographic data needed for EVV record creation:

```typescript
import { createClientProvider } from '@care-commons/time-tracking-evv';

const clientProvider = createClientProvider(database);

// Get client data for EVV compliance
const client = await clientProvider.getClientForEVV(clientId);
// Returns: { id, name, medicaidId, dateOfBirth, stateCode, ... }
```

**Features:**
- Fetches client name, Medicaid ID, and state code for EVV records
- Extracts Medicaid information from service eligibility JSONB
- Handles multiple Medicaid program structures (state-specific variations)
- Returns contact information for notifications

### Caregiver Provider

The `CaregiverProvider` validates caregiver credentials and authorizations:

```typescript
import { createCaregiverProvider } from '@care-commons/time-tracking-evv';

const caregiverProvider = createCaregiverProvider(database);

// Get caregiver credentials
const caregiver = await caregiverProvider.getCaregiverForEVV(caregiverId);

// Validate authorization to provide service
const authCheck = await caregiverProvider.canProvideService(
  caregiverId,
  serviceTypeCode,
  clientId
);

if (!authCheck.authorized) {
  console.log(`Blocked: ${authCheck.reason}`);
  console.log(`Missing: ${authCheck.missingCredentials}`);
}
```

**Features:**
- Validates background screening status (CLEARED, EXPIRED, FAILED, PENDING)
- Filters active vs. expired credentials based on expiration dates
- Checks client-specific restrictions
- Validates service-type requirements (e.g., RN license for skilled nursing)
- Extracts NPI (National Provider Identifier) for state submissions
- Checks state registry status for multi-state operations

### Visit Provider

The `VisitProvider` (in scheduling-visits vertical) supplies visit details:

```typescript
import { createVisitProvider } from '@care-commons/scheduling-visits';

const visitProvider = createVisitProvider(pool, database);

// Get visit data for EVV
const visit = await visitProvider.getVisitForEVV(visitId);

// Validate clock-in eligibility
const canClockIn = await visitProvider.canClockIn(visitId, caregiverId);
```

**Features:**
- Fetches visit scheduling details (date, time, duration)
- Provides service address with geocoded coordinates for geofencing
- Validates visit assignment and status before clock operations
- Updates visit status based on EVV events
- Integrates with care plan data for authorization information

### Zero Mock Data

⚠️ **Production-Ready**: All providers use **real database queries** with zero mock data or temporary implementations. Regression tests ensure we never regress back to mocks.

Run regression tests to verify:
```bash
npm run test -- provider-integration.regression.test.ts
```

## License

See [LICENSE](../../LICENSE) for details.

---

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
