# Changelog

All notable changes to Folk will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-01

### Added

**Core Platform**
- Full-stack TypeScript architecture with Node.js 22+ and ESM throughout
- PostgreSQL database with JSONB for flexible state-specific data
- JWT authentication with role-based access control
- HIPAA-compliant audit logging for all PHI access
- Multi-tenant organization support

**Electronic Visit Verification (EVV)**
- 21st Century Cures Act compliant EVV tracking
- All 50 states + DC compliance configurations
- GPS-verified clock in/out with configurable geofence tolerances
- State-specific aggregator integrations (HHAeXchange, Sandata, Tellus)
- Visit correction workflows with supervisor approval
- Real-time compliance rate dashboard

**Client Demographics**
- Comprehensive client profiles with care needs assessment
- Service authorization tracking with usage alerts
- Emergency contact management
- Address geocoding for geofence validation

**Caregiver Management**
- Credential tracking with expiration alerts
- Background screening status by state
- License and certification management
- Competency evaluations and training records

**Scheduling & Visits**
- Visual calendar with drag-and-drop scheduling
- Smart Match caregiver recommendations
- Visit status tracking (scheduled, in-progress, completed)
- Recurring visit patterns

**Care Plans & Tasks**
- Care plan templates with state-specific requirements
- Task checklists with completion tracking
- Photo documentation support
- Signature capture for visit verification

**Family Engagement Portal**
- Real-time activity feed for family members
- Care plan visibility and progress tracking
- Secure messaging with care team
- Visit schedule visibility

**Billing & Payroll**
- EVV-based timesheet generation
- Authorization unit tracking
- Payroll export capabilities
- Invoice generation

**Compliance Automation**
- Proactive credential expiration monitoring
- Authorization usage alerts (80%/90% thresholds)
- Care plan review reminders
- Audit report generation

**Mobile App (React Native)**
- Offline-first architecture with WatermelonDB
- GPS-verified EVV with biometric authentication
- Task completion and documentation
- Automatic sync when connected

**Showcase Demo**
- Interactive demo with realistic data
- Multi-role experience (coordinator, caregiver, family, admin)
- No backend required (localStorage)
- Guided tours for new users

### Technical Highlights

- **Test Coverage**: 420+ tests across packages
- **Security**: Sentry error tracking with PHI scrubbing
- **Performance**: 83 database indexes for query optimization
- **Bundle Size**: Web app under 500kB gzipped
- **CI/CD**: GitHub Actions with lint, typecheck, test, build gates

### Documentation

- Comprehensive API documentation with OpenAPI spec
- Architecture guide (588 lines)
- State-specific compliance reference for all 50 states
- Launch day checklist and deployment guide
- FAQ for common questions

---

## [Unreleased]

### Planned
- Real-time visit notifications
- Advanced reporting and analytics
- Shift matching ML enhancements
- Additional state aggregator integrations

---

**Folk** - Shared care software, community owned.  
Built by [Neighborhood Lab](https://neighborhoodlab.org)
