# Changelog

All notable changes to the Time Tracking & EVV vertical will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-11-04

### Added - Multi-State EVV Support (OH, PA, GA, NC, AZ)

**MAJOR FEATURE**: Expanded EVV support from 2 states to 7 states (3x+ market expansion)

#### New States
- **Ohio (OH)**: Sandata aggregator, ODM standards, 125m geofence
- **Pennsylvania (PA)**: Sandata aggregator, DHS standards, 7-year retention (longest)
- **Georgia (GA)**: Tellus aggregator, DCH standards, 250m geofence (most lenient)
- **North Carolina (NC)**: Sandata aggregator, DHHS standards, 120m geofence
- **Arizona (AZ)**: Sandata aggregator, AHCCCS standards, non-medical NPI exemption

#### Architecture
- Created `aggregators/` directory with base interface and implementations
- Implemented `SandataAggregator` (serves OH, PA, NC, AZ with single codebase)
- Implemented `TellusAggregator` (serves GA)
- Created `AggregatorRouter` for automatic state-based routing
- Added `state-evv-configs.ts` with comprehensive state configurations

#### Database
- Migration `20251104000011_multistate_evv_expansion.ts`
- Expanded `state_code` constraints to include new states
- Created `evv_state_validation_rules` table with seeded data for all 7 states
- Added state-specific columns to `evv_state_config` table
- Created indexes for Sandata states batch optimization

#### Testing
- Added `multistate-aggregators.test.ts` with 26 comprehensive tests
- All tests passing (179 total EVV tests)
- Test coverage: 72.9% overall, new code tested thoroughly
- Zero regressions in existing TX/FL functionality

#### Documentation
- Created `MULTISTATE_GUIDE.md` - Complete integration guide
- Created `MIGRATION_GUIDE.md` - TX/FL migration guide
- Updated `README.md` with multi-state overview
- Added inline code documentation for all new modules

#### API
- Extended `EVVService.submitToStateAggregator()` to support all 7 states
- Added `getAggregatorRouter()` singleton for application-wide access
- Added `getStateConfig()` helper for state-specific configuration
- Added `validateStateGeography()` to prevent configuration errors

#### Types
- Extended `StateCode` type: `'TX' | 'FL' | 'OH' | 'PA' | 'GA' | 'NC' | 'AZ'`
- Added `StateEVVConfig` interface for aggregator configuration
- Added `AggregatorSubmissionResult` interface
- Added `ValidationResult` with errors and warnings

### Changed

#### Backward Compatible Changes
- `EVVService.submitToStateAggregator()` now routes to new aggregator architecture for OH, PA, GA, NC, AZ
- `getStateEVVRules()` expanded with 5 new state rule sets
- State validation now checks against 7 states instead of 2

#### Internal Improvements
- Refactored state routing to use polymorphic aggregator pattern
- Centralized state configuration (previously scattered across codebase)
- Improved validation error messages with state-specific context
- Enhanced geofence validation with state-aware tolerance

### Fixed
- None (new feature, no bugs fixed)

### Security
- Aggregator credentials stored encrypted in database
- OAuth 2.0 client credentials flow documented for Sandata
- API key authentication documented for Tellus
- Production stub implementations require proper HTTP clients before use

### Deprecated
- None (fully backward compatible)

### Removed
- None (fully backward compatible)

### Migration Notes

**IMPORTANT**: This release is 100% backward compatible. Existing TX and FL deployments will continue working without any changes.

To migrate:
1. Run database migration: `npm run db:migrate`
2. Deploy updated code
3. Optionally configure new states (OH, PA, GA, NC, AZ)

See `MIGRATION_GUIDE.md` for complete instructions.

### Performance Impact
- **Zero impact** on existing TX/FL deployments
- Sandata states (OH, PA, NC, AZ) can be batch-processed for efficiency
- Single aggregator instance serves 4 states (reduced resource usage)

### Breaking Changes
- None

---

## [1.0.0] - 2025-10-30

### Added - Initial EVV Implementation

#### Core Features
- Six federal EVV data elements (21st Century Cures Act compliance)
- GPS-based location verification with geofencing
- Mock location detection and device security checks
- Biometric verification support (fingerprint, facial, voice)
- Photo documentation at clock-in/out
- Digital signatures with cryptographic integrity
- Offline-first design with sync capabilities
- Anomaly detection for fraud prevention

#### State-Specific Support
- **Texas (TX)**: HHAeXchange aggregator, VMUR workflow, HHSC compliance
- **Florida (FL)**: Multi-aggregator support, MCO routing, AHCA compliance

#### Database Schema
- `evv_records` - Main EVV compliance records
- `evv_time_entries` - Individual clock events
- `evv_geofences` - Virtual boundaries for client addresses
- `evv_state_config` - State-specific aggregator configuration
- `evv_revisions` - Immutable audit trail
- `evv_original_data` - Baseline data preservation
- `evv_access_log` - PHI access tracking
- `texas_vmur` - Texas Visit Maintenance Unlock Request
- `state_aggregator_submissions` - Aggregator submission tracking
- `evv_exception_queue` - Exception workflow management

#### API
- `POST /api/evv/clock-in` - Start visit with location verification
- `POST /api/evv/clock-out` - End visit with location verification
- `POST /api/evv/manual-override` - Supervisor override for flagged visits
- `GET /api/evv/records/:id` - Retrieve EVV record details
- `GET /api/evv/records` - Search EVV records with filters

#### Validation
- Geofence validation with configurable radius
- Grace period enforcement (clock-in/out timing)
- GPS accuracy requirements
- Device security checks (rooted/jailbroken detection)
- Duplicate prevention
- Time anomaly detection

#### Security
- SHA-256 cryptographic hashing for integrity
- Encrypted storage of sensitive data
- Role-based access control
- Comprehensive audit logging
- Field-level permissions for PHI

#### Documentation
- `README.md` - Feature overview and usage
- `QUICKSTART.md` - Getting started guide
- `IMPLEMENTATION.md` - Technical implementation details
- `SUMMARY.md` - High-level summary

---

## Legend

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements
- **Migration Notes**: Important upgrade information
- **Breaking Changes**: Backward incompatible changes

---

**Note**: All releases maintain backward compatibility unless explicitly noted as breaking changes.
