# Florida Regulatory Changelog

**State Code**: FL

This document tracks changes to Florida home healthcare regulations and how they affect Care Commons implementation.

## 2025

### 2025-11-05 - Initial Documentation

### Change Description
Initial comprehensive documentation of Florida home healthcare regulatory requirements for Care Commons.

### Effective Date
N/A - Initial documentation

### Impact Analysis
- **Severity**: High (Foundation)
- **Affected Components**: 
  - Core compliance validation system
  - Florida-specific validators
  - Multi-aggregator EVV implementation
  - Level 2 background screening tracking
  - MCO-specific routing logic
- **Customer Impact**: Establishes compliance framework for Florida agencies
- **Breaking Change**: No (new feature)

### Implementation Changes

#### Requirements Documentation
- Created: REQUIREMENTS.md with comprehensive Florida regulatory requirements
- Documented: Level 2 background screening (5-year lifecycle)
- Documented: CNA and HHA certification requirements
- Documented: RN supervision requirements (60-day visits)
- Documented: MCO authorization and multi-plan management
- Documented: Plan of care requirements
- Documented: Visit documentation standards
- Documented: EVV multi-aggregator model (unique to Florida)
- Documented: Lenient geofencing (150m + 100m tolerance = 250m)
- Documented: Grace periods (15 minutes vs. Texas 10 minutes)
- Documented: Telephony fallback option
- Documented: Data retention, incident reporting

#### Code Changes
Planned implementation:
- `packages/core/src/compliance/florida/credentials.ts`
- `packages/core/src/compliance/florida/authorization.ts`
- `verticals/time-tracking-evv/src/providers/florida-evv-provider.ts`
- Multi-aggregator routing logic

Existing EVV implementation:
- `verticals/time-tracking-evv/src/config/state-evv-configs.ts` (FL config)
- `verticals/time-tracking-evv/src/aggregators/aggregator-router.ts`

#### Test Updates
Planned test scenarios:
- Level 2 background screening (8 scenarios)
- CNA registry validation (5 scenarios)
- HHA certification (4 scenarios)
- RN supervision (4 scenarios)
- MCO authorization (10 scenarios)
- Multi-aggregator routing (6 scenarios)
- Geofence validation (5 scenarios)
- Telephony fallback (4 scenarios)

### Deployment Notes
- Documentation-only change for Phase 2
- Implementation to follow in Phase 3

### Customer Communication
N/A - Internal documentation

### References
- Florida Statutes Chapter 400, 409, 435: http://www.leg.state.fl.us/Statutes/
- Florida Administrative Code 59A-8: https://www.flrules.org/
- AHCA Website: https://ahca.myflorida.com/
- Care Commons GitHub: https://github.com/neighborhood-lab/care-commons

---

## Monitoring for Changes

### Official Sources to Monitor

- **AHCA Website**: https://ahca.myflorida.com/ - Check weekly
- **Florida Register**: https://www.flrules.org/ - Subscribe to alerts
- **AHCA Provider Updates**: https://ahca.myflorida.com/Medicaid/Provider_Updates.shtml
- **Industry Associations**: 
  - Florida Association for Home Care (FAHC): https://www.fahc.org/
  - Florida Health Care Association: https://www.fhca.org/

### Monitoring Responsibilities

- **Primary**: Compliance Team Lead - Daily monitoring of AHCA alerts
- **Backup**: Regulatory Affairs - Weekly scan of Florida Register
- **Escalation**: General Counsel - Regulatory interpretation

### Review Schedule

- **Weekly**: Scan AHCA provider updates and bulletins
- **Monthly**: Review Florida Register for proposed rules
- **Quarterly**: Full compliance audit against current regulations
- **Annually**: Comprehensive regulation review and documentation update

### Alert Triggers

Set up automated alerts for:
- "Florida AHCA" + "home health" + "rule change"
- "Florida Administrative Code" + "59A-8" + "amendment"
- "Florida EVV" + "policy update"
- "Level 2 background screening" + "Florida" + "change"
- "Florida Medicaid" + "managed care" + "update"

---

## Historical Context

### Key Regulatory Milestones

**2019**: Florida implemented EVV mandate
- Open vendor model (unlike Texas single aggregator)
- Multiple aggregator support required
- Lenient geofence parameters (150m base)

**2020**: COVID-19 Emergency Orders
- Temporary suspension of some in-person requirements
- Virtual supervision allowed
- Extended authorization periods
- Most waivers expired 2021-2022

**2021**: Statewide Medicaid Managed Care Expansion
- Most recipients transitioned to managed care
- Multiple MCO contracts statewide
- MCO-specific authorization processes

**2022**: Level 2 Background Screening Updates
- Clarified 5-year renewal cycle
- Enhanced disqualifying offense list
- Improved FDLE database integration

**2023**: RN Supervision Clarification
- Confirmed 60-day supervisory visit requirement
- Specified skilled nursing criteria
- Enhanced competency evaluation standards

**2024**: EVV Policy Refinements
- Clarified telephony fallback requirements
- Updated geofence tolerance guidance
- Improved multi-aggregator routing

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

1. **Hurricane Preparedness**: Potential new requirements post-hurricane season
2. **Telehealth Expansion**: Permanent telehealth provisions under discussion
3. **EVV Aggregator Competition**: New vendors seeking AHCA approval
4. **Managed Care Contract Updates**: MCO contract renewals 2025-2026
5. **Background Screening Modernization**: Potential for automated systems

---

## Florida-Specific Compliance Notes

### Multi-Aggregator Complexity

Florida's open vendor model creates unique challenges:
- **MCO Preferences**: Different MCOs prefer different aggregators
- **Routing Logic**: Must determine correct aggregator per client/MCO
- **Multiple Submissions**: Some visits may require dual submission
- **Reconciliation**: Tracking which aggregator accepted which visit

**Recommendation**: Maintain detailed logs of aggregator routing decisions and submission results for audit purposes.

### Hurricane Season Considerations

Florida agencies must plan for hurricane season (June 1 - November 30):
- **Evacuation Plans**: Client evacuation and service continuity
- **Power Outages**: EVV system offline capabilities essential
- **Communication**: Alternative contact methods when cellular down
- **Supply Chains**: Backup supplies for caregivers
- **Documentation**: Disaster-related service exceptions

**EVV Impact**: AHCA is generally lenient with EVV exceptions during declared emergencies, but documentation of emergency conditions is required.

### Large Geographic Footprint

Florida is large and diverse:
- **Urban**: Miami, Tampa, Orlando - high-rise challenges
- **Suburban**: Sprawling communities, HOAs with access control
- **Rural**: Panhandle, inland areas - cellular/GPS challenges
- **Coastal**: Islands, bridges - weather and access issues
- **Retirement Communities**: Large campuses, gated access

**Geofence Strategy**: 250m tolerance accommodates most scenarios, but some locations may require facility-wide geofences or special handling.

---

## Contact Information

### Regulatory Questions

- **AHCA Provider Support**: 1-850-412-4018 (M-F 8am-5pm ET)
- **EVV Support**: evv@ahca.myflorida.com
- **Background Screening**: 1-888-419-3456 (24/7 automated)
- **Florida Board of Nursing**: 1-850-488-0595

### Emergency Contacts

- **Adult Protective Services**: 1-800-96-ABUSE (1-800-962-2873) (24/7)
- **AHCA Complaint Hotline**: 1-888-419-3456 (24/7)
- **DOEA**: 1-850-414-2000
- **Fraud Hotline**: 1-866-966-7226

---

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
