# Ohio Compliance Changelog

**State Code**: OH  
**Monitoring Authority**: Ohio Department of Medicaid (ODM)  
**Last Review**: 2025-11-05

---

## Purpose

This changelog tracks all changes to Ohio home healthcare compliance requirements. When Ohio regulations change, this file documents:
1. What changed
2. When it takes effect
3. How it impacts Care Commons implementation
4. Migration path for existing data/workflows

---

## Monitoring Sources

### Primary Sources (Check Weekly)
- **Ohio Department of Medicaid**: https://medicaid.ohio.gov/
  - Provider Updates: https://medicaid.ohio.gov/resources-for-providers/provider-updates
  - Rule Making: https://medicaid.ohio.gov/about-us/medicaid-rules
- **Ohio Register**: https://www.registerofohio.state.oh.us/
  - Subscribe to "Health and Human Services" category
- **Ohio Administrative Code (OAC)**: https://codes.ohio.gov/ohio-administrative-code
  - Title 5160 (Medicaid)
  - Title 3701 (Public Health)
- **Ohio Revised Code (ORC)**: https://codes.ohio.gov/ohio-revised-code
  - Chapter 3721 (Nursing Homes)
  - Chapter 5164 (Medical Assistance Programs)

### Secondary Sources (Check Monthly)
- **Ohio Association for Home Care**: https://www.ohiohomecare.org/
  - Member alerts and regulatory updates
- **Sandata Provider Portal**: https://www.sandata.com/
  - EVV system updates and bulletins
- **Centers for Medicare & Medicaid Services (CMS)**: https://www.cms.gov/
  - Federal EVV policy changes

### Alert Configuration
```bash
# Google Alerts
- "Ohio Department of Medicaid" + "home health" + "rule change"
- "Ohio Administrative Code 5160-12" + "amendment"
- "Ohio EVV" + "Sandata"
- "Ohio Nurse Aide Registry" + "requirement"

# RSS Feeds
- https://medicaid.ohio.gov/resources-for-providers/provider-updates/rss
- https://www.registerofohio.state.oh.us/rss
```

---

## Change History

### 2025-11-05 - Initial Documentation ✅

**Type**: Milestone  
**Status**: Complete  

**Changes**:
- Initial comprehensive documentation of Ohio compliance requirements
- Established baseline for all regulatory standards as of November 2025
- Documented current requirements for:
  - Background screening (FBI+BCI, 5-year cycle)
  - STNA registry (2-year certification cycle, 12 hours CE)
  - HHA training (75-hour program, annual competency)
  - RN supervision (14-day new, 60-day established)
  - Service authorization (MCO prior auth, units tracking)
  - Plan of care (60-day review cycle)
  - Visit documentation (24-hour timeliness)
  - EVV requirements (Sandata aggregator, 125m+75m geofence, 10-min grace)

**Implementation**:
- Created `docs/compliance/ohio/REQUIREMENTS.md` (comprehensive regulation documentation)
- Created `docs/compliance/ohio/IMPLEMENTATION.md` (developer guide)
- Created `docs/compliance/ohio/TEST_SCENARIOS.md` (65 test scenarios)
- Created `docs/compliance/ohio/CHANGELOG.md` (this file)

**Impact**: None (baseline establishment)

**Sources**: 
- Ohio Revised Code §173.27, §3721.30, §4723, §5164.34
- Ohio Administrative Code 3701-18-03, 5160-1-17, 5160-12-03, 5160-58-01
- 21st Century Cures Act §12006(a)
- 42 CFR §484

**Care Commons Version**: v0.9.0

---

### [No prior changes - this is initial documentation]

---

## Historical Milestones (Ohio Medicaid Home Health)

### 2024-01-01 - MyCare Ohio Expansion
**Type**: Program Expansion  
**Status**: Implemented

**Changes**:
- MyCare Ohio (dual-eligible program) expanded to additional counties
- New MCO contracts: Aetna Better Health, Molina Healthcare
- Updated authorization routing for dual-eligible beneficiaries

**Impact**: Moderate
- Required MCO-specific authorization workflows
- Updated Sandata submission routing

**Source**: Ohio Department of Medicaid MyCare Ohio Expansion Notice

---

### 2021-01-01 - EVV Implementation
**Type**: Federal Mandate Implementation  
**Status**: Implemented

**Changes**:
- Ohio implemented Electronic Visit Verification (EVV) for personal care services
- Selected Sandata Technologies as state EVV aggregator (FREE for providers)
- Established EVV standards:
  - GPS required for home-based visits
  - Telephony acceptable for facility visits
  - 125m base geofence + 75m GPS tolerance
  - 10-minute grace periods
  - 7-day correction window

**Impact**: High
- All personal care providers required to implement EVV
- FREE aggregator reduced provider costs (vs. other states charging fees)
- Real-time and batch submission options

**Source**: 21st Century Cures Act §12006(a), Ohio Administrative Code 5160-1-17.2

---

### 2019-07-01 - Background Screening Changes
**Type**: Regulatory Update  
**Status**: Implemented

**Changes**:
- Ohio Medicaid implemented 5-year background screening cycle (previously 3 years)
- Required FBI + BCI fingerprint checks (not just name-based)
- Established break-in-service rules (>90 days requires re-check)

**Impact**: Moderate
- Extended renewal cycle reduced administrative burden
- Fingerprinting increased initial cost but improved accuracy
- Clarified re-screening triggers

**Source**: Ohio Revised Code §5164.34 (amended 2019)

