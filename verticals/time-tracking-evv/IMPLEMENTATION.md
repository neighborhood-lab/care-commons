# Time Tracking & EVV - Implementation Status

**Status**: ✅ Initial implementation complete  
**Version**: 0.1.0  
**Last Updated**: 2024

## Overview

The Time Tracking & Electronic Visit Verification (EVV) vertical provides comprehensive capabilities for compliance with federal and state EVV requirements under the 21st Century Cures Act. The implementation captures accurate timing and location evidence of home care visits with robust anti-fraud measures.

## Completed Components

### ✅ Core Types & Domain Model

**File**: `src/types/evv.ts`

Comprehensive type definitions including:
- `EVVRecord` - Complete compliance record with all 6 required federal data elements
- `LocationVerification` - GPS-based location proof with integrity checks
- `TimeEntry` - Individual clock events with offline support
- `Geofence` - Virtual boundaries for location verification
- `EVVComplianceReport` - Regulatory reporting structures
- Support types for attestations, manual overrides, exceptions, and sync

**Key Features**:
- Federal EVV compliance (21st Century Cures Act)
- State-specific extensibility
- Tamper-evident design with cryptographic hashing
- Offline-first architecture with sync metadata
- Multiple verification methods (GPS, biometric, phone, manual)
- GPS spoofing and device security detection

### ✅ Repository Layer

**File**: `src/repository/evv-repository.ts`

Data access layer with methods for:
- Creating and updating EVV records
- Managing time entries with sync status
- Geofence creation and statistics tracking
- Search and filtering with pagination
- Pending entry queries for offline sync

**Key Features**:
- PostgreSQL-backed with JSONB for flexibility
- Efficient indexing for common query patterns
- Transaction support for data integrity
- Bulk operations for sync scenarios
- Automatic timestamp and version management

### ✅ Validation Layer

**File**: `src/validation/evv-validator.ts`

Comprehensive validation including:
- Clock-in/out input validation
- GPS coordinate and accuracy validation
- Device info and security checks
- Geofence boundary calculations (Haversine formula)
- Integrity verification (hash and checksum)
- Comprehensive verification results with issue flagging
- Mock location and rooted device detection

**Key Features**:
- Anomaly detection (impossible location jumps, time gaps, etc.)
- Configurable thresholds for verification
- Severity-based issue categorization
- Supervisor review requirements
- Geofence distance calculations

### ✅ Service Layer

**File**: `src/service/evv-service.ts`

Business logic implementation:
- `clockIn()` - Start visit with location verification
- `clockOut()` - End visit with duration calculation
- `applyManualOverride()` - Supervisor review and approval
- `createGeofence()` - Geofence management
- `getEVVRecordByVisit()` - Record retrieval
- `getTimeEntriesByVisit()` - Time entry history

**Key Features**:
- Permission-based access control
- Integration with scheduling vertical
- Automatic geofence creation
- Integrity hash generation
- Verification workflow with flagging
- Exception tracking and logging

### ✅ Documentation

- **README.md** - Complete feature documentation with usage examples
- **QUICKSTART.md** - 10-minute getting started guide
- **IMPLEMENTATION.md** - This file

## Database Schema

### Tables Created

1. **evv_records** - Main EVV compliance records
   - All 6 federal data elements
   - Location verification data
   - Integrity hashes and checksums
   - Sync metadata
   - State-specific extensibility

2. **time_entries** - Individual clock events
   - Clock-in, clock-out, pause, resume, check-in
   - Device information and GPS data
   - Offline support with sync status
   - Manual override tracking

3. **geofences** - Location boundaries
   - Circular and polygon shapes
   - Performance metrics
   - Auto-calibration support
   - Success rate tracking

### Indexes

Optimized for:
- Visit-based lookups
- Date range queries
- Caregiver schedule views
- Pending sync queries
- Compliance reporting
- Geofence proximity searches

## API Endpoints (Future)

The following REST API endpoints will be implemented in a future update:

```
POST   /api/evv/clock-in           - Clock in to start visit
POST   /api/evv/clock-out          - Clock out to end visit
POST   /api/evv/check-in           - Mid-visit location check
POST   /api/evv/pause              - Pause visit
POST   /api/evv/resume             - Resume visit
GET    /api/evv/records/:id        - Get EVV record
GET    /api/evv/visits/:visitId    - Get EVV record by visit
GET    /api/evv/time-entries/:visitId - Get time entries
POST   /api/evv/override           - Apply manual override
POST   /api/geofences              - Create geofence
GET    /api/geofences/:addressId   - Get geofence
PATCH  /api/geofences/:id          - Update geofence
POST   /api/evv/reports            - Generate compliance report
GET    /api/evv/pending-sync       - Get entries needing sync
POST   /api/evv/batch-sync         - Sync multiple entries
```

## Testing Strategy

### Unit Tests (TODO)

