# Texas Regulatory Changelog

**State Code**: TX

This document tracks changes to Texas home healthcare regulations and how they affect Care Commons implementation.

## 2025

### 2025-11-05 - Initial Documentation

### Change Description
Initial comprehensive documentation of Texas home healthcare regulatory requirements for Care Commons.

### Effective Date
N/A - Initial documentation

### Impact Analysis
- **Severity**: High (Foundation)
- **Affected Components**: 
  - Core compliance validation system
  - Texas-specific validators
  - EVV implementation
  - Caregiver credential tracking
- **Customer Impact**: Establishes compliance framework for Texas agencies
- **Breaking Change**: No (new feature)

### Implementation Changes

#### Requirements Documentation
- Created: REQUIREMENTS.md with comprehensive Texas regulatory requirements
- Documented: EMR, NAR, background screening, TB testing, training
- Documented: Authorization, plan of care, documentation requirements
- Documented: EVV requirements, HHAeXchange integration, VMUR process
- Documented: Data retention, privacy, incident reporting

#### Code Changes
Planned implementation in `packages/core/src/compliance/texas/`:
- `credentials.ts` - Texas credential validation
- `authorization.ts` - Texas authorization validation
- `evv.ts` - Texas EVV-specific logic

Existing EVV implementation:
- `verticals/time-tracking-evv/src/providers/texas-evv-provider.ts`
- `verticals/time-tracking-evv/src/service/vmur-service.ts`
- `verticals/time-tracking-evv/src/config/state-evv-configs.ts`

#### Test Updates
Planned test scenarios:
- EMR validation (6 scenarios)
- NAR validation (4 scenarios)
- Background screening (5 scenarios)
- TB testing (3 scenarios)
- Training requirements (3 scenarios)
- Authorization validation (8 scenarios)
- Plan of care validation (4 scenarios)
- EVV compliance (15+ scenarios)

### Deployment Notes
- Documentation-only change for Phase 1
- Implementation to follow in Phase 2

### Customer Communication
N/A - Internal documentation

### References
- Texas Administrative Code Title 26, Chapter 558: https://texreg.sos.state.tx.us/
- Texas Human Resources Code: https://statutes.capitol.texas.gov/
- HHSC EVV Policy: https://hhs.texas.gov/services/health/medicaid-chip/provider-information/electronic-visit-verification-evv
- Care Commons GitHub: https://github.com/neighborhood-lab/care-commons

---

## Monitoring for Changes

### Official Sources to Monitor

- **Texas HHSC Website**: https://hhs.texas.gov/ - Check weekly
- **Texas Register**: https://texreg.sos.state.tx.us/ - Subscribe to alerts
- **HHSC Provider Alerts**: Subscribe at https://hhs.texas.gov/providers
- **Industry Associations**: 
  - Texas Association for Home Care & Hospice (TAHCH): https://www.tahch.org/
  - Texas Home Care Association: https://texashomecare.org/

### Monitoring Responsibilities

- **Primary**: Compliance Team Lead - Daily monitoring of HHSC alerts
- **Backup**: Regulatory Affairs - Weekly scan of Texas Register
- **Escalation**: General Counsel - Regulatory interpretation

### Review Schedule

- **Weekly**: Scan HHSC provider alerts and bulletins
- **Monthly**: Review Texas Register for proposed rules
- **Quarterly**: Full compliance audit against current regulations
- **Annually**: Comprehensive regulation review and documentation update

### Alert Triggers

Set up automated alerts for:
- "Texas HHSC" + "home health" + "rule change"
- "26 TAC 558" + "amendment"
- "Texas EVV" + "policy update"
- "HHAeXchange" + "Texas" + "requirement"
- "Employee Misconduct Registry" + "change"

---

## Historical Context

### Key Regulatory Milestones

**2019**: Texas implemented EVV mandate (21st Century Cures Act)
- Designated HHAeXchange as state aggregator
- Established VMUR process for corrections
- Set geofence parameters (100m + tolerance)

**2020**: COVID-19 Emergency Waivers
- Temporary relaxation of some in-person requirements
- Virtual supervision allowed temporarily
- Most waivers expired by 2021

**2021**: Enhanced Background Screening
- Level 2 background screening required for vulnerable adults
- FBI fingerprints became mandatory
- 2-year renewal cycle established

**2022**: Training Hour Updates
- Increased orientation from 12 to 16 hours
- Added specific infection control requirements
- Enhanced abuse/neglect reporting training

**2023**: EMR Annual Verification
- Changed from "periodic" to specifically "annual" verification
- Established 365-day maximum interval
- Clarified consequences for listing

**2024**: Data Retention Clarification
- Confirmed 6-year retention requirement
- Aligned with HIPAA minimum
- Established audit trail requirements

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2025-11-05 | Initial comprehensive documentation | Care Commons Team |

---

## Upcoming Regulatory Changes

### Proposed Rules (Under Review)

No proposed rules currently under review affecting home healthcare.

### Industry Watch List

1. **EVV Aggregator Competition**: Potential for alternative aggregators to HHAeXchange
2. **Telehealth Expansion**: Possible permanent telehealth provisions post-COVID
3. **Wage & Hour Updates**: Texas minimum wage discussions (federal tied)
4. **Background Check Enhancements**: Potential expansion of disqualifying offenses

---

## Contact Information

### Regulatory Questions

- **HHSC Provider Helpline**: 1-800-925-9126 (M-F 8am-5pm CT)
- **EVV Support**: evv@hhs.texas.gov
- **HHAeXchange Support**: 1-855-472-3973 (24/7)
- **Texas Nurse Aide Registry**: 1-512-438-3161

### Emergency Contacts

- **Adult Protective Services**: 1-800-252-5400 (24/7)
- **HHSC Complaint Hotline**: 1-800-458-9858 (24/7)
- **OIG Fraud Hotline**: 1-800-436-6184

---

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