---

### 2017-01-01 - STNA Certification Cycle Extended
**Type**: Regulatory Update  
**Status**: Implemented

**Changes**:
- STNA certification renewal extended from annual to biennial (every 2 years)
- Continuing education requirement established: 12 hours every 2 years
- 24-month paid work requirement maintained (or must re-test)

**Impact**: Low
- Reduced administrative burden for CNAs
- Standardized CE tracking requirements

**Source**: Ohio Administrative Code 3701-18-03 (amended 2017)

---

## Pending Changes (None Currently Known)

_No pending regulatory changes are currently known as of 2025-11-05._

**Check back**: Next scheduled review date is **2026-02-05** (quarterly reviews).

---

## Tracking Future Changes

### When Ohio Regulations Change

1. **Document the change here** in reverse chronological order
2. **Update REQUIREMENTS.md** with new requirements
3. **Update IMPLEMENTATION.md** if code changes needed
4. **Update TEST_SCENARIOS.md** with new test cases
5. **Update validator code** in `packages/core/src/compliance/ohio/`
6. **Update tests** in `packages/core/src/compliance/ohio/__tests__/`
7. **Run full test suite** to ensure no regressions
8. **Create migration guide** if existing data affected
9. **Notify Care Commons users** via email/in-app notification
10. **Submit PR** with all updates and regulatory citations

### Git Commit Message Template

```
Ohio: [Brief description of change]

Regulatory Change:
- [Statute/Rule citation]
- Effective date: [YYYY-MM-DD]
- Transition period: [If applicable]

Changes:
- REQUIREMENTS.md: [What sections updated]
- IMPLEMENTATION.md: [Code changes needed]
- validator.ts: [Validation logic changes]
- tests: [New test scenarios]

Impact: [High/Moderate/Low]
- [Describe impact on existing implementations]
- [Migration path if needed]

References:
- [Link to Ohio Register notice]
- [Link to OAC/ORC section]
- [Industry association guidance]

Reviewed-by: [Compliance Officer Name]
```

### Example Future Change

```markdown
### 2026-03-01 - Background Screening Cycle Shortened (HYPOTHETICAL)

**Type**: Regulatory Update  
**Status**: Proposed (not yet effective)  
**Effective Date**: 2026-03-01  
**Transition Period**: 90 days

**Changes**:
- Background screening renewal cycle shortened from 5 years to 3 years
- Ohio Revised Code §5164.34 amended per House Bill XXXX

**Impact**: Moderate
- Caregivers with checks >3 years old will need re-screening by 2026-05-30
- Estimated 1,200 caregivers in system affected
- Increased administrative cost (~$50/caregiver every 3 years vs. 5 years)

**Implementation Changes**:
- Update `credentialConfig.backgroundScreening.expirationDays` from 1825 to 1095
- Add migration script to calculate new expiration dates
- Send proactive notifications to affected caregivers 60 days before new expiration
- Update `OH_BACKGROUND_EXPIRED` validation to use new threshold

**Files to Update**:
- `packages/core/src/compliance/ohio/validator.ts`
- `docs/compliance/ohio/REQUIREMENTS.md` (§1.1)
- `docs/compliance/ohio/IMPLEMENTATION.md`

**References**:
- House Bill XXXX: [link]
- Ohio Register Vol XX, No Y
- Effective date: March 1, 2026
```

---

## Regulatory Review Checklist

When reviewing for potential changes (quarterly):

- [ ] Check Ohio Department of Medicaid provider updates
- [ ] Review Ohio Register for new/amended rules in OAC 5160
- [ ] Check Sandata provider portal for EVV updates
- [ ] Review Ohio Department of Health nurse aide registry announcements
- [ ] Check Ohio Association for Home Care member alerts
- [ ] Review CMS federal EVV policy updates
- [ ] Search Google Alerts for "Ohio home health" + "regulation change"
- [ ] Document any findings (even if no changes) with review date

**Last Review**: 2025-11-05  
**Reviewed By**: Care Commons Compliance Team  
**Next Review Due**: 2026-02-05  
**Findings**: No pending changes identified

---

## Contact Information

### Ohio Regulatory Authorities

**Ohio Department of Medicaid (ODM)**
- Website: https://medicaid.ohio.gov/
- Provider Hotline: 1-800-686-1518
- Email: ODM_ProviderSupport@medicaid.ohio.gov
- Address: 50 West Town Street, Suite 400, Columbus, OH 43215

**Ohio Department of Health (ODH) - Nurse Aide Registry**
- Website: https://odh.ohio.gov/know-our-programs/nurse-aide-registry
- Phone: 614-752-9500
- Email: nursing@odh.ohio.gov

**Ohio Attorney General - BCI (Background Checks)**
- Website: https://www.ohioattorneygeneral.gov/Business/Services-for-Business/WebCheck
- Phone: 614-466-8204

**Sandata Technologies (EVV Aggregator)**
- Provider Support: 1-800-447-8342
- Website: https://www.sandata.com/
- Portal: https://portal.sandata.com/

### Care Commons Compliance

**Compliance Questions**:
- Email: compliance@carecommons.org
- GitHub Discussions: https://github.com/neighborhood-lab/care-commons/discussions (tag: `compliance`, `ohio`)

**Report Regulatory Changes**:
- GitHub Issues: https://github.com/neighborhood-lab/care-commons/issues/new?labels=compliance,ohio,regulatory-change
- Provide: Citation, effective date, description, impact assessment

---

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