- [ ] EVV type validation
- [ ] Geofence distance calculations
- [ ] Integrity hash generation
- [ ] Mock location detection logic
- [ ] Time duration calculations
- [ ] Compliance flag rules

### Integration Tests (TODO)

- [ ] Clock-in/out workflow
- [ ] Geofence verification
- [ ] Manual override process
- [ ] Offline sync scenarios
- [ ] Database transactions
- [ ] Permission enforcement

### Compliance Tests (TODO)

- [ ] Federal data element capture
- [ ] State-specific requirements
- [ ] Audit trail completeness
- [ ] Data retention rules
- [ ] Encryption verification
- [ ] Integrity tamper detection

## Security Considerations

### Implemented

- ✅ Role-based access control
- ✅ Permission checks on all operations
- ✅ Cryptographic hashing for integrity
- ✅ Mock location detection
- ✅ Rooted/jailbroken device detection
- ✅ User context validation

### TODO

- [ ] Encrypt PII fields (client_name, client_medicaid_id)
- [ ] Rate limiting for API endpoints
- [ ] Device fingerprinting
- [ ] Biometric verification
- [ ] Photo verification storage
- [ ] Secure key management for hashing

## Performance Optimizations

### Current

- JSONB for flexible nested data
- Indexes on common query patterns
- Efficient geofence distance calculations
- Bulk operations for sync

### TODO

- [ ] Redis caching for geofences
- [ ] Background job processing for reports
- [ ] Batch operations for payor submission
- [ ] Database partitioning by date
- [ ] Read replicas for reporting
- [ ] CDN for photo/signature storage

## State-Specific Requirements

### Extensible Design

The `state_specific_data` JSONB field allows storing additional data per state requirements:

```typescript
// Example: New York requirements
stateSpecificData: {
  state: 'NY',
  additionalFields: {
    taskCodes: ['ADL-01', 'ADL-02'],
    serviceAuthNumber: 'AUTH-123',
    countyCode: '061',
  }
}

// Example: California requirements  
stateSpecificData: {
  state: 'CA',
  additionalFields: {
    ihssCase: 'IHSS-456',
    providerEnrollmentId: 'PE-789',
    waiverId: 'WAIV-012',
  }
}
```

### TODO: State Implementations

- [ ] New York state requirements
- [ ] California (IHSS) requirements
- [ ] Texas requirements
- [ ] Florida requirements
- [ ] Pennsylvania requirements
- [ ] State EVV aggregator integration

## Integration Points

### With Other Verticals

1. **Scheduling & Visit Management**
   - Get visit details for EVV record creation
   - Update visit status on clock-in/out
   - Link to visit.id

2. **Client & Demographics**
   - Client name and Medicaid ID
   - Service address for geofence
   - Emergency contacts

3. **Caregiver & Staff Management**
   - Caregiver name and employee ID
   - NPI number for billing
   - Credentials and certifications

4. **Billing & Invoicing**
   - Verified hours for billing
   - EVV records for claim submission
   - Payor approval status

5. **Payroll Processing**
   - Worked hours for payroll
   - Clock-in/out times
   - Break time calculations

6. **Compliance & Documentation**
   - Audit trail access
   - Exception reporting
   - Compliance reports

### External Integrations (TODO)

- [ ] State EVV aggregator APIs
- [ ] Medicaid Management Information Systems (MMIS)
- [ ] Electronic Data Interchange (EDI) for claims
- [ ] Payor portals (Medicare, Medicaid, private insurance)
- [ ] Third-party EVV vendors
- [ ] Background check services
- [ ] Mobile device management (MDM) systems

## Mobile App Requirements

The mobile app should implement:

### Core Features

1. **Clock In/Out UI**
   - Large, accessible buttons
   - GPS status indicator
   - Battery level warning
   - Network status
   - Location accuracy display

2. **Offline Mode**
   - Local SQLite database
   - Queue pending entries
   - Automatic sync when online
   - Conflict resolution UI

3. **Location Services**
   - Request high-accuracy GPS
   - Background location tracking
   - Geofence enter/exit events
   - Mock location detection

4. **Device Security**
   - Root/jailbreak detection
   - Certificate pinning
   - Secure storage (Keychain/KeyStore)
   - Device ID generation

5. **User Experience**
   - Push notifications for clock-in reminders
   - Visit details display
   - Task checklist
   - Signature capture pad
   - Photo capture
   - Voice notes

### Platform-Specific

**iOS**:
- CoreLocation for GPS
- LocalAuthentication for Face ID/Touch ID
- SQLite.swift for offline storage
- Background location permissions

**Android**:
- Google Play Services Location API
- BiometricPrompt for fingerprint
- Room database for offline storage
- Foreground service for background location

## Deployment Checklist

### Development Environment

- [x] TypeScript types defined
- [x] Repository layer implemented
- [x] Validation layer implemented
- [x] Service layer implemented
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] API endpoints created
- [ ] Mobile SDK published

### Staging Environment

- [ ] Database migrations applied
- [ ] Indexes created
- [ ] Sample data seeded
- [ ] API deployed
- [ ] Mobile app beta testing
- [ ] Performance testing
- [ ] Security audit

### Production Environment

- [ ] Database encrypted at rest
- [ ] PII fields encrypted
- [ ] TLS 1.3 enforced
- [ ] Rate limiting configured
- [ ] Monitoring and alerts setup
- [ ] Backup and disaster recovery
- [ ] Compliance audit completed
- [ ] Staff training completed

## Regulatory Compliance

### Federal Requirements ✅

**21st Century Cures Act - Section 12006(a)**

All six required data elements captured:
1. ✅ Type of service performed
2. ✅ Individual receiving the service  
3. ✅ Individual providing the service
4. ✅ Date of service
5. ✅ Location of service delivery
6. ✅ Time service begins and ends

Additional federal requirements:
- ✅ Electronic capture and transmission
- ✅ Secure, tamper-evident records
- ✅ Audit trail capability
- ✅ Retention per CMS guidelines
- ✅ Privacy and security standards

### HIPAA Compliance

- ✅ Access control (role-based)
- ✅ Audit logging
- [ ] Encryption at rest (TODO)
- [ ] Encryption in transit (TLS)
- [ ] Business Associate Agreements
- [ ] Breach notification procedures
- [ ] Patient rights (access, amendment)

### State Compliance

- [ ] State-specific data elements
- [ ] State EVV aggregator submission
- [ ] State audit requirements
- [ ] State retention requirements

## Known Limitations

1. **Cryptographic Hashing**: Current implementation uses simple hash functions for demonstration. Production should use SHA-256 from crypto library.

2. **Encryption**: PII fields not yet encrypted at rest. Requires implementation of column-level encryption.

3. **Biometric Verification**: Type definitions exist but actual biometric integration not implemented.

4. **Photo Storage**: Photo URLs supported but no actual storage/CDN integration.

5. **State Requirements**: Extensible design but no specific state implementations yet.

6. **Payor Submission**: Data model supports it but no actual API integration with payors.

7. **Background Location**: Requires mobile app implementation.

8. **Bluetooth Beacons**: Not yet implemented (useful for indoor/basement locations).

## Future Enhancements

### Short Term (v0.2.0)

- [ ] Complete unit test coverage
- [ ] REST API implementation
- [ ] Proper cryptographic hashing
- [ ] PII encryption at rest
- [ ] Basic mobile SDK
- [ ] State: New York requirements

### Medium Term (v0.3.0)

- [ ] Biometric verification integration
- [ ] Photo storage and CDN
- [ ] Bluetooth beacon support
- [ ] Real-time location tracking
- [ ] Advanced anomaly detection
- [ ] Multiple state implementations
- [ ] State EVV aggregator integration

### Long Term (v1.0.0)

- [ ] Machine learning fraud detection
- [ ] Predictive geofence optimization
- [ ] Voice recognition clock-in
- [ ] NFC/QR code verification
- [ ] Wearable device support
- [ ] Video verification
- [ ] Route optimization
- [ ] Advanced analytics dashboard

## Migration Guide

For upgrading from a system without EVV:

### Phase 1: Setup (Week 1)

1. Run database migrations
2. Create geofences for existing clients
3. Configure state requirements
4. Train supervisors on manual override

### Phase 2: Pilot (Weeks 2-4)

1. Deploy mobile app to pilot caregivers
2. Run parallel with existing system
3. Monitor verification success rates
4. Adjust geofences as needed
5. Refine supervisor procedures

### Phase 3: Rollout (Weeks 5-8)

1. Gradual rollout by branch
2. Weekly review of exceptions
3. Optimize geofence radiuses
4. Integrate with billing system
5. Submit test claims to payors

### Phase 4: Full Production (Week 9+)

1. All visits using EVV
2. Automated billing submission
3. Regular compliance reports
4. Ongoing monitoring and optimization

## Support and Maintenance

### Monitoring

Key metrics to track:
- Verification success rate
- Average GPS accuracy
- Geofence violation rate
- Manual override frequency
- Sync failure rate
- Average visit duration
- Clock-out compliance

### Alerts

Setup alerts for:
- High frequency of verification failures
- Sudden increase in manual overrides
- Multiple mock location detections
- Sync failures exceeding threshold
- Geofence success rate below 90%
- Unusual visit duration patterns

### Maintenance Tasks

**Daily**:
- Monitor sync queue
- Review flagged visits
- Process manual overrides

**Weekly**:
- Geofence optimization
- Exception pattern analysis
- Performance review

**Monthly**:
- Compliance report generation
- Audit trail review
- Security assessment
- State submission verification

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

Key areas needing contribution:
1. State-specific implementations
2. Mobile app development
3. Biometric integration
4. Advanced fraud detection
5. Performance optimization
6. Documentation and examples

## License

AGPL-3.0 - See [LICENSE](../../LICENSE)

---

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
